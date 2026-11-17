import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unstable_readConfig } from 'wrangler';
import { deploymentConfig, renderWranglerToml, resourceNames } from '../../scripts/ops-config.mjs';
import { withPublicWorkerConfig } from '../../scripts/native-public-worker.mjs';
import { cloudflareEdge } from '../helpers/cloudflare-edge.mjs';
import { awaitPageHostSnapshot } from '../../scripts/page-host-readiness.mjs';

// The network edge is the only fake: fetch answers, and time does not pass.
const host = 'status.example.test';
const dnsFailure = code => Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(`getaddrinfo ${code} ${host}`), { code }) });
const retained = () => new Response('{}', { headers: { 'X-Lamp-Snapshot-Retained': 'true' } });
const answering = (status = 200) => () => new Response('{}', { status });
function seam(answers) {
  const lines = [], delays = [], calls = [];
  let clock = 0;
  return {
    lines, delays, calls,
    options: {
      fetchImpl: async url => { calls.push(url); const answer = answers.length > 1 ? answers.shift() : answers[0]; if (answer instanceof Error) throw answer; return answer(); },
      sleep: async ms => { delays.push(ms); clock += ms; },
      now: () => clock,
      log: line => lines.push(line),
    },
  };
}

test('Deploy retries a page host whose DNS answer is not there yet and completes once it serves', async () => {
  const run = seam([dnsFailure('EAI_AGAIN'), dnsFailure('ENOTFOUND'), retained]);
  assert.deepEqual(await awaitPageHostSnapshot(host, run.options), { state: 'retained' });
  assert.equal(run.calls.length, 3);
  assert.ok(run.delays[1] > run.delays[0], 'the wait grows between DNS failures');
});

test('Deploy completes with a detached page host and says it skipped the check', async () => {
  const run = seam([dnsFailure('ENOTFOUND')]);
  assert.deepEqual(await awaitPageHostSnapshot(host, run.options), { state: 'detached' });
  assert.equal(run.lines.length, 1);
  assert.match(run.lines[0], /^Page host detached: skipped\./);
  assert.ok(run.lines[0].includes(host) && run.lines[0].includes('ENOTFOUND'));
});

test('Deploy fails naming the host and the DNS code when the resolver never answers', async () => {
  const run = seam([dnsFailure('EAI_AGAIN')]);
  await assert.rejects(awaitPageHostSnapshot(host, run.options), error => error.message.includes(host) && error.message.includes('EAI_AGAIN'));
  assert.deepEqual(run.lines, []);
});

test('Deploy still fails when the page host answers but is not serving the retained snapshot', async () => {
  const run = seam([answering(503)]);
  await assert.rejects(awaitPageHostSnapshot(host, run.options), error => error.message.includes(host) && error.message.includes('HTTP 503') && /unverified/.test(error.message));
  assert.deepEqual(run.lines, []);
  const unretained = seam([answering(200)]);
  await assert.rejects(awaitPageHostSnapshot(host, unretained.options), /unverified/);
});

test('A page host behind a Cloudflare for SaaS route is checked once its DNS reaches the target, skipped until then, and still fails when the resolver never answers', async () => {
  const target = 'domains.provider.test';
  const dns = answers => async name => { const answer = answers[name]; if (answer instanceof Error) throw answer; return answer; };
  const pointed = { [host]: { chain: [target], addresses: [] } };
  const run = seam([retained]);
  assert.deepEqual(await awaitPageHostSnapshot(host, { ...run.options, target, resolve: dns(pointed) }), { state: 'retained' });
  assert.equal(run.calls.length, 1);
  const flattened = seam([retained]);
  assert.deepEqual(await awaitPageHostSnapshot(host, { ...flattened.options, target, resolve: dns({ [host]: { chain: [], addresses: ['2001:db8::1', '192.0.2.7'] }, [target]: { chain: [], addresses: ['2001:db8::1', '192.0.2.7'] } }) }), { state: 'retained' });
  for (const elsewhere of [{ [host]: { chain: ['old.example.net'], addresses: ['192.0.2.10'] }, [target]: { chain: [], addresses: ['192.0.2.7'] } }, { [host]: dnsFailure('ENOTFOUND') }]) {
    const waiting = seam([retained]);
    assert.deepEqual(await awaitPageHostSnapshot(host, { ...waiting.options, target, resolve: dns(elsewhere) }), { state: 'not-pointed' });
    assert.deepEqual(waiting.lines, [`Page host ${host} does not point at ${target} yet: skipped.`]);
    assert.equal(waiting.calls.length, 0, 'a page host that is not pointed yet is never fetched');
  }
  const failing = seam([retained]);
  await assert.rejects(awaitPageHostSnapshot(host, { ...failing.options, target, resolve: dns({ [host]: dnsFailure('EAI_AGAIN') }) }), error => error.message.includes(host) && error.message.includes('EAI_AGAIN'));
  assert.equal(failing.calls.length, 0);
});

