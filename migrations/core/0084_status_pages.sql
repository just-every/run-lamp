CREATE TABLE status_pages (
  path TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('staff', 'audience')),
  page_name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  timezone TEXT NOT NULL,
  component_ids_json TEXT NOT NULL,
  feed_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE incidents ADD COLUMN public_hidden INTEGER NOT NULL DEFAULT 0 CHECK (public_hidden IN (0, 1));
ALTER TABLE maintenance ADD COLUMN public_hidden INTEGER NOT NULL DEFAULT 0 CHECK (public_hidden IN (0, 1));
ALTER TABLE incident_drafts ADD COLUMN page_paths TEXT;
ALTER TABLE snapshot_builds ADD COLUMN page_path TEXT NOT NULL DEFAULT 'public';

CREATE TABLE incident_status_pages (
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL REFERENCES status_pages(path),
  PRIMARY KEY (incident_id, page_path)
);
CREATE INDEX incident_status_pages_page ON incident_status_pages (page_path, incident_id);

CREATE TABLE maintenance_status_pages (
  maintenance_id TEXT NOT NULL REFERENCES maintenance(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL REFERENCES status_pages(path),
  PRIMARY KEY (maintenance_id, page_path)
);
CREATE INDEX maintenance_status_pages_page ON maintenance_status_pages (page_path, maintenance_id);

CREATE TABLE status_page_snapshot_work (
  id TEXT PRIMARY KEY NOT NULL REFERENCES status_pages(path),
  requested_revision INTEGER NOT NULL DEFAULT 0,
  completed_revision INTEGER NOT NULL DEFAULT 0,
  retry_lease_id TEXT,
  retry_lease_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
