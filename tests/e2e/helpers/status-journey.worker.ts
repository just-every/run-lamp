import worker from './follow-ups-worker';
import { AsyncLocalStorage } from 'node:async_hooks';
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
let heldSelector: string | null = null;
// Local workerd never cancels a request whose client has gone; Cloudflare does, and nothing the request
// awaits resumes. A journey models that at its own network edge: every selector write first asks the
// edge, naming the entry point that runs it, and the journey leaves a hung-up request's ask unanswered.
function cancellable(env: Parameters<typeof worker.fetch>[1], entry: 'request' | 'background') {
  const edge = (env as unknown as Record<string, string>).LAMP_TEST_CANCEL_EDGE;
  if (!edge) return env;
  const SNAPSHOTS = new Proxy(env.SNAPSHOTS, { get(target, key) {
    const value = Reflect.get(target, key);
    if (typeof value !== 'function') return value;
    return async (...args: unknown[]) => {
      if (key === 'put' && args[0] === 'snapshots/current.json') await fetch(`${edge}?entry=${entry}`);
      return Reflect.apply(value, target, args);
    };
  } });
  return { ...env, SNAPSHOTS };
}
const executionBindings = (env: Parameters<typeof worker.fetch>[1], entry: 'request' | 'background' = 'background') => cancellable(paused ? { ...env, EFFECTS_PAUSED: '1' } : env, entry);

// Request-local provider observations let the retained-read journey prove that
// public reads ignore an unavailable D1 and anonymous reads never open R2.
const d1Reads = new AsyncLocalStorage<{ count: number; unavailable: boolean }>();
const observedDatabases = new WeakMap<D1Database, D1Database>();

function observedDatabase(binding: D1Database) {
  const existing = observedDatabases.get(binding);
  if (existing) return existing;
  const observed = new Proxy(binding, { get(target, key) {
    const value = Reflect.get(target, key);
    if (typeof value !== 'function' || key === 'constructor') return value;
    return (...args: unknown[]) => {
      const reads = d1Reads.getStore();
      if (reads) {
        reads.count++;
        if (reads.unavailable) throw new Error('Test-injected D1 unavailable');
      }
      return Reflect.apply(value, target, args);
    };
  } });
  observedDatabases.set(binding, observed);
  return observed;
}

async function observeAudienceReads(request: Request, env: AppBindings, context: ExecutionContext) {
  let objectReads = 0;
  const reads = { count: 0, unavailable: request.headers.get('X-Test-D1-Unavailable') === '1' };
  const SNAPSHOTS = new Proxy(env.SNAPSHOTS, { get(target, key) {
    const value = Reflect.get(target, key);
    if (typeof value !== 'function') return value;
    return async (...args: unknown[]) => {
      if (key === 'put' && typeof args[0] === 'string') {
        while (heldSelector === args[0]) await new Promise(resolve => setTimeout(resolve, 10));
      }
      if (key === 'get' || key === 'head' || key === 'list') objectReads++;
      return Reflect.apply(value, target, args);
    };
  } });
  const response = await d1Reads.run(reads, () => worker.fetch(request, { ...env, DB: observedDatabase(env.DB), SNAPSHOTS }, context));
  const observed = new Response(response.body, response);
  observed.headers.set('X-Test-D1-Reads', String(reads.count));
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
    if (url.hostname === env.LAMP_APP_HOST && url.pathname === '/test/hold-selector' && request.method === 'PUT') {
      heldSelector = (await request.json<{ key: string | null }>()).key;
      return new Response(null, { status: 204 });
    }
    if (url.hostname === env.LAMP_APP_HOST && url.pathname === '/test/effects' && request.method === 'PUT') {
      paused = (await request.json<{ paused: boolean }>()).paused;
      return new Response(null, { status: 204 });
    }
    Object.assign(lampServerExtensions.policies, {
      'update.review.v1': { requiresReview: () => (env as unknown as Record<string, string>).LAMP_TEST_REQUIRE_REVIEW === 'true' },
    });
    const bindings = executionBindings(env, 'request');
    if ((env as unknown as Record<string, string>).LAMP_TEST_AUDIENCE_READS === 'true') {
      return observeAudienceReads(request, bindings, context);
    }
    return worker.fetch(request, bindings, context);
  },
};
