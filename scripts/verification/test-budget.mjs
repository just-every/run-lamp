import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assertionScripts, testInventory } from './inventory.mjs';

// Executable entry scripts that run outside the Node test runner count once each, beside assertionScripts.
const releaseEntryScripts = ['tests/release/installation-journey.mjs', 'tests/release/verify.mjs'];

// One count per registered test case (parameterized registrations count every case, no folding) plus one per entry script.
export function countTests() {
  const registered = testInventory().reduce((total, entry) => total + entry.count, 0);
  const entryScripts = assertionScripts.length + releaseEntryScripts.length;
  return { registered, entryScripts, total: registered + entryScripts };
}

export function checkTestBudget() {
  const { cap, reason } = JSON.parse(readFileSync('test-budget.json', 'utf8'));
  if (!Number.isInteger(cap) || cap < 1 || typeof reason !== 'string' || !reason.trim()) throw Error('test-budget.json needs an integer cap and a written reason.');
  const count = countTests();
  console.log(`Test budget: ${count.registered} registered cases + ${count.entryScripts} entry scripts = ${count.total} of ${cap}.`);
  if (count.total > cap) throw Error(`Lamp has ${count.total} counted tests, over its cap of ${cap}. Delete tests, or raise the cap in test-budget.json with a written reason.`);
  return count;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) checkTestBudget();
