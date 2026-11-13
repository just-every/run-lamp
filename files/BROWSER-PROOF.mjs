import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const packet = resolve(process.argv[2]);
const require = createRequire(resolve('package.json'));
const wranglerRequire = createRequire(require.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const { unstable_getMiniflareWorkerOptions } = require('wrangler');
const { chromium } = require('playwright');
const { hashToken } = await import(pathToFileURL(require.resolve('@runeditrun/rer/internal/modules/operator-auth/crypto.mjs')));
const { localCookieName } = await import(pathToFileURL(require.resolve('@runeditrun/rer/internal/modules/operator-auth/http.mjs')));
const { migrate, executeSql } = await import(pathToFileURL(resolve('tests/reference-storage/runtime.mjs')));
const { reservePort } = await import(pathToFileURL(resolve('tests/e2e/worker-startup.mjs')));
const options = unstable_getMiniflareWorkerOptions(resolve('dist/server/wrangler.json'));
const { modulesRules, ...workerOptions } = options.workerOptions;
async function moduleFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await moduleFiles(path));
    else if (/\.(?:js|mjs|txt|html|sql|bin|wasm)$/.test(path)) files.push({
      type: /\.(?:js|mjs)$/.test(path) ? 'ESModule' : /\.(?:txt|html|sql)$/.test(path) ? 'Text' : path.endsWith('.bin') ? 'Data' : 'CompiledWasm', path,
    });
  }
  return files;
}
const modules = await moduleFiles(dirname(options.main));
modules.sort((a,b) => a.path === options.main ? -1 : b.path === options.main ? 1 : a.path.localeCompare(b.path));
const rows = [];
for (const provider of ['rer', 'resend']) {
  const state = await mkdtemp(join(tmpdir(), 'synthetic-lamp-browser-'));
  let runtime, browser;
  const port = await reservePort({ label: 'managed sender browser proof' });
  const origin = `http://127.0.0.1:${port}`;
  const secret = 'synthetic-lamp-browser-secret-1'.repeat(3);
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
  try {
    runtime = new Miniflare(convertV4MiniflareOptions({
      port, inspectorPort: 0, resourcePersistencePath: state,
      workers: [{ ...workerOptions, modules, modulesRoot: dirname(options.main),
        bindings: { AUTH_ORIGIN: origin, LAMP_LOCAL_ORIGIN: origin, LAMP_APP_HOST: '127.0.0.1', LAMP_PAGE_HOST: 'localhost', AUTH_LOCAL: 'true',
          SETUP_OPERATOR_EMAIL: 'synthetic-lamp-owner@example.test', SESSION_SECRET: secret,
          SUBSCRIBER_TOKEN_SECRET: 'synthetic-lamp-browser-subscriber-1'.repeat(3),
          MAIL_PROVIDER: provider, MAIL_FROM_ADDRESS: 'lamp@example.test', MAIL_FROM: 'lamp@example.test',
          ...(provider === 'rer' ? { MAIL_RELAY_URL: 'https://relay.example.test/api/managed-mail/send', MAIL_API_KEY: 'synthetic-lamp-browser-managed-1' } : {}),
        },
        outboundService: async request => {
          const url = new URL(request.url);
          if (['localhost', '127.0.0.1'].includes(url.hostname)) return runtime.dispatchFetch(request);
          throw new Error('External requests are disabled for this browser proof');
        },
      }, ...options.externalWorkers],
    }));
    await runtime.ready;
    const env = await runtime.getBindings();
    await migrate(env.DB);
    const now = Date.now(), hash = await hashToken(secret, 'session', token);
    await executeSql(env.DB, `INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES('01J00000000000000000000001','synthetic-lamp-owner@example.test','Synthetic Lamp owner','owner','active',${now});
      INSERT INTO oa_bootstrap(singleton,claim_id,claimed_at) VALUES(1,'01J00000000000000000000001',${now});
      INSERT INTO oa_tokens(id,token_hash,kind,operator_id,operator_version,return_to,created_at,expires_at,consumed_at) SELECT 'synthetic-lamp-proof-1','synthetic-lamp-proof-hash-1','magic',id,version,'/app',${now},${now+1200000},${now} FROM oa_operators;
      INSERT INTO oa_sessions(id,token_hash,operator_id,operator_version,kind,source_token_id,created_at,expires_at) SELECT 'synthetic-lamp-session-1','${hash}',id,version,'native','synthetic-lamp-proof-1',${now},${now+86400000} FROM oa_operators;
      INSERT INTO page_settings(id,page_name,tagline,accent_color,timezone,hostname,feed_id,mail_from_address,created_at,updated_at) VALUES('default','Synthetic Lamp sender','Mail sender proof','#16794C','UTC','localhost','synthetic-lamp-browser-1','lamp@example.test','2026-10-01','2026-10-01');
      INSERT INTO setup_readiness(step,evidence_key,checked_at) VALUES('first-run','complete','2026-10-01');`);
    browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox','--use-mock-keychain','--password-store=basic'] });
    const context = await browser.newContext();
    await context.addCookies([{ name: localCookieName('operator_session_local', origin), value: token, url: origin }]);
    const page = await context.newPage();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(origin + '/app/settings#notifications');
      await page.locator('.sender-status').waitFor();
      const text = await page.locator('.sender-status').innerText();
      if (width === 1440) assert.match(text, provider === 'rer' ? /managed by Run Edit Run/ : /MAIL_PROVIDER_API_KEY/);
      const name = `settings-${provider}-notifications-${width}.png`;
      await page.screenshot({ path: join(packet, name) });
      rows.push({ provider, width, screen: 'Settings notifications', senderText: text, file: name });
      if (provider === 'rer') {
        await page.goto(origin + '/app/settings#page');
        await page.getByText('What Lamp checked', { exact: true }).waitFor();
        await page.getByText(/Sender authentication is managed by Run Edit Run/).waitFor();
        if (width === 390) await page.getByText(/Sender authentication is managed by Run Edit Run/).scrollIntoViewIfNeeded();
        const file = `settings-rer-page-${width}.png`;
        await page.screenshot({ path: join(packet, file) });
        rows.push({ provider, width, screen: 'Settings page', file });
      }
    }
    await context.close();
  } finally { await browser?.close(); await runtime?.dispose(); await rm(state, { recursive: true, force: true }); }
}
await writeFile(join(packet, 'browser-receipt.json'), JSON.stringify({ date: new Date().toISOString(), productHead: execFileSync('git', ['rev-parse','HEAD'], {encoding:'utf8'}).trim(), proof: 'Built production Worker; synthetic local auth and mail configuration; all external edges denied; no mail sent', rows }, null, 2) + '\n');
console.log('Browser proof saved: ' + rows.length + ' screenshots; external mail submissions: 0');
