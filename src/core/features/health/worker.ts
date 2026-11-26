import { DurableObject } from "cloudflare:workers";
import type { AppBindings } from "../../app/types";
import { answerHealth } from "./endpoint";

/** Hot and cold ingress share one short-lived liveness answer. The schema
 * observation reads the installation's actual ledger once per deployed Worker. */
export class HealthWorker extends DurableObject<AppBindings> {
  fetch(request: Request) {
    if (new URL(request.url).pathname !== "/health") return new Response("Not found.", { status: 404 });
    return answerHealth(this.env, this.ctx);
  }
}
