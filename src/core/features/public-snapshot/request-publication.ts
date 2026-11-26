import type { LampJob } from "../../platform/jobs";
import type { PublicSnapshotService } from "./service";

/**
 * Publication asked for by a request. A request's work is cancelled when its client hangs up
 * and ends 30 seconds after its answer; a build cancelled there keeps its `building` row, and
 * nothing else can publish the page until that row is five minutes old. So a request builds the
 * page itself only when the page builds quickly, and never for a caller that will not wait
 * (a monitor, a metric push, a timing webhook). Everything else goes to the Queue consumer,
 * which has minutes. The work is already recorded in D1, so Cron publishes it if the Queue
 * cannot take the message.
 */
export function createRequestPublication(snapshot: Pick<PublicSnapshotService, "outlastsRequest" | "requestRebuild">, jobs: Pick<Queue<LampJob>, "send">) {
  async function handOff(job: LampJob) {
    try {
      await jobs.send(job);
    } catch (cause) {
      console.error("Lamp could not hand its public page to the Queue; Cron publishes it within a minute.", cause);
    }
  }
  return {
    /** For a caller that will not wait: the due publication, under the lease Cron takes. */
    publishPending: () => handOff({ type: "public-snapshot-publish" }),
    /** True when the rebuild was handed to the Queue; false when the request should build the page itself. */
    async rebuildElsewhere(force?: boolean) {
      if (!await snapshot.outlastsRequest()) return false;
      if (force) await snapshot.requestRebuild();
      await handOff({ type: "public-snapshot-rebuild" });
      return true;
    },
  };
}
