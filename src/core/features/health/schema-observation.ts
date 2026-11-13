/** Read-only installed inventory, independent of liveness and expected migrations. */
type Reason = "db_missing" | "ledger_missing" | "read_error" | "read_timeout" | "malformed_rows" | "row_limit";

export interface SchemaObservation {
  version: 1;
  ledger: "rer_migrations";
  binding: "DB";
  observedAt: string;
  state: "available" | "unavailable";
  completeCount: number | null;
  inventorySha256: string | null;
  partialCount: number | null;
  reason: Reason | null;
}

const ROW_LIMIT = 2048;
const READ_TIMEOUT_MS = 500;

export async function observeSchema(database?: D1Database): Promise<SchemaObservation> {
  const unavailable = (reason: Reason): SchemaObservation => ({
    version: 1, ledger: "rer_migrations", binding: "DB", observedAt: new Date().toISOString(),
    state: "unavailable", completeCount: null, inventorySha256: null, partialCount: null, reason,
  });
  if (!database) return unavailable("db_missing");

  async function read(): Promise<SchemaObservation> {
    try {
      const exists = await database!.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'rer_migrations' LIMIT 1").first();
      if (!exists) return unavailable("ledger_missing");
      // Bound both row count and returned field sizes. An oversized value stays
      // invalid, never silently becomes a truncated successful inventory.
      const result = await database!.prepare("SELECT substr(name, 1, 1025) AS name, substr(sha256, 1, 65) AS sha256 FROM rer_migrations LIMIT 2049").all<{ name: unknown; sha256: unknown }>();
      if (!result.success || !Array.isArray(result.results)) return unavailable("read_error");
      if (result.results.length > ROW_LIMIT) return unavailable("row_limit");
      const complete: [string, string][] = [];
      const names = new Set<string>();
      let partialCount = 0;
      for (const row of result.results) {
        if (typeof row.name !== "string" || !row.name || row.name.length > 1024 || /[\u0000-\u001f\u007f]/.test(row.name)
          || typeof row.sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(row.sha256) || names.has(row.name)) return unavailable("malformed_rows");
        names.add(row.name);
        // Platform's actual interim identities are <file.sql>#<start>-<end>.
        const marker = /^[^#]+\.sql#(\d+)-(\d+)$/.exec(row.name);
        if (marker) {
          const start = Number(marker[1]), end = Number(marker[2]);
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end <= start) return unavailable("malformed_rows");
          partialCount++;
        }
        else if (/^[^#]+\.sql$/.test(row.name)) complete.push([row.name, row.sha256.toLowerCase()]);
        else return unavailable("malformed_rows");
      }
      complete.sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
      const bytes = new TextEncoder().encode(JSON.stringify(complete));
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const inventorySha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      return {
        version: 1, ledger: "rer_migrations", binding: "DB", observedAt: new Date().toISOString(),
        state: "available", completeCount: complete.length, inventorySha256, partialCount, reason: null,
      };
    } catch {
      return unavailable("read_error");
    }
  }

  // D1 offers no per-query abort. The SQL itself is bounded; a slow binding
  // cannot hold the public health answer indefinitely or expose its exception.
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      read(),
      new Promise<SchemaObservation>(resolve => { timer = setTimeout(() => resolve(unavailable("read_timeout")), READ_TIMEOUT_MS); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
