// usage: node states.mjs <label> <outDir> [log] [base]
// Walks every operator state that holds an icon-only control (menus, drawers, sheets, chips, every Settings pane with its
// sections open) at 1440x900 and 390x844, records each state's icon-only controls and takes a screenshot.
import fs from 'node:fs';
import path from 'node:path';
import { BASE as DEFAULT_BASE, VIEWS, launch, signedInContext, inventoryFn } from './lib.mjs';
const [label, outDir, log = '/Users/zemaj/www/rer-consolidation/work/uip-lamp-l20-tooltips-1/demo-before.log', base = DEFAULT_BASE] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const SETTINGS = ['page','look','notifications','writing','templates','tools','embeds','operators','sign-in','reports','export','audit'];
const browser = await launch();
const result = { label, base, views: {} };
try {
  for (const [view, viewport] of Object.entries(VIEWS)) {
    const { context, page } = await signedInContext(browser, viewport, log);
    const states = [];
    const state = async (name, go, { shot = false } = {}) => {
      const entry = { name };
      try {
        await go?.();
        await page.waitForTimeout(500);
        Object.assign(entry, await page.evaluate(inventoryFn));
        if (shot) await page.screenshot({ path: path.join(outDir, `${view}-${name}.png`) });
      } catch (error) { entry.error = String(error).slice(0, 240); }
      states.push(entry);
    };
    const open = async route => { await page.goto(base + route, { waitUntil: 'load' }); await page.waitForTimeout(1200); };
    const openDetails = () => page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));

    await state('shell', () => open('/app'), { shot: true });
    if (view === 'phone') await state('shell-menu-open', async () => { await page.getByRole('button', { name: 'Menu', exact: true }).click(); }, { shot: true });
    await state('settings-rail', () => open('/app/settings#page'));
    if (view === 'phone') await state('settings-menu-open', async () => { await page.locator('.settings-pill').click(); });

    // Incident composer: a chip (its remove ×), the + menu (desktop) or sheet (phone).
    await state('incident-new-chip', async () => {
      await open('/app/incidents/new');
      const add = page.locator('select.add-component').first();
      await add.selectOption({ index: 1 });
    }, { shot: true });
    await state('incident-new-options', async () => { await page.getByRole('button', { name: 'Update options', exact: true }).click(); }, { shot: true });
    await page.keyboard.press('Escape');

    // Incident detail.
    await open('/app/incidents');
    const hrefs = await page.$$eval('a[href^="/app/incidents/"]', as => [...new Set(as.map(a => a.getAttribute('href')))].filter(h => !h.endsWith('/new')));
    for (const [index, href] of hrefs.slice(0, 2).entries()) {
      await state(`incident-detail-${index + 1}`, () => open(href), { shot: index === 0 });
      const plus = page.getByRole('button', { name: 'Update options', exact: true });
      if (await plus.count()) await state(`incident-detail-${index + 1}-options`, async () => { await plus.click(); });
      await page.keyboard.press('Escape');
    }

    // Components: new-component drawer, a component's drawer, the catalogue drawer.
    await state('components', () => open('/app/components'));
    await state('component-add-drawer', async () => { await page.getByRole('button', { name: 'Add component', exact: true }).first().click(); await page.locator('dialog[open]').waitFor(); }, { shot: true });
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    await state('component-drawer', async () => { await open('/app/components'); await page.locator('main button, main a').filter({ hasText: 'API' }).first().click(); await page.locator('dialog[open]').waitFor(); }, { shot: true });
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    await state('component-catalogue-drawer', async () => { await open('/app/components'); await page.getByRole('button', { name: 'Edit all', exact: true }).click(); await page.locator('dialog[open]').waitFor(); }, { shot: true });
    await page.keyboard.press('Escape');

    for (const route of ['/app/maintenance', '/app/subscribers', '/app/subscribers?view=log', '/app/move-in', '/app/cutover', '/app/alerts', '/app/page']) {
      await state(route.replace(/[^a-z]+/gi, '-').replace(/^-|-$/g, ''), async () => { await open(route); await openDetails(); });
    }
    for (const pane of SETTINGS) {
      await state(`settings-${pane}`, async () => { await open('/app/settings#' + pane); await openDetails(); await page.waitForTimeout(400); await openDetails(); }, { shot: ['look', 'embeds', 'page'].includes(pane) });
    }
    // The custom palette's pickers exist once its box is ticked; tick it for the inventory and put it back.
    await state('settings-look-palette', async () => {
      await open('/app/settings#look'); await openDetails();
      await page.getByLabel('Use a custom colour palette').check(); await page.waitForTimeout(600);
    }, { shot: true });
    await page.getByLabel('Use a custom colour palette').uncheck().catch(() => {}); await page.waitForTimeout(800);
    result.views[view] = states;
    await context.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(outDir, `states-${label}.json`), JSON.stringify(result, null, 1));
const flat = Object.entries(result.views).flatMap(([v, rows]) => rows.flatMap(r => (r.controls || []).map(c => ({ v, state: r.name, ...c }))));
const errors = Object.entries(result.views).flatMap(([v, rows]) => rows.filter(r => r.error).map(r => `${v}/${r.name}: ${r.error}`));
console.log('states', Object.values(result.views).map(r => r.length).join('/'), 'icon-only controls', flat.length, 'without tooltip', flat.filter(c => !c.tooltip).length, 'native titles', Object.values(result.views).flat().reduce((n, r) => n + (r.titles?.length || 0), 0));
const uniq = new Map(flat.map(c => [c.ariaLabel + '|' + c.glyph + '|' + c.cls, c]));
for (const c of uniq.values()) console.log(c.tooltip ? 'OK  ' : 'MISS', c.tag, JSON.stringify(c.ariaLabel), 'desc=' + JSON.stringify(c.describedby), 'title=' + JSON.stringify(c.title), c.cls, '@', c.state);
if (errors.length) console.log('STATE ERRORS:\n' + errors.join('\n'));
