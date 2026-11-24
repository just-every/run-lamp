import { Hono } from "hono";
import { statusPagePrefix } from "../page-settings/page-selection";
import type { createApp } from "../../app/server";
import type { AppBindings, AppEnv } from "../../app/types";
import { escapeHtml } from "./format";
import { applyPublicIsolationHeaders } from "./headers";
import { protectedSnapshotHeaders, registerPublicSnapshotRoutes } from "./routes";

function signInRequired(request: Request, headers: Headers) {
  const message = "Any active operator signed in to this Lamp, including Viewers, can open this status page.";
  if (!request.headers.get("Accept")?.includes("text/html")) {
    return new Response(request.method === "HEAD" ? null : message, { status: 401, headers });
  }
  const url = new URL(request.url);
  const signIn = `/signin?${new URLSearchParams({ returnTo: url.pathname + url.search })}`;
  applyPublicIsolationHeaders(headers, url.origin);
  headers.set("Content-Type", "text/html; charset=utf-8");
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sign in to Lamp</title></head><body><main><h1>Sign in to Lamp</h1><p>${message}</p><a href="${escapeHtml(signIn)}">Sign in</a></main></body></html>`;
  return new Response(request.method === "HEAD" ? null : body, { status: 401, headers });
}

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
  let page;
  try {
    // Resolve the ordinary, revocable Lamp session before opening any page
    // directory, pointer, retained object, or artifact (including misses).
    if (!await runtime.services.auth().getSession(request)) {
      return signInRequired(request, headers);
    }
    page = await runtime.services.statusPages.get(address.page);
    if (!page) {
      return new Response("Status page not found.", { status: 404, headers });
    }
  } catch {
    return new Response("Status page access is temporarily unavailable.", { status: 503, headers });
  }

  const url = new URL(request.url);
  url.pathname = address.resource;
  const app = new Hono<AppEnv>();
  registerPublicSnapshotRoutes(app, runtime.services.scopedSnapshots.forPage(address.page), {
    path: address.page, prefix: statusPagePrefix(address.page), accentColor: page.accentColor,
  });
  const response = await app.fetch(new Request(url, { method: request.method, signal: request.signal }), bindings, execution);
  return new Response(response.body, { status: response.status, headers: protectedSnapshotHeaders(new Headers(response.headers)) });
}
