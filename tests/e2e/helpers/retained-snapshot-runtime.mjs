import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const { build } = wranglerRequire('esbuild');

export { Miniflare };

async function snapshotWorkerScript() {
  const built = await build({ entryPoints: ['tests/e2e/snapshot-retained.worker.ts'], bundle: true, format: 'esm', platform: 'browser', write: false, external: ['cloudflare:workers'], plugins: [{ name: 'vite-assets', setup(builder) {
    builder.onResolve({ filter: /\?(inline|raw)$/ }, args => ({ path: resolve(args.resolveDir, args.path.split('?')[0]), namespace: args.path.endsWith('?raw') ? 'raw' : 'inline' }));
    builder.onLoad({ filter: /.*/, namespace: 'raw' }, async args => ({ contents: `export default ${JSON.stringify(await readFile(args.path, 'utf8'))}`, loader: 'js' }));
    builder.onLoad({ filter: /.*/, namespace: 'inline' }, async args => ({ contents: `export default ${JSON.stringify('data:application/octet-stream;base64,' + (await readFile(args.path)).toString('base64'))}`, loader: 'js' }));
  } }] });
  return built.outputFiles[0].text;
}

export async function retainedSnapshotOptions(overrides) {
  return convertV4MiniflareOptions({
    bindings: { LAMP_APP_HOST: 'app.example' },
    modules: true,
    script: await snapshotWorkerScript(),
    compatibilityDate: '2026-09-08',
    compatibilityFlags: ['nodejs_compat'],
    durableObjects: { SNAPSHOT_CACHE: { className: 'SnapshotCache', useSQLite: true } },
    r2Buckets: ['SNAPSHOTS'],
    ...overrides,
  });
}
