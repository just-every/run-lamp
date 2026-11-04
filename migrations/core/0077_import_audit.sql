-- Source history keeps its original times. Audit records when Lamp writes it,
-- inside that same transaction, even when the plan was reviewed minutes earlier.
DROP TRIGGER component_state_audit;
CREATE TRIGGER component_state_audit AFTER INSERT ON component_state_history BEGIN
  INSERT OR IGNORE INTO audit_entries(id, entity_type, entity_id, action, operator_id, payload_json, created_at, updated_at)
  VALUES ('state-history/' || NEW.id || CASE WHEN EXISTS(SELECT 1 FROM audit_entries WHERE id='state-history/' || NEW.id) THEN '/' || lower(hex(randomblob(16))) ELSE '' END, 'component', NEW.component_id, 'state-changed', NEW.operator_id,
    json_object('previousState', NEW.previous_state, 'newState', NEW.new_state, 'causeType', NEW.cause_type, 'causeId', NEW.cause_id,
      'recordName', (SELECT name FROM components WHERE id=NEW.component_id)),
    strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

-- Both owner-session and Business doors commit their retained approval before
-- applying any record. Mirror that fact atomically without copying an identity.
CREATE TRIGGER move_in_approval_audit AFTER INSERT ON ik_door_approvals BEGIN
  INSERT INTO audit_entries(id, entity_type, entity_id, action, operator_id, payload_json, created_at, updated_at)
  SELECT 'import-approval/' || NEW.plan_id, 'import', NEW.plan_id, 'import-approved',
    (SELECT id FROM oa_operators WHERE email=NEW.owner),
    json_object('recordName', CASE namespace WHEN 'sorry' THEN 'Sorry' WHEN 'statuspage' THEN 'Statuspage' WHEN 'betterstack' THEN 'Better Stack' WHEN 'instatus' THEN 'Instatus' ELSE namespace END || ' import', 'approvedAt', NEW.approved_at),
    strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')
  FROM ik_door_plans WHERE id=NEW.plan_id;
END;
