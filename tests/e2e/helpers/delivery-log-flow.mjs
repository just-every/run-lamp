import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { openSubscriberManagementFixture, eventuallySubscriber, subscriberCsvRows } from './subscriber-management-fixture.mjs';
import { smsBindings, smsProviderEdge, smsSignature } from './sms-subscriber-flow.mjs';

function boundedTime(value, [start, end], label) {
  const instant = typeof value === 'string' ? Date.parse(value) : NaN;
  assert.ok(instant >= start && instant <= end, label);
}

export function assertDeliveryFact(row, { subscriberId, destination, channel, updateId, queuedBetween, outcome, outcomeBetween }) {
  assert.ok(row, 'the operator log contains the expected delivery');
  assert.deepEqual(
    { subscriberId: row.subscriberId, destination: row.destination, channel: row.channel, updateId: row.incidentUpdateId, outcome: row.outcome },
    { subscriberId, destination, channel, updateId, outcome },
  );
  boundedTime(row.queuedAt, queuedBetween, 'queue time falls within the successful publication request');
  if (outcomeBetween) {
    boundedTime(row.outcomeAt, outcomeBetween, 'outcome time falls within the request that recorded it');
    assert.ok(Date.parse(row.outcomeAt) >= Date.parse(row.queuedAt));
  } else {
    assert.equal(row.outcomeAt, null, 'a queued delivery has no completed outcome time');
  }
}

export async function assertUntrackedNotification(fixture, { address, subject, impact, details, directLinks }) {
  const [message, ...duplicates] = fixture.messagesFor(address).filter(mail => mail.subject.includes(subject));
  assert.ok(message, 'the intended recipient receives the provider-facing notification');
  assert.deepEqual(duplicates, []);
  assert.deepEqual(message.to, [address]);
  assert.match(message.html, /^<!doctype html>/i, 'the provider captures a complete HTML document');
  assert.match(message.html, /<\/body><\/html>\s*$/i);
  const { 'List-Help': manage, 'List-Unsubscribe': unsubscribeHeader } = message.headers;
  const unsubscribe = unsubscribeHeader.match(/<([^<>]+)>$/)[1];
  const origin = new URL(fixture.publicOrigin).origin;
  for (const [url, path] of [[manage, 'manage'], [unsubscribe, 'unsubscribe']]) {
    const direct = new URL(url);
    assert.equal(direct.origin, origin);
    assert.match(direct.pathname, new RegExp('^/' + path + '/[^/]+$'));
    assert.equal(direct.search + direct.hash, '', 'subscription links contain only the opaque native token');
  }
  assert.equal((await fixture.raw(manage)).status, 200, 'the native management link opens without an operator session');

  const links = [], text = [];
  const resourceAttributes = new Set(['src', 'srcset', 'background', 'ping', 'action', 'formaction', 'poster', 'data']);
  const activeElements = new Set(['img', 'picture', 'svg', 'script', 'iframe', 'object', 'embed', 'link', 'base', 'style']);
  function inspect(node) {
    assert.ok(!activeElements.has(node.tagName), 'the unbranded notification has no pixel or embedded resource');
    if (node.nodeName === '#text') text.push(node.value);
    for (const { name, value } of node.attrs ?? []) {
      assert.ok(!resourceAttributes.has(name), 'no attribute can load a tracking resource');
      assert.ok(!name.startsWith('on') && name !== 'http-equiv', 'the document has no script or refresh');
      if (name === 'style') assert.doesNotMatch(value, /url\s*\(|@import/i);
      if (name === 'href') {
        assert.equal(node.tagName, 'a');
        links.push(value);
      }
    }
    for (const child of node.childNodes ?? []) inspect(child);
    if (node.content) inspect(node.content);
  }
  inspect(parse(message.html));
  assert.deepEqual(links, [new URL('/', origin).href, ...directLinks, manage, unsubscribe],
    'the entire document links only to the exact supplied HTTPS URLs and native subscription destinations');
  const content = text.join('');
  for (const value of [subject, 'Synthetic Lamp readers', impact, 'The dashboard is available.', details, 'Manage subscription', 'Unsubscribe']) {
    assert.ok(content.includes(value), 'the actual HTML includes the published wording and subscription controls');
  }
  return manage;
}

// The CSV includes these log facts. Provider state is kept distinct from
// delivery outcome; nullable facts are blank in the exported file.
const csvFields = [
  'destination', 'channel', 'outcome', 'incidentUpdateId', 'queuedAt', 'outcomeAt', 'providerAcceptedAt',
  'acceptingProvider', 'maintenanceReference', 'maintenanceTitle', 'maintenanceNoticeKind', 'providerOutcome',
];

async function assertCsvParity(fixture, query, rows) {
  const response = await fixture.request('/api/app/deliveries.csv?' + query);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/csv\b/i);
  const expected = rows.map(row => Object.fromEntries(csvFields.map(field => {
    const value = row[field] ?? '';
    return [field, /^[=+\-@]/.test(value) ? "'" + value : value];
  })));
  assert.deepEqual(subscriberCsvRows(await response.text()), expected, 'the export has every filtered row in log order, with all recorded facts');
}

