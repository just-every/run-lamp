import type { Hono } from "hono";
import { version as buildVersion } from "../../../../package.json";

import type { AppBindings, AppEnv } from "../../app/types";
import { DEEP_ANSWER_MS, type HealthService } from "./service";
import { answerHealth } from "./endpoint";

export function registerHealthRoutes(
  app: Hono<AppEnv>,
  healthService: HealthService,
  bindings: Pick<AppBindings, "RER_DEPLOY_SOURCE" | "RER_DEPLOY_FINGERPRINT" | "RER_VERSION"> & Partial<Pick<AppBindings, "DB">> = {},
) {
  app.get("/health", context => answerHealth(bindings, context.executionCtx, healthService));
  // The R2 write, read and delete and the queue message, kept off /health so a monitor's probe stays fast.
  app.get("/health/deep", async (context) => {
    const health = await healthService.deep(DEEP_ANSWER_MS);
    return context.json({ ...health, buildVersion }, health.status === "ok" ? 200 : 503, { "Cache-Control": "no-store" });
  });
}
