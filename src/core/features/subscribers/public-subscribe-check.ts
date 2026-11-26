import type { AppBindings } from "../../app/types";
import { constantTimeEqual, createOpaqueToken, hmacSha256 } from "../../platform/security/opaque-tokens";
import type { PublicWriteRateLimiter } from "../../platform/security/rate-limiter";

const minAgeMs = 1_000;
const maxAgeMs = 15 * 60_000;
export const turnstileAction = "lamp_subscribe";
export const turnstileOrigin = "https://challenges.cloudflare.com";

type Settings = Pick<AppBindings, "SUBSCRIBER_TOKEN_SECRET" | "TURNSTILE_SITE_KEY" | "TURNSTILE_SECRET_KEY">;
type Form = Record<string, unknown>;

export function publicTurnstileSiteKey(settings: Settings) {
  return settings.TURNSTILE_SECRET_KEY?.trim() && settings.TURNSTILE_SITE_KEY?.trim() || undefined;
}

function network(request: Request) {
  // Workers supplies this header. Never let a caller choose its rate bucket
  // through X-Forwarded-For. In local/offline runs use a shared bucket.
  return request.headers.get("CF-Connecting-IP")?.trim().slice(0, 64) || "unknown-network";
}

function rateBucket(request: Request, groups = 4) {
  const address = network(request).toLowerCase();
  if (!address.includes(":")) return address;
  // A client can rotate addresses within a typical IPv6 allocation.
  const [left, right] = address.split("::");
  const first = left ? left.split(":") : [];
  const last = right ? right.split(":") : [];
  const prefix = right === undefined ? first : [...first, ...Array(Math.max(0, 8 - first.length - last.length)).fill("0"), ...last];
  return `${prefix.slice(0, groups).map(part => part.replace(/^0+(?=.)/, "")).join(":")}::/${groups * 16}`;
}

async function signature(secret: string, request: Request, payload: string) {
  const scope = JSON.stringify([new URL(request.url).origin, network(request), payload]);
  return hmacSha256(secret, `lamp-public-subscribe.v1.${scope}`);
}

export async function issuePublicSubscribeChallenge(settings: Settings, request: Request) {
  const secret = settings.SUBSCRIBER_TOKEN_SECRET;
  const siteKey = publicTurnstileSiteKey(settings);
  if (!secret || ((settings.TURNSTILE_SECRET_KEY?.trim() || settings.TURNSTILE_SITE_KEY?.trim()) && !siteKey)) return null;
  const payload = `${Date.now()}.${createOpaqueToken()}`;
  return {
    token: `${payload}.${await signature(secret, request, payload)}`,
    waitMs: minAgeMs,
    expiresInMs: maxAgeMs,
    siteKey,
  };
}

async function verifyTurnstile(settings: Settings, request: Request, token: unknown) {
  const secret = settings.TURNSTILE_SECRET_KEY?.trim();
  if (!secret && !settings.TURNSTILE_SITE_KEY?.trim()) return true;
  if (!secret || !publicTurnstileSiteKey(settings) || typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const response = await fetch(`${turnstileOrigin}/turnstile/v0/siteverify`, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      redirect: "manual",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    const result = await response.json<{ success?: boolean; hostname?: string; action?: string }>();
    return result?.success === true && result.hostname === new URL(request.url).hostname && result.action === turnstileAction;
  } catch {
    return false;
  }
}

export function createPublicSubscribeCheck(settings: Settings, limiter: PublicWriteRateLimiter) {
  return async (request: Request, body: Form) => {
    const secret = settings.SUBSCRIBER_TOKEN_SECRET;
    if (!secret || body.subscribeWebsite !== "" || typeof body.subscribeToken !== "string" || body.subscribeToken.length > 105) return false;
    const parts = /^(\d{13})\.([A-Za-z0-9_-]{43})\.([A-Za-z0-9_-]{43})$/.exec(body.subscribeToken);
    if (!parts) return false;
    const [, issued, nonce, signed] = parts;
    const now = Date.now(), age = now - Number(issued);
    if (age < minAgeMs || age >= maxAgeMs || !constantTimeEqual(signed, await signature(secret, request, `${issued}.${nonce}`))) return false;

    const subject = await hmacSha256(secret, `lamp-subscribe-network.v1.${rateBucket(request)}`);
    // A free tunnel broker hands out a /48: 65,536 separate /64 allowances.
    const site = network(request).includes(":") ? await hmacSha256(secret, `lamp-subscribe-network.v1.${rateBucket(request, 3)}`) : undefined;
    try {
      // Both public forms share the same IP allowance. The subscriber service
      // separately reserves the 24-hour confirmation slot for the address.
      if (!await limiter.allow({ scope: "subscription-email-minute", subject, limit: 5 })) return false;
      if (!await limiter.allow({ scope: "subscription-email-hour", subject, limit: 10, windowMs: 3_600_000 })) return false;
      if (site && !await limiter.allow({ scope: "subscription-email-site-hour", subject: site, limit: 30, windowMs: 3_600_000 })) return false;
      if (!await limiter.consume("subscription-form", nonce, Number(issued) + maxAgeMs)) return false;
    } catch {
      // With no durable reservation, the public request cannot send mail.
      return false;
    }
    return verifyTurnstile(settings, request, body["cf-turnstile-response"]);
  };
}
