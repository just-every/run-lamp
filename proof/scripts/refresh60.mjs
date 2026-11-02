// usage: node refresh60.mjs <outDir> [log] [base] — holds a menu open and the scroll steady for 60 s of background refresh, at both widths in parallel.
import fs from 'node:fs';
import path from 'node:path';
import { BASE as DEFAULT_BASE, VIEWS, launch, signedInContext } from './lib.mjs';
const [outDir, log = '/Users/zemaj/www/rer-consolidation/work/uip-lamp-l20-tooltips-1/demo-before.log', base = DEFAULT_BASE] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await launch();
const results = [];
async function run(view) {
  const { context, page } = await signedInContext(browser, VIEWS[view], log);
  let apiRequests = 0;
  page.on('request', r => { if (r.url().includes('/api/app/')) apiRequests++; });
  await page.goto(base + '/app/incidents', { waitUntil: 'load' }); await page.waitForTimeout(1000);
  const href = (await page.$$eval('a[href^="/app/incidents/"]', as => as.map(a => a.getAttribute('href')).filter(h => !h.endsWith('/new'))))[0];
  await page.goto(base + href, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  let menu;
  if (view === 'desktop') {
    await page.getByRole('button', { name: 'Update options', exact: true }).click();
    menu = '.update-options-menu';
  } else {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    menu = '.operator-navigation-panel.is-open';
  }
  await page.waitForSelector(menu);
  await page.evaluate(() => { window.scrollTo(0, 220); const m = document.querySelector('.operator-main'); m.dataset.l20 = 'kept'; });
  await page.waitForTimeout(500);
  const start = await page.evaluate(() => ({ y: Math.round(scrollY), h: document.documentElement.scrollHeight }));
  const samples = [];
  const startedAt = Date.now();
  const before = apiRequests;
  for (let i = 0; i <= 12; i++) {
    if (i > 0) await page.evaluate(() => window.dispatchEvent(new Event('lamp:page-settings-changed')));
    const s = await page.evaluate(sel => ({ menuOpen: !!document.querySelector(sel), y: Math.round(scrollY), kept: document.querySelector('.operator-main')?.dataset.l20 === 'kept', tips: document.querySelectorAll('.ui-tooltip').length, loading: !!document.querySelector('.app-state-loading') }), menu);
    samples.push({ t: Math.round((Date.now() - startedAt) / 1000), ...s });
    if (i < 12) await page.waitForTimeout(5000);
  }
  const refreshes = apiRequests - before;
  const steady = samples.every(s => s.menuOpen && s.y === start.y && s.kept && s.tips === 1 && !s.loading);
  results.push({ view, route: href, menu, durationS: Math.round((Date.now() - startedAt) / 1000), scrollStart: start, apiRequestsDuringHold: refreshes, samples: samples.length, steady });
  await page.screenshot({ path: path.join(outDir, `${view}-refresh-60s-end.png`) });
  await context.close();
}
try { await Promise.all([run('desktop'), run('phone')]); } finally { await browser.close(); }
fs.writeFileSync(path.join(outDir, 'refresh-60s.json'), JSON.stringify(results, null, 1));
for (const r of results) console.log(r.steady ? 'PASS' : 'FAIL', JSON.stringify(r));
process.exit(results.every(r => r.steady) ? 0 : 1);
