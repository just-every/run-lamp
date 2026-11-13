import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { unstable_getMiniflareWorkerOptions } from 'wrangler';
import { migrate } from '../reference-storage/runtime.mjs';
import { secret } from '../auth-adoption/runtime.mjs';
import { reservePort } from '../e2e/worker-startup.mjs';

const require = createRequire(import.meta.url);
const { Miniflare, convertV4MiniflareOptions } = createRequire(require.resolve('wrangler'))('miniflare');

// The shipped Worker, its host dispatch, production composition and real D1.
// The client uses the same compact ES256 JWS envelope as Base's sender contract.
test('a signed platform settings push reaches the installed Worker and persists, while forged and unrouted pushes are refused', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lamp-business-settings-'));
  const port = await reservePort({ label: 'Business settings Worker' });
  const origin = `http://127.0.0.1:${port}`;
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const trust = { v: 1, issuer: 'https://business.example.test', audience: origin,
    subject: 'synthetic-lamp-installation', email: 'owner@example.test', keys: { platform: publicKey.export({ format: 'jwk' }) } };
  const options = unstable_getMiniflareWorkerOptions(resolve('dist/server/wrangler.json'));
  const { modulesRules: _rules, ...worker } = options.workerOptions;
  async function moduleFiles(path) {
    const files = [];
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (entry.isDirectory()) files.push(...await moduleFiles(file));
      else if (/\.(?:js|mjs|txt|html|sql|bin|wasm)$/.test(file)) files.push({
        type: /\.(?:js|mjs)$/.test(file) ? 'ESModule' : /\.(?:txt|html|sql)$/.test(file) ? 'Text' : file.endsWith('.bin') ? 'Data' : 'CompiledWasm', path: file,
      });
    }
    return files;
  }
  const modules = await moduleFiles(dirname(options.main));
  modules.sort((a, b) => a.path === options.main ? -1 : b.path === options.main ? 1 : a.path.localeCompare(b.path));
  const bindings = { ...worker.bindings, LAMP_APP_HOST: '127.0.0.1', LAMP_PAGE_HOST: 'localhost',
    AUTH_ORIGIN: origin, LAMP_LOCAL_ORIGIN: origin, RER_DEV_ORIGIN: '', AUTH_LOCAL: 'true', SESSION_SECRET: secret, SETUP_OPERATOR_EMAIL: trust.email, RER_BUSINESS_TRUST: JSON.stringify(trust) };
  const runtimeOptions = () => convertV4MiniflareOptions({ port, inspectorPort: 0, resourcePersistencePath: directory,
    workers: [{ ...worker, modules, modulesRoot: dirname(options.main), bindings }, ...options.externalWorkers] });
  let runtime;
  const signed = (revision, key = privateKey) => {
    const now = Math.floor(Date.now() / 1000);
    const payload = { v: 1, iss: trust.issuer, aud: trust.audience, sub: trust.subject,
      business: 'synthetic-cedar-business', email: trust.email, jti: crypto.randomUUID(), iat: now, exp: now + 3600,
      rev: revision, values: { display_name: 'Cedar Works' }, logo: null, team: null };
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const input = `${encode({ alg: 'ES256', typ: 'rer-business-settings+jwt', kid: 'platform' })}.${encode(payload)}`;
    return `${input}.${sign('sha256', Buffer.from(input), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
  };
  const push = (token, path = '/api/rer/business-settings', host = origin) => runtime.dispatchFetch(host + path,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: token }) });
  try {
    runtime = new Miniflare(runtimeOptions());
    const db = (await runtime.getBindings()).DB;
    await migrate(db);
    const accepted = await push(signed(736));
    assert.equal(accepted.status, 200, await accepted.clone().text());
    assert.deepEqual(await accepted.json(), { rev: 736, applied: ['display_name'], overrides: [], logo: null, team: [] });
    const signIn = await fetch(origin + '/signin', { headers: { Host: new URL(origin).host, Accept: 'text/html' } });
    assert.equal(signIn.status, 200, await signIn.clone().text());
    assert.ok((await signIn.text()).includes('Cedar Works'), 'the mounted auth composition reads the applied name');
    const saved = await db.prepare('SELECT rev,document FROM bs_settings WHERE singleton=1').first();
    assert.equal(JSON.parse(saved.document).values.display_name, 'Cedar Works');
    const foreign = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey;
    assert.equal((await push(signed(738, foreign))).status, 403, 'a forged signature cannot apply a newer revision');
    assert.equal((await push(signed(738), '/api/rer/business-settings/other')).status, 404);
    assert.equal((await push(signed(738), '/api/rer/business-settings', `http://localhost:${port}`)).status, 404, 'the public status host owns no settings door');
    assert.deepEqual(await db.prepare('SELECT rev,document FROM bs_settings WHERE singleton=1').first(), saved);
    await runtime.dispose();
    runtime = new Miniflare(runtimeOptions());
    assert.equal((await push(signed(736))).status, 409, 'durable revision refuses replay after restart');
    await runtime.dispose();
    delete bindings.RER_BUSINESS_TRUST;
    runtime = new Miniflare(runtimeOptions());
    assert.equal((await push(signed(738))).status, 404, 'unlinked hosting does not admit settings');
  } finally {
    await runtime?.dispose();
    await rm(directory, { recursive: true, force: true });
  }
});
