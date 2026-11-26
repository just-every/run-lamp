import { componentReadFlow } from './helpers/component-read-flow.mjs';
import { admitAttributionOperator, actorAudits, assertActorAudit, assertMaintenanceActor } from './helpers/operator-attribution.mjs';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { gzipSync } from 'node:zlib';
import { test } from 'node:test';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { parse, parseFragment } from 'parse5';
import { openStatusJourney, eventually, wording } from './helpers/status-journey.mjs';
import { literalLinkFields } from './helpers/update-link-evidence.mjs';
import { assertUpdateLinkSurfaces, assertUpdateLinkScreens } from './helpers/update-link-surfaces.mjs';
import { assertVisibleTime, expectedComponentLabels } from '../helpers/public-meaning.mjs';
import { publicCapacityJourney } from './helpers/public-capacity-journey.mjs';
import { shortHistoryFlow } from './helpers/short-history-flow.mjs';
import { browsableHistoryFlow } from './helpers/browsable-history-flow.mjs';
import { publicHistoryFlow } from './helpers/public-history-flow.mjs';
import { publicIsolationFlow } from './helpers/public-isolation-flow.mjs';
import { conditionalComponentFlow } from './helpers/conditional-component-flow.mjs';
import { snapshotReleaseRebuildFlow } from './helpers/snapshot-release-rebuild-flow.mjs';
import { uptimeCorrectionJourney } from './helpers/uptime-correction-journey.mjs';
import { widgetInstallations, installWidget, openWidgetHost } from './helpers/widget-privacy-flow.mjs';

test('HIST-008 — reviewed imported history stays completely browsable without scripts', { timeout: 120_000 }, browsableHistoryFlow);

test('PAGE-005 — a new release rebuilds the stored public page once, retries pending work, advances past a reset database and keeps pre-launch', { timeout: 240_000 }, snapshotReleaseRebuildFlow);

test('UPTIME-003 — newly observed services report only their recorded coverage', shortHistoryFlow);
test('HIST-001 — completed native records retain their month, window, components and complete publication inventory', publicHistoryFlow);

test('COMP-009 — reviewed CSV edits, reorders and deletes existing components', async () => {
  const j = await openStatusJourney();
  try {
    const { group } = await j.json('/api/app/component-groups', 'POST', { name: 'CSV review services', displayOrder: 0 }, 201);
    const monitoring = await j.component('Monitoring', { groupId: group.id, displayOrder: 0, description: 'Original checks' });
    const routing = await j.component('Routing', { groupId: group.id, displayOrder: 1, description: 'Original routing' });
    const retired = await j.component('Retired relay', { groupId: group.id, displayOrder: 2 });
    const control = await j.component('Unlisted control', {
      groupId: group.id, displayOrder: 3, description: 'Keep this description', note: 'Keep this note', internal: true,
    });
    const readComponents = () => j.json('/api/app/components');
    const bulkPath = '/api/app/components/bulk';
    const before = await readComponents();
    const beforeReview = await j.json(bulkPath);
    const groupComponents = rows => rows.filter(row => row.groupId === group.id);
    const reviewFields = rows => rows.map(({ id, name, description, displayOrder }) => ({ id, name, description, displayOrder }));
    assert.deepEqual(groupComponents(before.components).map(row => row.id), [monitoring.id, routing.id, retired.id, control.id]);

    const csv = [
      'id,name,description,display_order,action',
      `${monitoring.id},Edge monitoring,"Checks ""north"", south\nand west",1,upsert`,
      `${routing.id},Routing,Original routing,0,upsert`,
      `${retired.id},,,,delete`,
    ].join('\n');
    const expected = [
      { id: routing.id, name: 'Routing', description: 'Original routing', displayOrder: 0 },
      { id: monitoring.id, name: 'Edge monitoring', description: 'Checks "north", south\nand west', displayOrder: 1 },
      { id: control.id, name: 'Unlisted control', description: 'Keep this description', displayOrder: 3 },
    ];
    const preview = await j.json(`${bulkPath}/preview`, 'POST', { csv });
    assert.equal(preview.revision, beforeReview.revision);
    assert.deepEqual(preview.counts, {
      components: { created: 0, changed: 2, deleted: 1 },
      groups: { created: 0, changed: 0, deleted: 0 },
    });
    assert.deepEqual(preview.removed, { components: ['Retired relay'], groups: [] });
    assert.deepEqual(preview.catalogue.groups, beforeReview.catalogue.groups);
    assert.deepEqual(reviewFields(groupComponents(preview.catalogue.components).sort((a, b) => a.displayOrder - b.displayOrder)), expected);
    assert.deepEqual(await j.json(bulkPath), beforeReview, 'preview leaves the stored catalogue and revision unchanged');
    assert.deepEqual(await readComponents(), before, 'the original records and order remain until apply');

    const { catalogue, revision, reviewToken } = preview;
    const unreviewedDeletion = { ...catalogue, components: catalogue.components.filter(row => row.id !== control.id) };
    const refused = await j.json(`${bulkPath}/apply`, 'POST', { catalogue: unreviewedDeletion, revision, reviewToken }, 400);
    assert.match(refused.error, /changed after review/);
    assert.deepEqual(await readComponents(), before, 'refusing the unreviewed deletion changes nothing');

    await j.json(`${bulkPath}/apply`, 'POST', { catalogue, revision, reviewToken });
    const saved = await readComponents();
    assert.deepEqual(reviewFields(groupComponents(saved.components)), expected, 'the native list returns the exact survivors in their new order');
    assert.ok(!saved.components.some(row => row.id === retired.id), 'the named component is deleted from the catalogue');
    assert.deepEqual(saved.components.find(row => row.id === control.id), before.components.find(row => row.id === control.id));
    assert.deepEqual(saved.groups, before.groups);
  } finally { await j.close(); }
});

function descendants(node) {
  return (node.childNodes ?? []).flatMap(child => [child, ...descendants(child)]);
}
function nodeText(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(nodeText).join('');
}
function hasClass(node, name) {
  return node.attrs?.some(attr => attr.name === 'class' && attr.value.split(' ').includes(name));
}

async function assertPublicBranding(j, { state, pageName, logoBytes, previousVersion }) {
  const attribute = (node, name) => node?.attrs?.find(attr => attr.name === name)?.value;
  const isCurrent = response => response.ok && response.headers.get('x-lamp-snapshot-state') !== 'stale';
  const { version, html } = await eventually(async () => {
    const response = await j.publicResponse('/api/public/status');
    if (!isCurrent(response)) {
      await response.text();
      return;
    }
    const { overall } = await response.json();
    const version = response.headers.get('x-lamp-snapshot-version');
    if (overall !== state || !version || version === previousVersion) return;

    const document = await j.publicResponse('/');
    const html = await document.text();
    if (!isCurrent(document) || document.headers.get('x-lamp-snapshot-version') !== version) return;
    assert.match(document.headers.get('content-type') ?? '', /^text\/html\b/);
    return { version, html };
  }, Boolean, `a current ${state} snapshot is published`);

  const readArtifact = async (url, type) => {
    assert.equal(url.origin, j.publicOrigin, `${url.pathname} is first-party`);
    const response = await j.publicResponse(url);
    assert.equal(response.status, 200, url.pathname);
    assert.match(response.headers.get('content-type') ?? '', type, url.pathname);
    assert.notEqual(response.headers.get('x-lamp-snapshot-state'), 'stale', url.pathname);
    assert.equal(response.headers.get('x-lamp-snapshot-version'), version, url.pathname);
    return response.text();
  };

  const elements = descendants(parse(html));
  const label = elements.find(node => attribute(node, 'id') === 'overall-status');
  assert.ok(label, 'the public page shows its overall state');
  const labelText = nodeText(label).trim();
  assert.equal(labelText, expectedComponentLabels[state]);
  const expectedTitle = `${pageName}: ${labelText}`;
  const head = elements.find(node => node.tagName === 'head');
  const metadata = property => attribute(head.childNodes.find(node => node.tagName === 'meta' && attribute(node, 'property') === property), 'content');
  assert.equal(metadata('og:title'), expectedTitle);
  const icon = head.childNodes.find(node => node.tagName === 'link' && attribute(node, 'rel') === 'icon');
  const faviconHref = attribute(icon, 'href');
  const socialHref = metadata('og:image');
  const stylesheet = head.childNodes.find(node => node.tagName === 'link' && attribute(node, 'rel') === 'stylesheet');
  const stylesheetHref = attribute(stylesheet, 'href');
  assert.ok(faviconHref, 'the public document advertises a favicon');
  assert.ok(socialHref, 'the public document advertises an Open Graph image');
  assert.ok(stylesheetHref, 'the public document advertises its stylesheet');
  const faviconUrl = new URL(faviconHref, j.publicOrigin);
  const socialUrl = new URL(socialHref);

  const readArtwork = async url => {
    const svg = parseFragment(await readArtifact(url, /^image\/svg\+xml\b/)).childNodes.find(node => node.tagName === 'svg');
    assert.ok(svg, `${url.pathname} serves SVG artwork`);
    const image = svg.childNodes.find(node => node.tagName === 'image');
    const embedded = attribute(image, 'href')?.match(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/);
    assert.ok(embedded, `${url.pathname} embeds a PNG`);
    assert.deepEqual(Buffer.from(embedded[1], 'base64'), logoBytes, `${url.pathname} embeds the original uploaded logo`);
    return svg.childNodes;
  };
  const favicon = await readArtwork(faviconUrl);
  const mark = favicon.find(node => node.tagName === 'circle');
  assert.ok(Number(attribute(mark, 'r')) > 0, 'the favicon draws a state mark over the logo');
  const stateMark = attribute(mark, 'fill');
  const css = await readArtifact(new URL(stylesheetHref, j.publicOrigin), /^text\/css\b/);
  const stateColor = state === 'Operational' ? '--ok' : '--down';
  const publicColor = css.match(new RegExp(`${stateColor}:\\s*(#[a-fA-F0-9]+)`))?.[1];
  assert.ok(publicColor, `the public stylesheet exposes the ${state} color`);
  assert.equal(stateMark, publicColor, `the favicon mark matches the public ${state} color`);

  const social = await readArtwork(socialUrl);
  assert.deepEqual(social.filter(node => node.tagName === 'text').map(nodeText), [expectedTitle], 'the served Open Graph image visibly states the public overall status');
  return { version, stateMark, labelText, faviconPath: faviconUrl.pathname, socialPath: socialUrl.pathname };
}

function rssItems(xml) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
    guid: item.match(/<guid\b[^>]*>([^<]+)<\/guid>/)?.[1],
    description: item.match(/<description>([^<]*)<\/description>/)?.[1],
  }));
}

async function readNativeHistoryFeeds(j, incident, update) {
  let historyRss;
  for (const format of ['atom', 'rss']) {
    const canonicalPath = `/feed.${format}`;
    const historyPath = `/history.${format}`;
    const [canonical, history] = await Promise.all([canonicalPath, historyPath].map(path => j.publicResponse(path)));
    assert.equal(canonical.status, 200, canonicalPath);
    assert.equal(history.status, 200, historyPath);
    assert.equal(history.headers.get('content-type'), canonical.headers.get('content-type'), historyPath);
    const [canonicalBytes, historyBytes] = await Promise.all([canonical.bytes(), history.bytes()]);
    assert.deepEqual(historyBytes, canonicalBytes, `${historyPath} serves the canonical bytes on a fresh native installation`);
    const body = new TextDecoder().decode(historyBytes);
    assert.ok(body.includes(incident.reference), `${historyPath} contains the native incident`);
    assert.ok(body.includes(`:event:update-${update.id}</`), `${historyPath} contains the native publication`);
    console.info(`PAGE-017 ${historyPath}: 200, ${historyBytes.length} bytes equal to ${canonicalPath}; native update ${update.id}`);
    if (format === 'rss') historyRss = { etag: history.headers.get('etag'), items: rssItems(body) };
  }
  assert.ok(historyRss.etag, 'the history RSS alias supplies a validator');
  assert.ok(historyRss.items.length && historyRss.items.every(item => item.guid), 'the history RSS contains prior item GUIDs');
  return historyRss;
}