export async function assertDeliveryFilter(fixture, row) {
  const query = new URLSearchParams({ incidentUpdateId: row.incidentUpdateId, channel: row.channel, outcome: row.outcome });
  const result = await fixture.api('/api/app/deliveries?' + query);
  assert.equal(result.status, 200, result.text);
  assert.equal(result.body.hasMore, false);
  assert.deepEqual(result.body.deliveries, [row], 'this update and channel contain exactly one delivery with the named outcome');
  await assertCsvParity(fixture, query, [row]);
}

async function publishDeliveryUpdate(fixture, component, title, channels) {
  const created = await fixture.post('/api/app/incidents', {
    title, components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }],
  });
  assert.equal(created.status, 201, created.text);
  const { id } = created.body.incident;
  const draft = await fixture.api('/api/app/incidents/' + id + '/draft', {
    method: 'PUT',
    body: JSON.stringify({
      lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp readers', customerImpact: 'Requests are delayed.',
      whatStillWorks: 'Reads continue.', details: '', nextUpdateAt: new Date(Date.now() + 3_600_000).toISOString(),
    }),
  });
  assert.equal(draft.status, 200, draft.text);
  const start = Date.now();
  const published = await fixture.post('/api/app/incidents/' + id + '/publish', { channels });
  const end = Date.now();
  assert.equal(published.status, 200, published.text);
  return { updateId: published.body.update.id, queuedBetween: [start, end] };
}

