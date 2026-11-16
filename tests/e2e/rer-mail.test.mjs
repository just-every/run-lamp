import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHmac, createHash, randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { unstable_splitSqlQuery } from 'wrangler';
import { hashToken } from '@runeditrun/rer/internal/modules/operator-auth/crypto.mjs';
import { withDraftVersion } from './draft-version-helper.mjs';
import { deploymentConfig, mailEnvironmentNames, renderWranglerToml, resourceNames, setupPageSettingsStatement } from '../../scripts/ops-config.mjs';
import { dryRunInputFailure } from '../../scripts/deploy-preflight.mjs';
import { productionMail } from '@runeditrun/rer/internal/cli/production-mail.mjs';
import { commandAdapter } from '../../scripts/installer/local.mjs';
import { chromium } from 'playwright';
import { reachBuiltWorkerOptions } from './helpers/reach-built-worker.mjs';
import { operatorHydrated } from './helpers/operator-hydrated.mjs';

const require = createRequire(import.meta.url), workerRequire = createRequire(require.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = workerRequire('miniflare');
const { build } = workerRequire('esbuild');
const appOrigin = 'https://app.example.test', pageOrigin = 'https://status.example.test';
const receiptKey = Buffer.from('synthetic-lamp-provider-receipt-secret');
const owner = 'owner@example.test', reader = 'reader@example.test', pending = 'pending@example.test';

function nativeDeploymentEnvironment(provider = 'none') {
  return { LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'status.example.test', LAMP_PAGE_NAME: 'Synthetic Lamp',
    LAMP_PAGE_TAGLINE: 'Service updates', LAMP_PAGE_TIMEZONE: 'UTC', LAMP_ACCENT_COLOR: '#16794C', SETUP_OPERATOR_EMAIL: owner,
    MAIL_PROVIDER: provider, SESSION_SECRET: 'synthetic-lamp-session-secret-aaaaaaaaaaaa',
    SETUP_TOKEN: randomBytes(32).toString('hex'), INSTALLATION_KEY: randomBytes(32).toString('hex'),
    SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-subscriber-secret-bbbbbbbb', WEBHOOK_SIGNING_SECRET: randomBytes(32).toString('hex'),
    ...(provider === 'none' ? {} : { MAIL_FROM_ADDRESS: 'status@example.test', MAIL_PROVIDER_API_KEY: 'synthetic-lamp-provider-key-aaaaaaaa', MAIL_DKIM_SELECTOR: 'synthetic' }) };
}

const editableSettings = settings => Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'footerCreditEnabled', 'mailFromAddress'].map(key => [key, settings[key]]));

async function buildMailWorker(entry = 'tests/e2e/rer-mail.worker.ts') {
  return build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'browser', write: false,
    external: ['cloudflare:workers', 'node:*'], define: { 'import.meta.env.DEV': 'false' },
    plugins: [{ name: 'renderer-assets', setup(builder) {
      builder.onResolve({ filter: /\?(inline|raw)$/ }, args => ({ path: resolve(args.resolveDir, args.path.split('?')[0]), namespace: 'asset' }));
      builder.onLoad({ filter: /.*/, namespace: 'asset' }, async args => ({ contents: `export default ${JSON.stringify(await readFile(args.path, 'utf8'))}`, loader: 'js' }));
    } }],
  });
}

