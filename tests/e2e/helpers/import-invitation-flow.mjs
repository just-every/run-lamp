import assert from 'node:assert/strict';

const HOUR = 3_600_000;
const address = name => [name, 'example.test'].join('@');

/** A batch crosses the fifty-recipient boundary; each other provider also has
 * independent confirmed, expired and uncertain-submission controls. */
export function invitationFiles(source, files) {
  const name = source === 'instatus' ? 'instatus-subscribers.json' : 'subscribers.json';
  const file = files.find(row => row.name === name), data = JSON.parse(file.text);
  const rows = source === 'betterstack' ? data.data : data;
  const template = rows[0];
  for (let index = 0; index < (source === 'statuspage' ? 56 : 4); index++) {
    const id = source === 'betterstack' ? String(31001900 + index) : `synthetic-lamp-invite-${index}`;
    const email = address(`synthetic-lamp-${source}-invite-${index}`);
    rows.push(source === 'betterstack'
      ? { ...template, id, attributes: { ...template.attributes, email } }
      : { ...template, id, email });
  }
  file.text = JSON.stringify(data);
  return files;
}

/** All outcomes travel through the reviewed native import, owner invitation,
 * real mail serializer, anonymous confirmation and native scheduled handler. */
export async function importInvitationFlow({ runtime, api, source, result, priorIds, control }) {
  const list = async () => {
    const rows = [];
    for (let offset = 0; ; offset += 100) {
      const page = await api(`/api/app/subscribers?limit=100&offset=${offset}`);
      assert.equal(page.status, 200, JSON.stringify(page.body));
      rows.push(...page.body.subscribers);
      if (!page.body.hasMore) return rows;
    }
  };
  const pending = (await list()).filter(row => !priorIds.has(row.id)).sort((a, b) => a.id.localeCompare(b.id));
  assert.ok(pending.length >= 4 && pending.every(row => row.state === 'pending' && row.channel === 'email'));
  assert.ok(pending.every(row => row.createdAt === result.report.asOf), `${source} starts the lifetime at the actual reviewed import instant`);
  const originalReview = result.report.asOf;
  const deadline = Date.parse(originalReview) + 72 * HOUR;
  const expired = pending.at(-1), confirmed = pending[0], uncertain = pending[1];
  // Preserve the existing independently aged expired-recipient control while
  // every other address keeps the native review timestamp unchanged.
  await runtime.db.prepare('UPDATE subscribers SET created_at=? WHERE id=?')
    .bind(new Date(Date.parse(originalReview) - 73 * HOUR).toISOString(), expired.id).run();
  const clock = async now => {
    const response = await runtime.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now }) });
    assert.equal(response.status, 204, await response.text());
  };
  const tick = async now => {
    await clock(now);
    const run = await (await runtime.runtime.getWorker()).scheduled({ cron: '* * * * *', scheduledTime: now });
    assert.equal(run.outcome, 'ok');
  };
  const path = `/api/app/statuspage-import/jobs/${result.job.id}/send-invitations`;
  const claims = async () => (await runtime.db.prepare('SELECT * FROM statuspage_import_invites WHERE job_id=? ORDER BY subscriber_id').bind(result.job.id).all()).results;
  const stored = async () => (await runtime.db.prepare('SELECT * FROM subscriber_directory WHERE id IN (SELECT value FROM json_each(?)) ORDER BY id').bind(JSON.stringify(pending.map(row => row.id))).all()).results;
  const before = await stored(), beforeClaims = await claims(), mailBeforeSignout = runtime.messages.length;
  assert.equal((await runtime.raw(path, { method: 'POST', headers: { Origin: runtime.appOrigin, 'Content-Type': 'application/json' }, body: '{}' })).status, 401, 'signed-out invitation is refused');
  assert.equal((await api('/api/app/session/signout', {}, undefined, 'POST')).status, 204);
  assert.equal((await api(path, {})).status, 401, 'a revoked session cannot invite');
  assert.deepEqual(await claims(), beforeClaims);
  assert.deepEqual(await stored(), before);
  assert.equal(runtime.messages.length, mailBeforeSignout, 'refused invitations hand nothing to transport');
  await clock(Date.parse(originalReview) + 48 * HOUR);
  await runtime.signIn(undefined, { fresh: true });
  const mailBefore = runtime.messages.length, receiptsBefore = runtime.mailReceipts.length;

  assert.equal((await runtime.raw('/test/invitation-preparation', { method: 'PUT', body: JSON.stringify({ fail: true }) })).status, 204);
  const preparation = await api(path, {});
  assert.equal(preparation.status, 409);
  assert.match(preparation.body.error, /preparation failed before submission/i);
  assert.equal(runtime.messages.length, mailBefore, 'proven preparation failure never enters transport');
  assert.ok((await claims()).every(row => row.sent_at === null), 'proven non-submission releases the invitation claim');
  assert.equal((await runtime.raw('/test/invitation-preparation', { method: 'PUT', body: JSON.stringify({ fail: false }) })).status, 204);

  control.uncertainRecipient = uncertain.destination;
  const interrupted = await api(path, {});
  assert.equal(interrupted.status, 409);
  assert.match(interrupted.body.error, /Synthetic invitation acknowledgement interrupted/);
  const uncertainClaim = (await claims()).find(row => row.subscriber_id === uncertain.id);
  assert.ok(uncertainClaim?.sent_at, 'an uncertain submitted attempt remains durably claimed');
  control.uncertainRecipient = null;
  // Competing requests plus repeats must exhaust a batch larger than fifty,
  // without relying on provider idempotency to hide duplicate submissions.
  for (let round = 0; round < 2; round++) {
    const batches = await Promise.all([api(path, {}), api(path, {})]);
    for (const batch of batches) assert.equal(batch.status, 200, JSON.stringify(batch.body));
  }
  const invited = await api(path, {});
  assert.equal(invited.status, 200, JSON.stringify(invited.body));
  assert.equal(invited.body.invites.sent, 0);
  assert.equal(invited.body.report.cutover.invitations.expired, 1);
  const eligible = pending.filter(row => row.id !== expired.id);
  const messages = runtime.messages.slice(mailBefore), receipts = runtime.mailReceipts.slice(receiptsBefore);
  assert.deepEqual(messages.flatMap(message => message.to).sort(), eligible.map(row => row.destination).sort(), `${source} transport gets exactly the eligible addresses, explicitly excluding the expired address`);
  assert.ok(!messages.some(message => message.to.includes(expired.destination)));
  assert.equal(new Set(messages.flatMap(message => message.to)).size, eligible.length);
  assert.deepEqual(receipts.map(row => row.idempotencyKey).sort(), eligible.map(row => `subscriber-import-invite/${row.id}`).sort(), 'every eligible recipient has exactly one distinct transport identity');
  assert.deepEqual((await claims()).find(row => row.subscriber_id === uncertain.id), uncertainClaim, 'repeated batches preserve the uncertain claim without resubmission');
  if (source === 'statuspage') assert.equal(messages.length, 57, 'concurrent and repeated batches produce exactly 57 distinct transport messages');

  const links = new Map();
  for (const message of messages) {
    const confirmation = message.text.match(/https?:\/\/\S+\/confirm-subscription\/[^\s]+/u)?.[0];
    const unsubscribe = message.text.match(/https?:\/\/\S+\/unsubscribe\/[^\s]+/u)?.[0];
    assert.ok(confirmation && unsubscribe);
    for (const [link, prefix] of [[confirmation, '/confirm-subscription/'], [unsubscribe, '/unsubscribe/']]) {
      const url = new URL(link);
      assert.equal(url.origin, runtime.publicOrigin);
      assert.ok(url.pathname.startsWith(prefix) && url.pathname.slice(prefix.length));
      assert.equal(url.search, ''); assert.equal(url.hash, '');
    }
    // Compare the whole envelope and body: no historical title, wording, HTML,
    // attachment or other payload can sneak into a confirmation-only message.
    assert.deepEqual(message, {
      from: address('synthetic-lamp-sender'), to: [message.to[0]],
      subject: 'Confirm your Synthetic Lamp follow-ups subscription',
      text: `Synthetic Lamp follow-ups has moved its status page. You subscribed to its updates there; confirm before ${new Date(deadline).toISOString()} (the remaining part of the 72-hour window from import) to keep receiving them: ${confirmation}\n\nIf you do nothing, you will receive no further email from this page. Unsubscribe: ${unsubscribe}\nReturn to status: ${runtime.publicOrigin}/`,
      headers: { 'Auto-Submitted': 'auto-generated' },
    }, `${source} sends the complete confirmation-only envelope with the original deadline after a two-day delay`);
    links.set(message.to[0], confirmation);
  }
  assert.equal((await runtime.raw(links.get(confirmed.destination))).status, 200);
  const active = (await stored()).find(row => row.id === confirmed.id);
  assert.equal(active.state, 'active', 'confirmation activates the intended imported identity');
  assert.equal(active.created_at, originalReview, 'sending and confirming do not reset the import review instant');

  await tick(deadline - 1);
  await runtime.signIn(undefined, { fresh: true });
  const unconfirmed = eligible.filter(row => row.id !== confirmed.id);
  assert.deepEqual((await list()).filter(row => pending.some(item => item.id === row.id)).map(row => row.id).sort(), eligible.map(row => row.id).sort());
  assert.ok((await stored()).filter(row => row.id !== confirmed.id).every(row => row.state === 'pending'), 'pending addresses remain immediately before the original deadline');
  await clock(deadline);
  const beforeExpiredConfirmation = await stored();
  const expiredConfirmation = await runtime.raw(links.get(uncertain.destination));
  assert.equal(expiredConfirmation.status, 404, 'Instatus and the other providers refuse confirmation at the original seventy-two-hour deadline');
  assert.match(await expiredConfirmation.text(), /invalid or has expired/);
  assert.deepEqual(await stored(), beforeExpiredConfirmation, 'expired confirmation changes no subscription');
  const atDeadline = await stored(), transportAtDeadline = runtime.messages.length;
  assert.equal((await api(path, {})).body.invites.sent, 0, 'expired invitations are refused despite delayed sending');
  assert.deepEqual(await stored(), atDeadline, 'expired confirmation and invitation attempts change no subscription');
  assert.equal(runtime.messages.length, transportAtDeadline);
  // Import custody retirement is bounded per scheduled invocation. Drain it
  // through the native handler at the same deadline, without changing ages.
  for (let round = 0; round < pending.length; round++) {
    await tick(deadline);
    if ((await stored()).length === 1) break;
  }
  assert.deepEqual((await list()).filter(row => pending.some(item => item.id === row.id)).map(row => row.id), [confirmed.id], 'native pending expiry removes every unconfirmed imported identity');
  assert.deepEqual(await stored(), [active], 'native expiry preserves every field of the confirmed control');
  const tables = (await runtime.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT GLOB '_cf_*'").all()).results;
  for (const { name } of tables) {
    const rows = JSON.stringify((await runtime.db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all()).results);
    for (const row of [...unconfirmed, expired]) assert.ok(!rows.includes(row.destination), `${name} retains no expired imported address`);
  }
  assert.equal((await runtime.raw(links.get(uncertain.destination))).status, 404, 'replaying an erased confirmation cannot resurrect the subscriber');
  assert.equal((await api(path, {})).body.invites.sent, 0);
  assert.deepEqual(await stored(), [active]);
  assert.equal(runtime.messages.length, transportAtDeadline);
  console.log(`PROBE MOVE-013 ${source}: owner-only confirmation envelopes, exact recipients, concurrent claims, original deadline, expired refusals, native erasure and safe retry controls passed`);
}

