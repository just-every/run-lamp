import { normalizeEmail } from '@runeditrun/rer/modules/operator-auth';
import { hashToken, opaqueToken } from '@runeditrun/rer/internal/modules/operator-auth/crypto.mjs';
import { emailDomain } from '@runeditrun/rer/internal/modules/operator-auth/policy.mjs';
import { createUlid } from '../ops-config.mjs';
import { bindSql } from './database.mjs';

export const refusal = 'A sign-in link could not be created. Check the operator address and installation.';

export async function issueSignInLink({ email, origin, execute, sessionSecret, now = Date.now() }) {
  if (typeof sessionSecret !== 'string' || sessionSecret.length < 32 || sessionSecret.length > 1024) throw new Error(refusal);
  const address = normalizeEmail(email);
  const token = opaqueToken();
  const id = crypto.randomUUID();
  const hash = await hashToken(sessionSecret, 'link', token);
  const timestamp = new Date(now).toISOString();
  const auditId = createUlid();
  // Issue a native magic link with terminal provenance. The audit insert
  // witnesses issuance in the same D1 batch, including when a trigger refuses it.
  const rows = await execute(bindSql(`
    INSERT INTO oa_tokens(id,token_hash,kind,operator_id,operator_version,return_to,created_at,expires_at,terminal_issued)
      SELECT ?,?,'magic',id,version,'/app',?,?,1 FROM oa_operators
      WHERE email=? AND status='active'
      AND (role='owner' OR NOT EXISTS (SELECT 1 FROM oa_domain_rules WHERE domain=?));
    INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at)
      SELECT ?,'operator',operator_id,'sign-in link created from the command line',operator_id,'{}',?,?
      FROM oa_tokens WHERE id=? RETURNING id;
  `, id, hash, now, now + 20 * 60_000, address, emailDomain(address), auditId, timestamp, timestamp, id));
  if (!rows.some(row => row.id === auditId)) throw new Error(refusal);
  const link = new URL('/auth/confirm', origin);
  link.searchParams.set('token', token);
  return link.href;
}
