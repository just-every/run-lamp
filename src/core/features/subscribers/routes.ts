import { registerIncidentSubscriberRoutes } from "./incident-routes";
import { formPreferences, preferencesSchema } from "./preferences";
import { SubscriberLimitError } from "./limits";
import type { Hono } from "hono";
import { z } from "zod";

import type { AppEnv } from "../../app/types";
import { MailUnavailableError } from "../../platform/mail";
import { requestNetworkSubject, type PublicWriteRateLimiter } from "../../platform/security/rate-limiter";
import { ulidSchema } from "../../shared/ids";
import { applyPublicIsolationHeaders } from "../public-snapshot/headers";
import { renderSubscribeResult, renderSubscriberManagementPage, renderSubscriberTokenPage, type SubscribersService } from "./service";
import { registerSubscriberIntakeRoutes } from "./intake-routes";
import { webhookFormatSchema } from "./webhook-format";

const subscriberQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
}).strict();
const emailSchema = z.object({ email: z.email() }).strict();
const webhookSchema = z.object({ destination: z.url(), contactEmail: z.email(), componentIds: z.array(ulidSchema).max(200).default([]),webhookFormat:webhookFormatSchema.optional(), eventKinds: preferencesSchema.shape.eventKinds.optional(), minimumImpact: preferencesSchema.shape.minimumImpact.optional() }).strict();
const managementSchema=z.object({componentId:z.union([ulidSchema,z.array(ulidSchema).max(200)]).optional(),webhookFormat:webhookFormatSchema.optional(), preferencesPresent:z.literal("1").optional(), eventKind:z.union([z.enum(["incidents","maintenance","components"]),z.array(z.enum(["incidents","maintenance","components"])).max(3)]).optional(), minimumImpact:z.literal("Partially unavailable").optional()}).strict();

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function tokenHeaders(headers: Headers) {
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Robots-Tag", "noindex");
  headers.set("Cache-Control", "no-store");
}

function tokenResponse(request: Request, body: string, status = 200) {
  const response = new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
  applyPublicIsolationHeaders(response.headers, new URL(request.url).origin);
  tokenHeaders(response.headers);
  return response;
}

