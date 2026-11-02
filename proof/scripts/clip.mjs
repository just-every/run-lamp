// usage: node clip.mjs <out.json> — for each tooltip control: ancestors that would clip or transform an ordinary child, and whether the tooltip still lies outside them.
import fs from 'node:fs';
import { BASE, VIEWS, launch, signedInContext } from './lib.mjs';
const browser = await launch();
const rows = [];
for (const view of ['desktop', 'phone']) {
  const { context, page } = await signedInContext(browser, VIEWS[view], '../demo-before.log');
  const probe = async (name, locator) => {
    await locator.scrollIntoViewIfNeeded(); const b = await locator.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 }); await page.waitForTimeout(700);
    rows.push({ view, name, ...(await page.evaluate(() => {
      const tip = document.querySelector('.ui-tooltip'); const open = tip.matches(':popover-open'); const tr = tip.getBoundingClientRect();
      const control = [...document.querySelectorAll('[data-tooltip]')].find(el => el.matches(':hover'));
      const clippers = []; for (let el = control?.parentElement; el; el = el.parentElement) { const s = getComputedStyle(el); if (/hidden|auto|scroll|clip/.test(s.overflow + s.overflowX + s.overflowY) || s.transform !== 'none' || s.contain.includes('paint')) { const r = el.getBoundingClientRect(); clippers.push({ el: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], overflow: s.overflow, transform: s.transform !== 'none', escapes: tr.top < r.top || tr.bottom > r.bottom || tr.left < r.left || tr.right > r.right }); } }
      return { open, inTopLayer: open && tip.matches(':popover-open'), clippers };
    })) });
    await page.mouse.move(5, 5); await page.waitForTimeout(350);
  };
  await page.goto(BASE + '/app/incidents/new', { waitUntil: 'load' }); await page.waitForTimeout(1200);
  await page.locator('select.add-component').first().waitFor({ timeout: 15000 }); await page.locator('select.add-component').first().selectOption({ index: 1 });
  await probe('chip remove', page.locator('.chip-remove').first());
  await probe('update options', page.getByRole('button', { name: /^Update options$/ }));
  await page.goto(BASE + '/app/components', { waitUntil: 'load' }); await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Add component', exact: true }).first().click(); await page.locator('dialog[open]').waitFor();
  await probe('drawer close', page.getByRole('button', { name: 'Close panel', exact: true }));
  await context.close();
}
await browser.close();
fs.writeFileSync(process.argv[2], JSON.stringify(rows, null, 1));
for (const r of rows) console.log(r.view, r.name, 'open=' + r.open, 'clipping/transformed ancestors=' + r.clippers.length, r.clippers.map(c => `${c.el}(${c.overflow}${c.transform ? ',transform' : ''}) tooltip-escapes=${c.escapes}`).join('; '));
