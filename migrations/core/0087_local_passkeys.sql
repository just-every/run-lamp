-- Credentials are local to this installation and excluded from portable archives.
CREATE TABLE oa_local_passkeys (
 operator_id TEXT PRIMARY KEY REFERENCES oa_operators(id) ON DELETE CASCADE,
 credential_id TEXT NOT NULL UNIQUE,
 public_key BLOB NOT NULL,
 counter INTEGER NOT NULL
);

CREATE TABLE oa_local_passkey_challenges (
 id TEXT PRIMARY KEY,
 challenge TEXT NOT NULL,
 operation TEXT NOT NULL CHECK(operation IN ('enroll','signin')),
 operator_id TEXT NOT NULL REFERENCES oa_operators(id) ON DELETE CASCADE,
 session_id TEXT,
 expires_at INTEGER NOT NULL
);
CREATE INDEX oa_local_passkey_challenge_expiry ON oa_local_passkey_challenges(expires_at);
