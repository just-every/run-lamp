import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { openStatusJourney } from './status-journey.mjs';

// Seed source history, then follow the actual script-free public documents.
// An internal-only record inside the newest window must not hide public history.
export async function publicHistorySelectionFlow() {
  const j = await openStatusJourney({ pageHost: 'localhost', workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  let browser;
  try {
    const now = Date.parse('2031-04-20T12:00:00.000Z');
    assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now }) })).status, 204);
    await j.signIn(undefined, { fresh: true });
    const publicComponent = await j.component('Synthetic Lamp public history service');
    const privateComponent = await j.component('Synthetic Lamp private history service', { internal: true });
    const original = await j.incident('Synthetic Lamp public history template', [publicComponent]);
    await j.save(original.id, { lifecycle: 'Resolved', nextUpdateAt: null });
    await j.publish(original.id);
    const rows = Array.from({ length: 51 }, (_, index) => ({
      id: `synthetic-selection-${String(index).padStart(3, '0')}`,
      reference: `INC-${9500 + index}`,
      title: index === 1 ? 'Synthetic Lamp private history title' : `Synthetic Lamp public history ${index}`,
      details: index === 1 ? 'Synthetic Lamp private history update' : `Synthetic Lamp public update ${index}`,
      component: index === 1 ? privateComponent : publicComponent,
      at: new Date(now - (index + 1) * 60_000).toISOString(),
      internal: index === 1,
    }));
    await j.db.batch(rows.flatMap(row => [
      j.db.prepare("INSERT INTO incidents(id,reference,title,lifecycle,opened_at,resolved_at,created_by_operator_id,created_at,updated_at) SELECT ?,?,?,'Resolved',?,?,created_by_operator_id,?,? FROM incidents WHERE id=?").bind(row.id, row.reference, row.title, row.at, row.at, row.at, row.at, original.id),
      j.db.prepare("INSERT INTO incident_components(id,incident_id,component_id,component_name,state,relationship,published_at,created_at,updated_at) VALUES(?,?,?,?,'Major outage','Primary',?,?,?)").bind(`${row.id}-component`, row.id, row.component.id, row.component.name, row.at, row.at, row.at),
      j.db.prepare("INSERT INTO incident_updates(id,incident_id,lifecycle,affected_audience,customer_impact,what_still_works,details,next_update_at,published_at,author_operator_id,created_at,updated_at) SELECT ?,?,'Resolved','Synthetic history customers','Synthetic history impact','Read access remains available',?,NULL,?,created_by_operator_id,?,? FROM incidents WHERE id=?").bind(`${row.id}-update`, row.id, row.details, row.at, row.at, row.at, original.id),
    ]));
    // Remove only the source template, leaving exactly the gate's 51 incidents.
    await j.db.prepare('UPDATE incidents SET deleted_at=? WHERE id=?').bind(new Date(now).toISOString(), original.id).run();
    const refreshedAt = now + 300_000;
    assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: refreshedAt }) })).status, 204);
    await j.tick(refreshedAt);
    await j.visible('/history', rows[0].title);
    assert.equal((await j.db.prepare("SELECT COUNT(*) AS n FROM incidents WHERE deleted_at IS NULL AND lifecycle='Resolved'").first()).n, 51);
    assert.equal((await j.db.prepare("SELECT COUNT(*) AS n FROM maintenance WHERE state IN ('Completed','Cancelled')").first()).n, 0);

    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const proof = process.env.LAMP_HISTORY_PROOF_DIRECTORY || './test-results/public-history';
    await mkdir(proof, { recursive: true });
    const expected = rows.filter(row => !row.internal).map(row => `/incidents/${row.reference}`).sort();
    const observed = [], visited = new Set();
    let next = '/history';
    while (next) {
      assert.ok(visited.size < 5 && !visited.has(next), 'Older history links advance without a loop');
      visited.add(next);
      assert.equal((await page.goto(new URL(next, j.publicOrigin).href)).status(), 200);
      observed.push(...await page.locator('article.history-item h3 a').evaluateAll(links => links.map(link => link.getAttribute('href'))));
      const content = await page.content();
      for (const privateValue of [rows[1].title, rows[1].details, privateComponent.name, `/incidents/${rows[1].reference}`]) assert.ok(!content.includes(privateValue), 'no private history disclosure');
      if (visited.size === 1) {
        await page.screenshot({ path: join(proof, 'public-selection-1440.png'), fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: join(proof, 'public-selection-390.png'), fullPage: true });
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
      const older = page.getByRole('navigation', { name: 'History pages', exact: true }).getByRole('link', { name: 'Older history', exact: true });
      next = await older.count() ? await older.getAttribute('href') : null;
    }
    console.info(`PUBLIC_SELECTION records=${observed.length} unique=${new Set(observed).size} expected=${expected.length} pages=${visited.size} private_disclosures=0`);
    assert.equal(new Set(observed).size, observed.length, 'public history records appear exactly once');
    assert.deepEqual(observed.sort(), expected, 'all 50 public records remain reachable past the internal-only record');
    assert.equal((await j.publicResponse(`/incidents/${rows[1].reference}`)).status, 404);
  } finally { await browser?.close(); await j.close(); }
}
