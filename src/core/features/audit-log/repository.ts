import { createUlid, nowIso } from '../../shared/ids';
export interface AuditFilter { actorId?: string; action?: string; from?: string; until?: string }
export interface AuditEntry { id: string; entityType: string; entityId: string; entityName: string; action: string; actorId: string | null; actorName: string; reason: string | null; createdAt: string }

/** Read identities at display time so erasure never leaves a copied name behind. */
export function createAuditLogRepository(db: D1Database) {
  function query(filter: AuditFilter) {
    const conditions: string[] = [], values: string[] = [];
    for (const [key, column, comparison] of [["actorId", "a.operator_id", "="], ["action", "a.action", "="], ["from", "a.created_at", ">="], ["until", "a.created_at", "<"]] as const) {
      if (filter[key]) { conditions.push(`${column} ${comparison} ?`); values.push(filter[key]!); }
    }
    const sql = `SELECT a.id, a.entity_type AS entityType, a.entity_id AS entityId,
      COALESCE(CASE a.entity_type
        WHEN 'operator' THEN (SELECT email FROM oa_operators subject WHERE subject.id=a.entity_id
          AND subject.email <> 'deleted-' || lower(subject.id) || '@operator.invalid')
        WHEN 'incident-update' THEN (SELECT i.title FROM incident_updates u JOIN incidents i ON i.id=u.incident_id
          WHERE u.id=a.entity_id AND i.deleted_at IS NULL)
        WHEN 'incident' THEN (SELECT title FROM incidents WHERE id=a.entity_id AND deleted_at IS NULL)
        WHEN 'maintenance' THEN (SELECT title FROM maintenance WHERE id=a.entity_id)
        WHEN 'component' THEN (SELECT name FROM components WHERE id=a.entity_id)
        WHEN 'component-group' THEN (SELECT name FROM component_groups WHERE id=a.entity_id)
        WHEN 'alert-rule' THEN (SELECT name FROM alert_rules WHERE id=a.entity_id)
        ELSE json_extract(a.payload_json,'$.recordName')
      END, 'Removed item') AS entityName, a.action,
      a.operator_id AS actorId,
      CASE WHEN a.operator_id IS NULL THEN 'System'
        WHEN o.id IS NULL OR o.email = 'deleted-' || lower(o.id) || '@operator.invalid' THEN 'Erased operator'
        ELSE COALESCE(NULLIF(trim(o.display_name), ''), o.email) END AS actorName,
      a.reason, a.created_at AS createdAt
      FROM audit_entries a LEFT JOIN oa_operators o ON o.id = a.operator_id
      ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY a.created_at DESC, a.id DESC`;
    return { sql, values };
  }
  return {
    async chatDesk(operator: string, event: string, entity: string) {
      const at = nowIso();
      await db.prepare("INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at) VALUES(?,'chat-desk',?,'chat-desk',?,?,?,?)").bind(createUlid(),entity,operator,JSON.stringify({event}),at,at).run();
    },
    async list(filter: AuditFilter, limit = 50, offset = 0) {
      const { sql, values } = query(filter);
      return (await db.prepare(`${sql} LIMIT ? OFFSET ?`).bind(...values, limit + 1, offset).all<AuditEntry>()).results;
    },
    async export(filter: AuditFilter) {
      const { sql, values } = query(filter);
      return (await db.prepare(sql).bind(...values).all<AuditEntry>()).results;
    },
    async options() {
      const [actions, actors] = await db.batch([
        db.prepare("SELECT DISTINCT action FROM audit_entries ORDER BY action"),
        db.prepare(`SELECT DISTINCT a.operator_id AS id,
          CASE WHEN o.id IS NULL OR o.email = 'deleted-' || lower(o.id) || '@operator.invalid' THEN 'Erased operator' ELSE COALESCE(NULLIF(trim(o.display_name), ''), o.email) END AS name
          FROM audit_entries a LEFT JOIN oa_operators o ON o.id = a.operator_id WHERE a.operator_id IS NOT NULL ORDER BY name, id`),
      ]);
      return { actions: (actions.results as Array<{ action: string }>).map(row => row.action), actors: actors.results as Array<{ id: string; name: string }> };
    },
  };
}
