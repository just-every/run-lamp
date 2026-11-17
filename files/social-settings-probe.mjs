import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from '/home/agent/rer-consolidation/work/maint/gr-mt-lamp-code-17/repo/node_modules/playwright/index.mjs';
import { expect } from '/home/agent/rer-consolidation/work/maint/gr-mt-lamp-code-17/repo/node_modules/@playwright/test/index.mjs';
const repo = '/home/agent/rer-consolidation/work/maint/gr-mt-lamp-code-17/repo';
const packet = '/home/agent/rer-consolidation/work/gr-mt-lamp-code-17/packet';
const assertions = [];
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => { window.__socialXss = 0; });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const log = await readFile('/tmp/gr-lamp-dev-private.log', 'utf8');
  const entry = log.match(/^RER_OPEN (https?:\/\/\S+)/m)?.[1];
  assert.ok(entry, 'private owner entry is available');
  // Keep the local sign-in fragment exclusively in memory, out of receipts.
  try { await page.goto(entry); await page.waitForURL(url => ['/app', '/setup'].includes(url.pathname)); }
  catch { throw new Error('Local one-click owner entry failed; private URL suppressed.'); }
  const origin = new URL(page.url()).origin;
  const setup = await page.request.post(origin + '/api/app/overview/first-run', { headers: { Origin: origin }, data: { components: [], groups: [] } });
  assert.equal(setup.status(), 200, 'local setup completes through the ordinary owner API');
  await page.goto(origin + '/app/settings#channels');
  await page.locator('.operator-shell[data-hydrated]').waitFor({ timeout: 60_000 });
  const panel = page.getByRole('region', { name: 'X, Bluesky and Mastodon', exact: true });
  const payload = '<img src=x onerror="window.__socialXss=1">';
  const accountName = 'synthetic-lamp ' + payload;
  await panel.getByLabel('Account name', { exact: true }).fill(accountName);
  await panel.getByLabel('Post prefix', { exact: true }).fill('Synthetic:');
  await panel.getByLabel('X OAuth 2.0 user token (tweet.write)', { exact: true }).fill('synthetic-lamp-probe-17');
  await panel.getByRole('button', { name: 'Connect social account', exact: true }).click();
  await expect(panel.getByText('Social account connected.', { exact: true })).toBeVisible();
  await expect(panel.getByRole('listitem').filter({ hasText: accountName })).toBeVisible();
  await expect(panel.getByLabel('X OAuth 2.0 user token (tweet.write)', { exact: true })).toHaveValue('');
  assertions.push('Real account connect persists a markup-shaped name as literal text and clears the credential input.');
  await page.reload();
  await page.locator('.operator-shell[data-hydrated]').waitFor();
  await expect(panel.getByRole('listitem').filter({ hasText: accountName })).toBeVisible();
  assert.equal(await panel.locator('img,script,svg[onload],[onerror]').count(), 0);
  assert.equal(await page.evaluate(() => window.__socialXss), 0);
  assertions.push('A reload renders the saved account name literally in the server-rendered and hydrated settings.');
  // Substitute only delivery read data at the browser network edge: no social provider is contacted.
  const fields = ['reference', 'account', 'network', 'state', 'queuedAt', 'outcomeAt', 'postId'];
  const post = Object.fromEntries(fields.map(field => [field, field + ':' + payload]));
  post.id = 'synthetic-lamp-post-17'; post.attempts = 2;
  await page.route('**/api/app/social', async route => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const body = await response.json();
    body.posts = [post];
    await route.fulfill({ response, json: body });
  });
  const checkbox = panel.getByRole('checkbox', { name: 'Post by default', exact: true });
  const currentDefault = await checkbox.isChecked();
  await checkbox.setChecked(!currentDefault);
  await expect(panel.getByText('Social posting default saved.', { exact: true })).toBeVisible();
  await panel.getByText('Social delivery log', { exact: true }).click();
  const delivery = panel.locator('.channel-posts');
  for (const field of fields) await expect(delivery).toContainText(post[field]);
  assert.equal(await delivery.locator('*').count(), 1, 'only the existing list item is created, with no injected elements');
  assert.equal(await page.evaluate(() => window.__socialXss), 0);
  assertions.push('All seven delivery-log string fields remain literal text after a real default change refreshes the API resource; no payload elements or handlers appear.');
  for (const network of ['bluesky', 'mastodon', 'x']) {
    await panel.getByLabel('Social network', { exact: true }).selectOption(network);
    await expect(panel.locator('a.text-link')).toHaveAttribute('href', '/docs/social-accounts#' + network);
  }
  assertions.push('Each of the three network choices retains its fixed local setup-document link.');
  const errorPayload = 'synthetic-lamp-error ' + payload;
  await page.route('**/api/app/social', async route => {
    if (route.request().method() !== 'PATCH') return route.fallback();
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: errorPayload }) });
  });
  await checkbox.setChecked(currentDefault);
  await expect(panel.getByRole('alert')).toContainText(errorPayload);
  await expect(checkbox).toBeChecked({ checked: !currentDefault });
  assert.equal(await panel.locator('img,script,svg[onload],[onerror]').count(), 0);
  assert.equal(await page.evaluate(() => window.__socialXss), 0);
  assertions.push('A markup-shaped API error reaches FormError as literal text and a failed default mutation rolls back the optimistic checkbox.');
  await panel.screenshot({ path: packet + '/settings-1440.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.screenshot({ path: packet + '/settings-390.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await panel.getByRole('button', { name: 'Remove ' + accountName, exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText(accountName + ' removed.');
  await expect(panel.locator('.channel-list').getByRole('listitem').filter({ hasText: accountName })).toHaveCount(0);
  assert.equal(await panel.locator('img,script,svg[onload],[onerror]').count(), 0);
  assert.equal(await page.evaluate(() => window.__socialXss), 0);
  assertions.push('Real account removal succeeds and the name-derived status message remains literal text.');
  assert.deepEqual(errors, [], 'no page errors');
  assertions.push('No JavaScript page errors occurred.');
  await context.close();
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  const receipt = { status: 'pass', productHead: head, productModified: false, assertions, screenshots: ['settings-1440.png', 'settings-390.png'], assertionViewport: 1440, observedViewports: [1440, 390], providerCalls: 0, caveat: 'Delivery values and one PATCH error are browser network-edge fixtures. Account connect, persisted reload, successful default change, and removal use the real local Worker and database.' };
  await writeFile(packet + '/browser-receipt.json', JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt, null, 2));
} finally { await browser.close(); }
