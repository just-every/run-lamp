import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function captureSetupScreen(page, name) {
  const directory = process.env.LAMP_SETUP_SCREENSHOTS;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  const viewport = page.viewportSize();
  try {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.screenshot({ path: join(directory, `${name}-${width}.png`), fullPage: true });
    }
  } finally { await page.setViewportSize(viewport); }
}

const logo = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="140" viewBox="0 0 480 140"><rect width="480" height="140" fill="#123456"/><text x="22" y="90" fill="white" font-size="48">Brightwell</text></svg>';
const icon = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#123456"/><text x="30" y="90" fill="white" font-size="80">B</text></svg>';

export async function chooseSetupBranding(page) {
  await page.getByRole('button', { name: 'Edit logo', exact: true }).click();
  await page.getByLabel('Logo', { exact: true }).setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(logo) });
  await page.getByRole('button', { name: 'Done editing logo', exact: true }).click();
  await page.getByRole('button', { name: 'Edit square icon', exact: true }).click();
  await page.getByLabel('Square icon', { exact: true }).setInputFiles({ name: 'icon.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(icon) });
  await page.getByRole('button', { name: 'Done editing square icon', exact: true }).click();
}

export async function checkPublishedBranding(context, publicOrigin) {
  const reader = await context.newPage();
  try {
    await reader.goto(publicOrigin);
    const image = reader.locator('.brand-logo');
    await image.waitFor();
    const ratio = await image.evaluate(async element => { await element.decode(); const box = element.getBoundingClientRect(); return { natural: element.naturalWidth / element.naturalHeight, shown: box.width / box.height }; });
    assert.ok(Math.abs(ratio.natural - 480 / 140) < 0.02);
    assert.ok(Math.abs(ratio.shown - ratio.natural) < 0.02, 'public logo keeps its source ratio');
    await captureSetupScreen(reader, 'public-branding');
    const favicon = await reader.request.get(new URL('/assets/favicon.svg', publicOrigin).href);
    assert.match(await favicon.text(), /data:image\/png;base64,/, 'the separately chosen icon reaches the public tab');
  } finally { await reader.close(); }
}

export async function renamePage(page, origin) {
  await page.goto(origin + '/app/settings#page');
  await page.locator('.settings-page:not([inert])').waitFor();
  const renamed = page.waitForResponse(response => response.url().endsWith('/api/app/page-settings') && response.request().method() === 'PUT');
  await page.getByLabel('Page name', { exact: true }).fill('Brightwell Support');
  assert.equal((await renamed).status(), 200);
  await page.waitForFunction(() => document.querySelector('.app-brand span')?.textContent === 'Brightwell Support');
  assert.equal(await page.title(), 'Brightwell Support · Lamp');
  await page.reload();
  assert.equal(await page.getByLabel('Page name', { exact: true }).inputValue(), 'Brightwell Support');
  assert.match(await page.getByRole('combobox', { name: 'Time zone', exact: true }).inputValue(), /Toronto/);
  await captureSetupScreen(page, 'settings-page');
}

export async function scheduleLocalMaintenance(page, origin, context, publicOrigin) {
  await page.goto(origin + '/app/maintenance');
  await page.locator('.operator-shell[data-hydrated]').waitFor();
  const form = page.locator('.maintenance-schedule-card');
  const zoneLink = form.getByRole('link', { name: /Times in Toronto time/ });
  assert.equal(await zoneLink.getAttribute('href'), '/app/settings#page-timezone');
  await zoneLink.click();
  await page.locator('.settings-page:not([inert])').waitFor();
  await page.getByRole('combobox', { name: 'Time zone', exact: true }).waitFor();
  await page.goBack();
  await page.locator('.operator-shell[data-hydrated]').waitFor();
  await form.getByLabel('Title', { exact: true }).fill('Brightwell portal upgrade');
  await form.getByLabel('Affected audience', { exact: true }).fill('Customers using the portal');
  await form.getByLabel('Customer impact', { exact: true }).fill('The portal is unavailable during this work.');
  await form.getByRole('checkbox').first().check();
  await form.getByLabel('Starts', { exact: true }).fill('2027-01-18T22:00');
  await form.getByLabel('Ends', { exact: true }).fill('2027-01-18T23:00');
  await captureSetupScreen(page, 'maintenance-local-time');
  const created = page.waitForResponse(response => response.url().endsWith('/api/app/maintenance') && response.request().method() === 'POST');
  await form.getByRole('button', { name: 'Schedule window', exact: true }).click();
  const { maintenance } = await (await created).json();
  assert.equal(maintenance.startsAt, '2027-01-19T03:00:00.000Z');
  assert.equal(maintenance.endsAt, '2027-01-19T04:00:00.000Z');
  const reader = await context.newPage();
  try {
    await reader.goto(publicOrigin + '/maintenance/' + maintenance.reference);
    const visible = await reader.locator('.maintenance-window').innerText();
    assert.match(visible, /10:00 PM.*11:00 PM Toronto time/);
    const details = reader.locator('article.maintenance > .time-details');
    await details.locator('summary').click();
    assert.match(await details.innerText(), /22:00 UTC-05:00.*23:00 UTC-05:00/s);
  } finally { await reader.close(); }
}
