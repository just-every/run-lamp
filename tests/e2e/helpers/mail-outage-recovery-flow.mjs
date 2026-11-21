import assert from 'node:assert/strict';
import { openSubscriberManagementFixture, eventuallySubscriber, pageOrigin } from './subscriber-management-fixture.mjs';

const bySubscriber = (a, b) => a.subscriberId.localeCompare(b.subscriberId);
const identity = ({ id, subscriberId, destination, channel, incidentUpdateId, queuedAt }) =>
  ({ id, subscriberId, destination, channel, incidentUpdateId, queuedAt });

export async function mailOutageRecoveryFlow(t) {
  const rejected = [], accepted = [];
  const rejection = 'Synthetic Lamp mail temporarily rate limited before acceptance.';
  let providerAvailable = false;
  const fixture = await openSubscriberManagementFixture({
    workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts',
    providerEdge: async request => {
      const idempotencyKey = request.headers.get('Idempotency-Key');
      if (request.url !== 'https://api.resend.com/emails' || !idempotencyKey?.startsWith('notification/')) return;
      const wireBody = await request.text();
      if (!providerAvailable) {
        rejected.push({ idempotencyKey, wireBody });
        return Response.json({ message: rejection }, { status: 429 });
      }
      const id = 'synthetic-lamp-recovered-mail-' + (accepted.length + 1);
      accepted.push({ id, idempotencyKey, wireBody });
      return Response.json({ id });
    },
  });
  try {
    const { api, post, raw, db } = fixture;
    const worker = await fixture.runtime.getWorker();
    const advance = async now => assert.equal((await raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now }) })).status, 204);
    const start = Date.now() + 10_000;
    const publishedAt = new Date(start).toISOString();
    await advance(start);
    const affected = await fixture.createComponent('Synthetic Lamp search');
    const unrelated = await fixture.createComponent('Synthetic Lamp billing');
    const subscribe = async (number, componentIds) => {
      const destination = ['synthetic-lamp-recovery-' + number, 'example.test'].join('@');
      const added = await post('/api/app/subscribers', { channel: 'email', email: destination, componentIds, eventKinds: ['incidents'] });
      assert.equal(added.status, 201, added.text);
      await fixture.confirm(destination);
      return { subscriberId: added.body.subscriber.id, destination };
    };
    const selected = [await subscribe(1, [affected.id]), await subscribe(2, [])].sort(bySubscriber);
    const control = await subscribe(3, [unrelated.id]);
    const active = await fixture.list();
    assert.deepEqual(active.filter(row => row.state === 'active').map(row => row.id).sort(),
      [...selected, control].map(row => row.subscriberId).sort(), 'the selected addresses and unrelated control are all active');

    const created = await post('/api/app/incidents', {
      title: 'Synthetic Lamp delayed search indexing',
      components: [{ componentId: affected.id, state: 'Partially unavailable', relationship: 'Primary' }],
    });
    assert.equal(created.status, 201, created.text);
    const { id: incidentId, reference } = created.body.incident;
    const incidentPath = '/api/app/incidents/' + incidentId;
    const wording = {
      lifecycle: 'Identified',
      affectedAudience: 'Readers of newly indexed records',
      customerImpact: 'Search results are missing recent records.',
      whatStillWorks: 'Previously indexed records are still available.',
      details: 'Operators are restoring the indexing workers.',
      nextUpdateAt: new Date(start + 7_200_000).toISOString(),
    };
    const saved = await api(incidentPath + '/draft', { method: 'PUT', body: JSON.stringify(wording) });
    assert.equal(saved.status, 200, saved.text);
    const { id: updateId } = saved.body.draft;
    const publication = { method: 'POST', headers: { 'If-Match': updateId + ':0' }, body: JSON.stringify({ channels: ['email'] }) };
    const published = await api(incidentPath + '/publish', publication);
    assert.equal(published.status, 200, published.text);
    assert.equal(published.body.update.id, updateId);
    assert.equal(published.body.update.publishedAt, publishedAt);

    const readDeliveries = async () => {
      const response = await api('/api/app/deliveries?incidentUpdateId=' + updateId);
      assert.equal(response.status, 200, response.text);
      assert.equal(response.body.hasMore, false);
      return response.body.deliveries.sort(bySubscriber);
    };
    const readCommittedUpdate = async () => {
      const response = await api(incidentPath);
      assert.equal(response.status, 200, response.text);
      assert.equal(response.body.incident.draft, null);
      return response.body.incident.updates;
    };
    const readFrozen = async () => (await db.prepare(
      'SELECT id, mail_payload_json FROM notification_delivery_records WHERE incident_update_id=? ORDER BY id',
    ).bind(updateId).all()).results;
    const readOutbox = () => db.prepare(
      "SELECT id, available_at, completed_at, failed_at FROM notification_outbox WHERE kind='delivery-dispatch' AND aggregate_id=?",
    ).bind(updateId).first();

    const queued = await eventuallySubscriber(readDeliveries,
      rows => rows.length === selected.length && rows.every(row => row.latestError === rejection),
      'native publication records the pre-acceptance mail failure for every selected recipient');
    assert.deepEqual(queued.map(({ subscriberId, destination, channel, incidentUpdateId, queuedAt, outcome, providerAcceptedAt }) =>
      ({ subscriberId, destination, channel, incidentUpdateId, queuedAt, outcome, providerAcceptedAt })),
    selected.map(row => ({ ...row, channel: 'email', incidentUpdateId: updateId, queuedAt: publishedAt, outcome: 'queued', providerAcceptedAt: null })));
    assert.deepEqual(await readCommittedUpdate(), [published.body.update]);
    const publicUpdate = await raw(pageOrigin + '/incidents/' + reference);
    assert.equal(publicUpdate.status, 200);
    assert.ok((await publicUpdate.text()).includes(wording.customerImpact), 'the committed wording is readable publicly while mail is down');
    const committed = queued.map(identity);
    assert.equal(new Set(committed.map(row => row.id)).size, selected.length);
    const frozen = await readFrozen();
    assert.deepEqual(frozen.map(row => row.id), committed.map(row => row.id).sort());
    const expectedKeys = committed.map(row => 'notification/' + row.id).sort();
    assert.deepEqual(rejected.map(row => row.idempotencyKey).sort(), expectedKeys);
    assert.deepEqual(accepted, [], 'a rejected request creates no provider acceptance');
    for (const row of committed) {
      const envelope = JSON.parse(frozen.find(entry => entry.id === row.id).mail_payload_json);
      const wire = JSON.parse(rejected.find(entry => entry.idempotencyKey === 'notification/' + row.id).wireBody);
      assert.equal(envelope.idempotencyKey, 'notification/' + row.id);
      assert.equal(envelope.to, row.destination);
      assert.deepEqual(wire.to, [row.destination]);
      assert.equal(wire.subject, envelope.subject);
      assert.equal(wire.text, envelope.text);
      assert.ok(wire.text.includes(wording.customerImpact));
    }
    const outbox = await eventuallySubscriber(readOutbox,
      row => row && Date.parse(row.available_at) > start && !row.completed_at && !row.failed_at,
      'the unsuccessful send leaves a durable retry deadline');
    const eligibleAt = Date.parse(outbox.available_at);

    // A live rename would change a freshly rendered message. A new matching
    // subscriber would join a newly selected audience. Neither changes this job.
    const settingsPath = '/api/app/page-settings';
    const pageSettings = await api(settingsPath);
    assert.equal(pageSettings.status, 200, pageSettings.text);
    const { settings } = pageSettings.body;
    const renamed = await api(settingsPath, { method: 'PUT', body: JSON.stringify({
      ...Object.fromEntries(['tagline', 'accentColor', 'timezone', 'hostname', 'mailFromAddress', 'template', 'footerCreditEnabled'].map(key => [key, settings[key]])),
      pageName: 'Synthetic Lamp renamed after publication',
    }) });
    assert.equal(renamed.status, 200, renamed.text);
    assert.equal(renamed.body.settings.pageName, 'Synthetic Lamp renamed after publication');
    const lateSubscriber = await subscribe(4, [affected.id]);
    assert.equal((await fixture.list()).find(row => row.id === lateSubscriber.subscriberId).state, 'active');

    const cron = async now => assert.equal((await worker.scheduled({ cron: '* * * * *', scheduledTime: now })).outcome, 'ok');
    const queue = async (now, attempt) => assert.equal((await worker.queue('lamp-follow-ups-jobs', [{
      id: 'synthetic-lamp-recovery-queue-' + attempt, timestamp: new Date(now), attempts: attempt,
      body: { type: 'delivery-dispatch', eventId: updateId },
    }])).outcome, 'ok');

    providerAvailable = true;
    await advance(eligibleAt - 1);
    await cron(eligibleAt - 1);
    await queue(eligibleAt - 1, 1);
    assert.deepEqual(accepted, [], 'neither dispatch door spends a retry before eligibility');
    assert.deepEqual(await readDeliveries(), queued);
    await advance(eligibleAt);
    await cron(eligibleAt);
    await queue(eligibleAt, 2);
    const awaitingReceipts = await readDeliveries();
    assert.deepEqual(awaitingReceipts.map(identity), committed);
    assert.deepEqual(awaitingReceipts.map(({ outcome, providerAcceptedAt }) => ({ outcome, providerAcceptedAt })),
      selected.map(() => ({ outcome: 'queued', providerAcceptedAt: outbox.available_at })));
    assert.deepEqual(await readFrozen(), frozen, 'recovery preserves the durable envelope bytes');
    assert.deepEqual(accepted.map(row => row.idempotencyKey).sort(), expectedKeys, 'only the original selected recipients are accepted once each');
    for (const delivery of committed) {
      const idempotencyKey = 'notification/' + delivery.id;
      const receipt = accepted.find(row => row.idempotencyKey === idempotencyKey);
      assert.equal(receipt.wireBody, rejected.find(row => row.idempotencyKey === idempotencyKey).wireBody, 'retry submits the original provider payload byte for byte');
      const attempts = (await db.prepare(
        'SELECT attempted_at, provider_message_id, error FROM notification_attempt_records WHERE delivery_id=? ORDER BY attempt_number',
      ).bind(delivery.id).all()).results;
      assert.deepEqual(attempts, [
        { attempted_at: publishedAt, provider_message_id: null, error: rejection },
        { attempted_at: outbox.available_at, provider_message_id: receipt.id, error: null },
      ], 'the original delivery retains the rejected attempt and then the same-provider acceptance');
    }
    assert.equal((await readOutbox()).completed_at, outbox.available_at);

    const receiptAt = eligibleAt + 1_000;
    await advance(receiptAt);
    for (const receipt of accepted) await fixture.sendDeliveryReceipt(receipt, receiptAt);
    const delivered = await readDeliveries();
    assert.deepEqual(delivered.map(identity), committed);
    assert.deepEqual(delivered.map(({ outcome, outcomeAt }) => ({ outcome, outcomeAt })),
      selected.map(() => ({ outcome: 'delivered', outcomeAt: new Date(receiptAt).toISOString() })));

    const completed = await readOutbox();
    assert.equal(completed.id, outbox.id);
    assert.equal((await api(incidentPath + '/publish', publication)).status, 409);
    for (const receipt of accepted) await fixture.sendDeliveryReceipt(receipt, receiptAt);
    const replayAt = eligibleAt + 600_000;
    await advance(replayAt);
    await cron(replayAt);
    await queue(replayAt, 3);
    assert.deepEqual(await readCommittedUpdate(), [published.body.update]);
    assert.deepEqual(await readDeliveries(), delivered);
    assert.deepEqual(await readFrozen(), frozen);
    assert.deepEqual(await readOutbox(), completed);
    assert.deepEqual(accepted.map(row => row.idempotencyKey).sort(), expectedKeys, 'publication, receipt and dispatch replay remain silent');
    assert.deepEqual(rejected.map(row => row.idempotencyKey).sort(), expectedKeys);

    t.diagnostic('PROBE NOTIFY-009 1: native publish during Resend HTTP 429 -> HTTP 200, exact committed public wording and two selected queued email identities, zero provider acceptances.');
    t.diagnostic('PROBE NOTIFY-009 3: controlled native Cron and Queue at durable eligibility -> two original envelopes accepted once, signed receipts marked both delivered, controls and replays silent.');
  } finally {
    await fixture.close();
  }
}
