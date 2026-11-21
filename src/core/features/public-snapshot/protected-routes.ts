import { Hono } from "hono";
import { statusPagePrefix } from "../page-settings/page-selection";
import type { createApp } from "../../app/server";
import type { AppBindings, AppEnv } from "../../app/types";
import { protectedSnapshotHeaders, registerPublicSnapshotRoutes } from "./routes";

export async function protectedStatusPage(
  request: Request,
  bindings: AppBindings,
  execution: ExecutionContext,
  runtime: ReturnType<typeof createApp>,
  address: { page: string; resource: string },
) {
  const headers = protectedSnapshotHeaders();
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("Allow", "GET, HEAD");
    return new Response("Method not allowed.", { status: 405, headers });
  }
  try {
    // Resolve the ordinary, revocable Lamp session before opening any page
    // directory, pointer, retained object, or artifact (including misses).
    if (!await runtime.services.auth().getSession(request)) {
      return new Response("Sign in to Lamp to read this status page.", { status: 401, headers });
    }
    if (!await runtime.services.statusPages.get(address.page)) {
      return new Response("Status page not found.", { status: 404, headers });
    }
  } catch {
    return new Response("Status page access is temporarily unavailable.", { status: 503, headers });
  }

  const url = new URL(request.url);
  url.pathname = address.resource;
  const app = new Hono<AppEnv>();
  registerPublicSnapshotRoutes(app, runtime.services.scopedSnapshots.forPage(address.page), statusPagePrefix(address.page));
  const response = await app.fetch(new Request(url, { method: request.method }), bindings, execution);
  return new Response(response.body, { status: response.status, headers: protectedSnapshotHeaders(new Headers(response.headers)) });
}
