import { isPublicationWrite } from "../features/public-snapshot/publication-request-path";
import type { AppBindings } from "./types";

const authObject = "operator-auth";
const consoleObject = "operator-console-reads";
export const publicationObject = "publication-writes";

export function operatorRequestObject(method: string, path: string, bindings: AppBindings) {
  if (path === "/signin" || path.startsWith("/auth/") || path.startsWith("/.well-known/rer-")) return authObject;

  const hostedPublication = bindings.LAMP_QUEUE_SCHEDULED === "1" || bindings.RER_RELEASE_DIGEST || bindings.RER_DEPLOY_FINGERPRINT;
  if (hostedPublication && isPublicationWrite(method, path)) return publicationObject;

  if (method === "GET" || method === "HEAD") {
    if (path === "/setup" || path === "/app" || path.startsWith("/app/")
      || path === "/api/app" || path.startsWith("/api/app/") || path.startsWith("/_serverFn/")) return consoleObject;
  }

  // First-run publishes before answering. Draft preparation uses the same
  // console runtime without changing when a publication becomes visible.
  if (method === "POST" && (path === "/api/app/overview/first-run"
    || path === "/api/app/incidents" || path === "/api/app/incidents/preview"
    || /^\/api\/app\/incidents\/[^/]+\/draft\/preview$/.test(path))) return consoleObject;
  if (method === "PUT" && /^\/api\/app\/incidents\/[^/]+\/draft$/.test(path)) return consoleObject;
}
