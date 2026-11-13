import type { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';
import { DoorError, verifyRerGrant } from '../../../../modules/import-kit/src/door';
import { ownerClaimConfig } from '../../platform/auth/claim';
import type { AppBindings, AppEnv } from '../../app/types';
import { deploymentHealth } from '../../../base/deployment-health';
import { ownerClaimStatusRepository } from './repository';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const input = z.object({}).strict();

/** A repeatable authenticated observation, never a bootstrap or settings mutation. */
export function registerOwnerClaimStatus(app: Hono<AppEnv>, bindings: AppBindings) {
  app.all('/api/rer/owner-claim-status', async c => {
    if (c.req.method !== 'POST') return c.json({ error: 'method_not_allowed' }, 405, { ...headers, Allow: 'POST' });
    try {
      const config = ownerClaimConfig(bindings);
      if (!config) return c.json({ error: 'not_found' }, 404, headers);
      const { grant, kid } = await verifyRerGrant(c.req.raw, config, 'owner-claim-status');
      if (!input.safeParse(await c.req.json().catch(() => null)).success) return c.json({ error: 'invalid_input' }, 400, headers);
      const state = await ownerClaimStatusRepository(bindings).read(config.expectedEmail, kid);
      if (!state || state.revoked) return c.json({ error: 'invalid_grant' }, 403, headers);
      if (!state.owner_id) return c.json({ error: 'native_owner_unavailable' }, 409, headers);
      return c.json({ v: 1, installationId: config.installationId, appOrigin: config.appOrigin,
        email: config.expectedEmail, challenge: grant.jti,
        owner: { id: state.owner_id, role: 'owner', status: 'active' },
        importDoor: { enabled: state.enabled === 1 }, deployment: deploymentHealth(bindings).deployment }, 200, headers);
    } catch (error) {
      if (error instanceof DoorError) return c.json({ error: error.code }, error.status as ContentfulStatusCode, headers);
      // A malformed host trust configuration must not expose its inputs.
      return c.json({ error: 'owner_verification_unavailable' }, 503, headers);
    }
  });
}
