import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { moveInDoor } from '../helpers/import-notifications.mjs';
import { openStatusJourney } from './helpers/status-journey.mjs';

const profilePath = '/auth/owner-profile';
const confirmPath = profilePath + '/confirm';

function mailToken(message, email) {
  assert.ok(message?.to.includes(email), 'the provider received an email for the requested address');
  const link = message.text.match(/https?:\/\/[^\s]+/)?.[0];
  assert.ok(link, 'the email contains a confirmation link');
  const token = new URL(link).searchParams.get('token');
  assert.ok(token, 'the confirmation link carries a token');
  return token;
}

test('The owner can correct sign-in details and keep access to the same Move in history', { timeout: 60_000 }, async t => {
  const runtime = await openStatusJourney();
  try {
    const original = (await runtime.json('/api/app/session')).operator;
    const olderCookie = runtime.cookie;
    const updated = { email: 'synthetic-lamp-updated-owner@example.test', displayName: 'Synthetic Lamp updated owner' };
    const viewerEmail = 'synthetic-lamp-profile-viewer@example.test';
    const pendingEmail = 'synthetic-lamp-profile-pending@example.test';
    const requestAs = (path, cookie, body) => runtime.raw(path, {
      ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
      headers: {
        Origin: runtime.appOrigin, 'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });
    const sessionAs = async cookie => {
      const response = await requestAs('/api/app/session', cookie);
      assert.equal(response.status, 200, 'the session can still open Lamp');
      return (await response.json()).operator;
    };
    const assertProfile = operator => assert.deepEqual(
      { id: operator.id, role: operator.role, email: operator.email, displayName: operator.displayName },
      { id: original.id, role: 'owner', ...updated },
    );

    const anonymous = await requestAs(profilePath, null, updated);
    assert.deepEqual([anonymous.status, (await anonymous.json()).error], [401, 'unauthenticated']);
    await runtime.signIn(original.email, { fresh: true });
    const freshCookie = runtime.cookie;
    const nativeSession = await requestAs('/auth/session', olderCookie);
    assert.equal(nativeSession.status, 200);
    const { id: olderSessionId } = await nativeSession.json();
    const { id: freshSessionId } = await (await requestAs('/auth/session', freshCookie)).json();
    // Age the real email sign-in proof without expiring the authenticated session.
    await runtime.db.prepare('UPDATE oa_sessions SET created_at=? WHERE id IN (?,?)')
      .bind(Date.now() - 3_600_000, olderSessionId, freshSessionId).run();
    assert.equal((await sessionAs(olderCookie)).id, original.id);
    const stale = await requestAs(profilePath, olderCookie, updated);
    assert.deepEqual([stale.status, (await stale.json()).error], [403, 'step_up_required']);

    const nameOnly = await requestAs('/auth/display-name', olderCookie, { displayName: 'Dispatch Owner' });
    assert.equal(nameOnly.status, 200);
    assert.equal((await sessionAs(olderCookie)).displayName, 'Dispatch Owner');

    const stepUp = await runtime.post('/auth/step-up', { action: 'email:change' });
    assert.equal(stepUp.status, 202);
    const proof = await requestAs('/auth/confirm', freshCookie, { token: mailToken(runtime.messages.at(-1), original.email) });
    assert.equal(proof.status, 303);

    for (const [email, role] of [[viewerEmail, 'viewer'], [pendingEmail, 'communicator']]) {
      const invitation = await runtime.post('/api/app/operators/invite', { email, role, displayName: 'Synthetic Lamp teammate' });
      assert.equal(invitation.status, 202, invitation.text);
    }
    await runtime.signIn(viewerEmail);
    assert.equal((await runtime.json('/api/app/session')).operator.role, 'viewer');
    const viewerRefusal = await runtime.post(profilePath, updated);
    assert.deepEqual([viewerRefusal.status, viewerRefusal.body.error], [403, 'owner_required']);
    const sharedDoor = await runtime.post('/auth/email', { email: updated.email });
    assert.deepEqual([sharedDoor.status, sharedDoor.body.error], [403, 'owner_required']);
    const sharedName = await runtime.post('/auth/display-name', { displayName: 'Viewer' });
    assert.deepEqual([sharedName.status, sharedName.body.error], [403, 'owner_required']);

    const mint = await requestAs('/api/app/management-tokens', freshCookie, { name: 'Dispatch dashboard', scopes: ['read'] });
    assert.equal(mint.status, 201, 'the owner can mint an API credential');
    const { token: bearer } = await mint.json();
    const useCredential = () => runtime.raw('/api/v1/components', { headers: { Authorization: `Bearer ${bearer}` } });
    assert.equal((await useCredential()).status, 200);

    await runtime.signIn(original.email);
    const mailBeforeConflicts = runtime.messages.length;
    const duplicate = await requestAs(profilePath, freshCookie, { ...updated, email: pendingEmail });
    assert.deepEqual([duplicate.status, (await duplicate.json()).error], [409, 'email_in_use']);
    assert.equal(runtime.messages.length, mailBeforeConflicts, 'a refused change sends no mail');
    assert.equal((await sessionAs(freshCookie)).email, original.email);

    const moveIn = moveInDoor((path, body, headers) => runtime.api(path, {
      headers, ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
    }));
    const exportFolder = 'tests/fixtures/sorry/public';
    const files = readdirSync(exportFolder).map(name => ({ name, text: readFileSync(`${exportFolder}/${name}`, 'utf8') }));
    const review = await moveIn.preview({ source: 'sorry', files, pageId: 'synthpage01', publicAccessAcknowledged: true });
    assert.equal(review.status, 200, JSON.stringify(review.body));
    const { planId, fingerprint } = review.body;
    const started = await moveIn.door('sorry', 'apply', { planId, reviewedFingerprint: fingerprint });
    assert.equal(started.status, 200, JSON.stringify(started.body));
    const jobId = started.body.job.id;

    const issued = await requestAs('/auth/magic-link', null, { email: original.email });
    assert.equal(issued.status, 202);
    const accepted = await issued.json();
    const oldToken = mailToken(runtime.messages.at(-1), original.email);

    const typo = 'synthetic-lamp-typo@exmaple.test';
    const attempted = await requestAs(profilePath, freshCookie, { email: typo });
    assert.equal(attempted.status, 202);
    const first = await attempted.json();
    assert.equal(first.operator.email, original.email, 'fresh proof stages a change only');
    const typoToken = mailToken(runtime.messages.at(-1), typo);
    const mailBeforeTypo = runtime.messages.length;
    assert.equal((await requestAs('/auth/magic-link', null, { email: typo })).status, 202);
    assert.equal(runtime.messages.length, mailBeforeTypo, 'P4 a typo cannot receive an Owner sign-in link');
    for (const cookie of [null, olderCookie]) {
      const foreign = await requestAs(confirmPath, cookie, { token: typoToken });
      assert.deepEqual([foreign.status, (await foreign.json()).error], [400, 'invalid_or_expired']);
      assert.equal(foreign.headers.has('set-cookie'), false);
    }
    const native = await requestAs('/auth/confirm', null, { token: typoToken });
    assert.equal(native.headers.has('set-cookie'), false, 'a confirmation is never a sign-in credential');
    const cancelled = await requestAs(profilePath + '/cancel', freshCookie, { id: first.pending.id });
    assert.deepEqual(await cancelled.json(), { pending: null });
    assert.equal((await requestAs(confirmPath, freshCookie, { token: typoToken })).status, 400);

    const beforeSave = runtime.messages.length;
    const change = await requestAs(profilePath, freshCookie, updated);
    assert.equal(change.status, 202, 'P2 the same fresh proof can stage a different address');
    const staged = await change.json();
    const pending = await requestAs(profilePath, freshCookie);
    assert.deepEqual((await pending.json()).pending, staged.pending);
    assert.equal((await sessionAs(freshCookie)).email, original.email);
    const token = mailToken(runtime.messages.at(-1), updated.email);
    assert.deepEqual(runtime.messages.slice(beforeSave).map(message => message.to), [[updated.email]], 'P3 only the confirmation is sent before the switch');
    assert.equal((await requestAs(`${confirmPath}?token=${token}`, freshCookie)).status, 200);

    await runtime.db.prepare('UPDATE oa_step_up_challenges SET consumed_at=? WHERE session_id=?')
      .bind(Date.now() - 3_600_000, freshSessionId).run();
    const expired = await requestAs(profilePath, freshCookie, { email: 'still-pending@example.test' });
    assert.deepEqual([expired.status, (await expired.json()).error], [403, 'step_up_required']);
    const retry = await requestAs('/auth/step-up', freshCookie, { action: 'email:change' });
    assert.equal(retry.status, 202);
    assert.deepEqual(runtime.messages.at(-1).to, [original.email], 'P6 step-up still goes to the current Owner');

    const noticeStart = runtime.messages.length;
    const confirmed = await requestAs(confirmPath, freshCookie, { token });
    assert.equal(confirmed.status, 200);
    const changed = await confirmed.json();
    assertProfile(changed.operator);
    assert.equal(changed.notice, 'sent');
    assert.deepEqual(runtime.messages.slice(noticeStart).map(message => message.to), [[original.email]], 'P3 the previous address gets the notice on confirmation');
    assert.ok(runtime.messages.at(-1).text.includes(updated.email) && runtime.messages.at(-1).text.includes('rer signin'));
    assert.equal((await requestAs(confirmPath, freshCookie, { token })).status, 400, 'the link is single-use');

    assertProfile(await sessionAs(freshCookie));
    assert.equal((await requestAs('/api/app/session', olderCookie)).status, 401, 'P5 a handover signs out other sessions');
    assert.equal((await useCredential()).status, 401);
    const rejected = await requestAs('/auth/confirm', null, { token: oldToken });
    assert.deepEqual([rejected.status, (await rejected.json()).error], [400, 'invalid_or_expired']);
    assert.equal(rejected.headers.has('set-cookie'), false);
    const beforeOldRequest = runtime.messages.length;
    const unrecognized = await requestAs('/auth/magic-link', null, { email: original.email });
    assert.equal(unrecognized.status, 202);
    assert.deepEqual(await unrecognized.json(), accepted);
    assert.equal(runtime.messages.length, beforeOldRequest, 'a new request to the previous address dispatches no mail');

    await runtime.signIn(updated.email, { fresh: true });
    assertProfile((await runtime.json('/api/app/session')).operator);
    const applied = await moveIn.apply(review.body);
    assert.equal(applied.status, 200, JSON.stringify(applied.body));
    assert.equal(applied.body.job.id, jobId, 'the new address resumes the original approved import');
    assert.equal(applied.body.job.state, 'completed');
    await runtime.signIn(pendingEmail);
    assert.equal((await runtime.json('/api/app/session')).operator.role, 'communicator', 'a pending invitation survives the change');
    await runtime.signIn(updated.email);
    const { entries } = await runtime.json('/api/app/audit-log?action=owner-profile-changed');
    assert.ok(entries.some(({ actorId, entityId, actorName }) =>
      actorId === original.id && entityId === original.id && actorName === updated.displayName));
    const audit = await runtime.db.prepare(`SELECT payload_json FROM audit_entries WHERE action='owner-profile-changed'
      AND json_extract(payload_json, '$.newEmail')=?`).bind(updated.email).first();
    assert.deepEqual(JSON.parse(audit.payload_json), { oldEmail: original.email, newEmail: updated.email, revokedOtherAccess: true }, 'P7 audit records both addresses');

  } finally {
    await runtime.close();
  }
});
