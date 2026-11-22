import { securityHeaders } from "@runeditrun/rer/modules/operator-auth";
import { escapeHtml } from "@runeditrun/rer/internal/modules/operator-auth/http.mjs";
import { pageResponse } from "@runeditrun/rer/internal/modules/operator-auth/page.mjs";
import type { AppBindings } from "../../../app/types";
import { createLampAuth } from "..";
import { localReturnPath } from "../local-return";
import script from "./client.js?raw";
import { PasskeyStore } from "./repository";

const hash = async (value: string) => {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return `'sha256-${btoa(String.fromCharCode(...new Uint8Array(bytes)))}'`;
};
const signInStyle = `
  [data-passkey="signin"] {
    margin-top: 16px;
    min-height: 44px;
    padding: 8px 16px;
    border: 1px solid transparent;
    border-radius: var(--rer-radius, 10px);
    background: var(--rer-accent, #163c60);
    color: var(--rer-accent-text, #fff);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  [data-passkey="signin"]:disabled { opacity: .6; cursor: default; }
  [data-passkey="signin"]:focus-visible { outline: 3px solid var(--rer-focus, #163c60); outline-offset: 3px; }
  #passkey-status:not(:empty) { margin-top: 12px; }
`;
const scriptHash = hash(script), styleHash = hash(signInStyle);

function control(operation: "enroll" | "signin", returnTo = "/app") {
  const label = operation === "enroll" ? "Enroll passkey" : "Sign in with a passkey";
  return `<button type="button" disabled data-passkey="${operation}" data-return-to="${escapeHtml(returnTo)}">${label}</button><p id="passkey-status" role="status"></p>`;
}

async function scripted(response: Response, content?: string) {
  const headers = new Headers(response.headers);
  const scriptSource = await scriptHash;
  let policy = headers.get("Content-Security-Policy") ?? "";
  policy = /(?:^|;\s*)script-src /.test(policy)
    ? policy.replace(/(?:^|;\s*)script-src [^;]+/, directive => `${directive} ${scriptSource}`)
    : `${policy}; script-src ${scriptSource}`;
  if (!/(?:^|;\s*)connect-src /.test(policy)) policy += "; connect-src 'self'";
  if (content) {
    const styleSource = await styleHash;
    policy = policy.replace(/(?:^|;\s*)style-src [^;]+/, directive => `${directive} ${styleSource}`);
  }
  headers.set("Content-Security-Policy", policy);
  headers.delete("Content-Length");
  return new HTMLRewriter()
    .on("head", { element(head) { if (content) head.append(`<style>${signInStyle}</style>`, { html: true }); } })
    .on("main", { element(main) { if (content) main.append(content, { html: true }); } })
    .on("body", { element(body) { body.append(`<script>${script}</script>`, { html: true }); } })
    .transform(new Response(response.body, { status: response.status, headers }));
}

export async function passkeyEnrollment(request: Request, env: AppBindings) {
  const auth = createLampAuth(env);
  const store = new PasskeyStore(env.DB);
  const [session, owner] = await Promise.all([auth.getSession(request), store.owner()]);
  if (!session || session.operator.id !== owner?.id || session.kind !== "dev") {
    return new Response(null, { status: 303, headers: { ...securityHeaders(), Location: "/signin?returnTo=%2Fauth%2Flocal%2Fpasskey" } });
  }
  const enrolled = await store.credential(owner.id);
  const content = (enrolled
    ? '<p role="status">Passkey enrolled. You can use it to sign in to this Lamp installation on localhost.</p>'
    : '<p>Use your device or security key to sign in to this Lamp installation.</p>' + control("enroll"))
    + '<p class="secondary-link"><a href="/app/settings#sign-in">Back to Sign-in settings</a></p>';
  const response = await pageResponse({ branding: auth.presentation, heading: "Local passkey", method: request.method, referrer: "no-referrer", content });
  return enrolled || request.method === "HEAD" ? response : scripted(response);
}

export async function addPasskeySignIn(request: Request, response: Response, env: AppBindings) {
  const store = new PasskeyStore(env.DB);
  const owner = await store.owner();
  if (!owner || !await store.credential(owner.id)) return response;
  const url = new URL(request.url);
  const target = localReturnPath(url.searchParams.get("returnTo"), url.origin);
  return scripted(response, control("signin", target ?? "/app"));
}
