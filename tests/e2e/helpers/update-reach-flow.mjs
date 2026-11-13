import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { openSubscriberManagementFixture, eventuallySubscriber } from './subscriber-management-fixture.mjs';

const address = name => [name, 'example.test'].join('@');
const receiptKey = Buffer.from('synthetic-lamp-subscriber-receipts');
export const reachFields = ['committed', 'distinctCommitted', 'providerAccepted', 'distinctProviderAccepted', 'delivered', 'distinctDelivered', 'queued', 'bounced', 'complained', 'suppressed', 'failed'];
const counts = (committed, selected, accepted, acceptedPeople, delivered, reached, bounced = 0, suppressed = 0, failed = 0) =>
  ({ committed, distinctCommitted: selected, providerAccepted: accepted, distinctProviderAccepted: acceptedPeople, delivered, distinctDelivered: reached, queued: 0, bounced, complained: 0, suppressed, failed });

// These literal expectations are independent of the aggregate query. Recipient
// identities come from native creation, and delivery identities are frozen
// before dispatch, suppression, signed receipts or permanent rejection.
export async function updateReachFlow({ observe = async () => {}, diagnostic = () => {} } = {}) {
  let reject = false, now = Date.now();
  const rejectedMail = [], rejectedHooks = [];
  const fixture = await openSubscriberManagementFixture({ builtWorker: true, pageHost: 'localhost',
    providerEdge: async request => {
      if (new URL(request.url).href === 'https://api.resend.com/domains') return Response.json({ data: [{ id: 'synthetic-lamp-domain-1', name: 'example.test', status: 'verified' }], has_more: false });
      if (reject && new URL(request.url).origin === 'https://api.resend.com') {
        const message = await request.clone().json();
        if (message.to.includes(address('synthetic-lamp-reach-1')) && message.text.includes('Reach update two')) {
          rejectedMail.push(request.headers.get('Idempotency-Key'));
          return Response.json({ message: 'Synthetic Lamp permanent rejection' }, { status: 400 });
        }
      }
    },
    webhookReceiver: async captured => {
      if (reject && captured.body.updates.some(update => update.customerImpact === 'Reach update two')) {
        rejectedHooks.push(captured.body.deliveryId);
        return new Response(null, { status: 400 });
      }
      return new Response(null, { status: 204 });
    },
  });
  const { api, post, raw } = fixture;
  const json = async (path, method = 'GET', body) => {
    const response = await api(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(response.status, 200, response.text);
    return response.body;
  };
  const pause = async paused => assert.equal((await raw('/test/effects', { method: 'PUT', body: JSON.stringify({ paused }) })).status, 204);
  const receipt = async (delivery, type) => {
    const accepted = fixture.mailReceipts.find(row => row.idempotencyKey === `notification/${delivery.id}`);
    assert.ok(accepted, 'the captured provider acceptance maps to this retained delivery');
    const id = `synthetic-lamp-${type}-${delivery.id}`, timestamp = String(Math.floor(now / 1000));
    const body = JSON.stringify({ type: `email.${type}`, data: { email_id: accepted.id, ...(type === 'bounced' ? { bounce: { type: 'Permanent' } } : {}) } });
    const signature = createHmac('sha256', receiptKey).update(`${id}.${timestamp}.${body}`).digest('base64url');
    const response = await raw(`${fixture.publicOrigin}/api/intake/mail-events`, { method: 'POST', headers: {
      'Content-Type': 'application/json', 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}`,
    }, body });
    assert.equal(response.status, 200, await response.text());
  };
  try {
    fixture.recoverWebhook();
    const component = await fixture.createComponent('Synthetic Lamp reach API');
    const recipients = [];
    for (let index = 0; index < 12; index++) {
      const channel = index < 10 ? 'email' : 'webhook';
      const contact = address(`synthetic-lamp-reach-${index}`);
      const response = await post('/api/app/subscribers', { channel, componentIds: [component.id], eventKinds: ['incidents'],
        ...(channel === 'email' ? { email: contact } : { destination: `https://receiver.example.test/${index === 10 ? 'synthetic-lamp-1' : 'synthetic-lamp-components'}`, contactEmail: contact }),
      });
      assert.equal(response.status, 201, response.text);
      recipients.push({ id: response.body.subscriber.id, channel, contact });
      await fixture.confirm(contact);
    }
    const inventory = await fixture.list();
    assert.deepEqual(inventory.map(row => row.id).sort(), recipients.map(row => row.id).sort());
    assert.ok(inventory.every(row => row.state === 'active'));
    const created = await post('/api/app/incidents', { title: 'Synthetic Lamp reach reconciliation', components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }] });
    assert.equal(created.status, 201, created.text);
    const incident = created.body.incident, endpoint = `/api/app/incidents/${incident.id}`;
    const updates = [];
    const deliveries = async update => (await json(`/api/app/deliveries?incidentUpdateId=${update.id}&limit=100`)).deliveries;
    const identity = rows => rows.map(row => ({ id: row.id, subscriberId: row.subscriberId, channel: row.channel })).sort((a, b) => a.id.localeCompare(b.id));
    const publish = async (wording, selected) => {
      await pause(true);
      await json(`${endpoint}/draft`, 'PUT', { lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp readers', customerImpact: wording, whatStillWorks: '', details: '', nextUpdateAt: new Date(now + 3600_000).toISOString() });
      const update = (await json(`${endpoint}/publish`, 'POST', { channels: ['email', 'webhook'] })).update;
      const frozen = await deliveries(update);
      assert.equal(frozen.length, selected.length);
      assert.deepEqual(frozen.map(row => row.subscriberId).sort(), selected.map(row => row.id).sort());
      assert.ok(frozen.every(row => row.outcome === 'queued' && !row.providerAcceptedAt));
      assert.equal(new Set(frozen.map(row => row.id)).size, selected.length);
      updates.push({ update, frozen: identity(frozen) });
      return update;
    };
    const dispatch = async (update, outcome = 'ok') => {
      await pause(false);
      const result = await (await fixture.runtime.getWorker()).queue('lamp-follow-ups-jobs', [{ id: `synthetic-lamp-dispatch-${update.id}`, timestamp: new Date(now), attempts: 1, body: { type: 'delivery-dispatch', eventId: update.id } }]);
      assert.equal(result.outcome, outcome, JSON.stringify(result));
    };
    const deliverAccepted = async update => {
      const rows = await eventuallySubscriber(() => deliveries(update), rows => rows.every(row => row.channel === 'email' ? row.providerAcceptedAt || ['suppressed', 'failed'].includes(row.outcome) : row.outcome !== 'queued'), 'dispatch records each expected terminal outcome or email acceptance');
      for (const row of rows.filter(row => row.channel === 'email' && row.providerAcceptedAt)) await receipt(row, 'delivered');
    };
    const assertReach = async (expectedUpdates, incidentExpected) => {
      const reach = await json(`${endpoint}/reach`);
      assert.deepEqual(reach.updates.map(row => row.updateId).sort(), updates.map(row => row.update.id).sort());
      for (const [index, expected] of expectedUpdates.entries()) {
        const update = updates[index].update;
        const single = await json(`${endpoint}/reach?updateId=${update.id}`);
        assert.equal(single.updates.length, 1);
        assert.equal(single.updates[0].updateId, update.id);
        for (const result of [single.updates[0], reach.updates.find(row => row.updateId === update.id)]) check(result, expected);
        const logged = await deliveries(update);
        const expectedOutcome = subscriberId => index === 0
          ? subscriberId === recipients[9].id ? 'bounced' : 'delivered'
          : index === 1
            ? [recipients[0].id, recipients[10].id].includes(subscriberId) ? 'suppressed'
              : [recipients[1].id, recipients[11].id].includes(subscriberId) ? 'failed' : 'delivered'
            : 'delivered';
        assert.deepEqual(logged.map(row => ({ ...identity([row])[0], outcome: row.outcome })).sort((a, b) => a.id.localeCompare(b.id)),
          updates[index].frozen.map(row => ({ ...row, outcome: expectedOutcome(row.subscriberId) })), 'each retained recipient has its independently expected outcome');
        assert.deepEqual(identity(logged), updates[index].frozen, 'outcomes and retries retain the complete committed delivery identities');
        const persisted = (await fixture.db.prepare('SELECT id,subscriber_id AS subscriberId,channel,outcome FROM notification_delivery_records WHERE incident_update_id = ? ORDER BY id').bind(update.id).all()).results;
        assert.deepEqual(persisted, logged.map(row => ({ id: row.id, subscriberId: row.subscriberId, channel: row.channel, outcome: row.outcome })).sort((a, b) => a.id.localeCompare(b.id)), 'the native delivery log reads the retained facts exactly');
      }
      check(reach.incident, incidentExpected);
      await observe({ fixture, incident, updates, reach, expectedUpdates, incidentExpected });
      return reach;
    };
    function check(result, expected) {
      assert.deepEqual(result.channels.map(row => row.channel).sort(), ['email', 'webhook']);
      for (const channel of result.channels) assert.deepEqual(Object.fromEntries(reachFields.map(field => [field, channel[field]])), expected[channel.channel], `${channel.channel}: all send outcomes and distinct recipient totals reconcile`);
    }
    const first = await publish('Reach update one', recipients);
    await dispatch(first);
    await deliverAccepted(first);
    const bounced = (await deliveries(first)).find(row => row.subscriberId === recipients[9].id);
    await receipt(bounced, 'bounced');
    assert.equal((await fixture.list()).find(row => row.id === recipients[9].id).state, 'deactivated');
    const baseline = { email: counts(10, 10, 10, 10, 9, 9, 1), webhook: counts(2, 2, 0, 0, 2, 2) };
    await assertReach([baseline], baseline);
    diagnostic('PROBE NOTIFY-015 1: ordinary publication to ten emails and two webhooks, signed receipts and one hard bounce -> email committed=10 delivered=9 bounced=1; webhook committed=2 delivered=2');

    const second = await publish('Reach update two', recipients.filter(row => row.id !== recipients[9].id));
    const suppressed = [recipients[0], recipients[10]];
    for (const person of suppressed) {
      const link = fixture.messagesFor(person.contact).map(message => message.text.match(/https?:\/\/\S+\/unsubscribe\/\S+/)?.[0]).find(Boolean);
      assert.ok(link, 'the actual confirmation or delivery supplies an unsubscribe capability');
      const response = await raw(link, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: fixture.publicOrigin }, body: 'List-Unsubscribe=One-Click' });
      assert.equal(response.status, 200, await response.text());
    }
    const mailBefore = fixture.messagesFor(recipients[0].contact).length;
    const hooksBefore = fixture.webhookRequests.filter(row => row.body.deliveryId === updates[1].frozen.find(row => row.subscriberId === recipients[10].id).id).length;
    reject = true;
    await dispatch(second, 'exception');
    // Exercise normal scheduled retries at later instants. Do not change retry
    // configuration, stored attempts or outcomes to manufacture a failure.
    for (let attempt = 0; attempt < 5; attempt++) {
      now = Math.max(now, Date.now()) + 21 * 60_000;
      assert.equal((await raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now }) })).status, 204);
      const result = await (await fixture.runtime.getWorker()).scheduled({ cron: '* * * * *', scheduledTime: now });
      assert.equal(result.outcome, 'ok', JSON.stringify(result));
    }
    await deliverAccepted(second);
    const secondCounts = { email: counts(9, 9, 7, 7, 7, 7, 0, 1, 1), webhook: counts(2, 2, 0, 0, 0, 0, 0, 1, 1) };
    const twoTotals = { email: counts(19, 10, 17, 10, 16, 9, 1, 1, 1), webhook: counts(4, 2, 0, 0, 2, 2, 0, 1, 1) };
    await assertReach([baseline, secondCounts], twoTotals);
    assert.equal(fixture.messagesFor(recipients[0].contact).length, mailBefore, 'suppressed email never crosses the mail edge');
    assert.equal(hooksBefore, 0);
    const suppressedHookId = updates[1].frozen.find(row => row.subscriberId === recipients[10].id).id;
    assert.ok(!fixture.webhookRequests.some(row => row.body.deliveryId === suppressedHookId), 'suppressed webhook never crosses its receiver edge');
    const failedEmailId = updates[1].frozen.find(row => row.subscriberId === recipients[1].id).id;
    assert.deepEqual(rejectedMail, [`notification/${failedEmailId}`], 'permanent email rejection is not retried');
    const failedHookId = updates[1].frozen.find(row => row.subscriberId === recipients[11].id).id;
    assert.equal(rejectedHooks.length, 6, 'existing webhook retries exhaust without creating another delivery');
    assert.ok(rejectedHooks.every(id => id === failedHookId));

    reject = false;
    const third = await publish('Reach update three', recipients.filter(row => ![recipients[0].id, recipients[9].id, recipients[10].id].includes(row.id)));
    await dispatch(third);
    await deliverAccepted(third);
    const thirdCounts = { email: counts(8, 8, 8, 8, 8, 8), webhook: counts(1, 1, 0, 0, 1, 1) };
    const totals = { email: counts(27, 10, 25, 10, 24, 9, 1, 1, 1), webhook: counts(5, 2, 0, 0, 3, 2, 0, 1, 1) };
    await assertReach([baseline, secondCounts, thirdCounts], totals);
    const allDeliveryIds = updates.flatMap(row => row.frozen.map(delivery => delivery.id));
    assert.equal(new Set(allDeliveryIds).size, 32);
    // Queue replay and receipt replay must preserve the same identity sets and
    // counts; a later delivered event cannot resurrect the bounced recipient.
    const sendsBeforeReplay = fixture.messages.length, hooksBeforeReplay = fixture.webhookRequests.length;
    await dispatch(second); await dispatch(third);
    await receipt(bounced, 'bounced'); await receipt(bounced, 'delivered');
    await assertReach([baseline, secondCounts, thirdCounts], totals);
    assert.equal(fixture.messages.length, sendsBeforeReplay);
    assert.equal(fixture.webhookRequests.length, hooksBeforeReplay);
    assert.equal((await fixture.list()).find(row => row.id === recipients[9].id).state, 'deactivated');
    diagnostic('PROBE NOTIFY-015 1: queued unsubscribe on both channels and permanent rejection -> email skipped=1 failed=1; webhook skipped=1 failed=1; delivery identities unchanged');
    diagnostic('PROBE NOTIFY-015 2: three updates, replayed dispatch and signed receipts -> 27 email sends for 10 selected and 9 reached recipients; 5 webhook sends for 2 selected and reached recipients, 3 delivered, 1 skipped, 1 failed');
  } finally { await pause(false); await fixture.close(); }
}
