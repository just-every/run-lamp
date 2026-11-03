import assert from 'node:assert/strict';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { openStatusJourney } from './status-journey.mjs';
import { moveInDoor, notificationActivity, assertNoNewNotifications } from '../../helpers/import-notifications.mjs';

const fixtureFiles = async (source, family) => Promise.all((await readdir(`tests/fixtures/${source}/${family}`)).map(async name => ({ name, text: await readFile(`tests/fixtures/${source}/${family}/${name}`, 'utf8') })));

export async function browsableHistoryFlow() {
  const j = await openStatusJourney({ pageHost: 'localhost', workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  let browser;
  try {
    assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: Date.parse('2031-09-15T12:00:00.000Z') }) })).status, 204);
    await j.signIn(undefined, { fresh: true });
    const settings = (await j.json('/api/app/page-settings')).settings;
    const timezone = 'America/Los_Angeles';
    await j.json('/api/app/page-settings', 'PUT', { mailFromAddress: settings.mailFromAddress, pageName: settings.pageName, tagline: settings.tagline, accentColor: settings.accentColor, footerCreditEnabled: false, hostname: 'localhost', timezone, widgetAllowedOrigins: [] });
    const files = await fixtureFiles('statuspage', 'small');
    const template = JSON.parse(files.find(file => file.name === 'incidents.json').text)[0];
    // UTC month edges straddle local midnight, including the daylight-saving
    // offset. Literal local-month controls keep the oracle independent.
    const records = [
      ['oldest', '2020-01-01T00:30:00.000Z', '2019-12', 'resolved'],
      ['before-midnight', '2020-04-01T06:59:00.000Z', '2020-03', 'resolved'],
      ['after-midnight', '2020-04-01T07:01:00.000Z', '2020-04', 'resolved'],
      ['newest', '2025-04-20T12:00:00.000Z', '2025-04', 'resolved'],
      ['winter-maintenance', '2020-03-01T07:59:00.000Z', '2020-02', 'completed'],
      ['spring-maintenance', '2020-04-01T07:02:00.000Z', '2020-04', 'completed'],
    ].map(([id, at, month, status], index) => {
      const start = new Date(Date.parse(at) - 3_600_000).toISOString();
      return { id: `synthetic-lamp-${id}`, title: `Synthetic Lamp ${id}`, at, month, status, source: {
        ...structuredClone(template), id: `synthetic-lamp-${id}`, name: `Synthetic Lamp ${id}`, status,
        shortlink: `https://stspg.io/synthetic-lamp-${id}`, created_at: start, updated_at: at,
        resolved_at: status === 'resolved' ? at : null,
        scheduled_for: status === 'completed' ? start : null, scheduled_until: status === 'completed' ? at : null,
        components: [{ id: 'c0000000001', name: 'Public API' }],
        incident_updates: [start, at].map((time, ordinal) => ({
          ...structuredClone(template.incident_updates[ordinal]), id: `synthetic-lamp-${index}-${ordinal}`, incident_id: `synthetic-lamp-${id}`,
          status: status === 'completed' ? (ordinal ? 'completed' : 'in_progress') : (ordinal ? 'resolved' : 'investigating'),
          body: `Synthetic Lamp ${id} ${ordinal ? 'finished' : 'started'}`, created_at: time, display_at: time, updated_at: time,
        })),
      } };
    });
    for (const name of ['subscribers.json', 'page-access-groups.json']) files.find(file => file.name === name).text = '[]';
    files.find(file => file.name === 'incidents.json').text = JSON.stringify(records.map(row => row.source));
    const moveIn = moveInDoor(async (path, body, headers) => {
      const response = await j.request(path, { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    });
    const quiet = await notificationActivity(j);
    const apply = async (source, input) => {
      const reviewed = await moveIn.preview({ source, files: input, pageId: 'synthpage01', publicAccessAcknowledged: true });
      assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
      const result = await moveIn.apply(reviewed.body);
      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(result.body.job.state, 'completed');
    };
    await apply('statuspage', files);
    const incidents = (await j.json('/api/app/incidents')).incidents;
    const maintenance = (await j.json('/api/app/maintenance')).maintenance;
    assert.equal(incidents.length, 4); assert.equal(maintenance.length, 2);
    const expected = new Map();
    for (const record of records) {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit' }).formatToParts(new Date(record.at));
      const month = `${parts.find(part => part.type === 'year').value}-${parts.find(part => part.type === 'month').value}`;
      assert.equal(month, record.month, 'independent configured-zone boundary control');
      const native = (record.status === 'resolved' ? incidents : maintenance).filter(row => row.title === record.title);
      assert.equal(native.length, 1, 'each saved source record has exactly one native identity');
      record.path = `/${record.status === 'resolved' ? 'incidents' : 'maintenance'}/${native[0].reference}`;
      expected.set(month, [...(expected.get(month) ?? []), record]);
    }
    const months = [...expected.keys()].sort().reverse();
    assert.ok(Date.parse('2031-09-15T12:00:00.000Z') - Date.parse(records[0].at) > 3 * 366 * 86_400_000);
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const foreignRequests = [];
    page.on('request', request => { if (new URL(request.url()).origin !== j.publicOrigin) foreignRequests.push(request.url()); });
    assert.equal((await page.goto(`${j.publicOrigin}/history`)).status(), 200);
    const earlier = page.locator('.history-month').filter({ has: page.getByRole('heading', { name: 'Earlier history', exact: true }) });
    assert.deepEqual(await earlier.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))), months.map(month => `/history/${month}`));
    const proof = process.env.LAMP_HISTORY_PROOF_DIRECTORY || './test-results/browsable-history';
    await mkdir(proof, { recursive: true });
    const screenshot = async name => {
      await page.screenshot({ path: join(proof, `${name}-1440.png`), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: join(proof, `${name}-390.png`), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
    };
    await screenshot('index');
    await earlier.locator(`a[href="/history/${months[0]}"]`).click();
    const visited = new Set();
    for (const [index, month] of months.entries()) {
      assert.equal(new URL(page.url()).pathname, `/history/${month}`);
      assert.ok(!visited.has(month), 'backward navigation never loops'); visited.add(month);
      const entries = expected.get(month);
      assert.ok(entries.length, 'every navigation step is populated');
      assert.deepEqual((await page.locator('article.history-item h3 a').allTextContents()).sort(), entries.map(row => row.title).sort(), 'complete incident and completed-maintenance membership, with no neighbouring-month leak');
      const navigation = page.getByRole('navigation', { name: 'History months', exact: true }).first();
      const previous = navigation.locator('a[rel=prev]'), next = navigation.locator('a[rel=next]');
      assert.deepEqual(await previous.evaluateAll(links => links.map(link => link.getAttribute('href'))), index + 1 < months.length ? [`/history/${months[index + 1]}`] : []);
      assert.deepEqual(await next.evaluateAll(links => links.map(link => link.getAttribute('href'))), index ? [`/history/${months[index - 1]}`] : []);
      if (month === '2020-04') await screenshot('mixed-month');
      for (const record of entries) {
        const link = page.locator(`article.history-item h3 a[href="${record.path}"]`);
        assert.equal(await link.innerText(), record.title);
        const permalink = await context.newPage();
        assert.equal((await permalink.goto(new URL(await link.getAttribute('href'), j.publicOrigin).href)).status(), 200);
        assert.equal(await permalink.getByRole('heading', { name: record.title, exact: true }).count(), 1);
        const content = await permalink.locator('body').innerText();
        if (record.status === 'resolved') assert.ok(content.includes(`Synthetic Lamp ${record.id.replace('synthetic-lamp-', '')} finished`), record.title);
        else {
          assert.equal(await permalink.locator('[data-maintenance-state]').getAttribute('data-maintenance-state'), 'Completed');
          assert.equal(await permalink.locator('[data-maintenance-ends-at]').getAttribute('data-maintenance-ends-at'), record.at);
        }
        await permalink.close();
      }
      if (index + 1 < months.length) await previous.click();
    }
    assert.equal(await page.getByRole('heading', { name: records[0].title, exact: true }).count(), 1, 'script-disabled traversal reaches the oldest imported incident');
    assert.equal(visited.size, months.length);
    const forward = new Set([months.at(-1)]);
    for (const month of [...months].reverse().slice(1)) {
      await page.getByRole('navigation', { name: 'History months', exact: true }).first().locator('a[rel=next]').click();
      assert.equal(new URL(page.url()).pathname, `/history/${month}`);
      assert.ok(!forward.has(month), 'forward navigation never loops'); forward.add(month);
    }
    assert.equal(forward.size, months.length);
    assert.deepEqual(await context.cookies(), [], 'history sets no visitor cookie');
    assert.deepEqual(foreignRequests, [], 'script-disabled history loads only its own origin');

    // Exercise the existing Sorry alias with native months in the same snapshot.
    await apply('sorry', await fixtureFiles('sorry', 'public'));
    const alias = await j.publicResponse('/history/2025/april');
    assert.equal(alias.status, 301); assert.equal(alias.headers.get('location'), '/history/');
    assert.equal((await j.publicResponse('/history')).status, 301);
    assert.equal((await j.publicResponse('/history/')).status, 200);
    for (const month of months) {
      const native = await j.publicResponse(`/history/${month}`);
      assert.equal(native.status, 200); assert.equal(native.headers.get('location'), null);
      const html = await native.text();
      for (const row of expected.get(month)) assert.ok(html.includes(row.title), 'Sorry aliases preserve native month membership');
    }
    await assertNoNewNotifications(j, quiet, 'reviewed historical imports and reads enqueue no notifications');
    console.log('PROBE HIST-008 1: reviewed Statuspage saved responses -> script-disabled index reaches oldest 2019-12 incident');
    console.log('PROBE HIST-008 2: previous and next links -> all five populated months exactly once in both directions');
    console.log('PROBE HIST-008 3: configured-zone months -> all four resolved incidents and two completed maintenance records, with working permalinks');
    console.log('PROBE HIST-008 5: native month and Sorry alias -> 200 month document and 301 alias to the history index');
  } finally { await browser?.close(); await j.close(); }
}
