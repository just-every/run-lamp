import { z } from "zod";

export const statusPagePathSchema = z.string().min(1).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const pagePathsSchema = z.array(statusPagePathSchema).min(1).max(13)
  .refine(paths => new Set(paths).size === paths.length, "Select each status page once.");

export class UnknownStatusPageError extends Error {}

export function statusPageStoragePrefix(path: string) {
  return "status-pages/" + path + "/";
}

export function statusPagePrefix(path: string) {
  return "/status-pages/" + path;
}
