import type { Accounting } from "../rows.ts";
import type { SourceIncident, SourceUpdate } from "../source.ts";
import { canonicalJson, sha256 } from "../../../../../modules/import-kit/src/d1/index.ts";
import type { Json } from "../../../../../modules/import-kit/src/types.ts";
import type { SorryNotice, SorryUpdate } from "./schema.ts";

const incidentStates = { investigating: "investigating", identified: "identified", recovering: "monitoring", resolved: "resolved", false_alarm: "resolved" } as const;
const maintenanceStates = { scheduled: "scheduled", underway: "in_progress", complete: "completed", cancelled: "completed" } as const;

/** A management update doesn't document authored lifecycle. Text/time remain
 * exact; incident impact is bounded separately by the notice's began/ended times. */
export function normalizeSorryNotice(row: SorryNotice, updates: SorryUpdate[], isPublic: boolean, componentScope: Map<string, string[]>, accounting: Accounting[]): SourceIncident | undefined {
  const kind = row.type === "planned" ? "maintenance" : "incident";
  const refuse = (reason: string) => { accounting.push({ kind, sourceId: row.id, name: row.subject, outcome: "rejected", reason }); return undefined; };
  const supplied = row.components?.map((component) => component.id) ?? row.component_ids;
  if (!supplied) return refuse("Sorry affected component history is absent; capture notice details with include=components,updates.");
  if (row.components && row.component_ids && canonicalJson([...supplied].sort()) !== canonicalJson([...row.component_ids].sort())) return refuse("Sorry component_ids and included components disagree.");
  if (supplied.some((id) => !componentScope.has(id))) return refuse("A Sorry affected component is absent from the saved component list.");
  // A parent alone names its whole group. Beside explicit members, it is
  // context for those members, not evidence that their siblings were affected.
  const listed = new Set(supplied);
  const selected = [...new Set(supplied.flatMap(id => {
    const leaves = componentScope.get(id)!;
    const group = !(leaves.length === 1 && leaves[0] === id);
    return group && leaves.some(leaf => listed.has(leaf)) ? [] : leaves;
  }))];
  if (!updates.length) return refuse("Sorry notice has no progress update history; no publication time or message was invented.");
  const ids = new Set<string>();
  let projected = false;
  const normalized: SourceUpdate[] = [];
  const ordered = [...updates].sort((a, b) => a.created_at.localeCompare(b.created_at) || (a.id ?? "").localeCompare(b.id ?? "") || a.content.localeCompare(b.content));
  const state = row.type === "general" ? "resolved" : row.type === "planned" ? maintenanceStates[row.state as keyof typeof maintenanceStates] : incidentStates[row.state as keyof typeof incidentStates];
  if (!state) return refuse("Sorry notice has an unsupported lifecycle state.");
  let resolvedAt = row.ended_at ?? (row.type === "general" ? ordered.at(-1)!.created_at : undefined);
  const notes: string[] = [];
  if (row.ended_at && row.began_at && Date.parse(row.ended_at) < Date.parse(row.began_at)) {
    // Only an authored resolution is evidence of recovery. A projected
    // management lifecycle derived from the invalid ended_at cannot repair it.
    const closing = row.type === "unplanned" && state === "resolved"
      ? updates.filter(update => update.state === "resolved" && Date.parse(update.created_at) >= Date.parse(row.began_at!))
        .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)).at(-1)
      : undefined;
    if (!closing) return refuse("Sorry notice's actual end precedes its start.");
    resolvedAt = closing.created_at;
    notes.push(`Sorry notice's ended_at (${row.ended_at}) precedes its began_at (${row.began_at}); its end is taken from its resolved update at ${resolvedAt}. Every message and publication time is retained.`);
  }
  for (const update of ordered) {
    const id = update.id ?? `at-${sha256(canonicalJson({ created_at: update.created_at, state: update.state ?? null, content: update.content } as Json))}`;
    if (ids.has(id)) throw new Error("Sorry notice repeats a progress update identity.");
    ids.add(id);
    let state: SourceUpdate["status"] | undefined;
    if (row.type === "general") state = "resolved";
    else if (update.state) state = row.type === "planned" ? maintenanceStates[update.state as keyof typeof maintenanceStates] : incidentStates[update.state as keyof typeof incidentStates];
    else if (!isPublic) {
      projected = true;
      if (row.type === "planned") state = resolvedAt && Date.parse(update.created_at) >= Date.parse(resolvedAt) ? "completed" : row.began_at && Date.parse(update.created_at) >= Date.parse(row.began_at) ? "in_progress" : "scheduled";
      else state = resolvedAt && Date.parse(update.created_at) >= Date.parse(resolvedAt) ? "resolved" : "investigating";
    }
    if (!state) return refuse("Sorry progress history has an unsupported or missing lifecycle state; no source state was invented.");
    normalized.push({ id: `${row.id}:${id}`, status: state, ...(!update.state ? { authored_status: null } : {}), body: update.content, created_at: update.created_at, display_at: update.created_at,
      ...(row.type === "unplanned" ? { affected_components: selected.map((code) => ({ code, new_status: state === "resolved" ? "operational" as const : "degraded_performance" as const })) } : {}) });
  }
  if (row.type === "planned" && (!row.begins_at || !row.ends_at || Date.parse(row.ends_at) <= Date.parse(row.begins_at))) return refuse("Sorry planned notice has no valid documented begins_at/ends_at window.");
  if (row.type === "unplanned" && !row.began_at) return refuse("Sorry incident has no documented began_at instant.");
  if (row.latest_update) {
    const latest = ordered.at(-1)!;
    if (row.latest_update.content !== latest.content || Date.parse(row.latest_update.created_at) !== Date.parse(latest.created_at)) throw new Error("Sorry latest_update and full progress history disagree.");
  }
  if (row.type === "general") notes.push("General Sorry notice is carried as a resolved informational incident; its messages and original times are retained without component outage claims.");
  else if (projected) notes.push("Sorry management updates omit authored lifecycle states. Display lifecycle is projected from documented notice start/end times; every message and publication instant is retained. Original authored lifecycle is unavailable.");
  else if (row.state === "false_alarm") notes.push("Sorry false alarm is represented as resolved; full source history remains retained.");
  if (notes.length) accounting.push({ kind, sourceId: row.id, name: row.subject, outcome: "changed", reason: notes.join(" ") });
  return { id: row.id, name: row.subject, status: row.type === "planned" && row.state === "cancelled" ? "cancelled" : state, impact: row.type === "general" ? "none" : row.type === "planned" ? "maintenance" : "minor",
    created_at: row.type === "planned" ? row.created_at : row.began_at ?? row.created_at,
    resolved_at: resolvedAt,
    ...(row.type === "planned" ? { scheduled_for: row.begins_at, scheduled_until: row.ends_at } : {}),
    components: [...new Set(selected)].map((id) => ({ id })), incident_updates: normalized };
}