// Exercise native setup's real input-file and configuration door. Provider
// responses are the only fake; every other outgoing request is refused.
const root = process.cwd();
const hex = () => randomBytes(32).toString('hex');
const inputs = () => ({
  LAMP_HOSTING: 'workers-dev',
  LAMP_APP_HOST: 'lamp-production.synthetic-owner.workers.dev',
  LAMP_PAGE_HOST: 'lamp-production-page.synthetic-owner.workers.dev',
  LAMP_PAGE_NAME: 'Synthetic service status', LAMP_PAGE_TAGLINE: 'Service updates',
  LAMP_PAGE_TIMEZONE: 'UTC', LAMP_ACCENT_COLOR: '#16794C',
  SETUP_OPERATOR_EMAIL: 'owner@example.test', MAIL_PROVIDER: 'rer',
  MAIL_FROM: 'status@example.test', MAIL_RELAY_URL: 'https://relay.example.test/send', MAIL_API_KEY: `synthetic-${hex()}`,
  SETUP_TOKEN: hex(), SESSION_SECRET: hex(), SUBSCRIBER_TOKEN_SECRET: hex(), WEBHOOK_SIGNING_SECRET: hex(), INSTALLATION_KEY: hex(),
});
async function nativeSetup(directory, env, { dryRun = true, edge } = {}) {
  const file = join(directory, 'inputs.env');
  await writeFile(file, Object.entries(env).map(([key, value]) => `${key}=${value}\n`).join(''), { mode: 0o600 });
  const child = spawn(process.execPath, [join(root, 'scripts/setup.mjs'), '--env-file', file, ...(dryRun ? ['--dry-run'] : [])], {
    cwd: directory, timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(CLOUDFLARE_|MAIL_|LAMP_|RER_|NODE_OPTIONS$)/.test(name))),
      NODE_OPTIONS: `--import=${new URL('../helpers/cloudflare-edge-preload.mjs', import.meta.url).href}`,
      LAMP_FAKE_EDGE: edge?.origin ?? 'http://127.0.0.1:1', LAMP_FAKE_EDGE_HOSTS: 'api.cloudflare.com' },
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  return { code: await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); }), output };
}

