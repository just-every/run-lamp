import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { database, load } from '../operator-readiness/runtime.mjs';
import { migrate, openRuntime } from '../reference-storage/runtime.mjs';
import { openSnapshotCacheRuntime } from '../e2e/snapshot-cache-runtime.mjs';
import { authFixture, installationKey, otherInstallationKey, secret, setupToken } from './runtime.mjs';
import { provider } from '../fixtures/base/oidc-idp.mjs';
import { linkEdge } from '../fixtures/base/provider-edge.mjs';
import { cloudflareEdge, edgeFetch } from '../helpers/cloudflare-edge.mjs';
import { deploymentConfig, resourceNames } from '../../scripts/ops-config.mjs';
import { deploymentOwnership } from '../../scripts/deployment-ownership.mjs';
import { withDeploymentSecrets } from '../../scripts/deployment-secrets.mjs';

// Real Lamp Hono routes and D1 transactions; only the external provider's network
// is substituted. The copied Base edge validates signed client assertions.
test('ACCESS-001 ACCESS-002 TEAM-001 TEAM-002 TEAM-003 TEAM-007 native identity setup, provider approval, invitations and erasure keep access recoverable', async () => {
  const dir = await mkdtemp(join(process.cwd(), '.lamp-dependency-'));
  const storage = await database(dir);
  const cache = await openSnapshotCacheRuntime(dir);
  const originalFetch = globalThis.fetch;
  try {
    const { createApp } = await load('src/core/app/server.ts');
    const origin = 'https://app.example.test', issuer = 'https://identity.example.test';
    const idp = await provider({ issuer, clientId: 'lamp-client', redirectUri: origin + '/auth/oidc/auth/callback', alg: 'ES256', method: 'private_key_jwt', rerInterfaces: ['oidc-provider@1.0.0'], claims: { email: 'owner@example.test' } });
    await storage.db.prepare('CREATE TABLE fixture_state(key TEXT PRIMARY KEY,value TEXT NOT NULL)').run();
    const edge = linkEdge(storage.db, issuer, 'lamp-client', Date.now, async () => (await call('/.well-known/rer-link/jwks/oidc-provider@1')).json());
    const messages = [];
    const relay = 'https://relay.example.test/api/managed-mail/send';
    globalThis.fetch = async (uri, init) => {
      if (String(uri) === relay) {
        messages.push(JSON.parse(init.body));
        return Response.json({ messageId: `<identity-${messages.length}@relay.example.test>` }, { status: 202 });
      }
      return await edge.fetch(String(uri), init) ?? idp.fetch(uri, init);
    };
    const env = { DB: storage.db, SNAPSHOT_CACHE: cache.namespace, SNAPSHOTS: storage.bucket,
      LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'page.example.test', AUTH_ORIGIN: origin,
      SETUP_OPERATOR_EMAIL: 'owner@example.test', SESSION_SECRET: secret, SETUP_TOKEN: setupToken, INSTALLATION_KEY: installationKey,
      MAIL_FROM_ADDRESS: 'lamp@example.test', IDENTITY_PROVIDER: issuer, MAIL_PROVIDER: 'rer', MAIL_FROM: 'lamp@example.test', MAIL_RELAY_URL: relay, MAIL_API_KEY: 'synthetic-identity-mail-key' };
    const native = authFixture(storage.db, { origin });
    const { app } = createApp(env);
    const call = (path, options = {}) => {
      const request = native.request(path, options);
      request.headers.set('CF-Connecting-IP', '192.0.2.31');
      return app.fetch(request, env);
    };
    const post = (path, body = {}, cookie) => call(path, { method: 'POST', body, cookie });
    const discovery = await call('/.well-known/rer-dependencies');
    assert.equal(discovery.status, 200);
    assert.ok((await discovery.json()).dependencies.some(d => d.interface === 'oidc-provider@1' && d.optional));
    const callback = async () => {
      await call('/.well-known/rer-dependencies');
      return post('/.well-known/rer-link/callback', { issuer, code: await edge.code() });
    };
    assert.equal((await callback()).status, 403, 'configuration alone grants no link authority');
    assert.equal((await post('/auth/dependencies/setup', { issuer, token: setupToken })).status, 200);
    const bootstrap = await post('/auth/bootstrap', { token: setupToken, displayName: 'Owner' });
    assert.equal(bootstrap.status, 303);
    const bootstrapCookie = bootstrap.headers.get('set-cookie').split(';')[0];
    const bootstrapSession = await (await call('/auth/session', { cookie: bootstrapCookie })).json();
    const setup = await storage.db.prepare('SELECT owner_id,session_id FROM oa_setup_links').first();
    assert.equal(setup.owner_id, bootstrapSession.operator.id);
    assert.equal(setup.session_id, bootstrapSession.id);
    assert.equal((await callback()).status, 200, 'only the originating setup can complete its approval');
    assert.equal((await (await call('/auth/settings/identity', { cookie: bootstrapCookie })).json()).idpSignIn, true);
    assert.equal((await callback()).status, 403, 'a consumed approval cannot authorize another link');
    const proof = await native.signIn();
    assert.equal((await post('/auth/dependencies/unlink', {}, proof)).status, 200);
    assert.equal((await callback()).status, 403, 'provider continuity cannot restore unlinked trust');
    assert.equal((await post('/auth/oidc/auth/start')).status, 403);
    assert.equal((await post('/auth/settings/identity', { idpSignIn: false }, proof)).status, 200);
    const approve = () => post('/auth/dependencies/relink', { issuer }, proof);
    assert.equal((await approve()).status, 200);
    await edge.pause();
    const pending = callback();
    try {
      await edge.ready();
      assert.equal((await approve()).status, 200, 'owner replaces the pending approval while redemption waits');
    } finally { await edge.release(); }
    assert.equal((await pending).status, 503, 'stale callback fails its atomic exact-attempt fence');
    assert.equal((await storage.db.prepare('SELECT COUNT(*) n FROM rer_dependency_link').first()).n, 0);
    assert.equal((await callback()).status, 200, 'the new owner approval remains usable');
    assert.equal((await (await call('/auth/settings/identity', { cookie: proof })).json()).idpSignIn, false, 'ordinary relinking preserves the owner choice to disable sign-in');
    const disabledPage = await call('/signin');
    assert.equal((await disabledPage.text()).includes('action="/auth/oidc/auth/start"'), false);
    assert.equal((await post('/auth/settings/identity', { idpSignIn: true }, proof)).status, 200);
    const signIn = await call('/signin?returnTo=%2Fapp%2Fsettings');
    assert.equal(signIn.status, 200);
    assert.equal(signIn.headers.get('referrer-policy'), 'strict-origin');
    assert.ok(signIn.headers.get('content-security-policy').includes(issuer));
    const html = await signIn.text();
    const providerForm = /<form method="post" action="([^"]*\/auth\/oidc\/auth\/start)">([\s\S]*?)<\/form>/.exec(html);
    assert.ok(providerForm, 'hosted sign-in exposes the enabled provider start form');
    const returnTo = /name="returnTo" value="([^"]+)"/.exec(providerForm[2])[1];
    assert.equal(returnTo, '/app/settings');
    const start = await app.fetch(new Request(new URL(providerForm[1], origin), {
      method: 'POST', headers: { Host: new URL(origin).host, Origin: origin, 'CF-Connecting-IP': '192.0.2.31', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ returnTo }),
    }), env);
    assert.equal(start.status, 303, 'the form offered by hosted sign-in starts provider authorization');
    assert.equal(new URL(start.headers.get('location')).origin, issuer);
    assert.equal((await call('/api/app/session', { cookie: proof })).status, 200, 'native email access remains usable');

    // The same owner manages actual invitations and native sessions. Cancellation
    // invalidates the delivered link; erasure revokes access and retains an audit.
    const invite = async email => {
      const result = await post('/api/app/operators/invite', { email, displayName: 'Recovery owner' }, proof);
      assert.equal(result.status, 202, await result.clone().text());
      const token = new URL(messages.at(-1).text.match(/https?:\/\/[^\s]+/)[0]).searchParams.get('token');
      const invited = (await (await call('/api/app/operators/invited', { cookie: proof })).json()).operators.find(row => row.email === email);
      assert.ok(invited);
      return { id: invited.id, token };
    };
    const cancelled = await invite('cancelled@example.test');
    assert.equal((await call(`/api/app/operators/${cancelled.id}`, { method: 'DELETE', cookie: proof })).status, 204);
    assert.equal((await post('/auth/confirm', { token: cancelled.token })).status, 400, 'a cancelled invitation cannot sign in');
    const teammate = await invite('teammate@example.test');
    const accepted = await post('/auth/confirm', { token: teammate.token });
    assert.equal(accepted.status, 303, await accepted.clone().text());
    const teammateCookie = accepted.headers.get('set-cookie').split(';')[0];
    assert.equal((await post('/auth/confirm', { token: teammate.token })).status, 400, 'an invitation is consumed once');
    const teammateSession = await call('/api/app/session', { cookie: teammateCookie });
    assert.equal(teammateSession.status, 200);
    assert.equal((await teammateSession.json()).operator.email, 'teammate@example.test');
    const ownerSession = await (await call('/api/app/session', { cookie: proof })).json();
    assert.equal((await call(`/api/app/operators/${ownerSession.operator.id}`, { method: 'DELETE', cookie: teammateCookie })).status, 403, 'another operator cannot erase the setup owner');
    // Keep saved rule provenance with the publication while erasing its
    // approving owner's personal name in the same identity transaction.
    const at = new Date().toISOString();
    await storage.db.prepare("INSERT INTO page_settings(id,page_name,tagline,accent_color,timezone,hostname,feed_id,mail_from_address,created_at,updated_at) VALUES('default','Synthetic Lamp erasure','Identity erasure journey','#16794C','UTC','page.example.test','synthetic-lamp-erasure-feed','lamp@example.test',?,?)").bind(at,at).run();
    const ownerName = (await storage.db.prepare('SELECT display_name FROM oa_operators WHERE id=?').bind(ownerSession.operator.id).first()).display_name;
    await storage.db.prepare("INSERT INTO incidents(id,reference,title,lifecycle,opened_at,created_by_operator_id,created_at,updated_at) VALUES('erasure-rule-incident','INC-9901','Saved rule incident','Investigating',?,?,?,?)").bind(at,ownerSession.operator.id,at,at).run();
    await storage.db.prepare("INSERT INTO incident_updates(id,incident_id,lifecycle,affected_audience,customer_impact,what_still_works,details,next_update_at,published_at,author_operator_id,created_at,updated_at,automation_attribution,automation_receipt_id) VALUES('erasure-rule-update','erasure-rule-incident','Investigating','API customers','Requests are delayed.','','',?,?,?,?,?,?,?)").bind(at,at,ownerSession.operator.id,at,at,`rule API availability, approved by ${ownerName}`,'erasure-alert-receipt').run();
    assert.equal((await call(`/api/app/operators/${ownerSession.operator.id}`, { method: 'DELETE', cookie: proof })).status, 204);
    const provenance = await storage.db.prepare("SELECT automation_attribution,automation_receipt_id,customer_impact FROM incident_updates WHERE id='erasure-rule-update'").first();
    assert.equal(provenance.automation_attribution, 'rule API availability, approved by Erased operator');
    assert.equal(provenance.automation_receipt_id, 'erasure-alert-receipt');
    assert.equal(provenance.customer_impact, 'Requests are delayed.', 'erasure keeps the operator-written publication and causal alert');
    assert.equal((await call('/api/app/session', { cookie: proof })).status, 401, 'erasure revokes the old session');
    const listed = await (await call('/api/app/operators/former', { cookie: teammateCookie })).json();
    assert.ok(!listed.operators.some(row => row.id === ownerSession.operator.id), 'the erased identity leaves the former-operator directory');
    assert.equal((await call(`/api/app/operators/${teammate.id}`, { method: 'DELETE', cookie: teammateCookie })).status, 409, 'the last active owner stays recoverable');
    const audit = await call('/api/app/audit-log?format=csv', { cookie: teammateCookie });
    assert.equal(audit.status, 200);
    assert.ok((await audit.text()).includes(ownerSession.operator.id), 'history remains attributable after erasure');
    assert.equal((await post('/api/app/session/signout', {}, teammateCookie)).status, 204);
    assert.equal((await call('/api/app/session', { cookie: teammateCookie })).status, 401);

  } finally {
    globalThis.fetch = originalFetch;
    await cache.dispose();
    await storage.runtime.dispose();
    await rm(dir, { recursive: true, force: true });
  }
});

