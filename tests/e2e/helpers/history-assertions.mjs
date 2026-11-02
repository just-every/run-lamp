import assert from 'node:assert/strict';
import { parse } from 'parse5';

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const hasClass = (node, name) => (attr(node, 'class') ?? '').split(' ').includes(name);
export const historyText = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(historyText).join('');
const descendants = node => (node.childNodes ?? []).flatMap(child => [child, ...descendants(child)]);

// Expected times use Brisbane's fixed offset, independently of the product formatter.
export function historyTime(instant) {
  const local = new Date(Date.parse(instant) + 10 * 3600_000);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][local.getUTCMonth()];
  return `${month} ${local.getUTCDate()}, ${local.getUTCFullYear()}, ${local.toISOString().slice(11, 16)} UTC+10:00`;
}

export function historyGroups(html) {
  return descendants(parse(html)).filter(node => hasClass(node, 'history-month'));
}

export function historyLinks(html) {
  return descendants(parse(html)).filter(node => hasClass(node, 'history-item'))
    .map(node => attr(descendants(node).find(child => child.tagName === 'a'), 'href'));
}

export function historyRecord(html, href) {
  const records = descendants(parse(html)).filter(node => hasClass(node, 'history-item')
    && descendants(node).some(child => child.tagName === 'a' && attr(child, 'href') === href));
  assert.equal(records.length, 1, `exactly one history record links to ${href}`);
  return records[0];
}

export function assertHistoryRecord(html, { href, title, state, startsAt, endsAt, duration, components, updates }) {
  const record = historyRecord(html, href);
  const header = record.childNodes.find(node => node.tagName === 'header');
  assert.equal(historyText(descendants(header).find(node => node.tagName === 'h3')), title);
  assert.equal(historyText(descendants(header).find(node => hasClass(node, 'lifecycle-pill'))), state);
  const metadata = record.childNodes.find(node => hasClass(node, 'incident-meta'));
  const times = descendants(metadata).filter(node => node.tagName === 'time');
  assert.deepEqual(times.map(node => [attr(node, 'datetime'), historyText(node)]),
    [startsAt, endsAt].map(instant => [instant, historyTime(instant)]), `${href}: start and end belong to the record metadata`);
  assert.ok(historyText(metadata).includes(` · ${duration} · affected ${components.join(', ')}`), `${href}: exact duration and affected component names`);
  const container = record.childNodes.find(node => hasClass(node, 'updates'));
  const articles = container.childNodes.filter(node => node.tagName === 'article');
  assert.equal(articles.length, updates.length, `${href}: the complete retained publication inventory`);
  const remaining = new Map(updates.map(update => [update.id, update]));
  const actualIds = articles.map(article => {
    const heading = article.childNodes.find(node => hasClass(node, 'update-head'));
    const lifecycle = historyText(heading.childNodes.find(node => node.tagName === 'strong'));
    const matching = [...remaining.values()].filter(update => lifecycle === (update.lifecycle ?? update.kind)
      && historyText(article).includes(update.details ?? update.body));
    assert.equal(matching.length, 1, `${href}: each article belongs to one independently retained native publication`);
    const update = matching[0];
    const published = descendants(heading).filter(node => node.tagName === 'time');
    assert.deepEqual(published.map(node => [attr(node, 'datetime'), historyText(node)]),
      [[update.publishedAt, historyTime(update.publishedAt)]], `${update.id}: exact original publication time`);
    for (const field of ['affectedAudience', 'customerImpact', 'whatStillWorks', 'details']) {
      if (update[field]) assert.ok(historyText(article).includes(update[field]), `${update.id}: retained ${field}`);
    }
    remaining.delete(update.id);
    return update.id;
  });
  assert.equal(remaining.size, 0, `${href}: no native publication is missing`);
  assert.deepEqual(actualIds, [...updates].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map(update => update.id), `${href}: newest-first complete inventory`);
}
