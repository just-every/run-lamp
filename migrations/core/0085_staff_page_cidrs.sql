ALTER TABLE status_pages
  ADD COLUMN allowed_cidrs_json TEXT NOT NULL DEFAULT '[]'
  CHECK (kind = 'staff' OR allowed_cidrs_json = '[]');