async function pollHistoryRss(j, baseline, updateId, impact, publishedAt) {
  const deadline = publishedAt + 10_000;
  // This installation's feed identity is seeded by openStatusJourney.
  const expectedGuid = `urn:lamp:synthetic-lamp-feed-1:event:update-${updateId}`;
  const url = new URL('/history.rss', j.publicOrigin).href;
  const headers = { 'If-None-Match': baseline.etag };
  const signal = AbortSignal.timeout(Math.max(1, Math.ceil(deadline - performance.now())));
  assert.ok(!baseline.items.some(item => item.guid === expectedGuid), 'the new GUID was absent before publication');

  while (performance.now() < deadline) {
    const response = await j.raw(url, { headers, signal });
    if (response.status !== 304) {
      assert.equal(response.status, 200, 'the history RSS alias responds to the old validator');
      const items = rssItems(await response.text());
      const elapsed = performance.now() - publishedAt;
      const published = items.filter(item => item.guid === expectedGuid);
      if (published.length) {
        assert.ok(elapsed <= 10_000, 'the reader observes the new GUID within ten seconds of publication');
        assert.ok(response.headers.get('etag') && response.headers.get('etag') !== baseline.etag, 'the new RSS bytes have a new validator');
        assert.equal(published.length, 1, 'the new publication has exactly one RSS item');
        assert.ok(published[0].description, 'the new item has a description');
        const html = nodeText(parseFragment(published[0].description));
        const updateLine = nodeText(parseFragment(html)).split('\n').find(line => line.startsWith('Update: '));
        assert.equal(updateLine, `Update: ${impact}`, 'the exact submitted resolution wording belongs to the new GUID');
        const currentGuids = new Set(items.map(item => item.guid));
        for (const { guid } of baseline.items) assert.ok(currentGuids.has(guid), `the history RSS retains ${guid}`);
        console.info(`PAGE-017 /history.rss: old validator received 200 for ${expectedGuid} after ${Math.round(elapsed)} ms; retained ${baseline.items.length} prior GUIDs; wording: ${impact}`);
        return;
      }
    }
    await delay(50);
  }
  assert.fail(`the history RSS alias did not serve ${expectedGuid} within ten seconds of publication`);
}
test('PAGE-001 — initial HTML lists all active maintenance and includes the fourteen-day boundary', async () => {
  const j = await openStatusJourney({ pageHost: 'localhost', workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  try {
    const generation = Date.parse('2031-02-10T16:00:00.000Z');
    const horizon = generation + 14 * 24 * 60 * 60 * 1000;
    const beforeGeneration = generation - 60_000;
    const setClock = now => j.json('/test/clock', 'PUT', { now }, 204);
    const rootAt = instant => {
      const expectedAt = new Date(instant).toISOString();
      return eventually(async () => {
        const response = await j.publicResponse('/');
        return { status: response.status, generatedAt: response.headers.get('x-lamp-snapshot-generated-at'), html: await response.text() };
      }, response => response.status === 200 && response.generatedAt === expectedAt, 'the root serves the expected publication generation');
    };
    const attribute = (node, name) => node?.attrs?.find(attr => attr.name === name)?.value;
    const links = elements => elements.filter(node => node.tagName === 'a' && attribute(node, 'href')?.startsWith('/maintenance/'));
    await setClock(beforeGeneration);
    await j.signIn(undefined, { fresh: true });
    const componentName = 'Synthetic Lamp maintenance service';
    const component = await j.component(componentName);
    const affectedAudience = 'Service customers';
    const fixture = [
      { title: 'Search index migration', start: generation - 3_600_000, state: 'In progress', listed: true },
      { title: 'Message relay rotation', start: generation - 1_800_000, state: 'In progress', listed: true },
      { title: 'Storage capacity expansion', start: horizon - 1, state: 'Scheduled', listed: true },
      { title: 'Traffic gateway upgrade', start: horizon, state: 'Scheduled', listed: true },
      { title: 'Reporting index rebuild', start: horizon + 1, state: 'Scheduled', listed: false },
    ];
    const records = [];
    for (const { title, start, state, listed } of fixture) {
      const startsAt = new Date(start).toISOString();
      const endsAt = new Date(start + 7_200_000).toISOString();
      const customerImpact = `${title} may briefly delay requests.`;
      const { maintenance: created } = await j.json('/api/app/maintenance', 'POST', {
        title, startsAt, endsAt, customerImpact, affectedAudience,
        componentIds: [component.id], autoStart: false, autoComplete: false,
      }, 201);
      records.push({ id: created.id, href: `/maintenance/${encodeURIComponent(created.reference)}`, title, startsAt, endsAt, state, listed, customerImpact });
    }
    const startWindow = record => j.json(`/api/app/maintenance/${record.id}/start`, 'POST', {});
    await startWindow(records[0]);
    const earlier = await rootAt(beforeGeneration);
    const earlierLinks = links(descendants(parse(earlier.html))).map(link => attribute(link, 'href'));
    assert.ok(earlierLinks.includes(records[0].href), 'the earlier generation serves real maintenance');
    for (const scheduled of records.slice(2)) {
      assert.ok(!earlierLinks.includes(scheduled.href), scheduled.title + ' is outside the earlier horizon');
    }
    await setClock(generation);
    await startWindow(records[1]);

    const saved = (await j.json('/api/app/maintenance')).maintenance;
    const windowFields = ({ title, startsAt, endsAt, state }) => ({ title, startsAt, endsAt, state });
    const inventory = rows => rows.map(row => ({ id: row.id, ...windowFields(row), customerImpact: row.customerImpact }))
      .sort((left, right) => left.id.localeCompare(right.id));
    assert.deepEqual(inventory(saved), inventory(records), 'native readback contains exactly the five submitted windows');

    const snapshot = await rootAt(generation);
    const { generatedAt } = snapshot;
    const nodes = descendants(parse(snapshot.html));
    const generationLabel = nodes.find(node => attribute(node, 'data-generated-at') !== undefined);
    assert.equal(attribute(descendants(generationLabel).find(node => node.tagName === 'time'), 'datetime'), generatedAt);
    const maintenanceArticles = elements => elements.filter(node => node.tagName === 'article' && hasClass(node, 'maintenance'));
    const windowDetails = article => {
      const elements = descendants(article);
      const times = descendants(elements.find(node => hasClass(node, 'maintenance-window')))
        .filter(node => node.tagName === 'time').map(node => attribute(node, 'datetime'));
      assert.equal(times.length, 2, 'each entry presents exactly one start and one end');
      const [startsAt, endsAt] = times;
      return { startsAt, endsAt, state: nodeText(elements.find(node => hasClass(node, 'lifecycle-pill'))) };
    };
    const assertWindowWording = (article, record) => {
      const elements = descendants(article);
      const affected = elements.find(node => hasClass(node, 'incident-meta'));
      assert.equal(nodeText(affected), 'Affects ' + componentName, record.title);
      const hasImpact = elements.some(node =>
        node.tagName === 'dt' && nodeText(node) === 'Customer impact' &&
        node.parentNode.childNodes.some(value => value.tagName === 'dd' && nodeText(value) === record.customerImpact));
      assert.ok(hasImpact, record.title + ' shows its own published customer impact');
    };
    const listed = records.filter(record => record.listed);
    const byTitle = (left, right) => left.title.localeCompare(right.title);
    const articles = maintenanceArticles(nodes);
    assert.deepEqual(articles.map(article => {
      const entryLinks = links(descendants(article));
      assert.equal(entryLinks.length, 1, 'each maintenance entry has one native permalink');
      const [link] = entryLinks;
      return { title: nodeText(link), href: attribute(link, 'href'), ...windowDetails(article) };
    }).sort(byTitle), listed.map(record => ({ ...windowFields(record), href: record.href })).sort(byTitle));
    for (const article of articles) {
      const [link] = links(descendants(article));
      assertWindowWording(article, listed.find(record => record.href === attribute(link, 'href')));
    }
    assert.deepEqual(links(nodes).map(link => attribute(link, 'href')).sort(), listed.map(record => record.href).sort(),
      'the complete initial HTML has exactly the four expected maintenance links');
    const outside = records.find(record => !record.listed);
    assert.ok(!snapshot.html.includes(outside.title), 'the scheduled window one millisecond outside is absent');

    for (const record of records) {
      const response = await j.publicResponse(record.href);
      assert.equal(response.status, 200, record.href);
      assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), generatedAt, record.href);
      const [article, ...extra] = maintenanceArticles(descendants(parse(await response.text())));
      assert.ok(article, record.href);
      assert.equal(extra.length, 0, record.href);
      const title = nodeText(descendants(article).find(node => node.tagName === 'h1'));
      assert.deepEqual({ title, ...windowDetails(article) }, windowFields(record), record.href);
      assertWindowWording(article, record);
    }
    console.log(`PROBE PAGE-001 3: anonymous initial HTML generated at ${generatedAt} -> two active windows and starts at fourteen days minus one millisecond and exactly fourteen days; the following millisecond is absent, and all five native permalinks resolve`);

    if (process.env.LAMP_SCREENSHOTS) {
      const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, headless: true, args: ['--no-sandbox'] });
      try {
        await mkdir(process.env.LAMP_SCREENSHOTS, { recursive: true });
        for (const width of [1440, 390]) {
          const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width, height: 1000 } });
          await page.goto(j.publicOrigin);
          await page.screenshot({ path: `${process.env.LAMP_SCREENSHOTS}/${width}-maintenance-horizon.png`, fullPage: true });
          await page.getByRole('link', { name: records[3].title, exact: true }).click();
          await page.screenshot({ path: `${process.env.LAMP_SCREENSHOTS}/${width}-maintenance-permalink.png`, fullPage: true });
          await page.close();
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    await j.close();
  }
});

const statedMethod = [
  'Operational counts as 0 downtime minutes',
  'Under maintenance counts as 0 downtime minutes',
  'Degraded performance counts as 0.5 downtime minutes',
  'Partially unavailable counts as 1 downtime minute',
  'Major outage counts as 1 downtime minute',
  'Uptime uses a 90-day window',
];

// A single isolated component keeps a published incident's contribution separate
// from standing claims, corrections and the other journey's capacity fixtures.
async function statedUptimeMethodJourney() {
  const j = await openStatusJourney({ pageHost: 'localhost', workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  let browser;
  const start = Date.UTC(2030, 0, 15, 12);
  const minute = 60_000;
  const iso = at => new Date(at).toISOString();
  const advance = async at => assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: at }) })).status, 204);
  const snapshotAt = (path, at) => eventually(async () => {
    const response = await j.publicResponse(path);
    assert.equal(response.status, 200, path);
    return { generatedAt: response.headers.get('x-lamp-snapshot-generated-at'), text: await response.text() };
  }, result => result.generatedAt === iso(at), `${path} reflects the controlled publication instant`);
  try {
    await advance(start);
    await j.signIn(undefined, { fresh: true });
    const component = await j.component('Synthetic Lamp publication uptime');
    assert.equal(component.createdAt, iso(start));
    await advance(start + 60 * minute);
    const savedSettings = (await j.json('/api/app/page-settings')).settings;
    const settings = Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'mailFromAddress', 'template', 'footerCreditEnabled', 'widgetAllowedOrigins'].map(key => [key, savedSettings[key]]));
    await j.json('/api/app/page-settings', 'PUT', { ...settings, pageName: 'Synthetic Lamp uptime method' });
    const before = JSON.parse((await snapshotAt('/api/public/v1/components', start + 60 * minute)).text).data;
    assert.deepEqual(before.map(row => [row.id, row.state, row.uptime.percentage, row.uptime.coverageMinutes]), [[component.id, 'Operational', '100.00%', 60]]);

    const incident = await j.incident('Synthetic Lamp timed publication', [component]);
    await j.save(incident.id, { nextUpdateAt: iso(start + 120 * minute) });
    const published = (await j.publish(incident.id)).update;
    assert.equal(published.publishedAt, iso(start + 60 * minute));
    const active = await j.read(incident.id);
    assert.deepEqual(active.components.map(row => [row.componentId, row.state]), [[component.id, 'Major outage']]);
    await j.visible('/', incident.title);
    const during = JSON.parse(await j.publicText('/api/public/v1/components')).data;
    assert.equal(during.find(row => row.id === component.id).state, 'Major outage');

    await advance(start + 90 * minute);
    await j.save(incident.id, { lifecycle: 'Resolved', customerImpact: 'Synthetic Lamp requests have recovered.', nextUpdateAt: null });
    const resolved = (await j.publish(incident.id)).update;
    assert.equal(resolved.publishedAt, iso(start + 90 * minute));
    assert.equal((await j.read(incident.id)).resolvedAt, iso(start + 90 * minute));
    const after = JSON.parse((await snapshotAt('/api/public/v1/components', start + 90 * minute)).text).data;
    assert.equal(after.length, 1);
    assert.equal(after[0].id, component.id);
    assert.equal(after[0].state, 'Operational');
    // Sixty healthy minutes, then thirty published outage minutes: 60 of 90
    // available minutes, rounded down. No production arithmetic is imported.
    assert.equal(after[0].uptime.coverageMinutes, 90);
    assert.equal(after[0].uptime.percentage, '66.66%');
    assert.ok(parseFloat(after[0].uptime.percentage) < parseFloat(before[0].uptime.percentage));
    assert.equal(after[0].uptime.marks.reduce((sum, mark) => sum + (mark.downtimeMinutes ?? 0), 0), 30);
    const history = (await j.json(`/api/app/components/${component.id}/history`)).history;
    for (const [at, state] of [[start + 60 * minute, 'Major outage'], [start + 90 * minute, 'Operational']]) {
      assert.ok(history.some(row => row.causeId === incident.id && row.changedAt === iso(at) && row.newState === state));
    }

    const html = (await snapshotAt('/', start + 90 * minute)).text;
    const nodes = descendants(parse(html));
    const section = nodes.find(node => hasClass(node, 'component-health'));
    assert.ok(section, 'initial HTML places the method beside the component figures');
    const componentRows = descendants(section).filter(node => node.tagName === 'article' && hasClass(node, 'component')
      && descendants(node).some(child => child.tagName === 'h4' && nodeText(child) === component.name));
    assert.equal(componentRows.length, 1);
    const figure = descendants(componentRows[0]).find(node => hasClass(node, 'uptime-number'));
    assert.equal(nodeText(figure), '66.66% over 1 hour 30 minutes', 'the associated initial-HTML figure agrees with the public collection');
    const method = descendants(section).find(node => hasClass(node, 'availability-method'));
    assert.ok(method, 'the method is present before scripting runs');
    const methodText = nodeText(method);
    for (const expected of statedMethod) assert.ok(methodText.includes(expected), `initial HTML explains ${expected}`);

    browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto(j.publicOrigin);
    const visibleComponent = page.locator('article.component').filter({ has: page.getByRole('heading', { name: component.name, exact: true }) });
    assert.equal(await visibleComponent.locator('.uptime-number').innerText(), '66.66% over 1 hour 30 minutes');
    await page.getByText('How availability is calculated', { exact: true }).click();
    assert.equal(await page.locator('.availability-method p').innerText(), nodeText(descendants(method).find(node => node.tagName === 'p')));
    if (process.env.LAMP_SCREENSHOTS) {
      await mkdir(process.env.LAMP_SCREENSHOTS, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: `${process.env.LAMP_SCREENSHOTS}/${width}-stated-uptime-method.png`, fullPage: true });
      }
    }

    // Every other built-in layout an owner publishes from Settings states the same method beside its figures.
    // Regions map needs public components in two regions: the component gains one and a second joins another.
    await j.json(`/api/app/components/${component.id}`, 'PUT', { name: component.name, groupId: null, description: '', region: 'North America', internal: false, displayOrder: 0, note: '' });
    await j.component('Synthetic Lamp second region', { region: 'Europe', displayOrder: 1 });
    const layouts = { calm: ['calm-components', 'calm-row'], uptime: ['up-heatmap', 'hm-label'], regions: ['rg-components', 'rg-row'] };
    const stated = {};
    for (const [template, [sectionClass, rowClass]] of Object.entries(layouts)) {
      await j.json('/api/app/page-settings', 'PUT', { ...settings, pageName: 'Synthetic Lamp uptime method', template });
      const layoutHtml = await eventually(() => j.publicText('/'), body => body.includes(`data-template="${template}"`), `${template} layout reaches the public root`);
      const layoutSection = descendants(parse(layoutHtml)).find(node => hasClass(node, sectionClass));
      const layoutText = layoutSection ? nodeText(layoutSection) : '';
      const row = layoutSection && descendants(layoutSection).find(node => hasClass(node, rowClass) && nodeText(node).includes(component.name));
      stated[template] = { figure: row && nodeText(row).match(/\d+\.\d{2}%/)?.[0], method: statedMethod.filter(statement => layoutText.includes(statement)) };
    }
    assert.deepEqual(stated, Object.fromEntries(Object.keys(layouts).map(template => [template, { figure: '66.66%', method: statedMethod }])), 'each built-in layout states every weight and the window beside the component figure');
  } finally { await browser?.close(); await j.close(); }
}

