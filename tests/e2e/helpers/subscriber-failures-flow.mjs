import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { openSubscriberManagementFixture, eventuallySubscriber, pageOrigin } from './subscriber-management-fixture.mjs';

/** Only the provider and receiver edges are synthetic. Consent, publication,
 * signed receipts, Queue dispatch and Cron all use the migrated Worker. */
export async function subscriberFailuresFlow() {
  let receiverStatus = 204;
  const fixture = await openSubscriberManagementFixture({
    workerEntry: 'tests/e2e/helpers/status-journey.worker.ts',
    webhookReceiver: () => new Response(null, { status: receiverStatus }),
  });
  const { api, post, raw } = fixture;
  const pause = async paused => assert.equal((await raw('/test/effects', {
    method: 'PUT', body: JSON.stringify({ paused }),
  })).status, 204);
  const subscriber = async id => {
    const row = (await fixture.list()).find(row => row.id === id);
    assert.ok(row, 'the native operator inventory retains this subscriber');
    return row;
  };
  const deliveries = async update => {
    const response = await api(`/api/app/deliveries?incidentUpdateId=${update.id}&limit=100`);
    assert.equal(response.status, 200, response.text);
    return response.body.deliveries;
  };
  const publish = async (component, label, channels) => {
    const created = await post('/api/app/incidents', {
      title: `Synthetic Lamp ${label}`,
      components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }],
    });
    assert.equal(created.status, 201, created.text);
    const id = created.body.incident.id;
    const draft = await api(`/api/app/incidents/${id}/draft`, {
      method: 'PUT', body: JSON.stringify({ lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp readers',
        customerImpact: `Requests are delayed: ${label}.`, whatStillWorks: 'The dashboard is available.',
        details: 'Operators are restoring service.', nextUpdateAt: new Date(Date.now() + 3_600_000).toISOString() }),
    });
    assert.equal(draft.status, 200, draft.text);
    const published = await post(`/api/app/incidents/${id}/publish`, { channels });
    assert.equal(published.status, 200, published.text);
    return published.body.update;
  };
  let dispatchNumber = 0;
  const dispatch = async update => {
    await pause(false);
    try {
      return await (await fixture.runtime.getWorker()).queue('lamp-follow-ups-jobs', [{
        id: `synthetic-lamp-failure-dispatch-${++dispatchNumber}`, timestamp: new Date(), attempts: dispatchNumber,
        body: { type: 'delivery-dispatch', eventId: update.id },
      }]);
    } finally { await pause(true); }
  };
  const scheduled = async () => {
    await pause(false);
    try {
      const result = await (await fixture.runtime.getWorker()).scheduled({ scheduledTime: Date.now(), cron: '* * * * *' });
      assert.equal(result.outcome, 'ok', 'the actual scheduled entry point drains due work');
    } finally { await pause(true); }
  };
  const add = async (component, label, channel = 'email') => {
    const address = [`synthetic-lamp-${label}`, 'example.test'].join('@');
    const response = await post('/api/app/subscribers', {
      channel, ...(channel === 'email' ? { email: address } : {
        destination: 'https://receiver.example.test/synthetic-lamp-1', contactEmail: address,
      }), componentIds: [component.id], eventKinds: ['incidents'],
    });
    assert.equal(response.status, 201, response.text);
    assert.equal(response.body.subscriber.state, 'pending');
    await fixture.confirm(address);
    assert.equal((await subscriber(response.body.subscriber.id)).state, 'active');
    return { id: response.body.subscriber.id, address };
  };
  let receiptNumber = 0;
  const receipt = (delivery, type, bounceType) => {
    const accepted = fixture.mailReceipts.find(row => row.idempotencyKey === `notification/${delivery.id}`);
    assert.ok(accepted, 'the receipt identifies the actual accepted notification');
    const id = `synthetic-lamp-failure-receipt-${++receiptNumber}`;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: `email.${type}`, data: {
      email_id: accepted.id, ...(bounceType ? { bounce: { type: bounceType } } : {}),
    } });
    const signature = createHmac('sha256', Buffer.from('synthetic-lamp-subscriber-receipts'))
      .update(`${id}.${timestamp}.${body}`).digest('base64url');
    return { method: 'POST', body, headers: { 'Content-Type': 'application/json',
      'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` } };
  };
  const sendReceipt = async request => {
    const response = await raw(`${pageOrigin}/api/intake/mail-events`, request);
    assert.equal(response.status, 200, await response.text());
  };
  const acceptedMail = async (component, label, target) => {
    const update = await publish(component, label, ['email']);
    assert.equal((await dispatch(update)).outcome, 'ok');
    const rows = await eventuallySubscriber(() => deliveries(update),
      rows => rows.some(row => row.subscriberId === target.id && row.providerAcceptedAt), 'native delivery records provider acceptance');
    const row = rows.find(row => row.subscriberId === target.id);
    assert.equal(row.outcome, 'queued', 'provider acceptance alone does not claim delivery');
    assert.ok(fixture.messagesFor(target.address).some(message => message.text.includes(`Requests are delayed: ${label}.`)));
    return row;
  };
  const deactivated = async (target, reason, earliest) => {
    const row = await subscriber(target.id);
    assert.equal(row.state, 'deactivated');
    assert.equal(row.deactivationReason, reason);
    assert.ok(Date.parse(row.deactivatedAt) >= earliest && Date.parse(row.deactivatedAt) <= Date.now(), 'the operator sees the actual bounded deactivation instant');
    return row;
  };
  const noFutureMail = async (component, target, label) => {
    const before = fixture.messagesFor(target.address).length;
    const update = await publish(component, label, ['email']);
    assert.equal((await dispatch(update)).outcome, 'ok');
    assert.ok(!(await deliveries(update)).some(row => row.subscriberId === target.id), 'a fresh publication excludes the deactivated address');
    assert.equal(fixture.messagesFor(target.address).length, before, 'no later notification reaches the deactivated address');
    return update;
  };
  try {
    fixture.recoverWebhook();
    const hardComponent = await fixture.createComponent('Synthetic Lamp hard bounce');
    const complaintComponent = await fixture.createComponent('Synthetic Lamp complaint');
    const softComponent = await fixture.createComponent('Synthetic Lamp soft bounces');
    const webhookComponent = await fixture.createComponent('Synthetic Lamp webhook failures');
    const hard = await add(hardComponent, 'hard-bounce');
    const complaint = await add(complaintComponent, 'complaint');
    const healthy = await add(complaintComponent, 'healthy');
    const soft = await add(softComponent, 'soft-bounce');
    const webhook = await add(webhookComponent, 'webhook-contact', 'webhook');
    await pause(true);

    const hardDelivery = await acceptedMail(hardComponent, 'hard bounce notification', hard);
    const hardAt = Date.now();
    await sendReceipt(receipt(hardDelivery, 'bounced', 'Permanent'));
    await deactivated(hard, 'hard bounce', hardAt);
    await noFutureMail(hardComponent, hard, 'after hard bounce');

    const complaintDelivery = await acceptedMail(complaintComponent, 'complaint notification', complaint);
    const queuedComplaint = await publish(complaintComponent, 'queued before complaint', ['email']);
    const committedComplaint = (await deliveries(queuedComplaint)).find(row => row.subscriberId === complaint.id);
    assert.equal(committedComplaint.outcome, 'queued');
    assert.equal(committedComplaint.providerAcceptedAt, null);
    const signedComplaint = receipt(complaintDelivery, 'complained');
    const beforeInvalid = await subscriber(complaint.id);
    const invalid = await raw(`${pageOrigin}/api/intake/mail-events`, {
      ...signedComplaint, headers: { ...signedComplaint.headers, 'svix-signature': 'v1,synthetic-lamp-invalid' },
    });
    assert.equal(invalid.status, 401, 'an unauthenticated complaint cannot deactivate a subscriber');
    assert.deepEqual(await subscriber(complaint.id), beforeInvalid);
    const complaintAt = Date.now();
    await sendReceipt(signedComplaint);
    const stoppedComplaint = await deactivated(complaint, 'spam complaint', complaintAt);
    const complaintMailCount = fixture.messagesFor(complaint.address).length;
    assert.equal((await dispatch(queuedComplaint)).outcome, 'ok');
    const suppressedComplaint = (await deliveries(queuedComplaint)).find(row => row.id === committedComplaint.id);
    assert.equal(suppressedComplaint.outcome, 'suppressed');
    assert.ok(suppressedComplaint.outcomeAt);
    const healthyBefore = fixture.messagesFor(healthy.address).length;
    const freshComplaint = await noFutureMail(complaintComponent, complaint, 'fresh publication after complaint');
    assert.equal(fixture.messagesFor(healthy.address).length, healthyBefore + 1, 'the same fresh publication still reaches an active control');
    assert.ok((await deliveries(freshComplaint)).some(row => row.subscriberId === healthy.id && row.providerAcceptedAt));
    await sendReceipt(signedComplaint);
    await sendReceipt(receipt(complaintDelivery, 'delivered'));
    assert.deepEqual(await subscriber(complaint.id), stoppedComplaint, 'replayed complaints and late delivery receipts cannot restore consent or rewrite the reason');
    assert.equal(fixture.messagesFor(complaint.address).length, complaintMailCount, 'queued and fresh complaint suppression make zero additional transport requests');

    // A successful notification breaks the earlier bounce streak. Only the
    // subsequent completed outcomes count, even with newer queued recipients.
    for (let index = 0; index < 10; index++) {
      const delivery = await acceptedMail(softComponent, `soft bounce sequence ${index}`, soft);
      const softAt = Date.now();
      if (index === 9) {
        const backlog = await publish(softComponent, 'newer queued soft bounce control', ['email']);
        assert.equal((await deliveries(backlog))[0].outcome, 'queued');
      }
      await sendReceipt(receipt(delivery, index === 4 ? 'delivered' : 'bounced', index === 4 ? undefined : 'Transient'));
      if (index < 9) assert.equal((await subscriber(soft.id)).state, 'active', 'fewer than five consecutive soft-bounced notifications retain the subscription');
      else await deactivated(soft, 'five consecutive soft bounces', softAt);
    }
    await noFutureMail(softComponent, soft, 'after five soft bounces');

    const control = await publish(webhookComponent, 'healthy webhook control', ['webhook']);
    assert.equal((await dispatch(control)).outcome, 'ok');
    assert.equal((await deliveries(control))[0].outcome, 'delivered', 'the confirmed endpoint accepts a real publication');
    receiverStatus = 503;
    const failedUpdates = [];
    for (let index = 0; index < 10; index++) failedUpdates.push(await publish(webhookComponent, `failed webhook ${index}`, ['webhook']));
    const backlog = [];
    for (let index = 0; index < 2; index++) {
      const update = await publish(webhookComponent, `retained webhook backlog ${index}`, ['webhook']);
      const [delivery] = await deliveries(update);
      assert.equal(delivery.subscriberId, webhook.id);
      assert.equal(delivery.outcome, 'queued');
      backlog.push({ update, delivery });
    }
    const webhookAt = Date.now();
    for (let index = 0; index < failedUpdates.length; index++) {
      const update = failedUpdates[index];
      const [committed] = await deliveries(update);
      assert.equal(committed.outcome, 'queued');
      for (let attempt = 0; (await deliveries(update))[0].outcome === 'queued'; attempt++) {
        assert.ok(attempt < 10, 'native Queue retries terminate this failed notification');
        await dispatch(update);
      }
      const [failed] = await deliveries(update);
      assert.equal(failed.id, committed.id);
      assert.equal(failed.outcome, 'failed');
      assert.ok(failed.outcomeAt);
      assert.ok(fixture.webhookRequests.some(record => record.headers['webhook-id'] === failed.id), 'each terminal outcome came from actual receiver requests');
      if (index < 9) {
        assert.equal((await subscriber(webhook.id)).state, 'active', 'retries of fewer than ten failed notifications do not deactivate the endpoint');
        assert.equal(fixture.messagesFor(webhook.address).filter(message => /disabled a failing webhook/i.test(message.subject)).length, 0);
      }
    }
    const stoppedWebhook = await deactivated(webhook, 'ten consecutive webhook delivery failures', webhookAt);
    for (const { update, delivery } of backlog) {
      const [retained] = await deliveries(update);
      assert.equal(retained.id, delivery.id);
      assert.equal(retained.outcome, 'queued', 'newer committed backlog remained unsent while failures accumulated');
      assert.ok(!fixture.webhookRequests.some(record => record.headers['webhook-id'] === delivery.id));
    }
    const requestsAtDeactivation = fixture.webhookRequests.length;
    await scheduled();
    for (const { update, delivery } of backlog) {
      const [suppressed] = await deliveries(update);
      assert.equal(suppressed.id, delivery.id, 'Cron preserves the original committed recipient identity');
      assert.equal(suppressed.outcome, 'suppressed');
      assert.ok(suppressed.outcomeAt);
      assert.equal(suppressed.providerAcceptedAt, null);
      assert.equal((await dispatch(update)).outcome, 'ok', 'Queue replay consumes the already-suppressed backlog');
    }
    assert.equal(fixture.webhookRequests.length, requestsAtDeactivation, 'Cron and Queue make zero additional receiver requests after automatic deactivation');
    const alerts = fixture.messagesFor(webhook.address).filter(message => /disabled a failing webhook/i.test(message.subject));
    assert.equal(alerts.length, 1, 'Cron sends the endpoint contact one deactivation alert');
    assert.match(alerts[0].text, /ten consecutive failed deliveries/);
    const futureWebhook = await publish(webhookComponent, 'after webhook deactivation', ['webhook']);
    assert.deepEqual(await deliveries(futureWebhook), []);
    assert.equal((await dispatch(futureWebhook)).outcome, 'ok');
    await scheduled();
    assert.equal(fixture.webhookRequests.length, requestsAtDeactivation);
    assert.equal(fixture.messagesFor(webhook.address).filter(message => /disabled a failing webhook/i.test(message.subject)).length, 1, 'scheduled replay does not duplicate the contact alert');
    assert.deepEqual(await subscriber(webhook.id), stoppedWebhook);
  } finally { await fixture.close(); }
}
