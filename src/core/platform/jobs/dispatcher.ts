import type { ScheduledWork } from "../../app/scheduled-work.repository";

export type LampJob =
  | { type: "health-probe"; requestedAt: string }
  | { type: "public-snapshot-rebuild" }
  /** Pending, first or other-release publication, under the same lease Cron's retry takes. */
  | { type: "public-snapshot-publish" }
  | { type: "delivery-dispatch"; eventId: string }
  | { type: "scheduled-work"; at: number; work: ScheduledWork };

export interface JobDispatcher {
  enqueue(job: LampJob): Promise<void>;
}

export function createQueueDispatcher(queue: Queue<LampJob>): JobDispatcher {
  return {
    async enqueue(job) {
      await queue.send(job);
    },
  };
}
