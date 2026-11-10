import type { Hono, MiddlewareHandler } from "hono";
import type { AppEnv } from "../../app/types";
import type { BlobStore } from "../../platform/blobs/store";
import { createPrelaunchStore } from "./store";
import { PRELAUNCH_BLOCKED_GETS, PRELAUNCH_BLOCKED_POSTS, PRELAUNCH_ROBOTS_TAG } from "./policy";

/**
 * While pre-launch is on, no public route may create a subscriber or send a
 * message. The check runs before any body read, write or send, and an
 * unreadable setting refuses too. Registered ahead of the subscription routes;
 * confirm, manage and unsubscribe links of existing subscribers are untouched.
 */
export function registerPrelaunchGate(app: Hono<AppEnv>, blobs: BlobStore, binding: D1Database) {
  const store = createPrelaunchStore(blobs, binding);
  const gate: MiddlewareHandler<AppEnv> = async (context, next) => {
    if (!await store.enabled()) return next();
    const wantsHtml = context.req.header("Accept")?.includes("text/html");
    const message = "Subscriptions are not open yet. This status page has not launched.";
    return new Response(wantsHtml ? `<!doctype html><meta charset="utf-8"><title>Subscriptions not open yet</title><p>${message}</p>` : message, {
      status: 503,
      headers: { "Content-Type": wantsHtml ? "text/html; charset=utf-8" : "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "3600", "X-Robots-Tag": PRELAUNCH_ROBOTS_TAG },
    });
  };
  for (const path of PRELAUNCH_BLOCKED_POSTS) app.post(path, gate);
  for (const path of PRELAUNCH_BLOCKED_GETS) app.get(path, gate);
}
