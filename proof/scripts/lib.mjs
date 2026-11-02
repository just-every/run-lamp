// Shared proof helpers: launch current headless Playwright (real HOME, mock keychain), sign in with the demo's one-click link.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = '/Users/zemaj/www/rer-consolidation/work/uip-lamp-l20-tooltips-1';
export const LAMP = path.join(ROOT, 'lamp');
const { chromium } = await import(path.join(LAMP, 'node_modules/playwright/index.mjs'));
export const BASE = process.env.PROOF_BASE || 'http://127.0.0.1:4931';
export const VIEWS = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
export function ownerLink(logFile) {
  const line = fs.readFileSync(logFile, 'utf8').split('\n').find(l => l.startsWith('RER_OPEN'));
  if (!line) throw new Error('no RER_OPEN in ' + logFile);
  return line.replace(/^RER_OPEN[ =]/, '').trim();
}
export async function launch() {
  return chromium.launch({ headless: true, args: ['--use-mock-keychain', '--password-store=basic'] });
}
export async function signedInContext(browser, viewport, logFile, extra = {}) {
  const context = await browser.newContext({ viewport, ...extra });
  const page = await context.newPage();
  await page.goto(ownerLink(logFile), { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  return { context, page };
}
// In-page: every rendered icon-only control (light DOM + open shadow roots), with its name, title and tooltip marker.
export const inventoryFn = () => {
  const out = [];
  const seen = new Set();
  const visible = el => { const r = el.getClientRects(); const s = getComputedStyle(el); return r.length > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const clip = el => { const s = getComputedStyle(el); return /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)|inset\(50%\)/.test(s.clip + s.clipPath) || (parseFloat(s.width) <= 1 && parseFloat(s.height) <= 1); };
  const visibleText = el => {
    let text = '';
    const walk = node => {
      if (node.nodeType === 3) { text += node.textContent; return; }
      if (node.nodeType !== 1) return;
      if (node.getAttribute('aria-hidden') === 'true' || node.hidden) return;
      if (node.tagName === 'svg' || node.tagName === 'SVG' || node.tagName === 'STYLE' || node.tagName === 'SCRIPT') return;
      if (node !== el && (clip(node) || /sr-only|visually-hidden/.test(node.className?.baseVal ?? node.className ?? ''))) return;
      node.childNodes.forEach(walk);
    };
    walk(el);
    return text.replace(/\s+/g, ' ').trim();
  };
  const sel = 'button, a[href], [role=button], [role=tab], [role=menuitem], [role=switch], summary, input[type=checkbox], input[type=radio], input[type=color], select, [onclick], [tabindex]:not([tabindex="-1"])';
  const scan = (root, where) => {
    root.querySelectorAll(sel).forEach(el => {
      if (seen.has(el) || el.matches('input:not([type=checkbox]):not([type=radio]):not([type=color])') ) return;
      seen.add(el);
      if (el.matches('[tabindex]') && !el.matches('button,a,[role=button],summary,input,select') ) return;
      const hiddenInput = el.matches('input[type=checkbox],input[type=radio]') && !visible(el);
      if (!visible(el) && !hiddenInput) return;
      let text = visibleText(el);
      if (el.matches('select')) return;
      if (el.matches('input[type=checkbox],input[type=radio],input[type=color]')) {
        const label = el.labels && el.labels[0];
        // A colour swatch is a picker with no text of its own, even inside a labelled field.
        text = label && !el.matches('input[type=color]') ? visibleText(label) : '';
        // Switch/checkbox rows whose label is text elsewhere are fine; icon-only means no visible text label at all.
        if (hiddenInput && !label) return;
      }
      const glyphOnly = text.length > 0 && !/[\p{L}\p{N}]/u.test(text);
      if (text && !glyphOnly) return;
      const r = el.getBoundingClientRect();
      const labelledby = el.getAttribute('aria-labelledby');
      out.push({
        where, tag: el.tagName.toLowerCase(), cls: String(el.className?.baseVal ?? el.className ?? '').slice(0, 80),
        glyph: glyphOnly ? text : '', ariaLabel: el.getAttribute('aria-label') || '', labelledby: labelledby || '',
        title: el.getAttribute('title') || '', tooltip: el.hasAttribute('data-tooltip'), describedby: el.getAttribute('aria-describedby') || '',
        disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true', inDialog: !!el.closest('dialog,[role=dialog]'),
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], html: el.outerHTML.replace(/\s+/g, ' ').slice(0, 170),
      });
    });
  };
  scan(document, 'document');
  document.querySelectorAll('*').forEach(el => { if (el.shadowRoot) scan(el.shadowRoot, 'shadow:' + el.tagName.toLowerCase()); });
  // Native titles that would double a tooltip.
  const titles = [...document.querySelectorAll('[title]')].filter(el => !el.closest('svg') && el.tagName !== 'IFRAME' && el.tagName !== 'TITLE').map(el => ({ tag: el.tagName.toLowerCase(), title: el.getAttribute('title'), tooltip: el.hasAttribute('data-tooltip') }));
  return { controls: out, titles };
};