// Each row is the same business journey through a supported transport. Only
// provider responses are synthetic; app routes, migrations and Cron are real.
test('BASE-ACCESS-001 BASE-ACCESS-002 SUB-001 SUB-002 SUB-003 SUB-005 SUB-006 SUB-008 NOTIFY-001 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-006 NOTIFY-007 NOTIFY-008 NOTIFY-009 NOTIFY-010 NOTIFY-019 MAINT-005 MAINT-009 UPDATE-008 — Sign in, confirm a reader, publish, recover frozen mail, inspect receipts, notify maintenance and opt out', { timeout: 300_000 }, async () => {
  const built = await buildMailWorker();
  for (const provider of ['rer', 'resend', 'sendgrid']) {
    const state = await mkdtemp(join(tmpdir(), `lamp-mail-${provider}-`));
    const submissions = [];
    const keys = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    let runtime, cookie, responseStatus = 202;
    const wire = body => provider === 'sendgrid' ? {
      to: body.personalizations[0].to[0].email,
      text: body.content.find(part => part.type === 'text/plain')?.value,
      html: body.content.find(part => part.type === 'text/html')?.value,
      subject: body.subject, headers: body.headers,
    } : body;
    try {
      runtime = new Miniflare(convertV4MiniflareOptions({ name: `lamp-mail-${provider}`, modules: true, script: built.outputFiles[0].text,
        port: 0, inspectorPort: 0, compatibilityDate: '2026-09-08', compatibilityFlags: ['nodejs_compat'],
        bindings: { LAMP_PAGE_HOST: 'status.example.test', LAMP_APP_HOST: 'app.example.test', AUTH_ORIGIN: appOrigin,
          SETUP_OPERATOR_EMAIL: owner, SESSION_SECRET: 'synthetic-lamp-session-secret-aaaaaaaaaaaa',
          SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-subscriber-secret-bbbbbbbb', MAIL_PROVIDER: provider,
          MAIL_FROM_ADDRESS: 'status@example.test', MAIL_FROM: 'status@example.test',
          MAIL_PROVIDER_API_KEY: 'synthetic-lamp-provider-key', MAIL_API_KEY: 'synthetic-lamp-managed-key', MAIL_RELAY_URL: 'https://relay.example.test/api/managed-mail/send',
          RESEND_WEBHOOK_SECRET: `whsec_${receiptKey.toString('base64url')}`,
          SENDGRID_WEBHOOK_PUBLIC_KEY: keys.publicKey.export({ type: 'spki', format: 'der' }).toString('base64') },
        d1Databases: ['DB'], r2Buckets: ['SNAPSHOTS'], durableObjects: { SNAPSHOT_CACHE: { className: 'SnapshotCache', useSQLite: true } },
        queueProducers: { JOBS: 'lamp-mail-jobs' }, resourcePersistencePath: join(state, 'storage'),
        outboundService: async request => {
          const expected = provider === 'rer' ? 'https://relay.example.test/api/managed-mail/send' : provider === 'resend' ? 'https://api.resend.com/emails' : 'https://api.sendgrid.com/v3/mail/send';
          assert.equal(request.url, expected, 'mail submission stays at the configured provider');
          const body = await request.json();
          submissions.push({ body, id: `provider-${submissions.length + 1}` });
          if (responseStatus !== 202) return new Response(null, { status: responseStatus, headers: { 'Retry-After': '1', Location: 'https://elsewhere.example.test/' } });
          const id = submissions.at(-1).id;
          return provider === 'rer' ? Response.json({ messageId: `<${id}@relay.example.test>` }, { status: 202 })
            : provider === 'resend' ? Response.json({ id }) : new Response(null, { status: 202, headers: { 'x-message-id': id } });
        },
      }));
      const db = await runtime.getD1Database('DB');
      const execute = sql => db.batch(unstable_splitSqlQuery(sql).map(statement => db.prepare(statement)));
      for (const name of (await readdir('migrations/core')).filter(n => n.endsWith('.sql')).sort()) await execute(await readFile(join('migrations/core', name), 'utf8'));
      await execute(`INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES('01J00000000000000000000001','${owner}','Owner','owner','active',${Date.now()});
        INSERT INTO oa_bootstrap(singleton,claim_id,claimed_at) VALUES(1,'01J00000000000000000000001',${Date.now()});
        INSERT INTO page_settings(id,page_name,tagline,accent_color,timezone,hostname,feed_id,mail_from_address,created_at,updated_at) VALUES('default','Lamp mail journey','Updates','#16794C','UTC','status.example.test','mail-journey','status@example.test','2026-10-01','2026-10-01');
        INSERT INTO setup_readiness(step,evidence_key,checked_at) VALUES('first-run','complete','2026-10-01');`);
      const raw = (path, init = {}) => runtime.dispatchFetch(new URL(path, appOrigin).href, { redirect: 'manual', ...init, headers: { Host: new URL(path, appOrigin).host, ...init.headers } });
      const call = async (path, body, method = body ? 'POST' : 'GET') => {
        const init = await withDraftVersion(path, { method, ...(body ? { body: JSON.stringify(body) } : {}), headers: { Origin: appOrigin, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) } }, read => raw(read, { headers: { Cookie: cookie ?? '' } }));
        return raw(path, init);
      };
      const tick = async (expected = 204) => { assert.equal((await call('/__test/tick')).status, expected, `${provider}: scheduled work result`); };
      const deliveries = async () => (await (await call('/api/app/deliveries')).json()).deliveries;
      const sentTo = email => submissions.filter(row => {
        const to = provider === 'sendgrid' ? row.body.personalizations[0].to.map(person => person.email) : row.body.to;
        return Array.isArray(to) ? to.includes(email) : to === email;
      });
      const textFor = email => sentTo(email).map(row => wire(row.body).text).join('\n');
      const subscribe = email => raw(pageOrigin + '/subscribe', { method: 'POST', headers: { Origin: pageOrigin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email }).toString() });
      const result = await call('/auth/magic-link', { email: owner });
      assert.equal(result.status, 202, await result.clone().text());
      assert.equal((await call('/auth/magic-link', { email: 'unknown@example.test' })).status, 202);
      assert.equal(sentTo('unknown@example.test').length, 0);
      const token = new URL(textFor(owner).match(/https?:\/\/[^\s]+/)[0]).searchParams.get('token');
      const preview = await call('/auth/confirm?token=' + token);
      assert.equal(preview.status, 200); assert.equal(preview.headers.has('set-cookie'), false);
      const confirmed = await call('/auth/confirm', { token });
      assert.equal(confirmed.status, 303); cookie = confirmed.headers.get('set-cookie').split(';')[0];
      assert.equal((await call('/auth/confirm', { token })).status, 400);
      const created = await call('/api/app/components', { groupId: null, name: 'Payments', description: '', internal: false, displayOrder: 0, note: '' });
      assert.equal(created.status, 201); const component = (await created.json()).component;
      assert.equal((await subscribe(reader)).status, 202);
      assert.equal((await subscribe(pending)).status, 202);
      const pendingReader = (await (await call('/api/app/subscribers')).json()).subscribers.find(row => row.destination === reader);
      assert.equal((await call(`/api/app/subscribers/${pendingReader.id}/confirm-local`, {})).status, 404, 'a configured production Worker has no local confirmation door');
      assert.equal((await (await call('/api/app/deliveries')).json()).localConfirmationAllowed, false);
      const confirmUrl = textFor(reader).match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0];
      assert.equal((await raw(confirmUrl)).status, 200);
      const initialSettings = (await (await call('/api/app/page-settings')).json()).settings;
      const settingsInput = Object.fromEntries(['pageName','tagline','accentColor','timezone','hostname','footerCreditEnabled','mailFromAddress'].map(key => [key, initialSettings[key]]));
      const branding = { subjectPrefix: '[Operations]', header: 'Service updates from Operations', footer: 'Contact our support desk for help', ...(provider === 'rer' ? {} : { displayName: 'Operations status', replyTo: 'support@example.test' }) };
      if (provider === 'rer') {
        assert.equal(initialSettings.mailIdentityEditable, false);
        assert.equal((await call('/api/app/page-settings', { ...settingsInput, emailBranding: { displayName: 'Unsupported identity' } }, 'PUT')).status, 400);
        assert.equal((await call('/api/app/page-settings', { ...settingsInput, emailBranding: { replyTo: 'support@example.test' } }, 'PUT')).status, 400);
      }
      assert.equal((await call('/api/app/page-settings', { ...settingsInput, emailBranding: branding }, 'PUT')).status, 200);
      const incidentResponse = await call('/api/app/incidents', { title: 'Payment delays', components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }] });
      assert.equal(incidentResponse.status, 201); const incident = (await incidentResponse.json()).incident;
      const publish = async impact => {
        const saved = await call(`/api/app/incidents/${incident.id}/draft`, { lifecycle: 'Monitoring', affectedAudience: 'Payment customers', customerImpact: impact, whatStillWorks: 'Balances remain readable.', details: 'Operators are restoring capacity.', nextUpdateAt: new Date(Date.now() + 3600000).toISOString() }, 'PUT');
        assert.equal(saved.status, 200, await saved.clone().text());
        const response = await call(`/api/app/incidents/${incident.id}/publish`, { channels: ['email'] });
        assert.equal(response.status, 200, await response.clone().text());
        return (await response.json()).update;
      };
      responseStatus = 429;
      const update = await publish('Payment processing is delayed.');
      await tick();
      assert.equal(sentTo(pending).length, 1, 'unconfirmed readers receive only confirmation');
      const queued = (await deliveries()).find(row => row.incidentUpdateId === update.id);
      assert.equal(queued.outcome, 'queued'); assert.equal(queued.providerAcceptedAt, null);
      const firstAttempt = sentTo(reader).at(-1).body;
      const settings = (await (await call('/api/app/page-settings')).json()).settings;
      const edited = await call('/api/app/page-settings', { ...Object.fromEntries(['pageName','tagline','accentColor','timezone','hostname','footerCreditEnabled','mailFromAddress'].map(key => [key, settings[key]])), emailBranding: { subjectPrefix: '[Changed after submission]', footer: 'Changed after submission' } }, 'PUT');
      assert.equal(edited.status, 200, await edited.clone().text());
      responseStatus = 202;
      // Advance the fixture's queued clock; the ordinary Cron entry performs the retry.
      await db.prepare("UPDATE notification_outbox SET available_at='2000-01-01T00:00:00Z' WHERE completed_at IS NULL").run();
      await tick();
      const accepted = (await deliveries()).find(row => row.id === queued.id);
      assert.ok(accepted.providerAcceptedAt); assert.equal(accepted.outcome, 'queued', 'provider acceptance does not claim inbox delivery');
      assert.deepEqual(sentTo(reader).at(-1).body, firstAttempt, 'retry preserves the entire submitted envelope after settings change');
      const notification = wire(firstAttempt);
      assert.ok(notification.subject.startsWith(branding.subjectPrefix));
      assert.ok(typeof notification.html === 'string' && notification.html.includes(branding.footer), 'subscriber mail retains its complete branded HTML part');
      assert.ok(notification.text.includes(branding.header) && notification.text.includes(branding.footer));
      if (provider === 'sendgrid') {
        assert.equal(firstAttempt.from.name, branding.displayName); assert.equal(firstAttempt.reply_to.email, branding.replyTo);
      } else if (provider === 'resend') {
        assert.ok(firstAttempt.from.includes(branding.displayName)); assert.equal(firstAttempt.reply_to, branding.replyTo);
      }
      if (provider === 'rer') {
        assert.ok(notification.listUnsubscribePost); assert.ok(notification.listId && notification.listArchive && notification.listHelp);
      } else {
        assert.equal(notification.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
        assert.ok(notification.headers['List-Id'] && notification.headers['List-Archive'] && notification.headers['List-Help']);
        if (provider === 'sendgrid') for (const settings of Object.values(firstAttempt.tracking_settings)) assert.equal(settings.enable, false, 'transport disables recipient tracking');
      }
      const beforeReplay = submissions.length; await tick(); assert.equal(submissions.length, beforeReplay, 'Cron replay cannot resend an accepted envelope');
      if (provider !== 'rer') {
        const receipt = provider === 'resend' ? { type: 'email.delivered', data: { email_id: sentTo(reader).at(-1).id } }
          : [{ event: 'delivered', sg_event_id: 'receipt-delivered', lamp_message_id: firstAttempt.custom_args.lamp_message_id }];
        const body = JSON.stringify(receipt), timestamp = String(Math.floor(Date.now() / 1000));
        const headers = provider === 'resend' ? { 'svix-id': 'receipt-delivered', 'svix-timestamp': timestamp, 'svix-signature': 'v1,' + createHmac('sha256', receiptKey).update(`receipt-delivered.${timestamp}.${body}`).digest('base64url') }
          : { 'x-twilio-email-event-webhook-timestamp': timestamp, 'x-twilio-email-event-webhook-signature': sign('sha256', Buffer.from(timestamp + body), keys.privateKey).toString('base64') };
        const receiptCall = value => raw(pageOrigin + '/api/intake/mail-events', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: value });
        assert.equal((await receiptCall(body + ' ')).status, 401);
        assert.equal((await receiptCall(body)).status, 200);
        assert.equal((await receiptCall(body)).status, 200);
        assert.equal((await deliveries()).find(row => row.id === queued.id).outcome, 'delivered');
      }
      const prior = sentTo(reader).at(-1);
      await publish('Payment processing has improved.'); await tick();
      const threaded = wire(sentTo(reader).at(-1).body);
      const firstMessageId = provider === 'rer' ? `<${prior.id}@relay.example.test>` : notification.headers['Message-ID'];
      assert.equal(provider === 'rer' ? threaded.inReplyTo : threaded.headers['In-Reply-To'], firstMessageId);
      assert.equal(provider === 'rer' ? threaded.references : threaded.headers.References, firstMessageId);
      const maintenanceResponse = await call('/api/app/maintenance', { title: 'Payment service upgrade', affectedAudience: 'Payment customers', customerImpact: 'Authorizations may pause.', startsAt: new Date(Date.now() + 7200000).toISOString(), endsAt: new Date(Date.now() + 10800000).toISOString(), componentIds: [component.id], autoStart: false, autoComplete: false });
      assert.equal(maintenanceResponse.status, 201, await maintenanceResponse.clone().text());
      const maintenance = (await maintenanceResponse.json()).maintenance;
      await tick();
      const start = await call(`/api/app/maintenance/${maintenance.id}/start`, {}); assert.equal(start.status, 200); await tick();
      const maintenanceRows = (await deliveries()).filter(row => row.maintenanceReference === maintenance.reference);
      assert.deepEqual(maintenanceRows.map(row => row.maintenanceNoticeKind).sort(), ['reminder', 'scheduled', 'started']);
      assert.ok(maintenanceRows.every(row => row.providerAcceptedAt));
      for (const row of sentTo(reader).slice(-2)) {
        const notice = wire(row.body);
        assert.ok(notice.text.includes('Payment customers') && notice.text.includes('Authorizations may pause.'));
        assert.ok(typeof notice.html === 'string' && notice.html.includes('Payment customers') && notice.html.includes('Authorizations may pause.'), 'maintenance wording reaches both mail parts');
      }
      const csv = await call('/api/app/deliveries.csv'); assert.equal(csv.status, 200); assert.ok((await csv.text()).includes(reader));
      const unsubscribe = (provider === 'rer' ? notification.listUnsubscribe : notification.headers['List-Unsubscribe']).match(/<(https:\/\/[^>]+)>/)[1];
      assert.equal((await raw(unsubscribe)).status, 200, 'GET only previews unsubscribe');
      assert.equal((await raw(unsubscribe, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' })).status, 200);
      const sendsBefore = sentTo(reader).length; await publish('Payment processing is recovered.'); await tick();
      assert.equal(sentTo(reader).length, sendsBefore, 'opt-out revokes captured recipient authority before later sends');
      const list = (await (await call('/api/app/subscribers')).json()).subscribers;
      const readerRow = list.find(row => row.destination === reader);
      assert.equal(readerRow.state, 'deactivated');
      assert.equal((await call(`/api/app/subscribers/${readerRow.id}`, null, 'DELETE')).status, 204);
      const erased = await call('/api/app/subscribers.csv'); const erasedText = await erased.text();
      assert.ok(!erasedText.includes(reader)); assert.ok(erasedText.includes(pending), 'erasure preserves another reader');
      let expiring = pending;
      if (provider === 'sendgrid') {
        const pendingConfirmation = textFor(pending).match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0];
        assert.equal((await raw(pendingConfirmation)).status, 200);
        responseStatus = 500;
        const uncertainUpdate = await publish('Provider acknowledgement was interrupted.');
        await tick();
        const failed = (await deliveries()).find(row => row.incidentUpdateId === uncertainUpdate.id);
        assert.equal(failed.outcome, 'failed', 'an ambiguous submission is visible to the operator');
        const uncertain = sentTo(pending).at(-1), submissionCount = sentTo(pending).length;
        await tick(); assert.equal(sentTo(pending).length, submissionCount, 'ambiguous acceptance is never blindly resent');
        const receipt = async (event, id) => {
          const body = JSON.stringify([{ event, sg_event_id: id, lamp_message_id: uncertain.body.custom_args.lamp_message_id, type: 'bounce' }]);
          const timestamp = String(Math.floor(Date.now() / 1000));
          return raw(pageOrigin + '/api/intake/mail-events', { method: 'POST', headers: { 'Content-Type': 'application/json',
            'x-twilio-email-event-webhook-timestamp': timestamp,
            'x-twilio-email-event-webhook-signature': sign('sha256', Buffer.from(timestamp + body), keys.privateKey).toString('base64') }, body });
        };
        assert.equal((await receipt('delivered', 'uncertain-delivered')).status, 200);
        assert.equal((await deliveries()).find(row => row.id === failed.id).outcome, 'delivered', 'a later signed receipt reconciles uncertain submission');
        assert.equal((await receipt('bounce', 'uncertain-bounced')).status, 200);
        const bounced = (await (await call('/api/app/subscribers')).json()).subscribers.find(row => row.destination === pending);
        assert.equal(bounced.state, 'deactivated');
        const beforeSuppressed = sentTo(pending).length; responseStatus = 202;
        await publish('No later send to the bounced reader.'); await tick();
        assert.equal(sentTo(pending).length, beforeSuppressed);
        expiring = 'expiry@example.test'; assert.equal((await subscribe(expiring)).status, 202);
      }
      const remaining = (await (await call('/api/app/subscribers')).json()).subscribers.find(row => row.destination === expiring);
      await db.prepare("UPDATE subscribers SET created_at='2000-01-01T00:00:00Z',updated_at='2000-01-01T00:00:00Z' WHERE id=?").bind(remaining.id).run();
      await tick();
      assert.ok(!(await (await call('/api/app/subscribers')).json()).subscribers.some(row => row.id === remaining.id), 'Cron expires unconfirmed personal data');
    } finally { await runtime?.dispose(); await rm(state, { recursive: true, force: true }); }
  }
});

