import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { unstable_getMiniflareWorkerOptions } from 'wrangler';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { migrate } from '../../reference-storage/runtime.mjs';
import { startMiniflare } from '../worker-startup.mjs';
import { provider } from '../../fixtures/base/oidc-idp.mjs';
import { requiredSignInFlow } from './required-sign-in-flow.mjs';
import { invitationRolesFlow } from './invitation-roles-flow.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

const require = createRequire(import.meta.url);
const workerRequire = createRequire(require.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = workerRequire('miniflare');
const run = promisify(execFile);
const address = name => `${name}${String.fromCharCode(64)}example.test`;
const invitedEmail = address('synthetic-lamp-3');

// Run the built app, including Start documents and browser assets, against
// fixture authorization and mail providers.
export async function managementInstallation(diagnostic = () => {}) {
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
  const sessionSecret = 'synthetic-lamp-session-1'.repeat(4);
  async function terminalLink(email) {
    try {
      const { stdout } = await run('pnpm', ['--silent', 'signin-link', '--email', email,
        '--origin', origin, '--persist-to', state], {
        env: { ...process.env, SESSION_SECRET: sessionSecret }, encoding: 'utf8', timeout: 30_000,
      });
      return { status: 0, stdout: stdout.trim() };
    } catch (error) {
      if (typeof error.code !== 'number') throw new Error('The terminal sign-in command could not run.');
      return { status: error.code, stdout: error.stdout.trim() };
    }
  }
  let runtime, origin, issuer, idp;
  // Chromium follows the app's form redirect over real HTTP. The provider
  // still uses the shared fixture for validating the request and issuing a code.
  const authorization = createServer(async (request, response) => {
    const url = new URL(request.url, issuer);
    if (request.method !== 'GET' || url.pathname !== '/authorize') {
      response.writeHead(404).end();
      return;
    }
    try {
      const grant = await idp.authorize(url.href, {
        email: invitedEmail,
        sub: 'synthetic-lamp-operator',
        email_verified_at: Math.floor(Date.now() / 1000),
      });
      const callback = new URL(idp.options.redirectUri);
      callback.search = new URLSearchParams(grant);
      response.writeHead(303, { Location: callback.href }).end();
    } catch {
      response.writeHead(400).end('Fixture refused authorization');
    }
  });
  const close = async () => {
    try { await runtime?.dispose(); }
    finally {
      await new Promise(resolve => authorization.close(resolve));
      await rm(state, { recursive: true, force: true });
    }
  };
  try {
    await new Promise((resolve, reject) => {
      authorization.once('error', reject);
      authorization.listen(0, '127.0.0.1', resolve);
    });
    issuer = 'http://localhost:' + authorization.address().port;
    idp = await provider({ issuer, alg: 'ES256', clientId: 'synthetic-lamp-oidc',
      method: 'private_key_jwt', rerInterfaces: ['oidc-provider@1.0.0'] });
    idp.options.clientKey = idp.key.public;
    diagnostic('Starting the built operator management Worker');
    runtime = await startMiniflare({
      label: 'operator management Worker',
      create(port) {
        origin = `http://127.0.0.1:${port}`;
        idp.options.redirectUri = origin + '/auth/oidc/company/callback';
        // Wrangler's local D1 command opens the database under this same v3 directory.
        return new Miniflare(convertV4MiniflareOptions({ port, inspectorPort: 0, resourcePersistencePath: join(state, 'v3'), workers: [{
          ...workerOptions, modules, modulesRoot: dirname(options.main),
          bindings: { ...workerOptions.bindings, LAMP_APP_HOST: '127.0.0.1', LAMP_PAGE_HOST: 'localhost', LAMP_LOCAL_ORIGIN: origin,
            AUTH_ORIGIN: origin, AUTH_LOCAL: 'true', SETUP_OPERATOR_EMAIL: owner,
            SESSION_SECRET: sessionSecret, SETUP_TOKEN: 'synthetic-lamp-setup-1'.repeat(4),
            AUTH_PROVIDERS: JSON.stringify([{ id: 'company', label: 'Company SSO', preset: 'auth', issuer,
              clientId: 'synthetic-lamp-oidc', privateKey: idp.key.private }]),
            SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-subscriber-1'.repeat(4), WEBHOOK_SIGNING_SECRET: 'synthetic-lamp-webhook-1'.repeat(4),
            MAIL_PROVIDER: 'resend', MAIL_FROM_ADDRESS: address('synthetic-lamp-2'), MAIL_PROVIDER_API_KEY: 'synthetic-lamp-mail-1' },
          outboundService: async request => {
            const url = new URL(request.url);
            if (url.origin === issuer) {
              return idp.fetch(request.url, { method: request.method, redirect: 'manual',
                body: request.method === 'POST' ? await request.text() : undefined });
            }
            assert.equal(url.origin + url.pathname, 'https://api.resend.com/emails', 'only the synthetic mail edge is called');
            messages.push(await request.json());
            return Response.json({ id: `synthetic-lamp-mail-${messages.length}` });
          },
        }, ...options.externalWorkers] }));
      },
    });
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
    return { origin, owner, db, messages, terminalLink, close };
  } catch (error) { await close(); throw error; }
}

/** TEAM-002's Settings invitation and erasure are one complete team journey. */
export async function operatorManagementFlow({ browser, capture, proof, diagnostic = () => {} }) {
  const fixture = await managementInstallation(diagnostic);
  const { origin, owner, db, messages, terminalLink } = fixture;
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
    await expect(panel.getByLabel('Invitation role', { exact: true })).toHaveValue('communicator');
    const email = invitedEmail, displayName = 'Synthetic Lamp invited operator';
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
    assert.equal(pending.role, 'communicator', 'the default invitation can publish without owner authority');
    const link = linkFor(email);
    const invitedPage = await invitedContext.newPage(); watch(invitedPage);
    await confirm(invitedPage, link);
    const session = await invitedPage.request.get(origin + '/api/app/session');
    assert.equal(session.status(), 200);
    const operator = (await session.json()).operator;
    assert.equal(operator.id, pending.id, 'confirmation admits the exact pending identity');
    assert.equal(operator.email, email);
    assert.equal(operator.displayName, displayName);
    assert.equal(operator.role, 'communicator');
    const ownerId = (await (await page.request.get(origin + '/api/app/session')).json()).operator.id;
    for (const path of [`/api/app/operators/${ownerId}/revoke-access`, `/api/app/operators/${ownerId}`]) {
      const response = await invitedPage.request.fetch(origin + path, { method: path.endsWith('/revoke-access') ? 'POST' : 'DELETE', headers: { Origin: origin } });
      assert.equal(response.status(), 403, 'the invited communicator cannot remove or erase the owner');
    }
    assert.equal((await invitedPage.request.get(origin + '/api/app/operators')).status(), 403);
    await invitedPage.goto(origin + '/app/settings#operators'); await operatorHydrated(invitedPage);
    await expect(invitedPage.getByRole('button', { name: 'Remove access', exact: true })).toHaveCount(0);
    await expect(invitedPage.getByRole('button', { name: 'Erase personal data', exact: true })).toHaveCount(0);
    const componentResponse = await page.request.post(origin + '/api/app/components', { headers: { Origin: origin }, data: { name: 'Synthetic service', groupId: null, description: '', internal: false, displayOrder: 0, note: '' } });
    assert.equal(componentResponse.status(), 201);
    const component = (await componentResponse.json()).component;
    const created = await invitedPage.request.post(origin + '/api/app/incidents', { headers: { Origin: origin }, data: { title: 'Synthetic service interruption', components: [{ componentId: component.id, state: 'Major outage', relationship: 'Primary' }] } });
    assert.equal(created.status(), 201);
    const incident = (await created.json()).incident;
    const draft = await invitedPage.request.put(origin + `/api/app/incidents/${incident.id}/draft`, { headers: { Origin: origin, 'If-Match': `${incident.draft?.id ?? "-"}:${incident.updates.length}` }, data: { lifecycle: 'Monitoring', affectedAudience: 'Service customers', customerImpact: 'Requests are delayed.', whatStillWorks: 'The dashboard remains available.', details: 'Recovery is being checked.', nextUpdateAt: new Date(Date.now() + 3600000).toISOString() } });
    assert.equal(draft.status(), 200);
    const savedIncident = (await (await invitedPage.request.get(origin + `/api/app/incidents/${incident.id}`)).json()).incident;
    const publication = await invitedPage.request.post(origin + `/api/app/incidents/${incident.id}/publish`, { headers: { Origin: origin, 'If-Match': `${savedIncident.draft?.id ?? "-"}:${savedIncident.updates.length}` }, data: { channels: [] } });
    assert.equal(publication.status(), 200, 'the default invitation permits posting updates');
    await requiredSignInFlow({ browser, page, origin, owner, email, operatorId: pending.id, messages, terminalLink, proof });
    await page.goto(origin + '/app/settings#operators');
    await operatorHydrated(page);

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
    await invitedPage.reload();
    await invitedPage.waitForURL(url => url.pathname === '/signin');
    assert.equal((await page.request.get(origin + '/api/app/session')).status(), 200, 'removal preserves the setup owner access');
    assert.deepEqual(errors, [], 'the management journey has no browser or hydration errors');
    await invitationRolesFlow({ browser, page, origin, linkFor, confirm });
  } finally {
    await invitedContext.close(); await ownerContext.close(); await fixture.close();
  }
}
