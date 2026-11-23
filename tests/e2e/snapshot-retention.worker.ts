import worker from "./helpers/status-journey.worker";
import { installedHomeResponse } from "../../src/installed-home";
export { SnapshotCache } from "../../src/core/platform/blobs/snapshot-cache";

let failWrites = false;
let deletes = 0;

// Only the provider boundary is wrapped: the publish route, auth, D1,
// repository, renderer and durable replica are the ordinary application.
export default {
  ...worker,
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (url.pathname === "/setup/state") {
      return (await installedHomeResponse(request, env))!;
    }
    if (url.hostname === env.LAMP_APP_HOST && url.pathname === "/test/retention") {
      if (request.method === "PUT") failWrites = (await request.json()).failWrites;
      return Response.json({ deletes });
    }
    const setupEdge = url.pathname === "/api/app/overview/first-run"
      ? (env as unknown as Record<string, string>).LAMP_TEST_SETUP_PUBLICATION_EDGE : null;
    const SNAPSHOTS = new Proxy(env.SNAPSHOTS, {
      get(target, key) {
        if (key === "put") return async (...args: Parameters<R2Bucket["put"]>) => {
          if (failWrites) throw new Error("Synthetic Lamp R2 publication failure");
          const [path, value] = args;
          if (setupEdge && path.endsWith("/api/public/v1/components.json") && typeof value === "string" && value.includes("Customer support")) {
            const response = await fetch(setupEdge);
            if (!response.ok) throw new Error("Test-injected R2 refusal for the third component");
          }
          return target.put(...args);
        };
        if (key === "delete") return (...args) => { deletes++; return target.delete(...args); };
        const value = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    return worker.fetch(request, { ...env, SNAPSHOTS }, context);
  },
};
