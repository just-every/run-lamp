import { createApp } from "./server";
import { notificationOrigin, prepareAppMailBindings } from "./mail";
import type { AppBindings } from "./types";
import { runScheduledTasks } from "./scheduled-tasks";
import type { LampJob } from "../platform/jobs";

function isLampJob(value: unknown): value is LampJob {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { type?: unknown; eventId?: unknown; at?: unknown; work?: unknown };
  return candidate.type === "health-probe" || candidate.type === "public-snapshot-rebuild" || candidate.type === "public-snapshot-publish"
    || (candidate.type === "scheduled-work" && Number.isSafeInteger(candidate.at) && typeof candidate.work === "object" && candidate.work !== null)
    || (candidate.type === "delivery-dispatch" && typeof candidate.eventId === "string");
}

export { runScheduled } from "./scheduled-worker";

export async function runQueue(batch: MessageBatch<unknown>, bindings: AppBindings) {
  const runtime = createApp(await prepareAppMailBindings(bindings, "background"), "background");
  for (const message of batch.messages) {
    if (!isLampJob(message.body)) {
      message.retry();
      throw new Error("Lamp received an unknown queue command.");
    }
    if (message.body.type === "health-probe") {
      message.ack();
      continue;
    }
    if (message.body.type === "public-snapshot-rebuild" || message.body.type === "public-snapshot-publish") {
      try {
        if (message.body.type === "public-snapshot-rebuild") await runtime.services.publicSnapshots.rebuild();
        else await runtime.services.publicSnapshots.retryPendingBuild();
        message.ack();
      } catch (cause) {
        message.retry();
        throw cause;
      }
      continue;
    }
    if (message.body.type === "scheduled-work") {
      try {
        await runScheduledTasks(bindings, message.body.at, message.body.work, runtime);
        message.ack();
      } catch (cause) {
        message.retry();
        throw cause;
      }
      continue;
    }
    if (bindings.EFFECTS_PAUSED === "1") {
      message.retry({ delaySeconds: 60 });
      continue;
    }
    try {
      const retryAt = await runtime.services.deliveries.dispatchEvent(message.body.eventId, await notificationOrigin(bindings));
      await runtime.services.social.dispatchPending();
      if (retryAt) message.retry({ delaySeconds: Math.max(1, Math.ceil((Date.parse(retryAt) - Date.now()) / 1000)) });
      else message.ack();
    } catch (cause) {
      const retryAt = cause && typeof cause === "object" && "retryAt" in cause && typeof cause.retryAt === "string" ? cause.retryAt : null;
      message.retry(retryAt ? { delaySeconds: Math.max(1, Math.ceil((Date.parse(retryAt) - Date.now()) / 1000)) } : undefined);
      throw cause;
    }
  }
}
