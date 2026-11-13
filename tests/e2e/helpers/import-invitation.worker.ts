import worker from './status-journey.worker';
export { SnapshotCache } from './status-journey.worker';

const RealDate = Date;
let clock: number | null = null;
let preparationFailure = false;
// Only clock and transport configuration are controlled. Imports, claims,
// confirmation and expiry use the native routes and migrated database.
globalThis.Date = new Proxy(RealDate, {
  construct(target, args) { return Reflect.construct(target, args.length ? args : [clock ?? RealDate.now()]); },
  get(target, key) { return key === 'now' ? () => clock ?? RealDate.now() : Reflect.get(target, key); },
});
export default {
  ...worker,
  async fetch(request: Request, env: Parameters<typeof worker.fetch>[1], context: ExecutionContext) {
    const url = new URL(request.url);
    if (url.hostname === env.LAMP_APP_HOST && request.method === 'PUT') {
      if (url.pathname === '/test/clock') {
        const input = await request.json<{ now: number }>();
        if (!Number.isFinite(input.now) || input.now < (clock ?? RealDate.now())) return new Response('Clock must advance', { status: 400 });
        clock = input.now;
        return new Response(null, { status: 204 });
      }
      if (url.pathname === '/test/invitation-preparation') {
        preparationFailure = (await request.json<{ fail: boolean }>()).fail;
        return new Response(null, { status: 204 });
      }
    }
    // An invalid header makes the real Resend adapter fail Request construction
    // before fetch. It reports MailPreparationError; no transport is replaced.
    const bindings = preparationFailure && url.pathname.endsWith('/send-invitations')
      ? { ...env, MAIL_PROVIDER_API_KEY: 'synthetic-lamp-\ninvalid-header' } : env;
    return worker.fetch(request, bindings, context);
  },
};
