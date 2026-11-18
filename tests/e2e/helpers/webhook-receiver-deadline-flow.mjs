import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openSubscriberManagementFixture, eventuallySubscriber } from './subscriber-management-fixture.mjs';

export async function webhookReceiverDeadlineFlow(t) {
  const receiverUrl = 'https://receiver.example.test/synthetic-lamp-deadline';
  const redirectUrl = 'https://receiver.example.test/synthetic-lamp-redirect-target';
  const deadlineMs = 30_000;
  const requests = [], followed = [], responses = new Map();
  const fixture = await openSubscriberManagementFixture({
    workerEntry: 'tests/e2e/helpers/status-journey.worker.ts',
    providerEdge: async request => {
      if (request.url === redirectUrl) {
        followed.push(request.method);
        return new Response(null, { status: 204 });
      }
      if (request.url !== receiverUrl) return;
      await request.arrayBuffer();
      const deliveryId = request.headers.get('webhook-id');
      const receivedAt = performance.now();
      requests.push({ deliveryId, method: request.method, receivedAt });
      const { release, acknowledge, response } = responses.get(deliveryId);
      await release.promise;
      acknowledge.resolve({ status: response.status, elapsed: performance.now() - receivedAt });
      return response;
    },
  });
  const { raw, api, post } = fixture;
  const pause = async paused => assert.equal((await raw('/test/effects', {
    method: 'PUT', body: JSON.stringify({ paused }),
  })).status, 204);
  const dispatches = [];
  try {
    const component = await fixture.createComponent('Synthetic Lamp webhook deadline component');
    const contact = ['synthetic-lamp-deadline', 'example.test'].join('@');
    const added = await post('/api/app/subscribers', {
      channel: 'webhook', destination: receiverUrl, contactEmail: contact,
      componentIds: [component.id], eventKinds: ['incidents'],
    });
    assert.equal(added.status, 201, added.text);
    await fixture.confirm(contact);
    await pause(true);

    const publish = async label => {
      const created = await post('/api/app/incidents', {
        title: `Synthetic Lamp webhook ${label}`,
        components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }],
      });
      assert.equal(created.status, 201, created.text);
      const path = `/api/app/incidents/${created.body.incident.id}`;
      const saved = await api(`${path}/draft`, {
        method: 'PUT',
        body: JSON.stringify({ lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp readers',
          customerImpact: 'Requests are delayed.', whatStillWorks: 'The dashboard is available.',
          details: 'Operators are restoring service.', nextUpdateAt: new Date(Date.now() + 3_600_000).toISOString() }),
      });
      assert.equal(saved.status, 200, saved.text);
      const published = await post(`${path}/publish`, { channels: ['webhook'] });
      assert.equal(published.status, 200, published.text);
      const updateId = published.body.update.id;
      const read = async () => {
        const result = await api(`/api/app/deliveries?incidentUpdateId=${updateId}&channel=webhook`);
        assert.equal(result.status, 200, result.text);
        assert.equal(result.body.deliveries.length, 1);
        return result.body.deliveries[0];
      };
      const queued = await read();
      assert.equal(queued.subscriberId, added.body.subscriber.id);
      assert.equal(queued.outcome, 'queued');
      assert.equal(queued.latestError, null);
      return { updateId, read, deliveryId: queued.id };
    };
    const worker = await fixture.runtime.getWorker();
    const start = async (delivery, response) => {
      const release = Promise.withResolvers();
      const acknowledge = Promise.withResolvers();
      responses.set(delivery.deliveryId, { release, acknowledge, response });
      await pause(false);
      const startedAt = Date.now();
      const finished = worker.queue('lamp-follow-ups-jobs', [{
        id: `synthetic-lamp-deadline-${delivery.updateId}`, timestamp: new Date(startedAt), attempts: 1,
        body: { type: 'delivery-dispatch', eventId: delivery.updateId },
      }]);
      dispatches.push(finished);
      const request = await eventuallySubscriber(() => requests.find(row => row.deliveryId === delivery.deliveryId), Boolean, 'the real Queue dispatch reaches the receiver');
      await pause(true);
      return { release: release.resolve, acknowledged: acknowledge.promise, finished, startedAt, receivedAt: request.receivedAt };
    };

    const success = await publish('acknowledged');
    const timely = await start(success, new Response(null, { status: 204 }));
    assert.equal((await success.read()).outcome, 'queued', 'the receiver has not acknowledged the request');
    timely.release();
    const timelyAck = await timely.acknowledged;
    assert.equal(timelyAck.status, 204);
    assert.ok(timelyAck.elapsed < deadlineMs, 'the receiver responds within thirty seconds');
    assert.equal((await timely.finished).outcome, 'ok');
    const delivered = await success.read();
    assert.equal(delivered.id, success.deliveryId);
    assert.equal(delivered.outcome, 'delivered');
    assert.equal(delivered.latestError, null);

    const timeout = await publish('unanswered');
    const late = await start(timeout, new Response(null, { status: 204 }));
    await delay(Math.max(0, late.receivedAt + 29_000 - performance.now()));
    await eventuallySubscriber(timeout.read, row => Boolean(row.latestError), 'the unanswered receiver records a failure at the deadline');
    assert.equal((await late.finished).outcome, 'exception');
    const failed = await timeout.read();
    const failedAfter = Date.parse(failed.updatedAt) - late.startedAt;
    assert.equal(failed.id, timeout.deliveryId);
    assert.match(failed.latestError, /abort|timed? ?out|deadline/i);
    assert.ok(failedAfter >= deadlineMs, 'the real dispatch recorded failure after thirty seconds');
    assert.ok(failedAfter < deadlineMs + 2_000, 'the attempt fails close to the deadline, independently of the receiver response');
    assert.equal(failed.outcome, 'queued', 'the failed attempt can be retried');
    assert.equal(failed.outcomeAt, null);
    await delay(Math.max(0, late.receivedAt + deadlineMs + 100 - performance.now()));
    late.release();
    const lateAck = await late.acknowledged;
    assert.equal(lateAck.status, 204);
    assert.ok(lateAck.elapsed >= deadlineMs, 'the receiver sends its 2xx after the deadline');
    assert.deepEqual(await timeout.read(), failed, 'a late 2xx leaves the recorded failure and retry state intact');

    const redirect = await publish('redirected');
    const redirected = await start(redirect, Response.redirect(redirectUrl, 307));
    redirected.release();
    assert.equal((await redirected.finished).outcome, 'exception');
    const refused = await redirect.read();
    assert.equal(refused.id, redirect.deliveryId);
    assert.equal(refused.outcome, 'queued');
    assert.equal(refused.outcomeAt, null);
    assert.match(refused.latestError, /returned 307\b/);
    assert.deepEqual(followed, [], 'the redirect target receives no request, even though it would accept one');
    assert.deepEqual(requests.map(row => [row.deliveryId, row.method]), [
      [success.deliveryId, 'POST'], [timeout.deliveryId, 'POST'], [redirect.deliveryId, 'POST'],
    ]);
    t?.diagnostic(`Webhook receiver acknowledged in ${Math.round(timelyAck.elapsed)} ms, timed out in ${failedAfter} ms, ignored a 2xx at ${Math.round(lateAck.elapsed)} ms and refused a redirect without following it.`);
  } finally {
    for (const { release } of responses.values()) release.resolve();
    await Promise.allSettled(dispatches);
    await fixture.close();
  }
}
