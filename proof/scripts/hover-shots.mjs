// usage: node hover-shots.mjs <label> <outDir> [log] [base] — the same hover (1440) and long-press (390) screenshots before and after.
import fs from 'node:fs';
import path from 'node:path';
import { BASE as DEFAULT_BASE, VIEWS, launch, signedInContext } from './lib.mjs';
const [label, outDir, log = '/Users/zemaj/www/rer-consolidation/work/uip-lamp-l20-tooltips-1/demo-before.log', base = DEFAULT_BASE] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await launch();
try {
  for (const view of ['desktop', 'phone']) {
    const phone = view === 'phone';
    const { context, page } = await signedInContext(browser, VIEWS[view], log, phone ? { hasTouch: true, isMobile: true } : {});
    const cdp = phone ? await context.newCDPSession(page) : null;
    const open = async route => { await page.goto(base + route, { waitUntil: 'load' }); await page.waitForTimeout(1200); };
    const point = async locator => { await locator.scrollIntoViewIfNeeded(); const b = await locator.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
    const rest = async (locator, name) => {
      const p = await point(locator);
      if (phone) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }); await page.waitForTimeout(900); }
      else { await page.mouse.move(5, 5); await page.waitForTimeout(400); await page.mouse.move(p.x, p.y, { steps: 4 }); await page.waitForTimeout(900); }
      await page.screenshot({ path: path.join(outDir, `${view}-${name}-${label}.png`) });
      if (phone) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    await open('/app/incidents/new');
    await page.locator('select.add-component').first().selectOption({ index: 1 });
    await rest(page.locator('.chip-remove').first(), 'chip-remove');
    await rest(page.getByRole('button', { name: /^Update options$/ }), 'update-options');
    await open('/app/components');
    await page.getByRole('button', { name: 'Add component', exact: true }).first().click(); await page.locator('dialog[open]').waitFor();
    await rest(page.getByRole('button', { name: 'Close panel', exact: true }), 'drawer-close');
    await page.keyboard.press('Escape');
    await open('/app/settings#look');
    await rest(page.locator('input[type=color]').first(), 'accent-picker');
    await context.close();
  }
} finally { await browser.close(); }
console.log('shots', fs.readdirSync(outDir).filter(f => f.endsWith(`-${label}.png`)).length);
