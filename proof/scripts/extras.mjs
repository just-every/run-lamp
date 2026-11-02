// usage: node extras.mjs <outDir> [log] [base] — in-page hover/focus timing and Tab passes over Settings (1440) and the drawer (390).
import fs from 'node:fs';
import path from 'node:path';
import { BASE as DEFAULT_BASE, VIEWS, launch, signedInContext } from './lib.mjs';
const [outDir, log = '/Users/zemaj/www/rer-consolidation/work/uip-lamp-l20-tooltips-1/demo-before.log', base = DEFAULT_BASE] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const out = [];
const rec = (id, pass, detail) => { out.push({ id, pass, detail }); console.log(pass ? 'PASS' : 'FAIL', id, detail); };
const browser = await launch();
{
  const { context, page } = await signedInContext(browser, VIEWS.desktop, log);
  await page.goto(base + '/app/components', { waitUntil: 'load' }); await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Add component', exact: true }).first().click(); await page.locator('dialog[open]').waitFor();
  const b = await page.getByRole('button', { name: 'Close panel', exact: true }).boundingBox();
  await page.evaluate(() => {
    const tip = document.querySelector('.ui-tooltip'); window.__t = {};
    document.addEventListener('pointerover', e => { if (e.target.closest?.('[data-tooltip]')) window.__t.over = performance.now(); }, true);
    document.addEventListener('focusin', e => { if (e.target.closest?.('[data-tooltip]')) window.__t.focus = performance.now(); }, true);
    new MutationObserver(() => { if (tip.hasAttribute('data-open')) (window.__t.open ??= []).push(performance.now()); }).observe(tip, { attributes: true, attributeFilter: ['data-open'] });
  });
  await page.mouse.move(5, 5); await page.waitForTimeout(500);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(700);
  const t = await page.evaluate(() => window.__t);
  const delay = t.open?.[0] - t.over;
  rec('hover delay is about 300 ms', delay >= 280 && delay <= 380, `${Math.round(delay)} ms from pointerover to open`);
  await page.mouse.move(5, 5); await page.waitForTimeout(500);
  await page.evaluate(() => { window.__t = {}; document.querySelector('dialog[open] input').focus(); });
  await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(150);
  const f = await page.evaluate(() => window.__t);
  const fd = f.open?.[0] - f.focus;
  rec('keyboard focus shows it at once', fd <= 60, `${Math.round(fd)} ms from focus to open`);
  await context.close();
}
{
  const { context, page } = await signedInContext(browser, VIEWS.desktop, log);
  await page.goto(base + '/app/settings#look', { waitUntil: 'load' }); await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
  await page.evaluate(() => document.querySelector('.operator-main h1, .operator-main h2')?.setAttribute('tabindex', '-1'));
  await page.evaluate(() => document.querySelector('.operator-main h1, .operator-main h2')?.focus());
  const stops = [];
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(50);
    const s = await page.evaluate(() => { const a = document.activeElement; const tip = document.querySelector('.ui-tooltip'); return { tag: a?.tagName.toLowerCase(), type: a?.type, name: a?.getAttribute('aria-label') || a?.textContent?.trim().slice(0, 30), marked: a?.hasAttribute('data-tooltip'), tip: tip.matches(':popover-open') ? tip.textContent : null }; });
    stops.push(s); if (s.tag === 'body') break;
  }
  fs.writeFileSync(path.join(outDir, 'desktop-tab-settings-look.json'), JSON.stringify(stops, null, 1));
  const marked = stops.filter(s => s.marked);
  rec('Tab through Settings Look: every picker shows its tooltip on focus', marked.length >= 1 && marked.every(s => s.tip === s.name), `${stops.length} stops, ${marked.length} icon-only: ${marked.map(s => s.tip).join(' | ')}`);
  rec('Tab through Settings Look: other stops show no tooltip', stops.filter(s => !s.marked).every(s => s.tip === null), '');
  await context.close();
}
{
  const { context, page } = await signedInContext(browser, VIEWS.phone, log);
  await page.goto(base + '/app/components', { waitUntil: 'load' }); await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Add component', exact: true }).first().click(); await page.locator('dialog[open]').waitFor();
  const stops = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(220);
    const s = await page.evaluate(() => { const a = document.activeElement; const tip = document.querySelector('.ui-tooltip'); const r = tip.getBoundingClientRect(); return { r: [r.left, r.top, r.right, r.bottom].map(Math.round), name: a?.getAttribute('aria-label') || a?.textContent?.trim().slice(0, 30), marked: a?.hasAttribute('data-tooltip'), tip: tip.matches(':popover-open') ? tip.textContent : null, inside: tip.matches(':popover-open') ? r.left >= 7.5 && r.right <= innerWidth - 7.5 && r.top >= 7.5 && r.bottom <= innerHeight - 7.5 : null }; });
    stops.push(s);
  }
  const marked = stops.filter(s => s.marked);
  rec('Tab through the drawer at 390: close shows its tooltip, clear of edges', marked.length >= 1 && marked.every(s => s.tip === s.name && s.inside), JSON.stringify(marked));
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'extras-checks.json'), JSON.stringify(out, null, 1));
process.exit(out.every(c => c.pass) ? 0 : 1);
