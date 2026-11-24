import { AuthError, normalizeEmail, type OperatorAuth } from '@runeditrun/rer/modules/operator-auth';
import { requirePost } from '@runeditrun/rer/internal/modules/operator-auth/http.mjs';
import { z } from 'zod';
import type { AppBindings } from '../../app/types';
import type { MailSender } from '../mail';
import { createPublicWriteRateLimiter } from '../security/rate-limiter';
import { authConfig } from './config';
import { saveOwnerProfile } from './owner-profile.repository';

const profileInput = z.object({
  email: z.string().optional(),
  displayName: z.string().max(120).regex(/^[^\x00-\x1f]+$/).trim().min(1).optional(),
}).strict().refine(input => input.email !== undefined || input.displayName !== undefined);

export function ownerProfileChange(env: AppBindings, auth: OperatorAuth, mail?: MailSender) {
  const config = authConfig(env);
  return async (request: Request, input: unknown) => {
    requirePost(request, config);
    const actor = await auth.getSession(request);
    if (!actor) throw new AuthError('unauthenticated', 401);
    if (actor.operator.role !== 'owner') throw new AuthError('owner_required', 403);
    const limit = createPublicWriteRateLimiter(env.DB);
    if (!await limit.allow({ scope: 'owner-profile', subject: actor.operator.id, limit: 5 })) throw new AuthError('rate_limited', 429);
    const session = await auth.requireStepUp(request, 'email:change');
    if (session.id !== actor.id || session.operator.version !== actor.operator.version) throw new AuthError('authority_changed', 409);
    const parsed = profileInput.safeParse(input);
    if (!parsed.success) throw new AuthError('invalid_input', 400);
    const displayName = parsed.data.displayName ?? session.operator.displayName;
    const email = parsed.data.email === undefined ? session.operator.email : normalizeEmail(parsed.data.email);
    if (email.endsWith('@operator.invalid')) throw new AuthError('email_not_allowed', 403);
    const emailChanged = email !== session.operator.email;
    if (!emailChanged && displayName === session.operator.displayName) return { operator: session.operator, notice: 'none' };
    const { eventId, operator } = await saveOwnerProfile(env.DB, session, { email, displayName });
    let notice: 'none' | 'sent' | 'failed' = 'none';
    if (emailChanged && mail?.configured && config.MAIL_FROM) {
      try {
        const result = await mail.send({ from: config.MAIL_FROM, to: email, subject: 'Your Lamp owner email changed',
          text: `The sign-in email for your Lamp owner account has changed to ${email}. You can sign in at ${config.origin}/signin.`,
          headers: { 'Auto-Submitted': 'auto-generated' }, idempotencyKey: `owner-profile/${eventId}` });
        if (result.disposition !== 'suppressed') notice = 'sent';
      } catch { notice = 'failed'; }
    }
    return { operator, notice };
  };
}
