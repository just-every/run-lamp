import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';
import { openSubscriberManagementFixture } from './subscriber-management-fixture.mjs';

/** Bulk consented subscriptions are fixture prerequisites. Publication, Cron,
 * Queue replay and the paginated operator log use the real Worker doors. The
 * only replaced effect is Resend's network edge, with its stated local quota. */
export async function emailCapacityFlow(t) {
  const capacity = 1_000, acknowledgementMs = 100, quota = 10;
  const expected = Array.from({ length: capacity }, (_, index) => ({
    subscriberId: `01JLIMIT${String(index + 1).padStart(18, '0')}`,
    destination: [`synthetic-lamp-limit-${index + 1}`, 'example.test'].join('@'),
  }));
  const accepted = [], rejected = [];
  let publishedAt, publishedWallTime;
  const fixture = await openSubscriberManagementFixture({
    workerEntry: 'tests/e2e/helpers/status-journey.worker.ts',
    providerEdge: async request => {
      const url = new URL(request.url), key = request.headers.get('Idempotency-Key');
      if (url.origin !== 'https://api.resend.com' || url.pathname !== '/emails' || !key?.startsWith('notification/')) return;
      const message = await request.json();
      await delay(acknowledgementMs);
      const now = performance.now();
      // A sliding window enforces the quota rather than silently pacing the app.
      if (accepted.filter(row => now - row.at < 1_000).length >= quota) {
        rejected.push(key);
        return Response.json({ message: 'Synthetic Lamp acceptance quota exceeded' }, { status: 429 });
      }
      const providerId = `synthetic-lamp-capacity-${accepted.length + 1}`;
      accepted.push({ key, providerId, at: now, message });
      return Response.json({ id: providerId });
    },
  });
  const pause = async paused => assert.equal((await fixture.raw('/test/effects', {
    method: 'PUT', body: JSON.stringify({ paused }),
  })).status, 204);
  const readDeliveries = async updateId => {
    const rows = [];
    for (let offset = 0; ; offset += 73) {
      const response = await fixture.api(`/api/app/deliveries?incidentUpdateId=${updateId}&limit=73&offset=${offset}`);
      assert.equal(response.status, 200, response.text);
      assert.equal(response.body.offset, offset);
      assert.equal(response.body.limit, 73);
      rows.push(...response.body.deliveries);
      if (!response.body.hasMore) return rows;
      assert.equal(response.body.deliveries.length, 73, 'every nonterminal page is complete');
      assert.ok(rows.length <= capacity, 'pagination makes bounded forward progress');
    }
  };
  const identity = rows => rows.map(row => ({ id: row.id, subscriberId: row.subscriberId,
    destination: row.destination, channel: row.channel, incidentUpdateId: row.incidentUpdateId }))
    .sort((left, right) => left.id.localeCompare(right.id));
  try {
    await pause(true);
    const seededAt = new Date().toISOString();
    for (let offset = 0; offset < expected.length; offset += 100) {
      await fixture.db.batch(expected.slice(offset, offset + 100).map(row => fixture.db.prepare(`
        INSERT INTO subscribers(id,channel,destination,state,selection_mode,token_hash,created_at,updated_at)
        VALUES (?,'email',?,'active','all',?,?,?)`)
        .bind(row.subscriberId, row.destination, `synthetic-lamp-capacity-${row.subscriberId}`, seededAt, seededAt)));
    }
    const subscribers = await fixture.list(73);
    assert.equal(subscribers.length, capacity);
    assert.ok(subscribers.every(row => row.state === 'active' && row.channel === 'email'));
    assert.deepEqual(subscribers.map(row => ({ subscriberId: row.id, destination: row.destination }))
      .sort((left, right) => left.subscriberId.localeCompare(right.subscriberId)), expected,
    'the independent fixture manifest reconciles the entire eligible subscriber inventory');
    const component = await fixture.createComponent('Synthetic Lamp capacity API');
    const created = await fixture.post('/api/app/incidents', { title: 'Synthetic Lamp capacity publication',
      components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }] });
    assert.equal(created.status, 201, created.text);
    const incidentId = created.body.incident.id;
    const saved = await fixture.api(`/api/app/incidents/${incidentId}/draft`, { method: 'PUT', body: JSON.stringify({
      lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp capacity readers',
      customerImpact: 'Capacity requests are delayed.', whatStillWorks: 'The dashboard remains available.',
      details: 'Operators are restoring the capacity API.', nextUpdateAt: new Date(Date.now() + 3_600_000).toISOString(),
    }) });
    assert.equal(saved.status, 200, saved.text);
    const publicationStarted = Date.now();
    const publication = await fixture.post(`/api/app/incidents/${incidentId}/publish`, { channels: ['email'] });
    publishedAt = performance.now();
    publishedWallTime = Date.now();
    assert.equal(publication.status, 200, publication.text);
    const updateId = publication.body.update.id;
    const committed = await readDeliveries(updateId);
    assert.equal(committed.length, capacity, 'publication commits the complete fixed recipient set');
    assert.equal(new Set(committed.map(row => row.id)).size, capacity, 'delivery identities are unique across pages');
    assert.deepEqual(committed.map(row => ({ subscriberId: row.subscriberId, destination: row.destination }))
      .sort((left, right) => left.subscriberId.localeCompare(right.subscriberId)), expected,
    'duplicates cannot conceal a missing eligible recipient');
    assert.ok(committed.every(row => row.channel === 'email' && row.incidentUpdateId === updateId
      && row.outcome === 'queued' && row.providerAcceptedAt === null && row.outcomeAt === null));
    assert.equal(accepted.length, 0, 'successful publication does not wait for provider acceptance');

    // Include a full scheduler interval in the five-minute publication deadline.
    await delay(Math.max(0, 60_000 - (performance.now() - publishedAt)));
    await pause(false);
    const worker = await fixture.runtime.getWorker();
    const scheduled = await worker.scheduled({ cron: '* * * * *', scheduledTime: Date.now() });
    assert.equal(scheduled.outcome, 'ok', 'the native scheduled door drains committed email work');
    const delivered = await readDeliveries(updateId);
    assert.deepEqual(identity(delivered), identity(committed), 'dispatch preserves every committed delivery identity');
    assert.equal(accepted.length, capacity, 'the synthetic provider actually accepts every email');
    assert.equal(rejected.length, 0, 'dispatch respects the ten-acceptance rolling-second quota');
    assert.equal(new Set(accepted.map(row => row.providerId)).size, capacity);
    assert.equal(new Set(accepted.map(row => row.key)).size, capacity, 'each delivery crosses the provider edge once');
    assert.deepEqual(accepted.flatMap(row => row.message.to).sort(), expected.map(row => row.destination).sort(),
      'actual provider recipients exactly match the independently expected eligible recipients');
    const attempts = (await fixture.db.prepare(`SELECT a.delivery_id AS deliveryId, a.provider_message_id AS providerId,
      a.attempted_at AS attemptedAt, a.error FROM notification_attempt_records a
      JOIN notification_delivery_records d ON d.id = a.delivery_id WHERE d.incident_update_id = ? ORDER BY a.delivery_id`)
      .bind(updateId).all()).results;
    assert.equal(attempts.length, capacity, 'each committed recipient has exactly one persisted acceptance mapping');
    for (const delivery of delivered) {
      const matches = accepted.filter(row => row.key === `notification/${delivery.id}`);
      assert.equal(matches.length, 1, `exactly one provider acceptance for ${delivery.id}`);
      const [receipt] = matches, attempt = attempts.find(row => row.deliveryId === delivery.id);
      assert.deepEqual(receipt.message.to, [delivery.destination], 'the delivery identity maps to its own recipient');
      assert.ok(receipt.message.text.includes(created.body.incident.reference));
      assert.ok(receipt.message.text.includes('Capacity requests are delayed.'));
      assert.ok(attempt && attempt.providerId === receipt.providerId && attempt.error === null,
        'the committed attempt retains the actual accepting provider identifier');
      assert.equal(delivery.providerAcceptedAt, attempt.attemptedAt);
      assert.ok(Date.parse(delivery.providerAcceptedAt) >= publicationStarted
        && Date.parse(delivery.providerAcceptedAt) <= publishedWallTime + 300_000,
      'every persisted acceptance meets the publication deadline');
      assert.ok(receipt.at >= publishedAt && receipt.at - publishedAt <= 300_000,
        'every actual provider acceptance meets the measured five-minute deadline');
      assert.equal(delivery.outcome, 'queued', 'provider acceptance is not person-confirmed delivery');
      assert.equal(delivery.outcomeAt, null);
    }
    const replay = await worker.queue('lamp-follow-ups-jobs', [{ id: 'synthetic-lamp-capacity-replay-1',
      timestamp: new Date(), attempts: 2, body: { type: 'delivery-dispatch', eventId: updateId } }]);
    assert.equal(replay.outcome, 'ok', 'the native Queue door accepts replay of the capacity publication');
    assert.equal(accepted.length, capacity, 'Queue replay sends no duplicate accepted email');
    assert.deepEqual(identity(await readDeliveries(updateId)), identity(committed));
    const latencies = accepted.map(row => row.at - publishedAt).sort((a, b) => a - b);
    t.diagnostic(JSON.stringify({ probe: 'NOTIFY-002', recipients: capacity, persistedAcceptances: attempts.length,
      actualAcceptances: accepted.length, quotaPerSecond: quota, acknowledgementMs, schedulerDelayMs: 60_000,
      p95Ms: latencies[Math.ceil(latencies.length * 0.95) - 1], lastAcceptanceMs: latencies.at(-1),
      duplicateRecipients: capacity - new Set(accepted.flatMap(row => row.message.to)).size }));
  } finally { await fixture.close(); }
}
