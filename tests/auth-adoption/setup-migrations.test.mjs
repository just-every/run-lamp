import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { cloudflareEdge } from '../helpers/cloudflare-edge.mjs';

// scripts/setup.mjs, run as `pnpm setup:cloudflare` runs it, against the fake Cloudflare edge and a stand-in
// wrangler (../helpers/fake-wrangler.mjs). Only Cloudflare and wrangler are substituted; the migration list is
// this checkout's own migrations/core.
const root = process.cwd();
const shipped = (await readdir(join(root, 'migrations/core'))).filter(name => name.endsWith('.sql')).sort();

async function setup(directory, edge, credentials, limit) {
  const hex = () => randomBytes(32).toString('hex');
  const environment = {
    ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(CLOUDFLARE_|MAIL_|LAMP_|NODE_OPTIONS$)/.test(name))), ...credentials,
    LAMP_APP_HOST: 'app.example.test', LAMP_PAGE_HOST: 'page.example.test', LAMP_PAGE_NAME: 'Synthetic setup', LAMP_PAGE_TAGLINE: 'Setup migrations', LAMP_PAGE_TIMEZONE: 'UTC', LAMP_ACCENT_COLOR: '#16794C',
    SETUP_OPERATOR_EMAIL: 'owner@example.test', MAIL_PROVIDER: 'rer', MAIL_FROM: 'lamp@example.test', MAIL_API_KEY: `synthetic-${hex()}`, MAIL_RELAY_URL: 'https://relay.example.test/api/managed-mail/send',
    SESSION_SECRET: hex(), SUBSCRIBER_TOKEN_SECRET: hex(), WEBHOOK_SIGNING_SECRET: hex(), SETUP_TOKEN: hex(), INSTALLATION_KEY: hex(),
    NODE_OPTIONS: `--import=${new URL('../helpers/cloudflare-edge-preload.mjs', import.meta.url).href}`, LAMP_FAKE_EDGE: edge.origin, LAMP_FAKE_EDGE_HOSTS: 'api.cloudflare.com',
    LAMP_FAKE_WRANGLER_STATE: join(directory, 'ledger.json'),
  };
  if (limit !== undefined) environment.LAMP_FAKE_WRANGLER_LIMIT = String(limit);
  const child = spawn(process.execPath, [join(root, 'scripts/setup.mjs'), '--environment', 'setup-migrations'], { cwd: directory, timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'], env: environment });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const code = await new Promise(resolve => child.once('close', resolve));
  const ledger = JSON.parse(await readFile(join(directory, 'ledger.json'), 'utf8'));
  return { code, output, ledger };
}

test('Setup fails naming the missing migrations when the apply comes up short, then a rerun completes them', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'lamp-setup-migrations-'));
  const credentials = { CLOUDFLARE_ACCOUNT_ID: randomBytes(16).toString('hex'), CLOUDFLARE_API_TOKEN: `synthetic-${randomBytes(16).toString('hex')}` };
  const edge = await cloudflareEdge({ accountId: credentials.CLOUDFLARE_ACCOUNT_ID, token: credentials.CLOUDFLARE_API_TOKEN, subdomain: 'synthetic-owner', workerHost: { host: 'app.example.test', name: 'lamp-setup-migrations' }, app: () => new Response('Lamp') });
  try {
    await mkdir(join(directory, 'node_modules/wrangler/bin'), { recursive: true });
    await cp(new URL('../helpers/fake-wrangler.mjs', import.meta.url), join(directory, 'node_modules/wrangler/bin/wrangler.js'));
    await symlink(join(root, 'migrations'), join(directory, 'migrations'));
    const cut = shipped.findIndex(name => name.startsWith('0061_'));
    assert.ok(cut > 0, 'the shipped list still holds 0061');

    const short = await setup(directory, edge, credentials, cut);
    assert.notEqual(short.code, 0, short.output);
    assert.doesNotMatch(short.output, /migrations and page settings are initialized/);
    assert.match(short.output, new RegExp(`${cut} of ${shipped.length} migrations are applied`));
    assert.match(short.output, new RegExp(`\\(0061-${shipped.at(-1).slice(0, 4)}\\)`));
    for (const name of shipped.slice(cut)) assert.ok(short.output.includes(name), `names ${name}`);
    assert.equal(short.ledger.applied.length, cut);
    assert.deepEqual(short.ledger.executed, [], 'page settings are not written onto a half-migrated database');
    t.diagnostic(`PROBE: apply short -> setup fails naming the unapplied range (exit ${short.code})`);

    const complete = await setup(directory, edge, credentials);
    assert.equal(complete.code, 0, complete.output);
    assert.match(complete.output, /Provisioned lamp-setup-migrations; migrations and page settings are initialized\./);
    assert.deepEqual(complete.ledger.applied, shipped);
    assert.equal(complete.ledger.executed.length, 1, 'page settings are written once the list is complete');
    t.diagnostic(`PROBE: complete apply -> success message unchanged (exit ${complete.code})`);
  } finally {
    await edge.close();
    await rm(directory, { recursive: true, force: true });
  }
});
