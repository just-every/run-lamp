import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {cp, copyFile, mkdir, mkdtemp, readFile, readdir, rm, symlink} from 'node:fs/promises';
import {join, resolve} from 'node:path';

export async function mailDnsCliFlow() {
  const temporary = await mkdtemp(resolve('.lamp-mail-dns-'));
  const edge = new URL('./mail-dns-cli-edge.mjs', import.meta.url).href;
  const domain = 'synthetic-lamp.test';
  const dkimHost = `synthetic-lamp-1._domainkey.${domain}`;
  const dmarcHost = `_dmarc.${domain}`;
  try {
    // Execute unchanged CLI source in a disposable installation, with no inherited
    // credentials, generated deployment files, provider account or private state.
    await cp('scripts', join(temporary, 'scripts'), {recursive:true});
    for (const name of ['OPERATIONS.json','OPERATIONS.md','ACCEPTANCE.md','package.json']) await copyFile(name, join(temporary, name));
    await symlink(resolve('node_modules'), join(temporary, 'node_modules'), 'dir');
    await mkdir(join(temporary, 'home'));
    const initial = (await readdir(temporary)).sort();
    const env = {
      PATH:process.env.PATH, HOME:join(temporary, 'home'),
      CLOUDFLARE_ACCOUNT_ID:'1'.repeat(32), CLOUDFLARE_API_TOKEN:'synthetic-lamp-1',
      LAMP_PAGE_HOST:`status.${domain}`, LAMP_APP_HOST:`app.${domain}`,
      LAMP_PAGE_NAME:'Synthetic Lamp', LAMP_PAGE_TAGLINE:'Synthetic service status',
      LAMP_PAGE_TIMEZONE:'UTC', LAMP_ACCENT_COLOR:'#163C60',
      SETUP_OPERATOR_EMAIL:['synthetic-lamp-owner',domain].join('@'),
      MAIL_FROM_ADDRESS:['synthetic-lamp-notifications',domain].join('@'),
      MAIL_PROVIDER:'sendgrid', MAIL_DKIM_SELECTOR:'synthetic-lamp-1',
      MAIL_PROVIDER_API_KEY:'synthetic-lamp-2'.repeat(3),
      SESSION_SECRET:'synthetic-lamp-3'.repeat(3), SETUP_TOKEN:'synthetic-lamp-4'.repeat(3),
      SUBSCRIBER_TOKEN_SECRET:'synthetic-lamp-5'.repeat(3), WEBHOOK_SIGNING_SECRET:'synthetic-lamp-6'.repeat(3),
    };
    for (const door of ['setup','deploy']) {
      for (const scenario of ['missing-dkim','missing-dmarc','aligned-without-spf']) {
        const trace = join(temporary, `${door}-${scenario}.jsonl`);
        const result = spawnSync(process.execPath, ['--import', edge, `scripts/${door}.mjs`, '--environment', 'synthetic-lamp'], {
          cwd:temporary, env:{...env, LAMP_DNS_TRACE:trace, LAMP_DNS_CASE:scenario},
          encoding:'utf8', timeout:15000,
        });
        assert.ifError(result.error);
        const label = `${door} ${scenario}`;
        const events = (await readFile(trace, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
        const dnsRequests = events.filter(event => event.kind === 'dns');
        assert.deepEqual(dnsRequests, (scenario === 'missing-dkim' ? [dkimHost] : [dkimHost,dmarcHost]).map(host => ({kind:'dns', operation:'resolveTxt', host})), `${label}: only the configured DKIM and DMARC records, never From-domain SPF`);
        const setupProcesses = events.filter(event => event.kind === 'setup-process');
        assert.deepEqual(setupProcesses, door === 'deploy' ? [{kind:'setup-process', environment:'synthetic-lamp'}] : [], `${label}: deploy executes the actual setup CLI`);
        assert.deepEqual(events.filter(event => event.kind === 'blocked-effect'), [], `${label}: no build, upload or other process effect`);
        const provider = events.filter(event => event.kind === 'provider-sentinel');
        if (scenario === 'aligned-without-spf') {
          assert.equal(result.status, door === 'setup' ? 86 : 1, result.stderr);
          assert.match(result.stderr, /synthetic-lamp-post-dns-sentinel/, `${label}: DNS preflight permits progression`);
          assert.deepEqual(provider, [{kind:'provider-sentinel', host:'api.cloudflare.com', path:`/client/v4/accounts/${'1'.repeat(32)}/d1/database`, method:'GET'}], `${label}: reaches first resource read, intercepted before sending`);
          assert.equal(events.at(-1).kind, 'provider-sentinel', `${label}: progression follows DNS`);
        } else {
          assert.equal(result.status, 1, result.stderr);
          assert.match(result.stderr, new RegExp(scenario === 'missing-dkim' ? 'DKIM' : 'DMARC'), `${label}: names the record type`);
          assert.ok(result.stderr.includes(scenario === 'missing-dkim' ? dkimHost : dmarcHost), `${label}: names the exact missing hostname`);
          assert.doesNotMatch(result.stderr, /synthetic-lamp-post-dns-sentinel/);
          assert.deepEqual(provider, [], `${label}: refuses before any provider access`);
        }
        // A refusal or sentinel creates no Wrangler config, build, upload or
        // deployment ownership state in this isolated installation.
        assert.deepEqual((await readdir(temporary)).filter(name => !name.endsWith('.jsonl')).sort(), initial, `${label}: no generated deployment artifacts`);
      }
    }
  } finally {
    await rm(temporary, {recursive:true, force:true});
  }
}
