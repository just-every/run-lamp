CREATE TABLE status_page_email_branding (
  page_path TEXT PRIMARY KEY NOT NULL REFERENCES status_pages(path) ON DELETE CASCADE,
  branding_json TEXT NOT NULL
);
