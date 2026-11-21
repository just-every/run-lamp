import { z } from "zod";

export const statusPagePathSchema = z.string().min(1).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const pagePathsSchema = z.array(statusPagePathSchema).min(1).max(13)
  .refine(paths => new Set(paths).size === paths.length, "Select each status page once.");

export class UnknownStatusPageError extends Error {}

export async function resolvePageSelection(binding: D1Database, pagePaths: string[]): Promise<void> {
  const selected = pagePaths.filter(path => path !== "public");
  if (!selected.length) return;
  const { results } = await binding.prepare("SELECT path FROM status_pages").all<{ path: string }>();
  const known = new Set(results.map(row => row.path));
  if (selected.some(path => !known.has(path))) throw new UnknownStatusPageError("One or more selected status pages do not exist.");
}

export function statusPagePrefix(path: string) {
  return "/status-pages/" + path;
}
