export function isPublicationWrite(method: string, path: string) {
  if (path === "/api/app/page-settings") return method === "PUT";
  if (path === "/api/app/page-settings/logo") return method === "POST" || method === "DELETE";
  return method === "POST" && (path === "/api/app/components" || /^\/api\/app\/incidents\/[^/]+\/publish$/.test(path));
}
