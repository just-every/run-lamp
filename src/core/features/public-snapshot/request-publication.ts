import type { LampJob } from "../../platform/jobs";
import type { PublicSnapshotService } from "./service";

type SnapshotProgress = Pick<PublicSnapshotService, "requestedRevision" | "hasCompletedRevision">;
type SnapshotPublication = SnapshotProgress & Pick<PublicSnapshotService, "outlastsRequest" | "requestRebuild">;

// Observe the selector on fast saves so Settings can still confirm that the
// change is live. The Queue owns the build even if the client goes away.
export function createRequestPublication(
  snapshot: SnapshotPublication,
  jobs: Pick<Queue<LampJob>, "send">,
  additionalSnapshots: () => Promise<SnapshotProgress[]>,
) {
  async function handOff(job: LampJob) {
    try {
      await jobs.send(job);
      return true;
    } catch (cause) {
      console.error("Lamp could not hand its public page to the Queue; Cron publishes it within a minute.", cause);
      return false;
    }
  }
  return {
    /** For a caller that will not wait: the due publication, under the lease Cron takes. */
    async publishPending() { await handOff({ type: "public-snapshot-publish" }); },
    async rebuild(force: boolean | undefined, request: Request) {
      if (force) await snapshot.requestRebuild();
      const slow = await snapshot.outlastsRequest();
      const pages = slow ? [] : [snapshot, ...await additionalSnapshots()];
      const targets = await Promise.all(pages.map(async page => ({
        page, revision: await page.requestedRevision(),
      })));
      const queued = await handOff({ type: "public-snapshot-rebuild" });
      if (slow) return;
      if (queued) {
        const deadline = Date.now() + 10_000;
        while (!request.signal.aborted) {
          const completed = await Promise.all(targets.map(({ page, revision }) => page.hasCompletedRevision(revision)));
          if (completed.every(Boolean)) return;
          if (Date.now() >= deadline) break;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      throw new Error("The changes were saved and are still publishing to your status page.");
    },
  };
}
