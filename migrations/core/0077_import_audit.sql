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
