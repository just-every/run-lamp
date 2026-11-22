import type { WebAuthnCredential } from '@simplewebauthn/server'

export type Operation = 'enroll' | 'signin'
export type Owner = { id: string; email: string; version: number }
type Challenge = { id: string; challenge: string }
type NewSession = { id: string; hash: string; expiresAt: number }

export class PasskeyStore {
 constructor(private db: D1Database) {}

 owner() {
  return this.db.prepare("SELECT o.id,o.email,o.version FROM oa_operators o JOIN lamp_sign_in_owner current ON current.id=o.id").first<Owner>()
 }

 async credential(ownerId: string): Promise<WebAuthnCredential | null> {
  const row = await this.db.prepare('SELECT credential_id,public_key,counter FROM oa_local_passkeys WHERE operator_id=?')
   .bind(ownerId).first<{ credential_id: string; public_key: number[]; counter: number }>()
  return row && { id: row.credential_id, publicKey: Uint8Array.from(row.public_key), counter: row.counter }
 }

 async begin(operation: Operation, owner: Owner, sessionId: string | null, challenge: string, expires: number) {
  const id = crypto.randomUUID(), now = Date.now()
  await this.db.batch([
   this.db.prepare('DELETE FROM oa_local_passkey_challenges WHERE expires_at<=?').bind(now),
   this.db.prepare(`INSERT INTO oa_local_passkey_challenges(id,challenge,operation,operator_id,session_id,expires_at)
    VALUES(?,?,?,?,?,?)`).bind(id, challenge, operation, owner.id, sessionId, expires),
  ])
  return id
 }

 async consume(id: string, challenge: string, operation: Operation, owner: Owner, sessionId: string | null) {
  return this.db.prepare(`DELETE FROM oa_local_passkey_challenges
   WHERE id=? AND challenge=? AND operation=? AND operator_id=? AND session_id IS ? AND expires_at>?
   RETURNING id,challenge`).bind(id, challenge, operation, owner.id, sessionId, Date.now()).first<Challenge>()
 }

 async enroll(owner: Owner, sessionId: string, credential: WebAuthnCredential) {
  const row = await this.db.prepare(`INSERT INTO oa_local_passkeys(operator_id,credential_id,public_key,counter)
   SELECT o.id,?,?,? FROM lamp_sign_in_owner o JOIN oa_sessions s ON s.operator_id=o.id
   WHERE o.id=? AND o.version=?
   AND s.id=? AND s.operator_version=o.version AND s.revoked_at IS NULL AND s.expires_at>?
   AND s.kind='dev'
   ON CONFLICT DO NOTHING RETURNING operator_id`)
   .bind(credential.id, [...credential.publicKey], credential.counter, owner.id, owner.version, sessionId, Date.now()).first()
  return !!row
 }

 async signIn(owner: Owner, credential: WebAuthnCredential, counter: number, session: NewSession) {
  const now = Date.now()
  const [inserted] = await this.db.batch([
   this.db.prepare(`INSERT INTO oa_sessions(id,token_hash,operator_id,operator_version,kind,created_at,expires_at)
    SELECT ?,?,o.id,o.version,'dev',?,? FROM lamp_sign_in_owner o JOIN oa_local_passkeys p ON p.operator_id=o.id
    WHERE o.id=? AND o.version=? AND p.credential_id=? AND p.counter=?
    RETURNING id`).bind(session.id, session.hash, now, session.expiresAt, owner.id, owner.version, credential.id, credential.counter),
   this.db.prepare(`UPDATE oa_local_passkeys SET counter=? WHERE operator_id=? AND credential_id=?
    AND EXISTS(SELECT 1 FROM oa_sessions WHERE id=?)`).bind(counter, owner.id, credential.id, session.id),
  ])
  return inserted.results.length === 1
 }
}
