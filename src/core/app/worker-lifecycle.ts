import type { AppBindings } from "./types";
import type { LampJob } from "../platform/jobs";
import type { BackgroundJob, QueueResult } from "./queue-job";

function isLampJob(value: unknown): value is LampJob {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { type?: unknown; eventId?: unknown; at?: unknown; work?: unknown };
  return candidate.type === "health-probe" || candidate.type === "public-snapshot-rebuild" || candidate.type === "public-snapshot-publish"
    || (candidate.type === "scheduled-work" && Number.isSafeInteger(candidate.at) && typeof candidate.work === "object" && candidate.work !== null)
    || (candidate.type === "delivery-dispatch" && typeof candidate.eventId === "string");
}

export { runScheduled } from "./scheduled-worker";

// A batch can contain both the build and an incident's follow-up work. Only
// Queue acknowledgement belongs in the Free Worker, even on a cold isolate.
function dispatch(bindings: AppBindings, job: BackgroundJob) {
  const name = job.type === "delivery-dispatch" ? `delivery:${job.eventId}`
    : job.type === "scheduled-work" ? "scheduled-work" : "publication-builds";
  return bindings.SNAPSHOT_CACHE.getByName(name).runJob(job);
}

export async function runQueue(batch: MessageBatch<unknown>, bindings: AppBindings,
  execute: (bindings: AppBindings, job: BackgroundJob) => Promise<QueueResult> = dispatch,
) {
  for (const message of batch.messages) {
    const job = message.body;
    if (!isLampJob(job)) {
      message.retry();
      throw new Error("Lamp received an unknown queue command.");
    }
    if (job.type === "health-probe") {
      message.ack();
      continue;
    }
    if (job.type === "delivery-dispatch" && bindings.EFFECTS_PAUSED === "1") {
      message.retry({ delaySeconds: 60 });
      continue;
    }
    let result: QueueResult;
    try {
      result = await execute(bindings, job);
    } catch (cause) {
      message.retry();
      throw cause;
    }
    if (result) {
      message.retry({ delaySeconds: Math.max(1, Math.ceil((Date.parse(result.retryAt) - Date.now()) / 1000)) });
      if (result.error !== undefined) throw new Error(result.error);
    } else {
      message.ack();
    }
  }
}
