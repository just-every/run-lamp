import { Hono } from "hono";
import type { AppBindings, AppEnv } from "../../app/types";
import { createSnapshotBlobStore } from "../../platform/blobs/r2";
import { createRetainedSnapshotCache } from "../../platform/blobs/retained";
import { createSnapshotReader, runningReleaseIdentity } from "./reader";
import { applyPublicHeaders, cacheResponse, snapshotArtifactRoute } from "./routes";
import { createTrafficStorage } from "../traffic-alerts/storage";
import { PRELAUNCH_ROBOTS_TAG } from "../prelaunch/policy";
import { preparePublicSubscribeDocument, wantsNativeSubscribeForm } from "../subscribers/public-subscribe-markup";

// This path covers the assets and status requests the public home needs to
// paint and update. Archive misses can still hydrate through the full router.
const artifacts = new Map<string, string>([
  ["/", "page.html"],
  ["/api/public/status", "status.json"],
  ...["status-page.css", "status-page.js", "template.css", "template.js", "favicon.svg", "mark.svg", "og.svg"]
    .map(name => [`/assets/${name}`, `assets/${name}`] as const),
] as const);
export function staticPublicArtifact(path: string) {
  return artifacts.get(path);
}

const stored = new Hono<AppEnv>();
stored.get("*", context => {
  const bindings = context.env;
  const reader = createSnapshotReader(createSnapshotBlobStore(bindings), createRetainedSnapshotCache(bindings));
  return snapshotArtifactRoute(reader)(() => staticPublicArtifact(context.req.path)!)(context);
});

const cachedHomes = new WeakMap<R2Bucket, { version: string; until: number }>();

export async function answerPublicArtifact(request: Request, bindings: AppBindings, execution: ExecutionContext, url: URL) {
  if (url.pathname === "/") {
    const bucket = bindings.SNAPSHOTS;
    const published = await createSnapshotReader(createSnapshotBlobStore(bindings))
      .openPreparedHome(bucket, url, bindings.LAMP_APP_HOST, runningReleaseIdentity(bindings)).catch(() => null);
    if (published && !published.stale) {
      execution.waitUntil(createTrafficStorage(bucket).increment("page", Date.now()));
      const headers = new Headers({
        "Content-Type": published.contentType,
        "X-Lamp-Snapshot-Generated-At": published.generatedAt,
        "X-Lamp-Snapshot-Version": published.version,
        "X-Lamp-Snapshot-Retained": String(published.retainedReady),
      });
      const representation = "installed-signin-footer-v3:" + published.home.signIn;
      const validator = `"${encodeURIComponent(published.version)}/page.html/${encodeURIComponent(representation)}"`;
      headers.set("ETag", "W/" + validator);
      if (published.prelaunch) headers.set("X-Robots-Tag", PRELAUNCH_ROBOTS_TAG);
      applyPublicHeaders(headers, url.origin);
      if (!wantsNativeSubscribeForm(request) && request.headers.get("If-None-Match")?.split(",").some(value => {
        const tag = value.trim().replace(/^W\//, "");
        return tag === "*" || tag === validator;
      })) {
        execution.waitUntil(published.stream.cancel());
        return preparePublicSubscribeDocument(new Response(null, { status: 304, headers }), request, bindings);
      }
      if (request.method === "HEAD") {
        execution.waitUntil(published.stream.cancel());
        return preparePublicSubscribeDocument(new Response(null, { headers }), request, bindings);
      }
      const response = new Response(published.stream, { headers });
      const last = cachedHomes.get(bucket);
      if (last?.version !== published.version || last.until <= Date.now()) {
        const cached = response.clone();
        execution.waitUntil((async () => {
          const cache = await caches.open("lamp-public-snapshot-fallback").catch(() => null);
          if (cache) {
            if (await cacheResponse(cache, new Request(url.origin + "/"), cached)) {
              cachedHomes.set(bucket, { version: published.version, until: Date.now() + 15 * 60_000 });
            }
          } else await cached.body?.cancel();
        })());
      }
      // Cache the unsigned snapshot before decorating the script-free form.
      return preparePublicSubscribeDocument(response, request, bindings);
    }
    if (published) execution.waitUntil(published.stream.cancel());
  }
  return stored.fetch(request, bindings, execution);
}