// A Lamp that linked its Auth provider on rer 0.2.76 or earlier holds that link's signing key
// in plaintext. 0076 keeps the row; the installation key seals it on first use under the same
// public key, so the provider's registered key still verifies Lamp. Without the key, or with
// another one, every dependency route refuses and nothing in D1 is rewritten.
test('ACCESS-002 an installation linked before sealing keeps its provider key, sealed under INSTALLATION_KEY, and refuses without it', async () => {
  const dir = await mkdtemp(join(process.cwd(), '.lamp-installation-key-'));
  const runtime = openRuntime(dir);
  const cache = await openSnapshotCacheRuntime(dir);
  try {
    const db = await runtime.getD1Database('DB');
    await migrate(db, name => name < '0076');
    // Exactly what rer 0.2.76's dependency store wrote: its keyPair() JSON, unsealed.
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const legacy = JSON.stringify({ ...await crypto.subtle.exportKey('jwk', pair.privateKey), kid: 'synthetic-legacy-signing-key', alg: 'ES256', use: 'sig' });
    await db.batch([
      db.prepare("INSERT INTO rer_dependency_installation(singleton,sector_id) VALUES(1,'synthetic-legacy-sector')"),
      db.prepare("INSERT INTO rer_dependency_keys(interface,private_key) VALUES('oidc-provider@1',?)").bind(legacy),
    ]);
    await migrate(db, name => name.startsWith('0076_'));
    const installation = () => db.prepare('SELECT sector_id,keys_sealed,key_ids FROM rer_dependency_installation').first();
    const stored = async () => (await db.prepare("SELECT private_key FROM rer_dependency_keys WHERE interface='oidc-provider@1'").first()).private_key;
    assert.deepEqual(await installation(), { sector_id: 'synthetic-legacy-sector', keys_sealed: 0, key_ids: '[]' });
    const { createApp } = await load('src/core/app/server.ts');
    const origin = 'https://app.example.test';
    const get = (path, key) => {
      const env = { DB: db, SNAPSHOT_CACHE: cache.namespace, LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'page.example.test', AUTH_ORIGIN: origin,
        SETUP_OPERATOR_EMAIL: 'owner@example.test', SESSION_SECRET: secret, SETUP_TOKEN: setupToken, MAIL_FROM_ADDRESS: 'lamp@example.test', ...(key ? { INSTALLATION_KEY: key } : {}) };
      return createApp(env).app.fetch(new Request(origin + path, { headers: { Host: 'app.example.test' } }), env);
    };
    const routes = ['/.well-known/rer-dependencies', '/.well-known/rer-link/jwks', '/.well-known/rer-link/jwks/oidc-provider@1'];
    for (const path of routes) {
      const refused = await get(path);
      assert.equal(refused.status, 503, path);
      assert.deepEqual(await refused.json(), { error: 'installation_key_missing' }, path);
    }
    assert.equal((await get('/signin')).status, 200, 'email sign-in stays available without the key');
    assert.equal(await stored(), legacy, 'a refused read rewrites nothing');
    const jwks = await get('/.well-known/rer-link/jwks', installationKey);
    assert.equal(jwks.status, 200);
    const { x, y, d } = JSON.parse(legacy);
    assert.deepEqual((await jwks.json()).keys.map(key => [key.kid, key.x, key.y]), [['synthetic-legacy-signing-key', x, y]], 'the provider keeps the public key it registered');
    const envelope = JSON.parse(await stored());
    assert.deepEqual(Object.keys(envelope).sort(), ['ciphertext', 'iv', 'kid', 'version']);
    assert.equal((await stored()).includes(d), false, 'the private key no longer sits in D1 in the clear');
    assert.deepEqual(await installation(), { sector_id: 'synthetic-legacy-sector', keys_sealed: 1, key_ids: JSON.stringify([envelope.kid]) });
    for (const path of routes) assert.equal((await get(path, installationKey)).status, 200, path);
    const wrong = await get('/.well-known/rer-link/jwks', otherInstallationKey);
    assert.equal(wrong.status, 503);
    assert.deepEqual(await wrong.json(), { error: 'installation_key_unavailable' }, 'another key never opens or replaces the sealed key');
    assert.deepEqual(JSON.parse(await stored()), envelope);
  } finally {
    await cache.dispose();
    await runtime.dispose();
    await rm(dir, { recursive: true, force: true });
  }
});

