// Wrangler's network boundary for the setup-resume journey. Every SQL statement
// runs against the same real D1 that answers /health, through the fake Cloudflare
// HTTP edge. Only apply batching/failure is controlled; no application code is mocked.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(resolve(process.env.LAMP_FAKE_WRANGLER_ROOT, 'package.json'));
const { unstable_splitSqlQuery } = require('wrangler');
const [group, command, ...rest] = process.argv.slice(2);
const stateFile = process.env.LAMP_FAKE_WRANGLER_STATE;
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : { applied: [], executed: [], observations: [] };
const save = () => writeFileSync(stateFile, JSON.stringify(state));
const option = name => rest[rest.indexOf(name) + 1];
const config = readFileSync(option('--config'), 'utf8');
const database = /^database_id\s*=\s*"([^"]+)"/m.exec(config)[1];
const literal = value => `'${value.replaceAll("'", "''")}'`;
async function execute(sql) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${database}/query`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
    body: JSON.stringify({ batch: unstable_splitSqlQuery(sql).map(sql => ({ sql })) }),
  });
  const body = await response.json();
  if (!body.success) throw new Error(JSON.stringify(body.errors));
  return body.result;
}

if (group === 'd1' && command === 'migrations' && rest[0] === 'apply') {
  await execute('CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)');
  const [ledger] = await execute('SELECT name FROM d1_migrations ORDER BY name');
  const directory = /^migrations_dir\s*=\s*"([^"]+)"/m.exec(config)[1];
  const pending = readdirSync(directory).filter(name => name.endsWith('.sql')).sort().filter(name => !ledger.results.some(row => row.name === name));
  const limit = Number(process.env.LAMP_FAKE_WRANGLER_LIMIT ?? Infinity);
  for (const name of pending.slice(0, limit)) {
    // Wrangler commits the file and its applied marker together.
    await execute(readFileSync(resolve(directory, name), 'utf8') + `\n; INSERT INTO d1_migrations (name) VALUES (${literal(name)});`);
  }
  state.applied = (await execute('SELECT name FROM d1_migrations ORDER BY name'))[0].results.map(row => row.name);
  save();
  if (process.env.LAMP_FAKE_WRANGLER_INTERRUPT === 'true' && pending.length) {
    console.error('Synthetic interruption after committed migrations');
    process.exit(1);
  }
  console.log(`Migrations applied: ${Math.min(limit, pending.length)}`);
} else if (group === 'd1' && command === 'execute') {
  const sql = option('--command');
  const result = await execute(sql);
  if (/CREATE TABLE IF NOT EXISTS rer_migrations/.test(sql)) {
    state.observations.push((await execute('SELECT name,sha256 FROM rer_migrations ORDER BY name'))[0].results);
  } else if (!/FROM d1_migrations/.test(sql)) state.executed.push(sql);
  save();
  console.log(JSON.stringify(result));
} else {
  console.error(`fake wrangler: unhandled ${process.argv.slice(2).join(' ')}`);
  process.exit(2);
}
