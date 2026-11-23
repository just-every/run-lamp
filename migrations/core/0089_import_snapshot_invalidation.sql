-- The custody revision also tracks private imports, guards and journal storage.
-- Schedule the public projection from apply progress and committed plan changes.
DROP TRIGGER IF EXISTS import_projection_snapshot_dirty;
DROP TRIGGER IF EXISTS import_projection_snapshot_job_state;
DROP TRIGGER IF EXISTS import_projection_snapshot_job_delete;
DROP TRIGGER IF EXISTS import_projection_snapshot_reverse;
DROP TRIGGER IF EXISTS import_projection_snapshot_provenance_delete;
DROP TRIGGER IF EXISTS import_projection_snapshot_target_insert;
DROP TRIGGER IF EXISTS import_projection_snapshot_target_delete;

-- Finding a public journal entry must not scan a subscriber-only job.
CREATE INDEX import_projection_public_provenance ON ik_provenance(job_id, ordinal)
WHERE destination = 'lamp' AND reversed = 0
  AND target_kind IN ('incident','maintenance','component','group');

-- Sorry's history redirects are the one public compatibility artifact whose
-- presence can depend on a job with only non-public targets.
CREATE VIEW import_projection_sorry_jobs AS
SELECT j.id, j.state FROM ik_jobs j
WHERE j.destination = 'lamp' AND (
  j.namespace = 'sorry' OR EXISTS (
    SELECT 1 FROM ik_door_plans d WHERE d.job_id = j.id AND d.namespace = 'sorry'
  )
);

CREATE VIEW import_projection_sorry_targets AS
SELECT p.job_id, p.id AS provenance_id, p.ordinal, p.target_kind, p.target_id
FROM ik_provenance p
JOIN import_projection_sorry_jobs j ON j.id = p.job_id
JOIN statuspage_import_targets t ON t.kind = p.target_kind AND t.id = p.target_id
WHERE p.destination = 'lamp' AND p.reversed = 0;

CREATE TRIGGER import_projection_snapshot_job_update
AFTER UPDATE OF checkpoint, plan_json, state ON ik_jobs
WHEN NEW.destination = 'lamp' AND (
  -- Apply, including catch-up, advances the checkpoint once per batch.
  -- Statuspage also retains original component and group IDs.
  ((NEW.checkpoint > OLD.checkpoint OR NEW.plan_json IS NOT OLD.plan_json) AND EXISTS (
    SELECT 1 FROM ik_provenance p INDEXED BY import_projection_public_provenance
    WHERE p.job_id = NEW.id AND p.reversed = 0 AND p.destination = 'lamp'
      AND p.target_kind IN ('incident','maintenance','component','group')
      AND p.ordinal >= CASE WHEN NEW.plan_json IS NOT OLD.plan_json THEN 0 ELSE OLD.checkpoint END
  ))
  -- The first applied target establishes compatibility even before completion.
  OR (NEW.checkpoint > OLD.checkpoint AND EXISTS (
    SELECT 1 FROM import_projection_sorry_targets t WHERE t.job_id = NEW.id
  ) AND NOT EXISTS (
    SELECT 1 FROM import_projection_sorry_targets t
    WHERE t.job_id = NEW.id AND t.ordinal < OLD.checkpoint
  ))
  -- A completed Sorry job can own the redirect without any remaining target.
  OR ((NEW.state = 'completed') <> (OLD.state = 'completed')
    AND EXISTS (SELECT 1 FROM import_projection_sorry_jobs j WHERE j.id = NEW.id)
    AND NOT EXISTS (SELECT 1 FROM import_projection_sorry_targets t WHERE t.job_id = NEW.id))
) BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

CREATE TRIGGER import_projection_snapshot_job_delete BEFORE DELETE ON ik_jobs
WHEN OLD.state = 'completed'
  AND EXISTS (SELECT 1 FROM import_projection_sorry_jobs j WHERE j.id = OLD.id) BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

CREATE TRIGGER import_projection_snapshot_reverse AFTER UPDATE OF reversed ON ik_provenance
WHEN OLD.destination = 'lamp' AND OLD.reversed = 0 AND NEW.reversed <> 0
  AND OLD.target_kind IN ('incident','maintenance','component','group') BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

CREATE TRIGGER import_projection_snapshot_provenance_delete BEFORE DELETE ON ik_provenance
WHEN OLD.destination = 'lamp' AND OLD.reversed = 0 AND (
  OLD.target_kind IN ('incident','maintenance','component','group')
  OR (EXISTS (
    SELECT 1 FROM import_projection_sorry_jobs j
    JOIN import_projection_sorry_targets t ON t.job_id = j.id
    WHERE t.provenance_id = OLD.id AND j.state <> 'completed'
  ) AND NOT EXISTS (
    SELECT 1 FROM import_projection_sorry_targets t WHERE t.job_id = OLD.job_id AND t.provenance_id <> OLD.id
  ))
) BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

CREATE TRIGGER import_projection_snapshot_target_insert AFTER INSERT ON statuspage_import_targets
WHEN NEW.kind IN ('incident','maintenance') BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

CREATE TRIGGER import_projection_snapshot_target_delete AFTER DELETE ON statuspage_import_targets
WHEN OLD.kind IN ('incident','maintenance') BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

CREATE TRIGGER import_projection_snapshot_sorry_last_target BEFORE DELETE ON statuspage_import_targets
WHEN OLD.kind NOT IN ('incident','maintenance') AND EXISTS (
  SELECT 1 FROM ik_provenance p JOIN import_projection_sorry_jobs j ON j.id = p.job_id
  WHERE p.destination = 'lamp' AND p.reversed = 0 AND p.target_kind = OLD.kind AND p.target_id = OLD.id
    AND j.state <> 'completed' AND NOT EXISTS (
      SELECT 1 FROM import_projection_sorry_targets t WHERE t.job_id = p.job_id AND t.provenance_id <> p.id
    )
) BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

-- Hydrate retained generations against the new trigger set once on upgrade.
UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
