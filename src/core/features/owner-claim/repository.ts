import type { AppBindings } from '../../app/types';
import { createImportDoorRepository } from '../statuspage-import/door.repository';

/** Reads native ownership and the permanent import key without creating settings. */
export function ownerClaimStatusRepository(bindings: AppBindings) {
  const db = bindings.DB;
  return {
    async read(email: string, kid: string) {
      const key = await createImportDoorRepository(db).key(bindings);
      // One snapshot: configuration or a historical bootstrap alone is never ownership.
      return db.prepare(`SELECT
        EXISTS(SELECT 1 FROM ik_door_revoked_keys WHERE installation_id=? AND kid=?) AS revoked,
        (SELECT o.id FROM lamp_sign_in_owner owner JOIN oa_operators o ON o.id=owner.id
          WHERE o.email=? AND EXISTS(SELECT 1 FROM oa_bootstrap)) AS owner_id,
        COALESCE((SELECT enabled FROM ik_door_settings WHERE installation_id=?),0) AS enabled`)
        .bind(key, kid, email, key).first<{ revoked: number; owner_id: string | null; enabled: number }>();
    },
  };
}
