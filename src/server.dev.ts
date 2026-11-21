// This entry exists only for Vite serve. Production always uses src/server.ts.
import worker from './server';
import { withDevIdentity } from '@runeditrun/rer/modules/operator-auth/dev';
import { authConfig } from './core/platform/auth/config';
import { createLampAuth } from './core/platform/auth';
import { installationSignIn } from "./core/platform/auth/installation-presentation";
import { createPageSettingsRepository } from "./core/features/page-settings/repository";
import { signedInOwnerRedirect } from './core/platform/auth/http';
import type { AppBindings } from './core/app/types';
export { SnapshotCache } from './server';
const devBindings = (env: AppBindings) => ({...env,AUTH_ORIGIN:env.RER_DEV_ORIGIN||env.AUTH_ORIGIN||env.LAMP_LOCAL_ORIGIN,AUTH_LOCAL:'true'});
const development = withDevIdentity<AppBindings,typeof worker>(worker,{
  bindings:devBindings,
  config:authConfig,
});

export default {
  ...development,
  async fetch(request: Request, bindings: AppBindings, execution: ExecutionContext) {
    // Base admits the local dev credential before Lamp checks its native owner
    // session. Its one-click chooser never reaches the production sign-in route.
    let response = await development.fetch(request, bindings, execution);
    if (response.status === 200 && new URL(request.url).pathname === '/signin') {
      const signedIn = await signedInOwnerRedirect(request, createLampAuth(devBindings(bindings)));
      if (signedIn) return signedIn;
    }
    if (response.headers.get('content-type')?.includes('text/html')) {
      const html = await response.text();
      const headers = new Headers(response.headers); headers.delete('content-length');
      response = new Response(html.replace(/(<title[^>]*>)([\s\S]*?) Dev(<\/title>)/i, '$1$2$3').replace(/<style data-rer-label="Dev"[^>]*>[\s\S]*?<\/style><script>[\s\S]*?<\/script>/g, ''), { status: response.status, headers });
      if (['/signin', '/__dev/key'].includes(new URL(request.url).pathname)) {
        const page = await createPageSettingsRepository(bindings.DB).get();
        response = await installationSignIn(response, page?.pageName ?? 'Lamp', true, new URL(request.url).pathname === '/__dev/key');
      }
    }
    return response;
  },
};
