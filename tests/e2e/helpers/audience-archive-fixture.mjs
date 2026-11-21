import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { checkout, command, proxy } from '../../helpers/native-transfer.mjs';
import { fixtureProcessEnv } from '../../helpers/worker-environment.mjs';
import { localWranglerConfig } from '../../helpers/wrangler-config.mjs';

const exec = promisify(execFile);
const ownerId = '01J00000000000000000000091';
const ownerEmail = ['synthetic-lamp-owner', 'example.test'].join('@');
const migration = '0084_status_pages.sql';
const at = '2025-09-08T00:00:00.000Z';
const end = '2025-09-08T01:00:00.000Z';

export const legacyPublication = {
  feedIdentity: 'urn:lamp:synthetic-lamp-legacy-feed',
  componentId: '01J00000000000000000000092',
  component: 'Legacy public services',
  incident: { path: '/incidents/INC-81', wording: 'Prior public incident wording remains available.' },
  maintenance: { path: '/maintenance/SCH-81', wording: 'Prior maintenance wording remains available.' },
};

async function populatePriorSchema(db) {
  const { componentId, component, incident, maintenance } = legacyPublication;
  await db.batch([
    db.prepare("INSERT INTO oa_operators (id,email,display_name,role,status,created_at) VALUES (?,?,'Synthetic Lamp owner','owner','active',?)")
      .bind(ownerId, ownerEmail, Date.parse(at)),
    db.prepare("INSERT INTO oa_bootstrap (singleton,claim_id,claimed_at) VALUES (1,?,?)").bind(ownerId, Date.parse(at)),
    db.prepare("INSERT INTO page_settings (id,page_name,tagline,accent_color,timezone,hostname,feed_id,mail_from_address,created_at,updated_at) VALUES ('default','Legacy customer status','Previously published status','#16794c','UTC','localhost',?,?,?,?)")
      .bind(legacyPublication.feedIdentity.slice('urn:lamp:'.length), ownerEmail, at, at),
    db.prepare("INSERT INTO setup_readiness (step,evidence_key,checked_at) VALUES ('first-run','complete',?)").bind(at),
    db.prepare("INSERT INTO components (id,name,display_order,created_at,updated_at) VALUES (?,?,0,?,?)").bind(componentId, component, at, at),
    db.prepare("INSERT INTO incidents (id,reference,title,lifecycle,opened_at,resolved_at,created_by_operator_id,created_at,updated_at) VALUES ('legacy-incident','INC-81','Legacy public outage','Resolved',?,?,?,?,?)")
      .bind(at, end, ownerId, at, end),
    db.prepare("INSERT INTO incident_components (id,incident_id,component_id,component_name,state,relationship,published_at,created_at,updated_at) VALUES ('legacy-incident-service','legacy-incident',?,?,'Major outage','Primary',?,?,?)")
      .bind(componentId, component, at, at, at),
    db.prepare("INSERT INTO incident_updates (id,incident_id,lifecycle,affected_audience,customer_impact,published_at,author_operator_id,created_at,updated_at) VALUES ('legacy-incident-update','legacy-incident','Resolved','Customers',?,?,?,?,?)")
      .bind(incident.wording, end, ownerId, end, end),
    db.prepare("INSERT INTO maintenance (id,reference,title,state,starts_at,ends_at,completed_at,created_by_operator_id,created_at,updated_at) VALUES ('legacy-work','SCH-81','Legacy public maintenance','Completed',?,?,?,?,?,?)")
      .bind(at, end, end, ownerId, at, end),
    db.prepare("INSERT INTO maintenance_components (id,maintenance_id,component_id,component_name,state,created_at,updated_at) VALUES ('legacy-work-service','legacy-work',?,?,'Under maintenance',?,?)")
      .bind(componentId, component, at, at),
    db.prepare("INSERT INTO maintenance_notices (id,maintenance_id,kind,body,published_at,author_operator_id,created_at,updated_at) VALUES ('legacy-work-notice','legacy-work','completed',?,?,?,?,?)")
      .bind(maintenance.wording, end, ownerId, end, end),
  ]);
}

const priorTables = ['page_settings', 'components', 'incidents', 'incident_components', 'incident_updates', 'maintenance', 'maintenance_components', 'maintenance_notices'];
const quote = key => '"' + key.replaceAll('"', '""') + '"';

async function priorRows(db) {
  return await Promise.all(priorTables.map(async table => {
    const rows = (await db.prepare('SELECT * FROM ' + table + ' ORDER BY id').all()).results;
    assert.ok(rows.length, table + ' is populated before the upgrade');
    return { table, rows, columns: Object.keys(rows[0]) };
  }));
}

async function runMigration(root) {
  const { RER_LOCAL_OPERATION, RER_STATE_DIR, ...env } = fixtureProcessEnv();
  await exec(process.execPath, ['scripts/migrate-local.mjs'], {
    cwd: root, env: { ...env, LAMP_WORKERS_STATE_PATH: join(root, '.wrangler/state'), CI: 'true', WRANGLER_SEND_METRICS: 'false' },
    timeout: 120_000, maxBuffer: 8 * 1024 * 1024,
  });
}

export async function openAudienceInstallations() {
  const root = process.cwd();
  const directory = await mkdtemp(join(tmpdir(), 'lamp-audience-upgrade-'));
  const source = join(directory, 'source');
  const target = join(directory, 'restore');
  const config = JSON.parse(localWranglerConfig());
  const dbId = config.d1_databases.find(database => database.binding === 'DB').database_id;
  const bucketName = config.r2_buckets.find(bucket => bucket.binding === 'SNAPSHOTS').bucket_name;
  const installation = root => ({ root, databaseId: dbId, bucketName });
  const close = () => rm(directory, { recursive: true, force: true });
  try {
    await checkout(root, source);
    await checkout(root, target);
    const core = join(source, 'migrations/core');
    const pending = (await readdir(core)).filter(name => name.endsWith('.sql') && name >= migration);
    if (!pending.includes(migration)) throw new Error('The audience migration is unavailable for the upgrade fixture.');
    for (const name of pending) await rename(join(core, name), join(directory, name));
    let before;
    try {
      await runMigration(source);
      const prior = await proxy(source);
      try {
        await populatePriorSchema(prior.env.DB);
        before = await priorRows(prior.env.DB);
      } finally {
        await prior.dispose();
      }
    } finally {
      for (const name of pending) await rename(join(directory, name), join(core, name));
    }
    await runMigration(source);
    const upgraded = await proxy(source);
    try {
      for (const { table, columns, rows } of before) {
        const actual = await upgraded.env.DB.prepare('SELECT ' + columns.map(quote).join(',') + ' FROM ' + table + ' ORDER BY id').all();
        assert.deepEqual(actual.results, rows, table + ' retains every pre-migration value');
      }
      assert.deepEqual((await upgraded.env.DB.prepare('PRAGMA foreign_key_check').all()).results, []);
    } finally {
      await upgraded.dispose();
    }
    return {
      source: installation(source),
      async restore() {
        const archive = join(directory, 'audience.rer');
        await command(source, 'export', '--output', archive);
        await command(target, 'import', '--input', archive, '--yes');
        return installation(target);
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
