// usage: node setup-proof.mjs <label> <outDir> — first-run setup of the isolated install: the accent picker at 1440 and 390.
import fs from 'node:fs';
import path from 'node:path';
import { VIEWS, launch, signedInContext, inventoryFn } from './lib.mjs';
const [label, outDir] = process.argv.slice(2);
const base = 'http://127.0.0.1:4941', log = '../dev-setup.log';
fs.mkdirSync(outDir, { recursive: true });
const results = [];
const browser = await launch();
const tipOf = page => page.evaluate(() => { const t = document.querySelector('.ui-tooltip'); if (!t?.matches(':popover-open')) return null; const r = t.getBoundingClientRect(); return { text: t.textContent, ok: r.left >= 7.5 && r.top >= 7.5 && r.right <= innerWidth - 7.5 && r.bottom <= innerHeight - 7.5 }; });
for (const view of ['desktop', 'phone']) {
  const phone = view === 'phone';
  const { context, page } = await signedInContext(browser, VIEWS[view], log, phone ? { hasTouch: true, isMobile: true } : {});
  const cdp = phone ? await context.newCDPSession(page) : null;
  await page.goto(base + '/setup', { waitUntil: 'load' }); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Skip, I.ll fill it in/ }).click(); await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, `${view}-setup-found-${label}.png`) });
  await page.locator('[data-found="accent colour"] .found-edit').click(); await page.waitForTimeout(500);
  const inv = await page.evaluate(inventoryFn);
  const picker = page.locator('input[type=color]').first();
  await picker.scrollIntoViewIfNeeded();
  const b = await picker.boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2;
  if (phone) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); await page.waitForTimeout(900); }
  else { await page.mouse.move(5, 5); await page.waitForTimeout(400); await page.mouse.move(x, y, { steps: 4 }); await page.waitForTimeout(900); }
  const tip = await tipOf(page);
  await page.screenshot({ path: path.join(outDir, `${view}-setup-accent-picker-${label}.png`) });
  if (phone) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  let focusTip = null;
  if (!phone) { await page.mouse.move(5, 5); await page.waitForTimeout(400); await page.evaluate(() => document.querySelector('input[type=color]').parentElement.querySelector('input:not([type=color])').focus()); await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(250); focusTip = await tipOf(page); }
  results.push({ view, label, iconOnly: inv.controls.map(c => ({ name: c.ariaLabel, tooltip: c.tooltip, title: c.title })), titles: inv.titles, tooltipShown: tip, focusTooltip: focusTip, pickerValue: await picker.inputValue() });
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, `setup-${label}.json`), JSON.stringify(results, null, 1));
for (const r of results) console.log(JSON.stringify(r));
