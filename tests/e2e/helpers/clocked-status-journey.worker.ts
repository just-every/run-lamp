import clockedWorker from './automation-clock-worker';
import worker from './status-journey.worker';

export { SnapshotCache } from './status-journey.worker';

export default {
  ...worker,
  scheduled(controller: ScheduledController, env: Parameters<typeof worker.scheduled>[1], context: ExecutionContext) {
    const trafficEdge = (env as unknown as Record<string, string>).LAMP_TEST_TRAFFIC_EDGE;
    if (!trafficEdge) return worker.scheduled(controller, env, context);
    const SNAPSHOTS = new Proxy(env.SNAPSHOTS, {
      get(target, key) {
        if (key === 'list') return async (options?: R2ListOptions) => {
          if (options?.prefix?.startsWith('traffic/counts/')) {
            const response = await fetch(trafficEdge);
            if (!response.ok) throw new Error('Test traffic storage is unavailable.');
          }
          return target.list(options);
        };
        const value = Reflect.get(target, key);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    return worker.scheduled(controller, { ...env, SNAPSHOTS }, context);
  },
  fetch(request: Request, env: Parameters<typeof worker.fetch>[1], context: ExecutionContext) {
    if (new URL(request.url).pathname === '/test/clock' && request.method === 'PUT') {
      return clockedWorker.fetch(request, env, context);
    }
    return worker.fetch(request, env, context);
  },
};
