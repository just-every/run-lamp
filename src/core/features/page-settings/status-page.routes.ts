import type { Context, Hono } from "hono";
import type { BlobStore } from "../../platform/blobs/store";
import { z } from "zod";
import { authOrigin } from "../../platform/auth/config";
import { publicPageOrigin } from "../../app/public-origin";
import type { AppEnv } from "../../app/types";
import { pageSettingsSchema } from "../../shared/schemas";
import { createUlid, ulidSchema } from "../../shared/ids";
import { statusPagePathSchema, statusPagePrefix, statusPageStoragePrefix } from "./page-selection";
import { StatusPageComponentsError, StatusPageConflictError, type ProtectedStatusPage, type createStatusPageRepository } from "./status-page.repository";
import { LOGO_CONTENT_TYPES, MAX_LOGO_BYTES, type PageSettingsService } from "./service";

const presentation = pageSettingsSchema.pick({ pageName: true, tagline: true, accentColor: true, timezone: true, footerCreditEnabled: true }).extend({
  footerCreditEnabled: z.boolean().optional(),
  componentIds: z.array(ulidSchema).max(100).refine(ids => new Set(ids).size === ids.length, "Choose each component once."),
}).strict();

function validTimezone({ timezone }: { timezone: string }) {
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }); return true; }
  catch { return false; }
}

const timezoneIssue = { path: ["timezone"], message: "Choose a valid time zone." };

const createInput = z.object({
  ...presentation.shape,
  path: statusPagePathSchema.refine(path => path !== "public"),
  kind: z.enum(["staff", "audience"]),
}).strict().refine(validTimezone, timezoneIssue);

function pageView(page: ProtectedStatusPage, origin: string) {
  const { path, kind, pageName, tagline, accentColor, timezone, componentIds, footerCreditEnabled, updatedAt } = page;
  const url = new URL(statusPagePrefix(path) + "/", origin).href;
  return { path, kind, pageName, tagline, accentColor, timezone, componentIds, footerCreditEnabled, updatedAt, url, logoUrl: page.logoKey ? new URL("assets/logo", url).href : null };
}

export function registerStatusPageSettingsRoutes(
  app: Hono<AppEnv>,
  settings: PageSettingsService,
  repository: ReturnType<typeof createStatusPageRepository>,
  blobs: BlobStore,
  publish: (path: string) => Promise<void>,
) {
  app.get("/api/app/status-pages", async context => {
    const [primary, componentIds, protectedPages] = await Promise.all([settings.get(), repository.publicComponentIds(), repository.list()]);
    const origin = authOrigin(context.env);
    const pages = protectedPages.map(page => pageView(page, origin));
    if (!primary) return context.json({ pages });
    const { pageName, tagline, accentColor, timezone, footerCreditEnabled, updatedAt } = primary;
    const url = publicPageOrigin(origin, context.env.LAMP_PAGE_HOST) + "/";
    return context.json({ pages: [{ path: "public", kind: "public", pageName, tagline, accentColor, timezone, componentIds, footerCreditEnabled, updatedAt, url, logoUrl: primary.logoKey ? url + "assets/logo" : null }, ...pages] });
  });

  app.post("/api/app/status-pages", async context => {
    if (!["owner", "admin"].includes(context.get("operatorSession").operator.role)) return context.json({ error: "Only a page owner or admin can configure status pages." }, 403);
    const parsed = createInput.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: "Invalid status page settings." }, 400);
    try {
      const { path, kind, ...input } = parsed.data;
      const page = await repository.create(path, kind, input);
      await publish(page.path);
      return context.json({ page: pageView(page, authOrigin(context.env)) }, 201);
    } catch (cause) {
      if (cause instanceof StatusPageComponentsError) return context.json({ error: cause.message }, 400);
      if (cause instanceof StatusPageConflictError) return context.json({ error: cause.message }, 409);
      throw cause;
    }
  });

  app.put("/api/app/status-pages/:path", async context => {
    if (!["owner", "admin"].includes(context.get("operatorSession").operator.role)) return context.json({ error: "Only a page owner or admin can configure status pages." }, 403);
    const path = statusPagePathSchema.safeParse(context.req.param("path"));
    const input = presentation.refine(validTimezone, timezoneIssue).safeParse(await context.req.json().catch(() => null));
    if (!path.success || !input.success) return context.json({ error: "Invalid status page settings." }, 400);
    try {
      const page = await repository.update(path.data, input.data);
      if (!page) return context.json({ error: "Status page not found." }, 404);
      await publish(page.path);
      return context.json({ page: pageView(page, authOrigin(context.env)) });
    } catch (cause) {
      if (cause instanceof StatusPageComponentsError) return context.json({ error: cause.message }, 400);
      throw cause;
    }
  });

  const changeLogo = (upload: boolean) => async (context: Context<AppEnv>) => {
    if (!["owner", "admin"].includes(context.get("operatorSession").operator.role)) return context.json({ error: "Only a page owner or admin can configure status pages." }, 403);
    const path = statusPagePathSchema.safeParse(context.req.param("path"));
    if (!path.success || !(await repository.get(path.data))) return context.json({ error: "Status page not found." }, 404);
    let key: string | null = null;
    let contentType: string | null = null;
    if (upload) {
      const file = (await context.req.parseBody().catch(() => null))?.logo;
      if (!(file instanceof File) || !LOGO_CONTENT_TYPES.has(file.type) || file.size === 0 || file.size > MAX_LOGO_BYTES) {
        return context.json({ error: "Choose a PNG, JPEG, or WebP logo between 1 byte and 2 MB." }, 400);
      }
      key = "branding/logos/" + createUlid();
      contentType = file.type;
      await blobs.putBytes(statusPageStoragePrefix(path.data) + key, await file.arrayBuffer(), contentType);
    }
    const page = await repository.setLogo(path.data, key, contentType);
    if (!page) return context.json({ error: "Status page not found." }, 404);
    await publish(page.path);
    return context.json({ page: pageView(page, authOrigin(context.env)) });
  };
  app.post("/api/app/status-pages/:path/logo", changeLogo(true));
  app.delete("/api/app/status-pages/:path/logo", changeLogo(false));
}
