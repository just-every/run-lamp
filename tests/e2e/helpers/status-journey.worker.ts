import worker from './follow-ups-worker';
import { lampServerExtensions } from '../../../src/ext/index.server';
import type { AppBindings } from '../../../src/core/app/types';
export { SnapshotCache } from '../../../src/core/platform/blobs/snapshot-cache';
// The published size meter obtains raw rows through all() to retain D1's
// rows_read metadata. Exercise that named-column boundary on scheduled builds.
function namedRowBindings(env: Parameters<typeof worker.fetch>[1]) {
  if ((env as unknown as Record<string, string>).LAMP_TEST_NAMED_ROWS !== "true") return env;
  const statement = (target: D1PreparedStatement): D1PreparedStatement => new Proxy(target, {
    get(target, key) {
      if (key === "bind") return (...values: unknown[]) => statement(target.bind(...values));
      if (key === "raw") return async () => (await target.all()).results.map(row => Object.values(row));
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const DB = new Proxy(env.DB, { get(target, key) {
    if (key === "prepare") return (query: string) => statement(target.prepare(query));
    const value = Reflect.get(target, key);
    return typeof value === "function" ? value.bind(target) : value;
  } });
  return { ...env, DB };
}

let paused = false;
const executionBindings = (env: Parameters<typeof worker.fetch>[1]) => paused ? { ...env, EFFECTS_PAUSED: '1' } : env;

// Request-local provider observations let the retained-read journey prove that
// public reads ignore an unavailable D1 and anonymous reads never open R2.
async function observeAudienceReads(request: Request, env: AppBindings, context: ExecutionContext) {
  let databaseReads = 0;
  let objectReads = 0;
  const databaseDown = request.headers.get('X-Test-D1-Unavailable') === '1';
  const DB = new Proxy(env.DB, { get(target, key) {
    const value = Reflect.get(target, key);
    if (typeof value !== 'function') return value;
    return (...args: unknown[]) => {
      databaseReads++;
      if (databaseDown) throw new Error('Test-injected D1 unavailable');
      return Reflect.apply(value, target, args);
    };
  } });
  const SNAPSHOTS = new Proxy(env.SNAPSHOTS, { get(target, key) {
    const value = Reflect.get(target, key);
    if (typeof value !== 'function') return value;
    return (...args: unknown[]) => {
      if (key === 'get' || key === 'head' || key === 'list') objectReads++;
      return Reflect.apply(value, target, args);
    };
  } });
  let bindings = { ...env, DB, SNAPSHOTS };
  const edge = request.headers.get('X-Test-Cloudflare-Edge');
  if (edge) {
    // Supply hosting metadata at the simulated Cloudflare ingress only.
    const url = new URL(request.url);
    url.protocol = 'https:';
    const headers = new Headers(request.headers);
    const address = headers.get('X-Test-Cloudflare-Address');
    headers.delete('X-Test-Cloudflare-Edge');
    headers.delete('X-Test-Cloudflare-Address');
    headers.delete('CF-Connecting-IP');
    if (address) headers.set('CF-Connecting-IP', address);
    request = new Request(url, { method: request.method, headers, cf: edge === '1' ? { colo: 'DFW' } : {} });
    bindings = { ...bindings, AUTH_LOCAL: undefined, LAMP_LOCAL_ORIGIN: undefined, AUTH_ORIGIN: url.origin };
  }
  const response = await worker.fetch(request, bindings, context);
  const observed = new Response(response.body, response);
  observed.headers.set('X-Test-D1-Reads', String(databaseReads));
  observed.headers.set('X-Test-R2-Reads', String(objectReads));
  return observed;
}

export default {
  ...worker,
  queue(batch: Parameters<typeof worker.queue>[0], env: Parameters<typeof worker.queue>[1]) {
    return worker.queue(batch, executionBindings(env));
  },
  scheduled(controller: ScheduledController, env: Parameters<typeof worker.fetch>[1], context: ExecutionContext) {
    return worker.scheduled(controller, namedRowBindings(executionBindings(env)), context);
  },
  async fetch(request: Request, env: Parameters<typeof worker.fetch>[1], context: ExecutionContext) {
    const url = new URL(request.url);
    if (url.hostname === env.LAMP_APP_HOST && url.pathname === '/test/effects' && request.method === 'PUT') {
      paused = (await request.json<{ paused: boolean }>()).paused;
      return new Response(null, { status: 204 });
    }
    Object.assign(lampServerExtensions.policies, {
      'update.review.v1': { requiresReview: () => (env as unknown as Record<string, string>).LAMP_TEST_REQUIRE_REVIEW === 'true' },
    });
    const bindings = executionBindings(env);
    if ((env as unknown as Record<string, string>).LAMP_TEST_AUDIENCE_READS === 'true') {
      return observeAudienceReads(request, bindings, context);
    }
    return worker.fetch(request, bindings, context);
  },
};