function publicFormResponse(request: Request, title: string, message: string, status: number, pageName: string, subscribeOffered = true) {
  if (request.headers.get("Accept")?.includes("text/html")) {
    return tokenResponse(request, renderSubscriberTokenPage(title, `<p>${message}</p>${subscribeOffered ? '<p><a href="/#subscribe">Back to the subscribe form</a></p>' : ""}`, pageName, undefined, subscribeOffered), status);
  }
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function allowedTokenRequest(context: { req: { raw: Request } }, limiter: PublicWriteRateLimiter | undefined, scope: string, token: string, pageName: string, subscribeOffered: boolean) {
  if (!limiter || await limiter.allow({ scope, subject: token, limit: 30 })) return null;
  const response = publicFormResponse(context.req.raw, "Too many requests", "Too many requests for this subscription link. Try again in a minute.", 429, pageName, subscribeOffered);
  tokenHeaders(response.headers);
  return response;
}

function parsedComponentIds(value: unknown) {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values.filter((entry): entry is string => typeof entry === "string").flatMap((entry) => {
    const result = ulidSchema.safeParse(entry);
    return result.success ? [result.data] : [];
  });
}

export function registerSubscriberRoutes(app: Hono<AppEnv>, service: SubscribersService, options: { rateLimiter?: PublicWriteRateLimiter; prelaunch?: () => Promise<boolean>; localMail?: boolean } = {}) {
  registerSubscriberIntakeRoutes(app,service,options);
  // The link pages of existing subscribers keep working before launch, but offer no way back to a form that is not there.
  const subscribeOffered = async () => !(await options.prelaunch?.());
  const full = (request: Request, pageName: string) => tokenResponse(request, renderSubscriberTokenPage("Subscriptions full", `<p>This page cannot take new subscriptions on that channel right now.</p><p>Follow the feeds for updates.</p><nav class="status-utilities" aria-label="Feeds"><a href="/feed.atom">Atom feed</a><a href="/feed.rss">RSS feed</a></nav>`, pageName), 409);
  registerIncidentSubscriberRoutes(app,service,{...options,response:tokenResponse,full});
  app.post("/subscribe", async (context) => {
    const pageName = await service.getPageName();
    const result = (title: string, message: string, status: number) => publicFormResponse(context.req.raw, title, message, status, pageName);
    if (context.req.header("Sec-Fetch-Site") === "cross-site") return result("Subscription unavailable", "Cross-site subscription requests are not accepted.", 403);
    if (options.rateLimiter && !(await options.rateLimiter.allow({ scope: "subscribe", subject: requestNetworkSubject(context.req.raw), limit: 5 }))) return result("Too many requests", "Too many subscription requests. Try again in a minute.", 429);
    // all: true keeps every ticked componentId; without it Hono keeps only the last one.
    const body = await context.req.parseBody({ all: true });
    const parsed = emailSchema.safeParse({ email: body.email });
    if (!parsed.success) return result("Check your email address", "Enter a valid email address.", 400);
    try {
      const componentIds = parsedComponentIds(body.componentId);
      const preferences = formPreferences(body);
      await service.requestEmailSubscription(parsed.data.email, new URL(context.req.url).origin, componentIds, preferences);
      // Preserve the same response for active, pending and suppressed requests.
      if (!context.req.header("Accept")?.includes("text/html")) return options.localMail
        ? result("Local subscription", "No email was sent on this computer. The local owner can confirm pending subscribers in Subscribers → Delivery log.", 202)
        : result("Check your inbox", "Check your email to confirm or manage this subscription.", 202);
      return tokenResponse(context.req.raw, renderSubscribeResult({ email: parsed.data.email, components: await service.componentNames(componentIds) }, pageName, options.localMail), 202);
    } catch (error) {
      if (error instanceof SubscriberLimitError) return full(context.req.raw, pageName);
      if (error instanceof z.ZodError) return result("Check your preferences", "Choose supported update events and an incident threshold.", 400);
      if (error instanceof MailUnavailableError) return result("Subscriptions unavailable", "Subscriptions are not configured because this deployment has no mail sender. No confirmation email was sent.", 503);
      throw error;
    }
  });
  app.get("/confirm-subscription/:token", async (context) => {
    const pageName = await service.getPageName(), offered = await subscribeOffered();
    const limited = await allowedTokenRequest(context, options.rateLimiter, "subscription-confirm", context.req.param("token") ?? "", pageName, offered);
    if (limited) return limited;
    const incident = await service.getConfirmationIncident(context.req.param("token") ?? "");
    const confirmed = await service.confirm(context.req.param("token") ?? "");
    return tokenResponse(context.req.raw, confirmed ? renderSubscriberTokenPage("Subscription confirmed", `${incident?`<p>Following ${escapeHtml(incident.reference)}</p>`:""}<p>${incident?`You'll get updates about ${escapeHtml(incident.reference)} only.`:`You'll get ${escapeHtml(pageName)} updates through this subscription.`}</p><p><a href="/">See current status</a></p>`, pageName, "done", offered) : renderSubscriberTokenPage("Subscription unavailable", "<p>This confirmation link is invalid or has expired.</p>", pageName, undefined, offered), confirmed ? 200 : 404);
  });
  app.get("/manage/:token", async (context) => {
    const pageName = await service.getPageName(), offered = await subscribeOffered();
    const token = context.req.param("token") ?? "";
    const limited = await allowedTokenRequest(context, options.rateLimiter, "subscription-manage", token, pageName, offered);
    if (limited) return limited;
    const managed = await service.getManagedSubscription(token);
    return managed ? tokenResponse(context.req.raw, renderSubscriberManagementPage(managed, pageName, offered)) : tokenResponse(context.req.raw, renderSubscriberTokenPage("Subscription unavailable", "<p>This subscription link is invalid or no longer active.</p>", pageName, undefined, offered), 404);
  });
  app.post("/manage/:token", async (context) => {
    const pageName = await service.getPageName(), offered = await subscribeOffered();
    const token = context.req.param("token") ?? "";
    const limited = await allowedTokenRequest(context, options.rateLimiter, "subscription-manage", token, pageName, offered);
    if (limited) return limited;
    const parsed=managementSchema.safeParse(await context.req.parseBody({all:true}));
    if(!parsed.success)return tokenResponse(context.req.raw,renderSubscriberTokenPage("Subscription unavailable","<p>Choose valid components and a supported webhook format.</p>",pageName,undefined,offered),400);
    const updated = await service.updateManagedSelection(token, parsedComponentIds(parsed.data.componentId),parsed.data.webhookFormat,formPreferences(parsed.data));
    return updated ? tokenResponse(context.req.raw, renderSubscriberTokenPage("Subscription updated", "<p>Your selection is saved.</p><p><a href=\"/\">See current status</a></p>", pageName, "done", offered)) : tokenResponse(context.req.raw, renderSubscriberTokenPage("Subscription unavailable", "<p>This subscription link is invalid or no longer active.</p>", pageName, undefined, offered), 404);
  });
  app.get("/unsubscribe/:token", async (context) => {
    const pageName = await service.getPageName(), offered = await subscribeOffered();
    const limited = await allowedTokenRequest(context, options.rateLimiter, "subscription-unsubscribe", context.req.param("token") ?? "", pageName, offered);
    return limited ?? tokenResponse(context.req.raw, renderSubscriberTokenPage("Unsubscribe", "<form method=\"post\"><input type=\"hidden\" name=\"action\" value=\"unsubscribe\"><button type=\"submit\">Unsubscribe</button></form>", pageName, undefined, offered));
  });
  app.post("/unsubscribe/:token", async (context) => {
    const pageName = await service.getPageName(), offered = await subscribeOffered();
    const limited = await allowedTokenRequest(context, options.rateLimiter, "subscription-unsubscribe", context.req.param("token") ?? "", pageName, offered);
    if (limited) return limited;
    const form = await context.req.parseBody();
    const oneClick = form["List-Unsubscribe"] === "One-Click";
    const accepted = oneClick || form.action === "unsubscribe";
    const unsubscribed = accepted && await service.unsubscribe(context.req.param("token") ?? "");
    if (!oneClick && context.req.header("Accept")?.includes("text/html")) {
      return tokenResponse(context.req.raw, renderSubscriberTokenPage(unsubscribed ? "Unsubscribed" : "Subscription unavailable", unsubscribed
        ? `<p>You won't get status updates any more.</p>${offered ? '<p><a href="/#subscribe">Subscribe again</a></p>' : ""}`
        : "<p>This subscription link is invalid or no longer active.</p>", pageName, undefined, offered), unsubscribed ? 200 : 404);
    }
    const response = new Response(unsubscribed ? "" : "Subscription link is invalid or no longer active.", { status: unsubscribed ? 200 : 404 });
    tokenHeaders(response.headers);
    return response;
  });

  // Only the development mail mode exposes this owner action. Production and
  // demo requests cannot enable it with a host, request body or runtime flag.
  if (options.localMail) app.post("/api/app/subscribers/:subscriberId/confirm-local", async context => {
    if (context.get("operator").role !== "owner") return context.json({ error: "Only the local owner can confirm a subscriber." }, 403);
    const id = ulidSchema.safeParse(context.req.param("subscriberId"));
    if (!id.success) return context.json({ error: "Choose a pending subscriber." }, 400);
    return await service.confirmLocally(id.data)
      ? context.json({ confirmed: true })
      : context.json({ error: "This subscriber is not pending or their confirmation has expired." }, 409);
  });

  app.get("/api/app/subscribers", async (context) => {
    const parsed = subscriberQuerySchema.safeParse(context.req.query());
    if (!parsed.success) return context.json({ error: "Invalid subscriber query.", issues: parsed.error.issues }, 400);
    const page = await service.listPage(parsed.data.limit, parsed.data.offset);
    return context.json({
      subscribers: page.subscribers,
      capacity: await service.getLimits(),
      localMail: options.localMail === true,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      hasMore: page.hasMore,
    });
  });
  app.post("/api/app/subscribers/webhook", async (context) => {
    const parsed = webhookSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: "Invalid webhook subscription.", issues: parsed.error.issues }, 400);
    try { return context.json({ subscriber: await service.createWebhookSubscription({ ...parsed.data, preferences: parsed.data.eventKinds === undefined && parsed.data.minimumImpact === undefined ? undefined : preferencesSchema.parse({ eventKinds: parsed.data.eventKinds ?? ["incidents","maintenance","components"], minimumImpact: parsed.data.minimumImpact }) }) }, 201); }
    catch (error) { return context.json({ error: error instanceof Error ? error.message : "Unable to create subscriber." }, error instanceof SubscriberLimitError ? 409 : 400); }
  });
  app.delete("/api/app/subscribers/:subscriberId", async (context) => {
    const subscriberId = ulidSchema.safeParse(context.req.param("subscriberId"));
    if (!subscriberId.success) return context.json({ error: "Expected a canonical subscriber ID." }, 400);
    return (await service.deleteSubscriber(subscriberId.data, context.get("operator").id)) ? context.body(null, 204) : context.json({ error: "Subscriber not found." }, 404);
  });
}
