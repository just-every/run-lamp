import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const inventoryDigest = pairs => createHash('sha256').update(JSON.stringify(
  pairs.map(([name, hash]) => [name, hash.toLowerCase()]).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0),
)).digest('hex');

/** Exercise the emitted door with actual local D1, never an invented inventory. */
export async function healthSchemaProof(fixture) {
  const { version } = JSON.parse(await readFile('package.json', 'utf8'));
  const execute = sql => fixture.db.prepare(sql).run();
  const probe = async () => {
    const before = Date.now();
    const response = await fixture.raw('/health');
    assert.equal(response.status, 200, 'schema observation does not change healthy liveness');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.buildVersion, version, 'the compiled package version is returned');
    assert.deepEqual(body.deployment, { sourceSha: null, fingerprint: null, versionId: null }, 'version never substitutes for absent provenance');
    const observation = body.schemaObservation;
    assert.equal(observation.version, 1);
    assert.equal(observation.ledger, 'rer_migrations');
    assert.equal(observation.binding, 'DB');
    assert.equal(new Date(observation.observedAt).toISOString(), observation.observedAt);
    assert.ok(Date.parse(observation.observedAt) >= before && Date.parse(observation.observedAt) <= Date.now());
    return observation;
  };
  const unavailable = (observation, reason) => {
    assert.equal(observation.state, 'unavailable');
    assert.equal(observation.reason, reason);
    assert.equal(observation.completeCount, null);
    assert.equal(observation.partialCount, null);
    assert.equal(observation.inventorySha256, null);
    assert.deepEqual(Object.keys(observation).sort(), ['version', 'ledger', 'binding', 'observedAt', 'state', 'completeCount', 'inventorySha256', 'partialCount', 'reason'].sort(), 'only the safe fixed observation fields escape');
  };
  const available = (observation, pairs, partialCount = 0) => {
    assert.equal(observation.state, 'available');
    assert.equal(observation.reason, null);
    assert.equal(observation.completeCount, pairs.length);
    assert.equal(observation.partialCount, partialCount);
    assert.equal(observation.inventorySha256, inventoryDigest(pairs));
  };
  assert.equal(await fixture.db.prepare("SELECT 1 FROM sqlite_master WHERE name='rer_migrations'").first(), null);
  unavailable(await probe(), 'ledger_missing');
  assert.equal(await fixture.db.prepare("SELECT 1 FROM sqlite_master WHERE name='rer_migrations'").first(), null, 'health never creates its ledger');
  await execute('CREATE TABLE rer_migrations (name TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  try {
    available(await probe(), []);
    const pairs = ['z', 'a', 'Z'].map(name => [`synthetic-lamp-${name}.sql`, createHash('sha256').update(name).digest('hex')]);
    const insert = pairs => fixture.db.batch(pairs.map(([name, hash]) => fixture.db.prepare('INSERT INTO rer_migrations(name,sha256) VALUES(?,?)').bind(name, hash)));
    await insert(pairs.map(([name, hash]) => [name, hash.toUpperCase()]));
    const first = await probe();
    available(first, pairs);
    await execute('DELETE FROM rer_migrations');
    await insert([...pairs].reverse());
    assert.equal((await probe()).inventorySha256, first.inventorySha256, 'digest is independent of DB row order and hash case');
    await insert([['synthetic-lamp-next.sql#0-12', createHash('sha256').update('partial').digest('hex')], ['synthetic-lamp-next.sql#12-24', createHash('sha256').update('partial').digest('hex')]]);
    available(await probe(), pairs, 2);
    const ledgerBefore = (await fixture.db.prepare('SELECT * FROM rer_migrations ORDER BY name').all()).results;
    await probe();
    assert.deepEqual((await fixture.db.prepare('SELECT * FROM rer_migrations ORDER BY name').all()).results, ledgerBefore, 'observation never writes ledger rows');
    await fixture.db.prepare('UPDATE rer_migrations SET sha256=? WHERE name=?').bind(createHash('sha256').update('changed').digest('hex'), pairs[0][0]).run();
    assert.notEqual((await probe()).inventorySha256, first.inventorySha256, 'the digest covers hashes throughout the complete inventory');
    await fixture.db.prepare('UPDATE rer_migrations SET sha256=? WHERE name=?').bind('synthetic-lamp-invalid-hash', pairs[0][0]).run();
    unavailable(await probe(), 'malformed_rows');
    await execute('DELETE FROM rer_migrations');
    await insert([['synthetic-lamp-invalid.sql#broken', pairs[0][1]]]);
    unavailable(await probe(), 'malformed_rows');
    await execute('DELETE FROM rer_migrations');
    await insert([['synthetic-lamp-invalid.sql#12-0', pairs[0][1]]]);
    unavailable(await probe(), 'malformed_rows');
    await execute('DELETE FROM rer_migrations');
    await execute("WITH RECURSIVE n(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM n WHERE i<2048) INSERT INTO rer_migrations(name,sha256) SELECT 'synthetic-lamp-' || i || '.sql', lower(hex(zeroblob(32))) FROM n");
    const all = (await fixture.db.prepare('SELECT name,sha256 FROM rer_migrations').all()).results.map(row => [row.name, row.sha256]);
    available(await probe(), all);
    await insert([['synthetic-lamp-overflow.sql#0-1', pairs[0][1]]]);
    unavailable(await probe(), 'row_limit');
    assert.equal((await fixture.db.prepare('SELECT COUNT(*) AS count FROM rer_migrations').first()).count, 2049, 'overflow never truncates or changes the actual inventory');
    await execute('DROP TABLE rer_migrations');
    await execute('CREATE TABLE rer_migrations (name TEXT)');
    unavailable(await probe(), 'read_error');
  } finally {
    await execute('DROP TABLE IF EXISTS rer_migrations');
  }
  unavailable(await probe(), 'ledger_missing');
}
