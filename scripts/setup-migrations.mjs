import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// Wrangler's own ledger for the core migrations (no custom migrations_table is set for migrations/core).
export const coreLedgerQuery = "SELECT name FROM d1_migrations ORDER BY name";

export function shippedMigrations(directory = "migrations/core") {
  return readdirSync(directory).filter(name => name.endsWith(".sql")).sort();
}

/** The names in `wrangler d1 execute --json` output for coreLedgerQuery. */
export function ledgerNames(output) {
  let parsed;
  try { parsed = JSON.parse(output); } catch { throw new Error("Setup could not read the migration ledger back from D1: wrangler did not return JSON."); }
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  if (!entries.length || entries.some(entry => entry?.success !== true || !Array.isArray(entry.results)
    || entry.results.some(row => typeof row?.name !== "string"))) {
    throw new Error("Setup could not confirm applied migrations from D1's ledger.");
  }
  return entries.flatMap(entry => entry.results.map(row => row.name));
}

/** Setup is complete only when every shipped migration is recorded as applied. */
export function assertMigrationsApplied(shipped, applied, reason = "the migration apply did not finish") {
  const recorded = new Set(applied);
  const missing = shipped.filter(name => !recorded.has(name));
  if (!missing.length) return;
  const label = name => name.replace(/_.*$/, "");
  const range = missing.length > 1 ? `${label(missing[0])}-${label(missing.at(-1))}` : label(missing[0]);
  throw new Error(`Setup stopped: ${shipped.length - missing.length} of ${shipped.length} migrations are applied; ${missing.length} are missing (${range}): ${missing.join(", ")}. ${reason}; no page settings were written, and the install is left in place for a later retry.`);
}

/** Mirror only D1-confirmed core files; retries/backfills never replace a recorded hash. */
export function observationLedgerSql(shipped, applied, directory = "migrations/core") {
  const recorded = new Set(applied);
  const literal = value => `'${value.replaceAll("'", "''")}'`;
  const statements = ["CREATE TABLE IF NOT EXISTS rer_migrations (name TEXT PRIMARY KEY, sha256 TEXT NOT NULL)"];
  for (const name of shipped.filter(name => recorded.has(name))) {
    const hash = createHash("sha256").update(readFileSync(join(directory, name))).digest("hex");
    statements.push(`INSERT OR IGNORE INTO rer_migrations (name, sha256) VALUES (${literal(name)}, ${literal(hash)})`);
  }
  return statements.join(";\n") + ";";
}
