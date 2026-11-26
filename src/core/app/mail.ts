import type { AppBindings } from './types';
import type { OwnerSignInTransport } from '../platform/auth/owner-signin-mail';
import { UnavailableMailSender, developmentMail, SesMailSender, PostmarkMailSender, MailgunMailSender, FailoverMailSender, MailRouteGuardSender, createMailRouteRepository, type DirectMailProvider, ResendMailSender, SendGridMailSender, RerMailSender, createMailSendRepository, type MailSender } from '../platform/mail';

export type MailExecution = Request | 'background';

export function isLocalMailExecution(bindings: AppBindings): boolean {
  return bindings.RER_DEMO === '1' || Boolean(import.meta.env.DEV && bindings.RER_DEV_KEY && bindings.RER_DEV_ORIGIN);
}

// Session material is installation-local, including in each disposable demo.
export async function prepareAppMailBindings(bindings: AppBindings, _execution?: MailExecution): Promise<AppBindings> {
  if (bindings.MAIL_PROVIDER === 'rer') bindings = { ...bindings, MAIL_FROM_ADDRESS: bindings.MAIL_FROM ?? '' };
  if (!isLocalMailExecution(bindings)) return bindings;
  if (!bindings.SESSION_SECRET) return bindings;
  return { ...bindings, SUBSCRIBER_TOKEN_SECRET: bindings.SUBSCRIBER_TOKEN_SECRET || bindings.SESSION_SECRET,
    WEBHOOK_SIGNING_SECRET: bindings.WEBHOOK_SIGNING_SECRET || bindings.SESSION_SECRET };
}

// MAIL_RECIPIENTS=owner: the installation behaves exactly as mail-off (MAIL_PROVIDER=none) for every message,
// and the configured provider carries one thing only, the owner's own sign-in link (platform/auth/owner-signin-mail).
export function ownerOnlyMail(bindings: AppBindings): boolean {
  if (bindings.MAIL_RECIPIENTS && !['any', 'owner'].includes(bindings.MAIL_RECIPIENTS)) throw new Error('MAIL_RECIPIENTS must be any or owner.');
  return bindings.MAIL_RECIPIENTS === 'owner';
}

/** Product mail is off: deliberately (MAIL_PROVIDER=none) or because only the owner's sign-in link may be sent. */
export function productMailOff(bindings: AppBindings): boolean {
  return bindings.MAIL_PROVIDER === 'none' || ownerOnlyMail(bindings);
}

export function createAppMailTransport(bindings: AppBindings, extension: MailSender | undefined, _execution?: MailExecution): { sender: MailSender; local: boolean } {
  if (ownerOnlyMail(bindings)) return { sender: new UnavailableMailSender(), local: false };
  return providerMailTransport(bindings, extension);
}

/** The owner's sign-in link transport: only with MAIL_RECIPIENTS=owner and a configured provider. */
export function createOwnerSignInTransport(bindings: AppBindings, extension: MailSender | undefined): OwnerSignInTransport | undefined {
  if (!ownerOnlyMail(bindings)) return;
  if (bindings.MAIL_PROVIDER === 'rer') {
    if (!(bindings.MAIL_API_KEY && bindings.MAIL_RELAY_URL) && !isLocalMailExecution(bindings)) return;
    return ownerEmail => providerMailTransport(bindings, undefined, ownerEmail).sender;
  }
  const { sender } = providerMailTransport(bindings, extension);
  if (sender.configured) return () => sender;
}

