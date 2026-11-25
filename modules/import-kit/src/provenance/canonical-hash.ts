import { createHash } from 'node:crypto';
import { jsonStringParts } from './identity.ts';
import { ResumableSha256, type Sha256State } from './resumable-sha256.ts';

const encoder = new TextEncoder();
const stringCache = () => new Map<string, string>();
type StringCache = ReturnType<typeof stringCache>;

/** Reuse only immutable string encodings during one caller-owned operation.
 * Clear in its finally block; no source containers or digests are cached. */
export function createCanonicalHasher() {
  const cache = stringCache();
  return {
    hash: (value: unknown) => hashCanonical(value, cache),
    clear() {
      cache.clear();
    },
  };
}

/** Hash exact canonical UTF-8 in bounded chunks. Repeated immutable
 * strings share quoted text only within this call; object contents are
 * always traversed afresh, including reads from normalized page views. */
export function canonicalHash(value: unknown): string {
  return hashCanonical(value, stringCache());
}
function hashCanonical(value: unknown, cache: StringCache): string {
  const writer = canonicalWriter(cache);
  try { writer.value(value); return writer.digest(); }
  finally { writer.release(); }
}

/** One canonical document may draw array elements from awaited custody reads.
 * Containers and values still use the same writer; no object digest is reused. */
export function createCanonicalStreamHash() {
  const cache = stringCache(), writer = canonicalWriter(cache);
  let closed = false;
  const active = () => { if (closed) throw new Error('CANONICAL_HASH_CLOSED'); };
  return {
    value(value: unknown) { active(); writer.value(value); },
    token(value: '[' | ']' | '{' | '}' | ':' | ',') { active(); writer.token(value); },
    digest() { active(); return writer.digest(); },
    clear() {
      if (closed) return;
      closed = true; writer.release();
      cache.clear();
    },
  };
}

/** The same canonical stream hash whose state can be saved between requests:
 * `checkpoint()` returns it, and `resume` continues from a saved one. Callers
 * keep the saved state server-side; it fences nothing by itself. */
export function createResumableCanonicalHash(resume?: Sha256State) {
  const cache = stringCache(), hash = resume ? ResumableSha256.from(resume) : new ResumableSha256();
  const writer = canonicalWriter(cache, { update: text => hash.update(encoder.encode(text)), digest: encoding => hash.digest(encoding) });
  return {
    value(value: unknown) { writer.value(value); },
    token(value: '[' | ']' | '{' | '}' | ':' | ',') { writer.token(value); },
    checkpoint(): Sha256State { writer.flush(); return hash.state(); },
    digest() { return writer.digest(); },
    clear() { writer.release(); cache.clear(); },
  };
}

function canonicalWriter(cache: StringCache, hash: { update(text: string): unknown; digest(encoding: 'hex'): string } = createHash('sha256')) {
  // Encode one bounded string at a time instead of crossing the native UTF-8
  // boundary at every key or value. Quoted string slices keep code points intact.
  let parts: string[] = [], length = 0;
  const flush = () => {
    if (length) hash.update(parts.join(''));
    parts = []; length = 0;
  };
  const write = (part: string) => {
    const limit = 64 * 1024;
    if (length + part.length > limit) flush();
    if (part.length >= limit) hash.update(part);
    else { parts.push(part); length += part.length; }
  };
  const text = (value: string) => {
    const previous = cache.get(value);
    if (previous !== undefined) { write(previous); return; }
    if (value.length > 1024 * 1024) { for (const part of jsonStringParts(value)) write(part); return; }
    const quoted = JSON.stringify(value);
    if (quoted.length < 128 && cache.size < 4096) cache.set(value, quoted);
    write(quoted);
  };
  const visit = (item: unknown): void => {
    if (item === null) { write('null'); return; }
    if (typeof item === 'string') { text(item); return; }
    if (typeof item === 'boolean') { write(item ? 'true' : 'false'); return; }
    if (typeof item === 'number' && Number.isFinite(item)) { write(JSON.stringify(item)); return; }
    if (Array.isArray(item)) {
      write('[');
      const length = item.length;
      for (let index = 0; index < length; index++) { if (index) write(','); visit(item[index]); }
      write(']'); return;
    }
    if (item && typeof item === 'object' && (Object.getPrototypeOf(item) === Object.prototype || Object.getPrototypeOf(item) === null)) {
      write('{'); let first = true;
      for (const key of Object.keys(item).sort()) { if (!first) write(','); first = false; text(key); write(':'); visit((item as Record<string, unknown>)[key]); }
      write('}'); return;
    }
    throw new Error('INVALID_JSON: durable values must be finite JSON');
  };
  return {
    value: visit,
    token(value: string) { if (!/^[\[\]{}:,]$/.test(value)) throw new Error('INVALID_CANONICAL_TOKEN'); write(value); },
    flush,
    digest() { flush(); return hash.digest('hex'); },
    release() { parts = []; length = 0; },
  };
}
