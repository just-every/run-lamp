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
    // Only unresolved native subjects mean removal. Static event subjects have
    // their own labels; subscriber identities never fall back to audit payloads.
    const sql = `SELECT a.id, a.entity_type AS entityType, a.entity_id AS entityId,
      COALESCE(CASE a.entity_type
        WHEN 'operator' THEN (SELECT email FROM oa_operators subject WHERE subject.id=a.entity_id
          AND subject.email <> 'deleted-' || lower(subject.id) || '@operator.invalid')
        WHEN 'incident-update' THEN (SELECT i.title FROM incident_updates u JOIN incidents i ON i.id=u.incident_id
          WHERE u.id=a.entity_id AND i.deleted_at IS NULL)
        WHEN 'incident-report' THEN (SELECT i.reference || ': ' || i.title FROM incidents i
          WHERE i.deleted_at IS NULL AND i.id = CASE WHEN a.action='report.waived' THEN a.entity_id
            ELSE (SELECT incident_id FROM incident_reports WHERE id=a.entity_id) END)
        WHEN 'subscriber' THEN (SELECT CASE channel WHEN 'slack' THEN 'Slack channel' WHEN 'teams' THEN 'Teams channel' ELSE destination END
          FROM subscriber_directory WHERE id=a.entity_id AND destination NOT LIKE 'deleted:%')
        WHEN 'subscriber-import' THEN 'Subscriber CSV import'
        WHEN 'incident' THEN (SELECT title FROM incidents WHERE id=a.entity_id AND deleted_at IS NULL)
        WHEN 'maintenance' THEN (SELECT title FROM maintenance WHERE id=a.entity_id)
        WHEN 'component' THEN (SELECT name FROM components WHERE id=a.entity_id)
        WHEN 'component-state-history' THEN (SELECT c.name FROM component_state_history h JOIN components c ON c.id=h.component_id WHERE h.id=a.entity_id)
        WHEN 'component-standing-claim' THEN (SELECT name FROM components WHERE id=a.entity_id)
        WHEN 'incident-component' THEN (SELECT i.reference || ': ' || i.title FROM incident_components c JOIN incidents i ON i.id=c.incident_id
          WHERE c.id=a.entity_id AND i.deleted_at IS NULL)
        WHEN 'incident-template-components' THEN (SELECT name FROM incident_templates WHERE id=a.entity_id)
        WHEN 'component-group' THEN (SELECT name FROM component_groups WHERE id=a.entity_id)
        WHEN 'alert-rule' THEN (SELECT name FROM alert_rules WHERE id=a.entity_id)
        WHEN 'alert-source' THEN (SELECT name FROM alert_sources WHERE id=a.entity_id)
        WHEN 'metric' THEN (SELECT name FROM public_metrics WHERE id=a.entity_id)
        WHEN 'vendor-dependency' THEN (SELECT name FROM vendor_dependencies WHERE id=a.entity_id)
        WHEN 'management-token' THEN (SELECT name FROM management_tokens WHERE id=a.entity_id)
        WHEN 'channel' THEN (SELECT name FROM delivery_channel_destinations WHERE id=a.entity_id AND removed_at IS NULL)
        WHEN 'social-account' THEN (SELECT name FROM social_accounts WHERE id=a.entity_id AND removed_at IS NULL)
        WHEN 'settings' THEN CASE a.entity_id WHEN 'sms' THEN 'SMS settings' WHEN 'prelaunch' THEN 'Prelaunch settings'
          WHEN 'incident-follow' THEN 'Incident subscription settings' ELSE 'Settings' END
        WHEN 'page-logo' THEN 'Page logo'
        WHEN 'operator-access' THEN 'Operator access'
        WHEN 'sign-in' THEN CASE a.entity_id WHEN 'google' THEN 'Google sign-in' WHEN 'okta' THEN 'Okta sign-in' ELSE 'Sign-in settings' END
        WHEN 'follow-up' THEN 'Follow-up: ' || replace(substr(a.entity_id,1,instr(a.entity_id,':')-1),'-',' ')
        WHEN 'chat-desk' THEN CASE json_extract(a.payload_json,'$.event')
          WHEN 'published' THEN (SELECT i.reference || ': ' || i.title FROM incident_updates u JOIN incidents i ON i.id=u.incident_id
            WHERE u.id=a.entity_id AND i.deleted_at IS NULL)
          WHEN 'linked' THEN CASE a.entity_id WHEN 'slack' THEN 'Slack chat identity' WHEN 'teams' THEN 'Teams chat identity' ELSE 'Chat identity' END
          ELSE (SELECT CASE transport WHEN 'slack' THEN 'Slack chat identity' ELSE 'Teams chat identity' END FROM chat_links WHERE id=a.entity_id) END
        ELSE COALESCE(json_extract(a.payload_json,'$.recordName'), 'Audit record')
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
