import { AuthError, createOperatorAuth, normalizeEmail, type AuthConfig } from '@runeditrun/rer/modules/operator-auth';
import type { AppBindings } from '../../app/types';
import type { MailSender } from '../mail';
import { createOperatorRepository } from '../../features/operators/repository';
import { createOperatorRolesRepository } from '../../features/operators/roles.repository';
import { OPERATOR_ROLES, type OperatorRole } from '../../features/operators/permissions';
import { authConfig } from './config';
import { ownerProfile } from './owner-profile';
import { baseMailSender } from './mail-sender';
import { ownerSignInLinks, type OwnerSignInTransport } from './owner-signin-mail';

export function createLampAuth(env: AppBindings, mail?: MailSender, stored?: AuthConfig['providers'], ownerMail?: OwnerSignInTransport) {
  const repository = createOperatorRepository(env.DB);
  const config = authConfig(env, stored);
  const nativeAuth = (invitationRole?: OperatorRole) => createOperatorAuth({ db: env.DB, config,
    ...(invitationRole ? { hooks: { audit: event => repository.invitationRoleStatements(event, invitationRole) } } : {}),
    clientIp: request => config.local ? 'loopback' : request.headers.get('CF-Connecting-IP') ?? '',
    rolePolicy: async input => {
      if (input.actor.status !== 'active') return false;
      if (['sessions:list','sessions:revoke'].includes(input.action) && input.target?.id === input.actor.id) return true;
      if (!['owner','admin'].includes(input.actor.role)) return false;
      if (input.actor.role === 'admin' && (input.role === 'owner' || input.target?.role === 'owner')) return false;
      if (input.action === 'operators:reactivate' && input.target && input.target.email === `deleted-${input.target.id.toLowerCase()}@operator.invalid`) return false;
      if (input.target && ['operators:deactivate', 'operators:role'].includes(input.action)) {
        if (await repository.isSetupOperator(input.target.id) && input.actor.id !== input.target.id) return false;
      }
      return true;
    },
    ...(mail?.configured ? { mailSender: baseMailSender(mail, 'operator-auth') } : {}),
  });
  const auth = nativeAuth();
  // MAIL_RECIPIENTS=owner: product mail is off, and the sign-in page's email link goes to the owner alone.
  const ownerLink = ownerMail && env.MAIL_FROM_ADDRESS
    ? ownerSignInLinks(env.DB, config, env.MAIL_FROM_ADDRESS, ownerMail, request => config.local ? 'loopback' : request.headers.get('CF-Connecting-IP') ?? '')
    : null;
  async function setProductRole(request: Request, id: string, role: OperatorRole) {
    if (!OPERATOR_ROLES.includes(role)) throw new AuthError('invalid_role',400);
    if (request.method !== 'POST' || request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') throw new AuthError('same_origin_required',403);
    const session = await auth.getSession(request);
    if (!session) throw new AuthError('unauthenticated',401);
    const target = (await auth.listOperators(request)).find(operator => operator.id === id);
    if (!target) throw new AuthError('operator_not_found',404);
    if (session.operator.role === 'admin' && (role === 'owner' || target.role === 'owner')) throw new AuthError('owner_required',403);
    if (await repository.isSetupOperator(id) && session.operator.id !== id) throw new AuthError('owner_required',403);
    if (target.role === 'owner' || role === 'owner') await auth.requireStepUp(request,'owner:transfer');
    await createOperatorRolesRepository(env.DB).change(session,target,role);
    return { ...target, role: role === 'owner' || role === 'admin' ? role : 'member' as const };
  }
  const profile = ownerProfile(env, auth, mail);
  return Object.freeze({
    ...auth,
    ...(ownerLink ? { emailSignInAvailable: true, requestMagicLink: ownerLink } : {}),
    ownerProfile: profile,
    changeEmail: undefined,
    async changeDisplayName(request: Request, input: { displayName: string }) {
      return (await profile.change(request, input)).operator;
    },
    setProductRole,
    async inviteWithRole(request: Request, input: { email: string; displayName: string; role: OperatorRole }) {
      if (!OPERATOR_ROLES.includes(input.role)) throw new AuthError('invalid_role', 400);
      if (normalizeEmail(input.email).endsWith('@operator.invalid')) throw new AuthError('email_not_allowed', 403);
      const role = input.role === 'owner' || input.role === 'admin' ? input.role : 'member';
      // The product role joins the native invitation transaction before any mail
      // is sent, so accepting the link immediately keeps the chosen authority.
      return nativeAuth(input.role).invite(request, { ...input, role });
    },
    async setRole(request: Request, id: string, role: Parameters<typeof auth.setRole>[2]) {
      return setProductRole(request,id,role === 'member' ? 'viewer' : role);
    },
    async invite(request: Request, input: Parameters<typeof auth.invite>[1]) {
      // The retained anonymous address is an attribution marker. Neither Base's
      // invitation door nor Lamp's Settings door may reopen it as an identity.
      if (normalizeEmail(input.email).endsWith('@operator.invalid')) throw new AuthError('email_not_allowed', 403);
      return auth.invite(request, input);
    },
  });
}