test('Native deployment keeps default resources and selects only the explicitly named public Worker and host', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lamp-page-worker-'));
  try {
    const baseline = inputs();
    const standard = await nativeSetup(directory, baseline);
    assert.equal(standard.code, 0, standard.output);
    const defaults = JSON.parse(standard.output);
    assert.deepEqual(defaults.resources, { worker: 'lamp-production', publicWorker: 'lamp-production-page', database: 'lamp-production-db', bucket: 'lamp-production-files', queue: 'lamp-production-jobs' });
    const prefix = `synthetic-app-${randomBytes(3).toString('hex')}`;
    const pageWorker = `synthetic-page-${randomBytes(3).toString('hex')}`;
    for (const resourcePrefix of [undefined, prefix]) {
      const original = resourceNames('production', resourcePrefix);
      const selected = { ...baseline, ...(resourcePrefix ? { LAMP_RESOURCE_PREFIX: resourcePrefix } : {}),
        LAMP_PAGE_WORKER: pageWorker, LAMP_APP_HOST: `${original.worker}.synthetic-owner.workers.dev`, LAMP_PAGE_HOST: `${pageWorker}.synthetic-owner.workers.dev` };
      const run = await nativeSetup(directory, selected);
      assert.equal(run.code, 0, run.output);
      const planned = JSON.parse(run.output);
      assert.deepEqual(planned.resources, { ...original, publicWorker: pageWorker });
      assert.equal(planned.appHost, selected.LAMP_APP_HOST);
      assert.equal(planned.pageHost, selected.LAMP_PAGE_HOST);
      const toml = join(directory, 'wrangler.toml');
      await writeFile(toml, renderWranglerToml(deploymentConfig(selected), { ...planned.resources, databaseId: '00000000-0000-0000-0000-000000000000' }));
      const app = unstable_readConfig({ config: toml });
      assert.equal(app.name, original.worker);
      assert.equal(app.vars.AUTH_ORIGIN, `https://${planned.appHost}`);
      assert.ok(app.queues.consumers.length && app.triggers.crons.length);
      const built = join(directory, 'wrangler.json');
      await writeFile(built, JSON.stringify(app));
      await withPublicWorkerConfig(built, planned.resources, async path => {
        const page = JSON.parse(await readFile(path, 'utf8'));
        assert.equal(page.name, pageWorker);
        assert.equal(page.vars.LAMP_PAGE_HOST, planned.pageHost);
        assert.equal(page.vars.LAMP_APP_HOST, planned.appHost);
        assert.deepEqual(page.d1_databases, app.d1_databases);
        assert.deepEqual(page.r2_buckets, app.r2_buckets);
        assert.deepEqual(page.queues.producers, app.queues.producers);
        assert.equal(page.queues.consumers, undefined);
        assert.equal(page.triggers, undefined);
        assert.equal(page.migrations, undefined);
        assert.ok(page.durable_objects.bindings.every(binding => binding.script_name === app.name));
      });
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('Native setup refuses invalid, colliding and mismatched public Worker selections before provider mutation', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lamp-page-worker-refused-'));
  const credentials = { CLOUDFLARE_ACCOUNT_ID: randomBytes(16).toString('hex'), CLOUDFLARE_API_TOKEN: `synthetic-${hex()}` };
  const edge = await cloudflareEdge({ accountId: credentials.CLOUDFLARE_ACCOUNT_ID, token: credentials.CLOUDFLARE_API_TOKEN, subdomain: 'synthetic-owner', workerHost: { host: 'unused.example.test', name: 'unused' }, app: () => new Response('unused') });
  const requests = [];
  const proxy = createServer(async (request, response) => {
    requests.push({ url: request.url, method: request.method });
    const reply = request.method === 'GET' ? await fetch(`${edge.origin}${request.url}`, { headers: request.headers }) : new Response('Unexpected provider write', { status: 500 });
    response.writeHead(reply.status, Object.fromEntries(reply.headers));
    response.end(Buffer.from(await reply.arrayBuffer()));
  });
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
  const provider = { origin: `http://127.0.0.1:${proxy.address().port}` };
  try {
    const baseline = { ...inputs(), ...credentials };
    for (const patch of [
      ...['UPPER', 'bad_name', '-leading', 'trailing-', 'a'.repeat(64), 'https://page.example.test', 'lamp-production'].map(LAMP_PAGE_WORKER => ({ LAMP_PAGE_WORKER })),
      { LAMP_PAGE_WORKER: 'synthetic-page', LAMP_PAGE_HOST: 'other.synthetic-owner.workers.dev' },
      { LAMP_PAGE_WORKER: 'synthetic-page', LAMP_PAGE_HOST: 'synthetic-page.other-account.workers.dev' },
      { LAMP_PAGE_WORKER: 'synthetic-page', LAMP_HOSTING: 'custom-domain', LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'status.example.test' },
    ]) {
      const run = await nativeSetup(directory, { ...baseline, ...patch }, { dryRun: false, edge: provider });
      assert.notEqual(run.code, 0, run.output);
      assert.match(run.output, /LAMP_PAGE_WORKER|workers-dev hosts/);
    }
    assert.deepEqual(requests, [], 'malformed or colliding local names never reach the provider');
    const pageWorker = 'synthetic-existing-page';
    edge.upload(pageWorker, { vars: {}, secrets: {}, database: 'synthetic-database' });
    const occupied = await nativeSetup(directory, { ...baseline, LAMP_PAGE_WORKER: pageWorker, LAMP_PAGE_HOST: `${pageWorker}.synthetic-owner.workers.dev` }, { dryRun: false, edge: provider });
    assert.notEqual(occupied.code, 0, occupied.output);
    assert.match(occupied.output, /Refusing unrecorded or replaced Worker synthetic-existing-page/);
    assert.ok(requests.length, 'the occupied name was checked at the provider edge');
    assert.ok(requests.every(request => request.method === 'GET'), 'an occupied public Worker is refused before resource creation or any upload');
    const records = join(directory, '.rer/deploy');
    await mkdir(records, { recursive: true });
    const record = { version: 1, kind: 'rer-deploy-owner-state', accountId: credentials.CLOUDFLARE_ACCOUNT_ID, project: 'just-every/lamp', environment: 'production', worker: pageWorker,
      owned: { d1: {}, r2: {}, kv: {}, queues: {}, worker: { status: 'created' } }, receipt: null };
    // Base's creation record is the authority for the already selected name.
    await writeFile(join(records, 'production.page.json'), JSON.stringify(record));
    const renamed = await nativeSetup(directory, { ...baseline, LAMP_PAGE_WORKER: 'synthetic-other-page', LAMP_PAGE_HOST: 'synthetic-other-page.synthetic-owner.workers.dev' }, { dryRun: false, edge: provider });
    assert.notEqual(renamed.code, 0, renamed.output);
    assert.match(renamed.output, /owner-state-target-mismatch/);
    assert.ok(requests.every(request => request.method === 'GET'), 'a new selection cannot replace an existing recorded public Worker');
  } finally { proxy.closeAllConnections(); await new Promise(resolve => proxy.close(resolve)); await edge.close(); await rm(directory, { recursive: true, force: true }); }
});

// Native teardown is a public process door; only Cloudflare's network edge is
// replaced. Each run gets its own real deployment and creation records.
async function removalFixture() {
  const { removalEdge } = await import('../helpers/removal-edge.mjs');
  const directory = await mkdtemp(join(tmpdir(), 'lamp-removal-'));
  const environment = 'synthetic-removal';
  const names = resourceNames(environment);
  const accountId = randomBytes(16).toString('hex'), token = `synthetic-lamp-${hex()}`;
  const edge = await removalEdge({accountId, token, names});
  const paths = {record: join(directory, '.seed/deployment', `${environment}.json`), app: join(directory, '.rer/deploy', `${environment}.json`), page: join(directory, '.rer/deploy', `${environment}.page.json`)};
  const envFile = join(directory, 'inputs.env');
  await writeFile(envFile, `CLOUDFLARE_ACCOUNT_ID=${accountId}\nCLOUDFLARE_API_TOKEN=${token}\n`, {mode: 0o600});
  for (const path of [join(directory, '.seed/deployment'), join(directory, '.rer/deploy')]) await mkdir(path, {recursive: true});
  await writeFile(paths.record, JSON.stringify({accountId, resources: names, appHost: `${names.worker}.synthetic-owner.workers.dev`, pageHost: `${names.publicWorker}.synthetic-owner.workers.dev`}));
  for (const [page, path] of [[false, paths.app], [true, paths.page]]) {
    const worker = page ? names.publicWorker : names.worker;
    const live = edge.base.live(worker), deployment = edge.base.workers.get(worker).deployments[0];
    const owned = {worker: {status: 'created'}, d1: {}, r2: {}, kv: {}, queues: {}};
    if (!page) {
      owned.d1[names.database] = {status: 'created', id: edge.database.uuid};
      owned.r2[names.bucket] = {status: 'created', id: edge.bucket.creation_date};
      owned.queues[names.queue] = {status: 'created', id: edge.queue.queue_id};
    }
    await writeFile(path, JSON.stringify({version: 1, kind: 'rer-deploy-owner-state', accountId, project: 'just-every/lamp', environment, worker, owned,
      receipt: {provider: {versionId: live.id, deploymentId: deployment.id, etag: live.etag}}}));
  }
  const run = async (confirm = true) => {
    const child = spawn(process.execPath, [join(root, 'scripts/remove-deployment.mjs'), '--environment', environment, '--env-file', envFile, ...(confirm ? ['--yes'] : [])], {
      cwd: directory, timeout: 45000, stdio: ['ignore', 'pipe', 'pipe'],
      env: {...Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(CLOUDFLARE_|LAMP_|RER_|NODE_OPTIONS$)/.test(name))),
        NODE_OPTIONS: `--import=${new URL('../helpers/cloudflare-removal-preload.mjs', import.meta.url).href}`, LAMP_FAKE_EDGE: edge.origin, LAMP_FAKE_EDGE_HOSTS: 'api.cloudflare.com'},
    });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    return {code: await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); }), output};
  };
  return {edge, paths, names, run, async close() { await edge.close(); await rm(directory, {recursive: true, force: true}); }};
}

