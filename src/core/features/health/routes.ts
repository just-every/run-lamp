import type { Hono } from "hono";
import { version as buildVersion } from "../../../../package.json";

import { deploymentHealth } from "../../../base/deployment-health";
import type { AppBindings, AppEnv } from "../../app/types";
import { DEEP_ANSWER_MS, type HealthService } from "./service";
import { observeSchema } from "./schema-observation";

export function registerHealthRoutes(
  app: Hono<AppEnv>,
  healthService: HealthService,
  bindings: Pick<AppBindings, "RER_DEPLOY_SOURCE" | "RER_DEPLOY_FINGERPRINT" | "RER_VERSION"> & Partial<Pick<AppBindings, "DB">> = {},
) {
  app.get("/health", async (context) => {
    const [health, schemaObservation] = await Promise.all([healthService.check(), observeSchema(bindings.DB)]);
    // Publication runs after the answer: a page build can take longer than any monitor waits.
    if (health.status === "ok") context.executionCtx.waitUntil(healthService.publish());
    const ageMs = Math.max(0, Date.now() - Date.parse(schemaObservation.observedAt));
    const payload = { ...health, buildVersion, schemaObservation: { ...schemaObservation, ageMs } };
    // A healthy answer names the deployment that gave it, so a deploy can
    // confirm the version it just uploaded is the one serving.
    return health.status === "ok"
      ? context.json({ ...payload, ...deploymentHealth(bindings) }, 200, { "Cache-Control": "no-store" })
      : context.json(payload, 503, { "Cache-Control": "no-store" });
  });
  // The R2 write, read and delete and the queue message, kept off /health so a monitor's probe stays fast.
  app.get("/health/deep", async (context) => {
    const health = await healthService.deep(DEEP_ANSWER_MS);
    return context.json({ ...health, buildVersion }, health.status === "ok" ? 200 : 503, { "Cache-Control": "no-store" });
  });
}
