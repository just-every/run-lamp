import type { AppBindings } from "../../app/types";
import { createSnapshotBlobStore } from "../../platform/blobs/r2";
import { PRELAUNCH_ROBOTS_TAG, PRELAUNCH_ROBOTS_TXT } from "./policy";
import { readPrelaunch } from "./store";

// The app host's public HTML: the Lobby and the product docs. Everything else there is a session, a redirect or JSON.
const isPublicAppDocument = (pathname: string) => pathname === "/" || pathname === "/docs" || pathname.startsWith("/docs/");

// An unreadable setting answers as pre-launch: noindex and Disallow are the safe direction.
async function prelaunchOn(bindings: AppBindings) {
  try { return await readPrelaunch(createSnapshotBlobStore(bindings)); } catch { return true; }
}

/** While pre-launch is on, the app host's public pages tell search engines to stay away, as the page host's do. */
export async function noindexAppDocument(request: Request, bindings: AppBindings, response: Response): Promise<Response> {
  if (!isPublicAppDocument(new URL(request.url).pathname) || !await prelaunchOn(bindings)) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", PRELAUNCH_ROBOTS_TAG);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** The app host has a robots.txt only while pre-launch is on; otherwise its answer is the Worker's plain 404. */
export async function appHostRobots(request: Request, bindings: AppBindings): Promise<Response> {
  if ((request.method !== "GET" && request.method !== "HEAD") || !await prelaunchOn(bindings)) return new Response("Not found.", { status: 404 });
  return new Response(request.method === "HEAD" ? null : PRELAUNCH_ROBOTS_TXT, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": PRELAUNCH_ROBOTS_TAG } });
}