test('Native removal settles deletion lag, drains multiple object batches and resumes a half-removed installation in one invocation', async () => {
  for (const halfRemoved of [false, true]) {
    const fixture = await removalFixture();
    const {edge, paths, names} = fixture;
    try {
      if (halfRemoved) {
        edge.base.workers.delete(names.publicWorker);
        edge.base.workers.delete(names.worker);
        edge.namespaces.delete(names.worker);
        edge.databases.delete(names.database);
        edge.queues.delete(names.queue);
        // The first target's state can already have been retired.
        await rm(paths.page);
      }
      const result = await fixture.run();
      assert.equal(result.code, 0, result.output);
      assert.match(result.output, /read back: none remains\./);
      assert.ok(edge.objectPages.filter(rows => rows.length).length > 2, 'several object batches are needed');
      assert.ok(edge.bucketDeletes > 1, 'a not-empty bucket delete is retried inside the same run');
      assert.equal(edge.objects.size, 0);
      assert.deepEqual([...edge.base.workers.keys()], ['synthetic-other']);
      assert.deepEqual([...edge.databases.values()], [edge.foreign.database]);
      assert.deepEqual([...edge.buckets.values()], [edge.foreign.bucket]);
      assert.deepEqual([...edge.queues.values()], [edge.foreign.queue]);
      assert.deepEqual([...edge.namespaces.values()], [edge.foreign.namespace]);
      for (const path of Object.values(paths)) await assert.rejects(readFile(path), {code: 'ENOENT'});
    } finally { await fixture.close(); }
  }
});

