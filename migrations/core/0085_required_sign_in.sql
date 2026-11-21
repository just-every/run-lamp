ALTER TABLE oa_auth_settings ADD COLUMN required_provider TEXT;
ALTER TABLE oa_tokens ADD COLUMN terminal_issued INTEGER NOT NULL DEFAULT 0 CHECK(terminal_issued IN (0,1));

-- Match Base's current Owner, the operator authorized to clear this policy.
CREATE VIEW lamp_sign_in_owner AS
 SELECT o.id,o.version FROM oa_operators o LEFT JOIN oa_bootstrap b ON b.claim_id=o.id
 WHERE o.role='owner' AND o.status='active' ORDER BY b.claim_id IS NULL,o.created_at,o.id LIMIT 1;

CREATE VIEW lamp_terminal_owner_links AS
 SELECT t.id,t.token_hash,t.operator_id,t.operator_version,t.expires_at FROM oa_tokens t
 JOIN lamp_sign_in_owner o ON o.id=t.operator_id AND o.version=t.operator_version
 WHERE t.kind='magic' AND t.terminal_issued=1 AND t.consumed_at IS NULL AND t.revoked_at IS NULL;

-- Close the race between a request's policy read and Base's token or session
-- transaction. Only the terminal can mark a token at issuance.
CREATE TRIGGER lamp_require_sso_magic BEFORE INSERT ON oa_tokens
 WHEN NEW.kind='magic'
 AND EXISTS (SELECT 1 FROM oa_auth_settings WHERE singleton=1 AND required_provider IS NOT NULL)
 AND NOT (NEW.terminal_issued=1 AND EXISTS (
   SELECT 1 FROM lamp_sign_in_owner WHERE id=NEW.operator_id AND version=NEW.operator_version
 ))
 BEGIN SELECT RAISE(IGNORE); END;

CREATE TRIGGER lamp_require_sso_email_session BEFORE INSERT ON oa_sessions
 WHEN (NEW.kind IN ('review','password') OR (NEW.kind IN ('native','dev') AND NEW.source_token_id IS NOT NULL))
 AND EXISTS (SELECT 1 FROM oa_auth_settings WHERE singleton=1 AND required_provider IS NOT NULL)
 AND NOT (NEW.kind='native' AND EXISTS (
   SELECT 1 FROM lamp_terminal_owner_links WHERE id=NEW.source_token_id
   AND operator_id=NEW.operator_id AND operator_version=NEW.operator_version AND expires_at>NEW.created_at
 ))
 BEGIN SELECT RAISE(IGNORE); END;

-- Base pins successful provider admission in the same batch as the session.
CREATE TRIGGER lamp_require_sso_provider_pin BEFORE INSERT ON oa_provider_session_pins
 WHEN EXISTS (SELECT 1 FROM oa_auth_settings WHERE singleton=1 AND required_provider != NEW.provider_id)
 BEGIN SELECT RAISE(ABORT, 'required_sign_in_provider'); END;
