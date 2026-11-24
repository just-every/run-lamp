import { AuthError, type Session } from '@runeditrun/rer/modules/operator-auth';
import { OWNER_SIGNIN_SECONDS } from '@runeditrun/rer/internal/modules/operator-auth/owner-signin-grant.mjs';
import { sessionAuthority } from './authority';

export type PendingEmail = {
  id: string;
  email: string;
  displayName: string;
  revokeAccess: number;
  method: 'email' | 'local' | 'terminal';
  expiresAt: number;
};

const localGrantPrefix = 'lamp-owner-email:';
const live = `p.operator_id=? AND p.operator_version=? AND p.session_id=? AND p.old_email=?
  AND p.old_display_name=? AND p.expires_at>unixepoch('subsec')*1000`;
const fields = 'p.id, p.email, p.display_name AS displayName, p.revoke_access AS revokeAccess, p.method, p.expires_at AS expiresAt';
const subject = ({ id, operator }: Session) => [operator.id, operator.version, id, operator.email, operator.displayName];

export async function stageOwnerEmail(db: D1Database, session: Session, pending: PendingEmail, tokenHash: string | null, now: number) {
  const { id, operator } = session;
  const authority = sessionAuthority(session);
  const [staged] = await db.batch([
    db.prepare(`INSERT INTO oa_owner_email_changes(id,operator_id,operator_version,session_id,old_email,old_display_name,
      email,display_name,revoke_access,method,token_hash,created_at,expires_at)
      SELECT ?,o.id,o.version,?,o.email,o.display_name,?,?,?,?,?,?,? FROM oa_operators o
      WHERE o.id=? AND o.role='owner' AND o.email=? AND o.display_name=? AND ${authority.sql}
      AND NOT EXISTS(SELECT 1 FROM oa_operators WHERE email=?)
      AND NOT EXISTS(SELECT 1 FROM operators WHERE email=?)
      ON CONFLICT(operator_id) DO UPDATE SET id=excluded.id,operator_version=excluded.operator_version,
        session_id=excluded.session_id,old_email=excluded.old_email,old_display_name=excluded.old_display_name,
        email=excluded.email,display_name=excluded.display_name,revoke_access=excluded.revoke_access,
        method=excluded.method,token_hash=excluded.token_hash,created_at=excluded.created_at,expires_at=excluded.expires_at`)
      .bind(pending.id, id, pending.email, pending.displayName, pending.revokeAccess, pending.method, tokenHash, now, pending.expiresAt,
        operator.id, operator.email, operator.displayName, ...authority.params, pending.email, pending.email),
    ...(pending.method === 'local' ? [
      db.prepare(`INSERT INTO oa_owner_signins(id,token_hash,operator_id,operator_version,created_at,expires_at)
        SELECT ?,token_hash,operator_id,operator_version,created_at,expires_at FROM oa_owner_email_changes WHERE id=?`)
        .bind(localGrantPrefix + pending.id, pending.id),
    ] : []),
  ]);
  if (staged.meta.changes) return;
  const taken = await db.prepare('SELECT 1 FROM oa_operators WHERE email=? UNION ALL SELECT 1 FROM operators WHERE email=? LIMIT 1')
    .bind(pending.email, pending.email).first();
  throw taken ? new AuthError('email_in_use', 409) : new AuthError('authority_changed', 409);
}

export function pendingOwnerEmail(db: D1Database, session: Session) {
  return db.prepare(`SELECT ${fields} FROM oa_owner_email_changes p WHERE ${live}`).bind(...subject(session)).first<PendingEmail>();
}

export async function cancelOwnerEmail(db: D1Database, session: Session, id: string) {
  const authority = sessionAuthority(session);
  await db.prepare(`DELETE FROM oa_owner_email_changes AS p WHERE ${live} AND p.id=? AND ${authority.sql}`)
    .bind(...subject(session), id, ...authority.params).run();
}

export type EmailProof = { type: 'email' | 'owner-link'; hash: string };
const grantLive = `g.token_hash=? AND g.operator_id=p.operator_id AND g.operator_version=p.operator_version
  AND g.consumed_at IS NULL AND g.expires_at>unixepoch('subsec')*1000 AND g.expires_at<=?
  AND ((p.method='terminal' AND g.created_at>=p.created_at AND g.id NOT LIKE '${localGrantPrefix}%')
    OR (p.method='local' AND g.id='${localGrantPrefix}' || p.id))`;

function proofFence(proof: EmailProof) {
  return proof.type === 'email'
    ? { sql: "p.method='email' AND p.token_hash=?", params: [proof.hash] }
    : { sql: `EXISTS(SELECT 1 FROM oa_owner_signins g WHERE ${grantLive})`, params: [proof.hash, Date.now() + OWNER_SIGNIN_SECONDS * 1000] };
}

export function pendingWithProof(db: D1Database, session: Session, proof: EmailProof) {
  const fence = proofFence(proof);
  return db.prepare(`SELECT ${fields} FROM oa_owner_email_changes p WHERE ${live} AND ${fence.sql}`)
    .bind(...subject(session), ...fence.params).first<PendingEmail>();
}

export function emailChangeFence(session: Session, pending: PendingEmail, proof: EmailProof) {
  const fence = proofFence(proof);
  return {
    sql: `EXISTS(SELECT 1 FROM oa_owner_email_changes p WHERE p.id=? AND ${live} AND ${fence.sql})`,
    params: [pending.id, ...subject(session), ...fence.params],
  };
}

export function ownerEmailGrantOnly(db: D1Database, hash: string) {
  return db.prepare("SELECT 1 FROM oa_owner_signins WHERE token_hash=? AND id LIKE ?")
    .bind(hash, localGrantPrefix + '%').first();
}
