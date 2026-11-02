// Loaded only by the isolated CLI journey. No DNS or provider request escapes.
import dns from 'node:dns';
import childProcess from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import {appendFileSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {resolve} from 'node:path';

const record = event => appendFileSync(process.env.LAMP_DNS_TRACE, JSON.stringify(event) + '\n');
const domain = 'synthetic-lamp.test';
const dkimHost = `synthetic-lamp-1._domainkey.${domain}`;
const dmarcHost = `_dmarc.${domain}`;
const absent = host => Object.assign(new Error(`No synthetic record at ${host}`), {code:'ENODATA'});
for (const name of Object.keys(dns.promises).filter(name => /^(resolve|lookup)/.test(name))) {
  dns.promises[name] = async host => {
    record({kind:'dns', operation:name, host});
    if (name !== 'resolveTxt') throw absent(host);
    if (host === dkimHost && process.env.LAMP_DNS_CASE !== 'missing-dkim') {
      // Split TXT chunks exercise DNS's real record representation.
      return [['v=DKIM1; k=rsa; ', 'p=c3ludGhldGljLWxhbXAtMQ==']];
    }
    if (host === dmarcHost && process.env.LAMP_DNS_CASE !== 'missing-dmarc') {
      return [['v=DMARC1; p=reject']];
    }
    throw absent(host);
  };
}
const blocked = operation => (..._args) => {
  record({kind:'blocked-effect', operation});
  throw new Error(`Synthetic CLI refuses ${operation}`);
};
for (const name of Object.keys(dns).filter(name => /^(resolve|lookup)/.test(name))) dns[name] = blocked(`dns.${name}`);
for (const [module, names] of [[http,['request','get']], [https,['request','get']], [net,['connect','createConnection']], [tls,['connect']]]) {
  for (const name of names) module[name] = blocked(name);
}
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  record({kind:'provider-sentinel', host:url.hostname, path:url.pathname, method:init.method ?? 'GET'});
  process.stderr.write('synthetic-lamp-post-dns-sentinel\n');
  // Stop before even a provider read is sent, without its transport retry loop.
  process.exit(86);
};
const spawnSync = childProcess.spawnSync;
childProcess.spawnSync = (command, args, options = {}) => {
  if (command === 'pnpm' && JSON.stringify(args.slice(0, 4)) === JSON.stringify(['run','setup:cloudflare','--','--environment'])) {
    record({kind:'setup-process', environment:args[4]});
    return spawnSync(process.execPath, ['--import', import.meta.url, resolve('scripts/setup.mjs'), ...args.slice(3)], options);
  }
  return blocked(`process ${command}`)();
};
for (const name of ['spawn','exec','execSync','execFile','execFileSync','fork']) childProcess[name] = blocked(name);
syncBuiltinESMExports();
