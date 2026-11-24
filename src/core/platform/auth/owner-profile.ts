import { AuthError, normalizeEmail, type OperatorAuth, type Session } from '@runeditrun/rer/modules/operator-auth';
import { hashToken, opaqueToken, validToken } from '@runeditrun/rer/internal/modules/operator-auth/crypto.mjs';
import { OWNER_SIGNIN_PATH, OWNER_SIGNIN_SECONDS, ownerSigninDigest } from '@runeditrun/rer/internal/modules/operator-auth/owner-signin-grant.mjs';
import { requirePost } from '@runeditrun/rer/internal/modules/operator-auth/http.mjs';
import { z } from 'zod';
import { isLocalMailExecution } from '../../app/mail';
import type { AppBindings } from '../../app/types';
import type { MailSender } from '../mail';
import { createPublicWriteRateLimiter } from '../security/rate-limiter';
import { authConfig } from './config';
import {
  cancelOwnerEmail, ownerEmailGrantOnly, pendingOwnerEmail, pendingWithProof, stageOwnerEmail, type EmailProof, type PendingEmail,
} from './owner-email-change.repository';
import { readInstallationOwner, saveOwnerProfile } from './owner-profile.repository';

export const ownerEmailConfirmPath = '/auth/owner-profile/confirm';
export const ownerProfileSettings = '/app/settings#operators';
export const retainedAccess = 'Existing sessions, minted credentials and linked sign-ins will keep access.';

export function ownerProfileReturn(notice: string) {
  return `/app/settings?ownerEmail=${notice === 'failed' ? 'notice_failed' : 'confirmed'}#operators`;
}

const profileInput = z.object({
  email: z.string().optional(),
  displayName: z.string().max(120).regex(/^[^\x00-\x1f]+$/).trim().min(1).optional(),
  revokeAccess: z.union([z.boolean(), z.literal('true'), z.literal('false')]).optional(),
}).strict().refine(input => input.email !== undefined || input.displayName !== undefined);

