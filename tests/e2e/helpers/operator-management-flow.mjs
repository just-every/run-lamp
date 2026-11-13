import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { unstable_getMiniflareWorkerOptions } from 'wrangler';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { migrate } from '../../reference-storage/runtime.mjs';
import { reservePort } from '../worker-startup.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

const require = createRequire(import.meta.url);
const workerRequire = createRequire(require.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = workerRequire('miniflare');
const address = name => `${name}${String.fromCharCode(64)}example.test`;

// Run the built app, including Start documents and browser assets. Only the
// outbound mail provider is replaced; confirmation and authority stay native.
async function managementInstallation(diagnostic) {
  const port = await reservePort({ label: 'operator management Worker' });
  const origin = `http://127.0.0.1:${port}`;
  const state = await mkdtemp(join(tmpdir(), 'lamp-operator-management-'));
  const options = unstable_getMiniflareWorkerOptions(resolve('dist/server/wrangler.json'));
  const { modulesRules, ...workerOptions } = options.workerOptions;
  async function moduleFiles(directory) {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await moduleFiles(path));
      else if (/\.(?:js|mjs|txt|html|sql|bin|wasm)$/.test(path)) files.push({
        type: /\.(?:js|mjs)$/.test(path) ? 'ESModule' : /\.(?:txt|html|sql)$/.test(path) ? 'Text' : path.endsWith('.bin') ? 'Data' : 'CompiledWasm', path,
      });
    }
    return files;
  }
  const modules = await moduleFiles(dirname(options.main));
  modules.sort((a, b) => a.path === options.main ? -1 : b.path === options.main ? 1 : a.path.localeCompare(b.path));
  const messages = [], owner = address('synthetic-lamp-1');
  let runtime;
  const close = async () => { try { await runtime?.dispose(); } finally { await rm(state, { recursive: true, force: true }); } };
  try {
    diagnostic('Starting the built operator management Worker');
    runtime = new Miniflare(convertV4MiniflareOptions({ port, inspectorPort: 0, resourcePersistencePath: state, workers: [{
      ...workerOptions, modules, modulesRoot: dirname(options.main),
      bindings: { ...workerOptions.bindings, LAMP_APP_HOST: '127.0.0.1', LAMP_PAGE_HOST: 'localhost', LAMP_LOCAL_ORIGIN: origin,
        AUTH_ORIGIN: origin, AUTH_LOCAL: 'true', SETUP_OPERATOR_EMAIL: owner,
        SESSION_SECRET: 'synthetic-lamp-session-1'.repeat(4), SETUP_TOKEN: 'synthetic-lamp-setup-1'.repeat(4),
        SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-subscriber-1'.repeat(4), WEBHOOK_SIGNING_SECRET: 'synthetic-lamp-webhook-1'.repeat(4),
        MAIL_PROVIDER: 'resend', MAIL_FROM_ADDRESS: address('synthetic-lamp-2'), MAIL_PROVIDER_API_KEY: 'synthetic-lamp-mail-1' },
      outboundService: async request => {
        const url = new URL(request.url);
        assert.equal(url.origin + url.pathname, 'https://api.resend.com/emails', 'only the synthetic mail edge is called');
        messages.push(await request.json());
        return Response.json({ id: `synthetic-lamp-mail-${messages.length}` });
      },
    }, ...options.externalWorkers] }));
    const db = await runtime.getD1Database('DB');
    diagnostic('Migrating the operator management installation');
    await migrate(db);
    diagnostic('Claiming the operator management setup identity');
    const post = (path, body) => fetch(origin + path, { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const setup = await post('/auth/bootstrap', { token: 'synthetic-lamp-setup-1'.repeat(4), displayName: 'Synthetic Lamp setup owner' });
    assert.equal(setup.status, 303, await setup.clone().text());
    // First-run page configuration is independent of the management outcomes.
    await db.prepare("INSERT INTO page_settings(id,page_name,tagline,accent_color,timezone,hostname,feed_id,mail_from_address,created_at,updated_at) VALUES('default','Synthetic Lamp','Team journey','#16794C','UTC','localhost','synthetic-lamp-feed-1',?,'2026-10-01','2026-10-01')").bind(address('synthetic-lamp-2')).run();
    await db.prepare("INSERT INTO setup_readiness(step,evidence_key,checked_at) VALUES('first-run','complete','2026-10-01')").run();
    assert.equal((await post('/auth/magic-link', { email: owner })).status, 202);
    return { origin, owner, db, messages, close };
  } catch (error) { await close(); throw error; }
}

/** TEAM-002's Settings invitation and erasure are one complete team journey. */
export async function operatorManagementFlow({ browser, capture, diagnostic = () => {} }) {
  const fixture = await managementInstallation(diagnostic);
  const { origin, owner, db, messages } = fixture;
  const ownerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const invitedContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const watch = page => page.on('pageerror', error => errors.push(error.message));
  const linkFor = email => {
    const message = messages.find(message => message.to.includes(email));
    assert.ok(message, 'the configured transport captured mail for the exact identity');
    return message.text.match(/https?:\/\/[^\s]+/)[0];
  };
  async function confirm(page, link) {
    await page.goto(link);
    const response = page.waitForResponse(response => new URL(response.url()).pathname === '/auth/confirm' && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    assert.equal((await response).status(), 303, 'ordinary browser confirmation admits the identity');
    await page.waitForURL(url => url.pathname === '/app');
    await operatorHydrated(page);
  }
  try {
    const page = await ownerContext.newPage(); watch(page);
    diagnostic('Confirming the setup owner and opening Settings');
    await confirm(page, linkFor(owner));
    await page.goto(origin + '/app/settings#operators');
    await operatorHydrated(page);
    const panel = page.getByRole('region', { name: 'Operators', exact: true });
    const email = address('synthetic-lamp-3'), displayName = 'Synthetic Lamp invited operator';
    await panel.getByLabel('Email', { exact: true }).fill(email);
    await panel.getByLabel('Name', { exact: true }).fill(displayName);
    const invitationResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/app/operators/invite' && response.request().method() === 'POST');
    await panel.getByRole('button', { name: 'Invite operator', exact: true }).click();
    assert.equal((await invitationResponse).status(), 202);
    await expect(panel.getByRole('region', { name: 'Pending invitations' }).getByText(email, { exact: true })).toBeVisible();
    const pendingResponse = await page.request.get(origin + '/api/app/operators/invited');
    assert.equal(pendingResponse.status(), 200);
    const pending = (await pendingResponse.json()).operators.find(row => row.email === email);
    assert.ok(pending);
    const link = linkFor(email);
    const invitedPage = await invitedContext.newPage(); watch(invitedPage);
    await confirm(invitedPage, link);
    const session = await invitedPage.request.get(origin + '/api/app/session');
    assert.equal(session.status(), 200);
    const operator = (await session.json()).operator;
    assert.equal(operator.id, pending.id, 'confirmation admits the exact pending identity');
    assert.equal(operator.email, email);
    assert.equal(operator.displayName, displayName);
    const active = await db.prepare('SELECT * FROM oa_operators WHERE id=?').bind(pending.id).first();
    assert.equal(active.status, 'active', 'confirmation durably activates the invited identity');
    const cookies = await invitedContext.cookies(origin);
    const capturedSession = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    assert.ok(capturedSession);
    await page.reload(); await operatorHydrated(page);
    const activeRow = panel.locator('.operator-row').filter({ hasText: email });
    await expect(activeRow.getByRole('button', { name: 'Erase personal data', exact: true })).toBeEnabled();
    const remainingInvitations = await page.request.get(origin + '/api/app/operators/invited');
    assert.equal(remainingInvitations.status(), 200);
    assert.equal((await remainingInvitations.json()).operators.some(row => row.id === pending.id), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const smallText = await panel.evaluate(root => {
      const elements = new Set(root.querySelectorAll('input, select, textarea'));
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) if (walker.currentNode.textContent.trim()) elements.add(walker.currentNode.parentElement);
      return [...elements].filter(element => element.checkVisibility() && element.getClientRects().length && parseFloat(getComputedStyle(element).fontSize) < 13)
        .map(element => element.textContent.trim());
    });
    assert.deepEqual(smallText, [], 'operator text is at least 13px');
    const controls = panel.locator('button, a, [role="button"]');
    const icons = await controls.evaluateAll(elements => elements.flatMap((element, index) =>
      element.checkVisibility() && !element.innerText.trim() && element.querySelector('svg, img') ? [index] : []));
    for (const index of icons) {
      const control = controls.nth(index), tooltip = page.getByRole('tooltip');
      await control.focus(); await expect(tooltip).toBeVisible({ timeout: 500 });
      assert.ok((await tooltip.innerText()).trim());
      await control.evaluate(element => element.blur()); await page.mouse.move(0, 0);
      await expect(tooltip).toBeHidden(); await control.hover(); await expect(tooltip).toBeHidden();
      await expect(tooltip).toBeVisible({ timeout: 600 }); await page.mouse.move(0, 0);
    }
    const audit = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(audit.violations.filter(row => ['serious', 'critical'].includes(row.impact)).map(row => row.id), []);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await capture(page, 'operator-management-' + width);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    const removedResponse = page.waitForResponse(response => new URL(response.url()).pathname === `/api/app/operators/${pending.id}` && response.request().method() === 'DELETE');
    page.once('dialog', dialog => dialog.accept());
    await activeRow.getByRole('button', { name: 'Erase personal data', exact: true }).click();
    assert.equal((await removedResponse).status(), 204);
    await expect(activeRow).toHaveCount(0);
    await page.reload(); await operatorHydrated(page);
    await expect(panel.getByText(email, { exact: true })).toHaveCount(0);
    const listed = await page.request.get(origin + '/api/app/operators');
    assert.equal(listed.status(), 200);
    assert.equal((await listed.json()).operators.some(row => row.id === pending.id), false);
    const erased = await db.prepare('SELECT * FROM oa_operators WHERE id=?').bind(pending.id).first();
    assert.equal(erased.status, 'inactive');
    assert.notEqual(erased.email, email);
    assert.equal((await invitedPage.request.get(origin + '/api/app/session')).status(), 401, 'the removed browser session immediately loses access');
    assert.equal((await fetch(origin + '/api/app/operators', { headers: { Cookie: capturedSession } })).status, 401, 'a captured session cannot reopen team data');
    const token = new URL(link).searchParams.get('token');
    const replay = await invitedPage.request.post(origin + '/auth/confirm', { data: { token }, headers: { Origin: origin }, maxRedirects: 0 });
    assert.equal(replay.status(), 400, 'the captured invitation cannot resurrect the erased operator');
    await invitedPage.goto(origin + '/app/settings#operators');
    await invitedPage.waitForURL(url => url.pathname === '/signin');
    assert.equal((await page.request.get(origin + '/api/app/session')).status(), 200, 'removal preserves the setup owner access');
    assert.deepEqual(errors, [], 'the management journey has no browser or hydration errors');
  } finally {
    await invitedContext.close(); await ownerContext.close(); await fixture.close();
  }
}
