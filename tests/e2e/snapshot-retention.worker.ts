import worker from "./helpers/status-journey.worker";
export { SnapshotCache } from "../../src/core/platform/blobs/snapshot-cache";

let failWrites = false;
let deletes = 0;

// Only the provider boundary is wrapped: the publish route, auth, D1,
// repository, renderer and durable replica are the ordinary application.
export default {
  ...worker,
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (url.hostname === env.LAMP_APP_HOST && url.pathname === "/test/retention") {
      if (request.method === "PUT") failWrites = (await request.json()).failWrites;
      return Response.json({ deletes });
    }
    const SNAPSHOTS = new Proxy(env.SNAPSHOTS, {
      get(target, key) {
        if (key === "put") return (...args) => {
          if (failWrites) throw new Error("Synthetic Lamp R2 publication failure");
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
