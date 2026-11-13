import { createUlid } from "../../shared/ids";
import type { BlobStore } from "../../platform/blobs/store";

export interface PrelaunchSettings { enabled: boolean }

const KEY = "settings/prelaunch.json";

/**
 * The owner's pre-launch switch, kept with the snapshot state in object storage so it needs no
 * schema change. An installation that predates it has no object and reads off: nothing about its
 * page changes on upgrade.
 */
export async function readPrelaunch(blobs: BlobStore): Promise<boolean> {
  const object = await blobs.getText(KEY);
  if (!object) return false;
  const parsed = JSON.parse(object.text) as { enabled?: unknown };
  if (typeof parsed.enabled !== "boolean") throw new Error("The pre-launch setting is unreadable.");
  return parsed.enabled;
}

export function createPrelaunchStore(blobs: BlobStore, binding: D1Database) {
  return {
    enabled: () => readPrelaunch(blobs),
    /** Returns false when the operator is not an active owner or admin. The audit entry is written first, with the authority check. */
    async set(value: boolean, operatorId: string, now: string): Promise<boolean> {
      try {
        await binding.batch([
          binding.prepare("SELECT CASE WHEN EXISTS (SELECT 1 FROM oa_operators WHERE id=? AND status='active' AND role IN ('owner','admin')) THEN 1 ELSE json('Pre-launch authority changed.') END").bind(operatorId),
          binding.prepare("INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at) VALUES(?,'settings','prelaunch','prelaunch-settings-updated',?,?,?,?)").bind(createUlid(), operatorId, JSON.stringify({ enabled: value }), now, now),
        ]);
      } catch (cause) {
        if (cause instanceof Error && cause.message.includes("malformed JSON")) return false;
        throw cause;
      }
      await blobs.putText(KEY, JSON.stringify({ enabled: value, updatedAt: now }), "application/json; charset=utf-8");
      return true;
    },
  };
}
