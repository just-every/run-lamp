import clockedWorker from './automation-clock-worker';
import worker from './status-journey.worker';

export { SnapshotCache } from './status-journey.worker';

export default {
  ...worker,
  fetch(request: Request, env: Parameters<typeof worker.fetch>[1], context: ExecutionContext) {
    if (new URL(request.url).pathname === '/test/clock' && request.method === 'PUT') {
      return clockedWorker.fetch(request, env, context);
    }
    return worker.fetch(request, env, context);
  },
};
