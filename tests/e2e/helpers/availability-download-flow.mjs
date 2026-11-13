import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { operatorHydrated } from './operator-hydrated.mjs';

// Extend the existing component History journey through both real download buttons.
export async function availabilityDownloadFlow({ page, drawer, component, api, context, origin }) {
  const duplicate = (await api('/api/app/components', 'POST', { groupId: null, name: component.name, description: '', internal: false, displayOrder: 201, note: '' })).component;
  const filenames = [];
  for (const target of [component, duplicate]) {
    if (target !== component) {
      await page.goto(`${origin}/app/components`); await operatorHydrated(page);
      await page.locator('.component-row').filter({ hasText: component.name }).last().getByRole('button', { name: component.name }).click();
      await drawer.getByRole('button', { name: 'History', exact: true }).click();
    }
    await drawer.getByLabel('Month', { exact: true }).fill('2026-11');
    for (const format of ['csv', 'pdf']) {
      const downloading = page.waitForEvent('download');
      await drawer.getByRole('button', { name: `Download ${format.toUpperCase()}`, exact: true }).click();
      const download = await downloading;
      const filename = download.suggestedFilename();
      assert.ok(filename.includes('configured-zone-service'), 'the suggested name identifies the selected component');
      assert.ok(!filename.includes(target.id), 'the download name carries no opaque component ID');
      assert.match(filename, new RegExp(`^availability-[a-z0-9-]+-2026-11\\.${format}$`), 'the filename is short and file-safe');
      const response = await context.request.get(`${origin}/api/app/availability-report?component=${target.id}&month=2026-11&format=${format}`);
      assert.equal(response.status(), 200);
      assert.equal(response.headers()['content-disposition'], `attachment; filename="${filename}"`, 'browser and direct downloads use the same name');
      filenames.push(filename);
      await download.delete();
    }
    if (target === component && process.env.LAMP_AVAILABILITY_SCREENSHOTS) {
      await mkdir(process.env.LAMP_AVAILABILITY_SCREENSHOTS, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.screenshot({ path: join(process.env.LAMP_AVAILABILITY_SCREENSHOTS, `availability-history-${width}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
  assert.equal(new Set(filenames).size, filenames.length, 'same-named components have distinct CSV and PDF download names');
  assert.equal((await context.request.delete(`${origin}/api/app/components/${duplicate.id}`, { headers: { Origin: origin } })).status(), 204);
  await page.goto(`${origin}/app/components`); await operatorHydrated(page);
  await page.locator('.component-row').filter({ hasText: component.name }).first().getByRole('button', { name: component.name }).click();
  await drawer.getByRole('button', { name: 'History', exact: true }).click();
}
