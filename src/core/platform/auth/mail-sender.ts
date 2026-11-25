import type { MailSender as BaseMailSender } from '@runeditrun/rer/modules/operator-auth';
import type { MailSender } from '../mail';

/** Base operator-auth's mail sender over Lamp's transport; the idempotency key is stable per Base delivery. */
export function baseMailSender(mail: MailSender, scope: 'operator-auth' | 'owner-signin'): BaseMailSender {
  return { async send(message) {
    const receipt = await mail.send({ from: message.from, to: message.to[0], subject: message.subject, text: message.text,
      html: message.html, headers: message.headers, idempotencyKey: `${scope}/${message.deliveryId}` });
    return { status: receipt.disposition === 'suppressed' ? 'development' : 'accepted', provider: 'lamp-mail', providerMessageId: null };
  } };
}
