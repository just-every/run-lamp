#!/usr/bin/env node
/** Unsigned documented-format synthetic proof only. No key or provider calls.
 * Run Edit Run fleet, 17 November 2026. */
import { spawn } from 'node:child_process';
import { lstat, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--out' || !args[1]) throw new Error('usage: node scripts/sorry-synthetic-proof.mjs --out NEW_DIRECTORY');
const output = resolve(args[1]);
try { await lstat(output); throw new Error('Output must be a new directory.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true, mode: 0o700 });
const child = spawn(process.execPath, ['--test', '--test-concurrency=1', 'tests/e2e/sorry-documented-export.test.mjs'], {
  stdio: 'inherit', env: { ...process.env, LAMP_SORRY_SYNTHETIC_PROOF: output, LAMP_SORRY_FULL_SCALE: '1' },
});
const code = await new Promise((resolveExit, reject) => { child.once('error', reject); child.once('exit', resolveExit); });
if (code !== 0) { process.exitCode = code ?? 1; }
else {
  const receipt = JSON.parse(await readFile(resolve(output, 'synthetic-receipt.json'), 'utf8'));
  if (receipt.synthetic !== true || receipt.signed !== false) throw new Error('Synthetic proof classification is missing.');
  console.log('Unsigned synthetic proof saved; generated data is not a real export. Revision: ' + receipt.revision);
}
