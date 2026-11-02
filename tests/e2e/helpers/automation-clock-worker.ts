import worker from "./status-journey.worker";

const RealDate = Date;
let clock: number | null = null;
// This isolated test Worker controls time and reuses the effects pause boundary.
// Product requests still traverse the normal authenticated routes, D1, snapshot
// and Queue handlers.
globalThis.Date = new Proxy(RealDate, {
  construct(target, args) { return Reflect.construct(target, args.length ? args : [clock ?? RealDate.now()]); },
  get(target, key) { return key === "now" ? () => clock ?? RealDate.now() : Reflect.get(target, key); },
});
export { SnapshotCache } from "./status-journey.worker";
export default {
  ...worker,
  async fetch(request: Request, env: Parameters<typeof worker.fetch>[1], context: ExecutionContext) {
    if (new URL(request.url).pathname === "/test/clock" && request.method === "PUT") {
      const input = await request.json<{ now: number }>();
      if (!Number.isFinite(input.now) || input.now < (clock ?? RealDate.now())) return new Response("Clock must advance", { status: 400 });
      clock = input.now;
      return new Response(null, { status: 204 });
    }
    return worker.fetch(request, env, context);
  },
};
