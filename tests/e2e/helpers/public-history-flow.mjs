import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { openStatusJourney } from './status-journey.mjs';
import { assertHistoryRecord, historyGroups, historyText, historyLinks } from './history-assertions.mjs';

export async function publicHistoryFlow() {
  const j = await openStatusJourney({ pageHost: 'localhost', workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  let browser;
  const clock = async instant => {
    const response = await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: Date.parse(instant) }) });
    assert.equal(response.status, 204, await response.text());
  };
  try {
    await clock('2029-01-15T14:00:00.000Z');
    await j.signIn(undefined, { fresh: true });
    const settings = (await j.json('/api/app/page-settings')).settings;
    await j.json('/api/app/page-settings', 'PUT', {
      ...Object.fromEntries(['pageName', 'tagline', 'accentColor', 'hostname', 'mailFromAddress', 'template', 'footerCreditEnabled', 'widgetAllowedOrigins'].map(key => [key, settings[key]])),
      timezone: ['Australia', 'Brisbane'].join('/'),
    });
    const component = await j.component('Synthetic Lamp history payment gateway');
    const second = await j.component('Synthetic Lamp history settlement service');
    const makeWindow = async (title, day) => {
      const input = {
        title, affectedAudience: `${title} customers`, customerImpact: `${title} writes pause while reads remain available.`,
        startsAt: `${day}T14:05:00.000Z`, endsAt: `${day}T14:20:00.000Z`, componentIds: [component.id, second.id], autoStart: false, autoComplete: false,
      };
      const created = (await j.json('/api/app/maintenance', 'POST', input, 201)).maintenance;
      const endpoint = `/api/app/maintenance/${created.id}`;
      const body = `${created.reference}: ${title}\n\nWho is affected: ${input.affectedAudience}\n\nCustomer impact: ${input.customerImpact}`;
      assert.equal(created.notices.length, 1);
      assert.equal(created.notices[0].kind, 'scheduled');
      assert.equal(created.notices[0].body, body);
      assert.equal(created.notices[0].publishedAt, `${day}T14:00:00.000Z`);
      const updates = [{ id: created.notices[0].id, kind: 'scheduled', body, publishedAt: `${day}T14:00:00.000Z` }];
      const capture = (record, kind, instant) => {
        const added = record.notices.filter(row => !updates.some(saved => saved.id === row.id));
        assert.equal(added.length, 1);
        assert.equal(added[0].kind, kind);
        assert.equal(added[0].publishedAt, instant);
        assert.equal(added[0].body, body);
        updates.push({ id: added[0].id, kind, body, publishedAt: instant });
      };
      await clock(`${day}T14:01:00.000Z`);
      const endsAt = `${day}T14:25:00.000Z`;
      capture((await j.json(`${endpoint}/window`, 'PUT', { startsAt: input.startsAt, endsAt })).maintenance, 'rescheduled', `${day}T14:01:00.000Z`);
      await clock(input.startsAt);
      capture((await j.json(`${endpoint}/start`, 'POST', {})).maintenance, 'started', input.startsAt);
      await clock(endsAt);
      const finished = (await j.json(`${endpoint}/complete`, 'POST', {})).maintenance;
      capture(finished, 'completed', endsAt);
      const saved = (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === created.id);
      assert.equal(saved.state, 'Completed');
      assert.deepEqual(saved.notices.map(row => row.id).sort(), updates.map(row => row.id).sort());
      assert.equal(saved.startsAt, input.startsAt); assert.equal(saved.endsAt, endsAt);
      return { href: `/maintenance/${created.reference}`, title, state: 'Completed', startsAt: input.startsAt, endsAt, duration: '20m', components: [component.name, second.name], updates };
    };
    const oldWindow = await makeWindow('Synthetic Lamp archived maintenance', '2029-01-15');
    await clock('2030-01-31T14:00:00.000Z');
    await j.signIn(undefined, { fresh: true });
    const makeIncident = async (title, startsAt, endsAt) => {
      const affected = [await j.component(`${title} gateway`), await j.component(`${title} ledger`)];
      const incident = await j.incident(title, affected, { openedAt: startsAt });
      const updates = [];
      for (const [lifecycle, publishedAt] of [['Investigating', startsAt], ['Monitoring', new Date(Date.parse(startsAt) + 30 * 60000).toISOString()], ['Resolved', endsAt]]) {
        const fields = { lifecycle, affectedAudience: `${title} customers`, customerImpact: `${title}: ${lifecycle} payment requests.`, whatStillWorks: `${title}: saved receipts remain readable.`, details: `${title}: ${lifecycle} responder log.`, nextUpdateAt: lifecycle === 'Resolved' ? null : new Date(Date.parse(publishedAt) + 3600_000).toISOString() };
        await j.save(incident.id, fields);
        const update = (await j.publish(incident.id, { publishedAt })).update;
        for (const [field, value] of Object.entries({ ...fields, publishedAt })) assert.equal(update[field], value);
        updates.push({ id: update.id, ...fields, publishedAt });
      }
      const saved = await j.read(incident.id);
      assert.equal(saved.lifecycle, 'Resolved'); assert.equal(saved.openedAt, startsAt); assert.equal(saved.resolvedAt, endsAt);
      assert.deepEqual(saved.updates.map(row => row.id).sort(), updates.map(row => row.id).sort());
      return { href: `/incidents/${incident.reference}`, title, state: 'Resolved', startsAt, endsAt, duration: '1h 37m', components: affected.map(row => row.name), updates };
    };
    const oldIncident = await makeIncident('Synthetic Lamp archived incident', '2029-01-15T10:00:00.000Z', '2029-01-15T11:37:00.000Z');
    const december = await makeIncident('Synthetic Lamp December incident', '2029-12-15T10:00:00.000Z', '2029-12-15T11:37:00.000Z');
    // UTC January belongs to February in the configured zone, while opening is still January.
    const february = await makeIncident('Synthetic Lamp month boundary incident', '2030-01-31T12:23:00.000Z', '2030-01-31T14:00:00.000Z');
    const maintenance = await makeWindow('Synthetic Lamp month boundary maintenance', '2030-01-31');
    const active = await j.incident('Synthetic Lamp unresolved control', [component]);
    await j.save(active.id, { details: 'Synthetic Lamp unresolved publication', nextUpdateAt: '2030-01-31T16:00:00.000Z' }); await j.publish(active.id);
    const scheduled = (await j.json('/api/app/maintenance', 'POST', {
      title: 'Synthetic Lamp scheduled control', affectedAudience: 'Synthetic Lamp future customers', customerImpact: 'Synthetic Lamp future pause.',
      startsAt: '2030-02-02T10:00:00.000Z', endsAt: '2030-02-02T11:00:00.000Z', componentIds: [component.id], autoStart: false, autoComplete: false,
    }, 201)).maintenance;
    const html = await j.visible('/history', maintenance.title);
    const groups = historyGroups(html);
    assert.equal(groups.length, 3);
    assert.ok(historyText(groups[0]).startsWith('February 2030'));
    assert.ok(historyText(groups[1]).startsWith('December 2029'));
    assert.ok(historyText(groups[2]).startsWith('Earlier history'));
    for (const record of [february, maintenance]) assert.ok(historyText(groups[0]).includes(record.title));
    assert.ok(!historyText(groups[0]).includes(december.title));
    assert.ok(historyText(groups[1]).includes(december.title));
    assert.deepEqual(historyLinks(html).sort(), [february.href, maintenance.href, december.href].sort(), 'the index contains exactly the recent completed records');
    for (const href of [oldIncident.href, oldWindow.href, `/incidents/${active.reference}`, `/maintenance/${scheduled.reference}`]) assert.ok(!historyLinks(html).includes(href), `${href} stays outside the completed twelve-month index`);
    for (const record of [february, maintenance, december]) assertHistoryRecord(html, record);
    // Publication identity and full native wording are independently retained above;
    // month pages must present the same complete records as the index.
    const monthly = await j.publicText('/history/2030-02');
    for (const record of [february, maintenance]) assertHistoryRecord(monthly, record);
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    await page.goto(j.publicOrigin + '/history');
    assertHistoryRecord(await page.content(), february);
    assertHistoryRecord(await page.content(), maintenance);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const proof = process.env.LAMP_HISTORY_PROOF_DIRECTORY || './test-results/public-history';
    await mkdir(proof, { recursive: true });
    await page.screenshot({ path: join(proof, 'history-1440.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: join(proof, 'history-390.png'), fullPage: true });
  } finally { await browser?.close(); await j.close(); }
}
