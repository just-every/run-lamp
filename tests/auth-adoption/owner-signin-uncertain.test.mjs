import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { database, load } from '../operator-readiness/runtime.mjs';
import { openSnapshotCacheRuntime } from '../e2e/snapshot-cache-runtime.mjs';
import { authFixture, secret, setupToken } from './runtime.mjs';

// Real Lamp route, Base's email-link flow and D1; only the relay's network edge is substituted.
const origin = 'https://app.example.test', owner = 'owner@example.com';

test('a relay 504 (outcome unknown) keeps the owner\'s sign-in link live, single use; a 4xx refusal revokes it', async () => {
  const dir = await mkdtemp(join(process.cwd(), '.lamp-owner-signin-'));
  const storage = await database(dir), cache = await openSnapshotCacheRuntime(dir);
  const originalFetch = globalThis.fetch, wires = [];
  let relayStatus = 504;
  try {
    const { createApp } = await load('src/core/app/server.ts');
    globalThis.fetch = async (url, init) => {
      if (new URL(String(url)).hostname !== 'relay.example.test') throw new Error(`Unexpected network call: ${url}`);
      wires.push(JSON.parse(init.body));
      return relayStatus === 504 ? Response.json({ error: 'managed_mail_provider_timeout' }, { status: 504 }) : Response.json({ error: 'refused' }, { status: relayStatus });
    };
    const env = { DB: storage.db, SNAPSHOT_CACHE: cache.namespace, SNAPSHOTS: storage.bucket,
      LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'page.example.test', AUTH_ORIGIN: origin, SETUP_OPERATOR_EMAIL: owner,
      SESSION_SECRET: secret, SETUP_TOKEN: setupToken, WEBHOOK_SIGNING_SECRET: 'synthetic-lamp-3', MAIL_RECIPIENTS: 'owner',
      MAIL_PROVIDER: 'rer', MAIL_FROM: 'lamp@example.com', MAIL_FROM_ADDRESS: 'lamp@example.com', MAIL_API_KEY: 'synthetic-lamp-relay-key', MAIL_RELAY_URL: 'https://relay.example.test/api/managed-mail/send' };
    const { app } = createApp(env);
    const call = (path, { method = 'GET', form, cookie, ip = '192.0.2.41' } = {}) => app.fetch(new Request(origin + path, { method,
      headers: { Host: 'app.example.test', Origin: origin, 'CF-Connecting-IP': ip, Accept: 'text/html',
        ...(cookie ? { Cookie: cookie } : {}), ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
      ...(form ? { body: new URLSearchParams(form).toString() } : {}) }), env);
    const native = authFixture(storage.db, { origin, owner });
    await native.handle(native.request('/auth/bootstrap', { method: 'POST', body: { token: setupToken, displayName: 'Owner' } }));
    const linkIn = wire => new URL(JSON.stringify(wire).match(/https:\/\/app\.example\.test\/auth\/confirm\?token=[A-Za-z0-9_-]+/)[0]).searchParams.get('token');

    const stranger = await call('/auth/magic-link', { method: 'POST', form: { email: 'stranger@example.org' } });
    const uncertain = await call('/auth/magic-link', { method: 'POST', form: { email: owner } });
    assert.equal(wires.length, 1, 'one send, never resent at once');
    assert.equal(wires[0].to, owner, 'the owner is the only recipient');
    assert.deepEqual([uncertain.status, uncertain.headers.get('location')], [stranger.status, stranger.headers.get('location')], 'answered as a sent request, same as any address');

    const token = linkIn(wires[0]);
    const confirmed = await call('/auth/confirm', { method: 'POST', form: { token } });
    assert.equal(confirmed.status, 303, 'the link of an uncertain send is still live');
    assert.equal((await call('/auth/confirm', { method: 'POST', form: { token } })).headers.get('set-cookie'), null, 'and still single use');

    relayStatus = 400;
    await call('/auth/magic-link', { method: 'POST', form: { email: owner }, ip: '192.0.2.42' });
    assert.equal(wires.length, 2);
    assert.equal((await call('/auth/confirm', { method: 'POST', form: { token: linkIn(wires[1]) } })).headers.get('set-cookie'), null, 'a definite refusal revokes the link');
  } finally {
    globalThis.fetch = originalFetch;
    await cache.dispose?.(); await storage.runtime.dispose();
    await rm(dir, { recursive: true, force: true });
  }
});
