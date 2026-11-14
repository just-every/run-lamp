import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { createDatabase } from "../../platform/db/client";
import { incidents } from "../../shared/schema";
import type { IncidentLifecycle } from "../../shared/domain";

export interface IncidentPageQuery {
  limit: number;
  lifecycle?: IncidentLifecycle;
  group?: "active" | "resolved";
  cursor?: { openedAt: string; id: string };
}

/** Page parent records before loading any children. A unique tie-breaker keeps
 * equal opening times reachable and a cursor avoids scanning earlier pages. */
export async function listIncidentPage(binding: D1Database, query: IncidentPageQuery) {
  const db = createDatabase(binding);
  const [rows, counts] = await Promise.all([
    db.select().from(incidents).where(and(
      isNull(incidents.deletedAt),
      query.lifecycle ? eq(incidents.lifecycle, query.lifecycle) : undefined,
      query.group === "active" ? sql`${incidents.lifecycle} <> 'Resolved'` : undefined,
      query.group === "resolved" ? eq(incidents.lifecycle, "Resolved") : undefined,
      query.cursor ? sql`(${incidents.openedAt}, ${incidents.id}) < (${query.cursor.openedAt}, ${query.cursor.id})` : undefined,
    )).orderBy(desc(incidents.openedAt), desc(incidents.id)).limit(query.limit + 1).all(),
    binding.prepare("SELECT lifecycle, total FROM incident_list_counts").all<{ lifecycle: IncidentLifecycle; total: number }>(),
  ]);
  const byLifecycle = new Map(counts.results.map(row => [row.lifecycle, row.total]));
  const resolvedTotal = byLifecycle.get("Resolved") ?? 0;
  const activeTotal = counts.results.filter(row => row.lifecycle !== "Resolved").reduce((sum, row) => sum + row.total, 0);
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  return {
    incidents: page, limit: query.limit, activeTotal, resolvedTotal,
    total: query.lifecycle ? byLifecycle.get(query.lifecycle) ?? 0 : query.group === "active" ? activeTotal : query.group === "resolved" ? resolvedTotal : activeTotal + resolvedTotal,
    nextCursor: rows.length > query.limit && last ? `${last.openedAt}|${last.id}` : null,
  };
}
