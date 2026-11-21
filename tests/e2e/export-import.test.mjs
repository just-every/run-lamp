import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { checkout } from '../helpers/native-transfer.mjs';
import { observationLedgerSql, shippedMigrations } from '../../scripts/setup-migrations.mjs';
import { fixtureProcessEnv } from '../helpers/worker-environment.mjs';

const execute = promisify(execFile);

async function writeArchiveVariant(archive, destination, tables) {
  await cp(archive, destination, { recursive: true });
  const manifestPath = join(destination, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const entities = JSON.stringify({ version: 1, tables });
  manifest.database.tables = tables.length;
  manifest.database.sha256 = createHash('sha256').update(entities).digest('hex');
  await writeFile(join(destination, manifest.database.file), entities);
  await writeFile(manifestPath, JSON.stringify(manifest));
}

// Owner SQL uses Lamp's declared migration and technical-archive commands. The
// native rer archive journey separately exercises installation identity and
// temporary authority; neither test substitutes an internal helper for the CLI.
test('HIST-004 PORT-001 — owner SQL rolls back a failed upgrade, recovers once, and travels through a clean technical backup and restore', { timeout: 600_000 }, async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'lamp-owner-archive-'));
  const installation = join(temporary, 'installation');
  const source = join(installation, '.wrangler/state'), target = join(temporary, 'restored-state');
  const archive = join(temporary, 'archive'), reexport = join(temporary, 'reexport');
  const { RER_LOCAL_OPERATION, RER_STATE_DIR, ...inherited } = fixtureProcessEnv();
  const env = { ...inherited, LAMP_WORKERS_STATE_PATH: source, WRANGLER_SEND_METRICS: 'false' };
  const command = async (binary, args) => {
    try { return await execute(binary, args, { cwd: installation, env, encoding: 'utf8', timeout: 300_000, maxBuffer: 4 * 1024 * 1024 }); }
    catch (error) { throw new Error(`Owner archive command ${args[1] ?? binary} failed: ${String(error.stderr ?? error.code)}`); }
  };
  const script = (name, ...args) => command('pnpm', ['run', name, ...args]);
  const query = async (state, sql) => {
    const result = await command('pnpm', ['exec', 'wrangler', 'd1', 'execute', 'DB', '--local', '--config', 'wrangler.jsonc', '--persist-to', state, '--json', '--command', sql]);
    return JSON.parse(result.stdout).map(item => item.results);
  };
  try {
    await checkout(process.cwd(), installation);
    await mkdir(join(installation, 'migrations/ext'), { recursive: true });
    await writeFile(join(installation, 'migrations/ext/0001_owner.sql'), await readFile('tests/e2e/fixtures/owner-portability.sql'));
    await script('migrate:local');

    const pending = join(installation, 'migrations/ext/0002_owner.sql');
    await writeFile(pending, "UPDATE owner_labels SET label='Uncommitted edit' WHERE id='owner-1'; INSERT INTO missing_owner_table VALUES(1);");
    await assert.rejects(script('migrate:local'), /failed/, 'a failed custom upgrade stops before backup');
    assert.deepEqual((await query(source, "SELECT label FROM owner_labels WHERE id='owner-1'"))[0], [{ label: 'Preserve this owner intent' }], 'its earlier write rolled back');
    await writeFile(pending, "INSERT INTO owner_labels(id,label) VALUES('owner-recovery','Corrected owner migration');");
    await script('migrate:local');
    await script('migrate:local'); // An applied migration does not run again.
    await query(source, "DELETE FROM owner_labels WHERE id='deleted'; DELETE FROM owner_empty;");

    // Native hosted setup adds an observation ledger beside Wrangler's history.
    // It must neither turn a native source into a Managed install nor travel as
    // owner data to the restored database.
    await query(source, observationLedgerSql(shippedMigrations(), shippedMigrations()));
    const platformTableNames = ['_rer_portability_migrations', '_rer_archive_fixture', 'rer_portability_state'];
    await query(source, `
      CREATE TABLE _rer_portability_migrations (name TEXT PRIMARY KEY, sha256 TEXT, state TEXT);
      INSERT INTO _rer_portability_migrations VALUES ('synthetic-lamp-1', 'synthetic-lamp-hash', 'applied');
      CREATE TABLE _rer_archive_fixture (value TEXT);
      CREATE TABLE rer_portability_state (id INTEGER PRIMARY KEY, source_identity TEXT);
      INSERT INTO rer_portability_state VALUES (1, 'synthetic-lamp-2');
    `);
    await script('export:cloudflare', '--out', archive, '--persist-to', source);
    await script('import:cloudflare', '--from', archive, '--persist-to', target);
    await assert.rejects(script('import:cloudflare', '--from', archive, '--persist-to', target), /failed/, 'restore never overwrites a populated installation');
    await script('export:cloudflare', '--out', reexport, '--persist-to', target);
    const original = JSON.parse(await readFile(join(archive, 'entities.json'), 'utf8'));
    const exportedNames = original.tables.map(table => table.name);
    for (const name of ['rer_migrations', ...platformTableNames]) {
      assert.ok(!exportedNames.includes(name), `${name} stays installation metadata`);
    }
    assert.deepEqual(JSON.parse(await readFile(join(reexport, 'entities.json'), 'utf8')), original, 'all owner tables, relationships, generated values and empty/deleted state survive unchanged');

    const legacyArchive = join(temporary, 'legacy-archive');
    const legacyTarget = join(temporary, 'legacy-target');
    const platformRows = await query(source, platformTableNames.map(name => `SELECT * FROM ${name};`).join(' '));
    const legacyTables = platformTableNames.map((name, index) => ({ name, dependsOn: [], rows: platformRows[index] }));
    await writeArchiveVariant(archive, legacyArchive, [...original.tables, ...legacyTables]);
    await query(legacyTarget, "CREATE TABLE _rer_portability_migrations (destination TEXT); INSERT INTO _rer_portability_migrations VALUES ('Keep this local ledger');");
    await script('import:cloudflare', '--from', legacyArchive, '--persist-to', legacyTarget);
    const [legacyOwnerRows, legacyLedger] = await query(legacyTarget, 'SELECT id,label FROM owner_labels ORDER BY id; SELECT destination FROM _rer_portability_migrations;');
    assert.deepEqual(legacyOwnerRows, (await query(target, 'SELECT id,label FROM owner_labels ORDER BY id'))[0]);
    assert.deepEqual(legacyLedger, [{ destination: 'Keep this local ledger' }]);

    const invalidArchive = join(temporary, 'invalid-archive');
    const invalidTables = original.tables.map(table => table.name === 'owner_labels'
      ? { ...table, rows: table.rows.map(row => ({ ...row, unknown_owner_column: 1 })) }
      : table);
    await writeArchiveVariant(archive, invalidArchive, invalidTables);
    await assert.rejects(script('import:cloudflare', '--from', invalidArchive, '--persist-to', join(temporary, 'invalid-target')),
      /Unknown archived columns in owner_labels: unknown_owner_column/);
    assert.deepEqual((await query(target, 'SELECT id,label FROM owner_labels ORDER BY id'))[0], [
      { id: 'owner-1', label: 'Preserve this owner intent' },
      { id: 'owner-recovery', label: 'Corrected owner migration' },
    ]);
    const triggered = await query(target, "INSERT INTO owner_labels(id,label) VALUES('after-restore','Owner customization still works'); SELECT label FROM owner_changes WHERE label='Owner customization still works';");
    assert.deepEqual(triggered[1], [{ label: 'Owner customization still works' }], 'the restored customization retains its behavior');
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
