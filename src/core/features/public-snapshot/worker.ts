import type { BackgroundJob, QueueResult } from "../../app/queue-job";
import type { AppBindings } from "../../app/types";
import { SnapshotCache as RetainedReplica } from "../../platform/blobs/snapshot-cache";
import { isPublicationWrite } from "./publication-request-path";

/** Publication writes, background builds and retained replicas have separate
 * named instances in the installed namespace. Only replicas use its SQLite storage. */
export class SnapshotCache extends RetainedReplica<AppBindings> {
  async runJob(job: BackgroundJob): Promise<QueueResult> {
    const { runQueueJob } = await import("../../app/queue-job");
    return runQueueJob(this.env, job);
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.hostname === "snapshot.internal") return super.fetch(request);
    if (url.hostname !== this.env.LAMP_APP_HOST.trim().toLowerCase() || !isPublicationWrite(request.method, url.pathname)) {
      return new Response("Not found.", { status: 404 });
    }
    const { fetchApplication } = await import("../../../server-fetch");
    return fetchApplication(request, this.env, { waitUntil: promise => this.ctx.waitUntil(promise) } as ExecutionContext, url, "app", {
      queuePublication: !this.env.RER_PREVIEW_OWNER_SIGNIN,
    });
  }
}
