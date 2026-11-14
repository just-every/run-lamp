import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(resolve('package.json'));
const wrangler = createRequire(require.resolve('wrangler'));
const { Miniflare } = wrangler('miniflare');
const original = Miniflare.prototype.getD1Database;
Miniflare.prototype.getD1Database = async function (...args) {
  console.log('Worker D1: opening');
  const db = await original.apply(this,args);
  console.log('Worker D1: opened');
  return db;
};
const { smsSubscriberFlow } = await import(pathToFileURL(resolve('tests/e2e/helpers/sms-subscriber-flow.mjs')));
await smsSubscriberFlow();
console.log('smsSubscriberFlow passed');
