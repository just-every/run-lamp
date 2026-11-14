import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { openStatusJourney } from './status-journey.mjs';

// Exercise the emitted Worker, including request recovery and the drawer. A
// small requested page crosses ties without introducing another registration.
export async function componentReadFlow() {
  console.log('Component read: opening emitted Worker');
  const j = await openStatusJourney({ pageHost: 'localhost', builtWorker: true });
  let browser;
  try {
    console.log('Component read: owner signed in');
    const component = await j.component('synthetic-lamp-paged-history');
    const control = await j.component('synthetic-lamp-claim-control');
    const now = Date.now();
    await j.json('/test/clock', 'PUT', { now }, 204);

    const startsAt = new Date(now - 3_600_000).toISOString(), endsAt = new Date(now - 1_800_000).toISOString();
    // Native corrections share both timestamps, exercising the ID tiebreaker.
    const reasons = [];
    for (let index = 0; index < 54; index++) {
      const reason = `synthetic-lamp-correction-${index}`;
      await j.json(`/api/app/components/${component.id}/history-corrections`, 'POST', { state: 'Degraded performance', startsAt, endsAt, reason }, 204);
      reasons.push(reason);
    }
    console.log('Component read: 54 native corrections committed');
    const path = `/api/app/components/${component.id}/history`;
    const first = await j.json(path);
    assert.equal(first.history.length, 50);
    assert.equal(first.corrections.length, 50);
    const collect = async (field, pageField, query) => {
      const entries = []; let cursor;
      do {
        const response = await j.json(`${path}?${new URLSearchParams({ limit: '7', ...(cursor ? { [query]: cursor } : {}) })}`);
        assert.ok(response[field].length <= 7, 'the requested bound applies in SQL');
        entries.push(...response[field]); cursor = response[pageField].nextCursor;
      } while (cursor);
      assert.equal(new Set(entries.map(row => row.id)).size, entries.length, 'cursor pages never repeat a tied entry');
      return entries;
    };
    const history = await collect('history', 'historyPage', 'cursor');
    const corrections = await collect('corrections', 'correctionsPage', 'correctionsCursor');
    assert.equal(history.length, 55, 'all corrections and the original history remain reachable');
    assert.deepEqual(corrections.map(row => row.reason).sort(), reasons.sort(), 'all correction reasons remain reachable');
    const ordered = [...history].sort((a, b) => b.changedAt.localeCompare(a.changedAt) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    assert.deepEqual(history, ordered, 'newest first with stable ties across every page');
    for (const query of ['limit=0', 'limit=101', 'cursor=invalid', 'correctionsCursor=%5B%5D']) await j.json(`${path}?${query}`, 'GET', undefined, 400);
    await j.json(`/api/app/components/${control.id}/standing-claim`, 'PUT', { state: 'Major outage' });
    const list = (await j.json('/api/app/components')).components;
    assert.equal(list.find(row => row.id === control.id).publicState, 'Major outage');
    assert.equal(list.find(row => row.id === component.id).publicState, 'Operational', 'historical corrections are not current claims');

    // A newly restarted isolate has no read-recovery throttle to mask a bug.
    await j.json('/api/app/maintenance', 'POST', { title: 'synthetic-lamp-read-recovery', affectedAudience: 'Synthetic readers', customerImpact: 'Synthetic maintenance', startsAt: new Date(now + 25 * 3_600_000).toISOString(), endsAt: new Date(now + 26 * 3_600_000).toISOString(), componentIds: [component.id], autoStart: false, autoComplete: false }, 201);
    await j.runtime.getWorker();
    await j.restart();
    await j.json('/test/clock', 'PUT', { now: now + 2 * 3_600_000 }, 204);

    await j.signIn(undefined, { fresh: true });
    // Sign-in itself bypasses request due-work; neither read may publish notices.
    const before = await (await j.db).prepare('SELECT COUNT(*) AS count FROM maintenance_notices').first();
    await j.json('/api/app/components');
    await j.json(path);
    await j.runtime.getWorker();
    const after = await (await j.db).prepare('SELECT COUNT(*) AS count FROM maintenance_notices').first();
    assert.deepEqual(after, before, 'component reads do not publish a maintenance reminder');
    await j.tick(now + 2 * 3_600_000);
    assert.equal((await (await j.db).prepare("SELECT COUNT(*) AS count FROM maintenance_notices WHERE kind='reminder'").first()).count, 1, 'Cron still publishes the due reminder once');
    await j.tick(now + 2 * 3_600_000);
    assert.equal((await (await j.db).prepare("SELECT COUNT(*) AS count FROM maintenance_notices WHERE kind='reminder'").first()).count, 1, 'repeated Cron keeps notification idempotency');

    console.log('Component read: native paging and Cron passed');
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: j.cookie.split('=')[0], value: j.cookie.slice(j.cookie.indexOf('=') + 1), url: j.appOrigin }]);
    const page = await context.newPage();
    await page.goto(`${j.appOrigin}/app/components`);
    await page.getByRole('button', { name: new RegExp(component.name) }).click();
    await page.getByRole('button', { name: 'History', exact: true }).click();
    await page.getByRole('button', { name: 'Older changes', exact: true }).click();
    await page.getByText('5 changes on this page', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Newer changes', exact: true }).click();
    await page.getByText('50 changes on this page', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Older corrections', exact: true }).click();
    await page.getByText('4 corrections on this page', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Newer corrections', exact: true }).click();
    const proof = process.env.LAMP_COMPONENT_PROOF_DIR || '.tmp/component-read-proof';
    await mkdir(proof, { recursive: true });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({ path: `${proof}/component-history-${width}.png`, fullPage: true });
    }
  } finally { await browser?.close(); await j.close(); }
}
