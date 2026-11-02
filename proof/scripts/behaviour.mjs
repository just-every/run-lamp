// usage: node behaviour.mjs <outDir> [log] [base]  — hover, focus, touch long press, tap, dismissal, edges, dialogs, 60 s refresh.
import fs from 'node:fs';
import path from 'node:path';
import { BASE as DEFAULT_BASE, VIEWS, launch, signedInContext } from './lib.mjs';
const [outDir, log = '/Users/zemaj/www/rer-consolidation/work/uip-lamp-l20-tooltips-1/demo-before.log', base = DEFAULT_BASE] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const checks = [];
const check = (view, id, pass, detail = '') => { checks.push({ view, id, pass: !!pass, detail }); console.log(pass ? 'PASS' : 'FAIL', view, id, detail); };
const tipOf = page => page.evaluate(() => {
  const tip = document.querySelector('.ui-tooltip');
  if (!tip || !tip.matches(':popover-open')) return null;
  const r = tip.getBoundingClientRect();
  return { text: tip.textContent, left: r.left, top: r.top, right: r.right, bottom: r.bottom, vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight, side: tip.dataset.side, tips: document.querySelectorAll('.ui-tooltip').length };
});
const inside = t => t && t.left >= 8 - 0.5 && t.top >= 8 - 0.5 && t.right <= t.vw - 8 + 0.5 && t.bottom <= t.vh - 8 + 0.5;
const settle = (page, ms) => page.waitForTimeout(ms);
const browser = await launch();
const pids = [];
try {
  // ---------------- desktop: mouse and keyboard ----------------
  {
    const view = 'desktop';
    const { context, page } = await signedInContext(browser, VIEWS.desktop, log);
    const open = async route => { await page.goto(base + route, { waitUntil: 'load' }); await page.waitForTimeout(1200); };
    const hover = async (locator) => { await locator.scrollIntoViewIfNeeded(); const b = await locator.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 }); return b; };
    const hoverProof = async (name, locator, label, shot) => {
      await page.mouse.move(5, 5); await settle(page, 450);
      const t0 = Date.now();
      await hover(locator);
      await settle(page, 120);
      const early = await tipOf(page);
      check(view, `${name}: hover shows nothing before the delay`, early === null);
      await page.waitForFunction(() => document.querySelector('.ui-tooltip')?.matches(':popover-open'), null, { timeout: 2000 });
      const shownAfter = Date.now() - t0;
      const t = await tipOf(page);
      check(view, `${name}: hover tooltip text equals accessible name`, t?.text === label && await locator.getAttribute('aria-label') === label, `text=${JSON.stringify(t?.text)} after~${shownAfter}ms`);
      check(view, `${name}: tooltip clear of viewport edges`, inside(t), JSON.stringify({ l: Math.round(t.left), t: Math.round(t.top), r: Math.round(t.right), b: Math.round(t.bottom), side: t.side }));
      check(view, `${name}: exactly one tooltip layer`, t.tips === 1);
      if (shot) await page.screenshot({ path: path.join(outDir, shot) });
      return t;
    };

    // Composer: chip ×, + menu.
    await open('/app/incidents/new');
    await page.locator('select.add-component').first().selectOption({ index: 1 });
    const chip = page.locator('.chip-remove').first();
    const marker = await page.evaluate(() => { const main = document.querySelector('.operator-main'); main.dataset.l20 = 'kept'; document.querySelector('input').focus(); return document.querySelectorAll('.ui-tooltip').length; });
    check(view, 'layer mounted once per document', marker === 1, `tooltip layers=${marker}`);
    await page.locator('input[placeholder="Title customers will see"]').fill('L20 draft title');
    await hoverProof('chip remove', chip, 'Remove component', 'desktop-hover-chip-remove.png');
    const described = await chip.evaluate(el => document.getElementById(el.getAttribute('aria-describedby'))?.textContent);
    check(view, 'chip remove keeps row context as accessible description', !!described && described !== 'Remove component', `description=${JSON.stringify(described)}`);
    check(view, 'no native title on tooltip controls', await page.evaluate(() => [...document.querySelectorAll('[data-tooltip][title]')].length === 0));
    await page.keyboard.press('Escape'); await settle(page, 80);
    check(view, 'Escape dismisses hover tooltip', await tipOf(page) === null);
    await page.mouse.move(5, 5); await settle(page, 450);
    await hoverProof('chip remove (again)', chip, 'Remove component');
    await page.mouse.move(5, 5); await settle(page, 120);
    check(view, 'leaving the control dismisses it', await tipOf(page) === null);
    await hover(chip); await settle(page, 450);
    await page.mouse.wheel(0, 120); await settle(page, 200);
    const afterScroll = await tipOf(page);
    const pageScrolls = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight);
    check(view, 'scroll dismisses the tooltip', afterScroll === null || !pageScrolls, `pageScrolls=${pageScrolls}`);
    // Scroll dismissal needs a scrollable page: prove on a tall one below (settings) as well.
    const plus = page.getByRole('button', { name: 'Update options', exact: true });
    await hoverProof('update options +', plus, 'Update options', 'desktop-hover-update-options.png');
    await plus.click(); await settle(page, 200);
    check(view, 'ordinary click still acts (menu opens)', await plus.getAttribute('aria-expanded') === 'true' && await page.locator('.update-options-menu').count() === 1);
    check(view, 'press hides the tooltip', await tipOf(page) === null);
    await page.screenshot({ path: path.join(outDir, 'desktop-menu-open-after-click.png') });
    await page.keyboard.press('Escape');
    check(view, 'form input and value survive tooltips', await page.locator('input[placeholder="Title customers will see"]').inputValue() === 'L20 draft title' && await page.evaluate(() => document.querySelector('.operator-main').dataset.l20 === 'kept'));

    // Keyboard: Tab through the composer; each icon-only stop shows its tooltip at once, with its accessible name.
    await open('/app/incidents/new');
    await page.locator('select.add-component').first().selectOption({ index: 1 });
    await page.locator('input[placeholder="Title customers will see"]').focus();
    const stops = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      await settle(page, 60);
      const s = await page.evaluate(() => { const a = document.activeElement; return { tag: a?.tagName.toLowerCase(), name: a?.getAttribute('aria-label') || a?.textContent?.trim().slice(0, 30), marked: a?.hasAttribute('data-tooltip') || false, cls: String(a?.className || '').slice(0, 30) }; });
      const t = s.marked ? await tipOf(page) : null;
      stops.push({ ...s, tooltip: t?.text ?? null, inside: s.marked ? inside(t) : null });
      if (s.tag === 'body') break;
    }
    fs.writeFileSync(path.join(outDir, 'desktop-tab-composer.json'), JSON.stringify(stops, null, 1));
    const marked = stops.filter(s => s.marked);
    check(view, 'Tab: every icon-only stop shows its tooltip on focus with its name', marked.length >= 2 && marked.every(s => s.tooltip === s.name && s.inside), marked.map(s => s.tooltip).join(' | '));
    await page.screenshot({ path: path.join(outDir, 'desktop-focus-tooltip.png') });
    await page.keyboard.press('Tab'); await settle(page, 60);
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab'); await settle(page, 60);

    // Drawer (modal dialog): tooltip above the dialog, clear of edges.
    await open('/app/components');
    await page.getByRole('button', { name: 'Add component', exact: true }).first().click();
    await page.locator('dialog[open]').waitFor();
    const close = page.getByRole('button', { name: 'Close panel', exact: true });
    const t = await hoverProof('drawer close', close, 'Close panel', 'desktop-hover-drawer-close.png');
    const topLayer = await page.evaluate(() => document.querySelector('.ui-tooltip').matches(':popover-open') && document.querySelector('dialog[open]').matches(':modal'));
    check(view, 'tooltip shows over a modal dialog (top layer)', topLayer);
    await page.keyboard.press('Escape'); await settle(page, 400);
    await open('/app/components');
    await page.getByRole('button', { name: 'Add component', exact: true }).first().click();
    await page.locator('dialog[open]').waitFor();
    await page.locator('dialog[open] input').first().focus();
    await page.keyboard.press('Shift+Tab'); await settle(page, 80);
    const focusTip = await tipOf(page);
    check(view, 'drawer close: focus shows tooltip at once', focusTip?.text === 'Close panel', JSON.stringify(focusTip?.text));
    await page.keyboard.press('Enter'); await settle(page, 500);
    check(view, 'drawer close: keyboard activation still acts', await page.locator('dialog[open]').count() === 0);

    // Colour picker on Settings (a tall page: scroll dismissal too).
    await open('/app/settings#look');
    const picker = page.locator('input[type=color][aria-label="Pick accent colour"]').first();
    await hoverProof('accent picker (Settings)', picker, 'Pick accent colour', 'desktop-hover-accent-picker.png');
    await page.evaluate(() => { const s = document.createElement('div'); s.style.height = '3000px'; s.id = 'l20-spacer'; document.querySelector('.operator-main').append(s); });
    await page.mouse.move(5, 5); await settle(page, 450);
    await hover(picker); await page.waitForFunction(() => document.querySelector('.ui-tooltip')?.matches(':popover-open'), null, { timeout: 2000 });
    await page.evaluate(() => window.scrollBy(0, 200)); await settle(page, 150);
    check(view, 'scroll dismisses the tooltip (tall page)', await tipOf(page) === null);
    await page.evaluate(() => { document.getElementById('l20-spacer')?.remove(); window.scrollTo(0, 0); });

    // Shadow-root launcher: the real editor module, loopback config, no management server.
    await open('/app');
    const shadow = await page.evaluate(async (origin) => {
      const mod = await import(`${origin}/src/editor/editor-widget.ts`);
      const stop = mod.mountEditor({ enabled: true, managementOrigin: 'http://127.0.0.1:9', installationId: 'l20-proof' }, true);
      window.__l20stop = stop;
      const host = document.querySelector('[data-rer-editor]');
      const launcher = host.shadowRoot.querySelector('button');
      return { label: launcher.getAttribute('aria-label'), marked: launcher.hasAttribute('data-tooltip'), title: launcher.getAttribute('title'), tips: host.shadowRoot.querySelectorAll('.ui-tooltip').length, style: !!host.shadowRoot.querySelector('style') };
    }, base);
    check(view, 'editor launcher (shadow root): name, marker, no native title, one layer', shadow.label === 'Open Run Edit Run' && shadow.marked && !shadow.title && shadow.tips === 1 && shadow.style, JSON.stringify(shadow));
    const launcherBox = await page.evaluate(() => { const b = document.querySelector('[data-rer-editor]').shadowRoot.querySelector('button').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.move(launcherBox.x, launcherBox.y, { steps: 3 }); await settle(page, 500);
    const shTip = await page.evaluate(() => { const t = document.querySelector('[data-rer-editor]').shadowRoot.querySelector('.ui-tooltip'); if (!t?.matches(':popover-open')) return null; const r = t.getBoundingClientRect(); return { text: t.textContent, left: r.left, top: r.top, right: r.right, bottom: r.bottom, vw: innerWidth, vh: innerHeight }; });
    check(view, 'editor launcher: hover tooltip in shadow root, clear of edges', shTip?.text === 'Open Run Edit Run' && inside(shTip), JSON.stringify(shTip));
    await page.screenshot({ path: path.join(outDir, 'desktop-hover-editor-launcher.png') });
    await page.evaluate(() => window.__l20stop());
    check(view, 'editor launcher teardown removes its layer and host', await page.evaluate(() => !document.querySelector('[data-rer-editor]')));
    await context.close();
  }

  // ---------------- phone: touch long press and tap ----------------
  {
    const view = 'phone';
    const { context, page } = await signedInContext(browser, VIEWS.phone, log, { hasTouch: true, isMobile: true });
    const cdp = await context.newCDPSession(page);
    const touch = async (x, y, holdMs) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      await page.waitForTimeout(holdMs);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    const centre = async locator => { await locator.scrollIntoViewIfNeeded(); const b = await locator.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
    const open = async route => { await page.goto(base + route, { waitUntil: 'load' }); await page.waitForTimeout(1200); };

    await open('/app/incidents/new');
    await page.locator('select.add-component').first().selectOption({ index: 1 });
    const chip = page.locator('.chip-remove').first();
    let c = await centre(chip);
    await touch(c.x, c.y, 800); await settle(page, 100);
    let t = await tipOf(page);
    check(view, 'chip remove: long press shows tooltip', t?.text === 'Remove component' && inside(t), JSON.stringify(t && { text: t.text, l: Math.round(t.left), r: Math.round(t.right), t: Math.round(t.top), b: Math.round(t.bottom), side: t.side }));
    await page.screenshot({ path: path.join(outDir, 'phone-longpress-chip-remove.png') });
    await settle(page, 1800);
    check(view, 'long press tooltip clears itself', await tipOf(page) === null);
    check(view, 'long press did not act (chip still there)', await page.locator('.chip-remove').count() === 1);

    const plus = page.getByRole('button', { name: 'Update options', exact: true });
    c = await centre(plus);
    await touch(c.x, c.y, 800); await settle(page, 100);
    t = await tipOf(page);
    check(view, 'update options +: long press shows tooltip, does not open the sheet', t?.text === 'Update options' && await page.locator('dialog[open]').count() === 0 && await plus.getAttribute('aria-expanded') === 'false', JSON.stringify(t?.text));
    await settle(page, 1800);
    await plus.tap(); await settle(page, 400);
    check(view, 'update options +: ordinary tap still acts (sheet opens)', await page.locator('dialog[open]').count() === 1);
    const sheetClose = page.getByRole('button', { name: 'Close options', exact: true });
    c = await centre(sheetClose);
    await touch(c.x, c.y, 800); await settle(page, 100);
    t = await tipOf(page);
    check(view, 'sheet close: long press shows tooltip above the modal sheet, clear of edges', t?.text === 'Close options' && inside(t) && await page.locator('dialog[open]').count() === 1, JSON.stringify(t && { l: Math.round(t.left), r: Math.round(t.right), t: Math.round(t.top), b: Math.round(t.bottom), side: t.side }));
    await page.screenshot({ path: path.join(outDir, 'phone-longpress-sheet-close.png') });
    await settle(page, 1800);
    await sheetClose.tap(); await settle(page, 400);
    check(view, 'sheet close: ordinary tap still acts', await page.locator('dialog[open]').count() === 0);

    await open('/app/components');
    await page.getByRole('button', { name: 'Add component', exact: true }).first().tap(); await page.locator('dialog[open]').waitFor();
    const close = page.getByRole('button', { name: 'Close panel', exact: true });
    c = await centre(close);
    await touch(c.x, c.y, 800); await settle(page, 100);
    t = await tipOf(page);
    check(view, 'drawer close: long press shows tooltip, drawer stays', t?.text === 'Close panel' && inside(t) && await page.locator('dialog[open]').count() === 1, JSON.stringify(t && { l: Math.round(t.left), r: Math.round(t.right), side: t.side }));
    await page.screenshot({ path: path.join(outDir, 'phone-longpress-drawer-close.png') });
    await settle(page, 1800);
    await close.tap(); await settle(page, 500);
    check(view, 'drawer close: ordinary tap still acts', await page.locator('dialog[open]').count() === 0);

    await open('/app/settings#look');
    const picker = page.locator('input[type=color][aria-label="Pick accent colour"]').first();
    c = await centre(picker);
    await touch(c.x, c.y, 800); await settle(page, 100);
    t = await tipOf(page);
    check(view, 'accent picker: long press shows tooltip', t?.text === 'Pick accent colour' && inside(t), JSON.stringify(t && { l: Math.round(t.left), r: Math.round(t.right), side: t.side }));
    await page.screenshot({ path: path.join(outDir, 'phone-longpress-accent-picker.png') });
    await context.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(outDir, 'behaviour-checks.json'), JSON.stringify(checks, null, 1));
const failed = checks.filter(c => !c.pass);
console.log(`checks ${checks.length} failed ${failed.length}`);
process.exit(failed.length ? 1 : 0);
