-- Reinstated maintenance can be cancelled again. The state-guarded transaction
-- admits one notice per cancellation; the other lifecycle notices stay unique.
DROP INDEX maintenance_notices_one_transition_idx;
CREATE UNIQUE INDEX maintenance_notices_one_transition_idx ON maintenance_notices(maintenance_id, kind)
  WHERE kind IN ('scheduled', 'reminder', 'started', 'completed');
