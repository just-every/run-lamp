import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { operatorHydrated } from './operator-hydrated.mjs';

/** Invalid colour text stays editable without changing the saved public colour. */
export async function accentColourFlow({ page, origin, capture = async () => {} }) {
  await page.goto(origin + '/app/settings#look'); await operatorHydrated(page);
  const current = (await (await page.request.get(origin + '/api/app/page-settings')).json()).settings;
  const field = page.getByLabel('Accent colour', { exact: true });
  const picker = page.getByLabel('Pick accent colour', { exact: true });
  await field.fill('navy blue'); await field.blur();
  // Let ordinary autosave validation settle before checking its recovery controls.
  await page.waitForTimeout(900);
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#accent-colour-error')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
  await expect(picker).toHaveValue(current.accentColor.toLowerCase());
  assert.equal((await (await page.request.get(origin + '/api/app/page-settings')).json()).settings.accentColor, current.accentColor);
  await capture(page, 'accent-invalid');
  const response = page.waitForResponse(response => new URL(response.url()).pathname === '/api/app/page-settings' && response.request().method() === 'PUT');
  await field.fill('#1F3A5F'); await field.blur();
  assert.equal((await response).status(), 200);
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#accent-colour-error')).toHaveCount(0);
  await expect(picker).toHaveValue('#1f3a5f');
  await page.reload(); await operatorHydrated(page);
  await expect(field).toHaveValue('#1F3A5F');
  assert.equal((await (await page.request.get(origin + '/api/app/page-settings')).json()).settings.accentColor, '#1F3A5F', 'correcting the field saves and survives reload');
  // The picker is the other ordinary way out of an invalid text edit.
  await field.fill('navy blue'); await field.blur();
  const picked = page.waitForResponse(response => new URL(response.url()).pathname === '/api/app/page-settings' && response.request().method() === 'PUT');
  await picker.fill(current.accentColor);
  assert.equal((await picked).status(), 200);
  await expect(field).toHaveValue(current.accentColor.toUpperCase());
  await expect(page.locator('#accent-colour-error')).toHaveCount(0);
  await capture(page, 'accent-corrected');
}
