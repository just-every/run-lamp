import { DurableObject } from "cloudflare:workers";
import type { AppBindings } from "../../app/types";
import { isMoveInApi } from "./request-path";

/** One request can verify a complete saved plan before applying its next
 * bounded chunk. Give that work the SQLite Durable Object's CPU budget.
 * D1 and R2 still own every import record and lease. */
export class MoveInWorker extends DurableObject<AppBindings> {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.hostname !== this.env.LAMP_APP_HOST.trim().toLowerCase() || !isMoveInApi(url.pathname)) {
      return new Response("Not found.", { status: 404 });
    }
    const { fetchApplication } = await import("../../../server-fetch");
    return fetchApplication(request, this.env, {
      waitUntil: promise => this.ctx.waitUntil(promise),
    } as ExecutionContext, url, "app");
  }
}
