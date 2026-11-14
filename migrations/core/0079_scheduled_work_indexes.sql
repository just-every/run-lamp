-- Cron must seek eligible work instead of revisiting accumulated subscriber
-- and incident history. Additive indexes preserve the existing records/ledgers.
CREATE INDEX IF NOT EXISTS subscribers_held_created_idx
  ON subscribers(state, deactivation_reason, created_at);
CREATE INDEX IF NOT EXISTS subscribers_held_deactivated_idx
  ON subscribers(state, deactivation_reason, deactivated_at);
CREATE INDEX IF NOT EXISTS component_history_observations_idx
  ON component_state_history(changed_at, created_at) WHERE cause_type <> 'correction';
CREATE INDEX IF NOT EXISTS incidents_active_work_idx
  ON incidents(id) WHERE deleted_at IS NULL AND lifecycle <> 'Resolved';
CREATE INDEX IF NOT EXISTS incidents_unresolved_work_idx
  ON incidents(id) WHERE resolved_at IS NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS incidents_report_due_idx
  ON incidents(peak_impact, resolved_at, id) WHERE lifecycle = 'Resolved' AND deleted_at IS NULL;
