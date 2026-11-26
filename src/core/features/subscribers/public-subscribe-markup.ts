import type { AppBindings } from "../../app/types";
import { applyPublicIsolationHeaders } from "../public-snapshot/headers";
import { issuePublicSubscribeChallenge, publicTurnstileSiteKey, turnstileOrigin } from "./public-subscribe-check";

export const subscribeHoneypot = '<div hidden><label>Website <input type="text" name="subscribeWebsite" autocomplete="off" tabindex="-1"></label></div>';
export const noScriptSubscribeLink = (anchor: string, label: string) =>
  `<noscript class="subscribe-no-script"><p><a href="?subscribe=1#${anchor}">${label}</a></p></noscript>`;

export function wantsNativeSubscribeForm(request: Request) {
  return new URL(request.url).searchParams.get("subscribe") === "1";
}

/** The script-free form is a private variant of the ordinary status document.
 * Only the public generation without the visitor's signed token enters the cache. */
export async function preparePublicSubscribeDocument(response: Response, request: Request, settings: AppBindings) {
  if (!response.headers.get("Content-Type")?.includes("text/html")) return response;
  const turnstile = publicTurnstileSiteKey(settings);
  if (turnstile) applyPublicIsolationHeaders(response.headers, new URL(request.url).origin, turnstileOrigin);
  if (!wantsNativeSubscribeForm(request) || response.status !== 200) return response;

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.delete("ETag");
  const challenge = await issuePublicSubscribeChallenge(settings, request);
  if (!challenge || challenge.siteKey) {
    return new HTMLRewriter().on(".subscribe-no-script", {
      element(element) {
        element.setInnerContent(challenge?.siteKey
          ? "<p>Enable JavaScript to complete the subscription check.</p>"
          : "<p>Subscriptions are unavailable right now.</p>", { html: true });
      },
    }).transform(response);
  }
  return new HTMLRewriter()
    .on("form[data-subscribe-check]", {
      element(element) {
        element.append(`<input type="hidden" name="subscribeToken" value="${challenge.token}">`, { html: true });
      },
    })
    .on(".subscribe-no-script", { element(element) { element.remove(); } })
    .transform(response);
}
