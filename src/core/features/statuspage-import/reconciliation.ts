import type { ImportPlan } from "../../../../modules/import-kit/src/d1/index.ts";
import { SORRY_PARENT_AS_GROUP } from "./sorry/groups.ts";
import type { Accounting } from "./rows.ts";

/** How a Sorry page's component rows arrive: a parent row is shown once, as its children's group, so the
 * source's row count and the native component count differ by exactly the number of groups. */
export interface RowReconciliation {
  sourceRows: number;
  components: number;
  groups: number;
  /** The source rows that became groups. */
  groupRows: { sourceId: string; name: string }[];
  /** e.g. "16 source component rows -> 14 components + 2 groups (a parent row is shown once, as its children's group)". */
  statement: string;
  effects: { total: number; byKind: Record<string, number>; statement: string };
}

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const effectLabels: Record<string, [string, string]> = { component: ["component", "components"], group: ["group", "groups"], incident: ["incident", "incidents"], maintenance: ["maintenance window", "maintenance windows"], subscriber: ["subscriber", "subscribers"], template: ["template", "templates"], source: ["source record", "source records"] };

/** The source-row to native-record reconciliation of a Sorry plan; none for another source, or a page without parents. */
export function sorryRowReconciliation(plan: ImportPlan): RowReconciliation | undefined {
  if (plan.namespace !== "sorry") return undefined;
  const entries = plan.entries.filter(entry => !entry.erased);
  const accounting = (entry: ImportPlan["entries"][number]) => (entry.source.payload as { accounting?: Accounting[] }).accounting ?? [];
  const groupEntries = entries.filter(entry => entry.source.kind === "group");
  const groupRows = groupEntries.map(entry => ({ sourceId: entry.source.sourceId, name: accounting(entry).find(item => item.kind === "group")?.name ?? entry.source.sourceId }));
  if (!groupRows.length) return undefined;
  const components = entries.filter(entry => entry.source.kind === "component").length, groups = groupRows.length, sourceRows = components + groups;
  const byKind: Record<string, number> = {};
  for (const entry of entries) for (const effect of entry.effects) byKind[effect.targetKind] = (byKind[effect.targetKind] ?? 0) + 1;
  const total = Object.values(byKind).reduce((sum, count) => sum + count, 0);
  const parts = Object.keys(effectLabels).filter(kind => byKind[kind]).map(kind => [kind, byKind[kind]] as const).map(([kind, count]) => { const [one, many] = effectLabels[kind] ?? [kind, `${kind}s`]; return count === 1 ? `1 ${one}` : `${count} ${many}`; });
  return {
    sourceRows, components, groups, groupRows,
    statement: `${sourceRows} source component rows -> ${plural(components, "component")} + ${plural(groups, "group")} (a parent row is shown once, as its children's group)`,
    effects: { total, byKind, statement: `${plural(total, "effect")}: ${parts.join(", ")}. A parent row is one group effect, not a group plus a component, so the total is ${plural(groups, "effect")} lower than importing each parent twice.` },
  };
}

export const isIntentionalParentGroup = (item: Accounting) => item.kind === "group" && item.reason.endsWith(SORRY_PARENT_AS_GROUP);
