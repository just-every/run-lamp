import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';

// The Cloudflare surface a deployed Lamp's key rotation crosses, served over HTTP so `rer deploy` runs unmodified
// in its own process (cloudflare-edge-preload.mjs routes its requests here): the workers.dev subdomain; one
// Worker's versions, deployments, settings, content and secrets, where a version upload with
// bindings_inherit=strict holds exactly its listed bindings and a secret DELETE deploys a version of its own;
// D1 creation and the D1 query API over a real Lamp D1; R2 bucket and Queue creation; and the Worker's own host, answered by `app` with the
// live version. Request bodies carry secret values and are never kept.
const envelope = (status, result, errors = []) => Response.json({ success: !errors.length, errors, messages: [], result }, { status });
const ok = result => envelope(200, result);
const fail = (status, message) => envelope(status, null, [{ code: 10000 + status, message }]);
const shown = ({ text, ...binding }) => binding.type === 'secret_text' ? binding : binding.type === 'plain_text' ? { ...binding, text } : binding;

/** HTTPS requests to `hosts` go to the edge; loopback passes; anything else is refused, so nothing leaves the machine. */
export function edgeFetch({ edge, hosts, fetch: send = globalThis.fetch }) {
  return (input, init) => {
    const url = new URL(String(input));
    if (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return send(input, init);
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname)) return Promise.reject(new TypeError(`fetch failed: ${url.hostname} is outside the fake Cloudflare edge`));
    return send(`${edge}/__edge/${url.hostname}${url.pathname}${url.search}`, init);
  };
}

