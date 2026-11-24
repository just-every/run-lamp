import type { Context } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../app/types";
import { ulidSchema } from "../../shared/ids";
import { constantTimeEqual } from "../../platform/security/opaque-tokens";
import { publicationProof } from "../incidents/publication-proof";
import { publicationPending } from "../incidents/publication-status";
import type { PublicSnapshotService } from "./service";

const observationSchema = z.object({
  update: ulidSchema,
  after: z.union([z.literal("unknown"), z.string().regex(/^\d+$/).pipe(z.coerce.number<string>().int().nonnegative())]),
  expires: z.string().regex(/^\d+$/).pipe(z.coerce.number<string>().int().positive()),
  proof: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  wait: z.literal("1").optional(),
});

export async function incidentPublicationStatus(context: Context<AppEnv>, service: PublicSnapshotService, pagePath: string) {
  context.header("Cache-Control", "no-store");
  if (pagePath === "public") context.header("Access-Control-Allow-Origin", "*");
  const input = observationSchema.safeParse(context.req.query());
  if (!input.success) return context.json({ error: "Invalid publication observation." }, 400);
  const { update: updateId, after, expires, proof, wait } = input.data;
  const reference = context.req.param("reference") ?? "";
  const afterGeneration = after === "unknown" ? null : after;
  if (expires < Date.now() || !constantTimeEqual(proof, await publicationProof(context.env.SESSION_SECRET, reference, updateId, {
    path: pagePath, afterGeneration,
  }, expires))) return context.json({ error: "Invalid publication observation." }, 400);
  const resource = `incidents/${encodeURIComponent(reference)}.html`;
  try {
    // Landing, Atom, RSS and widgets all resolve this same selector. The
    // worker switches it only after the complete generation is written.
    const current = await service.observeIncidentPublication(resource, {
      updateId, afterGeneration, wait: wait === "1", signal: context.req.raw.signal,
    });
    if (current) {
      let visible = false;
      await new HTMLRewriter().on("article.update[data-update-id]", {
        element(element) { visible ||= element.getAttribute("data-update-id") === updateId; },
      }).transform(new Response(current.bytes)).arrayBuffer();
      if (visible) return context.json({ state: "confirmed", version: current.version });
    }
  } catch { /* A reader generation could not be verified. */ }
  return context.json(publicationPending, 202);
}
