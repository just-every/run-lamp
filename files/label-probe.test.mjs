import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = resolve(process.env.LAMP_CHECKOUT);
const require = createRequire(join(root, 'package.json'));
const { chromium } = require('playwright');
const { decorateLabel } = await import(pathToFileURL(join(root, 'modules/demo/label.mjs')));
const html = '<!doctype html><html><head><meta charset="utf-8"><title>Synthetic Lamp Dev</title></head><body><h1 data-rer-name>Synthetic Lamp</h1><main>Demo label security probe</main></body></html>';
const input = () => new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; script-src 'none'; style-src 'none'", 'content-length': String(Buffer.byteLength(html)), etag: 'synthetic' } });
const attack = '</script><script>globalThis.syntheticExecuted=true</script>';
const metadata = { name: `Synthetic "'><& ${attack}`, url: `https://run.example.invalid/?q="'><&${attack}` };
const hash = text => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;

test('demo label keeps metadata and mode out of executable code while preserving title updates and CSP', { timeout: 60000 }, async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
  try {
    let demoScript;
    for (const [mode, exit, suffix] of [['Demo', metadata, 'Demo'], ['Demo', { name: 'Another product', url: 'https://run.example.invalid/' }, 'Demo'], ['Dev', null, 'Dev'], [attack, metadata, 'Dev']]) {
      const response = await decorateLabel(input(), mode, exit);
      assert.equal(response.status, 200);
      assert.equal(response.headers.has('content-length'), false);
      assert.equal(response.headers.has('etag'), false);
      const body = await response.text();
      const script = body.match(/<script>([\s\S]*?)<\/script>/)[1];
      const style = body.match(/<style\b[^>]*>([\s\S]*?)<\/style>/)[1];
      const policy = response.headers.get('content-security-policy');
      assert.ok(policy.includes(hash(script)));
      assert.ok(policy.includes(hash(style)));
      assert.equal(policy.includes('unsafe-inline'), false);
      if (suffix === 'Demo') {
        if (demoScript) assert.equal(script, demoScript, 'changing metadata leaves executable bytes and their hash unchanged');
        demoScript = script;
      }
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body }));
      await page.goto('https://synthetic-lamp.invalid/');
      await page.waitForFunction(expected => document.title === expected, 'Synthetic Lamp ' + suffix);
      assert.equal(await page.locator('script').count(), 1, 'hostile data does not create additional script elements');
      assert.equal(await page.evaluate(() => globalThis.syntheticExecuted), undefined);
      assert.equal(await page.locator('[data-rer-name]').textContent(), 'Synthetic Lamp', 'the label preserves host text');
      assert.equal(await page.locator('[data-rer-name]').evaluate(element => getComputedStyle(element, '::after').content), `" ${suffix}"`);
      if (suffix === 'Demo') {
        assert.equal(await page.locator('style[data-rer-label]').getAttribute('data-rer-product'), exit.name);
        assert.equal(await page.locator('style[data-rer-label]').getAttribute('data-rer-run'), exit.url);
        await page.locator('[data-rer-demo-exit]').waitFor({ state: 'attached' });
        assert.equal(await page.locator('[data-rer-demo-exit]').getAttribute('aria-label'), 'Run ' + exit.name);
      }
      await page.evaluate(value => { document.title = value; }, `Synthetic route ${attack}`);
      await page.waitForFunction(expected => document.title === expected, `Synthetic route ${attack} ${suffix}`);
      assert.equal(await page.locator('script').count(), 1);
      assert.equal(await page.evaluate(() => globalThis.syntheticExecuted), undefined);
      assert.deepEqual(errors, []);
      await page.evaluate(() => { document.title = ''; });
      await page.waitForFunction(expected => document.title === expected, suffix);
      await page.evaluate(() => { document.title = 'Synthetic Lamp'; });
      await page.waitForFunction(expected => document.title === expected, 'Synthetic Lamp ' + suffix);
      if (suffix === 'Demo' && exit === metadata) {
        const directory = resolve(process.env.LAMP_PROBE_EVIDENCE);
        await mkdir(directory, { recursive: true });
        await page.screenshot({ path: join(directory, 'label-1440.png'), fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: join(directory, 'label-390.png'), fullPage: true });
      }
      await context.close();
      const repeated = await decorateLabel(new Response(body, { headers: response.headers }), mode, exit);
      assert.equal(await repeated.text(), body, 'repeated decoration stays idempotent');
    }
    const json = new Response('{}', { headers: { 'content-type': 'application/json' } });
    assert.equal(await decorateLabel(json, 'Demo'), json);
  } finally {
    await browser.close();
  }
});