// The rotation RELEASE.json names, through rer's own command, on a Lamp that Lamp's deploy code provisioned and
// recorded (scripts/setup.mjs's D1, deployment-ownership's Worker upload). Only Cloudflare is substituted
// (../helpers/cloudflare-edge.mjs); the deployed Worker's D1 is this test's real Lamp D1.
test('ACCESS-002 rer deploy --rotate-secret INSTALLATION_KEY reseals the dependency keys under a new key and retires the old one', async () => {
  const root = process.cwd(), environment = `key-rotation-${randomBytes(3).toString('hex')}`, names = resourceNames(environment);
  const dir = await mkdtemp(join(root, '.lamp-key-rotation-'));
  const storage = await database(dir);
  const cache = await openSnapshotCacheRuntime(dir);
  const state = join(root, '.rer'), records = join(state, 'deploy'), existing = [state, records].filter(path => existsSync(path)), custodyFile = join(records, `${environment}.secrets.env`);
  const hex = () => randomBytes(32).toString('hex'), oldKey = hex(), appHost = 'app.example.test';
  const credentials = { CLOUDFLARE_ACCOUNT_ID: randomBytes(16).toString('hex'), CLOUDFLARE_API_TOKEN: `synthetic-${hex()}` };
  const { createApp } = await load('src/core/app/server.ts');
  const jobs = { async send() {}, async sendBatch() {} };
  // The deployed Worker: its live version's vars and secrets over this test's D1, R2, cache and queue.
  const serve = async (version, request, keys = {}) => {
    const env = { DB: storage.db, SNAPSHOTS: storage.bucket, SNAPSHOT_CACHE: cache.namespace, JOBS: jobs, RER_VERSION: { id: version.id },
      ...Object.fromEntries(version.bindings.filter(binding => binding.text !== undefined).map(binding => [binding.name, binding.text])), ...keys };
    const work = [];
    const response = await createApp(env).app.fetch(request, env, { waitUntil: promise => work.push(promise), passThroughOnException() {} });
    await Promise.allSettled(work);
    return response;
  };
  const edge = await cloudflareEdge({ accountId: credentials.CLOUDFLARE_ACCOUNT_ID, token: credentials.CLOUDFLARE_API_TOKEN, subdomain: 'synthetic-owner', d1: storage.db, workerHost: { host: appHost, name: names.worker }, app: serve });
  const hosts = ['api.cloudflare.com', appHost], originalFetch = globalThis.fetch;
  globalThis.fetch = edgeFetch({ edge: edge.origin, hosts, fetch: originalFetch });
  try {
    const config = deploymentConfig({ LAMP_APP_HOST: appHost, LAMP_PAGE_HOST: 'page.example.test', LAMP_PAGE_NAME: 'Synthetic key rotation', LAMP_PAGE_TAGLINE: 'Installation key rotation', LAMP_PAGE_TIMEZONE: 'UTC', LAMP_ACCENT_COLOR: '#16794C',
      SETUP_OPERATOR_EMAIL: 'owner@example.test', MAIL_FROM_ADDRESS: 'lamp@example.test', MAIL_DKIM_SELECTOR: 'resend', MAIL_PROVIDER_API_KEY: `synthetic-${hex()}`,
      SESSION_SECRET: hex(), SUBSCRIBER_TOKEN_SECRET: hex(), WEBHOOK_SIGNING_SECRET: hex(), SETUP_TOKEN: hex(), INSTALLATION_KEY: oldKey }, environment);
    const ownership = deploymentOwnership(config, credentials);
    const created = await ownership.resource('d1', names.database, async () => (await ownership.api.list('/d1/database')).find(row => row.name === names.database),
      () => ownership.api.request('/d1/database', { method: 'POST', body: { name: names.database } }));
    const identity = { source: 'synthetic-source-commit', fingerprint: hex() };
    const vars = { LAMP_APP_HOST: appHost, LAMP_PAGE_HOST: config.pageHost, AUTH_ORIGIN: `https://${appHost}`, SETUP_OPERATOR_EMAIL: config.setupOperatorEmail, MAIL_FROM_ADDRESS: config.mailFromAddress,
      MAIL_PROVIDER: config.mailProvider, RER_DEPLOY_SOURCE: identity.source, RER_DEPLOY_FINGERPRINT: identity.fingerprint };
    await withDeploymentSecrets(config, [], file => ownership.upload(false, identity, async () => edge.upload(names.worker, { vars, secrets: JSON.parse(await readFile(file, 'utf8')), database: created.uuid })));
    // What rer keeps for a deployed environment: its generated secrets in .rer/deploy/<environment>.secrets.env.
    await mkdir(records, { recursive: true, mode: 0o700 });
    await writeFile(custodyFile, Object.entries({ INSTALLATION_KEY: oldKey, SESSION_SECRET: config.sessionSecret, SUBSCRIBER_TOKEN_SECRET: config.subscriberTokenSecret, WEBHOOK_SIGNING_SECRET: config.webhookSigningSecret })
      .map(([name, value]) => `${name}=${value}\n`).join(''), { mode: 0o600 });
    const jwks = async () => {
      const response = await fetch(`https://${appHost}/.well-known/rer-link/jwks/oidc-provider@1`);
      assert.equal(response.status, 200, await response.clone().text());
      return (await response.json()).keys.map(({ kid, x, y }) => [kid, x, y]);
    };
    const signingKey = await jwks(); // the live Worker seals the provider signing key under the old key

    const child = spawn(process.execPath, ['node_modules/@runeditrun/rer/bin/rer.mjs', 'deploy', '--environment', environment, '--rotate-secret', 'INSTALLATION_KEY'], { cwd: root, timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(CLOUDFLARE_|MAIL_|NODE_OPTIONS$)/.test(name))), ...credentials,
        NODE_OPTIONS: `--import=${new URL('../helpers/cloudflare-edge-preload.mjs', import.meta.url).href}`, LAMP_FAKE_EDGE: edge.origin, LAMP_FAKE_EDGE_HOSTS: hosts.join(',') } });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    assert.equal(await new Promise(resolve => child.once('close', resolve)), 0, output);
    const custody = parseEnv(await readFile(custodyFile, 'utf8'));
    const held = Object.fromEntries(edge.live(names.worker).bindings.filter(binding => binding.type === 'secret_text').map(binding => [binding.name, binding.text]));
    assert.match(custody.INSTALLATION_KEY, /^[0-9a-f]{64}$/);
    assert.notEqual(custody.INSTALLATION_KEY, oldKey);
    assert.equal(held.INSTALLATION_KEY, custody.INSTALLATION_KEY, 'the Worker holds the key this checkout keeps');
    assert.equal('INSTALLATION_KEY_PREVIOUS' in held, false, 'the previous key is retired from the Worker');
    assert.equal('INSTALLATION_KEY_PREVIOUS' in custody, false, 'the rotation finished, so the next rer deploy is not refused');
    assert.deepEqual(await jwks(), signingKey, 'the new key alone opens the resealed key, and linked providers keep the public key they registered');
    const retired = await serve(edge.live(names.worker), new Request(`https://${appHost}/.well-known/rer-link/jwks/oidc-provider@1`), { INSTALLATION_KEY: oldKey });
    assert.equal(retired.status, 503);
    assert.deepEqual(await retired.json(), { error: 'installation_key_unavailable' }, 'the old key no longer opens any dependency key');
  } finally {
    globalThis.fetch = originalFetch;
    await edge.close();
    await cache.dispose();
    await storage.runtime.dispose();
    await rm(dir, { recursive: true, force: true });
    // Remove only what this test made: the whole .rer or .rer/deploy it created, else its two environment files.
    const made = [state, records].find(path => !existing.includes(path));
    if (made) await rm(made, { recursive: true, force: true });
    else for (const name of [`${environment}.json`, `${environment}.secrets.env`]) await rm(join(records, name), { force: true });
  }
});