// Keep the same installed nodes across native publication and real HTTP polls.
async function widgetVariantsJourney() {
  const j = await openStatusJourney({ pageHost: 'localhost', workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  let browser;
  const now = Date.UTC(2032, 3, 12, 12);
  let clock = now;
  const advance = async () => assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: clock += 60000 }) })).status, 204);
  try {
    assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now }) })).status, 204);
    await j.signIn(undefined, { fresh: true });
    const settings = (await j.json('/api/app/page-settings')).settings;
    await j.json('/api/app/page-settings', 'PUT', {
      ...Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'footerCreditEnabled', 'mailFromAddress', 'aiToneInstructions'].map(key => [key, settings[key]])),
      widgetAllowedOrigins: [j.publicOrigin],
    });
    const component = await j.component('Synthetic Lamp embed service');
    const snapshot = (overall, incident, maintenance) => eventually(async () => (await j.publicResponse('/api/public/status')).json(),
      data => data.overall === overall && data.incident?.reference === incident && data.maintenance?.state === maintenance,
      `embed snapshot becomes ${overall} with incident ${incident} and maintenance ${maintenance}`);
    await snapshot('Operational', undefined, undefined);
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await openWidgetHost(context, j.publicOrigin);
    const servedScripts = async () => {
      for (const installation of widgetInstallations) {
        const response = await j.publicResponse(installation.path);
        assert.equal(response.status, 200);
        const source = await response.text();
        assert.ok(Buffer.byteLength(source) <= 10 * 1024, `${installation.id} served script stays within ten KiB`);
        assert.ok(gzipSync(Buffer.from(source)).byteLength <= 10 * 1024, `${installation.id} served script stays within ten KiB gzipped`);
      }
    };
    await servedScripts();
    const installed = [];
    for (const installation of widgetInstallations) {
      for (const hide of [false, true]) installed.push({ installation, hide, root: await installWidget(page, j.publicOrigin, installation, hide) });
    }
    assert.equal(await page.locator('section[role=status]').count(), 8);
    const reconcile = async (expected, active) => {
      for (const { installation, hide, root } of installed) {
        const floating = Boolean(installation.position);
        assert.equal(await root.locator('strong').textContent(), expectedComponentLabels[expected.overall], `${installation.id} exact snapshot state`);
        assert.equal(await root.evaluate(node => getComputedStyle(node).display), (floating && !active) || (hide && expected.overall === 'Operational') ? 'none' : installation.display, `${installation.id} operational and event visibility`);
        const style = await root.evaluate(node => {
          const css = getComputedStyle(node);
          return { color: css.color, background: css.backgroundColor, position: css.position, top: css.top, bottom: css.bottom, left: css.left, right: css.right, display: css.display, padding: css.padding, border: css.borderWidth };
        });
        assert.equal(style.color, 'rgb(18, 52, 86)', `${installation.id} configured foreground`);
        assert.equal(style.background, 'rgb(228, 239, 250)', `${installation.id} configured background`);
        if (floating) {
          assert.equal(style.position, 'fixed', `${installation.id} is a floating notice`);
          const expectedEdges = installation.position === 'top-left' ? ['16px', 'auto', '16px', 'auto'] : ['auto', '16px', 'auto', '16px'];
          const selected = installation.position === 'top-left' ? [style.top, style.left] : [style.bottom, style.right];
          assert.deepEqual(selected, ['16px', '16px'], `${installation.id} exact computed selected corner`);
          assert.deepEqual(await root.evaluate(node => [node.style.top, node.style.bottom, node.style.left, node.style.right]), expectedEdges.map(value => value === 'auto' ? '' : value), `${installation.id} sets only the selected edges`);
        } else {
          assert.equal(style.position, 'static', `${installation.id} remains in document flow`);
          if (installation.variant === 'dot') {
            assert.equal(style.padding, '4px 0px');
            assert.equal(style.border, '0px');
          } else assert.equal(style.padding, '14px 16px');
        }
        const detail = root.locator('span').last();
        const message = installation.variant === 'dot' ? '' : expected.incident ? expected.incident.message.replace(/\n\n+/g, '\n')
          : expected.maintenance ? `${expected.maintenance.reference}: ${expected.maintenance.title}\n${expected.maintenance.state}` : '';
        assert.equal(await detail.textContent(), message, `${installation.id} reconciles the same snapshot content`);
        assert.equal(await detail.evaluate(node => getComputedStyle(node).color), 'rgb(18, 52, 86)');
        const dotColor = expected.overall === 'Operational' ? 'rgb(25, 134, 90)' : expected.overall === 'Under maintenance' ? 'rgb(79, 111, 168)' : expected.overall === 'Degraded performance' ? 'rgb(201, 138, 18)' : 'rgb(180, 68, 50)';
        assert.equal(await root.locator('span').first().evaluate(node => getComputedStyle(node).backgroundColor), dotColor, `${installation.id} exact dot state`);
      }
    };
    const poll = async expected => {
      const replies = [];
      const capture = response => { if (new URL(response.url()).pathname === '/api/public/status') replies.push(response); };
      page.on('response', capture);
      try {
        await page.clock.fastForward(30000);
        await eventually(() => replies.length, count => count === installed.length, 'every installed variant receives an actual polling response');
        for (const response of replies) { assert.equal(response.status(), 200); assert.deepEqual(await response.json(), expected); }
        await page.waitForFunction(overall => [...document.querySelectorAll('section[role=status] strong')].every(node => node.textContent === overall), expectedComponentLabels[expected.overall]);
      } finally { page.off('response', capture); }
    };
    const screen = async name => {
      if (!process.env.LAMP_WIDGET_SCREENSHOTS) return;
      await mkdir(process.env.LAMP_WIDGET_SCREENSHOTS, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: `${process.env.LAMP_WIDGET_SCREENSHOTS}/widget-${name}-${width}.png`, fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    };
    await reconcile(await snapshot('Operational', undefined, undefined), false);
    await screen('initial-hidden');
    await advance();
    await j.json(`/api/app/components/${component.id}/standing-claim`, 'PUT', { state: 'Degraded performance' });
    let expected = await snapshot('Degraded performance', undefined, undefined);
    await poll(expected); await reconcile(expected, false);
    await advance();
    await j.json(`/api/app/components/${component.id}/standing-claim`, 'PUT', { state: 'Operational' });
    expected = await snapshot('Operational', undefined, undefined);
    await poll(expected); await reconcile(expected, false);
    const maintenance = (await j.json('/api/app/maintenance', 'POST', {
      title: 'Synthetic Lamp embed maintenance', affectedAudience: 'Service customers', customerImpact: 'Routine maintenance.',
      startsAt: new Date(now + 3600000).toISOString(), endsAt: new Date(now + 7200000).toISOString(),
      componentIds: [component.id], autoStart: false, autoComplete: false,
    }, 201)).maintenance;
    expected = await snapshot('Operational', undefined, undefined);
    await poll(expected); await reconcile(expected, false);
    await advance();
    await j.json(`/api/app/maintenance/${maintenance.id}/start`, 'POST', {});
    expected = await snapshot('Under maintenance', undefined, 'In progress');
    assert.equal(expected.incident, null, 'maintenance is the only active event');
    assert.deepEqual(expected.maintenance, { reference: maintenance.reference, title: maintenance.title, state: 'In progress' });
    await poll(expected); await reconcile(expected, true); await screen('maintenance');
    console.log('PROBE PAGE-019 1: native maintenance without an incident -> both floating installations visible; inactive and operational controls hide every configured variant');
    await advance();
    await j.json(`/api/app/maintenance/${maintenance.id}/complete`, 'POST', {});
    expected = await snapshot('Operational', undefined, undefined);
    await poll(expected); await reconcile(expected, false);
    await advance();
    const incident = await j.incident('Synthetic Lamp embed publication', [component]);
    await j.save(incident.id, { affectedAudience: 'Synthetic Lamp embed customers', customerImpact: 'Synthetic Lamp requests are unavailable.', whatStillWorks: 'Saved results remain readable.', details: 'Responders are repairing the gateway.', nextUpdateAt: new Date(now + 3600000).toISOString() });
    expected = await snapshot('Operational', undefined, undefined);
    await poll(expected); await reconcile(expected, false);
    await advance();
    const publication = (await j.publish(incident.id)).update;
    expected = await snapshot('Major outage', incident.reference, undefined);
    assert.equal(expected.incident.publishedAt, publication.publishedAt);
    assert.equal(expected.incident.title, 'Synthetic Lamp embed publication');
    assert.ok(expected.incident.message.includes('Synthetic Lamp requests are unavailable.'));
    await poll(expected); await reconcile(expected, true); await servedScripts(); await screen('published');
    console.log('PROBE PAGE-019 2: four served installations and populated script artifacts -> exact shared snapshot, raw and gzip size within ten KiB');
    console.log('PROBE PAGE-019 4: native publication and polling -> floating notices appear with exact selected corners and computed colors');
    await advance();
    await j.save(incident.id, { lifecycle: 'Resolved', customerImpact: 'Synthetic Lamp requests have recovered.', nextUpdateAt: null });
    await j.publish(incident.id);
    assert.equal((await j.read(incident.id)).lifecycle, 'Resolved');
    expected = await snapshot('Operational', undefined, undefined);
    assert.equal(expected.incident, null); assert.equal(expected.maintenance, null);
    await poll(expected); await reconcile(expected, false);
    for (const { installation, root } of installed.filter(row => row.installation.position)) {
      assert.equal(await root.isVisible(), false, `${installation.id} positively disappears after native resolution and polling`);
      assert.equal(await root.count(), 1, 'the original installed node remains attached');
    }
    await screen('resolved');
    console.log('PROBE PAGE-019 4: native resolution followed by eight actual HTTP polls -> original floating nodes remain attached and are positively hidden');
  } finally { await browser?.close(); await j.close(); }
}

