-- Sorry templates supply wording and collection-page scope, not lifecycle or
-- affected-service defaults. Keep that provenance separate from native choices.
ALTER TABLE incident_templates ADD COLUMN kind TEXT NOT NULL DEFAULT 'incident' CHECK (kind IN ('incident','notice','update'));
ALTER TABLE incident_templates ADD COLUMN source_metadata_json TEXT;

CREATE TABLE statuspage_import_update_template_targets (
  id TEXT PRIMARY KEY NOT NULL,
  revision TEXT NOT NULL
);
