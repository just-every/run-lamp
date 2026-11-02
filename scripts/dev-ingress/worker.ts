import { proofHeader, proofPayload } from './protocol.mjs';

/** Only a proof made after inspecting the original socket headers authorizes
 * removal of the one X-Forwarded-Host field Cloudflare's Vite plugin adds.
 * The ordinary outbox predicate still checks the resulting actual Request. */
export function createDevelopmentAuthenticator(secret: string) {
  const used = new Map<string, number>();
  const maxAge = 5 * 60_000;
  // Proofs issued at or before this instant can no longer be shown unused: their nonces were forgotten (below).
  let floor = 0;
  const key = crypto.subtle.importKey('raw', Uint8Array.from(secret.match(/../g)!, byte => parseInt(byte, 16)), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  return async (request: Request): Promise<Request | null> => {
    const proof = request.headers.get(proofHeader);
    if (!proof || !/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(proof)) return null;
    const [issued, nonce, mac] = proof.split('.');
    const now = Date.now();
    if (Number(issued) > now || now - Number(issued) > maxAge) return null;
    const host = request.headers.get('host');
    if (!host || request.headers.get('x-forwarded-host') !== host) return null;
    const payload = proofPayload(request.method, request.url, host, request.headers.get('origin'), request.headers.get('sec-fetch-site'), `${issued}.${nonce}`);
    const signature = Uint8Array.from(mac.match(/../g)!, byte => parseInt(byte, 16));
    if (!await crypto.subtle.verify('HMAC', await key, signature, new TextEncoder().encode(payload))) return null;
    // Verification yields. Consume after it so simultaneous replays cannot both
    // pass; expired proofs also cannot regain validity after their entry is pruned.
    for (const [value, expires] of used) if (expires < now) used.delete(value);
    if (used.has(nonce) || Number(issued) <= floor) return null;
    // At most 10,000 consumed nonces are held. A full set forgets its oldest and raises the floor to that proof's
    // issue time, so a forgotten proof still cannot be replayed while new requests keep being served.
    if (used.size >= 10_000) {
      const [oldest, expires] = used.entries().next().value!;
      used.delete(oldest);
      floor = Math.max(floor, expires - maxAge);
    }
    used.set(nonce, Number(issued) + maxAge);
    const headers = new Headers(request.headers);
    headers.delete(proofHeader);
    headers.delete('x-forwarded-host');
    return new Request(request, { headers });
  };
}
