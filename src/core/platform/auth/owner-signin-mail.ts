import { createOperatorAuth, normalizeEmail, type AuthConfig, type OperatorAuth } from '@runeditrun/rer/modules/operator-auth';
import type { MailSender } from '../mail';
import { baseMailSender } from './mail-sender';

type OwnerAccount = { id: string; email: string };

/** The installation's owner: the active Owner account the setup claim created (oa_bootstrap), at its current address. */
function installationOwner(db: D1Database): Promise<OwnerAccount | null> {
  return db.prepare("SELECT o.id,o.email FROM oa_operators o JOIN oa_bootstrap b ON b.claim_id=o.id WHERE o.status='active' AND o.role='owner'")
    .first<OwnerAccount>();
}

/**
 * MAIL_RECIPIENTS=owner: the sign-in page's email link reaches the installation owner and nobody else. Base issues the
 * link (single use, Lamp's link lifetime, its rate limits and its uniform "accepted" answer); this instance serves only
 * that request, so no invitation, step-up or notice can use the owner-only transport. Any other address, known or not,
 * gets the same answer as an unknown one and no mail. The transport refuses any recipient but the owner's address.
 */
export function ownerSignInLinks(db: D1Database, config: AuthConfig & { local: boolean }, fromAddress: string, mail: MailSender,
  clientIp: (request: Request) => string): OperatorAuth['requestMagicLink'] {
  const owner = baseMailSender(mail, 'owner-signin');
  const auth = createOperatorAuth({ db, config: { ...config, MAIL_FROM: fromAddress }, clientIp,
    hooks: { async beforeMagicLink({ operator }) { return (await installationOwner(db))?.id === operator.id; } },
    mailSender: { async send(message) {
      const account = await installationOwner(db);
      if (!account || message.to.length !== 1 || normalizeEmail(message.to[0]) !== normalizeEmail(account.email)) {
        throw new Error('The owner-only sign-in transport refused a recipient other than the installation owner.');
      }
      return owner.send(message);
    } },
  });
  return auth.requestMagicLink;
}
