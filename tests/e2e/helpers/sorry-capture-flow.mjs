import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { openStatusJourney } from './status-journey.mjs';

const ORIGIN = 'https://status.example.invalid';
const json64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const page = name => readFileSync(`tests/fixtures/sorry/public/${name}`, 'utf8');
const fixtureFor = path => path === '/api/v1/status' ? 'sorry-status.json' : path === '/api/v1/components' ? 'sorry-components.json' : path === '/api/v1/notices' ? 'sorry-notices.json' : /^\/api\/v1\/notices\/\d+$/u.test(path) ? `sorry-notice-${path.split('/').pop()}.json` : null;

/** Business's signed keyless read of a public Sorry page, through the Worker's
 * public door. Only Sorry's public origin is fake, at the Worker's outbound edge. */
export async function sorryCaptureFlow({ extraBindings = {} } = {}) {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const kid = 'synthetic-business', installationId = randomUUID(), issuer = 'https://business.example.test', email = 'synthetic-lamp-owner@example.test';
  const trust = { RER_OWNER_CLAIM_PUBLIC_KEYS: JSON.stringify({ [kid]: publicKey.export({ format: 'jwk' }) }), RER_OWNER_CLAIM_ISSUER: issuer, RER_OWNER_CLAIM_INSTALLATION_ID: installationId };
  const seen = [];
  let sorry = 'ok';
  const providerEdge = async request => {
    const url = new URL(request.url);
    if (url.origin !== ORIGIN) return undefined;
    seen.push({ method: request.method, origin: url.origin, path: url.pathname, search: url.search, authorization: request.headers.has('authorization') });
    if (sorry === 'private') return new Response('{}', { status: 403 });
    if (sorry === 'down') return new Response('', { status: 503 });
    if (sorry === 'redirect') return new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example.invalid/api/v1/status' } });
    const name = fixtureFor(url.pathname);
    return name ? new Response(page(name), { headers: { 'Content-Type': 'application/json' } }) : new Response('{}', { status: 404 });
  };
  const runtime = await openStatusJourney({ extraBindings: { ...trust, ...extraBindings }, providerEdge });
  const grant = (action, namespace) => {
    const iat = Math.floor(Date.now() / 1000);
    const input = `${json64({ alg: 'ES256', typ: 'rer-import-grant+jwt', kid })}.${json64({ v: 1, iss: issuer, aud: runtime.appOrigin, installationId, email, jti: randomUUID(), iat, exp: iat + 300, action, ...(namespace ? { namespace, maxBytes: 8 * 1024 * 1024, maxChunks: 128, maxRecords: 5000 } : {}) })}`;
    return `${input}.${sign('sha256', Buffer.from(input), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
  };
  const post = (path, body, authorization) => runtime.raw(path, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}) } });
  const capture = (body = {}, authorization = grant('source-capture')) => post('/api/rer/source-capture', { source: 'sorry', publicUrl: ORIGIN, maxBytes: 8 * 1024 * 1024, ...body }, authorization);
  const door = async (action, body, namespace = 'sorry') => { const response = await post(`/api/rer/import/${action}`, body, grant(action, namespace)); return { status: response.status, body: await response.json() }; };
  const upload = async bytes => {
    let uploadId;
    for (let offset = 0, index = 0; offset < bytes.length; offset += 65536, index++) {
      const chunk = bytes.subarray(offset, offset + 65536);
      const result = await door('uploads', { ...(uploadId ? { uploadId } : {}), name: 'sorry-capture.json', bundleSha256: hash(bytes), totalBytes: bytes.length, totalChunks: Math.ceil(bytes.length / 65536), index, chunkSha256: hash(chunk), base64: chunk.toString('base64') });
      assert.equal(result.status, 200, JSON.stringify(result.body)); uploadId = result.body.uploadId;
    }
    return uploadId;
  };
  const rows = async () => {
    const tables = (await runtime.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\' AND name NOT LIKE '\\_cf\\_%' ESCAPE '\\'").all()).results;
    const counts = await runtime.db.batch(tables.map(({ name }) => runtime.db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`)));
    return Object.fromEntries(tables.map(({ name }, index) => [name, counts[index].results[0].n]));
  };
  const refused = async (label, status, error, request) => {
    const before = await rows();
    const response = await request();
    assert.equal(response.status, status, `${label}: ${await response.clone().text()}`);
    assert.equal(await response.text(), JSON.stringify({ error }), `${label} answers its code alone`);
    assert.deepEqual(await rows(), before, `${label} changes no D1 row count`);
  };
  const setImports = async enabled => assert.equal((await runtime.request('/api/app/import-door/settings', { method: 'PUT', body: JSON.stringify({ enabled }) })).status, 200);
  return { runtime, seen, grant, capture, door, upload, rows, refused, post, setImports, page, origin: ORIGIN, set mode(value) { sorry = value; } };
}
