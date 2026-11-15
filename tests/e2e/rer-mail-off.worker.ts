import worker from './rer-mail.worker';
export { SnapshotCache } from './rer-mail.worker';

// Only the isolated journey's clock is controlled. All product mutations and
// scheduled work still pass through the native request and Cron entry points.
const RealDate = Date;
let clock: number | null = null;
globalThis.Date = new Proxy(RealDate, {
  construct(target, args) { return Reflect.construct(target, args.length ? args : [clock ?? RealDate.now()]); },
  get(target, key) { return key === 'now' ? () => clock ?? RealDate.now() : Reflect.get(target, key); },
});
export default {
  ...worker,
  async fetch(request: Request, env: Parameters<typeof worker.fetch>[1], context: ExecutionContext) {
    if (new URL(request.url).pathname === '/__test/clock' && request.method === 'PUT') {
      const input = await request.json<{ now: number }>();
      if (!Number.isFinite(input.now) || input.now < (clock ?? RealDate.now())) return new Response('Clock must advance', { status: 400 });
      clock = input.now;
      return new Response(null, { status: 204 });
    }
    return worker.fetch(request, env, context);
  },
};
