import type { LampJob } from "../platform/jobs";
import type { AppBindings } from "./types";

export type BackgroundJob = Exclude<LampJob, { type: "health-probe" }>;
export type QueueResult = { retryAt: string; error?: string } | void;

export async function runQueueJob(bindings: AppBindings, job: BackgroundJob): Promise<QueueResult> {
  if (job.type === "public-snapshot-rebuild" || job.type === "public-snapshot-publish") {
    const { createBackgroundSnapshots } = await import("./snapshot-services");
    const snapshots = await createBackgroundSnapshots(bindings);
    if (job.type === "public-snapshot-rebuild") await snapshots.rebuild();
    else await snapshots.retryPendingBuild();
    return;
  }
  if (job.type === "scheduled-work") {
    const { runScheduledTasks } = await import("./scheduled-tasks");
    await runScheduledTasks(bindings, job.at, job.work);
    return;
  }

  const [{ createAppServices }, { notificationOrigin, prepareAppMailBindings }, { createSnapshotBlobStore }] = await Promise.all([
    import("./services"), import("./mail"), import("../platform/blobs/r2"),
  ]);
  const services = createAppServices(await prepareAppMailBindings(bindings, "background"), createSnapshotBlobStore(bindings), "background");
  try {
    const retryAt = await services.deliveries.dispatchEvent(job.eventId, await notificationOrigin(bindings));
    await services.social.dispatchPending();
    if (retryAt) return { retryAt };
  } catch (cause) {
    // RPC transports exceptions without their application-specific properties.
    // Preserve a provider's eligibility date when the Queue marks this attempt failed.
    if (cause && typeof cause === "object" && "retryAt" in cause && typeof cause.retryAt === "string") {
      return { retryAt: cause.retryAt, error: cause instanceof Error ? cause.message : String(cause) };
    }
    throw cause;
  }
}
