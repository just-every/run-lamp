-- Run Edit Run fleet, 2026-11-17: retain labeled Sorry source facts with each
-- native record. Normal native records have no source metadata. These columns
-- travel and erase with their owning rows and participate in import custody.
ALTER TABLE incidents ADD COLUMN source_metadata_json TEXT;
ALTER TABLE maintenance ADD COLUMN source_metadata_json TEXT;
ALTER TABLE incident_updates ADD COLUMN source_metadata_json TEXT;
ALTER TABLE import_maintenance_updates ADD COLUMN source_metadata_json TEXT;
