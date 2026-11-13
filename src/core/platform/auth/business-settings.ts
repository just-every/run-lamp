import { createBusinessSettings, type BusinessManifest } from '../../../../modules/business-settings/index';
import { createOperatorAuth } from '@runeditrun/rer/modules/operator-auth';
import type { AppBindings } from '../../app/types';
import { authConfig } from './config';

// Only the existing sign-in organisation name is adopted in this receiver round.
// Public status-page settings and native team accounts keep their own editors.
const business: BusinessManifest = { settings: 1, values: ['display_name'] };
const paths = new Set(['/api/rer/business-settings', '/rer-business-logo', '/rer-business.css']);
export const isBusinessSettingsPath = (path: string) => paths.has(path);

export function createLampBusinessSettings(env: AppBindings) {
  // This auth instance has no settings dependency, avoiding a recursive factory.
  // Its native adapter binds documents to the claimed owner even if trust omits email.
  const config = authConfig(env);
  const ownerAuth = createOperatorAuth({ db: env.DB, config,
    clientIp: request => config.local ? 'loopback' : request.headers.get('CF-Connecting-IP') ?? '',
  });
  return createBusinessSettings({ db: env.DB, trust: env.RER_BUSINESS_TRUST, business, team: ownerAuth.businessTeam });
}
