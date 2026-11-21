import { Hono } from "hono";
import { staffCidrAllows } from "../page-settings/staff-cidrs";
import { statusPagePrefix } from "../page-settings/page-selection";
import type { createApp } from "../../app/server";
import type { AppBindings, AppEnv } from "../../app/types";
import { escapeHtml } from "./format";
import { protectedSnapshotHeaders, registerPublicSnapshotRoutes } from "./routes";

function trustedConnectionAddress(request: Request, bindings: AppBindings) {
  // Local ingress does not own Cloudflare's header. A Worker subrequest is also
  // excluded because a same-zone Worker can influence its apparent address.
  if (bindings.AUTH_LOCAL === "true" || bindings.LAMP_LOCAL_ORIGIN || bindings.RER_DEV_ORIGIN
    || !request.cf?.colo || request.headers.has("CF-Worker")) return null;
  const ip = request.headers.get("CF-Connecting-IP");
  // The Pseudo IPv4 overwrite mode substitutes a Class E address for IPv6.
  return ip && !/^(?:24[0-9]|25[0-5])\./.test(ip) ? ip : null;
}

function signInRequired(request: Request, headers: Headers, path: string, pageName?: string) {
  if (!pageName) {
    return new Response(request.method === "HEAD" ? null : "Sign in to Lamp to read this status page.", { status: 401, headers });
  }

  const name = escapeHtml(pageName);
  const returnTo = new URLSearchParams({ returnTo: statusPagePrefix(path) + "/" });
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Content-Security-Policy", "default-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  const document = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${name}</title>
</head>
<body><main>
  <h1>${name}</h1>
  <p>Sign in to Lamp to read this status page.</p>
  <a href="/signin?${returnTo}">Sign in</a>
</main></body>
</html>`;
  return new Response(request.method === "HEAD" ? null : document, { status: 401, headers });
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
  try {
    // Page identity and admission policy come from D1. No snapshot directory,
    // pointer or artifact is opened until the request has been admitted.
    const operator = await runtime.services.auth().getSession(request);
    const page = await runtime.services.statusPages.get(address.page);
    if (!page && operator) return new Response("Status page not found.", { status: 404, headers });
    if (!operator) {
      if (page?.kind !== "staff") return signInRequired(request, headers, address.page);
      const ip = trustedConnectionAddress(request, bindings);
      if (!ip || !staffCidrAllows(ip, page.allowedCidrs)) {
        return signInRequired(request, headers, address.page, page.pageName);
      }
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
