/// <reference path="../scripts/dev-ingress/virtual.d.ts" />
import { withDemo } from "@runeditrun/rer/modules/demo";
import { createHostDispatch, isAppAssetPath } from "./core/app/host-dispatch";
import { operatorRequestObject } from "./core/app/operator-request-path";
import type { AppBindings } from "./core/app/types";
import { isMoveInApi } from "./core/features/statuspage-import/request-path";
import { answerHealth } from "./core/features/health/endpoint";
import { answerPublicArtifact, staticPublicArtifact } from "./core/features/public-snapshot/home";
import { isPublicIncidentRead, publicSnapshotObject } from "./core/features/public-snapshot/publication-request-path";
import { runQueue } from "./core/app/worker-lifecycle";
import { runScheduled } from "./core/app/scheduled-worker";
export { HealthWorker } from "./core/features/health/worker";
export { MoveInWorker } from "./core/features/statuspage-import/worker";
export { SnapshotCache } from "./core/features/public-snapshot/worker";

async function forwardOperatorRequest(request: Request, object: Pick<Fetcher, "fetch">) {
  if (!request.body) return object.fetch(request);
  const forwarded = request.clone() as Request;
  // Wait for the incoming stream to close even if the object returns an
  // authorization refusal before it reads the body.
  const [response] = await Promise.all([object.fetch(forwarded), request.body.cancel()]);
  return response;
}

export default withDemo({
  async fetch(request: Request, bindings: AppBindings, executionContext: ExecutionContext): Promise<Response> {
    if (import.meta.env.DEV) {
      const { enabled, authenticate } = await import("virtual:lamp-dev-ingress");
      if (enabled) {
        const { admitsDevelopmentRequest } = await import("./core/platform/development/access");
        const authenticated = await authenticate(request);
        if (!authenticated || !admitsDevelopmentRequest(bindings, authenticated)) {
          return new Response("Not found.", { status: 404, headers: { "Cache-Control": "no-store" } });
        }
        request = authenticated;
      }
      const [{ devGate }, { authConfig }] = await Promise.all([
        import("@runeditrun/rer/modules/operator-auth"), import("./core/platform/auth/config"),
      ]);
      const config = authConfig(bindings);
      const gate = devGate({key:bindings.RER_DEV_KEY,origin:config.origin,local:config.local!});
      const exchange = await gate?.exchange(request);
      if (exchange) return exchange;
    }
    const url = new URL(request.url);
    const surface = createHostDispatch(bindings).surfaceForUrl(request.method, url, { allowDevelopmentAssets: import.meta.env.DEV });
    if (!surface) return new Response("Not found.", { status: 404 });
    if (surface === "app" && isAppAssetPath(url.pathname, import.meta.env.DEV)) return bindings.ASSETS.fetch(request);

    if (!import.meta.env.DEV && (request.method === "GET" || request.method === "HEAD")) {
      if (url.pathname === "/health") {
        const response = surface === "app" && bindings.HEALTH_WORKER && bindings.RER_DEMO !== "1"
          ? await bindings.HEALTH_WORKER.getByName("health").fetch(request)
          : await answerHealth(bindings, executionContext);
        return request.method === "HEAD" ? new Response(null, response) : response;
      }
      if (surface === "page" && staticPublicArtifact(url.pathname)) {
        return answerPublicArtifact(request, bindings, executionContext, url);
      }
    }
    if (surface === "app" && bindings.MOVE_IN_WORKER && bindings.RER_DEMO !== "1" && !import.meta.env.DEV && isMoveInApi(url.pathname)) {
      return bindings.MOVE_IN_WORKER.getByName("move-in").fetch(request);
    }
    if (!import.meta.env.DEV && bindings.RER_DEMO !== "1") {
      if (surface === "app") {
        const object = operatorRequestObject(request.method, url.pathname, bindings);
        if (object) return forwardOperatorRequest(request, bindings.SNAPSHOT_CACHE.getByName(object));
      } else if (surface === "page" && isPublicIncidentRead(request.method, url.pathname)) {
        return bindings.SNAPSHOT_CACHE.getByName(publicSnapshotObject).fetch(request);
      }
    }
    const { fetchApplication } = await import("./server-fetch");
    return fetchApplication(request, bindings, executionContext, url, surface);
  },
  async scheduled(event: ScheduledController, bindings: AppBindings, executionContext: ExecutionContext) {
    await runScheduled(bindings, executionContext, event.scheduledTime);
  },
  async queue(batch: MessageBatch<unknown>, bindings: AppBindings) {
    await runQueue(batch, bindings);
  },
} satisfies ExportedHandler<AppBindings>, {
  seed: async (...args: Parameters<typeof import("./demo").seedDemo>) => (await import("./demo")).seedDemo(...args),
});
