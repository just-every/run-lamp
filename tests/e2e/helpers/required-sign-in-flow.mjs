import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { operatorHydrated } from './operator-hydrated.mjs';

export async function requiredSignInFlow({ browser, page, origin, owner, email, operatorId, messages, terminalLink, proof }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const guest = await context.newPage();
  const signIn = origin + '/signin';
  const settings = origin + '/app/settings#sign-in';
  const mail = origin + '/auth/magic-link';
  const headers = { Origin: origin };
  const policyPanel = tab => tab.getByRole('region', { name: 'Required sign-in' });
  const panel = policyPanel(page);
  const select = panel.getByLabel('Sign-in method');
  const providerButton = guest.getByRole('button', { name: 'Continue with Company SSO' });
  const pageRead = () => page.request.get(origin + '/api/app/sign-in');
  async function save(tab, value) {
    const controls = policyPanel(tab);
    await controls.getByLabel('Sign-in method').selectOption(value);
    const result = tab.waitForResponse(response => new URL(response.url()).pathname === '/api/app/sign-in/policy');
    await controls.getByRole('button', { name: 'Save sign-in method' }).click();
    const acknowledged = await result;
    assert.equal(acknowledged.status(), 200, await acknowledged.text());
    assert.equal((await acknowledged.json()).requiredProvider, value || null);
  }
  function confirm(link) {
    return guest.request.post(origin + '/auth/confirm', {
      data: { token: link.searchParams.get('token') }, headers, maxRedirects: 0,
    });
  }
  async function issueOwnerLink() {
    const result = await terminalLink(owner);
    assert.equal(result.status, 0, 'the Owner can issue a terminal sign-in link');
    assert.equal(result.stdout.split('\n').length, 1);
    const link = new URL(result.stdout);
    assert.equal(link.origin, origin);
    assert.equal(link.pathname, '/auth/confirm');
    assert.ok(link.searchParams.has('token'));
    return link;
  }
  async function terminalAudits() {
    const response = await page.request.get(origin + '/api/app/audit-log', {
      params: { action: 'sign-in link created from the command line' },
    });
    assert.equal(response.status(), 200);
    return (await response.json()).entries;
  }
  async function capture(tab, name) {
    if (!proof) return;
    for (const width of [1440, 390]) {
      await tab.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await proof(tab, name + '-' + width);
    }
    await tab.setViewportSize({ width: 1440, height: 1000 });
  }
  async function providerLogin() {
    await providerButton.click();
    await guest.waitForURL(url => url.pathname === '/app');
    const session = await guest.request.get(origin + '/api/app/session');
    assert.equal(session.status(), 200);
    assert.equal((await session.json()).operator.id, operatorId);
    assert.equal((await guest.request.post(origin + '/api/app/session/signout', { headers })).status(), 204);
  }

  try {
    await page.goto(settings);
    await operatorHydrated(page);
    assert.equal((await (await pageRead()).json()).requiredProvider, null);
    const toggle = page.getByRole('checkbox', { name: 'Let invited people use sign-in providers' });
    await toggle.check();
    await expect(select.getByRole('option', { name: 'Require Company SSO' })).toHaveCount(0);

    assert.equal((await guest.request.post(mail, { data: { email }, headers })).status(), 202);
    const oldLink = new URL(messages.at(-1).text.match(/https?:\/\/[^\s]+/)[0]);
    await guest.goto(oldLink.href);
    await expect(guest.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
    await guest.goto(signIn);
    await providerLogin();
    await page.reload();
    await operatorHydrated(page);
    const originalAudits = await terminalAudits();
    const prepared = await issueOwnerLink();
    assert.equal((await guest.request.post(mail, { data: { email: owner }, headers })).status(), 202);
    const oldOwnerEmail = new URL(messages.at(-1).text.match(/https?:\/\/[^\s]+/)[0]);
    await save(page, 'company');
    await expect(panel.getByRole('status')).toContainText(/[Ss]ingle sign-on.*required\b/);
    await page.reload();
    await operatorHydrated(page);
    await expect(select).toHaveValue('company');
    await expect(toggle).toBeDisabled();

    const count = messages.length;
    const request = await guest.request.post(mail, { form: { email }, headers, maxRedirects: 0 });
    assert.equal(request.status(), 303);
    await guest.goto(new URL(request.headers().location, origin).href);
    await expect(guest.getByRole('status')).toContainText('requires single sign-on');
    await expect(guest.getByRole('button', { name: 'Email a sign-in link' })).toHaveCount(0);
    await expect(providerButton).toBeVisible();
    for (const screen of [page, guest]) {
      assert.equal(await screen.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const accessibility = await new AxeBuilder({ page: screen }).analyze();
      assert.deepEqual(accessibility.violations.filter(row => ['serious', 'critical'].includes(row.impact)).map(row => row.id), []);
    }
    await capture(page, 'required-sign-in-settings');
    await capture(guest, 'required-sign-in-notice');

    const previous = await confirm(oldLink);
    assert.equal(previous.status(), 403);
    assert.equal(previous.headers()['set-cookie'], undefined);
    const previousOwner = await confirm(oldOwnerEmail);
    assert.equal(previousOwner.status(), 403, 'an emailed Owner link cannot serve as terminal recovery');
    assert.equal(previousOwner.headers()['set-cookie'], undefined);
    assert.equal((await guest.request.post(mail, { data: { email: owner }, headers })).status(), 403);
    assert.equal(messages.length, count);
    assert.equal((await guest.request.get(origin + '/api/app/session')).status(), 401);
    await providerLogin();

    assert.equal(await terminalLink(email).then(result => result.status), 1, 'the terminal cannot issue a non-Owner link under SSO');
    assert.equal((await confirm(prepared)).status(), 303, 'an Owner terminal link issued before enforcement still works');
    assert.equal((await guest.request.post(origin + '/api/app/session/signout', { headers })).status(), 204);
    const recovery = await issueOwnerLink();
    assert.equal((await guest.request.get(origin + '/api/app/session')).status(), 401, 'issuing a terminal link creates no session');
    await guest.goto(recovery.href);
    await expect(guest.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
    await capture(guest, 'required-sign-in-terminal-confirm');
    assert.equal((await confirm(recovery)).status(), 303);
    const session = await guest.request.get(origin + '/api/app/session');
    assert.equal(session.status(), 200);
    const { operator } = await session.json();
    assert.equal(operator.email, owner);
    assert.equal(operator.role, 'owner');
    const replay = await confirm(recovery);
    assert.equal(replay.status(), 403);
    assert.equal(replay.headers()['set-cookie'], undefined);
    const newAudits = (await terminalAudits()).filter(row => !originalAudits.some(original => original.id === row.id));
    assert.deepEqual(newAudits.map(row => row.actorId), [operator.id, operator.id], 'each issued terminal link is audited once');
    assert.equal(messages.length, count, 'terminal recovery sends no mail');
    await guest.goto(settings);
    await operatorHydrated(guest);
    await save(guest, '');
    assert.equal((await confirm(oldLink)).status(), 400, 'allowing email again does not revive revoked links');
    assert.equal((await guest.request.post(origin + '/api/app/session/signout', { headers })).status(), 204);
    await guest.goto(signIn);
    await expect(guest.getByRole('button', { name: 'Email a sign-in link' })).toBeVisible();
    await capture(guest, 'required-sign-in-cleared');
  } finally {
    await context.close();
  }
}
