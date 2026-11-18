import type { Accounting } from "../rows.ts";
import type { SourceData } from "../source.ts";
import type { SorryComponent } from "./schema.ts";

/** A Sorry parent row is deliberately shown once, as a group; Move in explains it as a reconciliation, not a warning. */
export const SORRY_PARENT_AS_GROUP = "Sorry parent is represented once as its children's visual group.";

const states = { operational: "operational", degraded: "degraded_performance", "partially-degraded": "partial_outage", "under-maintenance": "under_maintenance" } as const;

export function normalizeSorryComponents(rows: SorryComponent[], accounting: Accounting[]): Pick<SourceData, "groups" | "components"> {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const parentIds = new Set(rows.flatMap((row) => row.parent_id ? [row.parent_id] : []));
  function ancestors(row: SorryComponent): SorryComponent[] {
    const result: SorryComponent[] = [], seen = new Set([row.id]);
    let parent = row.parent_id;
    while (parent) {
      if (seen.has(parent) || seen.size > 32) throw new Error("Sorry component hierarchy contains a cycle or exceeds 32 levels.");
      seen.add(parent);
      const next = byId.get(parent);
      if (!next) throw new Error("A Sorry component parent is missing from the saved responses.");
      result.unshift(next); parent = next.parent_id;
    }
    return result;
  }
  const groups: SourceData["groups"] = [], components: SourceData["components"] = [];
  for (const row of rows) {
    const parents = ancestors(row);
    const source_metadata = { provider: "Sorry", id: row.id, name: row.name, description: row.description ?? null, state: row.state,
      position: row.position ?? null, parentId: row.parent_id ?? null, ancestorIds: parents.map(parent => parent.id),
      createdAt: row.created_at, updatedAt: row.updated_at ?? null,
      ...(row.metrics_summary != null ? { aggregateMetrics: row.metrics_summary } : row.metrics != null ? { aggregateMetrics: row.metrics } : {}) };
    if (parentIds.has(row.id)) {
      groups.push({ id: row.id, name: row.name, parent_id: row.parent_id, source_metadata, description: row.description, components: rows.filter((child) => child.parent_id === row.id).map((child) => child.id), position: row.position ?? rows.indexOf(row), created_at: row.created_at, updated_at: row.updated_at });
      accounting.push({ kind: "group", sourceId: row.id, name: row.name, outcome: "changed", reason: SORRY_PARENT_AS_GROUP });
    }
    else components.push({ id: row.id, name: row.name, source_metadata, description: row.description, group_id: row.parent_id, position: row.position ?? rows.indexOf(row), status: states[row.state], created_at: row.created_at, updated_at: row.updated_at });
  }
  return { groups, components };
}
