import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { openStatusJourney } from './status-journey.mjs';

async function assertNativeIncidentPages(j, publicRows, privateRow, report, generatedAt) {
  const remaining = new Map(publicRows.map(row => [row.id, row]));
  const visited = new Set();
  let cursor = null;
  let version;
  do {
    assert.ok(!visited.has(cursor), 'native incident cursors advance without a loop');
    visited.add(cursor);
    const path = cursor === null ? '/api/public/v1/incidents' : '/api/public/v1/incidents?' + new URLSearchParams({ cursor });
    // publicResponse uses the anonymous request path, with no operator cookie.
    const response = await j.publicResponse(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('x-lamp-snapshot-state'), null, 'each cursor serves a healthy snapshot');
    version ??= response.headers.get('x-lamp-snapshot-version');
    assert.ok(version, 'the public response identifies its snapshot generation');
    assert.equal(response.headers.get('x-lamp-snapshot-version'), version, path);
    assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), generatedAt, path);

    const body = await response.text();
    for (const value of [privateRow.id, privateRow.reference, privateRow.title, privateRow.details, privateRow.component.name]) {
      assert.ok(!body.includes(value), 'no private incident data appears on any native page');
    }
    const page = JSON.parse(body);
    assert.equal(page.generatedAt, generatedAt, path);
    assert.ok(page.data.length > 0, 'each requested native page has records');
    for (const incident of page.data) {
      const expected = remaining.get(incident.id);
      assert.ok(expected, 'unexpected or repeated public incident: ' + incident.id);
      assert.equal(incident.reference, expected.reference);
      assert.equal(incident.title, expected.title);
      assert.equal(incident.lifecycle, 'Resolved');
      assert.equal(incident.openedAt, expected.at);
      assert.equal(incident.resolvedAt, expected.updates.at(-1).publishedAt);
      assert.deepEqual(incident.updates, expected.updates.toReversed(), 'complete newest-first timeline for ' + expected.reference);
      assert.deepEqual(incident.report, expected.id === report.incidentId ? report : null, 'publication state and report fields for ' + expected.reference);
      if (expected.id === report.incidentId) assert.ok(visited.size > 1, 'the published report and its timeline are beyond the first page');
      remaining.delete(incident.id);
    }
    assert.ok(page.nextCursor === null || (typeof page.nextCursor === 'string' && page.nextCursor.length > 0), 'a page returns a usable cursor or explicitly ends the collection');
    cursor = page.nextCursor;
  } while (cursor !== null);
  assert.ok(visited.size > 1, 'the native incident collection actually paginates');
  assert.deepEqual([...remaining.keys()], [], 'all expected public incident IDs appear exactly once');
  console.info('PROBE PAGE-016 3: anonymous native incident cursors -> ' + publicRows.length + ' unique public incidents across ' + visited.size + ' pages, exact ordered timelines and report fields, private control absent; generatedAt=' + generatedAt);
}

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
    const rows = Array.from({ length: 53 }, (_, index) => ({
      id: `synthetic-selection-${String(index).padStart(3, '0')}`,
      reference: `INC-${9500 + index}`,
      title: index === 1 ? 'Synthetic Lamp private history title' : `Synthetic Lamp public history ${index}`,
      details: index === 1 ? 'Synthetic Lamp private history update' : `Synthetic Lamp public update ${index}`,
      component: index === 1 ? privateComponent : publicComponent,
      at: new Date(now - (index + 1) * 60_000).toISOString(),
      internal: index === 1,
    }));
    for (const row of rows) {
      row.updates = [{
        id: row.id + '-update',
        lifecycle: 'Resolved',
        affectedAudience: 'Synthetic history customers',
        customerImpact: 'Synthetic history impact',
        whatStillWorks: 'Read access remains available',
        details: row.details,
        nextUpdateAt: null,
        publishedAt: row.at,
        componentChanges: [],
      }];
    }
    const seedIncidents = incidentRows => j.db.batch(incidentRows.flatMap(row => {
      const resolvedAt = row.updates.at(-1).publishedAt;
      return [
        j.db.prepare("INSERT INTO incidents(id,reference,title,lifecycle,opened_at,resolved_at,created_by_operator_id,created_at,updated_at) SELECT ?,?,?,'Resolved',?,?,created_by_operator_id,?,? FROM incidents WHERE id=?").bind(row.id, row.reference, row.title, row.at, resolvedAt, row.at, resolvedAt, original.id),
        j.db.prepare("INSERT INTO incident_components(id,incident_id,component_id,component_name,state,relationship,published_at,created_at,updated_at) VALUES(?,?,?,?,'Major outage','Primary',?,?,?)").bind(row.id + '-component', row.id, row.component.id, row.component.name, row.at, row.at, row.at),
        // Insert in chronological order so the reader must return a different order.
        ...row.updates.map(update => j.db.prepare("INSERT INTO incident_updates(id,incident_id,lifecycle,affected_audience,customer_impact,what_still_works,details,next_update_at,published_at,component_changes_json,author_operator_id,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,created_by_operator_id,?,? FROM incidents WHERE id=?")
          .bind(update.id, row.id, update.lifecycle, update.affectedAudience, update.customerImpact, update.whatStillWorks, update.details, update.nextUpdateAt, update.publishedAt, JSON.stringify(update.componentChanges), update.publishedAt, update.publishedAt, original.id)),
      ];
    }));
    const historyRows = rows.slice(0, 51);
    await seedIncidents(historyRows);
    // Remove only the source template, leaving the seeded public and private incidents.
    await j.db.prepare('UPDATE incidents SET deleted_at=? WHERE id=?').bind(new Date(now).toISOString(), original.id).run();
    const refreshedAt = now + 300_000;
    assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: refreshedAt }) })).status, 204);
    await j.tick(refreshedAt);
    await j.visible('/history', rows[0].title);
    assert.equal((await j.db.prepare("SELECT COUNT(*) AS n FROM incidents WHERE deleted_at IS NULL AND lifecycle='Resolved'").first()).n, historyRows.length);
    assert.equal((await j.db.prepare("SELECT COUNT(*) AS n FROM maintenance WHERE state IN ('Completed','Cancelled')").first()).n, 0);

    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const proof = process.env.LAMP_HISTORY_PROOF_DIRECTORY || './test-results/public-history';
    await mkdir(proof, { recursive: true });
    const expected = historyRows.filter(row => !row.internal).map(row => `/incidents/${row.reference}`).sort();
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

    // Expand the existing history fixture for the native collection, which
    // needs older records beyond the first 50 public incidents.
    const olderRows = rows.slice(historyRows.length);
    const reported = olderRows.at(-1);
    const publishedAfterOpening = seconds => new Date(Date.parse(reported.at) + seconds * 1000).toISOString();
    reported.updates = [
      {
        id: reported.id + '-investigating',
        lifecycle: 'Investigating',
        affectedAudience: 'Merchants submitting invoice batches',
        customerImpact: 'New batches are waiting in the primary queue',
        whatStillWorks: 'Previously generated invoices remain downloadable',
        details: 'We are investigating a stalled batch worker.',
        nextUpdateAt: publishedAfterOpening(60),
        publishedAt: reported.at,
        componentChanges: [],
      },
      {
        id: reported.id + '-monitoring',
        lifecycle: 'Monitoring',
        affectedAudience: 'Merchants retrying deferred invoice batches',
        customerImpact: 'Deferred batches are clearing',
        whatStillWorks: 'New batches are processing in the secondary queue',
        details: 'We replaced the stalled worker and are checking the backlog.',
        nextUpdateAt: publishedAfterOpening(80),
        publishedAt: publishedAfterOpening(10),
        componentChanges: [{ componentId: publicComponent.id, name: publicComponent.name, previousState: 'Major outage', newState: 'Degraded performance' }],
      },
      {
        ...reported.updates[0],
        affectedAudience: 'Merchants with previously deferred invoice batches',
        customerImpact: 'All deferred invoices are available',
        whatStillWorks: 'Invoice downloads and new batches operate normally',
        details: 'The backlog has cleared and retries are back to normal.',
        publishedAt: publishedAfterOpening(20),
      },
    ];
    const report = {
      incidentId: reported.id,
      summary: 'A stalled worker delayed invoice batches.',
      timeline: 'The secondary queue resumed processing before the backlog cleared.',
      cause: 'A stale worker lease prevented the primary queue from assigning jobs.',
      remediation: 'Expire abandoned leases and alert on queue age.',
      publishedAt: publishedAfterOpening(30),
    };
    const draftReport = { ...report, incidentId: rows[0].id, summary: 'Unreleased report for the newest incident', publishedAt: null };
    await seedIncidents(olderRows);
    await j.db.batch([report, draftReport].map(saved => {
      const storedAt = saved.publishedAt ?? rows[0].at;
      return j.db.prepare('INSERT INTO incident_reports(id,incident_id,summary,timeline,cause,remediation,published_at,author_operator_id,created_at,updated_at) SELECT ?,?,?,?,?,?,?,created_by_operator_id,?,? FROM incidents WHERE id=?')
        .bind(saved.incidentId + '-report', saved.incidentId, saved.summary, saved.timeline, saved.cause, saved.remediation, saved.publishedAt, storedAt, storedAt, original.id);
    }));
    const nativeGeneration = refreshedAt + 300_000;
    assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: nativeGeneration }) })).status, 204);
    await j.tick(nativeGeneration);
    const publicRows = rows.filter(row => !row.internal);
    await assertNativeIncidentPages(j, publicRows, rows[1], report, new Date(nativeGeneration).toISOString());
  } finally { await browser?.close(); await j.close(); }
}
