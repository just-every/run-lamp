import { AuthError, type Session } from '@runeditrun/rer/modules/operator-auth';
import { createUlid } from '../../shared/ids';
import { sessionAuthority } from './authority';

export function readInstallationOwner(db: D1Database) {
  return db.prepare(`SELECT o.id, o.email, o.version FROM lamp_sign_in_owner owner
    JOIN oa_operators o ON o.id=owner.id`).first<{ id: string; email: string; version: number }>();
}

export async function saveOwnerProfile(db: D1Database, session: Session, profile: { email: string; displayName: string }) {
  const { id, version, email, displayName } = session.operator;
  const changeEmail = email !== profile.email;
  const now = Date.now(), at = new Date(now).toISOString(), eventId = createUlid(now);
  const authority = sessionAuthority(session);
  const witness = 'EXISTS(SELECT 1 FROM audit_entries WHERE id=?)';
  // One transaction fences the live owner session, writes the audit, and
  // transfers the existing account to its new address. The version change
  // also fences an email-link request that read the old address before us.
  try {
    const [event] = await db.batch([
      db.prepare(`INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at)
        SELECT ?,'operator',?,'owner-profile-changed',?,'{}',?,? WHERE ${authority.sql}
        AND EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND role='owner' AND email=? AND display_name=?)`)
        .bind(eventId, id, id, at, at, ...authority.params, id, email, displayName),
      db.prepare(`UPDATE oa_operators SET email=?,display_name=?,version=? WHERE id=? AND ${witness}`)
        .bind(profile.email, profile.displayName, version + Number(changeEmail), id, eventId),
      ...(changeEmail ? [
        db.prepare(`UPDATE oa_sessions SET operator_version=? WHERE operator_id=? AND operator_version=? AND revoked_at IS NULL AND ${witness}`)
          .bind(version + 1, id, version, eventId),
        db.prepare(`UPDATE oa_step_up_challenges SET operator_version=? WHERE operator_id=? AND operator_version=? AND consumed_at IS NOT NULL AND ${witness}`)
          .bind(version + 1, id, version, eventId),
        db.prepare(`UPDATE oa_tokens SET revoked_at=? WHERE operator_id=? AND consumed_at IS NULL AND revoked_at IS NULL AND ${witness}`)
          .bind(now, id, eventId),
        db.prepare(`UPDATE oa_tokens SET issuer_version=? WHERE issuer_id=? AND issuer_version=? AND kind='invite'
          AND consumed_at IS NULL AND revoked_at IS NULL AND ${witness}`).bind(version + 1, id, version, eventId),
        db.prepare(`UPDATE oa_credentials SET operator_version=? WHERE operator_id=? AND operator_version=? AND revoked_at IS NULL AND ${witness}`)
          .bind(version + 1, id, version, eventId),
      ] : []),
    ]);
    if (!event.meta.changes) throw new AuthError('authority_changed', 409);
  } catch (error) {
    if (/UNIQUE constraint failed: (?:oa_)?operators\.email/.test(String(error))) throw new AuthError('email_in_use', 409);
    throw error;
  }
  return { eventId, operator: { ...session.operator, ...profile, version: version + Number(changeEmail) } };
}
