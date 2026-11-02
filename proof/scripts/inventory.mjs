// usage: node inventory.mjs <label> <out.json> [log]  — walks every operator route at both widths and lists icon-only controls.
import fs from 'node:fs';
import { BASE, VIEWS, launch, signedInContext, inventoryFn } from './lib.mjs';
const [label, out, log = '/Users/zemaj/www/rer-consolidation/work/uip-lamp-l20-tooltips-1/demo-before.log'] = process.argv.slice(2);
const SETTINGS = ['page','look','notifications','writing','templates','tools','embeds','operators','sign-in','reports','export','audit'];
const routes = ['/app','/app/incidents','/app/incidents/new','/app/components','/app/maintenance','/app/subscribers','/app/subscribers?view=log','/app/move-in','/app/cutover','/app/alerts','/app/page',...SETTINGS.map(s => '/app/settings#' + s)];
const browser = await launch();
const result = { label, base: BASE, views: {} };
try {
  for (const [name, viewport] of Object.entries(VIEWS)) {
    const { context, page } = await signedInContext(browser, viewport, log);
    const rows = [];
    const visit = async (route, prep) => {
      try {
        await page.goto(BASE + route, { waitUntil: 'load' });
        await page.waitForTimeout(1200);
        if (prep) await prep();
        const r = await page.evaluate(inventoryFn);
        rows.push({ route: route + (prep ? ' +' + prep.name : ''), ...r });
      } catch (e) { rows.push({ route, error: String(e).slice(0, 200) }); }
    };
    // Incident detail: first incident link on the list.
    await page.goto(BASE + '/app/incidents', { waitUntil: 'load' }); await page.waitForTimeout(1200);
    const hrefs = await page.$$eval('a[href^="/app/incidents/"]', as => [...new Set(as.map(a => a.getAttribute('href')))].filter(h => !h.endsWith('/new')));
    for (const route of routes) await visit(route);
    for (const h of hrefs.slice(0, 2)) await visit(h);
    if (name === 'phone') {
      await visit('/app', async function openMenu() { await page.getByRole('button', { name: 'Menu' }).click(); await page.waitForTimeout(400); });
    }
    result.views[name] = rows;
    await context.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(out, JSON.stringify(result, null, 1));
const flat = Object.entries(result.views).flatMap(([v, rows]) => rows.flatMap(r => (r.controls || []).map(c => ({ v, route: r.route, ...c }))));
console.log('routes', Object.values(result.views).map(r => r.length), 'icon-only controls', flat.length, 'without tooltip', flat.filter(c => !c.tooltip).length);
const uniq = new Map(flat.map(c => [c.ariaLabel + '|' + c.glyph + '|' + c.cls, c])); for (const c of uniq.values()) console.log(c.tooltip ? 'OK ' : 'MISS', c.tag, JSON.stringify(c.ariaLabel), JSON.stringify(c.glyph), 'title=' + JSON.stringify(c.title), c.cls, '@', c.route);