// One sender-readiness behaviour across managed and owner-supplied mail.
// Only transport replies and initial installation/session state are fixtures.
test('Managed sender readiness clears an obsolete failure and enables subscriber mail; missing mail credentials remain actionable and unavailable', { timeout: 120_000 }, async () => {
  const built = await buildMailWorker();
  const secret = 'synthetic-lamp-session-secret-aaaaaaaaaaaa';
  const session = randomBytes(32).toString('base64url');
  const sessionHash = await hashToken(secret, 'session', session);
  for (const configuration of [
    { provider: 'rer', ready: true },
    { provider: 'rer', ready: false },
    { provider: 'resend', ready: false },
  ]) {
    const { provider, ready } = configuration;
    const state = await mkdtemp(join(tmpdir(), 'synthetic-lamp-sender-'));
    const submissions = [];
    const runtime = new Miniflare(convertV4MiniflareOptions({
      name: 'synthetic-lamp-sender', modules: true, script: built.outputFiles[0].text,
      port: 0, inspectorPort: 0, compatibilityDate: '2026-09-08', compatibilityFlags: ['nodejs_compat'],
      bindings: { LAMP_PAGE_HOST: 'status.example.test', LAMP_APP_HOST: 'app.example.test', AUTH_ORIGIN: appOrigin,
        SETUP_OPERATOR_EMAIL: owner, SESSION_SECRET: secret, MAIL_PROVIDER: provider,
        SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-subscriber-secret-bbbbbbbb',
        MAIL_FROM_ADDRESS: 'status@example.test', MAIL_FROM: 'status@example.test',
        ...(ready ? { MAIL_API_KEY: 'synthetic-lamp-managed-key' } : {}),
        MAIL_RELAY_URL: 'https://relay.example.test/api/managed-mail/send' },
      d1Databases: ['DB'], r2Buckets: ['SNAPSHOTS'],
      durableObjects: { SNAPSHOT_CACHE: { className: 'SnapshotCache', useSQLite: true } },
      queueProducers: { JOBS: 'synthetic-lamp-sender-jobs' }, resourcePersistencePath: join(state, 'storage'),
      outboundService: async request => {
        assert.equal(request.url, 'https://relay.example.test/api/managed-mail/send', 'readiness never requests a platform provider account');
        assert.equal(request.method, 'POST');
        submissions.push(await request.json());
        return Response.json({ messageId: '<synthetic-lamp-sender-1@relay.example.test>' }, { status: 202 });
      },
    }));
    try {
      const db = await runtime.getD1Database('DB');
      const execute = sql => db.batch(unstable_splitSqlQuery(sql).map(statement => db.prepare(statement)));
      for (const name of (await readdir('migrations/core')).filter(n => n.endsWith('.sql')).sort()) await execute(await readFile(join('migrations/core', name), 'utf8'));
      const now = Date.now();
      await execute(`INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES('01J00000000000000000000001','${owner}','Owner','owner','active',${now});
        INSERT INTO oa_bootstrap(singleton,claim_id,claimed_at) VALUES(1,'01J00000000000000000000001',${now});
        INSERT INTO oa_tokens(id,token_hash,kind,operator_id,operator_version,return_to,created_at,expires_at,consumed_at) SELECT 'synthetic-lamp-proof-1','synthetic-lamp-proof-hash-1','magic',id,version,'/app',${now},${now+1200000},${now} FROM oa_operators;
        INSERT INTO oa_sessions(id,token_hash,operator_id,operator_version,kind,source_token_id,created_at,expires_at) SELECT 'synthetic-lamp-session-1','${sessionHash}',id,version,'native','synthetic-lamp-proof-1',${now},${now+86400000} FROM oa_operators;
        INSERT INTO page_settings(id,page_name,tagline,accent_color,timezone,hostname,feed_id,mail_from_address,created_at,updated_at) VALUES('default','Synthetic Lamp sender','Updates','#16794C','UTC','status.example.test','synthetic-lamp-sender-1','status@example.test','2026-10-01','2026-10-01');
        INSERT INTO setup_readiness(step,evidence_key,checked_at) VALUES('first-run','complete','2026-10-01');`);
      if (provider === 'rer') {
        // Reproduce the recent failure a pre-fix installation already cached.
        const oldKey = createHash('sha256').update(JSON.stringify(['status@example.test', 'rer', ''])).digest('base64url');
        await db.prepare('INSERT INTO setup_readiness(step,evidence_key,checked_at) VALUES(?,?,?)')
          .bind('sender-failed', oldKey + '\nThis sender needs a supported provider credential for the verification check.', new Date().toISOString()).run();
      }
      const live = async () => {
        const response = await runtime.dispatchFetch(appOrigin + '/api/app/overview/live', { headers: { Host: 'app.example.test', Cookie: '__Host-operator_session=' + session } });
        assert.equal(response.status, 200);
        return (await response.json()).live;
      };
      const before = await live();
      assert.equal(before.senderVerificationManaged, ready);
      assert.equal(before.sender.state, ready ? 'verified' : 'failed');
      assert.ok(before.sender.checkedAt);
      assert.equal(submissions.length, 0, 'the sender check sends no mail');
      if (ready) {
        assert.match(before.sender.message, /managed by Run Edit Run/i);
        assert.match(before.sender.message, /inbox delivery is not confirmed/i);
      } else {
        assert.match(before.sender.message, /hosting administrator/i);
        assert.match(before.sender.message, /redeploy Lamp/i);
        assert.match(before.sender.message, provider === 'rer' ? /managed mail connection/i : /MAIL_PROVIDER_API_KEY/);
      }
      const response = await runtime.dispatchFetch(pageOrigin + '/subscribe', { method: 'POST',
        headers: { Host: 'status.example.test', Origin: pageOrigin, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: reader }) });
      if (ready) {
        assert.equal(response.status, 202, await response.clone().text());
        assert.equal(submissions.length, 1, 'the public subscriber door can submit via the managed relay');
        assert.equal(submissions[0].to, reader);
        assert.ok(submissions[0].text.includes('/confirm-subscription/'));
      } else {
        assert.ok(response.status >= 400, 'an incomplete sender cannot send subscriber mail');
        assert.equal(submissions.length, 0);
      }
      const after = await live();
      assert.deepEqual(after.sender, before.sender, 'the current sender evidence remains stable on the next read');
    } finally { await runtime.dispose(); await rm(state, { recursive: true, force: true }); }
  }
});