function providerMailTransport(bindings: AppBindings, extension: MailSender | undefined, ownerEmail?: string): { sender: MailSender; local: boolean } {
  if (bindings.MAIL_PROVIDER === 'none') return { sender: new UnavailableMailSender(), local: false };
  if (bindings.MAIL_PROVIDER && !['rer', 'resend', 'sendgrid', 'mailgun', 'ses', 'postmark'].includes(bindings.MAIL_PROVIDER)) throw new Error('MAIL_PROVIDER must be rer, resend, sendgrid, mailgun, ses or postmark.');
  if (bindings.MAILGUN_REGION && !['us', 'eu'].includes(bindings.MAILGUN_REGION)) throw new Error('MAILGUN_REGION must be us or eu.');
  const repository = createMailSendRepository(bindings.DB);
  const providerSender = (provider: DirectMailProvider, apiKey: string | undefined): MailSender => provider === 'sendgrid'
    ? new SendGridMailSender({ apiKey, fromAddress: bindings.MAIL_FROM_ADDRESS }, repository)
    : provider === 'ses' ? new SesMailSender({ apiKey, fromAddress: bindings.MAIL_FROM_ADDRESS, region: bindings.SES_REGION, configurationSet: bindings.SES_CONFIGURATION_SET, topicArn: bindings.SES_EVENT_TOPIC_ARN }, repository)
    : provider === 'postmark' ? new PostmarkMailSender({ apiKey, fromAddress: bindings.MAIL_FROM_ADDRESS }, repository)
    : provider === 'mailgun' ? new MailgunMailSender({ apiKey, fromAddress: bindings.MAIL_FROM_ADDRESS, region: bindings.MAILGUN_REGION }, repository)
    : new ResendMailSender({ apiKey, fromAddress: bindings.MAIL_FROM_ADDRESS });
  const primaryProvider = bindings.MAIL_PROVIDER || 'resend';
  const primary = primaryProvider === 'rer'
    ? new RerMailSender({ apiKey: bindings.MAIL_API_KEY, fromAddress: bindings.MAIL_FROM, relayUrl: bindings.MAIL_RELAY_URL, ownerEmail }, repository)
    : providerSender(primaryProvider, bindings.MAIL_PROVIDER_API_KEY);
  if (bindings.MAIL_SECONDARY_PROVIDER && (!['resend','sendgrid','mailgun','ses','postmark'].includes(bindings.MAIL_SECONDARY_PROVIDER) || primaryProvider === 'rer')) throw new Error('A secondary mail provider requires two different direct providers.');
  if (Boolean(bindings.MAIL_SECONDARY_PROVIDER) !== Boolean(bindings.MAIL_SECONDARY_API_KEY)) throw new Error('MAIL_SECONDARY_PROVIDER and MAIL_SECONDARY_API_KEY must be configured together.');
  const real = !extension && bindings.MAIL_SECONDARY_PROVIDER && primaryProvider !== 'rer'
    ? new FailoverMailSender({ provider: primaryProvider, sender: primary }, { provider: bindings.MAIL_SECONDARY_PROVIDER, sender: providerSender(bindings.MAIL_SECONDARY_PROVIDER,bindings.MAIL_SECONDARY_API_KEY) }, createMailRouteRepository(bindings.DB),JSON.stringify([primaryProvider,bindings.MAIL_PROVIDER_API_KEY,bindings.MAIL_SECONDARY_PROVIDER,bindings.MAIL_SECONDARY_API_KEY,bindings.MAILGUN_REGION,bindings.SES_REGION,bindings.SES_CONFIGURATION_SET]))
    : new MailRouteGuardSender(extension ?? primary,createMailRouteRepository(bindings.DB));
  if (bindings.RER_DEMO === '1') return { local: true, sender: { configured: true,
    async send(message) {
      const { demoEffect } = await import('@runeditrun/rer/modules/demo');
      return demoEffect(() => real.send(message), () => ({ providerMessageId: `demo-${message.idempotencyKey}`, disposition: 'accepted' as const }));
    },
  } };
  if (isLocalMailExecution(bindings)) return { sender: developmentMail(), local: true };
  return { sender: real, local: false };
}

export async function notificationOrigin(bindings: AppBindings): Promise<string> {
  const url = new URL(bindings.LAMP_LOCAL_ORIGIN || `https://${bindings.LAMP_APP_HOST}`);
  url.hostname = bindings.LAMP_PAGE_HOST;
  return url.origin;
}

/** Receipt capability follows the accepting provider, including a secondary. */
export function configuredMailReceiptProviders(bindings: AppBindings): string[] {
  if (isLocalMailExecution(bindings)) return [];
  return [
    bindings.RESEND_WEBHOOK_SECRET?.trim() ? 'resend' : '',
    bindings.SENDGRID_WEBHOOK_PUBLIC_KEY?.trim() || bindings.RER_MAIL_RELAY_SECRET?.trim() ? 'sendgrid' : '',
    bindings.MAILGUN_WEBHOOK_SIGNING_KEY?.trim() ? 'mailgun' : '',
    bindings.SES_EVENT_TOPIC_ARN?.trim() ? 'ses' : '',
    bindings.POSTMARK_WEBHOOK_SECRET?.trim() ? 'postmark' : '',
  ].filter(Boolean);
}
