import type { Hono } from "hono";
import { version as buildVersion } from "../../../../package.json";

import { deploymentHealth } from "../../../base/deployment-health";
import type { AppBindings, AppEnv } from "../../app/types";
import type { HealthService } from "./service";
import { observeSchema } from "./schema-observation";

export function registerHealthRoutes(
  app: Hono<AppEnv>,
  healthService: HealthService,
  bindings: Pick<AppBindings, "RER_DEPLOY_SOURCE" | "RER_DEPLOY_FINGERPRINT" | "RER_VERSION"> & Partial<Pick<AppBindings, "DB">> = {},
) {
  app.get("/health", async (context) => {
    const [health, schemaObservation] = await Promise.all([
      healthService.check((work) => context.executionCtx.waitUntil(work.catch((cause) => console.error("Lamp could not refresh its health check.", cause)))),
      observeSchema(bindings.DB),
    ]);
    const payload = { ...health, buildVersion, schemaObservation };
    // A healthy answer names the deployment that gave it, so a deploy can
    // confirm the version it just uploaded is the one serving.
    return health.status === "ok"
      ? context.json({ ...payload, ...deploymentHealth(bindings) }, 200, { "Cache-Control": "no-store" })
      : context.json(payload, 503, { "Cache-Control": "no-store" });
  });
}
