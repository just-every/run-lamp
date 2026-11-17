// Run Edit Run fleet, 2026-11-17. Native public-route proof of stale labeling.
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
const require = createRequire(resolve('package.json'));
const wranglerRequire = createRequire(require.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const { build } = wranglerRequire('esbuild');
const { chromium } = require('playwright');
const scratch = await mkdtemp(join(tmpdir(), 'lamp-stale-browser-'));
let runtime, browser;
const packet = import.meta.dirname;
try {
  const bundled = await build({ entryPoints: ['tests/e2e/snapshot-retained.worker.ts'], bundle: true, format: 'esm', platform: 'browser', write: false, external: ['cloudflare:workers'], plugins: [{ name: 'vite-assets', setup(builder) {
    builder.onResolve({ filter: /\?(inline|raw)$/ }, args => ({ path: resolve(args.resolveDir, args.path.split('?')[0]), namespace: args.path.endsWith('?raw') ? 'raw' : 'inline' }));
    builder.onLoad({ filter: /.*/, namespace: 'raw' }, async args => ({ contents: `export default ${JSON.stringify(await readFile(args.path, 'utf8'))}`, loader: 'js' }));
    builder.onLoad({ filter: /.*/, namespace: 'inline' }, async args => ({ contents: `export default ${JSON.stringify('data:application/octet-stream;base64,' + (await readFile(args.path)).toString('base64'))}`, loader: 'js' }));
  } }] });
  runtime = new Miniflare(convertV4MiniflareOptions({ bindings: { LAMP_APP_HOST: 'app.example' }, name: 'lamp-stale-browser', resourcePersistencePath: scratch, modules: true, script: bundled.outputFiles[0].text, compatibilityDate: '2026-09-08', compatibilityFlags: ['nodejs_compat'], durableObjects: { SNAPSHOT_CACHE: { className: 'SnapshotCache', useSQLite: true } }, r2Buckets: ['SNAPSHOTS'] }));
  const rebuilt = await runtime.dispatchFetch('https://page.example/test/rebuild', { method: 'POST', body: JSON.stringify({ generation: 1 }) });
  const generation = await rebuilt.json();
  assert.equal(generation.failure, null);
  browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const results = [];
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    await context.route('https://page.example/**', async route => {
      const result = await runtime.dispatchFetch(route.request().url());
      await route.fulfill({ status: result.status, headers: Object.fromEntries(result.headers), body: Buffer.from(await result.arrayBuffer()) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto('https://page.example/?storage=down', { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.equal(response.headers()['x-lamp-snapshot-state'], 'stale');
    const notice = page.locator('body > aside.snapshot-stale');
    assert.equal(await notice.count(), 1);
    assert.equal(await notice.getAttribute('role'), 'status');
    assert.ok((await notice.innerText()).includes(generation.pointer.generatedAt));
    assert.ok((await notice.innerText()).includes('Last known state'));
    assert.deepEqual(errors, []);
    const filename = `stale-${width}.png`;
    await page.screenshot({ path: join(packet, filename), fullPage: true });
    results.push({ width, status: response.status(), snapshotState: 'stale', noticeCount: 1, generatedAt: generation.pointer.generatedAt, pageErrors: errors, screenshot: filename });
    await context.close();
  }
  await writeFile(join(packet, 'browser-receipt.json'), JSON.stringify({ head: (await import('node:child_process')).execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), results }, null, 2) + '\n');
  console.log(JSON.stringify(results));
} finally {
  await browser?.close();
  await runtime?.dispose();
  await rm(scratch, { recursive: true, force: true });
}
