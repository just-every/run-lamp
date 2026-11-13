// Task-scoped public-door proof; run after rer build:
// node tests/health-version.mjs [receipt-directory]
// Uses the real managed packaging path without adding a routine test registration.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { cp, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { unstable_splitSqlQuery } from 'wrangler';
import { produceArtifact } from '../scripts/build-delivery-artifact.mjs';
import { setupPageSettingsStatement } from '../scripts/ops-config.mjs';
import { reservePort } from './e2e/worker-startup.mjs';
import { secret } from './auth-adoption/runtime.mjs';

const require = createRequire(import.meta.url);
const { Miniflare, convertV4MiniflareOptions } = createRequire(require.resolve('wrangler'))('miniflare');
async function installedVersionPublicDoorProof() {
  const expectedVersion = JSON.parse(await readFile('package.json', 'utf8')).version;
  const directory = await mkdtemp(resolve('.lamp-version-'));
  const receiptDirectory = process.argv[2] ? resolve(process.argv[2]) : null;
  let runtime, browser;
  try {
    const candidate = join(directory, 'candidate');
    await mkdir(join(candidate, 'scripts/delivery'), { recursive: true });
    for (const name of ['dist', 'migrations']) await cp(name, join(candidate, name), { recursive: true });
    for (const name of ['edition.json', 'rer-setup.json', 'scripts/delivery/rer-entry.template.mjs']) await copyFile(name, join(candidate, name));
    const artifactPath = await produceArtifact({ root: candidate });
    const artifact = JSON.parse(await readFile(artifactPath, 'utf8'));
    const payloads = new Map(await Promise.all([...artifact.modules, ...artifact.assets].map(async item =>
      [item.payload, await readFile(resolve(dirname(artifactPath), item.payload))])));
    const port = await reservePort();
    const origin = `http://127.0.0.1:${port}`;
    // Only the managed identity is supplied. Legacy health inputs remain absent.
    const managedIdentity = { releaseDigest: 'synthetic-lamp-release-1', versionId: 'synthetic-lamp-version-1' };
    const bindings = { ...artifact.deploymentSpec.publicVariables, LAMP_APP_HOST: '127.0.0.1', LAMP_PAGE_HOST: 'status.lamp.test',
      AUTH_ORIGIN: origin, AUTH_LOCAL: 'true', SESSION_SECRET: secret, SETUP_OPERATOR_EMAIL: 'owner@example.test',
      SETUP_TOKEN: 'synthetic-lamp-bootstrap-1-'.repeat(3), MAIL_FROM_ADDRESS: 'lamp@example.test', MAIL_PROVIDER: '',
      SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-subscription-1-'.repeat(3), WEBHOOK_SIGNING_SECRET: 'synthetic-lamp-webhook-1-'.repeat(3),
      RER_RELEASE_DIGEST: managedIdentity.releaseDigest, RER_VERSION_METADATA: { id: managedIdentity.versionId } };
    const modules = artifact.modules.map(module => ({ type: module.type === 'esm' ? 'ESModule' : module.type === 'compiled-wasm' ? 'CompiledWasm' : 'Text',
      path: module.name, contents: module.type === 'compiled-wasm' ? payloads.get(module.payload) : payloads.get(module.payload).toString() }));
    modules.sort((a, b) => a.path === artifact.mainModule ? -1 : b.path === artifact.mainModule ? 1 : 0);
    runtime = new Miniflare(convertV4MiniflareOptions({ name: 'lamp-version', port, modules, bindings,
      compatibilityDate: artifact.deploymentSpec.compatibilityDate, compatibilityFlags: artifact.deploymentSpec.compatibilityFlags,
      d1Databases: { DB: 'lamp-version-db' }, r2Buckets: { SNAPSHOTS: 'lamp-version-snapshots' },
      durableObjects: { SNAPSHOT_CACHE: { className: 'SnapshotCache', useSQLite: true } }, queueProducers: { JOBS: 'lamp-version-jobs' },
      resourcePersistencePath: join(directory, 'state'),
      serviceBindings: { ASSETS: async request => {
        const asset = artifact.assets.find(item => item.path === new URL(request.url).pathname);
        return asset ? new Response(payloads.get(asset.payload), { headers: { 'Content-Type': asset.contentType } }) : new Response(null, { status: 404 });
      } },
      outboundService: () => { throw new Error('The version journey must make no external requests.'); },
    }));
    await runtime.ready;
    const db = await runtime.getD1Database('DB');
    for (const migration of artifact.deploymentSpec.migrations) await db.batch(unstable_splitSqlQuery(migration.sql).map(sql => db.prepare(sql)));
    await db.prepare(setupPageSettingsStatement({ pageName: 'Synthetic Lamp status', pageTagline: 'Version proof', pageTimezone: 'UTC',
      pageHost: 'status.lamp.test', mailFromAddress: 'lamp@example.test', pageAccentColor: '#16794C' })).run();
    await db.prepare("INSERT INTO setup_readiness(step,evidence_key,checked_at) VALUES('first-run','complete','2026-11-13')").run();
    const request = (path, init = {}) => fetch(origin + path, { redirect: 'manual', ...init, headers: { Origin: origin, ...init.headers } });
    assert.equal((await request('/api/app/page-settings')).status, 401, 'the version-bearing settings read stays authenticated');
    const bootstrap = await request('/auth/bootstrap', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: bindings.SETUP_TOKEN, displayName: 'Synthetic Lamp owner' }) });
    assert.equal(bootstrap.status, 303);
    const cookie = bootstrap.headers.get('set-cookie').split(';')[0];
    const settings = await request('/api/app/page-settings', { headers: { Cookie: cookie } });
    assert.equal(settings.status, 200);
    const body = await settings.json();
    assert.equal(body.version, expectedVersion, 'the emitted managed Worker reports the package version used to build it');
    assert.equal(body.settings.pageName, 'Synthetic Lamp status');
    for (const value of [bindings.SETUP_TOKEN, bindings.SESSION_SECRET, managedIdentity.releaseDigest, managedIdentity.versionId])
      assert.ok(!JSON.stringify(body).includes(value), 'the settings version exposes no private or deployment binding values');
    const health = await request('/health');
    assert.equal(health.status, 200);
    assert.equal(health.headers.get('cache-control'), 'no-store');
    const healthBody = await health.json();
    assert.equal(healthBody.ok, true);
    assert.deepEqual(healthBody.deployment, { sourceSha: null, fingerprint: null, versionId: null }, 'missing legacy identity stays visible; managed metadata does not masquerade as it');
    const release = await request('/__rer/release');
    assert.equal(release.status, 200);
    assert.deepEqual(await release.json(), managedIdentity, 'managed delivery retains its separate release receipt');
    assert.equal((await request('/api/version')).status, 404, 'the existing surface is used without adding a public endpoint');
    browser = await chromium.launch({ executablePath: process.env.LAMP_CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const separator = cookie.indexOf('=');
    await context.addCookies([{ name: cookie.slice(0, separator), value: cookie.slice(separator + 1), url: origin }]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/app/settings');
    const label = page.getByText(`Lamp version ${expectedVersion}`, { exact: true });
    try { await label.waitFor({ state: 'visible' }); }
    catch (cause) {
      console.error(JSON.stringify({ screen: new URL(page.url()).pathname, errors, text: (await page.locator('body').innerText()).slice(0, 3000) }));
      throw cause;
    }
    assert.equal(await label.innerText(), `Lamp version ${expectedVersion}`);
    assert.ok(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize) >= 13), 'the version uses readable existing text');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    const screens = [];
    if (receiptDirectory) {
      await mkdir(receiptDirectory, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        const name = `settings-version-${width}.png`;
        await page.screenshot({ path: join(receiptDirectory, name) });
        screens.push(name);
      }
    }
    const sourceFiles = Object.fromEntries(await Promise.all(['package.json', 'src/core/features/page-settings/routes.ts', 'src/core/features/page-settings/ui/settings-page.tsx']
      .map(async name => [name, createHash('sha256').update(await readFile(name)).digest('hex')])));
    const receipt = { timestamp: execFileSync('date', ['-u', '+%Y-%m-%dT%H:%M:%SZ'], { encoding: 'utf8' }).trim(),
      sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      sourceFiles, artifactManifestSha256: createHash('sha256').update(await readFile(artifactPath)).digest('hex'),
      packageVersion: expectedVersion, settingsVersion: body.version, healthDeployment: healthBody.deployment,
      runtime: 'emitted production Worker, packaged by the real managed artifact producer, local Miniflare',
      result: 'PASS', assertionWidth: 1440, screens, installedStage: 'NOT RUN: no installation origin or owner session provided' };
    if (receiptDirectory) await writeFile(join(receiptDirectory, 'version-proof.json'), JSON.stringify(receipt, null, 2) + '\n');
    console.log(JSON.stringify(receipt));
  } finally {
    await browser?.close();
    await runtime?.dispose();
    await rm(directory, { recursive: true, force: true });
  }
}
await installedVersionPublicDoorProof();
