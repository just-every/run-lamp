import assert from 'node:assert/strict';

// Follow the actual Settings links and resolve their section anchors in the
// public, rendered guide. No copy or environment-name inventory is pinned.
export async function providerSettingsGuideFlow(page) {
  const settingsUrl = page.url();
  const destinations = [];
  for (const name of ['Email delivery', 'SMS delivery']) {
    destinations.push(...await page.getByRole('region', { name, exact: true })
      .getByRole('link').evaluateAll(links => links.map(link => link.href)));
  }
  assert.ok(destinations.length >= 2, 'both provider cards offer setup destinations');
  for (const destination of new Set(destinations)) {
    const url = new URL(destination);
    assert.equal(url.origin, new URL(settingsUrl).origin, 'setup guidance stays on this installation');
    assert.ok(url.hash, 'provider guidance points to a section');
    const response = await page.goto(destination);
    assert.equal(response?.status() ?? (await page.request.get(destination)).status(), 200, 'the published setup guide is reachable');
    await page.locator(`[id="${decodeURIComponent(url.hash.slice(1))}"]`).waitFor({ state: 'visible' });
    // Deployment steps linked from the provider guide must resolve too.
    const deployLinks = await page.locator('.docs-prose a[href*="/docs/deploy#"]')
      .evaluateAll(links => links.map(link => link.href));
    for (const deployLink of new Set(deployLinks)) {
      const response = await page.goto(deployLink);
      assert.equal(response?.status() ?? (await page.request.get(deployLink)).status(), 200);
      await page.locator(`[id="${new URL(deployLink).hash.slice(1)}"]`).waitFor({ state: 'visible' });
    }
  }
  await page.goto(settingsUrl);
}
