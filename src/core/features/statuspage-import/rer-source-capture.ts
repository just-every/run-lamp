import type { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';
import { DoorError, verifyRerGrant } from '../../../../modules/import-kit/src/door';
import { ownerClaimConfig } from '../../platform/auth/claim';
import type { AppBindings, AppEnv } from '../../app/types';
import { createImportDoorRepository } from './door.repository';
import { readDoorExport } from './door-plan';
import { fetchSorryPublicResponses, SorryReadError, type SorryFailure } from './sorry';
import { publicUrl } from './sorry/schema';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const MAX_REQUEST_BYTES = 4096;
/** The whole read, however many pages Sorry has. */
const READ_DEADLINE_MS = 120_000;
/** A refusal answers its code alone: never the reader's message, the page's text or its host. */
const refusals: Record<SorryFailure, { status: ContentfulStatusCode; error: string }> = {
  restricted: { status: 409, error: 'source_restricted' },
  invalid: { status: 422, error: 'source_invalid' },
  unreachable: { status: 502, error: 'source_unreachable' },
  too_large: { status: 413, error: 'capture_too_large' },
  timeout: { status: 504, error: 'capture_timeout' },
};
const capture = z.object({ source: z.literal('sorry'), publicUrl: z.string().max(2048), maxBytes: z.number().int().min(1).max(16 * 1024 * 1024) }).strict();

/** The request's body when it is at most 4 KiB, otherwise null. */
async function boundedBody(request: Request) {
  if (!request.body) return null;
  const decoder = new TextDecoder();
  let size = 0, text = '';
  for (const reader = request.body.getReader(); ;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_REQUEST_BYTES) { await reader.cancel(); return null; }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

/** `{source,publicUrl,maxBytes}` with a bare HTTPS origin Lamp's own reader accepts, or null. */
async function selection(request: Request) {
  const text = await boundedBody(request);
  if (text === null) return null;
  let body: z.infer<typeof capture>;
  try {
    body = capture.parse(JSON.parse(text));
    const url = publicUrl(body.publicUrl);
    if (body.publicUrl !== url.origin && body.publicUrl !== `${url.origin}/`) return null;
    return { origin: url.origin, maxBytes: body.maxBytes };
  } catch { return null; }
}

/**
 * POST /api/rer/source-capture: Run Edit Run's signed read of a public Sorry
 * page, for its managed runner when the owner has no computer. The grant is an
 * RER-signed `source-capture` grant for this installation and its owner under
 * the owner-claim key ring; a key the owner revoked, or Business imports left
 * off, is refused. Lamp reads the page keylessly, as the owner's own Move in
 * does, checks the answer with its own Sorry reader and answers the bundle the
 * import door's uploads and plan take. It writes nothing, keeps nothing and
 * logs nothing, and every refusal is a code alone. Managed hosting answers it
 * too: this keyless public read is not the outbound connection Managed lacks.
 */
export function registerRerSourceCapture(app: Hono<AppEnv>, bindings: AppBindings) {
  app.all('/api/rer/source-capture', async c => {
    if (c.req.method !== 'POST') return c.json({ error: 'method_not_allowed' }, 405, { ...headers, Allow: 'POST' });
    const claim = ownerClaimConfig(bindings);
    if (!claim) return c.json({ error: 'not_found' }, 404, headers);
    try {
      const { kid } = await verifyRerGrant(c.req.raw, claim, 'source-capture');
      const repository = createImportDoorRepository(bindings.DB);
      const door = await repository.rerReadState(await repository.key(bindings), kid);
      if (door.revoked) return c.json({ error: 'invalid_grant' }, 403, headers);
      if (!door.enabled) return c.json({ error: 'import_door_off' }, 404, headers);
    } catch (error) {
      if (error instanceof DoorError) return c.json({ error: error.code }, error.status as ContentfulStatusCode, headers);
      throw error;
    }
    const selected = await selection(c.req.raw);
    if (!selected) return c.json({ error: 'invalid_capture' }, 400, headers);
    const refuse = (error: unknown) => {
      const { status, error: code } = refusals[error instanceof SorryReadError ? error.kind : 'invalid'];
      return c.json({ error: code }, status, headers);
    };
    let bundle: string;
    try {
      const files = await fetchSorryPublicResponses({ publicUrl: selected.origin, signal: AbortSignal.timeout(READ_DEADLINE_MS), maxBytes: selected.maxBytes });
      bundle = JSON.stringify({ source: 'sorry', publicUrl: selected.origin, publicAccessAcknowledged: true, files });
    } catch (error) { return refuse(error); }
    const bytes = new TextEncoder().encode(bundle);
    if (bytes.length > selected.maxBytes) return c.json({ error: refusals.too_large.error }, refusals.too_large.status, headers);
    try { await readDoorExport(bytes); } catch (error) { return refuse(error); }
    return new Response(bundle, { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  });
}
