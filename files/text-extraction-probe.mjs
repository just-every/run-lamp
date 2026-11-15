import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const { visibleText, wording } = await import(pathToFileURL(resolve(process.argv[2], 'tests/e2e/helpers/status-journey.mjs')));
const cases = [
  ['linked prose', '<p>Read <a href="https://example.test">the guide</a> now.</p>', 'Read the guide now.'],
  ['quoted greater-than', '<p title="a > b">Visible</p>', 'Visible'],
  ['literal escaped markup', '&lt;script&gt;literal&lt;/script&gt;', '<script>literal</script>'],
  ['numeric references', '&#60;&#x3e;&#34;&#39;&apos;&amp;', '<>"\'\'&'],
  ['single-pass decoding', '&amp;lt;img&amp;gt; &amp;amp;', '&lt;img&gt; &amp;'],
  ['comment boundaries', 'first<!-- > hidden -->last', 'firstlast'],
  ['malformed tag boundary', 'first<em title="x > y">last', 'firstlast'],
  ['nested tag-shaped input', 'first<<span>middle</span>>last', 'first<middle>last'],
  ['Atom readiness', '<?xml version="1.0"?><feed><entry><content type="html">&lt;p&gt;Customer message&lt;/p&gt;</content></entry></feed>', '<p>Customer message</p>'],
  ['RSS readiness', '<?xml version="1.0"?><rss><channel><item><description>Customer message</description></item></channel></rss>', 'Customer message'],
];
for (const [name, input, expected] of cases) {
  assert.equal(visibleText(input), expected, name);
  console.log(`PASS ${name}`);
}
const widget = `(()=>{const impact=${JSON.stringify(wording.customerImpact)};console.log(impact)})();`;
assert.ok(visibleText(widget).includes(wording.customerImpact), 'existing widget readiness preserves current customer wording');
console.log('PASS widget readiness control');
console.log(`PASS ${cases.length + 1} extraction cases; this helper returns text only and is never an HTML sanitizer`);
const { execFileSync } = await import('node:child_process');
const { runInNewContext } = await import('node:vm');
const original = execFileSync('git', ['show', 'origin/main:tests/e2e/helpers/status-journey.mjs'], { cwd: process.argv[2], encoding: 'utf8' });
const start = original.indexOf('export function visibleText');
const end = original.indexOf('\n}', start) + 2;
const old = runInNewContext(`(${original.slice(start, end).replace('export ', '')})`);
const differences = cases.filter(([,input,expected]) => old(input) !== expected).map(([name]) => name);
assert.ok(differences.includes('quoted greater-than'));
assert.ok(differences.includes('numeric references'));
assert.ok(differences.includes('comment boundaries'));
console.log(`Original helper fails ${differences.length} controls: ${differences.join(', ')}`);
console.log('PASS original failures corrected by parser-based extraction');
