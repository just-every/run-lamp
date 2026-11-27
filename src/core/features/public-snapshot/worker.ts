import type { AppBindings } from "../../app/types";
import { SnapshotCache as RetainedReplica } from "../../platform/blobs/snapshot-cache";
import { isPublicationWrite } from "./publication-request-path";

/** The existing namespace handles publication writes on a separate instance
 * from any retained replica. This gives cold writes the Durable Object's CPU
 * budget for loading the operator app. The Queue owns the snapshot build. */
export class SnapshotCache extends RetainedReplica<AppBindings> {
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
