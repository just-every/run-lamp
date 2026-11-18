import assert from 'node:assert/strict';
import { parse } from 'parse5';

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
}
