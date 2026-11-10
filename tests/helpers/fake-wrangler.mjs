// A stand-in for node_modules/wrangler/bin/wrangler.js, installed by a test in the working directory it runs
// scripts/setup.mjs from. It keeps one D1's migration ledger in LAMP_FAKE_WRANGLER_STATE and applies at most
// LAMP_FAKE_WRANGLER_LIMIT of the migrations in the config's migrations_dir while exiting 0, which is how the
// first real deploy left 0061-0078 unapplied. Every other `d1 execute` is recorded in the state and succeeds.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const [group, command, ...rest] = process.argv.slice(2);
const stateFile = process.env.LAMP_FAKE_WRANGLER_STATE;
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : { applied: [], executed: [] };
const save = () => writeFileSync(stateFile, JSON.stringify(state));
const option = name => rest[rest.indexOf(name) + 1];

if (group === 'd1' && command === 'migrations' && rest[0] === 'apply') {
  const config = readFileSync(option('--config'), 'utf8');
  const directory = /^migrations_dir\s*=\s*"([^"]+)"/m.exec(config)[1];
  const pending = readdirSync(directory).filter(name => name.endsWith('.sql')).sort().filter(name => !state.applied.includes(name));
  const limit = Number(process.env.LAMP_FAKE_WRANGLER_LIMIT ?? Infinity);
  state.applied.push(...pending.slice(0, limit));
  save();
  console.log(`Migrations applied: ${Math.min(limit, pending.length)}`);
} else if (group === 'd1' && command === 'execute') {
  const sql = option('--command');
  if (/FROM d1_migrations/.test(sql)) console.log(JSON.stringify([{ results: state.applied.map(name => ({ name })), success: true, meta: {} }]));
  else { state.executed.push(sql); save(); console.log(JSON.stringify([{ results: [], success: true, meta: {} }])); }
} else {
  console.error(`fake wrangler: unhandled ${process.argv.slice(2).join(' ')}`);
  process.exit(2);
}
