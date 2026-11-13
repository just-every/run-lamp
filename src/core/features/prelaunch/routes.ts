import type { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../app/types";
import type { BlobStore } from "../../platform/blobs/store";
import { createPrelaunchStore } from "./store";

const settingsSchema = z.object({ enabled: z.boolean() }).strict();

export function registerPrelaunchRoutes(app: Hono<AppEnv>, blobs: BlobStore, binding: D1Database, onChanged: () => Promise<unknown>) {
  const store = createPrelaunchStore(blobs, binding);
  app.get("/api/app/prelaunch", async context => {
    context.header("Cache-Control", "private, no-store");
    return context.json({ enabled: await store.enabled() });
  });
  app.patch("/api/app/prelaunch", async context => {
    const input = settingsSchema.safeParse(await context.req.json().catch(() => null));
    if (!input.success) return context.json({ error: "Choose whether the page is pre-launch.", issues: input.error.issues }, 400);
    if (!await store.set(input.data.enabled, context.get("operator").id, new Date().toISOString())) return context.json({ error: "Only an active owner or admin can change pre-launch." }, 403);
    // The public page changes with the setting: rebuild before answering.
    await onChanged();
    context.header("Cache-Control", "private, no-store");
    return context.json({ enabled: await store.enabled() });
  });
}
