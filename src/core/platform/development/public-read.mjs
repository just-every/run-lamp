import { isImportAliasPath, isLampPermalink } from '../../features/statuspage-import/public-paths.mjs';

const loopbackAuthority = /^(?:(?:status\.)?localhost|127\.0\.0\.1|\[::1\])(?::[0-9]{1,5})?$/;
const hasCredentials = headers => ['cookie', 'cookie2', 'authorization', 'proxy-authorization', 'x-rer-dev-key'].some(name => headers.has(name));

/** A third-party site can load the same public widget and poll its public
 * status data in development. This exception never reaches the app host. */
export function isLocalWidgetRead(method, target, headers, url) {
  if (method !== 'GET' || target !== url.pathname || !loopbackAuthority.test(url.host) || hasCredentials(headers)) return false;
  const mode = headers.get('sec-fetch-mode'), dest = headers.get('sec-fetch-dest');
  if (target === '/widget.js') return mode === 'no-cors' && dest === 'script' && !headers.has('origin');
  if (target !== '/api/public/status' || mode !== 'cors' || dest !== 'empty') return false;
  const value = headers.get('origin');
  try {
    const origin = new URL(value);
    return ['http:', 'https:'].includes(origin.protocol) && origin.origin === value;
  } catch { return false; }
}

/** A candidate for the owner's credentialless Cutover fetch. Socket ingress
 * checks the raw target; the Worker must additionally check configured hosts.
 * This is public snapshot admission only, never mail or operator authority. */
export function isLocalPublicRead(method, target, headers, url) {
  if (method !== 'GET' || headers.get('sec-fetch-mode') !== 'cors'
    || headers.get('sec-fetch-dest') !== 'empty' || headers.get('sec-fetch-site') !== 'cross-site') return false;
  // No query-driven module transforms, encoding or URL normalization may turn
  // an apparent alias into a Vite/private route before the Worker sees it.
  if (target !== url.pathname || !(isImportAliasPath(target) || isLampPermalink(target))) return false;
  if (/^\/cdn-cgi(?:\/|$)/i.test(target)) return false;
  if (hasCredentials(headers)) return false;
  let origin;
  try { origin = new URL(headers.get('origin')); } catch { return false; }
  return ['http:', 'https:'].includes(url.protocol) && loopbackAuthority.test(url.host)
    && loopbackAuthority.test(origin.host) && origin.origin === headers.get('origin')
    && origin.protocol === url.protocol && origin.port === url.port && origin.origin !== url.origin;
}