// One catalogue-to-customer journey: no renderer or uptime helper is imported.
async function assertCompetingClaimStepDown(j, publisherEmail, publisherId) {
  for (const { secondState, expectedAggregate, expectedRows } of [
    { secondState: 'Partially unavailable', expectedAggregate: 'Partially unavailable', expectedRows: 1 },
    { secondState: 'Major outage', expectedAggregate: 'Major outage', expectedRows: 0 },
  ]) {
    const scenario = `second claimant holds ${secondState}`;
    await j.signIn();
    const component = await j.component(`Synthetic overlap service with ${secondState}`);
    const primary = await j.incident(`Primary incident on ${component.name}`, [component]);
    const secondary = await j.incident(`Second incident on ${component.name}`, [component]);
    const publishState = async (incidentId, state, fields = {}) => {
      await j.save(incidentId, { componentChanges: [{ componentId: component.id, state }], ...fields });
      return (await j.publish(incidentId)).update;
    };
    const readHistory = async () => {
      const { history, historyPage } = await j.json(`/api/app/components/${component.id}/history`);
      assert.equal(historyPage.nextCursor, null, `${scenario}: the read includes every history row`);
      return history;
    };
    const aggregate = async () => (await j.json('/api/app/components')).components.find(row => row.id === component.id).publicState;
    const attachment = incident => incident.components.map(({ componentId, state, publishedAt }) => ({ componentId, state, publishedAt }));

    const initialUpdate = await publishState(primary.id, 'Major outage');
    const secondUpdate = await publishState(secondary.id, secondState);
    await j.signIn(publisherEmail);
    const beforePrimary = await j.read(primary.id);
    const beforeSecondary = await j.read(secondary.id);
    assert.equal(beforePrimary.lifecycle, 'Identified', scenario);
    assert.equal(beforeSecondary.lifecycle, 'Identified', scenario);
    assert.deepEqual(attachment(beforePrimary), [{ componentId: component.id, state: 'Major outage', publishedAt: initialUpdate.publishedAt }], scenario);
    assert.deepEqual(attachment(beforeSecondary), [{ componentId: component.id, state: secondState, publishedAt: secondUpdate.publishedAt }], scenario);
    assert.equal(await aggregate(), 'Major outage', scenario);
    const beforeHistory = await readHistory();
    assert.equal(beforeHistory[0]?.newState, 'Major outage', scenario);

    const customerImpact = `Primary recovery reached degraded operation with ${secondState} still claimed.`;
    const stepDown = await publishState(primary.id, 'Degraded performance', { customerImpact });
    const afterPrimary = await j.read(primary.id);
    const afterSecondary = await j.read(secondary.id);
    const committed = afterPrimary.updates.find(update => update.id === stepDown.id);
    assert.deepEqual(committed, stepDown, scenario);
    assert.equal(committed.authorOperatorId, publisherId, scenario);
    assert.equal(afterPrimary.lifecycle, 'Identified', scenario);
    assert.deepEqual(attachment(afterPrimary), [{ componentId: component.id, state: 'Degraded performance', publishedAt: initialUpdate.publishedAt }], scenario);
    assert.equal(afterSecondary.lifecycle, beforeSecondary.lifecycle, scenario);
    assert.deepEqual(afterSecondary.components, beforeSecondary.components, scenario);
    assert.deepEqual(afterSecondary.updates, beforeSecondary.updates, scenario);
    assert.equal(await aggregate(), expectedAggregate, scenario);

    const afterHistory = await readHistory();
    const priorIds = new Set(beforeHistory.map(row => row.id));
    const added = afterHistory.filter(row => !priorIds.has(row.id));
    assert.deepEqual(afterHistory.filter(row => priorIds.has(row.id)), beforeHistory, `${scenario}: earlier rows retain their full values`);
    assert.equal(added.length, expectedRows, scenario);
    if (expectedRows === 1) {
      const { previousState, newState, changedAt, causeType, causeId, operatorId } = added[0];
      assert.deepEqual({ previousState, newState, changedAt, causeType, causeId, operatorId }, {
        previousState: 'Major outage', newState: 'Partially unavailable', changedAt: committed.publishedAt,
        causeType: 'incident', causeId: primary.id, operatorId: publisherId,
      }, scenario);
    }

    await j.visible(`/incidents/${primary.reference}`, customerImpact);
    const response = await j.publicResponse('/api/public/v1/components');
    assert.equal(response.status, 200, scenario);
    assert.equal((await response.json()).data.find(row => row.id === component.id)?.state, expectedAggregate, scenario);
    console.info(`PROBE UPDATE-014 4: ${scenario}; published Major outage to Degraded performance -> ${expectedAggregate}, ${added.length} new history rows`);
  }
}

async function catalogueOrderJourney() {
  const j = await openStatusJourney({ pageHost: 'localhost' });
  let browser;
  try {
    const { settings } = await j.json('/api/app/page-settings');
    const settingsInput = Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'mailFromAddress', 'footerCreditEnabled', 'widgetAllowedOrigins'].map(key => [key, settings[key]]));
    const createGroup = async (name, displayOrder) => (await j.json('/api/app/component-groups', 'POST', { name, displayOrder }, 201)).group;
    const delivery = await createGroup('Delivery services', 0);
    const accounts = await createGroup('Account services', 1);
    const webhooks = await j.component('Webhooks', { groupId: delivery.id, displayOrder: 0, region: 'North America' });
    const dispatch = await j.component('Dispatch', { groupId: delivery.id, displayOrder: 1, region: 'North America' });
    const sessions = await j.component('Sessions', { groupId: accounts.id, displayOrder: 0, region: 'Europe' });
    const directory = await j.component('Directory', { groupId: accounts.id, displayOrder: 1, region: 'Europe' });
    const control = await j.component('Global routing', { displayOrder: 0 });

    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const layouts = [
      ['default', '.component-health', '.component-name h4'],
      ['calm', '.calm-components', '.calm-name h4'],
      ['uptime', '.up-heatmap, .up-components', '.hm-name, .up-name'],
      ['regions', '.rg-components', '.rg-name-text'],
    ];
    const readVersion = async () => {
      const response = await j.publicResponse('/');
      assert.equal(response.status, 200);
      await response.arrayBuffer();
      return response.headers.get('x-lamp-snapshot-version');
    };
    const assertOrder = async (phase, namedGroups) => {
      const saved = await j.json('/api/app/components');
      assert.deepEqual(saved.groups.map(({ id, name, displayOrder }) => [id, name, displayOrder]),
        namedGroups.map(([group], position) => [group.id, group.name, position]), `${phase}: saved groups`);
      const sections = [...namedGroups, [{ id: null, name: 'Other services' }, [control]]];
      const expectedMembers = sections.flatMap(([group, members]) => members.map(({ id, name }, position) => [id, name, group.id, position]));
      const byId = (a, b) => a[0].localeCompare(b[0]);
      assert.deepEqual(saved.components.map(({ id, name, groupId, displayOrder }) => [id, name, groupId, displayOrder]).sort(byId),
        expectedMembers.sort(byId), `${phase}: exact saved membership and positions`);

      const expectedNames = sections.flatMap(([, members]) => members.map(member => member.name));
      for (const [template, container, label] of layouts) {
        // Uptime and Regions also have a flat presentation. Use their group
        // disclosure setting to check actual membership as well as flat order.
        for (const groupsCollapsed of [false, true]) {
          const previous = await readVersion();
          await j.json('/api/app/page-settings', 'PUT', { ...settingsInput, template, theme: { ...settings.theme, groupsCollapsed } });
          const version = await eventually(readVersion, value => value && value !== previous, `${phase}: ${template} publishes a new snapshot`);
          const proofDir = process.env.LAMP_COMP011_SCREENSHOTS;
          for (const width of proofDir ? [1440, 390] : [1440]) {
            const context = `${phase}, ${template}, collapsed=${groupsCollapsed}, ${width}px`;
            await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
            const response = await page.goto(j.publicOrigin);
            assert.equal(response.status(), 200, context);
            assert.equal(response.headers()['x-lamp-snapshot-version'], version, context);
            assert.equal(await page.locator('body').getAttribute('data-template'), template === 'default' ? null : template, context);
            const componentAreas = await page.locator(container).filter({ visible: true }).all();
            // Uptime shows a second component list below its heatmap on phones.
            assert.equal(componentAreas.length, template === 'uptime' && width === 390 ? 2 : 1, context);
            for (const componentArea of componentAreas) {
              if (groupsCollapsed) {
                const disclosures = componentArea.locator('details.component-group:visible, details.theme-component-group:visible');
                assert.deepEqual(await disclosures.locator(':scope > summary').allTextContents(),
                  sections.map(([group]) => group.name), `${context}: group order`);
                for (const [position, [group, members]] of sections.entries()) {
                  const disclosure = disclosures.nth(position);
                  await disclosure.locator(':scope > summary').click();
                  assert.deepEqual(await disclosure.locator(label).filter({ visible: true }).allTextContents(),
                    members.map(member => member.name), `${context}: ${group.name} membership and order`);
                }
              }
              const names = componentArea.locator(label).filter({ visible: true });
              assert.deepEqual(await names.allTextContents(), expectedNames, `${context}: visible component order`);
              const rowTops = await names.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top));
              assert.ok(rowTops.every((top, index) => index === 0 || top > rowTops[index - 1]), `${context}: components are displayed in that order`);
            }
            if (proofDir && groupsCollapsed) {
              await mkdir(proofDir, { recursive: true });
              await page.screenshot({ path: `${proofDir}/${phase}-${template}-${width}.png`, fullPage: true });
            }
          }
        }
      }
    };

    await assertOrder('before', [[delivery, [webhooks, dispatch]], [accounts, [sessions, directory]]]);
    await j.json(`/api/app/component-groups/${delivery.id}/move`, 'POST', { direction: 'down', expectedIds: [delivery.id, accounts.id] });
    await j.json(`/api/app/components/${dispatch.id}/move`, 'POST', { direction: 'up', expectedIds: [webhooks.id, dispatch.id], groupId: delivery.id });
    await j.json(`/api/app/components/${sessions.id}/move`, 'POST', { direction: 'down', expectedIds: [sessions.id, directory.id], groupId: accounts.id });
    await assertOrder('after', [[accounts, [directory, sessions]], [delivery, [dispatch, webhooks]]]);
    console.info('PROBE COMP-011 4: native group and member moves -> saved positions and public order reverse; Global routing stays under Other services');
  } finally { await browser?.close(); await j.close(); }
}

