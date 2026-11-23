import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cloudflareEdge } from '../helpers/cloudflare-edge.mjs';
import { reachBuiltWorkerOptions } from '../e2e/helpers/reach-built-worker.mjs';
import { assertMigrationObservation, schemaProbeClock } from '../e2e/helpers/health-schema-proof.mjs';
import { platformLedgerRows } from '../../scripts/platform-ledger.mjs';

const require = createRequire(import.meta.url);
const { Miniflare, convertV4MiniflareOptions } = createRequire(require.resolve('wrangler'))('miniflare');

// scripts/setup.mjs, run as `pnpm setup:cloudflare` runs it, against the fake Cloudflare edge and a stand-in
// wrangler (../helpers/fake-wrangler.mjs). Only Cloudflare and wrangler are substituted; the migration list is
// this checkout's own migrations/core.
const root = process.cwd();
const shipped = (await readdir(join(root, 'migrations/core'))).filter(name => name.endsWith('.sql')).sort();

async function setup(directory, edge, credentials, limit, interrupt = false) {
  const hex = () => randomBytes(32).toString('hex');
  const environment = {
    ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(CLOUDFLARE_|MAIL_|LAMP_|NODE_OPTIONS$)/.test(name))), ...credentials,
    LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'page.example.test', LAMP_PAGE_NAME: 'Synthetic setup', LAMP_PAGE_TAGLINE: 'Setup migrations', LAMP_PAGE_TIMEZONE: 'UTC', LAMP_ACCENT_COLOR: '#16794C',
    SETUP_OPERATOR_EMAIL: 'owner@example.test', MAIL_PROVIDER: 'rer', MAIL_FROM: 'lamp@example.test', MAIL_API_KEY: `synthetic-${hex()}`, MAIL_RELAY_URL: 'https://relay.example.test/api/managed-mail/send',
    SESSION_SECRET: hex(), SUBSCRIBER_TOKEN_SECRET: hex(), WEBHOOK_SIGNING_SECRET: hex(), SETUP_TOKEN: hex(), INSTALLATION_KEY: hex(),
    NODE_OPTIONS: `--import=${new URL('../helpers/cloudflare-edge-preload.mjs', import.meta.url).href}`, LAMP_FAKE_EDGE: edge.origin, LAMP_FAKE_EDGE_HOSTS: 'api.cloudflare.com',
    LAMP_FAKE_WRANGLER_STATE: join(directory, 'ledger.json'), LAMP_FAKE_WRANGLER_ROOT: root,
    LAMP_FAKE_WRANGLER_INTERRUPT: String(interrupt),
  };
  if (limit !== undefined) environment.LAMP_FAKE_WRANGLER_LIMIT = String(limit);
  const child = spawn('pnpm', ['run', 'setup:cloudflare', '--', '--environment', 'setup-migrations'], { cwd: directory, timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'], env: environment });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const code = await new Promise(resolve => child.once('close', resolve));
  const ledger = JSON.parse(await readFile(join(directory, 'ledger.json'), 'utf8'));
  return { code, output, ledger };
}

test('Setup resumes migration apply, backfills the installed-health ledger and stops safely on interruption or without progress', { timeout: 240000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'lamp-setup-migrations-'));
  const credentials = { CLOUDFLARE_ACCOUNT_ID: randomBytes(16).toString('hex'), CLOUDFLARE_API_TOKEN: `synthetic-${randomBytes(16).toString('hex')}` };
  const { externalWorkers, ...worker } = await reachBuiltWorkerOptions();
  let installation = 0;
  const runtimeOptions = () => convertV4MiniflareOptions({ port: 0, inspectorPort: 0,
    resourcePersistencePath: join(directory, 'storage', String(installation++)), workers: [{ ...worker,
      bindings: { LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'page.example.test', AUTH_ORIGIN: 'https://app.example.test',
        MAIL_PROVIDER: 'none', SESSION_SECRET: 'synthetic-lamp-session-1'.repeat(3),
        SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-subscriber-1'.repeat(3), WEBHOOK_SIGNING_SECRET: 'synthetic-lamp-webhook-1'.repeat(3) },
      d1Databases: { DB: 'synthetic-lamp-ledger-1' }, r2Buckets: { SNAPSHOTS: 'synthetic-lamp-ledger-1' },
      queueProducers: { JOBS: 'synthetic-lamp-ledger-1' }, queueConsumers: {},
    }, ...externalWorkers] });
  let runtime = new Miniflare(runtimeOptions());
  let db = await runtime.getD1Database('DB');
  const expected = await Promise.all(shipped.map(async name => [name, createHash('sha256').update(await readFile(join(root, 'migrations/core', name))).digest('hex')]));
  const rows = async () => (await db.prepare('SELECT name,sha256 FROM rer_migrations ORDER BY name').all()).results;
  const advance = schemaProbeClock((path, init) => runtime.dispatchFetch('https://app.example.test' + path, init));
  const observe = async () => {
    await advance();
    const response = await runtime.dispatchFetch('https://app.example.test/health');
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const observation = (await response.json()).schemaObservation;
    assertMigrationObservation(observation, expected);
    return observation;
  };
  const edge = await cloudflareEdge({ accountId: credentials.CLOUDFLARE_ACCOUNT_ID, token: credentials.CLOUDFLARE_API_TOKEN, subdomain: 'synthetic-owner', d1: { prepare: (...args) => db.prepare(...args), batch: (...args) => db.batch(...args) }, workerHost: { host: 'app.example.test', name: 'lamp-setup-migrations' }, app: () => new Response('Lamp') });
  try {
    await writeFile(join(directory, 'package.json'), JSON.stringify({ private: true, scripts: { 'setup:cloudflare': `${JSON.stringify(process.execPath)} ${JSON.stringify(join(root, 'scripts/setup.mjs'))}` } }));
    await mkdir(join(directory, 'node_modules/wrangler/bin'), { recursive: true });
    await cp(new URL('../helpers/fake-wrangler.mjs', import.meta.url), join(directory, 'node_modules/wrangler/bin/wrangler.js'));
    await symlink(join(root, 'migrations'), join(directory, 'migrations'));
    const before = await runtime.dispatchFetch('https://app.example.test/health');
    assert.equal((await before.json()).schemaObservation.reason, 'ledger_missing');
    const cut = Math.ceil(shipped.length * 0.7);
    const complete = await setup(directory, edge, credentials, cut);
    assert.equal(complete.code, 0, complete.output);
    assert.match(complete.output, /setup is continuing with pass/);
    assert.match(complete.output, /Provisioned lamp-setup-migrations; migrations and page settings are initialized\./);
    assert.deepEqual(complete.ledger.applied, shipped);
    assert.equal(complete.ledger.executed.length, 1, 'page settings are written only once the list is complete');
    const first = await observe();
    const completeRows = expected.map(([name, sha256]) => ({ name, sha256 }));
    assert.deepEqual(await rows(), completeRows, 'fresh setup records exact bytes, one complete row per applied file');
    assert.deepEqual(complete.ledger.observations[0], completeRows.slice(0, cut), 'the first short pass records only its committed subset');
    assert.equal(await platformLedgerRows(db), null, 'native health inventory does not masquerade as a managed archive ledger');
    const columns = (await db.prepare('PRAGMA table_info(rer_migrations)').all()).results;
    assert.deepEqual(columns.map(({ name, type, pk, notnull }) => ({ name, type, pk, notnull })), [
      { name: 'name', type: 'TEXT', pk: 1, notnull: 0 }, { name: 'sha256', type: 'TEXT', pk: 0, notnull: 1 },
    ], 'the native ledger has exactly the columns the observer reads');
    const repeated = await setup(directory, edge, credentials);
    assert.equal(repeated.code, 0, repeated.output);
    assert.deepEqual(await rows(), completeRows, 're-deploy/setup is idempotent');
    assert.equal((await observe()).inventorySha256, first.inventorySha256);
    for (const sql of ['DROP TABLE rer_migrations', 'DELETE FROM rer_migrations', 'DELETE FROM rer_migrations WHERE name IN (SELECT name FROM rer_migrations LIMIT 3)']) {
      await db.prepare(sql).run();
      const backfill = await setup(directory, edge, credentials);
      assert.equal(backfill.code, 0, backfill.output);
      assert.deepEqual(await rows(), completeRows, 'backfill restores every missing applied file and no other row');
      assert.equal((await observe()).inventorySha256, first.inventorySha256);
    }
    t.diagnostic(`PROBE: fresh apply, re-deploy, missing/empty/subset backfill -> /health ${first.state}, ${first.completeCount}, ${first.inventorySha256}`);
    t.diagnostic(`PROBE: clean early return after ${cut} -> same setup command finishes ${shipped.length} migrations`);

    for (const [limit, reason, interrupt] of [[0, /made no progress/, false], [Math.max(1, Math.floor(shipped.length / 6)), /five-pass migration budget/, false], [cut, /Synthetic interruption/, true]]) {
      // Fresh D1 per interrupted deployment, including migration effects rather
      // than merely resetting the fake's list of filenames.
      await runtime.dispose();
      runtime = new Miniflare(runtimeOptions());
      db = await runtime.getD1Database('DB');
      await writeFile(join(directory, 'ledger.json'), JSON.stringify({ applied: [], executed: [], observations: [] }));
      const short = await setup(directory, edge, credentials, limit, interrupt);
      assert.notEqual(short.code, 0, short.output);
      assert.match(short.output, reason);
      assert.doesNotMatch(short.output, /migrations and page settings are initialized/);
      assert.deepEqual(short.ledger.executed, [], 'never writes page settings on a partial schema');
      assert.deepEqual(await rows(), completeRows.filter(row => short.ledger.applied.includes(row.name)), 'only confirmed files are recorded after an interrupted apply');
      assertMigrationObservation((await (await runtime.dispatchFetch('https://app.example.test/health')).json()).schemaObservation, expected.filter(([name]) => short.ledger.applied.includes(name)));
      const missing = shipped.filter(name => !short.ledger.applied.includes(name));
      if (!interrupt) for (const name of missing) assert.ok(short.output.includes(name), `names ${name}`);
      const resumed = await setup(directory, edge, credentials);
      assert.equal(resumed.code, 0, resumed.output);
      await observe();
      t.diagnostic(`PROBE: ${reason.source} -> stops with ${short.ledger.applied.length}/${shipped.length}, no page settings`);
    }

  } finally {
    await edge.close();
    await runtime.dispose();
    await rm(directory, { recursive: true, force: true });
  }
});
