/** What an owner recognises an import by: the tool it came from, its source page and when it was read.
 * The job's own id and fingerprint stay available as technical details. */
export interface ImportIdentity { namespace?: string; sourcePage?: string | null; reviewedAt?: string | null; approvedAt?: string | null }

const TOOLS: Record<string, string> = { statuspage: "Statuspage", betterstack: "Better Stack", instatus: "Instatus", sorry: "Sorry" };

export function importLabel(job: ImportIdentity, formatTime: (iso: string) => string): string {
  const parts = [`${TOOLS[job.namespace ?? "statuspage"]} import`];
  if (job.sourcePage) { try { const url = new URL(job.sourcePage); parts.push(`${url.host}${url.pathname === "/" ? "" : url.pathname}`); } catch { parts.push(job.sourcePage); } }
  const at = job.reviewedAt ?? job.approvedAt;
  if (at) parts.push(formatTime(at));
  return parts.join(" · ");
}
