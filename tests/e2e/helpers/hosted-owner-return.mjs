import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { ownerSigninDigest } from '@runeditrun/rer/internal/modules/operator-auth/owner-signin-grant.mjs';

const cookieHeader = response => response.headers.getSetCookie()
  .map(cookie => cookie.split(';', 1)[0]).filter(cookie => !cookie.endsWith('=')).join('; ');

export async function hostedOwnerReturn({ raw, db, origin, sessionCookie }) {
  const post = (path, body, cookie) => raw(path, { method: 'POST',
    headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const component = await post('/api/app/components', { name: 'Checkout', description: 'Card authorization', internal: false, groupId: null, displayOrder: 0, note: '' }, sessionCookie);
  assert.equal(component.status, 201);
  const staff = await post('/api/app/status-pages', { path: 'staff', kind: 'audience', pageName: 'Staff operations', tagline: 'Overnight dispatch',
    accentColor: '#3057A6', timezone: 'UTC', componentIds: [(await component.json()).component.id], footerCreditEnabled: true }, sessionCookie);
  assert.equal(staff.status, 201);

  const destination = '/status-pages/staff/?shift=overnight&source=dispatch';
  const gate = await raw(destination, { headers: { Accept: 'text/html' } });
  assert.equal(gate.status, 401);
  const signInPath = (await gate.text()).match(/href="(\/signin\?[^"]+)"/)?.[1];
  assert.ok(signInPath, 'the protected page links to sign-in');
  assert.equal(new URL(signInPath, origin).searchParams.get('returnTo'), destination);

  for (const [path, expected] of [
    [signInPath, destination],
    ...['https://external.example/', '//external.example/', '/%2fexternal.example/', '/app\r\nLocation: /setup'].map(returnTo =>
      [`/signin?${new URLSearchParams({ returnTo })}`, '/app']),
  ]) {
    const signIn = await raw(path, { headers: { Accept: 'text/html' } });
    assert.equal(signIn.status, 200);
    const cookie = cookieHeader(signIn);
    // The CLI mints this grant at the Cloudflare D1 edge. Its unmodified URL
    // carries only the token, just as it does when pasted from the terminal.
    const token = randomBytes(32).toString('base64url'), now = Date.now();
    await db.prepare('INSERT INTO oa_owner_signins(id,token_hash,operator_id,operator_version,created_at,expires_at) SELECT ?,?,id,version,?,? FROM oa_operators')
      .bind(randomUUID(), await ownerSigninDigest(token), now, now + 60_000).run();
    const preview = await raw(`/auth/owner-signin?${new URLSearchParams({ token })}`, { headers: { Cookie: cookie } });
    assert.equal(preview.status, 200);
    assert.equal(preview.headers.has('Set-Cookie'), false);
    assert.match(await preview.text(), /<form method="post" action="\/auth\/owner-signin">/);
    const confirmation = await raw('/auth/owner-signin', { method: 'POST',
      headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }).toString() });
    assert.equal(confirmation.status, 303);
    assert.equal(new URL(confirmation.headers.get('Location'), origin).href, origin + expected);
    const landed = await raw(expected, { headers: { Cookie: cookieHeader(confirmation) } });
    assert.equal(landed.status, 200, 'the confirmation sets a usable owner session');
  }
}
