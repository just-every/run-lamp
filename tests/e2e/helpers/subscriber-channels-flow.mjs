import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { openSubscriberManagementFixture } from './subscriber-management-fixture.mjs';
import { smsBindings } from './sms-subscriber-flow.mjs';

/** The visitor's public forms use the migrated Worker. Changing deployment
 * inputs restarts that Worker over its existing storage; no sender is mocked
 * as configured and no subscription service is called directly. */
export async function subscriberChannelsFlow() {
  const fixture = await openSubscriberManagementFixture();
  const { publicOrigin } = fixture;
  const screenshots = process.env.LAMP_SUBSCRIBE_SCREENSHOTS;
  const measurements = [];
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'],
  });
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
  const routePublic = () => context.route(`${publicOrigin}/**`, async route => {
    const request = route.request();
    const response = await fixture.raw(request.url(), { method: request.method(), headers: { ...request.headers(), 'CF-Connecting-IP': '192.0.2.66' }, body: request.postDataBuffer() ?? undefined });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) });
  });
  await routePublic();
  const page = await context.newPage();
  const restart = async bindings => {
    await page.waitForLoadState("networkidle");
    await context.unrouteAll({ behavior: "wait" });
    await fixture.restart({ bindings });
    await routePublic();
  };
  const capture = async name => {
    if (!screenshots) return;
    await mkdir(screenshots, { recursive: true });
    // Assertions use 1440. The phone pass records this same state for review.
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({ path: `${screenshots}/${name}-${width}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  };
  const offers = async expected => {
    await page.goto(publicOrigin);
    const actions = await page.locator('#subscribe form').evaluateAll(forms => forms.map(form => form.getAttribute('action')).sort());
    assert.deepEqual(actions, expected.sort(), 'visitors can enter data only for configured channels, and email stays');
    assert.equal(await page.locator('#subscribe').innerText().then(text => /Get updates (by SMS|in Slack)/.test(text)), expected.includes('/subscribe/sms') || expected.includes('/subscribe/slack'));
    measurements.push({ operation: 'offered-channels', actions });
    return actions;
  };
  const rebuild = async bindings => {
    await restart(bindings);
    // The ordinary owner door rebuilds public snapshots after a deployment.
    const response = await fixture.api('/api/app/prelaunch', { method: 'PATCH', body: JSON.stringify({ enabled: false }) });
    assert.equal(response.status, 200, response.text);
  };
  try {
    await fixture.raw('/health');
    await offers(['/subscribe', '/subscribe/teams']);
    await page.locator('#subscribe').scrollIntoViewIfNeeded();
    await capture('subscribe-unconfigured');
    await page.locator('summary').filter({ hasText: 'Get updates in Teams' }).click();
    const teams = page.locator('form[action="/subscribe/teams"]');
    const guide = teams.getByRole('link');
    assert.equal(await guide.count(), 1, 'the Teams form supplies one setup guide');
    const guideUrl = new URL(await guide.getAttribute('href'), publicOrigin);
    assert.equal(guideUrl.origin, new URL(publicOrigin).origin, 'the guide stays on this public site');
    assert.equal(await guide.evaluate(link => Boolean(link.compareDocumentPosition(document.querySelector('#teams-url')) & Node.DOCUMENT_POSITION_FOLLOWING)), true, 'the guide is read before entering the URL');
    await capture('teams-form');
    await guide.click();
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok(await page.locator('ol li').count() > 0, 'the guide presents ordered setup instructions');
    assert.equal(await page.locator('form').count(), 0, 'the guide needs no owner login or data entry');
    assert.equal(await page.locator('.subscriber-document a[href="/#subscribe"]').count() > 0, true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'the guide fits its viewport');
    await capture('teams-guide');
    await page.getByRole('link', { name: 'Back to subscriptions', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#subscribe');

    // Each channel returns only when its complete installation inputs exist.
    const slack = { SLACK_CLIENT_ID: 'synthetic-lamp-slack-client', SLACK_CLIENT_SECRET: 'synthetic-lamp-slack-secret', SLACK_SIGNING_SECRET: 'synthetic-lamp-slack-signing' };
    await rebuild({ ...smsBindings, ...slack, SLACK_SIGNING_SECRET: '' });
    await offers(['/subscribe', '/subscribe/sms', '/subscribe/teams']);
    await rebuild({ ...slack, TWILIO_ACCOUNT_SID: smsBindings.TWILIO_ACCOUNT_SID });
    await offers(['/subscribe', '/subscribe/slack', '/subscribe/teams']);
    await page.locator('summary').filter({ hasText: 'Get updates in Slack' }).click();
    await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Get updates in Slack' }).click()]);
    const authorization = new URL(await page.getByRole('link', { name: 'Continue to Slack', exact: true }).getAttribute('href'));
    assert.equal(authorization.origin, 'https://slack.com');
    assert.equal(authorization.searchParams.get('scope'), 'incoming-webhook');

    await rebuild({ ...smsBindings, ...slack });
    await offers(['/subscribe', '/subscribe/sms', '/subscribe/slack', '/subscribe/teams']);
    await page.locator('#subscribe').scrollIntoViewIfNeeded();
    await capture('subscribe-configured');
    // The page already loaded before configuration disappears is a real stale
    // form. Its POST must offer a clear return route even though it cannot send.
    await restart({});
    await page.locator('summary').filter({ hasText: 'Get updates in Slack' }).click();
    await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Get updates in Slack' }).click()]);
    assert.equal(await page.locator('.subscriber-document a[href="/#subscribe"]').count(), 1, 'an unavailable Slack result has an explicit way back');
    await capture('slack-unavailable');
    await page.getByRole('link', { name: 'Back to subscriptions', exact: true }).click();
    await page.locator('summary').filter({ hasText: 'Get updates by SMS' }).click();
    await page.locator('#sms-phone').fill('+12025550100');
    await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Send opt-in text' }).click()]);
    assert.equal(await page.locator('.subscriber-document a[href="/#subscribe"]').count(), 1, 'an unavailable SMS result keeps its return route');
    await capture('sms-unavailable');
    await page.getByRole('link', { name: 'Back to subscriptions', exact: true }).click();
    await page.locator('summary').filter({ hasText: 'Get updates in Teams' }).click();
    await page.locator('#teams-url').fill('https://unrelated.example.test/workflow');
    await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Send verification card' }).click()]);
    assert.equal(await page.locator('.subscriber-document a[href="/#subscribe"]').count(), 1, 'a refused Teams result has an explicit way back');
    await capture('teams-unavailable');
    await rebuild({ WEBHOOK_SIGNING_SECRET: '' });
    await offers(['/subscribe']);
    await rebuild({});
    await offers(['/subscribe', '/subscribe/teams']);
    assert.deepEqual(await fixture.list(), [], 'unavailable and refused forms create no subscribers');
    const email = 'synthetic-lamp-channel-email@example.test';
    await page.locator('#email').fill(email);
    const emailResponse = page.waitForNavigation();
    await page.locator('form[action="/subscribe"] button[type="submit"]').click();
    assert.equal((await emailResponse).status(), 202, 'email can still subscribe through the script-free form');
    assert.equal((await fixture.list()).find(row => row.destination === email).state, 'pending');
    assert.ok(fixture.messages.some(message => message.to.includes(email) && /confirm-subscription/.test(message.text)), 'email sends its confirmation through the provider edge');
    if (process.env.LAMP_SUBSCRIBE_CHANNEL_RECEIPT) await writeFile(process.env.LAMP_SUBSCRIBE_CHANNEL_RECEIPT, JSON.stringify({ journey: 'subscriberChannelsFlow', assertionsWidth: 1440, proofWidths: screenshots ? [1440, 390] : [], measurements, staleResultReturnLinks: ['sms', 'slack', 'teams'], teamsGuideSameOrigin: true, scriptsDisabled: true }, null, 2) + '\n');
  } finally { await context.unrouteAll({ behavior: "wait" }); await browser.close(); await fixture.close(); }
}
