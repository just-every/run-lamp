import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { subscriberCsvRows } from './subscriber-management-fixture.mjs';

function boundedTime(value, [start, end], label) {
  const instant = typeof value === 'string' ? Date.parse(value) : NaN;
  assert.ok(instant >= start && instant <= end, label);
}

export const deliveryIdentity = row => JSON.stringify([row.subscriberId, row.channel, row.incidentUpdateId]);

export function assertDeliveryFact(row, { subscriberId, destination, channel, incidentUpdateId, queuedBetween, outcome, outcomeBetween }) {
  assert.ok(row, 'the operator log contains the expected delivery');
  assert.deepEqual(
    { subscriberId: row.subscriberId, destination: row.destination, channel: row.channel, incidentUpdateId: row.incidentUpdateId, outcome: row.outcome },
    { subscriberId, destination, channel, incidentUpdateId, outcome },
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
  const unsubscribe = unsubscribeHeader?.match(/<([^<>]+)>$/)?.[1];
  assert.ok(manage && unsubscribe, 'the captured notification names both native subscription links');
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

export async function assertDeliveryCsv(fixture, query, rows) {
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
  await assertDeliveryCsv(fixture, query, [row]);
}

export async function addDeliveryLogEmails(add) {
  const recipients = [];
  for (let index = 0; index < 101; index++) {
    recipients.push(await add('delivery-log-' + index));
  }
  assert.equal(new Set(recipients.map(row => row.destination)).size, 101);
  return recipients;
}

export async function assertDeliveryInventory(t, fixture, expected, bulkUpdateId) {
  const byIdentity = new Map(expected.map(row => [deliveryIdentity(row), row]));
  assert.equal(byIdentity.size, expected.length, 'the independent recipient inventory has no duplicates');
  const outcomes = ['queued', 'delivered', 'bounced', 'complained', 'suppressed', 'failed'];
  for (const outcome of outcomes) {
    assert.ok(expected.some(row => row.outcome === outcome), 'every outcome has a populated filter control');
  }
  const filters = [
    {}, ...['email', 'webhook', 'sms'].map(channel => ({ channel })),
    ...outcomes.map(outcome => ({ outcome })),
    ...[...new Set(expected.map(row => row.incidentUpdateId))].map(incidentUpdateId => ({ incidentUpdateId })),
    { incidentUpdateId: bulkUpdateId, channel: 'email', outcome: 'queued' },
    { incidentUpdateId: bulkUpdateId, channel: 'webhook', outcome: 'queued' },
  ];
  const unfiltered = new Map();
  const limit = 100;
  for (const filter of filters) {
    const matching = expected.filter(row => Object.entries(filter).every(([field, value]) => row[field] === value));
    const rows = [];
    const pageCount = Math.max(1, Math.ceil(matching.length / limit));
    for (let page = 0; page < pageCount; page++) {
      const offset = page * limit;
      const query = new URLSearchParams({ ...filter, limit, offset });
      const result = await fixture.api('/api/app/deliveries?' + query);
      assert.equal(result.status, 200, result.text);
      const { deliveries, ...pagination } = result.body;
      assert.equal(pagination.limit, limit);
      assert.equal(pagination.offset, offset);
      assert.equal(pagination.hasMore, page + 1 < pageCount);
      assert.equal(deliveries.length, Math.min(limit, matching.length - offset));
      rows.push(...deliveries);
    }
    assert.ok(rows.every(row => typeof row.id === 'string' && row.id.length));
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length, 'each delivery ID appears once across pages');
    assert.deepEqual(rows.map(deliveryIdentity).sort(), matching.map(deliveryIdentity).sort(),
      'each filter returns exactly the independently expected subscriber, channel and update identities');
    for (const row of rows) {
      const identity = deliveryIdentity(row);
      assertDeliveryFact(row, byIdentity.get(identity));
      if (Object.keys(filter).length === 0) unfiltered.set(identity, row);
      assert.deepEqual(row, unfiltered.get(identity), 'the same delivery and its full facts survive filtering');
    }
    const query = new URLSearchParams(filter);
    if (pageCount > 1) {
      // An export from the second page still includes the entire result.
      query.set('limit', String(limit));
      query.set('offset', String(limit));
    }
    await assertDeliveryCsv(fixture, query, rows);
  }
  t.diagnostic('NOTIFY-004 reconciled ' + expected.length + ' deliveries, all six nonempty outcome filters and '
    + filters.length + ' complete CSV scopes, including 101 distinct recipients across two pages of one update.');
}
