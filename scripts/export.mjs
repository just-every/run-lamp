import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { parseArgs } from "./ops-config.mjs";
import { openArchivePlatform } from "./archive-runtime.mjs";
import { isRerBookkeepingTable } from "./archive-validation.mjs";
import { ownerMigrationFiles } from "./owner-migrations.mjs";
import { assertPlatformLedger, platformLedger, platformLedgerRows } from "./platform-ledger.mjs";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function quotedIdentifier(name) {
  return `"${name.replaceAll('"', '""')}"`;
}

async function listAll(bucket) {
  const objects = [];
  let cursor;
  do {
    const page = await bucket.list({ cursor });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects;
}

async function exportObjects(bucket, output) {
  const objects = [];
  const skippedObjects = [];
  const copied = new Set();
  const copy = async (key) => {
    const source = await bucket.get(key);
    if (!source) return false;
    const bytes = new Uint8Array(await source.arrayBuffer());
    const file = `${objects.length.toString().padStart(6, "0")}-${encodeURIComponent(key)}`;
    await writeFile(join(output, "objects", file), bytes, { mode: 0o600 });
    objects.push({ key, file, size: bytes.byteLength, sha256: digest(bytes), contentType: source.httpMetadata?.contentType ?? null, httpMetadata: source.httpMetadata ?? {}, customMetadata: source.customMetadata ?? {} });
    copied.add(key);
    return true;
  };
  const missing = new Set();
  for (const { key } of await listAll(bucket)) {
    if (copied.has(key)) continue;
    if (await copy(key)) missing.delete(key);
    else missing.add(key);
  }
  if (missing.size) {
    // Snapshot rotation can prune an alias and publish its replacement during
    // the copy. Re-list once and copy every key we have not yet archived.
    for (const { key } of await listAll(bucket)) {
      if (copied.has(key)) continue;
      if (await copy(key)) missing.delete(key);
      else missing.add(key);
    }
    for (const key of missing) {
      skippedObjects.push({ key, reason: "disappeared-during-export" });
      console.warn(`Skipped R2 object ${key}: it disappeared during export.`);
    }
  }
  return { objects, skippedObjects };
}

async function tableNames(database) {
  const result = await database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND lower(substr(name, 1, 7)) <> 'sqlite_' AND lower(substr(name, 1, 4)) <> '_cf_' AND name NOT IN ('d1_migrations', 'lamp_ext_migrations', ?) ORDER BY name").bind(platformLedger).all();
  return result.results.map((row) => String(row.name)).filter((name) => !isRerBookkeepingTable(name));
}

async function dependencies(database, table) {
  const result = await database.prepare(`PRAGMA foreign_key_list(${quotedIdentifier(table)})`).all();
  return result.results.map((row) => String(row.table));
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const output = resolve(flags.get("out") ?? `exports/lamp-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`);
  await mkdir(output, { recursive: true, mode: 0o700 });
  if ((await readdir(output)).length) throw new Error("Export requires an empty output directory so an interrupted or older archive cannot be mistaken for this backup.");
  const incompletePath = join(output, ".incomplete");
  await writeFile(incompletePath, "Export in progress or interrupted. Use a new empty directory to retry.\n", { flag: "wx", mode: 0o600 });
  await mkdir(join(output, "objects"), { mode: 0o700 });
  const archive = await openArchivePlatform(flags);
  const { platform } = archive;
  let manifest;
  try {
    const ledger = await platformLedgerRows(platform.env.DB);
    if (ledger) await assertPlatformLedger(ledger);
    const tables = await tableNames(platform.env.DB);
    const entities = [];
    // D1 batch executes these reads in one transaction, so related records
    // cannot be captured on opposite sides of a concurrent publication.
    const ordering = await Promise.all(tables.map(async (name) => {
      const columns = (await platform.env.DB.prepare(`PRAGMA table_info(${quotedIdentifier(name)})`).all()).results;
      const keys = columns.filter((column) => column.pk > 0).sort((left, right) => left.pk - right.pk);
      return keys.length ? keys.map((column) => quotedIdentifier(column.name)).join(", ") : "rowid";
    }));
    const snapshot = tables.length ? await platform.env.DB.batch(tables.map((name, index) => platform.env.DB.prepare(`SELECT * FROM ${quotedIdentifier(name)} ORDER BY ${ordering[index]}`))) : [];
    for (const [index, name] of tables.entries()) {
      const rows = snapshot[index].results.map(row => {
        if (name === "public_metrics") return { ...row, sealed_credentials: null, pull_lease_until: null, pull_after: 0 };
        if (name === "alert_sources" && "responder_sealed_credentials" in row) return { ...row, responder_sealed_credentials: null };
        if (name === "sign_in_providers") return { ...row, sealed_secret: null };
        if (name === "oa_auth_settings") return { ...row, required_provider: null };
        return row;
      });
      entities.push({ name, dependsOn: await dependencies(platform.env.DB, name), rows });
    }
    const entitiesPath = join(output, "entities.json");
    const entitiesBytes = Buffer.from(`${JSON.stringify({ version: 1, tables: entities }, null, 2)}\n`);
    await writeFile(entitiesPath, entitiesBytes, { mode: 0o600 });

    const { objects, skippedObjects } = await exportObjects(platform.env.SNAPSHOTS, output);
    const migrations = await Promise.all((await readdir("migrations/core")).filter((name) => name.endsWith(".sql")).sort().map(async (file) => ({ file, sha256: digest(await readFile(join("migrations/core", file))) })));
    const ownerMigrations = await Promise.all((await ownerMigrationFiles()).map(async (file) => ({ file, sha256: digest(await readFile(join("migrations/ext", file))) })));
    manifest = {
      format: "lamp-export.v1",
      exportedAt: new Date().toISOString(),
      database: { file: basename(entitiesPath), sha256: digest(entitiesBytes), tables: tables.length },
      migrations,
      ownerMigrations,
      objects,
      skippedObjects,
    };
  } finally {
    await archive.dispose();
  }
  // Publish the complete manifest and clear the marker in a single rename.
  await writeFile(incompletePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await rename(incompletePath, join(output, "manifest.json"));
  console.log(`Exported ${manifest.database.tables} D1 entities and ${manifest.objects.length} R2 objects to ${output}.`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
