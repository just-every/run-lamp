import { sessionCookie } from "@runeditrun/rer/internal/modules/operator-auth/http.mjs";
import { signInReturnPath } from "./return-path";

const name = "__Host-lamp_owner_return";
const cookie = { cookieName: name, secure: true };

// The terminal link only carries the one-use grant. Keep the destination in
// the browser that opened sign-in, and consume it only after Base signs in.
export function hostedOwnerSignInReturn(request: Request, response: Response, origin: string) {
  const url = new URL(request.url);
  if (url.origin !== origin || url.protocol !== "https:") return response;
  const headers = new Headers(response.headers);
  if (url.pathname === "/signin" && request.method === "GET" && response.status === 200
      && headers.get("content-type")?.includes("text/html")) {
    const target = signInReturnPath(url.searchParams.get("returnTo"), origin);
    headers.append("Set-Cookie", sessionCookie(target ? encodeURIComponent(target) : "", cookie, target ? 600 : 0));
  } else if (url.pathname === "/auth/owner-signin" && request.method === "POST"
      && response.status === 303 && headers.get("Location") === "/app" && headers.has("Set-Cookie")) {
    const values = (request.headers.get("Cookie") ?? "").split(";").map(value => value.trim())
      .filter(value => value.startsWith(`${name}=`));
    if (values.length !== 1) return response;
    let target;
    try { target = signInReturnPath(decodeURIComponent(values[0].slice(name.length + 1)), origin); }
    catch { return response; }
    if (!target) return response;
    headers.set("Location", new URL(target, origin).href);
    headers.append("Set-Cookie", sessionCookie("", cookie, 0));
  } else {
    return response;
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
