/// <reference path="../scripts/dev-ingress/virtual.d.ts" />
// This entry exists only for Vite serve. Production always uses src/server.ts.
import worker from './server';
import { withDevIdentity } from '@runeditrun/rer/modules/operator-auth/dev';
import { authConfig } from './core/platform/auth/config';
import { createLampAuth } from './core/platform/auth';
import { installationSignIn } from "./core/platform/auth/installation-presentation";
import { createPageSettingsRepository } from "./core/features/page-settings/repository";
import { signedInOwnerRedirect } from './core/platform/auth/http';
import { localSignInReturn } from './core/platform/auth/local-return';
import { admitsPasskeys, passkeyDoor, passkeyResponse } from './core/platform/auth/local-passkey/door';
import { addPasskeySignIn, passkeyEnrollment } from './core/platform/auth/local-passkey/pages';
import { admitsDevelopmentRequest } from './core/platform/development/access';
import type { AppBindings } from './core/app/types';
export { HealthWorker, MoveInWorker, SnapshotCache } from './server';
const devBindings = (env: AppBindings) => ({...env,AUTH_ORIGIN:env.RER_DEV_ORIGIN||env.AUTH_ORIGIN||env.LAMP_LOCAL_ORIGIN,AUTH_LOCAL:'true'});
const development = withDevIdentity<AppBindings,typeof worker>({
  ...worker,
  async fetch(request, bindings, execution) {
    if (new URL(request.url).pathname !== passkeyDoor) return worker.fetch(request, bindings, execution);
    const env = devBindings(bindings);
    const { enabled, authenticate } = await import('virtual:lamp-dev-ingress');
    const admitted = enabled && await authenticate(request);
    if (!admitted || !admitsDevelopmentRequest(env, admitted) || !admitsPasskeys(admitted, env)) {
      return new Response('Not found.', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    return ['GET', 'HEAD'].includes(admitted.method) ? passkeyEnrollment(admitted, env) : passkeyResponse(admitted, env);
  },
},{
  bindings:devBindings,
  config:authConfig,
});

export default {
  ...development,
  async fetch(request: Request, bindings: AppBindings, execution: ExecutionContext) {
    // Base admits the local dev credential before Lamp checks its native owner
    // session. Its one-click chooser never reaches the production sign-in route.
    const path = new URL(request.url).pathname;
    const env = devBindings(bindings);
    let response = await development.fetch(request, bindings, execution);
    if (bindings.RER_DEMO !== '1') {
      response = await localSignInReturn(request, response, authConfig(env).origin);
    }
    if (response.status === 200 && path === '/signin') {
      const signedIn = await signedInOwnerRedirect(request, createLampAuth(env));
      if (signedIn) return signedIn;
    }
    if (response.headers.get('content-type')?.includes('text/html')) {
      const html = await response.text();
      const headers = new Headers(response.headers); headers.delete('content-length');
      response = new Response(html.replace(/(<title[^>]*>)([\s\S]*?) Dev(<\/title>)/i, '$1$2$3').replace(/<style data-rer-label="Dev"[^>]*>[\s\S]*?<\/style><script>[\s\S]*?<\/script>/g, ''), { status: response.status, headers });
      if (['/signin', '/__dev/key'].includes(path)) {
        const page = await createPageSettingsRepository(bindings.DB).get();
        response = await installationSignIn(response, page?.pageName ?? 'Lamp', true, path === '/__dev/key');
        if (request.method === 'GET' && response.ok && admitsPasskeys(request, env)) {
          response = await addPasskeySignIn(request, response, env);
        }
      }
    }
    return response;
  },
};
