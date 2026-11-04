import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { test } from 'node:test';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { parse } from 'parse5';
import { openStatusJourney, eventually, wording } from './helpers/status-journey.mjs';
import { literalLinkFields } from './helpers/update-link-evidence.mjs';
import { assertUpdateLinkSurfaces, assertUpdateLinkScreens } from './helpers/update-link-surfaces.mjs';
import { assertVisibleTime } from '../helpers/public-meaning.mjs';
import { publicCapacityJourney } from './helpers/public-capacity-journey.mjs';
import { shortHistoryFlow } from './helpers/short-history-flow.mjs';
import { browsableHistoryFlow } from './helpers/browsable-history-flow.mjs';
import { publicHistoryFlow } from './helpers/public-history-flow.mjs';
import { uptimeCorrectionJourney } from './helpers/uptime-correction-journey.mjs';

test('HIST-008 — reviewed imported history stays completely browsable without scripts', { timeout: 120_000 }, browsableHistoryFlow);

test('UPTIME-003 — newly observed services report only their recorded coverage', shortHistoryFlow);
test('HIST-001 — completed native records retain their month, window, components and complete publication inventory', publicHistoryFlow);

function descendants(node) {
  return (node.childNodes ?? []).flatMap(child => [child, ...descendants(child)]);
}
function nodeText(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(nodeText).join('');
}
function hasClass(node, name) {
  return node.attrs?.some(attr => attr.name === 'class' && attr.value.split(' ').includes(name));
}
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

