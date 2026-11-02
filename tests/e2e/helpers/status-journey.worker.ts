import worker from './follow-ups-worker';
import { lampServerExtensions } from '../../../src/ext/index.server';
export { SnapshotCache } from '../../../src/core/platform/blobs/snapshot-cache';
let paused = false;
let publicationFailure = false;
const publicationAttempts: string[] = [];
const executionBindings = (env: Parameters<typeof worker.fetch>[1]) => ({
  ...env,
  ...(paused ? { EFFECTS_PAUSED: '1' } : {}),
  // Reject only replica publication, while ordinary reads of the retained
  // generation and all real D1 and R2 operations remain available.
  SNAPSHOT_CACHE: new Proxy(env.SNAPSHOT_CACHE, {
    get(target, key) {
      if (key === 'get') return (...args: Parameters<typeof target.get>) => {
        const stub = target.get(...args);
        return new Proxy(stub, { get(object, property) {
          if (property === 'fetch') return async (input: RequestInfo, init?: RequestInit) => {
            const request = new Request(input, init);
            if (publicationFailure && request.method === 'PUT') {
              publicationAttempts.push((await request.json<{ version: string }>()).version);
              return new Response('Synthetic Lamp publication unavailable', { status: 503 });
            }
            return object.fetch(request);
          };
          const value = Reflect.get(object, property);
          return typeof value === 'function' ? value.bind(object) : value;
        } });
      };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }),
});
export default {
  ...worker,
  queue(batch: Parameters<typeof worker.queue>[0], env: Parameters<typeof worker.queue>[1]) {
    return worker.queue(batch, executionBindings(env));
  },
  scheduled(controller: ScheduledController, env: Parameters<typeof worker.fetch>[1], context: ExecutionContext) {
    return worker.scheduled(controller, executionBindings(env), context);
  },
  async fetch(request: Request, env: Parameters<typeof worker.fetch>[1], context: ExecutionContext) {
    const url = new URL(request.url);
    if (url.hostname === env.LAMP_APP_HOST && url.pathname === '/test/snapshot-publication') {
      if (request.method === 'GET') return Response.json({ failing: publicationFailure, attempts: publicationAttempts });
      if (request.method === 'PUT') {
        publicationFailure = (await request.json<{ failing: boolean }>()).failing;
        return new Response(null, { status: 204 });
      }
    }
    if (url.hostname === env.LAMP_APP_HOST && url.pathname === '/test/effects' && request.method === 'PUT') {
      paused = (await request.json<{ paused: boolean }>()).paused;
      return new Response(null, { status: 204 });
    }
    Object.assign(lampServerExtensions.policies, {
      'update.review.v1': { requiresReview: () => (env as unknown as Record<string, string>).LAMP_TEST_REQUIRE_REVIEW === 'true' },
    });
    return worker.fetch(request, executionBindings(env), context);
  },
};