test('Native removal requires confirmation and refuses replaced identities before writes', async () => {
  const fixture = await removalFixture();
  const {edge, paths, names} = fixture;
  try {
    const unconfirmed = await fixture.run(false);
    assert.notEqual(unconfirmed.code, 0);
    assert.deepEqual(edge.writes, []);
    const original = await readFile(paths.app, 'utf8');
    const replaced = JSON.parse(original);
    replaced.owned.r2[names.bucket].id = '2026-11-16T00:00:00.000Z';
    await writeFile(paths.app, JSON.stringify(replaced));
    // The public target must also pass its original identity check.
    const page = JSON.parse(await readFile(paths.page, 'utf8'));
    page.receipt.provider.etag = 'synthetic-replaced';
    const pageOriginal = await readFile(paths.page, 'utf8');
    await writeFile(paths.page, JSON.stringify(page));
    const wrongWorker = await fixture.run();
    assert.notEqual(wrongWorker.code, 0);
    assert.match(wrongWorker.output, /owned-resource-replaced/);
    assert.deepEqual(edge.writes, []);
    // Skip the already absent public target to prove bucket identity preflight.
    await writeFile(paths.page, pageOriginal);
    edge.base.workers.delete(names.publicWorker);
    const wrongBucket = await fixture.run();
    assert.notEqual(wrongBucket.code, 0);
    assert.match(wrongBucket.output, /owned-resource-replaced/);
    assert.deepEqual(edge.writes, []);
  } finally { await fixture.close(); }
});

test('Native removal retains resumable records after provider refusal', async () => {
  const fixture = await removalFixture();
  const {edge, paths, names} = fixture;
  try {
    edge.denyBucket = true;
    const refused = await fixture.run();
    assert.notEqual(refused.code, 0);
    assert.match(refused.output, /remove-incomplete/);
    assert.ok(refused.output.includes(names.bucket));
    assert.match(refused.output, /same command again resumes/);
    assert.ok(await readFile(paths.app));
    assert.ok(await readFile(paths.record));
    edge.denyBucket = false;
    const resumed = await fixture.run();
    assert.equal(resumed.code, 0, resumed.output);
    assert.match(resumed.output, /none remains/);
    assert.deepEqual([...edge.buckets.values()], [edge.foreign.bucket]);
  } finally { await fixture.close(); }
});
