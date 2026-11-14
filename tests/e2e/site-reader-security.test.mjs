import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('site reading bounds hostile icon prefixes and preserves supported image detection', () => {
  // A separate process enforces the deadline even if synchronous parsing stalls.
  const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { readSite } from './src/core/platform/site-reader/index.ts';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#0f7b6c"/></svg>';
    const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,16]);
    const cases = [
      ['<!--a-->'.repeat(200) + 'x', null],
      ['<!--a-->'.repeat(200) + '<!--unfinished', null],
      ['<?xml version="1.0"?>\\n<!--one--><!--two-->\\n<!DOCTYPE svg>\\n' + svg, 'image/svg+xml'],
      ['<!--a-->'.repeat(200) + svg, 'image/svg+xml'],
      ['<!--unfinished', null],
      ['<?xml unfinished', null],
      ['<!DOCTYPE svg unfinished', null],
      ['<svgish>', null],
      [png, 'image/png'],
    ];
    for (const [icon, expected] of cases) {
      const read = await readSite('https://synthetic-lamp.example.com', {
        resolve: async () => ['8.8.8.8'],
        fetch: async input => new URL(input).pathname === '/'
          ? new Response('<title>Synthetic Lamp</title><link rel="icon" href="/icon">', { headers: { 'Content-Type': 'text/html' } })
          : new Response(icon, { headers: { 'Content-Type': 'application/octet-stream' } }),
      });
      assert.equal(read.ok, true);
      assert.equal(read.site.icon?.contentType ?? null, expected);
      if (expected === 'image/svg+xml') assert.equal(read.site.accent, '#0f7b6c');
      if (expected === 'image/png') assert.deepEqual([read.site.icon.width, read.site.icon.height], [32, 16]);
    }
  `], { encoding: 'utf8', timeout: 3000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
