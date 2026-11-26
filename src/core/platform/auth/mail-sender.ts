import type { MailSender as BaseMailSender } from '@runeditrun/rer/modules/operator-auth';
import type { MailSender } from '../mail';

/**
 * Base operator-auth's mail sender over Lamp's transport; the idempotency key is stable per Base delivery.
 * An uncertain send (the relay timed out or answered 5xx; the mail may still arrive) is returned as `uncertain`, so
 * Base keeps the link live and answers as for a sent link. Any other failure is rethrown and revokes the link.
 */
export function baseMailSender(mail: MailSender, scope: 'operator-auth' | 'owner-signin'): BaseMailSender {
  return { async send(message) {
    try {
      const receipt = await mail.send({ from: message.from, to: message.to[0], subject: message.subject, text: message.text,
        html: message.html, headers: message.headers, idempotencyKey: `${scope}/${message.deliveryId}` });
      return { status: receipt.disposition === 'suppressed' ? 'development' : 'accepted', provider: 'lamp-mail', providerMessageId: null };
    } catch (error) {
      if ((error as { uncertain?: unknown } | null)?.uncertain === true) return { status: 'uncertain', provider: 'lamp-mail', providerMessageId: null };
      throw error;
    }
  } };
}
