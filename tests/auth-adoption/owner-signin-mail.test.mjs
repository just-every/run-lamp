import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { database, load } from '../operator-readiness/runtime.mjs';
import { openSnapshotCacheRuntime } from '../e2e/snapshot-cache-runtime.mjs';
import { authFixture, secret, setupToken } from './runtime.mjs';

// Real Lamp routes, Base's email-link flow and D1; only the provider's network edge is substituted.
const origin = 'https://app.example.test', owner = 'owner@example.com';
const relayUrl = 'https://relay.example.test/api/managed-mail/send';

// SendGrid carries owner sign-in on live installs today; Base's owner-only relay carries it under MAIL_PROVIDER=rer.
const providers = {
  sendgrid: {
    env: { MAIL_PROVIDER: 'sendgrid', MAIL_FROM_ADDRESS: 'lamp@example.com', MAIL_PROVIDER_API_KEY: 'synthetic-lamp-sendgrid-key' },
    edge: url => new URL(url).hostname === 'api.sendgrid.com',
    accept: count => new Response(null, { status: 202, headers: { 'X-Message-Id': `synthetic-${count}` } }),
    recipients: body => body.personalizations.flatMap(p => [...(p.to ?? []), ...(p.cc ?? []), ...(p.bcc ?? [])]).map(r => r.email),
  },
  rer: {
    env: { MAIL_PROVIDER: 'rer', MAIL_FROM: 'lamp@example.com', MAIL_RELAY_URL: relayUrl, MAIL_API_KEY: 'synthetic-lamp-relay-key' },
    edge: url => url === relayUrl,
    accept: count => Response.json({ messageId: `<synthetic-${count}@relay.example.test>` }, { status: 202 }),
    recipients: body => [body.to, body.cc, body.bcc].filter(Boolean),
  },
};

test('ACCESS-001 MAIL_RECIPIENTS=owner mails the sign-in link to the owner only, and the page answers every address alike', async () => {
  for (const [name, provider] of Object.entries(providers)) await ownerOnlySignIn(name, provider);
});

async function ownerOnlySignIn(name, provider) {
  const dir = await mkdtemp(join(process.cwd(), '.lamp-owner-signin-'));
  const storage = await database(dir), cache = await openSnapshotCacheRuntime(dir);
  const originalFetch = globalThis.fetch, sent = [];
  try {
    const { createApp } = await load('src/core/app/server.ts');
    const { prepareAppMailBindings } = await load('src/core/app/mail.ts');
    globalThis.fetch = async (url, init) => {
      if (!provider.edge(String(url))) throw new Error(`Unexpected network call: ${url}`);
      sent.push(JSON.parse(init.body));
      return provider.accept(sent.length);
    };
    const env = await prepareAppMailBindings({ DB: storage.db, SNAPSHOT_CACHE: cache.namespace, SNAPSHOTS: storage.bucket,
      LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'page.example.test', AUTH_ORIGIN: origin, SETUP_OPERATOR_EMAIL: owner,
      SESSION_SECRET: secret, SETUP_TOKEN: setupToken, WEBHOOK_SIGNING_SECRET: 'synthetic-lamp-3',
      MAIL_RECIPIENTS: 'owner', ...provider.env });
    const { app } = createApp(env);
    const call = (path, { method = 'GET', form, cookie } = {}) => app.fetch(new Request(origin + path, { method,
      headers: { Host: 'app.example.test', Origin: origin, 'CF-Connecting-IP': '192.0.2.41', Accept: 'text/html',
        ...(cookie ? { Cookie: cookie } : {}), ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
      ...(form ? { body: new URLSearchParams(form).toString() } : {}) }), env);

    // The owner claims the installation; a second active operator exists, so "known but not the owner" is covered.
    const native = authFixture(storage.db, { origin, owner });
    await native.handle(native.request('/auth/bootstrap', { method: 'POST', body: { token: setupToken, displayName: 'Owner' } }));
    await native.auth.invite(native.request('/auth/invite', { method: 'POST', cookie: await native.signIn() }), { email: 'admin@example.com', displayName: 'Admin', role: 'admin' });
    const invite = new URL(native.messages.at(-1).text.match(/https?:\/\/[^\s]+/)[0]).searchParams.get('token');
    assert.equal((await native.handle(native.request('/auth/confirm', { method: 'POST', body: { token: invite } }))).status, 303);

    const page = await (await call('/signin')).text();
    assert.match(page, /name="email"/, 'the sign-in page offers the email form');
    assert.match(page, /owner-only-signin/);

    const answers = [];
    for (const email of ['stranger@example.org', 'admin@example.com', owner]) {
      const response = await call('/auth/magic-link', { method: 'POST', form: { email } });
      answers.push(`${response.status} ${response.headers.get('location')}`);
    }
    assert.equal(new Set(answers).size, 1, `${name}: every address gets the same answer: ${answers.join(' | ')}`);
    assert.equal(sent.length, 1, `${name}: exactly one message left: the owner's`);
    assert.deepEqual(provider.recipients(sent[0]), [owner]);

    const link = new URL(JSON.stringify(sent[0]).match(/https:\/\/app\.example\.test\/auth\/confirm\?token=[A-Za-z0-9_-]+/)[0]);
    const token = link.searchParams.get('token');
    const confirmed = await call('/auth/confirm', { method: 'POST', form: { token } });
    assert.equal(confirmed.status, 303);
    const cookie = confirmed.headers.getSetCookie().map(value => value.split(';')[0]).find(value => value.split('=')[1]);
    const session = await (await call('/auth/session', { cookie })).json();
    assert.equal(session.operator.email, owner);
    assert.equal((await call('/auth/confirm', { method: 'POST', form: { token } })).headers.get('set-cookie'), null, 'the link is single use');

    // Product mail stays off: no provider is reported to the app.
    assert.equal((await (await call('/api/app/mail-settings', { cookie })).json()).primaryProvider, null);
  } finally {
    globalThis.fetch = originalFetch;
    await cache.dispose?.(); await storage.runtime.dispose();
    await rm(dir, { recursive: true, force: true });
  }
}
