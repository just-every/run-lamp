import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  addDeliveryLogEmails, assertDeliveryFact, assertDeliveryFilter,
  assertUntrackedNotification, deliveryIdentity,
} from './delivery-log-flow.mjs';
import { openSubscriberManagementFixture, eventuallySubscriber, pageOrigin } from './subscriber-management-fixture.mjs';
import { smsBindings, smsProviderEdge, smsSignature } from './sms-subscriber-flow.mjs';

/** Only the provider and receiver edges are synthetic. Consent, publication,
 * signed receipts, Queue dispatch and Cron all use the migrated Worker. */
export async function subscriberFailuresFlow(t, reconcileLog) {
  let receiverStatus = 204;
  const smsMessages = [];
  const fixture = await openSubscriberManagementFixture({
    workerEntry: 'tests/e2e/helpers/clocked-status-journey.worker.ts',
    webhookReceiver: () => new Response(null, { status: receiverStatus }),
    extraBindings: smsBindings, providerEdge: smsProviderEdge(smsMessages),
  });
  const { api, post, raw, db } = fixture;
  let clock;
  const now = () => clock ?? Date.now();
  const advanceToNextRetry = async updateId => {
    const job = await db.prepare("SELECT available_at FROM notification_outbox WHERE kind = 'delivery-dispatch' AND aggregate_id = ? AND completed_at IS NULL")
      .bind(updateId).first();
    const deadline = Date.parse(job?.available_at);
    assert.ok(deadline > now(), 'the next Queue retry has a future persisted deadline');
    const response = await raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: deadline }) });
    assert.equal(response.status, 204);
    clock = deadline;
  };
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
  const publicationWindows = new Map();
  const publish = async (component, label, channels, details = 'Operators are restoring service.') => {
    const created = await post('/api/app/incidents', {
      title: `Synthetic Lamp ${label}`,
      components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }],
    });
    assert.equal(created.status, 201, created.text);
    const id = created.body.incident.id;
    const draft = await api(`/api/app/incidents/${id}/draft`, {
      method: 'PUT', body: JSON.stringify({ lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp readers',
        customerImpact: `Requests are delayed: ${label}.`, whatStillWorks: 'The dashboard is available.',
        details, nextUpdateAt: new Date(now() + 3_600_000).toISOString() }),
    });
    assert.equal(draft.status, 200, draft.text);
    const start = now();
    const published = await post(`/api/app/incidents/${id}/publish`, { channels });
    const end = now();
    assert.equal(published.status, 200, published.text);
    publicationWindows.set(published.body.update.id, [start, end]);
    return published.body.update;
  };
  let dispatchNumber = 0;
  const dispatch = async update => {
    await pause(false);
    try {
      return await (await fixture.runtime.getWorker()).queue('lamp-follow-ups-jobs', [{
        id: `synthetic-lamp-failure-dispatch-${++dispatchNumber}`, timestamp: new Date(now()), attempts: dispatchNumber,
        body: { type: 'delivery-dispatch', eventId: update.id },
      }]);
    } finally { await pause(true); }
  };
  const scheduled = async () => {
    await pause(false);
    try {
      const result = await (await fixture.runtime.getWorker()).scheduled({ scheduledTime: now(), cron: '* * * * *' });
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
    return { id: response.body.subscriber.id, address, channel,
      destination: channel === 'email' ? address : 'https://receiver.example.test/synthetic-lamp-1' };
  };
  const addSms = async component => {
    const destination = '+12025550109';
    const added = await post('/api/app/subscribers', {
      channel: 'sms', phone: destination, componentIds: [component.id], eventKinds: ['incidents'],
    });
    assert.equal(added.status, 201, added.text);
    assert.equal(added.body.subscriber.state, 'pending');
    const url = fixture.publicOrigin + '/api/public/sms/inbound';
    const fields = { From: destination, To: smsBindings.TWILIO_FROM_NUMBER, Body: 'YES', MessageSid: 'synthetic-lamp-log-consent' };
    const confirmed = await raw(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Twilio-Signature': smsSignature(url, fields) },
      body: new URLSearchParams(fields).toString(),
    });
    assert.equal(confirmed.status, 200, await confirmed.text());
    return { id: added.body.subscriber.id, destination, channel: 'sms' };
  };
  const signReceipt = (id, body) => {
    const timestamp = String(Math.floor(now() / 1000));
    const signature = createHmac('sha256', Buffer.from('synthetic-lamp-subscriber-receipts'))
      .update(`${id}.${timestamp}.${body}`).digest('base64url');
    return { method: 'POST', body, headers: { 'Content-Type': 'application/json',
      'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` } };
  };
  let receiptNumber = 0;
  const receipt = (delivery, type, bounceType) => {
    const accepted = fixture.mailReceipts.find(row => row.idempotencyKey === `notification/${delivery.id}`);
    assert.ok(accepted, 'the receipt identifies the actual accepted notification');
    const id = `synthetic-lamp-failure-receipt-${++receiptNumber}`;
    const body = JSON.stringify({ type: `email.${type}`, data: {
      email_id: accepted.id, ...(bounceType ? { bounce: { type: bounceType } } : {}),
    } });
    return signReceipt(id, body);
  };
  const sendReceipt = async request => {
    const response = await raw(`${pageOrigin}/api/intake/mail-events`, request);
    assert.equal(response.status, 200, await response.text());
  };
  const expected = new Map();
  const expectFact = (updateId, target, outcome, outcomeBetween) => {
    const fact = {
      subscriberId: target.id, destination: target.destination, channel: target.channel, incidentUpdateId: updateId,
      queuedBetween: publicationWindows.get(updateId), outcome, outcomeBetween,
    };
    expected.set(deliveryIdentity(fact), fact);
    return fact;
  };
  const checkFact = (row, updateId, target, outcome, outcomeBetween) =>
    assertDeliveryFact(row, expectFact(updateId, target, outcome, outcomeBetween));
  const readFact = async (delivery, target, outcome, start) => {
    const end = now();
    const rows = await deliveries({ id: delivery.incidentUpdateId });
    const row = rows.find(row => row.id === delivery.id);
    checkFact(row, delivery.incidentUpdateId, target, outcome, [start, end]);
    assert.equal(row.queuedAt, delivery.queuedAt, 'recording an outcome preserves the committed queue instant');
    return row;
  };
  const acceptedMail = async (component, label, target, details) => {
    const update = await publish(component, label, ['email'], details);
    assert.equal((await dispatch(update)).outcome, 'ok');
    const rows = await eventuallySubscriber(() => deliveries(update),
      rows => rows.some(row => row.subscriberId === target.id && row.providerAcceptedAt), 'native delivery records provider acceptance');
    const row = rows.find(row => row.subscriberId === target.id);
    assert.equal(row.outcome, 'queued', 'provider acceptance alone does not claim delivery');
    checkFact(row, update.id, target, 'queued');
    assert.ok(fixture.messagesFor(target.address).some(message => message.text.includes(`Requests are delayed: ${label}.`)));
    return row;
  };
  const deactivated = async (target, reason, earliest) => {
    const row = await subscriber(target.id);
    assert.equal(row.state, 'deactivated');
    assert.equal(row.deactivationReason, reason);
    assert.ok(Date.parse(row.deactivatedAt) >= earliest && Date.parse(row.deactivatedAt) <= now(), 'the operator sees the actual bounded deactivation instant');
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
    const sms = await addSms(webhookComponent);
    for (const target of [hard, complaint, healthy, soft, webhook, sms]) {
      assert.equal((await subscriber(target.id)).state, 'active');
    }
    const bulkComponent = await fixture.createComponent('Synthetic Lamp paginated delivery inventory');
    const recipients = await addDeliveryLogEmails(label => add(bulkComponent, label));
    await pause(true);

    const control = await publish(webhookComponent, 'healthy webhook control', ['webhook', 'sms']);
    const dispatchedAt = now();
    assert.equal((await dispatch(control)).outcome, 'ok');
    await scheduled();
    const controls = await eventuallySubscriber(() => deliveries(control),
      rows => rows.some(row => row.channel === 'sms' && row.acceptingProvider === 'twilio'),
      'the synthetic SMS acknowledgement reaches the operator log');
    assert.equal(controls.length, 2);
    const delivered = controls.find(row => row.channel === 'webhook');
    assert.equal(delivered.outcome, 'delivered', 'the confirmed endpoint accepts a real publication');
    checkFact(delivered, control.id, webhook, 'delivered', [dispatchedAt, now()]);
    checkFact(controls.find(row => row.channel === 'sms'), control.id, sms, 'queued');
    assert.ok(smsMessages.some(message => message.To === sms.destination && message.Body.includes('Requests are delayed: healthy webhook control.')));

    const hardDelivery = await acceptedMail(hardComponent, 'hard bounce notification', hard);
    const hardAt = now();
    await sendReceipt(receipt(hardDelivery, 'bounced', 'Permanent'));
    await assertDeliveryFilter(fixture, await readFact(hardDelivery, hard, 'bounced', hardAt));
    await deactivated(hard, 'hard bounce', hardAt);
    await noFutureMail(hardComponent, hard, 'after hard bounce');

    const directLinks = ['https://help.example.test/status?area=api&view=summary', 'https://status.example.test/history'];
    const details = "Operators are restoring service. See " + directLinks.join(" or ") + ".";
    const complaintDelivery = await acceptedMail(complaintComponent, 'complaint notification', complaint, details);
    const complaintManagementLink = await assertUntrackedNotification(fixture, {
      address: complaint.address, subject: 'Synthetic Lamp complaint notification',
      impact: 'Requests are delayed: complaint notification.', details, directLinks,
    });
    expectFact(complaintDelivery.incidentUpdateId, healthy, 'queued');
    const queuedComplaint = await publish(complaintComponent, 'queued before complaint', ['email']);
    const committedComplaint = (await deliveries(queuedComplaint)).find(row => row.subscriberId === complaint.id);
    assert.equal(committedComplaint.outcome, 'queued');
    assert.equal(committedComplaint.providerAcceptedAt, null);
    checkFact(committedComplaint, queuedComplaint.id, complaint, 'queued');
    expectFact(queuedComplaint.id, healthy, 'queued');
    const signedComplaint = receipt(complaintDelivery, 'complained');
    const beforeInvalid = await subscriber(complaint.id);
    const invalid = await raw(`${pageOrigin}/api/intake/mail-events`, {
      ...signedComplaint, headers: { ...signedComplaint.headers, 'svix-signature': 'v1,synthetic-lamp-invalid' },
    });
    assert.equal(invalid.status, 401, 'an unauthenticated complaint cannot deactivate a subscriber');
    assert.deepEqual(await subscriber(complaint.id), beforeInvalid);
    const afterInvalid = (await deliveries({ id: complaintDelivery.incidentUpdateId })).find(row => row.id === complaintDelivery.id);
    assert.deepEqual(afterInvalid, complaintDelivery, 'an unauthenticated complaint cannot change the delivery log');
    const complaintAt = now();
    await sendReceipt(signedComplaint);
    const complained = await readFact(complaintDelivery, complaint, 'complained', complaintAt);
    await assertDeliveryFilter(fixture, complained);
    const stoppedComplaint = await deactivated(complaint, 'spam complaint', complaintAt);
    const complaintMailCount = fixture.messagesFor(complaint.address).length;
    const suppressionAt = now();
    assert.equal((await dispatch(queuedComplaint)).outcome, 'ok');
    const suppressedComplaint = (await deliveries(queuedComplaint)).find(row => row.id === committedComplaint.id);
    assert.equal(suppressedComplaint.outcome, 'suppressed');
    assert.ok(suppressedComplaint.outcomeAt);
    checkFact(suppressedComplaint, queuedComplaint.id, complaint, 'suppressed', [suppressionAt, now()]);
    assert.equal(suppressedComplaint.queuedAt, committedComplaint.queuedAt);
    await assertDeliveryFilter(fixture, suppressedComplaint);
    const healthyBefore = fixture.messagesFor(healthy.address).length;
    const freshComplaint = await noFutureMail(complaintComponent, complaint, 'fresh publication after complaint');
    assert.equal(fixture.messagesFor(healthy.address).length, healthyBefore + 1, 'the same fresh publication still reaches an active control');
    assert.ok((await deliveries(freshComplaint)).some(row => row.subscriberId === healthy.id && row.providerAcceptedAt));
    expectFact(freshComplaint.id, healthy, 'queued');
    await sendReceipt(signedComplaint);
    await sendReceipt(receipt(complaintDelivery, 'delivered'));
    assert.deepEqual(await readFact(complaintDelivery, complaint, 'complained', complaintAt), complained,
      'replayed complaints and late delivery receipts preserve the direct delivery readback');
    assert.deepEqual(await subscriber(complaint.id), stoppedComplaint, 'replayed complaints and late delivery receipts cannot restore consent or rewrite the reason');
    assert.equal(fixture.messagesFor(complaint.address).length, complaintMailCount, 'queued and fresh complaint suppression make zero additional transport requests');

    // A successful notification breaks the earlier bounce streak. Only the
    // subsequent completed outcomes count, even with newer queued recipients.
    let softBacklog;
    for (let index = 0; index < 10; index++) {
      const delivery = await acceptedMail(softComponent, `soft bounce sequence ${index}`, soft);
      const softAt = now();
      if (index === 9) {
        softBacklog = await publish(softComponent, 'newer queued soft bounce control', ['email']);
        assert.equal((await deliveries(softBacklog))[0].outcome, 'queued');
      }
      const outcome = index === 4 ? 'delivered' : 'bounced';
      await sendReceipt(receipt(delivery, outcome, index === 4 ? undefined : 'Transient'));
      await readFact(delivery, soft, outcome, softAt);
      if (index < 9) assert.equal((await subscriber(soft.id)).state, 'active', 'fewer than five consecutive soft-bounced notifications retain the subscription');
      else await deactivated(soft, 'five consecutive soft bounces', softAt);
    }
    await noFutureMail(softComponent, soft, 'after five soft bounces');

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
    const webhookAt = now();
    for (let index = 0; index < failedUpdates.length; index++) {
      const update = failedUpdates[index];
      const [committed] = await deliveries(update);
      assert.equal(committed.outcome, 'queued');
      checkFact(committed, update.id, webhook, 'queued');
      const failedAt = now();
      for (let attempt = 0; (await deliveries(update))[0].outcome === 'queued'; attempt++) {
        assert.ok(attempt < 10, 'native Queue retries terminate this failed notification');
        if (attempt > 0) await advanceToNextRetry(update.id);
        await dispatch(update);
      }
      const [failed] = await deliveries(update);
      assert.equal(failed.id, committed.id);
      assert.equal(failed.outcome, 'failed');
      assert.ok(failed.outcomeAt);
      checkFact(failed, update.id, webhook, 'failed', [failedAt, now()]);
      assert.equal(failed.queuedAt, committed.queuedAt);
      if (index === 0) await assertDeliveryFilter(fixture, failed);
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
    const scheduledAt = now();
    await scheduled();
    const scheduledBetween = [scheduledAt, now()];
    checkFact((await deliveries(softBacklog))[0], softBacklog.id, soft, 'suppressed', scheduledBetween);
    for (const { update, delivery } of backlog) {
      const [suppressed] = await deliveries(update);
      assert.equal(suppressed.id, delivery.id, 'Cron preserves the original committed recipient identity');
      assert.equal(suppressed.outcome, 'suppressed');
      assert.ok(suppressed.outcomeAt);
      assert.equal(suppressed.providerAcceptedAt, null);
      checkFact(suppressed, update.id, webhook, 'suppressed', scheduledBetween);
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

    const bulk = await publish(bulkComponent, 'paginated publication', ['email']);
    for (const recipient of recipients) expectFact(bulk.id, recipient, 'queued');
    assert.equal((await raw('/api/app/deliveries')).status, 401, 'the log is private');
    assert.equal((await raw('/api/app/deliveries.csv')).status, 401, 'the export is private');
    await reconcileLog(t, fixture, [...expected.values()], bulk.id);

    assert.equal((await api('/api/app/subscribers/' + complaint.id, { method: 'DELETE' })).status, 204);
    await sendReceipt(signReceipt(signedComplaint.headers['svix-id'], signedComplaint.body));
    assert.equal((await raw(complaintManagementLink)).status, 404, 'replay cannot restore a revoked subscription link');
    const erasedLog = await api('/api/app/deliveries?incidentUpdateId=' + complaintDelivery.incidentUpdateId);
    assert.equal(erasedLog.status, 200);
    const erasedDelivery = erasedLog.body.deliveries.find(row => row.id === complaintDelivery.id);
    assert.equal(erasedDelivery?.outcome, 'complained', 'the delivery fact survives address erasure');
    assert.equal(erasedDelivery.destination, 'deleted:' + complaint.id);
    const erasedCsv = await fixture.request('/api/app/deliveries.csv?incidentUpdateId=' + complaintDelivery.incidentUpdateId);
    assert.equal(erasedCsv.status, 200);
    assert.ok(!erasedLog.text.includes(complaint.address));
    assert.ok(!(await erasedCsv.text()).includes(complaint.address), 'the export also omits the erased destination');
  } finally { await fixture.close(); }
}
