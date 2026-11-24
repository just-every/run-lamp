-- A pending address has no sign-in authority. Its one-time confirmation is
-- bound to the Owner session and profile that requested the change.
CREATE TABLE oa_owner_email_changes (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL UNIQUE REFERENCES oa_operators(id),
  operator_version INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  old_email TEXT NOT NULL,
  old_display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  revoke_access INTEGER NOT NULL CHECK (revoke_access IN (0, 1)),
  method TEXT NOT NULL CHECK (method IN ('email', 'local', 'terminal')),
  token_hash TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
