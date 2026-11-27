import type { LampJob } from "../../platform/jobs";
import type { PublicSnapshotService } from "./service";

type SnapshotProgress = Pick<PublicSnapshotService, "requestedRevision" | "hasCompletedRevision">;
type SnapshotPublication = SnapshotProgress & Pick<PublicSnapshotService, "outlastsRequest" | "requestRebuild">;

// Observe the selector on fast saves so Settings can still confirm that the
// change is live. The Queue owns the build even if the client goes away. A
// stored change is never answered as a failure: when the Queue cannot take it
// or has not published it within the wait, the Queue or the next Cron run does.
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
    /** Hands off a build that could outlast the usual save response. */
    async rebuildElsewhere(force?: boolean) {
      if (!await snapshot.outlastsRequest()) return false;
      if (force) await snapshot.requestRebuild();
      await handOff({ type: "public-snapshot-rebuild" });
      return true;
    },
    async rebuild(force: boolean | undefined, request: Request) {
      if (force) await snapshot.requestRebuild();
      const slow = await snapshot.outlastsRequest();
      const pages = slow ? [] : [snapshot, ...await additionalSnapshots()];
      const targets = await Promise.all(pages.map(async page => ({
        page, revision: await page.requestedRevision(),
      })));
      const queued = await handOff({ type: "public-snapshot-rebuild" });
      if (slow || !queued) return;
      const deadline = Date.now() + 10_000;
      while (!request.signal.aborted && Date.now() < deadline) {
        const completed = await Promise.all(targets.map(({ page, revision }) => page.hasCompletedRevision(revision)));
        if (completed.every(Boolean)) return;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.warn("Lamp saved a change the Queue has not published yet; the Queue or the next Cron run publishes it.");
    },
  };
}
