import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openTrafficAlertsRuntime } from './traffic-alerts-runtime.mjs';
import { promiseDraftFixture, assertPromiseDraft } from './promise-draft-fixture.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

export async function promiseDraftBrowserFlow({ browser, t }) {
  const fixture = await openTrafficAlertsRuntime();
  t.diagnostic('AGENT-002 built Worker ready');
  let context;
  try {
    const json = async (path, method = 'GET', value, status = 200) => {
      const response = await fixture.api(path, { method, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
      assert.equal(response.status, status, `${method} ${path}: ${response.text}`);
      return response.body;
    };
    const scenario = await promiseDraftFixture({ ...fixture, json });
    t.diagnostic('AGENT-002 signed evidence and published commitment ready');
    await fixture.clock(scenario.prepareAt); await fixture.tick(scenario.prepareAt);
    const draft = await assertPromiseDraft(json, scenario);
    t.diagnostic('AGENT-002 scheduled preparation read back');
    const width = Number(process.env.LAMP_PROMISE_WIDTH || 1440);
    context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 } });
    const equals = fixture.cookie.indexOf('=');
    await context.addCookies([{ name: fixture.cookie.slice(0, equals), value: fixture.cookie.slice(equals + 1), url: fixture.origin }]);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${fixture.origin}/app/incidents/${scenario.id}#prepared-draft`);
    await operatorHydrated(page);
    t.diagnostic(`AGENT-002 composer hydrated at ${width}`);
    const panel = page.getByRole('region', { name: 'Lamp-prepared draft', exact: true });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('heading', { name: 'Prepared by Lamp', exact: true })).toBeVisible();
    const rows = panel.locator('ul > li');
    await expect(rows).toHaveCount(scenario.expectedEvidence.length);
    assert.deepEqual(await rows.allTextContents(), scenario.expectedEvidence.map(item => `${item.text} [${item.ref}]`), 'the private composer displays every complete observation in submitted order');
    assert.deepEqual(await panel.locator('.field-sources a').allTextContents(), scenario.citations.map(ref => `[${ref}]`), 'the source list retains the original update and every expected citation');
    // Follow both the inline evidence citations and the separate source list.
    // Closing the Brief before each click proves the link reveals its own row.
    const links = panel.getByRole('link');
    await expect(links).toHaveCount(scenario.expectedEvidence.length + scenario.citations.length);
    for (let index = 0; index < await links.count(); index++) {
      const link = links.nth(index);
      const ref = (await link.textContent()).slice(1, -1);
      t.diagnostic(`AGENT-002 source ${index + 1}: ${ref}`);
      assert.ok(scenario.citations.includes(ref));
      const toggle = page.locator('[data-panel-row="brief"] button.panel-row-toggle');
      if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      assert.equal(await link.getAttribute('href'), `#brief-${ref}`);
      await link.click();
      const target = page.locator(`#brief-${ref}`);
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(target).toBeVisible();
      await expect(target.locator('details')).toHaveAttribute('open', '');
      if (ref === 'U1') {
        await expect(target.getByText(scenario.wording.customerImpact, { exact: true })).toBeVisible();
        await expect(target.getByText(scenario.wording.affectedAudience, { exact: true })).toBeVisible();
      } else {
        const submitted = scenario.evidence.find(item => item.ref === ref);
        const payload = target.locator('pre');
        await expect(payload).toBeVisible();
        assert.deepEqual(JSON.parse(await payload.textContent()), submitted.payload, `${ref} opens the actual submitted source payload`);
        assert.ok((await target.locator('summary').textContent()).includes(submitted.payload.alert.title));
      }
    }
    assert.deepEqual((await json(`/api/app/incidents/${scenario.id}`)).incident.draft, draft, 'viewing and following sources never changes the prepared draft');
    assert.deepEqual(errors, [], 'prepared evidence and source navigation have no browser errors');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `complete prepared evidence fits at ${width}`);
    assert.deepEqual((await new AxeBuilder({ page }).analyze()).violations.filter(row => ['serious', 'critical'].includes(row.impact)).map(row => ({ id: row.id, nodes: row.nodes.map(node => node.target) })), []);
    t.diagnostic(`PROBE AGENT-002 acceptance-4 browser: built private composer at ${width} -> all ${scenario.expectedEvidence.length} evidence rows, all ${scenario.citations.length} sources and every inline citation reconciled; each click reveals the exact submitted payload or original publication`);
    // Routine assertions use one width. The same candidate also records its
    // clause screen at desktop and phone sizes for the landing review.
    if (process.env.LAMP_BROWSER_EVIDENCE) {
      await mkdir(process.env.LAMP_BROWSER_EVIDENCE, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await panel.scrollIntoViewIfNeeded();
        await page.screenshot({ path: join(process.env.LAMP_BROWSER_EVIDENCE, `${width}-promise-preparation.png`), fullPage: true });
      }
    }
  } finally { await context?.close(); await fixture.close(); }
}
