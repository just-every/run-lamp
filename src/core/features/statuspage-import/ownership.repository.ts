/** A source record Lamp already holds from a door import of the same source,
 * with the state of the import that wrote it. */
export interface OwnedRecord { kind: string; sourceId: string; state: string }

/** The records an owner upload names that an earlier door import of the same
 * source holds outside the namespace's catch-up baseline.
 *
 * A later upload of a source with an applied import is that import's catch-up:
 * the door compares it, by kind and source id, with the applied snapshot (the
 * namespace's head and every snapshot it builds on), keeps unchanged records,
 * replaces changed ones in place or lists them as conflicts, and never imports
 * a record it holds a second time. Only provenance outside that lineage has no
 * baseline to compare with: records an undo (or rollback) kept because they were
 * changed in Lamp, and an applied import whose snapshot an erasure withdrew. Those
 * records must not be imported again as new ones. */
export async function ownedWithoutBaseline(db: D1Database, destination: string, namespace: string, identities: Array<[string, string]>): Promise<OwnedRecord[]> {
  if (!identities.length) return [];
  // Compare the sets once instead of rescanning the upload for every retained
  // record in a large subscriber import.
  const { results } = await db.prepare(`WITH RECURSIVE baseline(id) AS (
      SELECT plan FROM (SELECT head_id AS plan FROM ik_door_namespaces WHERE namespace=? UNION ALL SELECT pending_id FROM ik_door_namespaces WHERE namespace=?)
        WHERE plan IS NOT NULL AND EXISTS(SELECT 1 FROM ik_door_plan_chunks c WHERE c.plan_id=plan)
      UNION SELECT p.previous_id FROM ik_door_plans p JOIN baseline b ON p.id=b.id WHERE p.previous_id IS NOT NULL)
    SELECT DISTINCT json_extract(p.record_json,'$.sourceKind') AS kind, json_extract(p.record_json,'$.sourceId') AS sourceId, j.state
    FROM ik_provenance p JOIN ik_door_plans d ON d.job_id=p.job_id JOIN ik_jobs j ON j.id=p.job_id
    WHERE p.destination=? AND d.namespace=? AND p.reversed=0
      AND (j.state IN ('undone','rolled_back') OR d.id NOT IN (SELECT id FROM baseline))
      AND (json_extract(p.record_json,'$.sourceKind'),json_extract(p.record_json,'$.sourceId')) IN (SELECT json_extract(value,'$[0]'),json_extract(value,'$[1]') FROM json_each(?))`)
    .bind(namespace, namespace, destination, namespace, JSON.stringify(identities)).all<OwnedRecord>();
  return results;
}
