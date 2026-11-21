import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { operatorHydrated } from './operator-hydrated.mjs';

export async function requiredSignInFlow({ browser, page, origin, idp, email, operatorId, messages, proof }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const guest = await context.newPage();
  const signIn = origin + '/signin';
  const settings = origin + '/app/settings#sign-in';
  const mail = origin + '/auth/magic-link';
  const headers = { Origin: origin };
  const panel = page.getByRole('region', { name: 'Required sign-in' });
  const select = panel.getByLabel('Sign-in method');
  const submit = panel.getByRole('button', { name: 'Save sign-in method' });
  const providerButton = guest.getByRole('button', { name: 'Continue with Company SSO' });
  const pageRead = () => page.request.get(origin + '/api/app/sign-in');
  async function save(value) {
    await select.selectOption(value);
    const result = page.waitForResponse(response => new URL(response.url()).pathname === '/api/app/sign-in/policy');
    await submit.click();
    const acknowledged = await result;
    assert.equal(acknowledged.status(), 200, await acknowledged.text());
    assert.equal((await acknowledged.json()).requiredProvider, value || null);
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
    await context.route(url => url.origin === idp.issuer && url.pathname === '/authorize', async route => {
      const grant = await idp.authorize(route.request().url(), {
        email, sub: 'synthetic-lamp-operator', email_verified_at: Math.floor(Date.now() / 1000),
      });
      const callback = new URL(idp.options.redirectUri);
      callback.search = new URLSearchParams(grant);
      await route.fulfill({ status: 303, headers: { location: callback.href } });
    });
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
    await save('company');
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
    if (proof) {
      for (const width of [1440, 390]) {
        for (const [screen, name] of [[page, 'required-sign-in-settings'], [guest, 'required-sign-in-notice']]) {
          await screen.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
          await proof(screen, name + '-' + width);
        }
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await guest.setViewportSize({ width: 1440, height: 1000 });
    }

    const previous = await guest.request.post(origin + '/auth/confirm', {
      data: { token: oldLink.searchParams.get('token') }, headers, maxRedirects: 0,
    });
    assert.equal(previous.status(), 403);
    assert.equal(previous.headers()['set-cookie'], undefined);
    assert.equal(messages.length, count);
    assert.equal((await guest.request.get(origin + '/api/app/session')).status(), 401);
    await providerLogin();

    await save('');
    await guest.goto(signIn);
    await expect(guest.getByRole('button', { name: 'Email a sign-in link' })).toBeVisible();
  } finally {
    await context.close();
  }
}
