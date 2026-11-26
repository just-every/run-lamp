import { version as buildVersion } from "../../../../package.json";
import { deploymentHealth } from "../../../base/deployment-health";
import type { AppBindings } from "../../app/types";
import { createSnapshotBlobStore } from "../../platform/blobs/r2";
import { createDependencyProber } from "../../platform/health";
import { createSnapshotReader, runningReleaseIdentity, PUBLIC_SNAPSHOT_RENDERER_VERSION } from "../public-snapshot/reader";
import { createHealthRepository, publicSnapshotWork } from "./repository";
import { observeSchema } from "./schema-observation";
import { createHealthService, type HealthService } from "./service";

export function healthServiceFor(bindings: AppBindings) {
  return createHealthService(createHealthRepository(bindings.DB), createDependencyProber(bindings.SNAPSHOTS, bindings.JOBS), async () => {
    const [pointer, work] = await Promise.all([
      createSnapshotReader(createSnapshotBlobStore(bindings)).readPointer(),
      publicSnapshotWork(bindings.DB),
    ]);
    const release = runningReleaseIdentity(bindings);
    if (pointer && !work?.pending && pointer.rendererVersion === PUBLIC_SNAPSHOT_RENDERER_VERSION
      && (!release || pointer.releaseIdentity === release)) return true;
    if (!pointer && !work?.configured) return false;
    await bindings.JOBS.send({ type: "public-snapshot-publish" });
    return true;
  });
}

type HealthBindings = Pick<AppBindings, "RER_DEPLOY_SOURCE" | "RER_DEPLOY_FINGERPRINT" | "RER_VERSION"> & Partial<Pick<AppBindings, "DB">>;

export async function answerHealth(bindings: HealthBindings, execution: Pick<ExecutionContext, "waitUntil">, service: HealthService = healthServiceFor(bindings as AppBindings)) {
  const [health, schemaObservation] = await Promise.all([service.check(), observeSchema(bindings.DB)]);
  if (health.status === "ok") execution.waitUntil(service.publish());
  const ageMs = Math.max(0, Date.now() - Date.parse(schemaObservation.observedAt));
  const payload = { ...health, buildVersion, schemaObservation: { ...schemaObservation, ageMs } };
  return Response.json(health.status === "ok" ? { ...payload, ...deploymentHealth(bindings) } : payload, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