test('SUB-019 PAGE-001 PAGE-002 PAGE-003 PAGE-004 PAGE-007 PAGE-008 PAGE-009 PAGE-010 PAGE-011 PAGE-012 PAGE-013 PAGE-014 PAGE-016 PAGE-017 PAGE-018 PAGE-019 PAGE-020 COMP-001 COMP-002 COMP-003 COMP-004 COMP-005 COMP-007 COMP-009 COMP-010 UPTIME-001 UPTIME-002 UPTIME-003 UPTIME-004 UPTIME-005 UPTIME-006 MOVE-009 — owner maintains a complete catalogue and customers read, refresh, embed and retain its public story', async () => {
  await catalogueOrderJourney();
  await componentReadFlow();
  await widgetVariantsJourney();
  await statedUptimeMethodJourney();
  await conditionalComponentFlow();
  await uptimeCorrectionJourney();
  const j = await openStatusJourney({ pageHost: 'localhost' });
  let browser;
  try {
    const settings = (await j.json('/api/app/page-settings')).settings;
    const pageName = 'Customer service status';
    await j.json('/api/app/page-settings', 'PUT', {
      mailFromAddress: settings.mailFromAddress, pageName, tagline: 'Current service facts', accentColor: '#16794C',
      timezone: 'America/Los_Angeles', hostname: 'localhost', footerCreditEnabled: false,
      widgetAllowedOrigins: [j.publicOrigin],
    });
    const firstGroup = (await j.json('/api/app/component-groups', 'POST', { name: 'Customer services', displayOrder: 0 }, 201)).group;
    const secondGroup = (await j.json('/api/app/component-groups', 'POST', { name: 'Platform services', displayOrder: 1 }, 201)).group;
    const main = await j.component('Public API', { groupId: firstGroup.id, note: 'Requests remain safe to retry.', displayOrder: 0 });
    const other = (await j.json('/api/app/components', 'POST', {
      name: 'Dashboard', groupId: firstGroup.id, description: '', internal: false, displayOrder: 1, onlyShowIfDegraded: true,
    }, 201)).component;
    assert.equal(other.note, '', 'omitting the note at creation returns an empty note');
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === other.id).note, '', 'the empty default persists through an independent native read');
    const noteInput = { name: main.name, groupId: firstGroup.id, description: '', internal: false, displayOrder: 0 };
    const beforeInvalidNotes = await j.json('/api/app/components');
    await j.json('/api/app/components', 'POST', { ...noteInput, name: 'synthetic-lamp-overlength', note: 'n'.repeat(251) }, 400);
    await j.json(`/api/app/components/${main.id}`, 'PUT', { ...noteInput, note: 'n'.repeat(251) }, 400);
    await j.json(`/api/app/components/${main.id}`, 'PUT', noteInput, 400);
    assert.deepEqual(await j.json('/api/app/components'), beforeInvalidNotes, 'invalid notes and omitted edit notes leave the catalogue unchanged');
    const boundaryNote = '<state>&' + 'n'.repeat(242);
    const updated = (await j.json(`/api/app/components/${main.id}`, 'PUT', { ...noteInput, note: boundaryNote })).component;
    assert.equal(updated.note, boundaryNote);
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === main.id).note, boundaryNote);
    const boundaryHtml = await j.visible('/', boundaryNote);
    assert.ok(boundaryHtml.includes(`<p class="component-note">&lt;state&gt;&amp;${'n'.repeat(242)}</p>`), 'the full 250-character note is displayed as plain text beside the state');
    const cleared = (await j.json(`/api/app/components/${main.id}`, 'PUT', { ...noteInput, note: '' })).component;
    assert.equal(cleared.note, '', 'an explicit empty note still clears an existing note');
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === main.id).note, '');
    await j.json(`/api/app/components/${main.id}`, 'PUT', { ...noteInput, note: main.note });
    const hidden = await j.component('PRIVATE database replica', { groupId: secondGroup.id, note: 'PRIVATE topology' });
    // First observe the same component publicly, so exclusion cannot pass on
    // an empty catalogue or a resource that never existed.
    await j.json(`/api/app/components/${hidden.id}/standing-claim`, 'PUT', { state: 'Major outage' });
    const exposed = await j.visible('/', hidden.name);
    assert.match(exposed, /id="overall-status"[^>]*>Down<\/h1>/);
    assert.ok(exposed.includes(hidden.note));
    const exposedComponent = (await (await j.publicResponse('/api/public/v1/components')).json()).data.find(row => row.id === hidden.id);
    assert.equal(exposedComponent.state, 'Major outage');
    assert.ok(exposedComponent.uptime.marks.some(mark => mark.downtimeMinutes > 0));
    for (const resource of ['feed.atom', 'feed.rss', 'badge.svg', 'uptime.svg']) {
      assert.equal((await j.publicResponse(`/components/${hidden.id.toLowerCase()}/${resource}`)).status, 200, resource);
    }
    await j.json(`/api/app/components/${hidden.id}`, 'PUT', {
      name: hidden.name, groupId: secondGroup.id, description: '', note: hidden.note, internal: true,
    });
    const privateCatalogue = (await j.json('/api/app/components')).components;
    assert.equal(privateCatalogue.find(row => row.id === main.id).publicState, 'Operational');
    assert.equal(privateCatalogue.find(row => row.id === hidden.id).publicState, 'Major outage');
    assert.deepEqual(privateCatalogue.filter(row => row.publicState !== 'Operational').map(row => row.id), [hidden.id]);
    const limits = JSON.parse(await readFile('seed.json', 'utf8')).limits;
    const beforeCatalogue = await j.json('/api/app/components/bulk');
    const catalogue = { ...beforeCatalogue.catalogue, components: [...beforeCatalogue.catalogue.components] };
    for (let index = catalogue.components.length; index < limits.components.value; index++) {
      catalogue.components.push({ id: String(index).padStart(26, '0'), name: `Service ${index}`, groupId: secondGroup.id, description: '', internal: false, displayOrder: index, note: '', onlyShowIfDegraded: false, uptimeStartDate: null });
    }
    const review = await j.json('/api/app/components/bulk/preview', 'POST', { catalogue, revision: beforeCatalogue.revision });
    await j.json('/api/app/components/bulk/apply', 'POST', { catalogue: review.catalogue, revision: review.revision, reviewToken: review.reviewToken });
    await j.json('/api/app/components/bulk/apply', 'POST', { catalogue: review.catalogue, revision: review.revision, reviewToken: review.reviewToken }, 409);
    let html = await j.visible('/', pageName);
    assert.ok(html.indexOf(firstGroup.name) < html.indexOf(secondGroup.name));
    assert.ok(!html.includes(other.name), 'a healthy conditional component stays out of the public catalogue');
    assert.ok(html.includes(main.note));
    assert.ok(!html.includes(hidden.name) && !html.includes('PRIVATE topology'));
    assert.match(html, /id="overall-status"[^>]*>Working<\/h1>/, 'the only severe claim is internal');
    assert.equal((await (await j.publicResponse('/api/public/status')).json()).overall, 'Operational');
    assert.equal((await (await j.publicResponse('/badge.json')).json()).message, 'Working');
    assert.match(await j.publicText('/badge.svg'), /id="value"[^>]*>Working<\/text>/);
    const published = [], cursors = new Set();
    let cursor;
    do {
      const path = `/api/public/v1/components${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`;
      const body = await (await j.publicResponse(path)).json();
      for (const value of [hidden.id, hidden.name, hidden.note]) assert.ok(!JSON.stringify(body).includes(value), path);
      published.push(...body.data);
      cursor = body.nextCursor;
      if (cursor) { assert.ok(!cursors.has(cursor), 'public pagination advances'); cursors.add(cursor); }
    } while (cursor);
    assert.ok(cursors.size > 0, 'internal exclusion is checked beyond the first public page');
    const expectedPublicIds = catalogue.components.filter(row => !row.internal && !row.onlyShowIfDegraded).map(row => row.id).sort();
    assert.deepEqual(published.map(row => row.id).sort(), expectedPublicIds, 'every public component and uptime record appears exactly once');
    for (const row of published) {
      assert.equal(row.state, 'Operational');
      assert.equal(row.uptime.percentage, '100.00%', 'internal downtime never enters a visible uptime figure');
      assert.ok(row.uptime.marks.every(mark => mark.downtimeMinutes === null || mark.downtimeMinutes === 0));
      const uptimeBadge = await j.publicText(`/components/${row.slug}/uptime.svg`);
      assert.match(uptimeBadge, /id="value"[^>]*>100\.00%<\/text>/);
      for (const value of [hidden.id, hidden.name, hidden.note]) assert.ok(!uptimeBadge.includes(value));
    }
    for (const path of ['/api/v2/components.json', '/api/v2/summary.json']) {
      const body = await (await j.publicResponse(path)).json();
      assert.deepEqual(body.components.filter(row => !row.group).map(row => row.name).sort(), published.map(row => row.name).sort(), path);
      for (const value of [hidden.id, hidden.name, hidden.note]) assert.ok(!JSON.stringify(body).includes(value), path);
    }
    for (const path of ['/', '/feed.atom', '/feed.rss', '/widget.js', '/embed/script.js']) {
      const body = await j.publicText(path);
      for (const value of [hidden.id, hidden.name, hidden.note]) assert.ok(!body.includes(value), `${path} excludes internal identity, note and uptime`);
    }
    for (const resource of ['feed.atom', 'feed.rss', 'badge.svg', 'uptime.svg']) {
      const response = await j.publicResponse(`/components/${hidden.id.toLowerCase()}/${resource}`);
      assert.equal(response.status, 404, `a previously public internal ${resource} is unavailable`);
      const body = await response.text();
      for (const value of [hidden.id, hidden.name, hidden.note]) assert.ok(!body.includes(value));
    }
    assert.ok(html.includes('<form method="post" action="/subscribe"'));
    assert.ok(html.includes('data-local-time'));
    assert.ok(gzipSync(Buffer.from(html)).byteLength <= limits.snapshotMaxBytesGzipped.value, 'the declared catalogue remains usable at its public HTML budget');
    const ownAssets = [...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"/g)].map(match => match[1]);
    assert.ok(ownAssets.every(path => path.startsWith('/')));
    const initial = await j.publicResponse('/');
    const validator = initial.headers.get('etag');
    assert.ok(validator);
    assert.equal((await j.raw(new URL('/', j.publicOrigin).href, { headers: { 'If-None-Match': validator } })).status, 304);
    await initial.arrayBuffer();
    const requests = await Promise.all(Array.from({ length: limits.publicPageRequestsPerSecond.value }, () => fetch(j.publicOrigin + '/')));
    for (const response of requests) { assert.equal(response.status, 200); await response.arrayBuffer(); }
    for (const path of ['/', '/history', '/feed.atom', '/feed.rss', '/widget.js', '/api/public/status', '/badge.svg']) {
      const response = await j.publicResponse(path);
      assert.equal(response.status, 200, path);
      const csp = response.headers.get('content-security-policy');
      for (const directive of ['default-src', 'script-src', 'style-src', 'img-src', 'connect-src', 'form-action', 'base-uri']) assert.ok(csp.includes(`${directive} ${j.publicOrigin}`), path);
      assert.equal(csp, `default-src ${j.publicOrigin}; script-src ${j.publicOrigin}; style-src ${j.publicOrigin}; font-src 'self' data:; img-src ${j.publicOrigin}; connect-src ${j.publicOrigin}; form-action ${j.publicOrigin}; base-uri ${j.publicOrigin}; frame-ancestors 'none'; object-src 'none'`, `${path}: the complete policy permits only the documented sources`);
      assert.ok(csp.includes("frame-ancestors 'none'"));
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
      await response.arrayBuffer();
    }
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z8BQDwAF/gL+3N9nPwAAAABJRU5ErkJggg==', 'base64');
    const logo = new FormData(); logo.set('logo', new Blob([png], { type: 'image/png' }), 'company.png');
    // Serialize multipart at the HTTP boundary: Node's FormData and workerd's
    // FormData are different realms when dispatching directly into Miniflare.
    const multipart = new Request(j.appOrigin + '/api/app/page-settings/logo', { method: 'POST', body: logo });
    const upload = await j.request('/api/app/page-settings/logo', { method: 'POST', headers: { 'Content-Type': multipart.headers.get('Content-Type') }, body: await multipart.arrayBuffer() });
    assert.equal(upload.status, 200, await upload.clone().text());
    const originalLogo = await j.publicResponse('/assets/logo');
    assert.equal(originalLogo.status, 200);
    assert.deepEqual(Buffer.from(await originalLogo.arrayBuffer()), png);
    const branding = { pageName, logoBytes: png };
    const workingBrand = await assertPublicBranding(j, {
      ...branding, state: 'Operational', previousVersion: initial.headers.get('x-lamp-snapshot-version'),
    });
    const brandingClaimPath = `/api/app/components/${main.id}/standing-claim`;
    await j.json(brandingClaimPath, 'PUT', { state: 'Major outage' });
    const outageBrand = await assertPublicBranding(j, {
      ...branding, state: 'Major outage', previousVersion: workingBrand.version,
    });
    assert.notEqual(outageBrand.stateMark, workingBrand.stateMark, 'the standing claim changes the favicon mark while retaining the logo');
    await j.json(brandingClaimPath, 'PUT', { state: null });
    console.info(`PROBE PAGE-012 4: logo upload and native standing claim -> ${workingBrand.labelText} to ${outageBrand.labelText}; ${outageBrand.faviconPath} retained the upload bytes and changed mark; the same-origin ${outageBrand.socialPath} text and Open Graph title matched each public label`);
    const iconPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNQ7poIAAISAT/YErM2AAAAAElFTkSuQmCC', 'base64');
    const icon = new FormData(); icon.set('file', new Blob([iconPng], { type: 'image/png' }), 'icon.png');
    const iconMultipart = new Request(j.appOrigin + '/api/app/page-settings/theme-assets/icon', { method: 'POST', body: icon });
    const iconUpload = await j.request('/api/app/page-settings/theme-assets/icon', { method: 'POST', headers: { 'Content-Type': iconMultipart.headers.get('Content-Type') }, body: await iconMultipart.arrayBuffer() });
    assert.equal(iconUpload.status, 200, await iconUpload.clone().text());
    for (const path of ['/assets/favicon.svg', '/assets/mark.svg']) {
      const response = await j.publicResponse(path);
      assert.equal(response.status, 200);
      const svg = await response.text();
      assert.ok(svg.includes(`data:image/png;base64,${iconPng.toString('base64')}`), `${path} uses the separately uploaded icon`);
      if (path === '/assets/favicon.svg') assert.ok(svg.includes('<circle '), 'the favicon keeps its overall state mark');
    }

    await publicCapacityJourney(j, limits);
    // The maximum catalogue was read and load-checked above. Keep the public
    // customer journey representative instead of rebuilding that capacity load
    // after every unrelated operator edit.
    const populatedCatalogue = await j.json('/api/app/components/bulk');
    const customerCatalogue = { ...populatedCatalogue.catalogue, components: populatedCatalogue.catalogue.components.filter(row => [main.id, other.id, hidden.id].includes(row.id)) };
    const customerReview = await j.json('/api/app/components/bulk/preview', 'POST', { catalogue: customerCatalogue, revision: populatedCatalogue.revision });
    await j.json('/api/app/components/bulk/apply', 'POST', { catalogue: customerReview.catalogue, revision: customerReview.revision, reviewToken: customerReview.reviewToken });

    // Read component aggregation itself, independently of the page-wide rollup.
    await admitAttributionOperator(j, 'component-creator');
    const claimsComponent = await j.component('Synthetic claim service');
    const standingPath = `/api/app/components/${claimsComponent.id}/standing-claim`;
    const originalStateHistory = (await j.json(`/api/app/components/${claimsComponent.id}/history`)).history;
    const { creator: componentCreator, actor: stateActor, email: stateActorEmail } = await admitAttributionOperator(j, 'state-actor');
    assert.equal(originalStateHistory[0].operatorId, componentCreator.id);
    const assertComponentState = async (expected, description) => {
      assert.equal((await j.json('/api/app/components')).components.find(row => row.id === claimsComponent.id).publicState, expected, `${description}: operator state`);
      const published = await eventually(async () => (await (await j.publicResponse('/api/public/v1/components')).json()).data.find(row => row.id === claimsComponent.id), row => row?.state === expected, `${description}: public component state`);
      assert.equal(published.state, expected, `${description}: public state`);
    };
    const invalidState = await j.json(standingPath, 'PUT', { state: 'Unavailable' }, 400);
    assert.deepEqual(invalidState.issues.find(issue => issue.path[0] === 'state').values, [
      'Operational', 'Degraded performance', 'Partially unavailable', 'Major outage', 'Under maintenance',
    ], 'the native door accepts exactly the contractual state vocabulary');
    await assertComponentState('Operational', 'refusing an unknown state leaves the component unchanged');
    for (const state of ['Operational', 'Degraded performance', 'Partially unavailable', 'Major outage', 'Under maintenance']) {
      const beforeState = (await j.json(`/api/app/components/${claimsComponent.id}/history`)).history;
      const requestedAt = Date.now();
      await j.json(standingPath, 'PUT', { state });
      const respondedAt = Date.now();
      const history = (await j.json(`/api/app/components/${claimsComponent.id}/history`)).history;
      const appended = history.filter(row => !beforeState.some(prior => prior.id === row.id));
      assert.equal(appended.length, state === 'Operational' ? 0 : 1);
      for (const row of appended) {
        assert.equal(row.previousState, beforeState[0].newState);
        assert.equal(row.newState, state);
        assert.equal(row.causeType, 'standing-claim');
        assert.equal(row.causeId, null);
        assert.ok(Date.parse(row.changedAt) >= requestedAt && Date.parse(row.changedAt) <= respondedAt);
        assert.equal(row.operatorId, stateActor.id, 'state history records the actor rather than the creator');
        assert.equal((await j.db.prepare('SELECT operator_id FROM component_state_history WHERE id = ?').bind(row.id).first()).operator_id, stateActor.id);
      }
      assert.deepEqual(history.filter(row => !appended.some(added => added.id === row.id)), beforeState, 'a new actor retains every earlier history value');
      const claim = await j.db.prepare('SELECT * FROM component_standing_claims WHERE component_id = ?').bind(claimsComponent.id).first();
      assert.equal(claim.operator_id, stateActor.id);
      assert.equal(claim.state, state);
      await assertComponentState(state, `standing claim ${state}`);
    }
    await j.json(standingPath, 'PUT', { state: 'Operational' });
    const firstClaim = await j.incident('First competing service incident', [claimsComponent]);
    const secondClaim = await j.incident('Second competing service incident', [claimsComponent]);
    for (const [higher, lower, expected] of [
      ['Major outage', 'Partially unavailable', 'Major outage'],
      ['Partially unavailable', 'Degraded performance', 'Partially unavailable'],
      ['Degraded performance', 'Operational', 'Degraded performance'],
    ]) {
      // Reverse both the incident identities holding the claims and write order.
      // The lower claim is published last, so latest-write selection also fails.
      for (const assignments of [
        [[firstClaim, higher], [secondClaim, lower]],
        [[secondClaim, higher], [firstClaim, lower]],
      ]) {
        for (const [claim, state] of assignments) {
          await j.save(claim.id, { componentChanges: [{ componentId: claimsComponent.id, state }] });
          await j.publish(claim.id);
        }
        await assertComponentState(expected, `${higher} outranks ${lower}, ${assignments[0][0].title} holds the higher claim`);
      }
    }
    for (const claim of [firstClaim, secondClaim]) {
      await j.save(claim.id, { lifecycle: 'Resolved', nextUpdateAt: null });
      await j.publish(claim.id);
    }
    await assertComponentState('Operational', 'resolved incident claims leave the standing Operational claim');
    await j.signIn(componentCreator.email);
    const window = (await j.json('/api/app/maintenance', 'POST', {
      title: 'Synthetic claim service maintenance', affectedAudience: 'Service customers', customerImpact: 'Routine service maintenance.',
      startsAt: new Date(Date.now() + 3600000).toISOString(), endsAt: new Date(Date.now() + 7200000).toISOString(),
      componentIds: [claimsComponent.id], autoStart: false, autoComplete: false,
    }, 201)).maintenance;
    assert.equal(window.createdByOperatorId, componentCreator.id);
    await j.signIn(stateActorEmail);
    const beforeManualStart = await actorAudits(j, 'maintenance', window.id, 'notice-published');
    await j.json(`/api/app/maintenance/${window.id}/start`, 'POST', {});
    await assertMaintenanceActor(j, window.id, 'started', stateActor, beforeManualStart);
    await assertComponentState('Under maintenance', 'maintenance outranks an earlier standing Operational claim');
    await j.json(standingPath, 'PUT', { state: 'Operational' });
    await assertComponentState('Under maintenance', 'maintenance outranks a later standing Operational claim');
    await j.json(standingPath, 'PUT', { state: 'Degraded performance' });
    await assertComponentState('Degraded performance', 'standing degradation outranks active maintenance');
    await j.json(standingPath, 'PUT', { state: 'Under maintenance' });
    await j.save(firstClaim.id, { componentChanges: [{ componentId: claimsComponent.id, state: 'Degraded performance' }] });
    await j.publish(firstClaim.id);
    await assertComponentState('Degraded performance', 'incident degradation outranks standing and active maintenance');
    await j.json(standingPath, 'PUT', { state: 'Under maintenance' });
    await assertComponentState('Degraded performance', 'a later maintenance claim cannot hide incident degradation');
    await j.save(firstClaim.id, { lifecycle: 'Resolved', nextUpdateAt: null });
    await j.publish(firstClaim.id);
    await j.json(standingPath, 'PUT', { state: 'Operational' });
    await assertComponentState('Under maintenance', 'resolving degradation retains active maintenance');
    const beforeManualComplete = await actorAudits(j, 'maintenance', window.id, 'notice-published');
    await j.json(`/api/app/maintenance/${window.id}/complete`, 'POST', {});
    await assertMaintenanceActor(j, window.id, 'completed', stateActor, beforeManualComplete);
    await eventually(() => j.json('/api/app/components'), body => body.components.find(row => row.id === claimsComponent.id).publicState === 'Operational', 'completion releases the maintenance claim');
    await assertComponentState('Operational', 'completion restores the standing Operational state');
    const beforeRelease = await actorAudits(j, 'component-standing-claim', claimsComponent.id, 'deleted');
    await j.json(standingPath, 'PUT', { state: null });
    await assertActorAudit(j, 'component-standing-claim', claimsComponent.id, 'deleted', stateActor, beforeRelease);
    assert.equal(await j.db.prepare('SELECT * FROM component_standing_claims WHERE component_id = ?').bind(claimsComponent.id).first(), null);
    await j.signIn();
    await j.json(`/api/app/components/${claimsComponent.id}`, 'DELETE', undefined, 204);

    browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const scripted = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/New_York' });
    const page = await scripted.newPage();
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.goto(j.publicOrigin);
    assert.equal(await page.locator('#overall-status').innerText(), 'Working');
    assert.equal(await page.getByText(hidden.name, { exact: true }).count(), 0);
    assert.equal(await page.locator('.uptime').count(), 1, 'only the visible healthy component has uptime on the representative page');
    if (process.env.LAMP_SCREENSHOTS) {
      await mkdir(process.env.LAMP_SCREENSHOTS, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: `${process.env.LAMP_SCREENSHOTS}/${width}-internal-component-exclusion.png`, fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }

    // Competing standing claims exercise the supplied page rollup through the
    // operator API and the same snapshot a customer reads. An internal outage
    // must not outweigh a visible service, even when every public service recovers.
    await j.json(`/api/app/components/${hidden.id}/standing-claim`, 'PUT', { state: 'Major outage' });
    const rollupCases = [
      ['Operational', 'Under maintenance', 'Under maintenance'],
      ['Under maintenance', 'Degraded performance', 'Degraded performance'],
      ['Degraded performance', 'Partially unavailable', 'Partially unavailable'],
      ['Partially unavailable', 'Major outage', 'Major outage'],
      ['Operational', 'Operational', 'Operational'],
    ];
    for (const ordered of [[main, other], [other, main]]) {
      for (const [displayOrder, component] of ordered.entries()) {
        await j.json(`/api/app/components/${component.id}`, 'PUT', {
          name: component.name, groupId: component.groupId, description: component.description,
          internal: component.internal, note: component.note, onlyShowIfDegraded: component.onlyShowIfDegraded, displayOrder,
        });
      }
      for (const [mainState, otherState, expected] of rollupCases) {
        await j.json(`/api/app/components/${main.id}/standing-claim`, 'PUT', { state: mainState });
        await j.json(`/api/app/components/${other.id}/standing-claim`, 'PUT', { state: otherState });
        const status = await eventually(async () => (await j.publicResponse('/api/public/status')).json(), value => value.overall === expected, `${expected} reaches the public rollup`);
        assert.equal(status.overall, expected);
        assert.equal(status.incident, null, 'standing claims determine the rollup without an incident');
        const visible = (await (await j.publicResponse('/api/public/v1/components')).json()).data;
        assert.ok(!visible.some(component => component.id === hidden.id), 'the internal severe component is absent');
        assert.deepEqual(visible.map(component => component.id), ordered.filter(component => component.id !== other.id || otherState !== 'Operational').map(component => component.id));
        assert.equal(visible.find(component => component.id === main.id).state, mainState);
        if (otherState !== 'Operational') assert.equal(visible.find(component => component.id === other.id).state, otherState);
        await page.reload();
        assert.equal(await page.locator('#overall-status').count(), 1);
        assert.equal(await page.locator('#overall-status').innerText(), expectedComponentLabels[expected]);
        for (const component of visible) {
          const row = page.locator('article.component').filter({ has: page.getByRole('heading', { name: component.name, exact: true }) });
          assert.equal(await row.locator('.component-state').innerText(), expectedComponentLabels[component.state], `${component.name} shows its own published state`);
        }
        assert.ok(await page.locator('#overall-status').evaluate(label => Boolean(label.closest('[aria-labelledby="overall-status"]'))), 'the single label remains in the top status section');
        assert.ok(!(await page.locator('body').innerText()).includes(hidden.name));
        if (process.env.LAMP_PAGE004_SCREENSHOTS && ordered[0].id === other.id && expected === 'Partially unavailable') {
          await mkdir(process.env.LAMP_PAGE004_SCREENSHOTS, { recursive: true });
          for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
            await page.screenshot({ path: `${process.env.LAMP_PAGE004_SCREENSHOTS}/page-004-${width}.png`, fullPage: true });
          }
          await page.setViewportSize({ width: 1440, height: 1000 });
        }
      }
    }
    // Return the catalogue to its original order before the existing incident,
    // recovery, uptime, subscription and retained-history journey continues.
    await j.json(`/api/app/components/${main.id}/move`, 'POST', { direction: 'up', expectedIds: [other.id, main.id], groupId: firstGroup.id });
    await j.json(`/api/app/components/${hidden.id}/standing-claim`, 'PUT', { state: 'Operational' });
    const live = page.locator('#status-live');
    assert.equal(await live.getAttribute('role'), 'status');
    assert.equal(await live.getAttribute('aria-live'), 'polite');
    assert.equal(await live.getAttribute('aria-atomic'), 'true');
    const liveNode = await live.elementHandle();
    const zoneLabel = await page.locator('[data-timezone-label]').innerText();
    const generation = page.locator('[data-generated-at] time');
    assertVisibleTime(await generation.getAttribute('title'), await generation.getAttribute('datetime'), 'America/Los_Angeles', 'Los Angeles time');
    const generationDetails = page.locator('[data-generation-details] details');
    assert.equal(await generationDetails.locator('time').isVisible(), false, 'the exact offset is hidden until requested');
    await generationDetails.locator('summary').click();
    assertVisibleTime(await generationDetails.locator('time').innerText(), await generation.getAttribute('datetime'), 'America/Los_Angeles');
    // Age one retained publication without any operator write. The browser's
    // own zone differs from Settings, so the tooltip must keep the page zone.
    const retainedDocument = await j.publicResponse('/');
    const retainedInstant = retainedDocument.headers.get('x-lamp-snapshot-generated-at');
    assert.ok(retainedInstant);
    const initialTimes = descendants(parse(await retainedDocument.text())).filter(node => node.tagName === 'time'
      && node.parentNode?.attrs?.some(attr => attr.name === 'data-generated-at'));
    assert.equal(initialTimes.length, 1);
    assert.equal(initialTimes[0].attrs.find(attr => attr.name === 'datetime').value, retainedInstant);
    assertVisibleTime(nodeText(initialTimes[0]), retainedInstant, 'America/Los_Angeles', 'Los Angeles time');
    const ageContext = await browser.newContext({ timezoneId: 'America/New_York' });
    const agePage = await ageContext.newPage();
    try {
      const initialClock = new Date(Date.parse(retainedInstant) + 59_000);
      await agePage.clock.install({ time: initialClock });
      await agePage.clock.pauseAt(initialClock);
      for (const width of [1440, 390]) {
        await agePage.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await agePage.clock.setSystemTime(initialClock);
        const document = await agePage.goto(j.publicOrigin);
        assert.equal(document.headers()['x-lamp-snapshot-generated-at'], retainedInstant);
        const age = agePage.locator('[data-generated-at] time');
        assert.ok(await age.isVisible(), 'the initial relative age is visible to the reader');
        assert.equal(await age.innerText(), 'just now', 'the retained generation initially has a relative age below one minute');
        assert.equal(await age.getAttribute('datetime'), retainedInstant);
        const absoluteTitle = await age.getAttribute('title');
        assertVisibleTime(absoluteTitle, retainedInstant, 'America/Los_Angeles', 'Los Angeles time');
        const documentNode = await agePage.locator('html').elementHandle();
        await agePage.clock.runFor(30_000);
        await agePage.waitForFunction(() => document.querySelector('[data-generated-at] time')?.textContent === '1 minute ago');
        assert.equal(await age.innerText(), '1 minute ago', 'the open page visibly ages across the minute boundary without publication');
        assert.ok(await age.isVisible(), 'the changed relative age stays visible to the reader');
        assert.equal(await age.getAttribute('datetime'), retainedInstant, 'aging does not replace the generation instant');
        assert.equal(await age.getAttribute('title'), absoluteTitle, 'aging retains the absolute tooltip');
        assertVisibleTime(await age.getAttribute('title'), retainedInstant, 'America/Los_Angeles', 'Los Angeles time');
        assert.ok(await documentNode.evaluate(node => node === document.documentElement), 'the document stays open while its label ages');
        assert.equal((await (await j.publicResponse('/api/public/status')).json()).generatedAt, retainedInstant, 'no new generation was published');
        console.info('PAGE-009 generation age at ' + width + ': just now -> 1 minute ago; instant=' + retainedInstant + '; tooltip=' + absoluteTitle);
        if (process.env.LAMP_SCREENSHOTS) {
          await mkdir(process.env.LAMP_SCREENSHOTS, { recursive: true });
          await agePage.screenshot({ path: process.env.LAMP_SCREENSHOTS + '/' + width + '-generation-age.png' });
        }
      }
    } finally { await ageContext.close(); }
    await j.json(`/api/app/components/${other.id}/standing-claim`, 'PUT', { state: 'Degraded performance' });
    const incident = await j.incident('Synthetic Lamp API outage under investigation', [main, hidden]);
    const widgetWording = literalLinkFields({
      affectedAudience: 'Synthetic Lamp customers submitting API requests. ' + wording.affectedAudience,
      customerImpact: 'New API requests cannot complete during this outage. ' + wording.customerImpact,
      whatStillWorks: 'Previously saved results remain available in the dashboard. ' + wording.whatStillWorks,
      details: 'Responders have isolated the failing API gateway. ' + wording.details,
    });
    const widgetCommitment = '2031-02-10T19:47:00.000Z';
    await j.save(incident.id, { ...widgetWording, nextUpdateAt: widgetCommitment });
    const linkedUpdate = (await j.publish(incident.id)).update;
    assert.equal(linkedUpdate.nextUpdateAt, widgetCommitment);
    await j.visible('/', incident.title);
    const refreshMaintenance = (await j.json('/api/app/maintenance', 'POST', {
      title: 'Customer dashboard upgrade', affectedAudience: 'Dashboard users', customerImpact: 'Dashboard access may pause.',
      startsAt: new Date(Date.now() - 60_000).toISOString(), endsAt: new Date(Date.now() + 3600_000).toISOString(),
      componentIds: [other.id], autoStart: false, autoComplete: false,
    }, 201)).maintenance;
    await j.json(`/api/app/maintenance/${refreshMaintenance.id}/start`, 'POST', {});
    const firstStatus = await eventually(async () => (await j.publicResponse('/api/public/status')).json(),
      status => status.maintenance?.reference === refreshMaintenance.reference, 'in-progress maintenance reaches the refresh response');
    const fields = value => Object.keys(value).sort();
    assert.deepEqual(fields(firstStatus), ['generatedAt', 'incident', 'maintenance', 'overall', 'version']);
    assert.deepEqual(fields(firstStatus.maintenance), ['reference', 'state', 'title']);
    assert.deepEqual(firstStatus.maintenance, { reference: refreshMaintenance.reference, title: 'Customer dashboard upgrade', state: 'In progress' });
    assert.deepEqual(fields(firstStatus.incident), ['impact', 'lifecycle', 'message', 'publishedAt', 'reference', 'summary', 'title']);
    const publishedUpdate = (await j.read(incident.id)).updates[0];
    assert.equal(firstStatus.version, 1);
    assert.equal(firstStatus.overall, 'Major outage');
    assert.equal(firstStatus.incident.reference, incident.reference);
    assert.equal(firstStatus.incident.title, incident.title);
    assert.equal(firstStatus.incident.lifecycle, 'Identified');
    assert.equal(firstStatus.incident.impact, 'critical');
    assert.equal(firstStatus.incident.publishedAt, publishedUpdate.publishedAt);
    assert.match(firstStatus.incident.summary, /^Identified · /);
    assert.ok(firstStatus.incident.message.includes(publishedUpdate.customerImpact));
    assert.ok((await j.publicText('/')).includes(other.name), 'a degraded conditional component becomes public');
    const badge = await (await j.publicResponse('/badge.json')).json();
    assert.equal(badge.message, 'Down');
    assert.match(await j.publicText('/badge.svg'), /id="value"[^>]*>Down<\/text>/);
    let refreshRequests = 0, documentNavigations = 0;
    page.on('request', request => { if (new URL(request.url()).pathname === '/api/public/status') refreshRequests++; });
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) documentNavigations++; });
    await page.clock.runFor(29_999);
    assert.equal(refreshRequests, 0, 'there is no poll before the thirty-second interval');
    const polled = page.waitForResponse(response => response.url().endsWith('/api/public/status') && response.status() === 200);
    await page.clock.runFor(1);
    const refreshed = await (await polled).json();
    assert.equal(refreshed.incident.reference, incident.reference);
    await page.waitForFunction(summary => document.querySelector('#status-live').textContent.includes(summary), refreshed.incident.summary);
    assert.equal(await page.locator('[data-newest-update]').innerText(), refreshed.incident.summary);
    assert.equal(refreshRequests, 1);
    assert.equal(documentNavigations, 0, 'the public story updates in place');
    assert.ok(await liveNode.evaluate(node => node === document.querySelector('#status-live')), 'the assistive live region remains the same node');
    assert.equal(await page.locator('[data-timezone-label]').innerText(), zoneLabel);
    assert.equal(await page.locator('[data-timezone-label]').getAttribute('data-timezone'), 'America/Los_Angeles');
    assertVisibleTime(await generation.getAttribute('title'), await generation.getAttribute('datetime'), 'America/Los_Angeles', 'Los Angeles time');
    assertVisibleTime(await generationDetails.locator('time').innerText(), await generation.getAttribute('datetime'), 'America/Los_Angeles');
    assert.equal(await page.locator('#overall-status').innerText(), 'Down');
    // Later widget and accessibility checks use ordinary browser timers.
    await page.clock.resume();
    if (process.env.LAMP_SCREENSHOTS) {
      await mkdir(process.env.LAMP_SCREENSHOTS, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: `${process.env.LAMP_SCREENSHOTS}/${width}-scripted-refresh.png` });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === main.id).publicState, 'Major outage');
    assert.ok(firstStatus.generatedAt);
    await assertUpdateLinkSurfaces(j, incident, main, linkedUpdate);
    await assertUpdateLinkScreens(page, j, incident, linkedUpdate);
    const permalink = await j.publicText(`/incidents/${incident.reference}`);
    assert.ok(permalink.includes(incident.title) && permalink.includes(main.name));
    assert.match(permalink, /Get updates on this incident/);
    assert.match(permalink, /action="\/subscribe\/incident"/);
    assert.ok(permalink.includes(`name="incidentId" value="${incident.id}"`));
    assert.ok(gzipSync(Buffer.from(permalink)).byteLength <= limits.snapshotMaxBytesGzipped.value, 'SUB-019 retains the initial incident document gzip budget');
    const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    try {
      const staticPage = await staticContext.newPage();
      assert.equal((await staticPage.goto(j.publicOrigin + '/incidents/' + incident.reference)).status(), 200);
      const form = staticPage.locator('form[action="/subscribe/incident"]').first();
      assert.equal(await form.getAttribute('method'), 'post');
      assert.equal(await form.getByLabel('Email address', { exact: true }).count(), 1, 'SUB-019 is usable in the initial document without script');
      assert.ok(await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'the script-free incident form fits its public document');
    } finally { await staticContext.close(); }
    assert.ok(!permalink.includes(hidden.name));
    await j.json(`/api/app/maintenance/${refreshMaintenance.id}/complete`, 'POST', {});
    const feedBefore = await j.publicText('/feed.atom');
    assert.ok(feedBefore.includes(incident.reference));
    for (const path of ['/', '/feed.atom', '/widget.js']) {
      const body = await j.publicText(path);
      assert.ok(body.includes(incident.reference), `${path} contains the published incident control`);
      for (const value of [hidden.id, hidden.name, hidden.note]) assert.ok(!body.includes(value), `${path} retains internal exclusion with a populated story`);
    }
    const firstIds = [...feedBefore.matchAll(/<id>([^<]+)<\/id>/g)].map(match => match[1]);

    // Install the banner while the published incident is still unresolved.
    assert.equal((await j.read(incident.id)).lifecycle, 'Identified', 'the native incident remains unresolved when the widget is installed');
    const widgetSource = await j.publicText('/widget.js');
    assert.ok(gzipSync(Buffer.from(widgetSource)).byteLength <= 10 * 1024, 'the populated widget is at most ten KiB gzipped');
    const loadWidget = async target => target.evaluate(url => new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = url; script.onload = resolve; script.onerror = reject; document.body.append(script);
    }), j.publicOrigin + '/widget.js');
    await page.reload();
    await loadWidget(page); await page.locator('section[role=status]').waitFor();
    const banner = page.locator('section[role=status]');
    assert.equal(await banner.count(), 1, 'one script tag installs one banner');
    assert.equal(await banner.locator('strong').innerText(), 'Down', 'the banner shows the exact aggregate state');
    const bannerMessage = await banner.locator('span').last().innerText();
    assert.ok(bannerMessage.includes(incident.reference), 'the banner identifies the unresolved incident');
    assert.ok(bannerMessage.includes('Synthetic Lamp API outage under investigation'), 'the banner retains its submitted title');
    for (const value of Object.values(widgetWording)) assert.ok(bannerMessage.includes(value), `the banner retains submitted wording: ${value}`);
    assert.equal(firstStatus.incident.reference, incident.reference);
    assert.equal(firstStatus.incident.publishedAt, linkedUpdate.publishedAt, 'the installed wording is associated with the committed publication');
    const updateLabels = ['Who is affected', 'Customer impact', 'What still works', 'Next update by', 'Additional details'];
    const bannerFields = text => text.split('\n').filter(line => updateLabels.some(label => line.startsWith(`${label}:`)));
    assert.ok(bannerMessage.split('\n').includes('Status: Identified'));
    assert.deepEqual(bannerFields(bannerMessage), [
      `Who is affected: ${widgetWording.affectedAudience}`, `Customer impact: ${widgetWording.customerImpact}`,
      `What still works: ${widgetWording.whatStillWorks}`, 'Next update by: Feb 10, 2031, 11:47 Los Angeles time',
      `Additional details: ${widgetWording.details}`,
    ], 'the installed widget retains the complete populated wording and independently expected configured-zone commitment');
    const captureUpdate = async name => {
      if (!process.env.LAMP_UPDATE002_SCREENSHOTS) return;
      await mkdir(process.env.LAMP_UPDATE002_SCREENSHOTS, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: `${process.env.LAMP_UPDATE002_SCREENSHOTS}/${name}-${width}.png`, fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    };
    await captureUpdate('populated');
    const denied = await scripted.newPage(); await denied.setContent('<main>Unlisted embedding site</main>'); await loadWidget(denied);
    assert.equal(await denied.locator('section[role=status]').count(), 0); await denied.close();
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(audit.violations.filter(item => ['serious', 'critical'].includes(item.impact)), []);

    const blankWording = {
      affectedAudience: 'Customers retrying queued API operations.',
      customerImpact: 'API retries remain paused while responders verify recovery.',
      whatStillWorks: '', details: '', nextUpdateAt: '2031-02-10T20:48:00.000Z',
    };
    await j.save(incident.id, blankWording);
    const blankPublication = (await j.publish(incident.id)).update;
    await j.visible('/', blankWording.customerImpact);
    const blankStatus = await (await j.publicResponse('/api/public/status')).json();
    assert.equal(blankStatus.incident.publishedAt, blankPublication.publishedAt);
    assert.equal(blankPublication.whatStillWorks, ''); assert.equal(blankPublication.details, '');
    assert.equal(blankPublication.nextUpdateAt, blankWording.nextUpdateAt);
    await page.clock.fastForward(30000);
    await page.waitForFunction(text => document.querySelector('section[role=status] span:last-child').textContent.includes(text), blankWording.customerImpact);
    assert.deepEqual(bannerFields(await banner.locator('span').last().innerText()), [
      `Who is affected: ${blankWording.affectedAudience}`, `Customer impact: ${blankWording.customerImpact}`,
      'Next update by: Feb 10, 2031, 12:48 Los Angeles time',
    ], 'the same installed widget replaces the prior publication and omits both absent optional fields');
    await page.reload(); await loadWidget(page);
    await captureUpdate('blank-optional');

    const historyRss = await readNativeHistoryFeeds(j, incident, linkedUpdate);
    const historyRssUrl = new URL('/history.rss', j.publicOrigin).href;
    const unchangedRss = await j.raw(historyRssUrl, { headers: { 'If-None-Match': historyRss.etag } });
    assert.equal(unchangedRss.status, 304, 'the saved validator matches the history RSS before the next publication');

    const resolutionImpact = 'API requests are working again.';
    await j.save(incident.id, { lifecycle: 'Resolved', customerImpact: resolutionImpact, whatStillWorks: '', details: '', nextUpdateAt: null });
    const resolvedPublication = (await j.publish(incident.id)).update;
    const resolutionReturnedAt = performance.now();
    assert.equal(resolvedPublication.nextUpdateAt, null);
    await pollHistoryRss(j, historyRss, resolvedPublication.id, resolutionImpact, resolutionReturnedAt);
    await j.visible('/history', incident.title);
    await eventually(async () => (await j.publicResponse('/api/public/status')).json(), status => status.incident === null, 'resolved publication clears the widget incident');
    await page.clock.fastForward(30000);
    await page.waitForFunction(() => document.querySelector('section[role=status] span:last-child').textContent === '');
    assert.equal(await banner.locator('span').last().innerText(), '', 'the installed widget carries no stale wording or commitment after resolution');
    await page.reload(); await loadWidget(page);
    assert.equal(await banner.locator('span').last().innerText(), '', 'a fresh widget also omits the resolved commitment');
    await captureUpdate('resolved');
    await assertUpdateLinkSurfaces(j, incident, main, linkedUpdate, { history: true });
    await assertUpdateLinkScreens(page, j, incident, linkedUpdate, { history: true });
    const feedAfter = await j.publicText('/feed.atom');
    for (const id of firstIds) assert.ok(feedAfter.includes(id), 'earlier public feed identifiers survive a later update');
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === main.id).publicState, 'Operational');
    assert.equal((await (await j.publicResponse('/api/public/status')).json()).overall, 'Degraded performance', 'resolving an incident retains another component\'s standing claim');
    await j.json(`/api/app/components/${other.id}/standing-claim`, 'PUT', { state: 'Operational' });
    await eventually(() => j.publicText('/'), body => !body.includes(other.name), 'recovery hides the conditional component again');

    // A closed correction is an operator business operation. Its reported
    // downtime, original facts and audit attribution agree through public APIs.
    const originalHistory = (await j.json(`/api/app/components/${main.id}/history`)).history;
    const endsAt = new Date(Date.now() - 3600000).toISOString();
    const startsAt = new Date(Date.parse(endsAt) - 7200000).toISOString();
    const correction = { state: 'Degraded performance', startsAt, endsAt, reason: 'Verified customer request logs' };
    await j.json(`/api/app/components/${main.id}/history-corrections`, 'POST', { ...correction, reason: '' }, 400);
    await j.json(`/api/app/components/${main.id}/history-corrections`, 'POST', correction, 204);
    const history = await j.json(`/api/app/components/${main.id}/history`);
    for (const row of originalHistory) assert.ok(history.history.some(entry => entry.id === row.id));
    assert.ok(history.corrections.some(row => row.reason === correction.reason));
    const monthParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit',
    }).formatToParts(new Date(startsAt));
    const month = `${monthParts.find(part => part.type === 'year').value}-${monthParts.find(part => part.type === 'month').value}`;
    const report = await j.json(`/api/app/availability-report?component=${main.id}&month=${month}&format=json`);
    assert.ok(Number(report.downtimeMinutes) >= 60, 'partial degradation is charged rather than rounded away');
    assert.ok(parseFloat(report.uptime) < 100);
    assert.ok(report.method.includes('Degraded performance') && report.method.includes('Under maintenance'));
    const publicComponents = (await (await j.publicResponse('/api/public/v1/components')).json()).data;
    const publishedMain = publicComponents.find(row => row.id === main.id);
    assert.ok(parseFloat(publishedMain.uptime.percentage) < 100);
    assert.ok(publishedMain.uptime.marks.some(mark => mark.downtimeMinutes === null));
    assert.ok(publishedMain.uptime.marks.some(mark => mark.downtimeMinutes > 0));
    assert.ok(publishedMain.uptime.coverageMinutes < 86400, 'a new component does not invent a full historical reporting window');
    for (const path of ['/api/v2/summary.json', '/api/v2/components.json', '/api/v2/incidents.json', '/api/v2/scheduled-maintenances.json', '/api/public/v1/incidents', '/history.rss', '/history.atom', `/components/${publishedMain.slug}/feed.atom`, `/components/${publishedMain.slug}/feed.rss`]) assert.equal((await j.publicResponse(path)).status, 200, path);

    await page.reload();
    const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    const plain = await noScript.newPage();
    let plainPolls = 0, plainNavigations = 0;
    plain.on('request', request => { if (new URL(request.url()).pathname === '/api/public/status') plainPolls++; });
    plain.on('framenavigated', frame => { if (frame === plain.mainFrame()) plainNavigations++; });
    const initialDocument = await plain.goto(j.publicOrigin);
    const initialGeneration = initialDocument.headers()['x-lamp-snapshot-generated-at'];
    assert.ok(initialGeneration);
    const plainGeneration = plain.locator('[data-generated-at] time');
    assert.equal(await plainGeneration.getAttribute('datetime'), initialGeneration);
    const plainDetails = plain.locator('[data-generation-details] details');
    await plainDetails.locator('summary').click();
    assertVisibleTime(await plainDetails.locator('time').innerText(), initialGeneration, 'America/Los_Angeles');
    await plainDetails.locator('summary').click();
    const absoluteGeneration = await plainGeneration.innerText();
    assertVisibleTime(absoluteGeneration, initialGeneration, 'America/Los_Angeles', 'Los Angeles time');
    assert.ok((await plain.locator('body').innerText()).includes(main.name));
    const initialContent = await plain.content();
    const initialDocumentNode = await plain.locator('html').elementHandle();
    const navigationCount = plainNavigations;
    const changed = await j.incident('Fresh public content stays off the script-free document', [main]);
    await j.save(changed.id, { customerImpact: 'Requests are unavailable during the new investigation.' });
    await j.publish(changed.id);
    await j.visible('/', changed.title);
    const changedStatus = await (await j.publicResponse('/api/public/status')).json();
    assert.notEqual(changedStatus.generatedAt, initialGeneration);
    assert.equal(changedStatus.incident.reference, changed.reference);
    assert.equal(changedStatus.overall, 'Major outage');
    // Real elapsed browser time also catches an HTML Refresh header or meta tag;
    // advancing a script clock alone cannot prove absence of document refresh.
    const observationStarted = performance.now();
    await plain.waitForTimeout(61_000);
    assert.ok(performance.now() - observationStarted > 60_000);
    assert.equal(plainPolls, 0, 'script-disabled content never polls for public status');
    assert.equal(plainNavigations, navigationCount, 'script-disabled content never navigates automatically');
    assert.ok(await initialDocumentNode.evaluate(node => node === document.documentElement));
    assert.equal(await plain.content(), initialContent, 'the complete initial document remains unchanged after a new publication and two refresh intervals');
    assert.equal(await plainGeneration.getAttribute('datetime'), initialGeneration);
    assert.equal(await plainGeneration.innerText(), absoluteGeneration);
    assertVisibleTime(await plainGeneration.innerText(), initialGeneration, 'America/Los_Angeles', 'Los Angeles time');
    if (process.env.LAMP_SCREENSHOTS) {
      await mkdir(process.env.LAMP_SCREENSHOTS, { recursive: true });
      for (const width of [1440, 390]) {
        await plain.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await plain.screenshot({ path: `${process.env.LAMP_SCREENSHOTS}/${width}-script-disabled-refresh.png` });
      }
    }
    await plain.getByRole('link', { name: 'Subscribe by email', exact: true }).click();
    await plain.locator('input[name=email]').fill('public-reader@example.test');
    await delay(1000);
    await Promise.all([plain.waitForNavigation(), plain.locator('form[action="/subscribe"] button[type=submit]').click()]);
    await eventually(() => j.messages.find(message => message.to.includes('public-reader@example.test')), Boolean, 'plain form sends subscriber confirmation');
    await publicIsolationFlow(j, browser);
    const maintenance = (await j.json('/api/app/maintenance', 'POST', {
      title: 'Customer API capacity work', affectedAudience: 'Customers using the public API',
      customerImpact: 'Requests may pause during the capacity work.', componentIds: [main.id],
      startsAt: new Date(Date.now() + 3600000).toISOString(), endsAt: new Date(Date.now() + 7200000).toISOString(),
      autoStart: false, autoComplete: false,
    }, 201)).maintenance;
    const maintenancePath = `/maintenance/${maintenance.reference}`;
    const publishedMaintenance = await j.visible(maintenancePath, maintenance.customerImpact);
    assert.ok(publishedMaintenance.includes(`Affects ${main.name}`));
    const savedMaintenance = (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === maintenance.id);
    assert.ok(savedMaintenance.notices.some(row => row.kind === 'scheduled'));
    const beforeDelete = await j.publicText('/history'); assert.ok(beforeDelete.includes(main.name));
    const warmedPage = await j.publicResponse('/');
    const beforeVersion = warmedPage.headers.get('x-lamp-snapshot-version');
    assert.ok(beforeVersion);
    assert.match(await warmedPage.text(), /aria-label="[^"]*uptime record for Public API"/);
    const componentPaths = ['feed.atom', 'feed.rss', 'badge.svg', 'uptime.svg'].map(resource => `/components/${publishedMain.slug}/${resource}`);
    for (const path of componentPaths) {
      const response = await j.publicResponse(path);
      assert.equal(response.status, 200, `prewarm ${path}`);
      await response.arrayBuffer();
    }
    await page.reload();
    assert.ok((await page.locator('.component-health').innerText()).includes(main.name));
    const beforeComponents = (await (await j.publicResponse('/api/public/v1/components')).json()).data;
    assert.deepEqual(beforeComponents.map(row => row.id), [main.id]);
    assert.ok(beforeComponents[0].uptime.marks.some(mark => mark.downtimeMinutes > 0));
    await j.json(`/api/app/components/${main.id}`, 'DELETE', undefined, 204);
    const deletedAt = performance.now(), deadline = deletedAt + 10000;
    let removed;
    do {
      const root = await j.publicResponse('/');
      const body = await root.text();
      const components = (await (await j.publicResponse('/api/public/v1/components')).json()).data;
      const statuses = [];
      for (const path of componentPaths) {
        const response = await j.publicResponse(path);
        statuses.push(response.status); await response.arrayBuffer();
      }
      if (root.status === 200 && root.headers.get('x-lamp-snapshot-state') !== 'stale'
        && root.headers.get('x-lamp-snapshot-version') !== beforeVersion
        && !body.includes('class="component-health"') && components.length === 0 && statuses.every(status => status === 404)) {
        removed = { body, components, statuses }; break;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    } while (performance.now() < deadline);
    const disappearanceMs = performance.now() - deletedAt;
    assert.ok(removed && disappearanceMs <= 10000, `all prewarmed public state and uptime disappear within ten seconds (${disappearanceMs.toFixed(1)} ms)`);
    console.info(`COMP-007 public disappearance: ${disappearanceMs.toFixed(1)} ms`);
    await page.reload();
    assert.equal(await page.locator('.component-health, .uptime').count(), 0);
    if (process.env.LAMP_SCREENSHOTS) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: `${process.env.LAMP_SCREENSHOTS}/${width}-deleted-component-history.png`, fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    const afterDelete = await j.visible('/history', incident.title);
    assert.ok(afterDelete.includes(main.name), 'published history retains the name of a deleted component');
    assert.ok((await j.publicText(`/incidents/${incident.reference}`)).includes(`Affecting ${main.name}`));
    const retainedMaintenance = await j.publicText(maintenancePath);
    assert.ok(retainedMaintenance.includes(`Affects ${main.name}`), 'published maintenance retains the independently captured component name');
    assert.ok(retainedMaintenance.includes(maintenance.customerImpact));
    assert.deepEqual((await j.json('/api/app/maintenance')).maintenance.find(row => row.id === maintenance.id).notices, savedMaintenance.notices, 'deletion preserves every published maintenance update');
    const remaining = (await (await j.publicResponse('/api/public/v1/components')).json()).data;
    assert.ok(!remaining.some(row => row.id === main.id));
    await assertCompetingClaimStepDown(j, stateActorEmail, stateActor.id);
  } finally { await browser?.close(); await j.close(); }
});

test('DEP-001 DEP-002 — scheduled vendor reports retain attribution and buyer control', { timeout: 180_000 }, async () => {
  await (await import('./helpers/vendor-dependencies-flow.mjs')).vendorDependenciesFlow();
});
