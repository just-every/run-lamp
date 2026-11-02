import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { withDraftVersion } from '../draft-version-helper.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

// Initialize the local runtime client before Wrangler's proxy bootstrap.
const require = createRequire(import.meta.url), wranglerRequire = createRequire(require.resolve('wrangler'));
wranglerRequire('miniflare');
const { chromium } = await import('playwright');
const { expect } = await import('@playwright/test');

const MINUTE = 60_000;
const count = value => value === 'unknown' ? 'Unknown' : Number(value).toLocaleString('en-US');
function duration(value) {
  if (value === 'unknown') return 'Unknown';
  const minutes = Number(value) / MINUTE;
  return minutes < 1 ? `${Math.round(minutes * 60)} sec` : minutes < 60 ? `${Math.round(minutes)} min` : `${(minutes / 60).toFixed(1)} hr`;
}
function brisbaneTime(instant) {
  if (instant === 'unknown') return 'Not yet';
  const local = new Date(Date.parse(instant) + 10 * 3600_000);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][local.getUTCMonth()];
  return `${month} ${local.getUTCDate()}, ${local.getUTCFullYear()}, ${local.toISOString().slice(11, 16)} UTC+10:00`;
}
async function metrics(locator, expected) {
  const actual = await locator.locator(':scope > div').evaluateAll(rows => Object.fromEntries(rows.map(row => {
    const value = row.querySelector('dd');
    return [row.querySelector('dt').textContent, {
      main: [...value.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim(),
      note: value.querySelector('small')?.textContent ?? '',
    }];
  })));
  assert.deepEqual(actual, Object.fromEntries(Object.entries(expected).map(([key, value]) => [key, typeof value === 'string' ? { main: value, note: '' } : value])), 'displayed report metrics equal the downloaded values');
}
async function reach(locator, records, scope, incidentId = '', updateId = '') {
  const matching = records.filter(row => row.scope === scope && row.incident_id === incidentId && row.update_id === updateId);
  assert.equal(matching.length, 2, 'both subscriber channels are exported');
  for (const row of matching) {
    const channel = locator.locator(':scope > .communication-channels > .communication-channel').filter({ has: locator.page().getByText(row.channel === 'email' ? 'Email' : 'Webhook', { exact: true }) });
    await metrics(channel.locator('dl'), {
      'Planned sends': count(row.committed), 'Delivered sends': count(row.delivered),
      'Subscribers reached': count(row.distinct_delivered), 'Subscribers selected': count(row.distinct_committed),
      'Accepted sends': count(row.provider_accepted), Queued: count(row.queued), Bounced: count(row.bounced),
      Complained: count(row.complained), Skipped: count(row.suppressed), Failed: count(row.failed),
    });
  }
  const [totals] = matching;
  const percentage = totals.failure_rate === 'unknown' ? 'Unknown' : `${(Number(totals.failure_rate) * 100).toFixed(1)}%`;
  await expect(locator.locator(':scope > p.communication-note')).toHaveText(`Failure rate: ${percentage} (${count(totals.failure_numerator)} / ${count(totals.failure_denominator)} ${totals.failure_denominator_label}).`);
  const posts = records.filter(row => row.scope === `${scope}-operator-posts` && row.incident_id === incidentId && row.update_id === updateId && Number(row.operator_posts_committed) > 0);
  if (!posts.length) await expect(locator.getByText('Operator channel posts', { exact: true })).toHaveCount(0);
  for (const row of posts) {
    await expect(locator.getByText(`${row.channel === 'slack' ? 'Slack' : 'Teams'}: ${row.operator_posts_committed} planned, ${row.operator_posts_accepted} accepted, ${row.operator_posts_rejected} rejected, ${row.operator_posts_uncertain} uncertain, ${row.operator_posts_pending} pending. Destination posts are separate from subscriber totals.`, { exact: true })).toBeVisible();
  }
}
const incidentMetrics = row => ({
  'First accepted alert': brisbaneTime(row.first_accepted_alert_at),
  'First public update': brisbaneTime(row.first_public_update_at),
  'Alert to first update': duration(row.first_update_latency_ms), 'Time to resolve': duration(row.resolution_duration_ms),
  'Promises kept': `${row.commitments_kept} of ${Number(row.commitments_kept) + Number(row.commitments_missed)}; ${row.commitments_pending} pending`,
  'Report owed': row.reports_owed === '1' ? 'Yes' : 'No',
});

/** The production report and download are reconciled on populated native data.
 * Its clock and synthetic mail acceptance are the only controlled boundaries. */
export async function communicationPerformanceBrowser(t) {
  const { openTrafficAlertsRuntime } = await import('./traffic-alerts-runtime.mjs');
  const { eventuallyFollowUp } = await import('./follow-ups-runtime.mjs');
  const { assertIncidentCsv, assertMonthlyCsv } = await import('./communication-performance-csv.mjs');
  const fixture = await openTrafficAlertsRuntime({ diagnostic: message => t?.diagnostic(message) });
  t?.diagnostic('HIST-005 production report fixture ready');
  const { runtime, origin, publicOrigin } = fixture;
  const start = Date.UTC(2030, 0, 15, 12);
  let browser, cookie;
  const direct = (path, init = {}) => {
    const url = new URL(path, origin), headers = new Headers(init.headers);
    headers.set('Host', url.host); headers.set('Origin', origin);
    if (cookie) headers.set('Cookie', cookie);
    return runtime.dispatchFetch(url.href, { redirect: 'manual', ...init, headers });
  };
  const request = async (path, init = {}) => {
    init = await withDraftVersion(path, init, read => direct(read));
    const headers = new Headers(init.headers);
    if (init.body) headers.set('Content-Type', 'application/json');
    return direct(path, { ...init, headers });
  };
  const json = async (path, method = 'GET', body, status = 200) => {
    const response = await request(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text();
    assert.equal(response.status, status, `${method} ${path}: ${text}`);
    return text ? JSON.parse(text) : null;
  };
  try {
    await fixture.clock(start);
    // A native sign-in at the controlled instant replaces the fixture's older session.
    const ownerEmail = ['synthetic-lamp-owner', 'example.test'].join('@');
    const beforeSignIn = fixture.messages.length;
    await json('/auth/magic-link', 'POST', { email: ownerEmail }, 202);
    const signIn = await eventuallyFollowUp(() => fixture.messages.slice(beforeSignIn).find(message => message.to.includes(ownerEmail)), Boolean, 'controlled-clock owner sign-in');
    const token = new URL(signIn.text.match(/https?:\/\/[^\s]+/)[0]).searchParams.get('token');
    const signedIn = await request('/auth/confirm', { method: 'POST', body: JSON.stringify({ token }) });
    assert.equal(signedIn.status, 303, await signedIn.text());
    cookie = signedIn.headers.get('set-cookie').split(';')[0];
    t?.diagnostic('HIST-005 controlled-clock owner signed in');

    const saved = (await json('/api/app/page-settings')).settings;
    const settings = Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'mailFromAddress', 'template', 'footerCreditEnabled', 'widgetAllowedOrigins'].map(key => [key, saved[key]]));
    await json('/api/app/page-settings', 'PUT', { ...settings, timezone: ['Australia', 'Brisbane'].join('/') });
    const component = (await json('/api/app/components', 'POST', { name: 'Report fixture API', groupId: null, description: '', internal: false, displayOrder: 0, note: '' }, 201)).component;
    const subscriberEmail = ['synthetic-lamp-report-reader', 'example.test'].join('@');
    const subscribed = await runtime.dispatchFetch(`${publicOrigin}/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: subscriberEmail, componentId: component.id }) });
    assert.equal(subscribed.status, 202, await subscribed.text());
    const confirmation = await eventuallyFollowUp(() => fixture.messages.find(message => message.to.includes(subscriberEmail) && message.text.includes('/confirm-subscription/')), Boolean, 'report subscriber confirmation');
    const confirmed = await runtime.dispatchFetch(confirmation.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0]);
    assert.equal(confirmed.status, 200, await confirmed.text());
    const inventory = (await json('/api/app/subscribers')).subscribers;
    assert.equal(inventory.filter(subscriber => subscriber.state === 'active').length, 1);
    t?.diagnostic('HIST-005 native report subscriber active');
    const create = async title => (await json('/api/app/incidents', 'POST', { title, components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }] }, 201)).incident;
    const publish = async (incident, lifecycle, at, nextUpdateAt = null) => {
      await fixture.clock(at);
      await json(`/api/app/incidents/${incident.id}/draft`, 'PUT', { lifecycle, affectedAudience: 'Report fixture readers', customerImpact: `${incident.title}: ${lifecycle}.`, whatStillWorks: 'The status page remains available.', details: 'Report fixture publication.', nextUpdateAt });
      return (await json(`/api/app/incidents/${incident.id}/publish`, 'POST', { channels: ['email'] })).update;
    };
    const resolved = await create('Report fixture recovered incident');
    await publish(resolved, 'Investigating', start + 5 * MINUTE, new Date(start + 10 * MINUTE).toISOString());
    await publish(resolved, 'Resolved', start + 10 * MINUTE);
    const ongoing = await create('Report fixture ongoing incident');
    await publish(ongoing, 'Investigating', start + 12 * MINUTE, new Date(start + 60 * MINUTE).toISOString());
    await fixture.tick(start + 12 * MINUTE);
    const data = await eventuallyFollowUp(() => json('/api/app/communication-performance?month=2030-01'), report => report.summary.channels.find(channel => channel.channel === 'email').providerAccepted === 3, 'all three native report sends are accepted');
    assert.equal(data.summary.incidentCount, 2);
    assert.deepEqual(data.summary.commitments, { kept: 1, missed: 0, pending: 1, evaluated: 1, keptRate: 1 });
    assert.equal(data.summary.knownFirstUpdateLatencyCount, 0);
    assert.equal(data.summary.unknownFirstUpdateLatencyCount, 2);
    assert.equal(data.summary.averageResolutionDurationMs, 10 * MINUTE);
    assert.equal(data.summary.resolvedDurationCount, 1);
    assert.equal(data.summary.reportsOwed, 0);
    assert.deepEqual(data.summary.deliveryFailure, { failures: 0, denominator: 3, rate: 0, denominatorLabel: data.summary.deliveryFailure.denominatorLabel });
    const email = data.summary.channels.find(channel => channel.channel === 'email');
    assert.equal(email.committed, 3); assert.equal(email.distinctCommitted, 1);
    assert.equal(email.providerAccepted, 3); assert.equal(email.distinctProviderAccepted, 1);
    assert.equal(email.delivered, 0);
    t?.diagnostic('HIST-005 native monthly report has two incidents and three accepted sends');
    const csv = await assertMonthlyCsv({ request }, data);
    const reachData = await json(`/api/app/incidents/${resolved.id}/reach`);
    const incidentCsv = await assertIncidentCsv({ request }, resolved.id, reachData);
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const equals = cookie.indexOf('=');
    await context.addCookies([{ name: cookie.slice(0, equals), value: cookie.slice(equals + 1), url: origin }]);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (/hydrat|did not match|Minified React error/i.test(message.text())) errors.push(message.text()); });
    await page.goto(`${origin}/app/settings#reports`); await operatorHydrated(page);
    const panel = page.getByRole('region', { name: 'Communication performance', exact: true });
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.getByLabel('Communication performance month')).toHaveValue('2030-01');
    const monthly = csv.find(row => row.scope === 'month' && row.channel === 'email');
    await metrics(panel.locator(':scope > dl.communication-metrics'), {
      Incidents: count(monthly.incident_count),
      'Promises kept': `${monthly.commitments_kept} of ${Number(monthly.commitments_kept) + Number(monthly.commitments_missed)} (${monthly.commitments_missed} missed; ${monthly.commitments_pending} pending)`,
      'Average alert to first update': { main: duration(monthly.average_first_update_latency_ms), note: `${monthly.known_first_update_latency_count} known; ${monthly.unknown_first_update_latency_count} unknown` },
      'Average time to resolve': { main: duration(monthly.average_resolution_duration_ms), note: `${monthly.resolved_duration_count} known durations` },
      'Reports due': count(monthly.reports_owed),
    });
    await panel.locator(':scope > details.communication-updates > summary').click();
    await reach(panel.locator(':scope > details.communication-updates > .communication-counts'), csv, 'month');
    for (const incident of data.incidents) {
      const details = panel.locator('.communication-incidents > details').filter({ has: page.getByText(`${incident.reference} · ${incident.title}`, { exact: true }) });
      await details.locator(':scope > summary').click();
      const row = csv.find(record => record.scope === 'incident' && record.incident_id === incident.incidentId && record.channel === 'email');
      await metrics(details.locator(':scope > dl.communication-metrics'), incidentMetrics(row));
      await reach(details.locator(':scope > .communication-counts'), csv, 'incident', incident.incidentId);
    }
    await panel.locator(':scope > details.communication-definitions > summary').click();
    const definitionText = await panel.locator(':scope > details.communication-definitions > p').allTextContents();
    assert.deepEqual(definitionText, [`Incidents opened from ${brisbaneTime(monthly.cohort_start)} up to ${brisbaneTime(monthly.cohort_end)}. Includes later updates and their current delivery results.`, ...Object.values(data.definitions)]);
    await expect(panel.getByText(`Times in ${data.timezone}.`, { exact: true })).toBeVisible();
    await expect(panel.locator(':scope > p.communication-note')).toHaveText(`Updated ${brisbaneTime(monthly.measured_at)}`);
    await expect(panel.getByRole('link', { name: 'Download CSV', exact: true })).toHaveAttribute('href', '/api/app/communication-performance?format=csv');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'the report fits the desktop viewport');
    if (process.env.LAMP_SCREENSHOTS) {
      await mkdir(process.env.LAMP_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: join(process.env.LAMP_SCREENSHOTS, '1440-communication-performance.png'), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'the report fits the phone viewport');
    if (process.env.LAMP_SCREENSHOTS) await page.screenshot({ path: join(process.env.LAMP_SCREENSHOTS, '390-communication-performance.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${origin}/app/incidents/${resolved.id}`); await operatorHydrated(page);
    await page.getByRole('button', { name: 'Reach', exact: true }).click();
    const incidentPanel = page.locator('.incident-reach');
    const incidentRow = incidentCsv.find(row => row.scope === 'incident' && row.channel === 'email');
    await metrics(incidentPanel.locator(':scope > dl.communication-metrics'), incidentMetrics(incidentRow));
    await reach(incidentPanel.locator(':scope > .communication-counts'), incidentCsv, 'incident', resolved.id);
    await incidentPanel.locator(':scope > details.communication-updates > summary').click();
    for (const update of reachData.updates) {
      const article = incidentPanel.locator(`[data-update-id="${update.updateId}"]`);
      await expect(article.getByRole('heading')).toHaveText(brisbaneTime(update.publishedAt));
      await expect(article.locator(':scope > p')).toHaveText(`Subscriber channels selected: ${update.selectedChannels.join(', ') || 'none'}.`);
      await reach(article.locator(':scope > .communication-counts'), incidentCsv, 'update', resolved.id, update.updateId);
    }
    await incidentPanel.locator(':scope > details.communication-definitions > summary').click();
    assert.deepEqual(await incidentPanel.locator(':scope > details.communication-definitions > p').allTextContents(), Object.values(reachData.definitions));
    await expect(incidentPanel.locator(':scope > p.communication-note')).toHaveText(`Measured ${brisbaneTime(reachData.measuredAt)} · ${reachData.timezone}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'incident reach fits the desktop viewport');
    if (process.env.LAMP_SCREENSHOTS) await page.screenshot({ path: join(process.env.LAMP_SCREENSHOTS, '1440-incident-reach.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'incident reach fits the phone viewport');
    if (process.env.LAMP_SCREENSHOTS) await page.screenshot({ path: join(process.env.LAMP_SCREENSHOTS, '390-incident-reach.png'), fullPage: true });
    assert.deepEqual(errors, [], 'the reports hydrate without browser errors');
    t?.diagnostic('HIST-005 browser: 2 incidents, 1 kept promise, 10-minute resolved duration, 3 sends to 1 subscriber; monthly and incident CSV agree at 1440, screens recorded at 390.');
    await context.close();
  } finally { await browser?.close(); await fixture.close(); }
}
