-- Incident-list pages seek by opening time and identity, including tied times.
CREATE INDEX IF NOT EXISTS incidents_list_opened_id_idx
  ON incidents(opened_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS incidents_list_active_opened_id_idx
  ON incidents(opened_at DESC, id DESC) WHERE deleted_at IS NULL AND lifecycle <> 'Resolved';
CREATE INDEX IF NOT EXISTS incidents_list_lifecycle_opened_id_idx
  ON incidents(lifecycle, opened_at DESC, id DESC) WHERE deleted_at IS NULL;

-- Exact visible totals must not rescan all incident history on every page.
-- Reapplying this migration rebuilds the same derived counts.
CREATE TABLE IF NOT EXISTS incident_list_counts (
  lifecycle TEXT PRIMARY KEY NOT NULL,
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0)
);
UPDATE incident_list_counts SET total = 0;
INSERT OR REPLACE INTO incident_list_counts(lifecycle, total)
  SELECT lifecycle, count(*) FROM incidents WHERE deleted_at IS NULL GROUP BY lifecycle;
INSERT OR IGNORE INTO incident_list_counts(lifecycle, total)
  VALUES ('Investigating', 0), ('Identified', 0), ('Monitoring', 0), ('Resolved', 0);

CREATE TRIGGER IF NOT EXISTS incident_list_count_insert AFTER INSERT ON incidents
WHEN NEW.deleted_at IS NULL
BEGIN
  UPDATE incident_list_counts SET total = total + 1 WHERE lifecycle = NEW.lifecycle;
END;
CREATE TRIGGER IF NOT EXISTS incident_list_count_delete AFTER DELETE ON incidents
WHEN OLD.deleted_at IS NULL
BEGIN
  UPDATE incident_list_counts SET total = total - 1 WHERE lifecycle = OLD.lifecycle;
END;
CREATE TRIGGER IF NOT EXISTS incident_list_count_update AFTER UPDATE OF lifecycle, deleted_at ON incidents
BEGIN
  UPDATE incident_list_counts SET total = total - 1 WHERE lifecycle = OLD.lifecycle AND OLD.deleted_at IS NULL;
  UPDATE incident_list_counts SET total = total + 1 WHERE lifecycle = NEW.lifecycle AND NEW.deleted_at IS NULL;
END;
