import { hmacSha256 } from "../../platform/security/opaque-tokens";
import type { PublicationTarget } from "./publication-status";

export async function publicationProof(secret: string | undefined, reference: string, updateId: string, target: PublicationTarget, expiresAt: number) {
  if (!secret) return "";
  return hmacSha256(secret, JSON.stringify(["lamp-incident-publication", reference, updateId, target.path, target.afterGeneration, expiresAt]));
}