// One catalogue-to-customer journey: no renderer or uptime helper is imported.
test('SUB-019 PAGE-001 PAGE-002 PAGE-003 PAGE-004 PAGE-007 PAGE-008 PAGE-009 PAGE-010 PAGE-011 PAGE-012 PAGE-013 PAGE-014 PAGE-016 PAGE-017 PAGE-018 PAGE-019 PAGE-020 COMP-001 COMP-002 COMP-003 COMP-004 COMP-005 COMP-007 COMP-009 COMP-010 UPTIME-001 UPTIME-002 UPTIME-003 UPTIME-004 UPTIME-005 UPTIME-006 MOVE-009 — owner maintains a complete catalogue and customers read, refresh, embed and retain its public story', async () => {
  await statedUptimeMethodJourney();
  await uptimeCorrectionJourney();
  const j = await openStatusJourney({ pageHost: 'localhost' });
  let browser;
  try {
    const settings = (await j.json('/api/app/page-settings')).settings;
    await j.json('/api/app/page-settings', 'PUT', {
      mailFromAddress: settings.mailFromAddress, pageName: 'Customer service status', tagline: 'Current service facts', accentColor: '#16794C',
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
    assert.match(exposed, /id="overall-status"[^>]*>Major outage<\/h1>/);
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
    let html = await j.visible('/', 'Customer service status');
    assert.ok(html.indexOf(firstGroup.name) < html.indexOf(secondGroup.name));
    assert.ok(!html.includes(other.name), 'a healthy conditional component stays out of the public catalogue');
    assert.ok(html.includes(main.note));
    assert.ok(!html.includes(hidden.name) && !html.includes('PRIVATE topology'));
    assert.match(html, /id="overall-status"[^>]*>Operational<\/h1>/, 'the only severe claim is internal');
    assert.equal((await (await j.publicResponse('/api/public/status')).json()).overall, 'Operational');
    assert.equal((await (await j.publicResponse('/badge.json')).json()).message, 'Operational');
    assert.match(await j.publicText('/badge.svg'), /id="value"[^>]*>Operational<\/text>/);
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
    assert.ok(html.includes('<form method="post" action="/subscribe">'));
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
    for (const path of ['/assets/favicon.svg', '/assets/og.svg']) { const response = await j.publicResponse(path); assert.equal(response.status, 200); assert.ok((await response.text()).includes('data:image/png')); }

    await publicCapacityJourney(j, limits);
    // The maximum catalogue was read and load-checked above. Keep the public
    // customer journey representative instead of rebuilding that capacity load
    // after every unrelated operator edit.
    const populatedCatalogue = await j.json('/api/app/components/bulk');
    const customerCatalogue = { ...populatedCatalogue.catalogue, components: populatedCatalogue.catalogue.components.filter(row => [main.id, other.id, hidden.id].includes(row.id)) };
    const customerReview = await j.json('/api/app/components/bulk/preview', 'POST', { catalogue: customerCatalogue, revision: populatedCatalogue.revision });
    await j.json('/api/app/components/bulk/apply', 'POST', { catalogue: customerReview.catalogue, revision: customerReview.revision, reviewToken: customerReview.reviewToken });

    browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const scripted = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/New_York' });
    const page = await scripted.newPage();
    await page.clock.install();
    await page.goto(j.publicOrigin);
    assert.equal(await page.locator('#overall-status').innerText(), 'Operational');
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
        assert.equal(await page.locator('#overall-status').innerText(), expected);
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
    assert.equal(await page.locator('#status-live').getAttribute('aria-live'), 'polite');
    const generation = page.locator('[data-generated-at] time');
    assertVisibleTime(await generation.getAttribute('title'), await generation.getAttribute('datetime'), 'America/Los_Angeles');
    await j.json(`/api/app/components/${other.id}/standing-claim`, 'PUT', { state: 'Degraded performance' });
    const incident = await j.incident('Synthetic Lamp API outage under investigation', [main, hidden]);
    const widgetWording = literalLinkFields({
      affectedAudience: 'Synthetic Lamp customers submitting API requests. ' + wording.affectedAudience,
      customerImpact: 'New API requests cannot complete during this outage. ' + wording.customerImpact,
      whatStillWorks: 'Previously saved results remain available in the dashboard. ' + wording.whatStillWorks,
      details: 'Responders have isolated the failing API gateway. ' + wording.details,
    });
    await j.save(incident.id, widgetWording);
    const linkedUpdate = (await j.publish(incident.id)).update;
    await j.visible('/', incident.title);
    const firstStatus = await (await j.publicResponse('/api/public/status')).json();
    assert.ok((await j.publicText('/')).includes(other.name), 'a degraded conditional component becomes public');
    const badge = await (await j.publicResponse('/badge.json')).json();
    assert.ok(JSON.stringify(badge).includes('Major outage'));
    assert.ok((await j.publicText('/badge.svg')).includes('Major outage'));
    const polled = page.waitForResponse(response => response.url().endsWith('/api/public/status') && response.status() === 200);
    await page.clock.fastForward(30000);
    const refreshed = await (await polled).json();
    assert.equal(refreshed.incident.reference, incident.reference);
    await page.waitForFunction(summary => document.querySelector('#status-live').textContent.includes(summary), refreshed.incident.summary);
    assert.equal(await page.locator('[data-newest-update]').innerText(), refreshed.incident.summary);
    assertVisibleTime(await generation.getAttribute('title'), await generation.getAttribute('datetime'), 'America/Los_Angeles');
    assert.ok((await page.locator('#status-live').innerText()).includes('Major outage'));
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
    await loadWidget(page); await page.locator('section[role=status]').waitFor();
    const banner = page.locator('section[role=status]');
    assert.equal(await banner.count(), 1, 'one script tag installs one banner');
    assert.equal(await banner.locator('strong').innerText(), 'Major outage', 'the banner shows the exact aggregate state');
    const bannerMessage = await banner.locator('span').last().innerText();
    assert.ok(bannerMessage.includes(incident.reference), 'the banner identifies the unresolved incident');
    assert.ok(bannerMessage.includes('Synthetic Lamp API outage under investigation'), 'the banner retains its submitted title');
    for (const value of Object.values(widgetWording)) assert.ok(bannerMessage.includes(value), `the banner retains submitted wording: ${value}`);
    const denied = await scripted.newPage(); await denied.setContent('<main>Unlisted embedding site</main>'); await loadWidget(denied);
    assert.equal(await denied.locator('section[role=status]').count(), 0); await denied.close();
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(audit.violations.filter(item => ['serious', 'critical'].includes(item.impact)), []);

    await j.save(incident.id, { lifecycle: 'Resolved', customerImpact: 'API requests are working again.', nextUpdateAt: null }); await j.publish(incident.id);
    await j.visible('/history', incident.title);
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
    const plain = await noScript.newPage(); await plain.goto(j.publicOrigin);
    assert.ok((await plain.locator('body').innerText()).includes(main.name));
    await plain.locator('input[name=email]').fill('public-reader@example.test');
    await Promise.all([plain.waitForNavigation(), plain.locator('form[action="/subscribe"] button[type=submit]').click()]);
    await eventually(() => j.messages.find(message => message.to.includes('public-reader@example.test')), Boolean, 'plain form sends subscriber confirmation');
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
  } finally { await browser?.close(); await j.close(); }
});
