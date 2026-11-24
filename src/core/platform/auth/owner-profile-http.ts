import { AuthError, securityHeaders } from '@runeditrun/rer/modules/operator-auth';
import { configure } from '@runeditrun/rer/internal/modules/operator-auth/config.mjs';
import { escapeHtml, requireOrigin, requirePost, sessionCookie } from '@runeditrun/rer/internal/modules/operator-auth/http.mjs';
import { readInput, readParameters } from '@runeditrun/rer/internal/modules/operator-auth/input.mjs';
import { OWNER_SIGNIN_PATH } from '@runeditrun/rer/internal/modules/operator-auth/owner-signin-grant.mjs';
import { pageResponse } from '@runeditrun/rer/internal/modules/operator-auth/page.mjs';
import type { authConfig } from './config';
import { ownerEmailConfirmPath, ownerProfileReturn, ownerProfileSettings, retainedAccess, type ownerProfile } from './owner-profile';

const profilePath = '/auth/owner-profile';
const submitField = 'confirmEmailChange';

export async function ownerProfileResponse(request: Request, url: URL, profile: ReturnType<typeof ownerProfile>,
  config: ReturnType<typeof authConfig>, emailSignInAllowed: () => Promise<boolean>) {
  const path = url.pathname;
  const json = (body: object, status = 200) => Response.json(body, { status, headers: securityHeaders() });
  if (path === profilePath && request.method === 'GET') {
    requireOrigin(request, config);
    return json(await profile.read(request));
  }
  if (path === profilePath || path === '/auth/email' || path === profilePath + '/cancel') {
    requirePost(request, config);
    const input = await readInput(request);
    if (path === profilePath + '/cancel') return json(await profile.cancel(request, input.id));
    const result = await profile.change(request, path === '/auth/email' ? { email: input.email, revokeAccess: input.revokeAccess } : input);
    return json(result, result.pending && result.pending.email !== result.operator.email && input.email !== undefined ? 202 : 200);
  }
  if (path !== ownerEmailConfirmPath && path !== OWNER_SIGNIN_PATH) return null;

  const ownerLink = path === OWNER_SIGNIN_PATH;
  const method = request.method;
  const type = ownerLink ? 'owner-link' : 'email';
  const branding = config.branding;
  if (['GET', 'HEAD'].includes(method)) {
    requireOrigin(request, config);
    const { token } = readParameters(url.searchParams);
    const candidate = await profile.confirmation(request, type, token);
    if (!candidate && ownerLink && !await profile.ownsLocalGrant(token)) return null;
    if (!candidate) return refusal(400);
    const email = escapeHtml(candidate.pending.email);
    const action = ownerLink ? OWNER_SIGNIN_PATH : ownerEmailConfirmPath;
    const access = candidate.pending.revokeAccess
      ? 'Lamp will sign out all existing sessions and revoke minted credentials and linked sign-ins.' : retainedAccess;
    return pageResponse({ branding, heading: 'Confirm your new sign-in email', method, referrer: 'strict-origin',
      content: `<p>Change your Lamp sign-in email to <strong>${email}</strong>?</p><p>${access}</p>
        ${ownerLink ? '<p>Email is off, so Lamp cannot verify who holds the new address.</p>' : ''}
        <form method="post" action="${action}"><input type="hidden" name="token" value="${escapeHtml(token)}">
          ${ownerLink ? `<input type="hidden" name="${submitField}" value="1">` : ''}
          <button type="submit">Confirm email change</button></form>
        <p class="secondary-link"><a href="${ownerProfileSettings}">Back to Owner account</a></p>` });
  }

  if (ownerLink && method !== 'POST') return null;
  requirePost(request, config);
  // Leave ordinary rer signin submissions on Base's handler with the original body.
  const input = await readInput(ownerLink ? request.clone() : request).catch(error => {
    if (!ownerLink) throw error;
    return null;
  });
  if (ownerLink && input?.[submitField] !== '1') {
    if (!await profile.ownsLocalGrant(input?.token)) return null;
    return json({ error: 'invalid_or_expired' }, 400);
  }

  if (url.searchParams.has('token')) return json({ error: 'invalid_input' }, 400);
  const form = request.headers.get('content-type')?.split(';')[0] === 'application/x-www-form-urlencoded';
  try {
    const result = await profile.confirm(request, type, input?.token, emailSignInAllowed);
    const cookie = result.signedOut ? sessionCookie('', configure(config), 0) : null;
    const headers = securityHeaders();
    if (!form) return Response.json(result, { headers: { ...headers, ...(cookie ? { 'Set-Cookie': cookie } : {}) } });
    if (!result.signedOut) {
      return new Response(null, { status: 303, headers: { ...headers, Location: ownerProfileReturn(result.notice) } });
    }
    const email = escapeHtml(result.operator.email);
    const entry = result.signInUrl ? `<p>Give this one-time Owner link to the holder of <strong>${email}</strong>. It expires in 15 minutes.</p>
      <label for="owner-link">One-time Owner sign-in link</label><input id="owner-link" type="text" readonly value="${escapeHtml(result.signInUrl)}">`
      : result.signInEmailSent ? `<p>Lamp sent a separate sign-in link to <strong>${email}</strong>.</p>`
        : `<p>The new Owner can continue from <a href="/signin">Sign in</a> as <strong>${email}</strong>.</p>`;
    const page = await pageResponse({ branding, heading: 'Owner email changed', method,
      content: `<p>Lamp signed out all previous sessions.</p>${entry}${result.notice === 'failed' ? '<p>Lamp could not notify the previous address.</p>' : ''}` });
    if (cookie) page.headers.set('Set-Cookie', cookie);
    return page;
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    return form ? refusal(error.status, error.code) : json({ error: error.code }, error.status);
  }

  function refusal(status: number, code?: string) {
    const duplicate = code === 'email_in_use';
    return pageResponse({ branding, heading: duplicate ? 'That email is already in use' : 'This email change link is unavailable',
      content: `<p>${duplicate ? 'Return to Owner account and choose another address.' : 'Open the latest link in the same browser session that requested the change, or start again in Owner account.'}</p>
        <a class="action" href="${ownerProfileSettings}">Back to Owner account</a>`, status, method });
  }
}
