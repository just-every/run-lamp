/** Cursors seek through the immutable ordering rather than walking an OFFSET. */
export interface ArchiveCursor { at: string; id: string; kind: "incident" | "maintenance" | "incident-update" | "maintenance-notice" }
export interface ArchivePage {
  kind: "history" | "month" | "feed" | "incident" | "maintenance" | "api-incidents" | "api-maintenance";
  cursor?: string;
  month?: string;
  nextCursor: string | null;
  pageSize: number;
}
export const ARCHIVE_PAGE_SIZE = 50;
export function encodeArchiveCursor(value: ArchiveCursor) {
  return btoa(JSON.stringify(value)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
export function decodeArchiveCursor(value: string): ArchiveCursor | null {
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(value)) return null;
  try {
    const parsed = JSON.parse(atob(value.replaceAll("-", "+").replaceAll("_", "/"))) as ArchiveCursor;
    if (!parsed || !["incident", "maintenance", "incident-update", "maintenance-notice"].includes(parsed.kind) || !/^[A-Za-z0-9_.:-]{1,100}$/.test(parsed.id) || !Number.isFinite(Date.parse(parsed.at))) return null;
    return parsed;
  } catch { return null; }
}
export interface ArchiveRequest { kind: ArchivePage["kind"]; cursor?: string; month?: string; reference?: string; format?: "atom" | "rss" }
export function parseArchiveKey(key: string): ArchiveRequest | null {
  let match = /^archive\/history\/([A-Za-z0-9_-]{1,512})\.html$/.exec(key);
  if (match) return { kind: "history", cursor: match[1] };
  match = /^(?:archive\/month\/|history\/)(\d{4}-(?:0[1-9]|1[0-2]))(?:\/([A-Za-z0-9_-]{1,512}))?\.html$/.exec(key);
  if (match) return { kind: "month", month: match[1], cursor: match[2] };
  match = /^archive\/feed\/([A-Za-z0-9_-]{1,512})\.(atom|rss)$/.exec(key);
  if (match) return { kind: "feed", cursor: match[1], format: match[2] as "atom" | "rss" };
  match = /^(incidents|maintenance)\/([^/]{1,200})\.html$/.exec(key);
  if (match) {
    try { return { kind: match[1] === "incidents" ? "incident" : "maintenance", reference: decodeURIComponent(match[2]) }; } catch { return null; }
  }
  match = /^api\/public\/v1\/(incidents|maintenance)(?:\/([A-Za-z0-9_-]{1,100}))?\.json$/.exec(key);
  return match ? { kind: match[1] === "incidents" ? "api-incidents" : "api-maintenance", cursor: match[2] } : null;
}
export function historyArchiveKey(month: string | undefined, cursor: string | undefined) {
  if (cursor && !decodeArchiveCursor(cursor)) return "history/invalid.html";
  return month ? cursor ? `archive/month/${month}/${cursor}.html` : `history/${month}.html` : cursor ? `archive/history/${cursor}.html` : "history.html";
}
export function feedArchiveKey(format: "atom" | "rss", cursor: string | undefined) {
  return cursor ? decodeArchiveCursor(cursor) ? `archive/feed/${cursor}.${format}` : "feed/invalid" : `feed.${format}`;
}
