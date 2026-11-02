import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { chromium } from 'playwright';
import { openStatusJourney, eventually } from './status-journey.mjs';

// An isolated native catalogue keeps known elapsed minutes independent of the
// larger public journey. HTTP writes and Queue snapshots share the same clock.
export async function conditionalComponentFlow() {
  const j = await openStatusJourney({ pageHost: 'localhost', workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  let browser;
  const start = Date.parse('2031-04-03T12:00:00.000Z');
  const at = minute => new Date(start + minute * 60_000).toISOString();
  const clock = async minute => {
    const response = await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: start + minute * 60_000 }) });
    assert.equal(response.status, 204, await response.text());
  };
  try {
    await clock(0);
    await j.signIn(undefined, { fresh: true });
    const group = (await j.json('/api/app/component-groups', 'POST', { name: 'Synthetic Lamp conditional group', displayOrder: 0 }, 201)).group;
    const control = await j.component('Synthetic Lamp visible control', { groupId: group.id });
    const conditional = await j.component('Synthetic Lamp conditional service', {
      groupId: group.id, displayOrder: 1, onlyShowIfDegraded: true, note: 'Synthetic Lamp conditional note',
    });
    const saved = (await j.json('/api/app/components')).components.find(row => row.id === conditional.id);
    assert.equal(saved.onlyShowIfDegraded, true, 'the native owner door persists the conditional flag');
    const slug = conditional.id.toLowerCase();
    const resources = [`/components/${slug}/uptime.svg`, `/components/${slug}/badge.svg`, `/components/${slug}/feed.atom`, `/components/${slug}/feed.rss`];
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    let retainedHistory = [], incident;
    const transitions = [[0, 'Operational', 'Operational']];

    const checkpoint = async (minute, state, percentage, downtime, deadline) => {
      const shown = state !== 'Operational';
      const collection = await eventually(async () => {
        const response = await j.publicResponse('/api/public/v1/components');
        return response.status === 200 ? response.json() : null;
      }, value => value?.generatedAt === at(minute) && value.data.some(row => row.id === conditional.id) === shown,
      'the conditional visibility change reaches a fresh public generation');
      assert.deepEqual(collection.data.map(row => row.id), shown ? [control.id, conditional.id] : [control.id]);
      assert.equal(collection.data.find(row => row.id === control.id).uptime.percentage, minute ? '100.00%' : null, 'the visible control retains its independent healthy uptime');
      const history = (await j.json(`/api/app/components/${conditional.id}/history`)).history.sort((left, right) => left.changedAt.localeCompare(right.changedAt) || left.id.localeCompare(right.id));
      assert.deepEqual(history.filter(row => retainedHistory.some(prior => prior.id === row.id)), retainedHistory, 'hiding and reappearance preserve every earlier history identity and value');
      assert.deepEqual(history.map(row => [row.changedAt, row.previousState, row.newState]), transitions.map(([when, previous, next]) => [at(when), previous, next]), 'native history independently reconciles the complete known transitions');
      retainedHistory = history;
      const report = await j.json(`/api/app/availability-report?component=${conditional.id}&month=2031-04&format=json`);
      assert.equal(report.uptime, percentage, 'retained uptime has the independently expected denominator and downtime');
      assert.equal(report.downtimeMinutes, minute ? downtime.toFixed(2) : null);
      assert.equal(report.trackingSince, at(0), 'hiding never resets the beginning of recorded history');
      assert.equal(report.observedUntil, at(minute));
      const status = await (await j.publicResponse('/api/public/status')).json();
      assert.equal(status.overall, state, 'the only affected service contributes its exact state to the overall rollup');
      for (const path of ['/api/v2/components.json', '/api/v2/summary.json']) {
        const compatible = await (await j.publicResponse(path)).json();
        const entry = compatible.components.find(row => row.name === conditional.name);
        assert.equal(Boolean(entry), shown, `${path} lists the conditional service only while affected`);
        if (shown) assert.equal(entry.only_show_if_degraded, true, `${path} retains the conditional flag`);
        assert.equal(compatible.components.find(row => row.name === control.name).only_show_if_degraded, false);
      }
      assert.equal((await page.goto(j.publicOrigin)).status(), 200);
      const article = page.locator('article.component').filter({ has: page.getByRole('heading', { name: conditional.name, exact: true }) });
      assert.equal(await article.count(), shown ? 1 : 0, 'the page omits the entire hidden component, including its figure and daily record');
      assert.equal(await page.getByRole('list', { name: `90-day uptime record for ${conditional.name}`, exact: true }).count(), shown ? 1 : 0);
      assert.equal(await page.locator('.uptime-number').count(), shown ? 2 : 1, 'only presented components have uptime figures');
      if (shown) {
        assert.equal(await article.locator('xpath=..').getByRole('heading', { name: group.name, exact: true }).count(), 1, 'the affected service appears in its own group');
        const published = collection.data.find(row => row.id === conditional.id);
        assert.equal(published.onlyShowIfDegraded, true);
        assert.equal(published.uptime.percentage, percentage);
        assert.equal(published.uptime.coverageMinutes, minute);
        assert.equal(published.uptime.trackingSince, at(0));
        assert.deepEqual(published.uptime.marks.filter(mark => mark.downtimeMinutes !== null), [
          { day: '2031-04-03', downtimeMinutes: downtime, worstDowntimeState: downtime === 0 ? null : minute <= 30 ? 'Degraded performance' : 'Major outage' },
        ], 'the reappearing daily record retains independently known weighted minutes');
        assert.equal(await article.locator('.uptime-number').innerText(), `${percentage} over ${minute < 60 ? `${minute} minutes` : '1 hour 10 minutes'}`);
      }
      for (const path of resources) {
        const response = await j.publicResponse(path);
        assert.equal(response.status, shown ? 200 : 404, `${path} follows the conditional public presentation`);
        const text = await response.text();
        if (shown && path.endsWith('/uptime.svg')) assert.ok(text.includes(percentage), 'the public uptime badge preserves the independently expected figure');
      }
      for (const path of ['/widget.js', '/embed/script.js']) {
        const source = await j.publicText(path);
        if (!shown) assert.ok(!source.includes(conditional.name) && !source.includes(conditional.note), `${path} omits the Operational conditional service`);
      }
      if (incident) for (const path of ['/feed.atom', '/feed.rss']) {
        const feed = await j.publicText(path);
        assert.ok(feed.includes(incident.reference), 'component-list exclusion is checked on a populated native feed');
        assert.ok(feed.includes(`Affected components: ${control.name}${shown ? `, ${conditional.name}` : ''}`));
        if (!shown) assert.ok(!feed.includes(`Affected components: ${control.name}, ${conditional.name}`), 'the Operational service is absent from feed component lists');
      }
      assert.ok(performance.now() <= deadline, `all public presentation agrees within ten seconds at minute ${minute}`);
      console.log(`PROBE COMP-010 minute=${minute} state=${state} shown=${shown} uptime=${percentage} downtime=${downtime} history=${history.length} elapsedMs=${(performance.now() - deadline + 10_000).toFixed(1)}`);
      if (process.env.LAMP_COMP010_SCREENSHOTS && [20, 30].includes(minute)) {
        await mkdir(process.env.LAMP_COMP010_SCREENSHOTS, { recursive: true });
        for (const width of [1440, 390]) {
          await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
          await page.screenshot({ path: `${process.env.LAMP_COMP010_SCREENSHOTS}/conditional-${shown ? 'affected' : 'hidden'}-${width}.png`, fullPage: true });
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
    };

    await checkpoint(0, 'Operational', null, 0, performance.now() + 10_000);
    await clock(10);
    incident = await j.incident('Synthetic Lamp recorded interruption', [control, conditional], {
      components: [
        { componentId: control.id, state: 'Under maintenance', relationship: 'Primary' },
        { componentId: conditional.id, state: 'Degraded performance', relationship: 'Primary' },
      ],
    });
    await j.save(incident.id, { nextUpdateAt: at(90) });
    await j.publish(incident.id);
    transitions.push([10, 'Operational', 'Degraded performance']);
    await checkpoint(10, 'Degraded performance', '100.00%', 0, performance.now() + 10_000);
    await clock(20);
    await j.save(incident.id, { lifecycle: 'Resolved', nextUpdateAt: null });
    await j.publish(incident.id);
    transitions.push([20, 'Degraded performance', 'Operational']);
    await checkpoint(20, 'Operational', '75.00%', 5, performance.now() + 10_000);

    // Each repeat uses one coherent ten-second deadline after acknowledgement.
    // Known outage intervals charge five degraded minutes and ten major minutes;
    // a later partial outage adds ten, while maintenance adds none.
    for (const [minute, state, percentage, downtime] of [
      [30, 'Major outage', '83.33%', 5],
      [40, 'Operational', '62.50%', 15],
      [50, 'Partially unavailable', '70.00%', 15],
      [60, 'Operational', '58.33%', 25],
      [70, 'Under maintenance', '64.28%', 25],
      [80, 'Operational', '68.75%', 25],
    ]) {
      await clock(minute);
      const previous = transitions.at(-1)[2];
      await j.json(`/api/app/components/${conditional.id}/standing-claim`, 'PUT', { state });
      const deadline = performance.now() + 10_000;
      transitions.push([minute, previous, state]);
      await checkpoint(minute, state, percentage, downtime, deadline);
    }
  } finally { await browser?.close(); await j.close(); }
}
