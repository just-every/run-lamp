import { loadPlans } from "../../../../modules/import-kit/src/d1/plans";
import { canonicalJson, sha256 } from "../../../../modules/import-kit/src/d1/index";
import type { Json } from "../../../../modules/import-kit/src/types";
import { moveInPlan } from "./door-plan";
import { stableId, type NativeValue, type Row } from "./rows";

interface UpdateWording {
  id: string;
  incidentId: string;
  customerImpact: string;
  affectedAudience: string;
  whatStillWorks: string;
  details: string;
  publishedAt: string;
  nextUpdateAt: string | null;
  lifecycle: string;
  authorOperatorId: string;
  correctsUpdateId: string | null;
  isRetroactive: boolean;
}

/** These are the source formats already retained by both import doors. Using
 * their source update identities also supports journals made before this fix. */
function retainedBodies(namespace: string, sourceId: string, raw: Record<string, unknown>): Array<{ id: string; body: string }> {
  if (namespace === "statusio" && Array.isArray(raw.messages)) {
    return raw.messages.flatMap(message => {
      if (typeof message?._id !== "string" || typeof message.datetime !== "string" || typeof message.details !== "string") return [];
      return [{
        id: stableId(`incident-update:${sourceId}:${message._id}`, message.datetime, namespace),
        body: (message.details.trim() || String(raw.name ?? "")).toWellFormed(),
      }];
    });
  }
  const updates = namespace === "statuspage" ? raw.incident_updates : namespace === "sorry" ? raw.updates : undefined;
  if (!Array.isArray(updates)) return [];
  return updates.flatMap((update: Record<string, unknown>) => {
    if (!update || typeof update !== "object" || Array.isArray(update)) return [];
    const content = namespace === "statuspage" ? update.body : update.content;
    const instant = namespace === "statuspage" ? update.display_at ?? update.created_at : update.created_at;
    if ((typeof content !== "string" && content !== null) || typeof instant !== "string" || !Number.isFinite(Date.parse(instant))) return [];
    const sourceUpdateId = namespace === "statuspage" ? update.id : `${sourceId}:${update.id ?? `at-${sha256(canonicalJson({ created_at: update.created_at, state: update.state ?? null, content: update.content } as Json))}`}`;
    if (typeof sourceUpdateId !== "string") return [];
    const fallback = namespace === "statuspage" ? raw.name : raw.subject;
    const body = (typeof content === "string" ? content.trim() : "") || (typeof fallback === "string" ? fallback : "");
    return [{ id: stableId(`incident-update:${sourceUpdateId}`, instant, namespace), body: body.toWellFormed() }];
  });
}

/** Native incident wording is bounded. The applied import journal already
 * retains the source message without that bound, including after a conditional
 * undo preserves an owner's incident. Only unchanged imported updates receive
 * that read projection; this never changes native rows or sealed undo values. */
export async function projectImportedIncidentUpdates<T extends UpdateWording>(db: D1Database, updates: T[]): Promise<T[]> {
  const ids = [...new Set(updates.filter(update => update.isRetroactive).map(update => update.incidentId))];
  if (!ids.length) return updates;
  const applied = (await db.prepare(`SELECT p.job_id,p.ordinal,p.target_id
    FROM ik_provenance p
    JOIN statuspage_import_targets t ON t.kind=p.target_kind AND t.id=p.target_id
    WHERE p.reversed=0 AND p.destination='lamp' AND p.target_kind='incident'
    AND p.target_id IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(ids)).all<{ job_id: string; ordinal: number; target_id: string }>()).results;
  if (!applied.length) return updates;
  // Load each journal once: many incidents can belong to one chunked plan.
  const jobs = (await db.prepare("SELECT id,plan_json FROM ik_jobs WHERE id IN (SELECT value FROM json_each(?))").bind(JSON.stringify([...new Set(applied.map(row => row.job_id))])).all<{ id: string; plan_json: string }>()).results;
  const plans = new Map([...(await loadPlans(jobs, db as never))].map(([id, plan]) => [id, moveInPlan(plan)]));
  const bodies = new Map<string, { body: string; expected: Row; incidentId: string }>();
  for (const row of applied) {
    const entry = plans.get(row.job_id)?.entries[row.ordinal];
    if (!entry || entry.erased) continue;
    const raw = (entry.source.payload as { raw?: Record<string, unknown> }).raw;
    if (!raw) continue;
    const retained = retainedBodies(entry.source.namespace, entry.source.sourceId, raw);
    const effect = entry.effects.find(effect => effect.targetKind === "incident" && effect.targetId === row.target_id);
    const native = (effect?.value as unknown as NativeValue | undefined)?.tables.incident_updates ?? [];
    for (const source of retained) {
      const expected = native.find(update => update.id === source.id);
      if (expected && expected.is_retroactive === 1) bodies.set(source.id, { body: source.body, expected, incidentId: row.target_id });
    }
  }
  return updates.map(update => {
    const source = bodies.get(update.id);
    const unchanged = source && ([
      ["customerImpact", "customer_impact"], ["affectedAudience", "affected_audience"], ["whatStillWorks", "what_still_works"], ["details", "details"],
      ["publishedAt", "published_at"], ["nextUpdateAt", "next_update_at"], ["lifecycle", "lifecycle"], ["authorOperatorId", "author_operator_id"], ["correctsUpdateId", "corrects_update_id"],
    ] as const).every(([field, column]) => update[field] === source.expected[column]);
    return source && unchanged && update.isRetroactive && update.incidentId === source.incidentId
      ? { ...update, customerImpact: source.body, details: "" } : update;
  });
}