/** A separately reviewed import is never invited before its deadline. This
 * proves expiry itself refuses the send, independently of an earlier claim. */
export async function unsentExpiredImportFlow({ runtime, api, moveIn, source, files }) {
  const isInstatus = source === 'instatus', isBetterStack = source === 'betterstack';
  const subscriberName = isInstatus ? 'instatus-subscribers.json' : 'subscribers.json';
  const sourceData = JSON.parse(files.find(row => row.name === subscriberName).text);
  const template = (isBetterStack ? sourceData.data : sourceData)[0];
  const destination = address(`synthetic-lamp-${source}-unsent`);
  const id = isBetterStack ? '31999999' : 'synthetic-lamp-unsent';
  const subscriber = isBetterStack
    ? { ...template, id, attributes: { ...template.attributes, email: destination, status_page_resource_ids: [] } }
    : { ...template, id, email: destination, components: [] };
  const keep = isInstatus ? ['instatus-pages.json', 'instatus-components.json', 'instatus-incidents.json', 'instatus-maintenances.json', 'instatus-audience-groups.json', subscriberName]
    : isBetterStack ? ['status-page.json', 'resources.json', 'sections.json', 'status-reports.json', subscriberName]
    : ['page.json', 'components.json', 'incidents.json', 'page-access-groups.json', subscriberName];
  const isolated = files.filter(row => keep.includes(row.name)).map(file => {
    if (file.name === (isInstatus ? 'instatus-pages.json' : isBetterStack ? 'status-page.json' : 'page.json')) return { ...file };
    const rows = file.name === subscriberName ? [subscriber] : [];
    return { name: file.name, text: JSON.stringify(isBetterStack ? { data: rows, pagination: { next: null } } : rows) };
  });
  const reviewed = await moveIn.preview({ source, files: isolated, pageId: 'synthpage01', publicAccessAcknowledged: true });
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  const imported = await moveIn.apply(reviewed.body);
  assert.equal(imported.status, 200, JSON.stringify(imported.body));
  const path = `/api/app/statuspage-import/jobs/${imported.body.job.id}/send-invitations`;
  const row = await runtime.db.prepare('SELECT * FROM subscriber_directory WHERE destination=?').bind(destination).first();
  assert.ok(row && row.state === 'pending');
  assert.equal(row.created_at, imported.body.report.asOf);
  const deadline = Date.parse(row.created_at) + 72 * HOUR;
  const now = async at => assert.equal((await runtime.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: at }) })).status, 204);
  await now(deadline - 1);
  await runtime.signIn(undefined, { fresh: true });
  assert.equal((await api(`/api/app/statuspage-import/jobs/${imported.body.job.id}`)).body.report.cutover.invitations.eligible, 1);
  const mailBefore = runtime.messages.length;
  await now(deadline);
  const refused = await api(path, {});
  assert.equal(refused.status, 200, JSON.stringify(refused.body));
  assert.equal(refused.body.invites.sent, 0);
  assert.equal(refused.body.report.cutover.invitations.expired, 1);
  assert.equal(runtime.messages.length, mailBefore, `${source} never hands the unsent expired address to transport`);
  assert.deepEqual(await runtime.db.prepare('SELECT * FROM subscriber_directory WHERE id=?').bind(row.id).first(), row, 'the expired invitation changes no subscriber');
  const run = await (await runtime.runtime.getWorker()).scheduled({ cron: '* * * * *', scheduledTime: deadline });
  assert.equal(run.outcome, 'ok');
  assert.equal(await runtime.db.prepare('SELECT id FROM subscriber_directory WHERE id=?').bind(row.id).first(), null);
  const repeated = await api(path, {});
  assert.equal(repeated.status, 200, JSON.stringify(repeated.body));
  assert.equal(repeated.body.invites.sent, 0);
  assert.equal(runtime.messages.length, mailBefore);
  const undone = await moveIn.undo(imported.body.door);
  assert.equal(undone.status, 200, JSON.stringify(undone.body));
}