test('A deliberate mail-off deployment passes native configuration and Base preflight; enabled and contradictory inputs still refuse', async () => {
  const env = { LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'status.example.test', LAMP_PAGE_NAME: 'Synthetic Lamp',
    LAMP_PAGE_TAGLINE: 'Service updates', LAMP_PAGE_TIMEZONE: 'UTC', LAMP_ACCENT_COLOR: '#16794C', SETUP_OPERATOR_EMAIL: owner,
    MAIL_PROVIDER: 'none', SESSION_SECRET: randomBytes(32).toString('hex'), SETUP_TOKEN: randomBytes(32).toString('hex'),
    INSTALLATION_KEY: randomBytes(32).toString('hex'), SUBSCRIBER_TOKEN_SECRET: randomBytes(32).toString('hex'), WEBHOOK_SIGNING_SECRET: randomBytes(32).toString('hex') };
  const config = deploymentConfig(env);
  const toml = renderWranglerToml(config, { ...resourceNames('production'), databaseId: '00000000-0000-0000-0000-000000000000' });
  const { unstable_readConfig } = await import('wrangler');
  const directory = await mkdtemp(join(tmpdir(), 'synthetic-lamp-mail-off-'));
  try {
    const file = join(directory, 'wrangler.toml');
    const { writeFile } = await import('node:fs/promises');
    await writeFile(file, toml);
    const runtime = unstable_readConfig({ config: file });
    assert.equal(runtime.vars.MAIL_PROVIDER, 'none');
    assert.equal(runtime.vars.MAIL_FROM_ADDRESS, undefined);
    const operations = JSON.parse(await readFile('OPERATIONS.json', 'utf8'));
    operations.requiredEnvironment = [...new Set([...operations.requiredEnvironment, ...mailEnvironmentNames(env)])];
    assert.equal(dryRunInputFailure(operations, env), null);
    const declaration = JSON.parse(await readFile(commandAdapter.deployDeclaration, 'utf8'));
    const preflight = await productionMail(process.cwd(), declaration, env, commandAdapter.deployDeclaration, commandAdapter);
    assert.equal(preflight.off, true); assert.deepEqual(preflight.offConflicts, []);
    for (const provider of ['rer','resend','sendgrid','mailgun','ses','postmark']) {
      const sending = { ...env, MAIL_PROVIDER: provider, MAIL_FROM: 'status@example.test', MAIL_FROM_ADDRESS: 'status@example.test',
        MAIL_DKIM_SELECTOR: 'synthetic', MAIL_RELAY_URL: 'https://relay.example.test/send', MAIL_API_KEY: randomBytes(32).toString('hex'),
        MAIL_PROVIDER_API_KEY: randomBytes(32).toString('hex'), SES_REGION: 'us-east-1', SES_CONFIGURATION_SET: 'synthetic', SES_EVENT_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:synthetic' };
      deploymentConfig(sending);
      delete sending[provider === 'rer' ? 'MAIL_API_KEY' : 'MAIL_PROVIDER_API_KEY'];
      assert.throws(() => deploymentConfig(sending), /required/);
    }
    for (const name of ['MAIL_API_KEY','MAIL_PROVIDER_API_KEY','MAIL_RELAY_URL','MAIL_SECONDARY_API_KEY','RESEND_API_KEY','SENDGRID_API_KEY','MAIL_ACCOUNT_ID']) {
      assert.throws(() => deploymentConfig({ ...env, [name]: 'synthetic-lamp-credential' }), /conflicts/);
    }
    const defaultInput = { ...env }; delete defaultInput.MAIL_PROVIDER;
    assert.equal(deploymentConfig(defaultInput).mailProvider, 'none', 'a fresh deploy follows the declared mail-off default');
    assert.equal((await productionMail(process.cwd(), declaration, defaultInput, commandAdapter.deployDeclaration, commandAdapter)).off, true);
    for (const selection of ['later', 'direct']) {
      const input = { ...env, MAIL_PROVIDER: selection };
      assert.throws(() => deploymentConfig(input));
      assert.equal((await productionMail(process.cwd(), declaration, input, commandAdapter.deployDeclaration, commandAdapter)).off, false);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('Mail-off keeps email unavailable, operator alerts pending and status work usable without exposing hosted sign-in shortcuts', { timeout: 120_000 }, async () => {
  const built = await buildMailWorker('tests/e2e/rer-mail-off.worker.ts');
  const state = await mkdtemp(join(tmpdir(), 'synthetic-lamp-off-'));
  const secret = 'synthetic-lamp-session-secret-aaaaaaaaaaaa', session = randomBytes(32).toString('base64url');
  const sessionHash = await hashToken(secret, 'session', session);
  const requests = [];
  const runtime = new Miniflare(convertV4MiniflareOptions({ name: 'synthetic-lamp-off', modules: true, script: built.outputFiles[0].text,
    port: 0, inspectorPort: 0, compatibilityDate: '2026-09-08', compatibilityFlags: ['nodejs_compat'],
    bindings: { LAMP_PAGE_HOST: 'status.example.test', LAMP_APP_HOST: 'app.example.test', AUTH_ORIGIN: appOrigin,
      SETUP_OPERATOR_EMAIL: owner, SESSION_SECRET: secret, MAIL_PROVIDER: 'none', SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-subscriber-secret-bbbbbbbb' },
    d1Databases: ['DB'], r2Buckets: ['SNAPSHOTS'], durableObjects: { SNAPSHOT_CACHE: { className: 'SnapshotCache', useSQLite: true } },
    queueProducers: { JOBS: 'synthetic-lamp-off-jobs' }, resourcePersistencePath: join(state, 'storage'),
    outboundService: async request => { requests.push(request.url); return new Response('<!doctype html><html><body>Synthetic public check</body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }); },
  }));
  try {
    const db = await runtime.getD1Database('DB');
    const execute = sql => db.batch(unstable_splitSqlQuery(sql).map(statement => db.prepare(statement)));
    for (const name of (await readdir('migrations/core')).filter(n => n.endsWith('.sql')).sort()) await execute(await readFile(join('migrations/core', name), 'utf8'));
    const now = Date.now();
    await execute(`INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES('01J00000000000000000000001','${owner}','Owner','owner','active',${now});
      INSERT INTO oa_bootstrap(singleton,claim_id,claimed_at) VALUES(1,'01J00000000000000000000001',${now});
      INSERT INTO oa_tokens(id,token_hash,kind,operator_id,operator_version,return_to,created_at,expires_at,consumed_at) SELECT 'synthetic-lamp-proof-1','synthetic-lamp-proof-hash-1','magic',id,version,'/app',${now},${now+1200000},${now} FROM oa_operators;
      INSERT INTO oa_sessions(id,token_hash,operator_id,operator_version,kind,source_token_id,created_at,expires_at) SELECT 'synthetic-lamp-session-1','${sessionHash}',id,version,'native','synthetic-lamp-proof-1',${now},${now+86400000} FROM oa_operators;
      ${setupPageSettingsStatement(deploymentConfig(nativeDeploymentEnvironment()))}`);
    const raw = (path, init = {}) => runtime.dispatchFetch(new URL(path, appOrigin).href, { redirect: 'manual', ...init,
      headers: { Host: new URL(path, appOrigin).host, 'CF-Connecting-IP': '192.0.2.1', ...init.headers } });
    const cookie = '__Host-operator_session=' + session;
    const call = async (path, body, method = body ? 'POST' : 'GET') => raw(path, await withDraftVersion(path,
      { method, ...(body ? { body: JSON.stringify(body) } : {}), headers: { Origin: appOrigin, Cookie: cookie, ...(body ? { 'Content-Type': 'application/json' } : {}) } },
      read => raw(read, { headers: { Cookie: cookie } })));
    const installed = (await (await call('/api/app/page-settings')).json()).settings;
    assert.equal(installed.mailFromAddress, '');
    const confirmedSettings = await call('/api/app/page-settings', { ...editableSettings(installed), pageName: 'Synthetic Lamp off' }, 'PUT');
    assert.equal(confirmedSettings.status, 200, await confirmedSettings.clone().text());
    assert.equal((await call('/api/app/overview/first-run', { components: [], groups: [] })).status, 200);
    const emailResults = [];
    for (const email of [owner, 'unknown@example.test']) {
      const response = await raw('/auth/magic-link', { method: 'POST', headers: { Origin: appOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      assert.equal(response.status, 503); emailResults.push(await response.json());
    }
    assert.deepEqual(emailResults[0], emailResults[1]); assert.equal(emailResults[0].error, 'mail_unavailable');
    const invitations = [];
    // The first request names a new address; the second names the now-known
    // pending operator. Neither returns a token or claims that mail was sent.
    for (const email of ['invited@example.test', 'invited@example.test']) {
      const invitation = await call('/api/app/operators/invite', { email, displayName: 'Invited operator' });
      assert.equal(invitation.status, 503); invitations.push(await invitation.json());
    }
    assert.deepEqual(invitations[0], invitations[1]); assert.equal(invitations[0].error, 'mail_unavailable');
    assert.equal((await raw('/api/app/incidents')).status, 401);
    for (const path of ['/__dev/owner','/__dev/sign-in','/__dev/outbox','/auth/local-entry']) {
      const refused = await raw(path, { headers: { 'x-rer-dev-key': 'synthetic-lamp-dev-key' } });
      assert.equal(refused.headers.has('set-cookie'), false); assert.ok([404,401,403].includes(refused.status), path);
    }
    const forged = await raw('/auth/owner-signin?token=' + randomBytes(32).toString('base64url'));
    assert.equal(forged.status, 303); assert.equal(forged.headers.has('set-cookie'), false);
    const created = await call('/api/app/components', { groupId: null, name: 'Payments', description: '', internal: false, displayOrder: 0, note: '' });
    assert.equal(created.status, 201); const component = (await created.json()).component;
    const incidentResponse = await call('/api/app/incidents', { title: 'Synthetic payment delays', components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }] });
    assert.equal(incidentResponse.status, 201); const incident = (await incidentResponse.json()).incident;
    const saved = await call(`/api/app/incidents/${incident.id}/draft`, { lifecycle: 'Monitoring', affectedAudience: 'Payment customers', customerImpact: 'Payments are delayed.', whatStillWorks: 'Balances remain readable.', details: 'Operators are restoring service.', nextUpdateAt: new Date(now + 3600000).toISOString() }, 'PUT');
    assert.equal(saved.status, 200, await saved.clone().text());
    const published = await call(`/api/app/incidents/${incident.id}/publish`, { channels: [] });
    assert.equal(published.status, 200, await published.clone().text());
    const maintenanceResponse = await call('/api/app/maintenance', { title: 'Synthetic payment upgrade', affectedAudience: 'Payment customers', customerImpact: 'Authorizations may pause.', startsAt: new Date(now + 7200000).toISOString(), endsAt: new Date(now + 10800000).toISOString(), componentIds: [component.id], autoStart: false, autoComplete: false });
    assert.equal(maintenanceResponse.status, 201, await maintenanceResponse.clone().text());
    const maintenance = (await maintenanceResponse.json()).maintenance;
    const publicPage = await raw(pageOrigin + '/'); assert.equal(publicPage.status, 200);
    const html = await publicPage.text(); assert.ok(html.includes(incident.title) && html.includes(maintenance.title));
    assert.doesNotMatch(html, /<form\b[^>]*action=["']\/subscribe["']/i, 'a deliberately mail-off page offers no email subscription form');
    assert.match(html, /Email subscriptions are unavailable/i);
    const live = (await (await call('/api/app/overview/live')).json()).live;
    assert.equal(live.sender.state, 'off', 'deliberately disabled email is not a sender failure');
    assert.equal(live.sender.checkedAt, null, 'mail-off needs no provider verification');
    assert.equal(live.subscribe, null, 'the intentionally unavailable email form is not a failing check');
    assert.equal(live.page.ok, true, 'the public page remains checked independently');
    assert.equal((await call('/__test/clock', { now: now + 7500000 }, 'PUT')).status, 204);
    assert.equal((await call('/__test/tick')).status, 204);
    const held = (await (await call('/api/app/overview/follow-ups')).json()).followUps;
    assert.ok(held.some(row => row.kind === 'notification-dispatch' && row.failure), JSON.stringify(held));
    const delivery = (await (await call('/api/app/deliveries')).json());
    assert.equal(delivery.mail.provider, 'none'); assert.equal(delivery.mail.local, false);
    assert.equal(delivery.localConfirmationAllowed, false);
    assert.ok(delivery.deliveries.every(row => !row.providerAcceptedAt && row.outcome !== 'delivered'));
    assert.ok(requests.every(url => new URL(url).host === 'status.example.test'), 'no provider request occurs');
    const start = await call(`/api/app/maintenance/${maintenance.id}/start`, {}); assert.equal(start.status, 200);
    assert.equal((await call('/api/app/incidents')).status, 200);

  } finally { await runtime.dispose(); await rm(state, { recursive: true, force: true }); }
});


test('The built hosted mail-off owner signs in, finishes native first-run after Skip or Read website and saves Settings; enabled sender validation stays intact', { timeout: 120_000 }, async () => {
  const { externalWorkers, ...built } = await reachBuiltWorkerOptions();
  // dispatchFetch traverses loopback ingress; restore the actual request's Host
  // before the built Worker's host and native authentication guards.
  built.modules[0].contents = built.modules[0].contents.replace('return worker.fetch(request, bindings(env), context);',
    "request = new Request(request); request.headers.set('Host', new URL(request.url).host); return worker.fetch(request, bindings(env), context);");
  const requests = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox','--use-mock-keychain','--password-store=basic'] });
    for (const [provider, choice] of [['none', 'skip'], ['none', 'read'], ['resend', 'skip'], ['resend', 'read']]) {
      const env = nativeDeploymentEnvironment(provider);
      const runtime = new Miniflare(convertV4MiniflareOptions({ port: 0, inspectorPort: 0,
        workers: [{ ...built, bindings: { ...env, AUTH_ORIGIN: appOrigin }, d1Databases: ['DB'], r2Buckets: ['SNAPSHOTS'],
          outboundService: async request => {
            requests.push(request.url);
            const url = new URL(request.url);
            if (url.host === 'cloudflare-dns.com') return Response.json({ Status: 0, Answer: url.searchParams.get('type') === '1' ? [{ type: 1, data: '93.184.215.14' }] : [] });
            assert.ok(['www.example.com', 'status.example.com', 'status.example.test'].includes(url.host), 'setup sends no provider request');
            return new Response('<!doctype html><html><head><title>Synthetic company</title><meta name="description" content="Synthetic service updates"></head><body><h1>Synthetic company</h1></body></html>', { headers: { 'Content-Type': 'text/html' } });
          } }, ...externalWorkers] }));
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      try {
        const db = await runtime.getD1Database('DB');
        for (const name of (await readdir('migrations/core')).filter(n => n.endsWith('.sql')).sort()) {
          await db.batch(unstable_splitSqlQuery(await readFile(join('migrations/core', name), 'utf8')).map(statement => db.prepare(statement)));
        }
        const now = Date.now(), session = randomBytes(32).toString('base64url');
        await db.batch([
          db.prepare("INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES('01J00000000000000000000001',?,'Owner','owner','active',?)").bind(owner, now),
          db.prepare("INSERT INTO oa_bootstrap(singleton,claim_id,claimed_at) VALUES(1,'01J00000000000000000000001',?)").bind(now),
          db.prepare(setupPageSettingsStatement(deploymentConfig(env))),
          db.prepare("INSERT INTO oa_tokens(id,token_hash,kind,operator_id,operator_version,return_to,created_at,expires_at,consumed_at) SELECT 'synthetic-lamp-proof','synthetic-lamp-proof-hash','magic',id,version,'/app',?,?,? FROM oa_operators").bind(now, now + 1200000, now),
          db.prepare("INSERT INTO oa_sessions(id,token_hash,operator_id,operator_version,kind,source_token_id,created_at,expires_at) SELECT 'synthetic-lamp-session',?,id,version,'native','synthetic-lamp-proof',?,? FROM oa_operators").bind(await hashToken(env.SESSION_SECRET, 'session', session), now, now + 86400000),
        ]);
        assert.equal((await db.prepare("SELECT * FROM setup_readiness WHERE step='first-run'").all()).results.length, 0, 'native fresh setup has not been completed');
        const raw = (path, init = {}) => runtime.dispatchFetch(new URL(path, appOrigin).href, { redirect: 'manual', ...init,
          headers: { Host: new URL(path, appOrigin).host, 'CF-Connecting-IP': '192.0.2.1', ...init.headers } });
        for (const path of ['/app', '/app/incidents', '/app/settings']) {
          const refused = await raw(path);
          assert.equal(refused.status, 302, await refused.clone().text()); assert.equal(new URL(refused.headers.get('location')).pathname, '/signin');
          assert.equal(refused.headers.has('set-cookie'), false);
        }
        await context.route('**/*', async route => {
          const request = route.request();
          const response = await raw(request.url(), { method: request.method(), headers: await request.allHeaders(), body: request.postDataBuffer() ?? undefined });
          await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) });
        });
        const page = await context.newPage(); await page.goto(appOrigin + '/signin');
        if (provider === 'none') {
          assert.equal(await page.locator('form[action="/auth/magic-link"]').count(), 0);
          assert.equal(await page.locator('code').filter({ hasText: 'rer signin' }).count(), 1);
          assert.equal(await page.locator('input[type="password"]').count(), 0, 'no setup or sign-in token is exposed');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
        }
        // Only already-proven native session custody is seeded; first-run and
        // Settings writes below come from the real hydrated production screens.
        await context.addCookies([{ name: '__Host-operator_session', value: session, url: appOrigin, secure: true, httpOnly: true, sameSite: 'Lax' }]);
        const gated = await raw('/app', { headers: { Cookie: '__Host-operator_session=' + session } });
        assert.equal(gated.status, 302); assert.equal(new URL(gated.headers.get('location'), appOrigin).pathname, '/setup');
        await page.goto(appOrigin + '/setup');
        if (choice === 'skip') await page.getByRole('button', { name: "Skip, I'll fill it in", exact: true }).click();
        else {
          await page.getByLabel('Website', { exact: true }).fill('https://www.example.com');
          await page.getByRole('button', { name: 'Read website', exact: true }).click();
          await page.getByRole('status').filter({ hasText: 'We read example.com' }).waitFor();
        }
        if (provider === 'none' && process.env.LAMP_MAIL_OFF_PROOF_DIR) {
          await mkdir(process.env.LAMP_MAIL_OFF_PROOF_DIR, { recursive: true });
          await page.screenshot({ path: join(process.env.LAMP_MAIL_OFF_PROOF_DIR, `setup-${choice}-mail-off-1440.png`), fullPage: true });
          await page.setViewportSize({ width: 390, height: 844 });
          await page.screenshot({ path: join(process.env.LAMP_MAIL_OFF_PROOF_DIR, `setup-${choice}-mail-off-390.png`), fullPage: true });
          await page.setViewportSize({ width: 1440, height: 1000 });
        }
        const saved = page.waitForResponse(response => new URL(response.url()).pathname === '/api/app/page-settings' && response.request().method() === 'PUT');
        await page.getByRole('button', { name: choice === 'skip' ? 'Open Lamp' : 'Looks right, open Lamp', exact: true }).click();
        const result = await saved;
        assert.equal(result.status(), 200, `${provider}/${choice}: ${await result.text()}`);
        await page.waitForURL('**/app');
        assert.equal((await db.prepare("SELECT evidence_key FROM setup_readiness WHERE step='first-run'").first()).evidence_key, 'complete');
        for (const path of ['/app', '/app/incidents', '/app/maintenance']) {
          await page.goto(appOrigin + path); assert.equal(new URL(page.url()).pathname, path);
          await page.getByRole('heading', { level: 1 }).waitFor();
        }
        if (provider === 'none' && choice === 'skip') {
          await page.goto(appOrigin + '/app');
          await page.getByText('Email is off for this installation', { exact: true }).waitFor();
          assert.equal(await page.locator('.live-strip.is-failing').count(), 0, 'deliberate mail-off does not mark the installation as broken');
          await page.goto(pageOrigin + '/');
          assert.equal(await page.locator('form[action="/subscribe"]').count(), 0, 'the hosted public page does not offer unusable email signup');
          await page.getByText('Email subscriptions are unavailable for this installation.', { exact: true }).first().waitFor();
        }
        await page.goto(appOrigin + '/app/settings');
        await operatorHydrated(page);
        await page.locator('.settings-page:not([inert])').waitFor();
        const savedSettings = page.waitForResponse(response => new URL(response.url()).pathname === '/api/app/page-settings' && response.request().method() === 'PUT');
        await page.getByLabel('Page name', { exact: true }).fill(`Synthetic saved ${provider} ${choice}`);
        await page.getByLabel('Page name', { exact: true }).blur();
        assert.equal((await savedSettings).status(), 200);
        await page.getByRole('status').filter({ hasText: 'Saved' }).waitFor();
        assert.equal(await page.getByRole('alert').count(), 0, 'the absent sender does not appear as a Settings save error');
        const settings = (await (await raw('/api/app/page-settings', { headers: { Cookie: '__Host-operator_session=' + session } })).json()).settings;
        assert.equal(settings.pageName, `Synthetic saved ${provider} ${choice}`);
        assert.equal(settings.mailFromAddress, provider === 'none' ? '' : 'status@example.test');
        assert.equal((await db.prepare("SELECT mail_from_address FROM page_settings WHERE id='default'").first()).mail_from_address, settings.mailFromAddress);
        if (provider === 'resend') {
          const invalid = await raw('/api/app/page-settings', { method: 'PUT', headers: { Origin: appOrigin, Cookie: '__Host-operator_session=' + session, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editableSettings(settings), mailFromAddress: 'invalid-sender' }) });
          assert.equal(invalid.status, 400);
          assert.ok((await invalid.json()).issues.some(issue => issue.path[0] === 'mailFromAddress'));
          assert.equal((await db.prepare("SELECT mail_from_address FROM page_settings WHERE id='default'").first()).mail_from_address, 'status@example.test');
        }
        if (provider === 'none' && choice === 'skip' && process.env.LAMP_MAIL_OFF_PROOF_DIR) {
          await mkdir(process.env.LAMP_MAIL_OFF_PROOF_DIR, { recursive: true });
          for (const [name, path] of [['overview', appOrigin + '/app'], ['public', pageOrigin + '/'], ['settings', appOrigin + '/app/settings']]) {
            await page.goto(path); await page.getByRole('heading', { level: 1 }).waitFor();
            await page.screenshot({ path: join(process.env.LAMP_MAIL_OFF_PROOF_DIR, `${name}-mail-off-1440.png`), fullPage: true });
            await page.setViewportSize({ width: 390, height: 844 });
            await page.screenshot({ path: join(process.env.LAMP_MAIL_OFF_PROOF_DIR, `${name}-mail-off-390.png`), fullPage: true });
            await page.setViewportSize({ width: 1440, height: 1000 });
          }
        }
      } finally {
        // Browser close does not wait for route callbacks that still use Miniflare.
        await context.unrouteAll({ behavior: 'wait' });
        await context.close();
        await runtime.dispose();
      }
    }
    assert.ok(requests.some(url => new URL(url).host === 'www.example.com'), 'Read website traverses the real website reader');
  } finally { await browser?.close(); }
});
