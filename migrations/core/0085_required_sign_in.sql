ALTER TABLE oa_auth_settings ADD COLUMN required_provider TEXT;

-- Close the race between a request's policy read and Base's token or session
-- transaction. OIDC invitations and terminal Owner grants use separate doors.
CREATE TRIGGER lamp_require_sso_magic BEFORE INSERT ON oa_tokens
 WHEN NEW.kind='magic'
 AND EXISTS (SELECT 1 FROM oa_auth_settings WHERE singleton=1 AND required_provider IS NOT NULL)
 BEGIN SELECT RAISE(IGNORE); END;

CREATE TRIGGER lamp_require_sso_email_session BEFORE INSERT ON oa_sessions
 WHEN (NEW.kind IN ('review','password') OR (NEW.kind IN ('native','dev') AND NEW.source_token_id IS NOT NULL))
 AND EXISTS (SELECT 1 FROM oa_auth_settings WHERE singleton=1 AND required_provider IS NOT NULL)
 BEGIN SELECT RAISE(IGNORE); END;

-- Base pins successful provider admission in the same batch as the session.
CREATE TRIGGER lamp_require_sso_provider_pin BEFORE INSERT ON oa_provider_session_pins
 WHEN EXISTS (SELECT 1 FROM oa_auth_settings WHERE singleton=1 AND required_provider != NEW.provider_id)
 BEGIN SELECT RAISE(ABORT, 'required_sign_in_provider'); END;
