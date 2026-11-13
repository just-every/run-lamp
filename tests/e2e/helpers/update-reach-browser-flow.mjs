import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { operatorHydrated } from './operator-hydrated.mjs';
import { updateReachFlow } from './update-reach-flow.mjs';

const labels = {
  'Planned sends': 'committed', 'Delivered sends': 'delivered', 'Subscribers reached': 'distinctDelivered',
  'Subscribers selected': 'distinctCommitted', 'Accepted sends': 'providerAccepted', 'Queued': 'queued',
  'Bounced': 'bounced', 'Complained': 'complained', 'Skipped': 'suppressed', 'Failed': 'failed',
};

// Existing production incident screen, backed by the same real HTTP, storage,
// publication, Queue and provider-receipt flow as the native assertion journey.
export async function updateReachBrowserFlow({ browser, diagnostic }) {
  const seen = new Set();
  await updateReachFlow({ diagnostic, observe: async ({ fixture, incident, updates, expectedUpdates, incidentExpected }) => {
    if (seen.has(updates.length)) return;
    seen.add(updates.length);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    try {
      const cookie = fixture.cookie, split = cookie.indexOf('=');
      await context.addCookies([{ name: cookie.slice(0, split), value: cookie.slice(split + 1), url: fixture.appOrigin }]);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (/hydrat|did not match|server rendered/i.test(message.text())) errors.push(message.text()); });
      await page.goto(`${fixture.appOrigin}/app/incidents/${incident.id}`);
      await operatorHydrated(page);
      await page.locator('.panel-reach').scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Reach', exact: true }).click();
      const panel = page.locator('.incident-reach');
      await panel.getByRole('heading', { name: 'Whole incident', exact: true }).waitFor();
      const assertCounts = async (container, expected) => {
        const channels = container.locator(':scope > .communication-channels > .communication-channel');
        assert.equal(await channels.count(), 2);
        for (const [index, name] of ['email', 'webhook'].entries()) {
          const row = channels.nth(index);
          assert.equal(await row.locator(':scope > strong').innerText(), name === 'email' ? 'Email' : 'Webhook');
          const displayed = await row.locator('dl > div').evaluateAll(rows => Object.fromEntries(rows.map(row => [row.querySelector('dt').textContent, row.querySelector('dd').textContent])));
          assert.deepEqual(displayed, Object.fromEntries(Object.entries(labels).map(([label, field]) => [label, String(expected[name][field])])), `${name}: the existing screen shows every exact retained count`);
        }
      };
      await assertCounts(panel.locator(':scope > .communication-counts'), incidentExpected);
      await panel.locator('.communication-updates > summary').click();
      assert.equal(await panel.locator('.communication-update').count(), updates.length);
      for (const [index, { update }] of updates.entries()) {
        const article = panel.locator(`.communication-update[data-update-id="${update.id}"]`);
        await assertCounts(article.locator(':scope > .communication-counts'), expectedUpdates[index]);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'populated Reach has no desktop overflow');
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      assert.deepEqual(audit.violations.filter(row => ['serious', 'critical'].includes(row.impact)).map(row => row.id), [], 'the existing Reach controls remain accessible');
      assert.deepEqual(errors, [], 'Reach has no page or hydration errors');
      const evidence = process.env.LAMP_REACH_SCREENSHOTS || 'test-results/update-reach';
      await mkdir(evidence, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: join(evidence, `reach-${updates.length}-updates-${width}.png`), fullPage: true });
      }
    } finally { await context.close(); }
  } });
}
