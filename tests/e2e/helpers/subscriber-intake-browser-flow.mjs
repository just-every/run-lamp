import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readBuiltWorkerArtifact } from '../../../scripts/build-output.mjs';
import { reservePort } from '../worker-startup.mjs';
import { migrate, executeSql } from '../../reference-storage/runtime.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';
import { subscriberCsv, subscriberCsvRows, eventuallySubscriber } from './subscriber-management-fixture.mjs';

const require = createRequire(import.meta.url), wranglerRequire = createRequire(require.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const { unstable_getMiniflareWorkerOptions } = require('wrangler');
const address = name => [name, 'example.test'].join('@');

/** Exercise existing operator controls in the built production app. Only mail
 * and receiver transports are synthetic; no browser request is fulfilled by a fake. */
export async function subscriberIntakeBrowserFlow(t) {
  await readBuiltWorkerArtifact();
  const port = await reservePort({ label: 'subscriber intake browser' });
  const origin = `http://127.0.0.1:${port}`, publicOrigin = `http://localhost:${port}`;
  const options = unstable_getMiniflareWorkerOptions(resolve('dist/server/wrangler.json'));
  const { modulesRules, ...workerOptions } = options.workerOptions;
  async function moduleFiles(directory) {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await moduleFiles(path));
      else if (/\.(?:js|mjs|txt|html|sql|bin|wasm)$/.test(path)) files.push({ type: /\.(?:js|mjs)$/.test(path) ? 'ESModule' : /\.(?:txt|html|sql)$/.test(path) ? 'Text' : path.endsWith('.bin') ? 'Data' : 'CompiledWasm', path });
    }
    return files;
  }
  const modules = await moduleFiles(dirname(options.main));
  modules.sort((a, b) => a.path === options.main ? -1 : b.path === options.main ? 1 : a.path.localeCompare(b.path));
  const messages = [];
  let runtime, browser, page;
  const bindings = { ...workerOptions.bindings, LAMP_APP_HOST: '127.0.0.1', LAMP_PAGE_HOST: 'localhost', LAMP_LOCAL_ORIGIN: origin, AUTH_ORIGIN: origin, AUTH_LOCAL: 'true',
    SETUP_OPERATOR_EMAIL: address('synthetic-lamp-owner'), SESSION_SECRET: 'synthetic-lamp-intake-session-1'.repeat(3), SETUP_TOKEN: 'synthetic-lamp-intake-setup-1'.repeat(3),
    SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-intake-subscriber-1'.repeat(3), WEBHOOK_SIGNING_SECRET: 'synthetic-lamp-intake-webhook-1'.repeat(3),
    MAIL_FROM_ADDRESS: address('synthetic-lamp-sender'), MAIL_PROVIDER: 'resend', MAIL_PROVIDER_API_KEY: 'synthetic-lamp-intake-mail-1' };
  const outboundService = async request => {
    const url = new URL(request.url);
    if (url.origin === 'https://api.resend.com' && url.pathname === '/emails') {
      messages.push(await request.json()); return Response.json({ id: `synthetic-lamp-intake-mail-${messages.length}` });
    }
    if (url.origin === origin || url.origin === publicOrigin) return runtime.dispatchFetch(request);
    throw new Error(`Unexpected subscriber intake network edge: ${url.origin}${url.pathname}`);
  };
  try {
    runtime = new Miniflare(convertV4MiniflareOptions({ port, inspectorPort: 0, workers: [{ ...workerOptions, modules, modulesRoot: dirname(options.main), bindings, outboundService }, ...options.externalWorkers] }));
    const env = await runtime.getBindings();
    await migrate(env.DB);
    await executeSql(env.DB, `INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES('01J00000000000000000000091','${address('synthetic-lamp-owner')}','Synthetic Lamp owner','owner','active',${Date.now()});
      INSERT INTO oa_bootstrap(singleton,claim_id,claimed_at) VALUES(1,'01J00000000000000000000091',${Date.now()});
      INSERT INTO page_settings(id,page_name,tagline,accent_color,timezone,hostname,feed_id,mail_from_address,created_at,updated_at) VALUES('default','Synthetic Lamp intake','Subscriber intake fixture','#16794C','UTC','localhost','synthetic-lamp-intake-feed-1','${address('synthetic-lamp-sender')}','2026-10-01','2026-10-01');
      INSERT INTO setup_readiness(step,evidence_key,checked_at) VALUES('first-run','complete','2026-10-01');`);
    const login = await runtime.dispatchFetch(`${origin}/auth/magic-link`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: address('synthetic-lamp-owner') }) });
    assert.ok(login.status >= 200 && login.status < 300, await login.text());
    const invitation = await eventuallySubscriber(() => messages.find(message => message.to.includes(address('synthetic-lamp-owner'))), Boolean, 'native sign-in sends its owner link');
    const token = new URL(invitation.text.match(/https?:\/\/[^\s]+/)[0]).searchParams.get('token');
    const confirmed = await runtime.dispatchFetch(`${origin}/auth/confirm`, { method: 'POST', redirect: 'manual', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    assert.equal(confirmed.status, 303, await confirmed.text());
    const cookie = confirmed.headers.get('set-cookie').split(';')[0];
    const api = async (path, body) => {
      const response = await runtime.dispatchFetch(origin + path, { headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) });
      assert.ok(response.ok, `${path}: ${await response.clone().text()}`); return response.json();
    };
    const components = [];
    for (const name of ['Synthetic Lamp intake first', 'Synthetic Lamp intake second', 'Synthetic Lamp intake excluded']) components.push((await api('/api/app/components', { groupId: null, name, description: '', internal: false, displayOrder: components.length, note: '' })).component);
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    await context.addCookies([{ name: cookie.slice(0, cookie.indexOf('=')), value: cookie.slice(cookie.indexOf('=') + 1), url: origin }]);
    page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const evidence = process.env.LAMP_BROWSER_EVIDENCE || 'test-results/subscriber-intake';
    await mkdir(evidence, { recursive: true });
    async function screens(name) {
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: no horizontal overflow at the assertion width`);
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      assert.deepEqual(audit.violations.filter(row => ['serious', 'critical'].includes(row.impact)).map(row => row.id), [], `${name}: accessible existing controls`);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: join(evidence, `${name}-${width}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    const created = [];
    for (const channel of ['email', 'webhook']) {
      await page.goto(`${origin}/app/subscribers`); await operatorHydrated(page);
      const form = page.getByRole('region', { name: 'Add subscriber', exact: true });
      await form.getByLabel('Channel', { exact: true }).selectOption(channel);
      const contact = address(`synthetic-lamp-form-${channel}`);
      const destination = channel === 'email' ? contact : 'https://receiver.example.test/synthetic-lamp-form-webhook';
      if (channel === 'webhook') await form.getByLabel('Endpoint URL', { exact: true }).fill(destination);
      await form.getByLabel(channel === 'email' ? 'Email address' : 'Contact email', { exact: true }).fill(contact);
      const selected = channel === 'email' ? [components[0], components[1]] : [components[1]];
      for (const component of selected) await form.getByRole('checkbox', { name: component.name, exact: true }).check();
      await screens(`subscriber-add-${channel}`);
      const start = messages.length;
      const saved = page.waitForResponse(response => response.url() === `${origin}/api/app/subscribers` && response.request().method() === 'POST');
      await form.getByRole('button', { name: 'Add subscriber and send confirmation', exact: true }).click();
      const response = await saved; assert.equal(response.status(), 201);
      const result = await response.json(); assert.equal(result.confirmationSent, true);
      await expect(form.getByRole('status')).toContainText('Subscriber added as pending');
      await page.reload(); await operatorHydrated(page);
      const row = (await api('/api/app/subscribers?limit=100')).subscribers.find(row => row.id === result.subscriber.id);
      assert.equal(row.channel, channel); assert.equal(row.destination, destination); assert.equal(row.contactEmail, channel === 'email' ? null : contact);
      assert.equal(row.state, 'pending'); assert.equal(row.selectionMode, 'selected');
      assert.deepEqual(row.componentSelections.map(item => item.componentId).sort(), selected.map(item => item.id).sort(), 'form-created records retain precisely their selected identities after reload');
      assert.equal(row.addedBy.displayName, 'Synthetic Lamp owner');
      const visible = page.getByRole('region', { name: 'Subscriber records', exact: true }).getByRole('row').filter({ hasText: destination });
      await expect(visible).toContainText('pending'); await expect(visible).toContainText('Added by Synthetic Lamp owner');
      const selection = visible.locator('[data-label="Selection"]');
      for (const component of selected) await expect(selection).toContainText(component.name);
      for (const component of components.filter(component => !selected.includes(component))) await expect(selection).not.toContainText(component.name);
      if (channel === 'webhook') await expect(visible).toContainText(contact);
      const sent = messages.slice(start); assert.equal(sent.length, 1); assert.deepEqual(sent[0].to, [contact]);
      const confirmation = sent[0].text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0];
      assert.equal((await runtime.dispatchFetch(confirmation)).status, 200);
      const active = (await api('/api/app/subscribers?limit=100')).subscribers.find(row => row.id === result.subscriber.id);
      assert.equal(active.state, 'active');
      assert.deepEqual(active.componentSelections.map(item => item.componentId).sort(), selected.map(item => item.id).sort());
      created.push({ id: row.id, destination, contact });
    }
    const batches = [];
    for (const [index, count] of [[0, 2], [1, 1]]) {
      const section = page.getByRole('region', { name: 'Import and export subscribers', exact: true });
      const recipients = Array.from({ length: count }, (_, row) => address(`synthetic-lamp-browser-csv-${index}-${row}`));
      const csv = subscriberCsv(['email', 'components'], recipients.map(email => [email, components[0].id]));
      const before = messages.length;
      await section.getByLabel('CSV file', { exact: true }).setInputFiles({ name: 'synthetic-lamp-subscribers.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
      await expect(section.getByLabel('CSV contents')).toHaveValue(csv.replaceAll('\r\n', '\n'));
      await section.getByRole('button', { name: 'Dry run CSV', exact: true }).click();
      await expect(section).toContainText(`${count} would be created; 0 skipped; 0 refused.`);
      assert.equal(messages.length, before);
      const applied = page.waitForResponse(response => response.url().endsWith('/api/app/subscribers/import/apply') && response.request().method() === 'POST');
      await section.getByRole('button', { name: 'Create pending subscriptions', exact: true }).click();
      const response = await applied; assert.equal(response.status(), 200);
      const result = await response.json(); batches.push({ id: result.batchId, recipients });
      await expect(section).toContainText(`${count} pending subscriptions created. No invitations have been sent.`);
      assert.equal(messages.length, before, 'browser review and apply stay silent');
    }
    await page.reload(); await operatorHydrated(page);
    const imports = page.getByRole('region', { name: 'Import and export subscribers', exact: true });
    const select = imports.getByLabel('Import batch');
    await expect(select.locator('option')).toHaveCount(2);
    await screens('subscriber-import-pending');
    for (const batch of batches) {
      await select.selectOption(batch.id);
      const label = await select.locator('option:checked').innerText();
      assert.ok(!label.includes(batch.id) && !label.includes(batch.id.slice(-6)), 'batch labels hide internal identifiers');
      assert.match(label, /CSV/i, 'the batch names its import source');
      assert.ok(label.includes(String(batch.recipients.length)) && /\d{4}/.test(label), 'the batch label retains its import time and remaining count');
      await expect(imports).toContainText(`${batch.recipients.length} invitation${batch.recipients.length === 1 ? "" : "s"} remaining.`);
      const start = messages.length;
      const sent = page.waitForResponse(response => response.url().endsWith(`/${batch.id}/send-invitations`) && response.request().method() === 'POST');
      await imports.getByRole('button', { name: 'Send invitations', exact: true }).click();
      const sentResponse = await sent;
      assert.equal(sentResponse.status(), 200);
      await expect(imports.getByRole('status')).toContainText(/invitations? sent/i);
      await expect(imports.getByRole('status')).not.toContainText(/No email was sent|Confirm locally/i);
      await expect(imports).toContainText('0 invitations remaining.');
      await expect(imports.getByRole('button', { name: 'Send invitations', exact: true })).toBeDisabled();
      assert.deepEqual(messages.slice(start).flatMap(message => message.to).sort(), [...batch.recipients].sort(), 'only the explicitly selected batch receives invitations');
      await screens(`subscriber-import-sent-${batch.recipients.length}`);
      await page.reload(); await operatorHydrated(page);
      await select.selectOption(batch.id);
      await expect(imports.getByRole('button', { name: 'Send invitations', exact: true })).toBeDisabled();
    }
    await screens('subscriber-import-complete');
    const download = page.waitForEvent('download');
    await imports.getByRole('link', { name: 'Export subscribers as CSV', exact: true }).click();
    const file = await download;
    const stream = await file.createReadStream(), chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const exported = subscriberCsvRows(Buffer.concat(chunks).toString('utf8'));
    assert.deepEqual(exported.map(row => row.destination).sort(), [...created.map(row => row.destination), ...batches.flatMap(batch => batch.recipients)].sort());
    for (const batch of batches) for (const recipient of batch.recipients) assert.equal(messages.filter(message => message.to.includes(recipient)).length, 1);
    assert.deepEqual(errors, [], 'subscriber controls have no hydration or page errors');
    t?.diagnostic('PROBE SUB-017 Add form: email and webhook retain exact destinations, contact and components after reload; one confirmation each. CSV controls: silent review and apply, two selectable durable batches, isolated invitations and exported inventory. Screens captured at 1440 and 390.');
    await context.close();
  } catch (cause) {
    if (page && process.env.LAMP_BROWSER_EVIDENCE) {
      await page.screenshot({ path: join(process.env.LAMP_BROWSER_EVIDENCE, 'subscriber-intake-failed.png'), fullPage: true }).catch(() => {});
      t?.diagnostic(`Subscriber intake failed at ${page.url()}: ${await page.locator('body').innerText().catch(() => '')}`);
    }
    throw cause;
  } finally { await browser?.close(); await runtime?.dispose(); }
}