export function ownerProfile(env: AppBindings, auth: OperatorAuth, mail?: MailSender) {
  const config = authConfig(env);
  const db = env.DB;
  const sender = mail?.configured && config.MAIL_FROM ? { mail, from: config.MAIL_FROM } : null;
  const localMailOff = config.local && env.RER_DEMO !== '1' && (!sender || isLocalMailExecution(env));
  const mode = localMailOff ? 'local' : env.MAIL_PROVIDER === 'none' ? 'terminal' : 'email';
  const limit = createPublicWriteRateLimiter(db);

  async function owner(request: Request) {
    const session = await auth.getSession(request);
    if (!session) throw new AuthError('unauthenticated', 401);
    if (session.operator.role !== 'owner') throw new AuthError('owner_required', 403);
    return session;
  }

  async function proofHash(type: EmailProof['type'], token: string) {
    return type === 'email' ? hashToken(config.SESSION_SECRET, 'owner-email-change', token) : ownerSigninDigest(token);
  }

  function pendingView(pending: PendingEmail | null) {
    if (!pending) return null;
    const { id, email, method, expiresAt, revokeAccess } = pending;
    return { id, email, method, expiresAt, revokeAccess: revokeAccess === 1 };
  }

  async function confirmation(request: Request, type: EmailProof['type'], token: unknown) {
    if (typeof token !== 'string' || !validToken(token)) return null;
    const session = await auth.getSession(request);
    if (!session || session.operator.role !== 'owner') return null;
    const proof = { type, hash: await proofHash(type, token) };
    const pending = await pendingWithProof(db, session, proof);
    return pending && { session, proof, pending };
  }

  async function notice({ operator }: Session, newEmail: string, eventId: string, revokeAccess: boolean) {
    if (!sender || mode !== 'email') return 'none';
    try {
      const result = await sender.mail.send({ from: sender.from, to: operator.email, subject: 'Your Lamp owner email changed',
        text: `The sign-in email for your Lamp owner account was changed to ${newEmail}. If this was not you, run rer signin from the checkout that deployed Lamp.${revokeAccess ? '' : `\n\n${retainedAccess}`}`,
        headers: { 'Auto-Submitted': 'auto-generated' }, idempotencyKey: `owner-profile/${eventId}` });
      return result.disposition === 'suppressed' ? 'failed' : 'sent';
    } catch { return 'failed'; }
  }

  return {
    async read(request: Request) {
      const session = await owner(request);
      return { operator: session.operator, pending: pendingView(await pendingOwnerEmail(db, session)), method: mode };
    },
    async change(request: Request, input: unknown) {
      requirePost(request, config);
      const actor = await owner(request);
      const parsed = profileInput.safeParse(input);
      if (!parsed.success) throw new AuthError('invalid_input', 400);
      const displayName = parsed.data.displayName ?? actor.operator.displayName;
      const email = parsed.data.email === undefined ? actor.operator.email : normalizeEmail(parsed.data.email);
      const emailChanged = email !== actor.operator.email;
      const session = emailChanged ? await auth.requireStepUp(request, 'email:change') : actor;
      if (session.id !== actor.id || session.operator.version !== actor.operator.version) throw new AuthError('authority_changed', 409);
      if (!await limit.allow({ scope: 'owner-profile', subject: actor.operator.id, limit: 5 })) throw new AuthError('rate_limited', 429);
      if (!emailChanged) {
        const { operator } = displayName === actor.operator.displayName ? actor : await saveOwnerProfile(db, actor, { displayName });
        return { operator, pending: pendingView(await pendingOwnerEmail(db, actor)) };
      }
      if (email.endsWith('@operator.invalid')) throw new AuthError('email_not_allowed', 403);
      if (mode === 'terminal' && (await readInstallationOwner(db))?.id !== actor.operator.id) throw new AuthError('owner_link_unavailable', 409);
      if (mode === 'email' && !sender) throw new AuthError('mail_unavailable', 503);

      const now = Date.now(), token = mode === 'terminal' ? null : opaqueToken();
      const tokenHash = token && await proofHash(mode === 'email' ? 'email' : 'owner-link', token);
      const pending: PendingEmail = { id: crypto.randomUUID(), email, displayName, method: mode,
        revokeAccess: Number(parsed.data.revokeAccess !== false && parsed.data.revokeAccess !== 'false'), expiresAt: now + 10 * 60_000 };
      await stageOwnerEmail(db, session, pending, tokenHash, now);
      const link = token ? new URL(mode === 'email' ? ownerEmailConfirmPath : OWNER_SIGNIN_PATH, config.origin) : null;
      if (link && token) link.searchParams.set('token', token);
      if (mode === 'email' && sender && link) {
        try {
          const result = await sender.mail.send({ from: sender.from, to: email, subject: 'Confirm your new Lamp sign-in email',
            text: `To change your Lamp sign-in email to ${email}, open this one-time link in the same browser session that requested it. If someone is handing you the account, give this confirmation link to the current Owner.\n\n${link.href}\n\nThe link expires in 10 minutes. ${pending.revokeAccess ? 'If email sign-in is available, Lamp will send a separate sign-in link to this address after confirmation.' : retainedAccess}`,
            headers: { 'Auto-Submitted': 'auto-generated' }, idempotencyKey: `owner-email-confirmation/${pending.id}` });
          if (result.disposition === 'suppressed') throw new Error('Confirmation mail was suppressed');
        } catch {
          await cancelOwnerEmail(db, session, pending.id);
          throw new AuthError('mail_unavailable', 503);
        }
      }
      return { operator: session.operator, pending: pendingView(pending),
        ...(mode === 'local' && link ? { confirmationUrl: link.pathname + link.search } : {}) };
    },
    async cancel(request: Request, id: unknown) {
      requirePost(request, config);
      const session = await owner(request);
      if (typeof id !== 'string' || !z.uuid().safeParse(id).success) throw new AuthError('invalid_input', 400);
      if (!await cancelOwnerEmail(db, session, id)) throw new AuthError('pending_change_unavailable', 404);
      return { pending: null };
    },
    confirmation,
    async ownsLocalGrant(token: unknown) {
      return typeof token === 'string' && validToken(token) && Boolean(await ownerEmailGrantOnly(db, await ownerSigninDigest(token)));
    },
    async confirm(request: Request, type: EmailProof['type'], token: unknown, emailSignInAllowed: () => Promise<boolean>) {
      requirePost(request, config);
      const candidate = await confirmation(request, type, token);
      if (!candidate) throw new AuthError('invalid_or_expired', 400);
      const { pending, session } = candidate;
      const revokeAccess = pending.revokeAccess === 1;
      const signInToken = revokeAccess && type === 'owner-link' ? opaqueToken() : null;
      const signInGrant = signInToken ? { hash: await ownerSigninDigest(signInToken), expiresAt: Date.now() + OWNER_SIGNIN_SECONDS * 1000 } : undefined;
      const { eventId, operator } = await saveOwnerProfile(db, session, { displayName: pending.displayName }, { ...candidate, signInGrant });
      const delivery = await notice(session, operator.email, eventId, revokeAccess);
      const result: { operator: Session['operator']; notice: string; signedOut: boolean; signInUrl?: string; signInEmailSent?: boolean }
        = { operator, notice: delivery, signedOut: revokeAccess };
      if (signInToken) {
        const link = new URL(OWNER_SIGNIN_PATH, config.origin);
        link.searchParams.set('token', signInToken);
        return { ...result, signInUrl: link.href };
      }
      if (!revokeAccess) return result;
      try {
        if (await emailSignInAllowed()) {
          await auth.requestMagicLink(request, { email: operator.email, returnTo: ownerProfileReturn(delivery) });
          return { ...result, signInEmailSent: true };
        }
      } catch { /* The handover committed. The new owner can start at sign-in. */ }
      return { ...result, signInEmailSent: false };
    },
  };
}
