export function isMoveInApi(path: string) {
  return path.startsWith("/api/app/statuspage-import/")
    || path.startsWith("/api/rer/import/")
    || path.startsWith("/api/operator/import/");
}
