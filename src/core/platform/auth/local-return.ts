import { localCookieName, sessionCookie } from "@runeditrun/rer/internal/modules/operator-auth/http.mjs";
import { signInReturnPath } from "./return-path";

const terminalPath = "/__dev/key";

export function localReturnCookie(origin: string, value: string, age: number) {
  return sessionCookie(value, { cookieName: localCookieName("lamp_dev_return", origin), secure: new URL(origin).protocol === "https:" }, age);
}

/** Carry the destination across pasting rer's private link, whose URL has only
 * the entry credential. Only an accepted dev sign-in can consume it. */
export async function localSignInReturn(request: Request, response: Response, origin: string) {
  const url = new URL(request.url);
  if (url.origin !== origin) return response;
  const name = localCookieName("lamp_dev_return", origin);
  const headers = new Headers(response.headers);
  if (url.pathname === "/signin" && response.status === 303 && headers.get("location") === terminalPath) {
    const target = signInReturnPath(url.searchParams.get("returnTo"), origin);
    if (target) {
      headers.set("Location", `${terminalPath}?${new URLSearchParams({ returnTo: target })}`);
      if (request.method === "GET") headers.append("Set-Cookie", localReturnCookie(origin, encodeURIComponent(target), 600));
    } else if (request.method === "GET") {
      headers.append("Set-Cookie", localReturnCookie(origin, "", 0));
    }
    return new Response(response.body, { status: response.status, headers });
  }

  const persona = url.pathname === terminalPath && request.method === "POST" && response.status === 200
    && headers.get("content-type")?.startsWith("application/json");
  const terminal = url.pathname === "/auth/dev/enter" && response.status === 303 && headers.get("location") === "/app";
  if (!persona && !terminal) return response;
  const values = (request.headers.get("cookie") ?? "").split(";").map(value => value.trim())
    .filter(value => value.startsWith(`${name}=`));
  if (values.length !== 1) return response;
  let target;
  try { target = signInReturnPath(decodeURIComponent(values[0].slice(name.length + 1)), origin); } catch { return response; }
  if (!target) return response;

  headers.append("Set-Cookie", localReturnCookie(origin, "", 0));
  if (persona) {
    const { location } = await response.json() as { location: string };
    headers.delete("content-length");
    return Response.json({ location: location === "/app" ? target : location }, { headers });
  }
  if (!url.searchParams.has("returnTo")) headers.set("Location", target);
  return new Response(response.body, { status: response.status, headers });
}
