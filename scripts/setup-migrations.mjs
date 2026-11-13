import { readdirSync } from "node:fs";

// Wrangler's own ledger for the core migrations (no custom migrations_table is set for migrations/core).
export const coreLedgerQuery = "SELECT name FROM d1_migrations ORDER BY name";

export function shippedMigrations(directory = "migrations/core") {
  return readdirSync(directory).filter(name => name.endsWith(".sql")).sort();
}

/** The names in `wrangler d1 execute --json` output for coreLedgerQuery. */
export function ledgerNames(output) {
  let parsed;
  try { parsed = JSON.parse(output); } catch { throw new Error("Setup could not read the migration ledger back from D1: wrangler did not return JSON."); }
  const results = (Array.isArray(parsed) ? parsed : [parsed]).flatMap(entry => entry?.results ?? []);
  return results.map(row => row.name);
}

/** Setup is complete only when every shipped migration is recorded as applied. */
export function assertMigrationsApplied(shipped, applied) {
  const recorded = new Set(applied);
  const missing = shipped.filter(name => !recorded.has(name));
  if (!missing.length) return;
  const label = name => name.replace(/_.*$/, "");
  const range = missing.length > 1 ? `${label(missing[0])}-${label(missing.at(-1))}` : label(missing[0]);
  throw new Error(`Setup stopped: ${shipped.length - missing.length} of ${shipped.length} migrations are applied; ${missing.length} are missing (${range}): ${missing.join(", ")}. The install is left as it is; run setup again to apply them.`);
}
