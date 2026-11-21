import type { Context, Hono } from "hono";
import type { BlobStore } from "../../platform/blobs/store";
import { z } from "zod";
import { authOrigin } from "../../platform/auth/config";
import { publicPageOrigin } from "../../app/public-origin";
import type { AppEnv } from "../../app/types";
import { pageSettingsSchema } from "../../shared/schemas";
import { createUlid, ulidSchema } from "../../shared/ids";
import { validStaffCidr } from "./staff-cidrs";
import { statusPagePathSchema, statusPagePrefix, statusPageStoragePrefix } from "./page-selection";
import { StatusPageComponentsError, StatusPageConflictError, type ProtectedStatusPage, type createStatusPageRepository } from "./status-page.repository";
import { LOGO_CONTENT_TYPES, MAX_LOGO_BYTES, type PageSettingsService } from "./service";

const presentation = pageSettingsSchema.pick({ pageName: true, tagline: true, accentColor: true, timezone: true, footerCreditEnabled: true }).extend({
  footerCreditEnabled: z.boolean().optional(),
  allowedCidrs: z.array(z.string().trim().max(49).refine(validStaffCidr)).max(64).optional(),
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

function invalidSettings(context: Context<AppEnv>, error: z.ZodError | undefined) {
  const invalidCidrs = error?.issues.some(issue => issue.path[0] === "allowedCidrs");
  return context.json({ error: invalidCidrs
    ? "Enter up to 64 IPv4 or IPv6 CIDR ranges, each with a prefix length."
    : "Invalid status page settings." }, 400);
}

function pageView(page: ProtectedStatusPage, origin: string, owner: boolean) {
  const { path, kind, pageName, tagline, accentColor, timezone, componentIds, footerCreditEnabled, updatedAt } = page;
  const url = new URL(statusPagePrefix(path) + "/", origin).href;
  return {
    path, kind, pageName, tagline, accentColor, timezone, componentIds, footerCreditEnabled, updatedAt, url,
    ...(owner && kind === "staff" ? { allowedCidrs: page.allowedCidrs } : {}),
    logoUrl: page.logoKey ? new URL("assets/logo", url).href : null,
  };
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
    const owner = context.get("operatorSession").operator.role === "owner";
    const pages = protectedPages.map(page => pageView(page, origin, owner));
    if (!primary) return context.json({ pages });
    const { pageName, tagline, accentColor, timezone, footerCreditEnabled, updatedAt } = primary;
    const url = publicPageOrigin(origin, context.env.LAMP_PAGE_HOST) + "/";
    return context.json({ pages: [{ path: "public", kind: "public", pageName, tagline, accentColor, timezone, componentIds, footerCreditEnabled, updatedAt, url, logoUrl: primary.logoKey ? url + "assets/logo" : null }, ...pages] });
  });

  app.post("/api/app/status-pages", async context => {
    const { role } = context.get("operatorSession").operator;
    if (!["owner", "admin"].includes(role)) return context.json({ error: "Only a page owner or admin can configure status pages." }, 403);
    const parsed = createInput.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return invalidSettings(context, parsed.error);
    if (parsed.data.allowedCidrs !== undefined && role !== "owner") {
      return context.json({ error: "Only the installation owner can configure allowed IP ranges." }, 403);
    }
    if (parsed.data.allowedCidrs?.length && parsed.data.kind !== "staff") {
      return context.json({ error: "Allowed IP ranges are available for Staff pages." }, 400);
    }
    try {
      const { path, kind, ...input } = parsed.data;
      const page = await repository.create(path, kind, input);
      await publish(page.path);
      return context.json({ page: pageView(page, authOrigin(context.env), role === "owner") }, 201);
    } catch (cause) {
      if (cause instanceof StatusPageComponentsError) return context.json({ error: cause.message }, 400);
      if (cause instanceof StatusPageConflictError) return context.json({ error: cause.message }, 409);
      throw cause;
    }
  });

  app.put("/api/app/status-pages/:path", async context => {
    const { role } = context.get("operatorSession").operator;
    if (!["owner", "admin"].includes(role)) return context.json({ error: "Only a page owner or admin can configure status pages." }, 403);
    const path = statusPagePathSchema.safeParse(context.req.param("path"));
    const input = presentation.refine(validTimezone, timezoneIssue).safeParse(await context.req.json().catch(() => null));
    if (!path.success || !input.success) return invalidSettings(context, input.error);
    if (input.data.allowedCidrs !== undefined && role !== "owner") {
      return context.json({ error: "Only the installation owner can configure allowed IP ranges." }, 403);
    }
    if (input.data.allowedCidrs?.length) {
      const existing = await repository.get(path.data);
      if (!existing) return context.json({ error: "Status page not found." }, 404);
      if (existing.kind !== "staff") return context.json({ error: "Allowed IP ranges are available for Staff pages." }, 400);
    }
    try {
      const page = await repository.update(path.data, input.data);
      if (!page) return context.json({ error: "Status page not found." }, 404);
      await publish(page.path);
      return context.json({ page: pageView(page, authOrigin(context.env), role === "owner") });
    } catch (cause) {
      if (cause instanceof StatusPageComponentsError) return context.json({ error: cause.message }, 400);
      throw cause;
    }
  });

  const changeLogo = (upload: boolean) => async (context: Context<AppEnv>) => {
    const { role } = context.get("operatorSession").operator;
    if (!["owner", "admin"].includes(role)) return context.json({ error: "Only a page owner or admin can configure status pages." }, 403);
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
    return context.json({ page: pageView(page, authOrigin(context.env), role === "owner") });
  };
  app.post("/api/app/status-pages/:path/logo", changeLogo(true));
  app.delete("/api/app/status-pages/:path/logo", changeLogo(false));
}
