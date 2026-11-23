import type { Hono } from "hono";

import type { AppEnv } from "../../app/types";
import type { MaintenanceService } from "../maintenance";
import type { OverviewService } from "./service";
import { createOverviewRepository } from "./repository";
import { registerFollowUpRoutes } from "./follow-ups/routes";
import { firstRunSchema, firstRunError } from "./first-run-input";

export function registerOverviewRoutes(app: Hono<AppEnv>, service: OverviewService, maintenance: MaintenanceService, emailOff: boolean) {
  registerFollowUpRoutes(app, async () => !emailOff || (await maintenance.listReminderChannels()).length > 0);
  app.get("/api/app/overview", async (context) => context.json({ overview: await service.get() }));
  app.get("/api/app/overview/live", async (context) => context.json({ live: await service.live.get() }));
  app.post('/api/app/overview/first-run', async (context) => {
    if (context.req.header('Sec-Fetch-Site') === 'cross-site') return context.json({ error: 'Cross-site setup actions are not accepted.' }, 403);
    const parsed = firstRunSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: firstRunError(parsed.error) }, 400);
    const repository = createOverviewRepository(context.env.DB);
    const attempt = crypto.randomUUID();
    try {
      if (!await repository.claimFirstRun(attempt)) {
        return context.json({ error: 'Lamp is already publishing your page. Wait for it to finish, then reopen setup.' }, 409);
      }
      const publishing = service.finishFirstRun(context.get('operator').id, parsed.data)
        .finally(() => repository.releaseFirstRun(attempt));
      // The browser or agent may disconnect while a hosted snapshot is still
      // being written. Let the request finish publishing before it is retired.
      context.executionCtx.waitUntil(publishing.catch(() => {}));
      await publishing;
      return context.json({ complete: true });
    }
    catch (cause) { return context.json({ error: cause instanceof Error ? cause.message : 'First-run setup could not be completed.' }, 400); }
  });
}
