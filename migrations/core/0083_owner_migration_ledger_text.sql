-- Wrangler's owner ledger uses CURRENT_TIMESTAMP text. Preserve its applied
-- migration history while making the declared type match the stored values.
CREATE TABLE IF NOT EXISTS lamp_ext_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
ALTER TABLE lamp_ext_migrations RENAME TO lamp_ext_migrations_before_0083;
CREATE TABLE lamp_ext_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO lamp_ext_migrations (id, name, applied_at)
SELECT id, name, applied_at FROM lamp_ext_migrations_before_0083;
DROP TABLE lamp_ext_migrations_before_0083;
