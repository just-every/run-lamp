import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { moveInDoor } from '../helpers/import-notifications.mjs';
import { openStatusJourney } from './helpers/status-journey.mjs';

const profilePath = '/auth/owner-profile';

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
    // Age the real email sign-in proof without expiring the authenticated session.
    await runtime.db.prepare('UPDATE oa_sessions SET created_at=? WHERE id=?')
      .bind(Date.now() - 3_600_000, olderSessionId).run();
    assert.equal((await sessionAs(olderCookie)).id, original.id);
    const stale = await requestAs(profilePath, olderCookie, updated);
    assert.deepEqual([stale.status, (await stale.json()).error], [403, 'step_up_required']);

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

    await runtime.signIn(original.email);
    const mailBeforeConflicts = runtime.messages.length;
    for (const email of [viewerEmail, pendingEmail]) {
      const duplicate = await runtime.post(profilePath, { ...updated, email });
      assert.deepEqual([duplicate.status, duplicate.body.error], [409, 'email_in_use'], email);
    }
    assert.equal(runtime.messages.length, mailBeforeConflicts, 'refused changes send no notice');
    assert.deepEqual(await sessionAs(freshCookie), original, 'refused changes keep both profile fields');

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

    const beforeSave = runtime.messages.length;
    const changed = await runtime.post(profilePath, updated);
    assert.equal(changed.status, 200, changed.text);
    assertProfile(changed.body.operator);
    assert.equal(changed.body.notice, 'sent');
    const notices = runtime.messages.slice(beforeSave);
    assert.equal(notices.length, 1);
    assert.deepEqual(notices[0].to, [updated.email]);
    assert.ok(notices[0].text.includes(updated.email), 'the notice names the new sign-in address');

    for (const cookie of [olderCookie, freshCookie]) assertProfile(await sessionAs(cookie));
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
    assert.deepEqual(entries.map(({ actorId, entityId, actorName }) => ({ actorId, entityId, actorName })), [
      { actorId: original.id, entityId: original.id, actorName: updated.displayName },
    ]);
    t.diagnostic('Owner details changed under the same ID. Both sessions remained usable, the new address opened a new session, and Move in kept the approved job.');
  } finally {
    await runtime.close();
  }
});
