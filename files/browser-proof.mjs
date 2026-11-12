import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
const root = resolve(process.argv[2]);
process.chdir(root);
const require = createRequire(join(root, 'package.json'));
const { chromium } = require('playwright');
const from = path => import(pathToFileURL(join(root, path)));
const { openFollowUpsRuntime } = await from('tests/e2e/helpers/follow-ups-runtime.mjs');
const { incidentCorrectionsFlow } = await from('tests/e2e/helpers/incident-corrections-flow.mjs');
const { incidentComposer } = await from('tests/e2e/helpers/incident-composer.mjs');
const { operatorHydrated } = await from('tests/e2e/helpers/operator-hydrated.mjs');
const evidence = resolve(root, '../packet/screenshots');
process.env.LAMP_INCIDENT_SCREENSHOTS = evidence;
await mkdir(evidence, { recursive: true });
let fixture, browser, context;
try {
  fixture = await openFollowUpsRuntime({ builtWorker: true, pageHost: 'localhost' });
  const api = async (path, method = 'GET', body) => {
    const response = await fixture.api(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.ok(response.status >= 200 && response.status < 300, response.text);
    return response.body;
  };
  const component = (await api('/api/app/components', 'POST', { groupId: null, name: 'Synthetic Lamp checkout API', description: '', internal: false, displayOrder: 1, note: '' })).component;
  let incident = (await api('/api/app/incidents', 'POST', { title: 'Synthetic Lamp checkout recovery', components: [{ componentId: component.id, state: 'Major outage', relationship: 'Primary' }] })).incident;
  const path = '/api/app/incidents/' + incident.id;
  for (const lifecycle of ['Investigating', 'Resolved']) {
    await api(path + '/draft', 'PUT', { lifecycle, affectedAudience: 'Synthetic Lamp customers', customerImpact: lifecycle === 'Resolved' ? 'Checkout service has recovered.' : 'Checkout requests are delayed.', whatStillWorks: 'Existing orders remain available.', details: '', nextUpdateAt: lifecycle === 'Resolved' ? null : new Date(Date.now() + 3600000).toISOString() });
    await api(path + '/publish', 'POST', { channels: [] });
  }
  incident = (await api(path)).incident;
  browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const split = fixture.cookie.indexOf('=');
  await context.addCookies([{ name: fixture.cookie.slice(0, split), value: fixture.cookie.slice(split + 1), url: fixture.appOrigin }]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const pageUrl = new URL(fixture.appOrigin);
  pageUrl.hostname = 'localhost';
  await incidentCorrectionsFlow({ page, browserContext: context, appUrl: fixture.appOrigin, pageUrl: pageUrl.origin, api, incident });
  console.log('PASS: existing correction helper through built production Worker at 1440; changed screens captured at 1440 and 390.');
  const composer = incidentComposer(page);
  await composer.impact.fill('Synthetic Lamp ordinary follow-up after the correction.');
  await composer.nextUpdate.fill('2027-09-08T17:00');
  await page.locator('.autosave-status.is-saved').waitFor();
  await composer.option('Notify…');
  const notify = page.getByRole('region', { name: 'Notify', exact: true });
  await notify.waitFor();
  const published = page.waitForResponse(response => response.url().endsWith(path + '/publish') && response.request().method() === 'POST');
  await composer.publish.click();
  assert.equal((await published).status(), 200);
  await page.waitForFunction(() => document.querySelector('.composer-panel textarea')?.value === '');
  assert.equal(await notify.isVisible(), true, 'an open Notify panel survives publication');
  assert.equal((await api(path)).incident.updates[0].correctsUpdateId, null);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.screenshot({ path: join(evidence, 'notify-after-publication-' + width + '.png'), fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log('PASS: Notify remains open after publication; next publication is ordinary; no page errors.');
} finally {
  await context?.close();
  await browser?.close();
  await fixture?.close();
}
