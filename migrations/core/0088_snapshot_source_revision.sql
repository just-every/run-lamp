-- Clock publications reuse the completed source revision. Record edits
-- previously picked up by the periodic reread in the same transaction.
CREATE INDEX snapshot_builds_in_flight
  ON snapshot_builds(page_path, started_at) WHERE status = 'building';
CREATE INDEX subscriber_limit_counts_nonzero
  ON subscriber_limit_counts(total, channel) WHERE total > 0;

CREATE TRIGGER website_snapshot_insert AFTER INSERT ON setup_readiness
WHEN NEW.step = 'website' AND EXISTS (SELECT 1 FROM page_settings WHERE id = 'default') BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER website_snapshot_update AFTER UPDATE OF step, evidence_key ON setup_readiness
WHEN (NEW.step = 'website' OR OLD.step = 'website')
  AND (NEW.step IS NOT OLD.step OR NEW.evidence_key IS NOT OLD.evidence_key)
  AND EXISTS (SELECT 1 FROM page_settings WHERE id = 'default') BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER website_snapshot_delete AFTER DELETE ON setup_readiness
WHEN OLD.step = 'website' AND EXISTS (SELECT 1 FROM page_settings WHERE id = 'default') BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

CREATE TRIGGER incident_follow_snapshot_update AFTER UPDATE OF include_report ON incident_follow_settings
WHEN NEW.include_report IS NOT OLD.include_report BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

CREATE TRIGGER incident_component_snapshot_insert AFTER INSERT ON incident_components
WHEN NEW.published_at IS NOT NULL BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER incident_component_snapshot_update
AFTER UPDATE OF component_id, component_name, state, detached_internal ON incident_components
WHEN NEW.published_at IS NOT NULL AND NEW.published_at IS OLD.published_at
  AND (NEW.component_id IS NOT OLD.component_id OR NEW.component_name IS NOT OLD.component_name
    OR NEW.state IS NOT OLD.state OR NEW.detached_internal IS NOT OLD.detached_internal) BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER incident_component_snapshot_delete AFTER DELETE ON incident_components
WHEN OLD.published_at IS NOT NULL BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

CREATE TRIGGER incident_snapshot_edit
AFTER UPDATE OF title, lifecycle, opened_at, resolved_at, public_hidden, peak_impact ON incidents
WHEN (NEW.title IS NOT OLD.title OR NEW.lifecycle IS NOT OLD.lifecycle OR NEW.opened_at IS NOT OLD.opened_at
    OR NEW.resolved_at IS NOT OLD.resolved_at OR NEW.public_hidden IS NOT OLD.public_hidden OR NEW.peak_impact IS NOT OLD.peak_impact)
  AND EXISTS (SELECT 1 FROM incident_updates WHERE incident_id = NEW.id) BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER incident_update_snapshot_edit AFTER UPDATE ON incident_updates BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;

-- The import kit already advances custody state for journal data and
-- provenance edits. Only jobs with a live public projection affect snapshots.
CREATE TRIGGER import_projection_snapshot_dirty AFTER UPDATE OF revision ON ik_d1_custody_states
WHEN EXISTS (SELECT 1 FROM ik_jobs j WHERE j.id = NEW.job_id AND j.destination = 'lamp'
  AND (j.state = 'completed' OR EXISTS (SELECT 1 FROM ik_provenance p WHERE p.job_id = j.id AND p.reversed = 0))) BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER import_projection_snapshot_job_state AFTER UPDATE OF state ON ik_jobs
WHEN OLD.destination = 'lamp' AND OLD.state = 'completed' AND NEW.state IS NOT OLD.state BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER import_projection_snapshot_job_delete AFTER DELETE ON ik_jobs
WHEN OLD.destination = 'lamp' AND OLD.state = 'completed' BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER import_projection_snapshot_reverse AFTER UPDATE OF reversed ON ik_provenance
WHEN OLD.destination = 'lamp' AND OLD.reversed = 0 AND NEW.reversed <> 0 BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER import_projection_snapshot_provenance_delete AFTER DELETE ON ik_provenance
WHEN OLD.destination = 'lamp' AND OLD.reversed = 0 BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER import_projection_snapshot_door AFTER UPDATE OF job_id, namespace ON ik_door_plans
WHEN (NEW.job_id IS NOT OLD.job_id OR NEW.namespace IS NOT OLD.namespace)
  AND (NEW.job_id IS NOT NULL OR OLD.job_id IS NOT NULL) BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER import_projection_snapshot_target_insert AFTER INSERT ON statuspage_import_targets BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
CREATE TRIGGER import_projection_snapshot_target_delete AFTER DELETE ON statuspage_import_targets BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
