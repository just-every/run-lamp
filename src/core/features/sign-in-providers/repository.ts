import type { ProviderLink, Session } from "@runeditrun/rer/modules/operator-auth";
import { createUlid, nowIso } from "../../shared/ids";
import type { PersonInput, SignInProviderId, StoredPerson, StoredRegistration } from "./types";

export interface Candidate { id: string; displayName: string; email: string; status: string }
type Action = "saved" | "people-changed" | "disconnected";

/** All D1 access for the sign-in registrations. A change, the people it replaces and its audit row travel in one batch. */
export function createSignInRepository(db: D1Database) {
  const audit = (id: SignInProviderId, action: Action, actor: string, now: string) =>
    db.prepare("INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at) VALUES(?,'sign-in',?,?,?,'{}',?,?)").bind(createUlid(), id, action, actor, now, now);
  const peopleStatements = (id: SignInProviderId, people: PersonInput[], now: string) => [
    db.prepare("DELETE FROM sign_in_people WHERE provider_id=?").bind(id),
    // Only a person who is still active or invited can be paired; an erased one is never matched.
    ...people.map(person => db.prepare("INSERT INTO sign_in_people(provider_id,subject,operator_id,created_at) SELECT ?,?,id,? FROM oa_operators WHERE id=? AND status IN ('active','invited')").bind(id, person.subject, now, person.operatorId)),
  ];
  return {
    async requiredProvider() {
      const row = await db.prepare("SELECT required_provider AS id FROM oa_auth_settings WHERE singleton=1").first<{ id: string | null }>();
      return row?.id ?? null;
    },
    async hasTerminalOwnerLink(hash: string) {
      return Boolean(await db.prepare("SELECT id FROM lamp_terminal_owner_links WHERE token_hash=? AND expires_at>?")
        .bind(hash, Date.now()).first());
    },
    async setRequiredProvider(actor: Session, previous: string | null, provider: ProviderLink | null) {
      const now = Date.now();
      const id = provider?.id ?? null;
      const auditId = createUlid();
      const timestamp = new Date(now).toISOString();
      const ready = provider ? `AND a.idp_sign_in=1 AND EXISTS (
        SELECT 1 FROM oa_identity_providers p WHERE p.provider_id=? AND p.issuer=? AND p.client_id=?
        AND p.linked_at=? AND p.status='linked' AND p.pending_at IS NULL
      )` : "";
      const [saved] = await db.batch<{ singleton: number }>([
        db.prepare(`UPDATE oa_auth_settings AS a SET required_provider=?
          WHERE a.singleton=1 AND a.required_provider IS ? AND EXISTS (
            SELECT 1 FROM oa_sessions s JOIN oa_operators o ON o.id=s.operator_id
            WHERE s.id=? AND o.id=? AND o.version=? AND s.operator_version=o.version
            AND s.revoked_at IS NULL AND s.expires_at>? AND o.id=(SELECT id FROM lamp_sign_in_owner)
            AND (s.kind!='oidc' OR EXISTS (
              SELECT 1 FROM oa_provider_sessions p WHERE p.session_id=s.id
              AND a.idp_sign_in=1 AND p.generation=a.generation
            ))
          ) ${ready} RETURNING singleton`).bind(id, previous, actor.id, actor.operator.id, actor.operator.version, now,
            ...(provider ? [provider.id, provider.issuer, provider.clientId, provider.linkedAt] : [])),
        db.prepare(`INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at)
          SELECT ?,'sign-in','policy',?,?,?,?,? WHERE changes()=1`).bind(auditId,
            id ? "require-provider" : "allow-email", actor.operator.id, JSON.stringify({ providerId: id }), timestamp, timestamp),
        db.prepare(`UPDATE oa_tokens SET revoked_at=? WHERE kind='magic' AND consumed_at IS NULL AND revoked_at IS NULL
          AND id NOT IN (SELECT id FROM lamp_terminal_owner_links)
          AND EXISTS (SELECT 1 FROM audit_entries WHERE id=? AND action='require-provider')`).bind(now, auditId),
      ]);
      return saved.results.length === 1;
    },
    async registrations() {
      return (await db.prepare("SELECT provider_id AS id,client_id AS clientId,issuer,sealed_secret AS sealedSecret,updated_at AS updatedAt FROM sign_in_providers ORDER BY provider_id").all<StoredRegistration>()).results;
    },
    /** Each pairing with the operator's current email, name and status: a pairing follows the person, never a copied address. */
    async people() {
      return (await db.prepare(`SELECT p.provider_id AS providerId,p.subject,p.operator_id AS operatorId,o.email,o.display_name AS displayName,o.status
        FROM sign_in_people p JOIN oa_operators o ON o.id=p.operator_id ORDER BY o.email,p.subject`).all<StoredPerson>()).results;
    },
    async candidates() {
      return (await db.prepare("SELECT id,display_name AS displayName,email,status FROM oa_operators WHERE status IN ('active','invited') ORDER BY email").all<Candidate>()).results;
    },
    /** Upsert the registration; a null `sealedSecret` keeps the stored one. `people` replaces the pairings when given. */
    async save(input: { id: SignInProviderId; clientId: string; issuer: string | null; sealedSecret: string | null }, people: PersonInput[] | null, actor: string) {
      const now = nowIso();
      await db.batch([
        db.prepare(`INSERT INTO sign_in_providers(provider_id,client_id,issuer,sealed_secret,created_at,updated_at) VALUES(?,?,?,?,?,?)
          ON CONFLICT(provider_id) DO UPDATE SET client_id=excluded.client_id,issuer=excluded.issuer,
          sealed_secret=COALESCE(excluded.sealed_secret,sign_in_providers.sealed_secret),updated_at=excluded.updated_at`).bind(input.id, input.clientId, input.issuer, input.sealedSecret, now, now),
        ...(people ? peopleStatements(input.id, people, now) : []),
        audit(input.id, "saved", actor, now),
      ]);
    },
    async replacePeople(id: SignInProviderId, people: PersonInput[], actor: string) {
      const now = nowIso();
      await db.batch([...peopleStatements(id, people, now), audit(id, "people-changed", actor, now)]);
    },
    async remove(id: SignInProviderId, actor: string) {
      const now = nowIso();
      await db.batch([
        db.prepare("DELETE FROM sign_in_people WHERE provider_id=?").bind(id),
        db.prepare("DELETE FROM sign_in_providers WHERE provider_id=?").bind(id),
        audit(id, "disconnected", actor, now),
      ]);
    },
  };
}
export type SignInRepository = ReturnType<typeof createSignInRepository>;
