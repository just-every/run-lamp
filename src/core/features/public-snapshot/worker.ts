import type { BackgroundJob, QueueResult } from "../../app/queue-job";
import type { AppBindings } from "../../app/types";
import { operatorRequestObject, publicationObject } from "../../app/operator-request-path";
import { SnapshotCache as RetainedReplica } from "../../platform/blobs/snapshot-cache";
import { isPublicIncidentRead, publicIncidentObject } from "./publication-request-path";

/** Publication writes, sign-in, console requests, background builds and retained replicas
 * have separate named instances in the installed namespace. Only replicas use
 * its SQLite storage. */
export class SnapshotCache extends RetainedReplica<AppBindings> {
  async runJob(job: BackgroundJob): Promise<QueueResult> {
    const { runQueueJob } = await import("../../app/queue-job");
    return runQueueJob(this.env, job);
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.hostname === "snapshot.internal") return super.fetch(request);
    const page = url.hostname === this.env.LAMP_PAGE_HOST.trim().toLowerCase()
      && isPublicIncidentRead(request.method, url.pathname);
    const object = page ? publicIncidentObject
      : url.hostname === this.env.LAMP_APP_HOST.trim().toLowerCase()
        ? operatorRequestObject(request.method, url.pathname, this.env)
        : undefined;
    if (!object || !this.ctx.id.equals(this.env.SNAPSHOT_CACHE.idFromName(object))) {
      return new Response("Not found.", { status: 404 });
    }
    const { fetchApplication } = await import("../../../server-fetch");
    return fetchApplication(request, this.env, { waitUntil: promise => this.ctx.waitUntil(promise) } as ExecutionContext, url, page ? "page" : "app", {
      queuePublication: object === publicationObject && !this.env.RER_PREVIEW_OWNER_SIGNIN,
    });
  }
}
