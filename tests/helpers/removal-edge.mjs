import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { cloudflareEdge } from './cloudflare-edge.mjs';

// The existing version/deployment fake supplies real ownership identities. This
// network edge adds deletion lag and bounded object pages, without mocking the
// remover, its provider client, or its creation-record checks.
export async function removalEdge({accountId, token, names, lag = 2}) {
  const base = await cloudflareEdge({accountId, token, subdomain: 'synthetic-owner', workerHost: {host: 'unused.example.test', name: 'unused'}, app: () => new Response('unused')});
  const database = {name: names.database, uuid: randomUUID()};
  const bucket = {name: names.bucket, creation_date: '2026-11-17T00:00:00.000Z'};
  const queue = {queue_name: names.queue, queue_id: randomUUID().replaceAll('-', '')};
  const objects = new Set(['one', 'two', 'three', 'four', 'five', 'six', 'snapshot/../opaque?key']);
  const foreign = {database: {name: 'synthetic-other-db', uuid: randomUUID()}, bucket: {name: 'synthetic-other-files', creation_date: '2026-11-16T00:00:00.000Z'}, queue: {queue_name: 'synthetic-other-jobs', queue_id: randomUUID().replaceAll('-', '')}, namespace: {id: randomUUID().replaceAll('-', ''), script: 'synthetic-other', class: 'Other'}};
  const databases = new Map([[database.name, database], [foreign.database.name, foreign.database]]);
  const buckets = new Map([[bucket.name, bucket], [foreign.bucket.name, foreign.bucket]]);
  const queues = new Map([[queue.queue_name, queue], [foreign.queue.queue_name, foreign.queue]]);
  const namespaces = new Map([[names.worker, {id: randomUUID().replaceAll('-', ''), script: names.worker, class: 'SnapshotCache'}], [foreign.namespace.script, foreign.namespace]]);
  const pending = new Map(), writes = [], objectPages = [];
  let bucketDeletes = 0, denyBucket = false;
  const ok = (result, extra = {}) => Response.json({success: true, errors: [], result, ...extra});
  const fail = (status, message) => Response.json({success: false, errors: [{code: 10000 + status, message}], result: null}, {status});
  const removeLater = (key, action) => { if (!pending.has(key)) pending.set(key, {left: lag, action}); };
  const settle = key => { const item = pending.get(key); if (item && --item.left <= 0) { item.action(); pending.delete(key); } };
  for (const name of [names.worker, names.publicWorker, 'synthetic-other']) base.upload(name, {vars: {}, secrets: {}, database: database.uuid});
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const prefix = `/__edge/api.cloudflare.com/client/v4/accounts/${accountId}`;
    let answer;
    const path = url.pathname.slice(prefix.length), method = request.method;
    try {
      if (!url.pathname.startsWith(prefix) || request.headers.authorization !== `Bearer ${token}`) answer = fail(403, 'Wrong account or credentials');
      else {
        if (method !== 'GET') writes.push({method, path});
        let match;
        if (path === '/workers/durable_objects/namespaces' && method === 'GET') { settle('namespaces'); answer = ok([...namespaces.values()]); }
        else if ((match = /^\/workers\/scripts\/([^/]+)(\/schedules|\/settings)?$/.exec(path))) {
          const [, name, rest] = match;
          if (rest === '/settings') settle(`worker:${name}`);
          if (!base.workers.has(name)) answer = fail(404, 'Worker does not exist');
          else if (rest === '/schedules') answer = ok({schedules: []});
          else if (!rest && method === 'DELETE') {
            removeLater(`worker:${name}`, () => base.workers.delete(name));
            if (name === names.worker) removeLater('namespaces', () => namespaces.delete(name));
            answer = ok(null);
          }
        }
        if (!answer && path === '/d1/database' && method === 'GET') { settle('d1'); answer = ok([...databases.values()]); }
        else if (!answer && path === `/d1/database/${database.uuid}` && method === 'DELETE') { removeLater('d1', () => databases.delete(database.name)); answer = ok(null); }
        else if (!answer && path === '/queues' && method === 'GET') { settle('queues'); answer = ok([...queues.values()]); }
        else if (!answer && path === `/queues/${queue.queue_id}/consumers` && method === 'GET') answer = ok([]);
        else if (!answer && path === `/queues/${queue.queue_id}` && method === 'DELETE') { removeLater('queues', () => queues.delete(queue.queue_name)); answer = ok(null); }
        else if (!answer && path === '/r2/buckets' && method === 'GET') { settle('r2'); answer = ok({buckets: [...buckets.values()]}); }
        else if (!answer && path === `/r2/buckets/${bucket.name}`) {
          if (!buckets.has(bucket.name)) answer = fail(404, 'Bucket does not exist');
          else if (method === 'GET') answer = ok(buckets.get(bucket.name));
          else if (method === 'DELETE') {
            bucketDeletes++;
            if (denyBucket) answer = fail(403, 'Deletion not permitted');
            else {
              // An empty object listing can precede the provider's delete view.
              if (bucketDeletes === 1) objects.add('late-visible-object');
              if (objects.size) answer = fail(409, 'The bucket is not empty');
              else { removeLater('r2', () => buckets.delete(bucket.name)); answer = ok(null); }
            }
          }
        } else if (!answer && path === `/r2/buckets/${bucket.name}/objects` && method === 'GET') {
          const rows = [...objects].slice(0, 3).map(key => ({key}));
          objectPages.push(rows.map(row => row.key));
          answer = ok(rows, {result_info: {is_truncated: objects.size > rows.length, ...(objects.size > rows.length ? {cursor: 'next'} : {})}});
        } else if (!answer && path.startsWith(`/r2/buckets/${bucket.name}/objects/`) && method === 'DELETE') {
          const key = decodeURIComponent(request.url.split('/objects/')[1]);
          answer = objects.delete(key) ? ok(null) : fail(404, 'Object does not exist');
        }
        if (!answer) answer = await fetch(`${base.origin}${request.url}`, {method, headers: request.headers});
      }
    } catch { answer = fail(500, 'Fake removal edge failure'); }
    response.writeHead(answer.status, Object.fromEntries(answer.headers));
    response.end(Buffer.from(await answer.arrayBuffer()));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {origin: `http://127.0.0.1:${server.address().port}`, base, database, bucket, queue, foreign, databases, buckets, queues, namespaces, objects, writes, objectPages,
    get bucketDeletes() { return bucketDeletes; },
    set denyBucket(value) { denyBucket = value; },
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await base.close(); },
  };
}