export async function cloudflareEdge({ accountId, token, subdomain, d1, workerHost, app }) {
  const workers = new Map(), databases = new Map(), buckets = new Map(), queues = new Map();
  const live = name => {
    const worker = workers.get(name), id = worker?.deployments[0].versions[0].version_id;
    return worker?.versions.find(version => version.id === id);
  };
  const addVersion = (worker, { bindings, modules, entry, runtime, annotations }) => {
    const etag = createHash('sha256').update(JSON.stringify([...modules].map(([name, part]) => [name, part.type, Buffer.from(part.bytes).toString('base64')]))).digest('hex');
    const version = { id: randomUUID(), number: worker.versions.length + 1, bindings, modules, entry, runtime, annotations, etag, created: new Date().toISOString() };
    worker.versions.unshift(version);
    return version;
  };
  const deploy = (worker, versionId) => {
    const deployment = { id: randomUUID(), source: 'api', strategy: 'percentage', versions: [{ version_id: versionId, percentage: 100 }] };
    worker.deployments.unshift(deployment);
    return deployment;
  };
  const versionView = version => ({ id: version.id, number: version.number, annotations: version.annotations,
    resources: { script: { etag: version.etag, handlers: ['fetch', 'queue', 'scheduled'] }, script_runtime: version.runtime, bindings: version.bindings.map(shown) } });

  async function api(request, path, url) {
    if (request.headers.get('authorization') !== `Bearer ${token}`) return fail(403, 'Authentication error');
    const method = request.method;
    let match;
    if (method === 'GET' && path === '/workers/subdomain') return ok({ subdomain });
    if ((match = /^\/workers\/scripts\/([a-z0-9-]+)(\/.*)?$/.exec(path))) {
      const [, name, rest = ''] = match, worker = workers.get(name), current = live(name);
      if (!current) return fail(404, 'This Worker does not exist on your account.');
      if (method === 'GET' && rest === '/settings') return ok({ bindings: current.bindings.map(shown), compatibility_date: current.runtime.compatibility_date, compatibility_flags: current.runtime.compatibility_flags });
      if (method === 'GET' && rest === '/deployments') return ok({ deployments: worker.deployments });
      if (method === 'POST' && rest === '/deployments') {
        const { versions } = await request.json();
        if (versions?.length !== 1 || versions[0].percentage !== 100 || !worker.versions.some(version => version.id === versions[0].version_id)) return fail(400, 'Invalid deployment.');
        return ok(deploy(worker, versions[0].version_id));
      }
      if (method === 'GET' && rest === '/versions') return ok({ items: worker.versions.map(({ id, number, annotations }) => ({ id, number, annotations })) });
      if (method === 'GET' && (match = /^\/versions\/([0-9a-f-]{36})$/.exec(rest))) {
        const version = worker.versions.find(item => item.id === match[1]);
        return version ? ok(versionView(version)) : fail(404, 'Version not found.');
      }
      if (method === 'POST' && rest === '/versions' && url.searchParams.get('bindings_inherit') === 'strict') {
        const form = await request.formData(), metadata = JSON.parse(await form.get('metadata').text()), bindings = [];
        for (const binding of metadata.bindings) {
          const inherited = binding.type === 'inherit' ? current.bindings.find(item => item.name === binding.name) : binding;
          if (!inherited) return fail(400, `Binding ${binding.name} cannot be inherited.`);
          bindings.push(inherited);
        }
        const modules = new Map();
        for (const [field, part] of form) if (field !== 'metadata') modules.set(field, { type: part.type, bytes: new Uint8Array(await part.arrayBuffer()) });
        const version = addVersion(worker, { bindings, modules, entry: metadata.main_module, annotations: metadata.annotations ?? {},
          runtime: { compatibility_date: metadata.compatibility_date, compatibility_flags: metadata.compatibility_flags ?? [] } });
        return ok({ id: version.id, number: version.number });
      }
      if (method === 'GET' && rest === '/content/v2') {
        const version = worker.versions.find(item => item.id === url.searchParams.get('version'));
        if (!version) return fail(404, 'Version not found.');
        const form = new FormData();
        for (const [field, part] of version.modules) form.set(field, new Blob([part.bytes], { type: part.type }), field);
        const body = new Response(form);
        return new Response(await body.arrayBuffer(), { headers: { 'content-type': body.headers.get('content-type'), 'cf-entrypoint': version.entry } });
      }
      if (method === 'GET' && rest === '/secrets') return ok(current.bindings.filter(binding => binding.type === 'secret_text').map(({ name, type }) => ({ name, type })));
      if (method === 'DELETE' && (match = /^\/secrets\/([A-Za-z_][A-Za-z0-9_]*)$/.exec(rest))) {
        if (!current.bindings.some(binding => binding.type === 'secret_text' && binding.name === match[1])) return fail(404, 'Secret not found.');
        deploy(worker, addVersion(worker, { ...current, bindings: current.bindings.filter(binding => binding.name !== match[1]), annotations: { 'workers/triggered_by': 'secret' } }).id);
        return ok(null);
      }
      return fail(404, `Unhandled Worker call ${method} ${rest}`);
    }
    if (path === '/d1/database' && method === 'GET') return ok([...databases.values()]);
    if (path === '/d1/database' && method === 'POST') {
      const database = { uuid: randomUUID(), name: (await request.json()).name };
      databases.set(database.uuid, database);
      return ok(database);
    }
    if ((match = /^\/r2\/buckets\/([a-z0-9-]+)$/.exec(path)) && method === 'GET') return buckets.has(match[1]) ? ok(buckets.get(match[1])) : fail(404, 'The specified bucket does not exist.');
    if (path === '/r2/buckets' && method === 'POST') {
      const bucket = { name: (await request.json()).name, creation_date: new Date().toISOString() };
      buckets.set(bucket.name, bucket);
      return ok(bucket);
    }
    if (path === '/queues' && method === 'GET') return ok([...queues.values()]);
    if (path === '/queues' && method === 'POST') {
      const queue = { queue_id: randomUUID().replaceAll('-', ''), queue_name: (await request.json()).queue_name };
      queues.set(queue.queue_name, queue);
      return ok(queue);
    }
    if ((match = /^\/d1\/database\/([0-9a-f-]{36})(\/query)?$/.exec(path)) && databases.has(match[1])) {
      if (!match[2] && method === 'GET') return ok(databases.get(match[1]));
      if (match[2] && method === 'POST') {
        const body = await request.json(), statement = ({ sql, params = [] }) => d1.prepare(sql).bind(...params);
        const result = ({ results = [], meta = {} }) => ({ results, success: true, meta });
        return ok(Array.isArray(body.batch) ? (await d1.batch(body.batch.map(statement))).map(result) : [result(await statement(body).all())]);
      }
    }
    return fail(404, `Unhandled call ${method} ${path}`);
  }

  async function handle(request) {
    const url = new URL(request.url), prefix = `/client/v4/accounts/${accountId}/`;
    if (url.hostname === 'api.cloudflare.com') return url.pathname.startsWith(prefix) ? api(request, url.pathname.slice(prefix.length - 1), url) : fail(403, 'Unknown account.');
    const version = url.hostname === workerHost.host && live(workerHost.name);
    return version ? app(version, request) : new Response('error code: 1042', { status: 404 });
  }

  const server = createServer(async (incoming, outgoing) => {
    const [, , host, ...rest] = incoming.url.split('/');
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(name)) headers.set(name, String(value));
    headers.set('host', host);
    const request = new Request(`https://${host}/${rest.join('/')}`, { method: incoming.method, headers, ...(['GET', 'HEAD'].includes(incoming.method) ? {} : { body: Buffer.concat(chunks) }) });
    let response;
    try { response = await handle(request); } catch (error) { response = fail(500, `fake edge: ${error.message}`); }
    const body = Buffer.from(await response.arrayBuffer());
    outgoing.writeHead(response.status, { ...Object.fromEntries([...response.headers].filter(([name]) => !['content-length', 'content-encoding'].includes(name))), 'content-length': body.length });
    outgoing.end(body);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    origin: `http://127.0.0.1:${server.address().port}`, live, workers,
    /** What a `wrangler deploy` of a build makes: a version with these vars, secrets and D1, deployed at 100%. */
    upload(name, { vars, secrets, database }) {
      if (!workers.has(name)) workers.set(name, { versions: [], deployments: [] });
      const worker = workers.get(name);
      const bindings = [...Object.entries(vars).map(([key, text]) => ({ type: 'plain_text', name: key, text })), { type: 'd1', name: 'DB', id: database }, { type: 'version_metadata', name: 'RER_VERSION' },
        ...Object.entries(secrets).map(([key, text]) => ({ type: 'secret_text', name: key, text }))];
      const modules = new Map([['index.js', { type: 'application/javascript+module', bytes: new TextEncoder().encode('export default { fetch() { return new Response("Lamp"); } };\n') }]]);
      deploy(worker, addVersion(worker, { bindings, modules, entry: 'index.js', annotations: { 'workers/triggered_by': 'upload' },
        runtime: { compatibility_date: '2026-09-08', compatibility_flags: ['nodejs_compat', 'global_fetch_strictly_public'] } }).id);
    },
    close: () => new Promise(resolve => { server.closeAllConnections(); server.close(() => resolve()); }),
  };
}
