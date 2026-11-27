export const operatorConsoleObject = "operator-console-reads";

export function isOperatorConsoleRead(method: string, path: string) {
  return (method === "GET" || method === "HEAD") && (
    path === "/signin" || path === "/app" || path.startsWith("/app/")
    || path === "/api/app" || path.startsWith("/api/app/") || path.startsWith("/_serverFn/")
  );
}
