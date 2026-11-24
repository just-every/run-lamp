import { configureClaim } from '../../../../modules/owner-claim/verify.mjs';
import type { AppBindings } from '../../app/types';
import { authConfig } from './config';
import { readInstallationOwner } from './owner-profile.repository';

/** A single server-owned trust configuration for claims and Business grants.
 * RER sets this trust on every install it provisions for a Business plan,
 * whatever the claim mode: Lamp still claims its owner through bootstrap there.
 * Trust that names another app origin (a preview that copied production's
 * variables) is not trust for this app, so its door and signed claims stay off. */
export function ownerClaimConfig(env: AppBindings, email?: string) {
  if (!env.RER_OWNER_CLAIM_PUBLIC_KEYS) return null;
  const config = authConfig(env);
  if (env.RER_OWNER_CLAIM_APP_ORIGIN && new URL(env.RER_OWNER_CLAIM_APP_ORIGIN).origin !== config.origin) return null;
  return configureClaim({issuer:env.RER_OWNER_CLAIM_ISSUER ?? '',installationId:env.RER_OWNER_CLAIM_INSTALLATION_ID ?? '',
    appOrigin:config.origin,expectedEmail:email ?? config.OWNER_EMAIL,publicKeys:JSON.parse(env.RER_OWNER_CLAIM_PUBLIC_KEYS)});
}

/** After setup, Business grants name the current account email. Before setup
 * the seed lets owner verification report that the claim is still outstanding. */
export async function businessOwnerTrust(env: AppBindings) {
  if (!env.RER_OWNER_CLAIM_PUBLIC_KEYS) return null;
  const owner = await readInstallationOwner(env.DB);
  const claim = ownerClaimConfig(env, owner?.email);
  return claim && { claim, owner };
}
