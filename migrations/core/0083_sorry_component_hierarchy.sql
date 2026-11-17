-- Run Edit Run fleet, 2026-11-17: retain Sorry parents once as recursive groups.
ALTER TABLE component_groups ADD COLUMN parent_id TEXT REFERENCES component_groups(id) ON DELETE SET NULL;
ALTER TABLE component_groups ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE component_groups ADD COLUMN source_metadata_json TEXT;
ALTER TABLE components ADD COLUMN source_metadata_json TEXT;
CREATE INDEX component_groups_parent_order_idx ON component_groups(parent_id, display_order);