export async function deliveryLogInventoryFlow(t) {
  const smsMessages = [];
  const fixture = await openSubscriberManagementFixture({
    workerEntry: 'tests/e2e/helpers/status-journey.worker.ts',
    extraBindings: smsBindings, providerEdge: smsProviderEdge(smsMessages),
  });
  const read = async search => {
    const response = await fixture.api('/api/app/deliveries?' + search);
    assert.equal(response.status, 200, response.text);
    return response.body;
  };
  const add = async (channel, destination, component, contact) => {
    const input = channel === 'email' ? { email: destination }
      : channel === 'webhook' ? { destination, contactEmail: contact } : { phone: destination };
    const result = await fixture.post('/api/app/subscribers', {
      ...input, channel, componentIds: [component.id], eventKinds: ['incidents'],
    });
    assert.equal(result.status, 201, result.text);
    assert.equal(result.body.subscriber.state, 'pending');
    const subscriberId = result.body.subscriber.id;
    if (channel === 'sms') {
      const url = fixture.publicOrigin + '/api/public/sms/inbound';
      const fields = { From: destination, To: smsBindings.TWILIO_FROM_NUMBER, Body: 'YES', MessageSid: 'synthetic-lamp-log-consent' };
      const reply = await fixture.raw(url, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Twilio-Signature': smsSignature(url, fields) },
        body: new URLSearchParams(fields).toString(),
      });
      assert.equal(reply.status, 200, await reply.text());
    } else {
      await fixture.confirm(contact ?? destination);
    }
    return { subscriberId, destination, channel };
  };
  const key = (row, updateId = row.updateId) => JSON.stringify([row.subscriberId, row.channel, updateId]);
  try {
    fixture.recoverWebhook();
    const bulk = await fixture.createComponent('Synthetic Lamp paginated delivery inventory');
    const control = await fixture.createComponent('Synthetic Lamp other channel inventory');
    const emails = [];
    for (let index = 0; index < 101; index++) {
      const destination = ['synthetic-lamp-log-' + index, 'example.test'].join('@');
      emails.push(await add('email', destination, bulk));
    }
    const webhook = await add('webhook', 'https://receiver.example.test/synthetic-lamp-1', control,
      ['synthetic-lamp-log-contact', 'example.test'].join('@'));
    const sms = await add('sms', '+12025550109', control);

    const other = await publishDeliveryUpdate(fixture, control, 'Synthetic Lamp control publication', ['webhook', 'sms']);
    const worker = await fixture.runtime.getWorker();
    assert.equal((await worker.scheduled({ cron: '* * * * *' })).outcome, 'ok');
    const controls = await eventuallySubscriber(
      async () => (await read(new URLSearchParams({ incidentUpdateId: other.updateId }))).deliveries,
      rows => rows.some(row => row.channel === 'webhook' && row.outcome === 'delivered') &&
        rows.some(row => row.channel === 'sms' && row.acceptingProvider === 'twilio'),
      'the webhook acknowledgement and synthetic SMS acceptance reach the operator log',
    );
    assert.equal(controls.length, 2);
    assert.ok(smsMessages.some(message => message.To === sms.destination && message.Body.includes('Requests are delayed.')));

    const pause = await fixture.raw('/test/effects', { method: 'PUT', body: JSON.stringify({ paused: true }) });
    assert.equal(pause.status, 204);
    const publication = await publishDeliveryUpdate(fixture, bulk, 'Synthetic Lamp paginated publication', ['email']);
    const expected = [
      ...emails.map(recipient => ({ ...recipient, ...publication, outcome: 'queued' })),
      { ...sms, ...other, outcome: 'queued' },
      { ...webhook, ...other, outcome: 'delivered', outcomeBetween: [other.queuedBetween[0], Date.now()] },
    ];
    assert.equal(new Set(expected.map(row => row.destination)).size, 103);
    const expectByKey = new Map(expected.map(row => [key(row), row]));

    assert.equal((await fixture.raw('/api/app/deliveries')).status, 401, 'the log is private');
    assert.equal((await fixture.raw('/api/app/deliveries.csv')).status, 401, 'the export is private');
    const inventoryIds = new Map();
    const scopes = [
      {}, { channel: 'email' }, { channel: 'webhook' }, { channel: 'sms' },
      ...['queued', 'delivered', 'bounced', 'complained', 'suppressed', 'failed'].map(outcome => ({ outcome })),
      { incidentUpdateId: publication.updateId }, { incidentUpdateId: other.updateId },
      { incidentUpdateId: publication.updateId, channel: 'email', outcome: 'queued' },
      { incidentUpdateId: publication.updateId, channel: 'webhook', outcome: 'queued' },
    ];
    for (const filter of scopes) {
      const matching = expected.filter(row => Object.entries(filter).every(([field, value]) =>
        (field === 'incidentUpdateId' ? row.updateId : row[field]) === value));
      const rows = [];
      const limit = 100;
      const query = new URLSearchParams(filter);
      const pageCount = Math.max(1, Math.ceil(matching.length / limit));
      for (let page = 0; page < pageCount; page++) {
        const offset = page * limit;
        const result = await read(new URLSearchParams({ ...filter, limit, offset }));
        assert.equal(result.limit, limit);
        assert.equal(result.offset, offset);
        assert.equal(result.hasMore, page + 1 < pageCount);
        assert.equal(result.deliveries.length, Math.min(limit, matching.length - offset));
        rows.push(...result.deliveries);
      }
      assert.equal(new Set(rows.map(row => row.id)).size, rows.length, 'each delivery identity appears once across pages');
      assert.deepEqual(rows.map(row => key(row, row.incidentUpdateId)).sort(), matching.map(row => key(row)).sort(),
        'each filter returns exactly the independently expected subscriber, channel and update identities');
      for (const row of rows) {
        const identity = key(row, row.incidentUpdateId);
        assertDeliveryFact(row, expectByKey.get(identity));
        if (query.size === 0) inventoryIds.set(identity, row.id);
        assert.equal(row.id, inventoryIds.get(identity), 'filtering preserves the ID of the same delivery');
      }
      if (pageCount > 1) {
        // The export ignores the current page, even if called from a later page.
        query.set('limit', String(limit));
        query.set('offset', String(limit));
      }
      await assertCsvParity(fixture, query, rows);
    }
    t.diagnostic('NOTIFY-004 reconciled 103 distinct delivery destinations, the second page after the 100-row limit, and 14 complete CSV scopes');
  } finally {
    await fixture.close();
  }
}
