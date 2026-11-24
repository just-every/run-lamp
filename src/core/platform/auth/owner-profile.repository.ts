import { AuthError, type Session } from '@runeditrun/rer/modules/operator-auth';
import { createUlid } from '../../shared/ids';
import { sessionAuthority } from './authority';
import { emailChangeFence, type EmailProof, type PendingEmail } from './owner-email-change.repository';

export function readInstallationOwner(db: D1Database) {
  return db.prepare(`SELECT o.id, o.email, o.version FROM lamp_sign_in_owner owner
    JOIN oa_operators o ON o.id=owner.id`).first<{ id: string; email: string; version: number }>();
}

export async function saveOwnerProfile(db: D1Database, session: Session, profile: { displayName: string },
  confirmation?: { pending: PendingEmail; proof: EmailProof; signInGrant?: { hash: string; expiresAt: number } }) {
  const { id, version, email, displayName } = session.operator;
  const nextEmail = confirmation?.pending.email ?? email;
  const nextVersion = version + Number(Boolean(confirmation));
  const revoke = confirmation?.pending.revokeAccess === 1;
  const now = Date.now(), at = new Date(now).toISOString(), eventId = createUlid(now);
  const authority = sessionAuthority(session);
  const proven = confirmation && emailChangeFence(session, confirmation.pending, confirmation.proof);
  const witness = 'EXISTS(SELECT 1 FROM audit_entries WHERE id=?)';
  const payload = confirmation ? JSON.stringify({ oldEmail: email, newEmail: nextEmail,
    revokedOtherAccess: revoke, revokedConfirmingSession: revoke }) : '{}';
  // The audit row witnesses the live session and pending proof throughout the
  // batch. Losing either, or a duplicate email, leaves the change unapplied.
  try {
    const [event] = await db.batch([
      db.prepare(`INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at)
        SELECT ?,'operator',?,'owner-profile-changed',?,?,?,? WHERE ${authority.sql}
        AND EXISTS(SELECT 1 FROM oa_operators WHERE id=? AND role='owner' AND email=? AND display_name=?)
        ${proven ? 'AND ' + proven.sql : ''}`)
        .bind(eventId, id, id, payload, at, at, ...authority.params, id, email, displayName, ...(proven?.params ?? [])),
      db.prepare(`UPDATE oa_operators SET email=?,display_name=?,version=? WHERE id=? AND ${witness}`)
        .bind(nextEmail, profile.displayName, nextVersion, id, eventId),
      ...(confirmation ? [
        ...(confirmation.proof.type === 'owner-link' ? [
          db.prepare(`UPDATE oa_owner_signins SET consumed_at=? WHERE token_hash=? AND ${witness}`)
            .bind(now, confirmation.proof.hash, eventId),
        ] : []),
        db.prepare(`UPDATE oa_sessions SET ${revoke ? 'revoked_at' : 'operator_version'}=?
          WHERE operator_id=? AND operator_version=? AND revoked_at IS NULL AND ${witness}`)
          .bind(revoke ? now : nextVersion, id, version, eventId),
        db.prepare(`UPDATE oa_tokens SET revoked_at=? WHERE operator_id=? AND consumed_at IS NULL AND revoked_at IS NULL AND ${witness}`)
          .bind(now, id, eventId),
        db.prepare(`UPDATE oa_tokens SET issuer_version=? WHERE issuer_id=? AND issuer_version=? AND kind='invite'
          AND consumed_at IS NULL AND revoked_at IS NULL AND ${witness}`).bind(nextVersion, id, version, eventId),
        ...(revoke ? [
          db.prepare(`UPDATE oa_credentials SET revoked_at=? WHERE operator_id=? AND revoked_at IS NULL AND ${witness}`).bind(now, id, eventId),
          db.prepare(`UPDATE management_tokens SET revoked_at=? WHERE issuer_id=? AND revoked_at IS NULL AND ${witness}`).bind(now, id, eventId),
          ...['oa_external_identities', 'sign_in_people', 'oa_local_passkeys', 'oa_local_passkey_challenges'].map(table =>
            db.prepare(`DELETE FROM ${table} WHERE operator_id=? AND ${witness}`).bind(id, eventId)),
        ] : [
          db.prepare(`UPDATE oa_step_up_challenges SET operator_version=? WHERE operator_id=? AND operator_version=? AND consumed_at IS NOT NULL AND ${witness}`)
            .bind(nextVersion, id, version, eventId),
          db.prepare(`UPDATE oa_credentials SET operator_version=? WHERE operator_id=? AND operator_version=? AND revoked_at IS NULL AND ${witness}`)
            .bind(nextVersion, id, version, eventId),
        ]),
        // A separate grant is handed to the incoming Owner after the old
        // session and the grant used to confirm the change both stop working.
        ...(confirmation.signInGrant ? [
          db.prepare(`INSERT INTO oa_owner_signins(id,token_hash,operator_id,operator_version,created_at,expires_at)
            SELECT ?,?,?,?,?,? WHERE ${witness}`)
            .bind(crypto.randomUUID(), confirmation.signInGrant.hash, id, nextVersion, now, confirmation.signInGrant.expiresAt, eventId),
        ] : []),
      ] : []),
      db.prepare(`DELETE FROM oa_owner_email_changes WHERE operator_id=? AND ${witness}`).bind(id, eventId),
    ]);
    if (!event.meta.changes) throw new AuthError(confirmation ? 'invalid_or_expired' : 'authority_changed', confirmation ? 400 : 409);
  } catch (error) {
    if (/UNIQUE constraint failed: (?:oa_)?operators\.email/.test(String(error))) throw new AuthError('email_in_use', 409);
    throw error;
  }
  return { eventId, operator: { ...session.operator, email: nextEmail, displayName: profile.displayName, version: nextVersion } };
}
