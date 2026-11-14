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

test('status feed reads remove tags reassembled by stripping while preserving message text', async () => {
  const { readStatusFeeds } = await import('../../src/core/platform/status-feeds/index.ts');
  const cases = [
    ['<scr<script>ipt>Service restored</scr<script>ipt>', 'Service restored'],
    ['<a<a<a> >>Service restored</a</a</a> >>', 'Service restored'],
    ['<p>Service  restored<br />Next &amp; ready</p><p>All systems normal</p>', 'Service restored\nNext & ready\n\nAll systems normal'],
    ['<b>Use &lt;region&gt; &amp; retry</b>', 'Use <region> & retry'],
    ['<b title="latency < 1s">Service restored</b>', 'Service restored'],
    ["<b title='2 > 1'>Service restored</b>", 'Service restored'],
  ];
  for (const [message, expected] of cases) {
    const responses = {
      '/summary.json': JSON.stringify({ page: { name: 'Synthetic Lamp', url: 'https://synthetic-lamp.example.com' } }),
      '/v2/components.json': JSON.stringify({ components: [] }),
      '/history.atom': `<feed><entry><id>Incident/synthetic-lamp-1</id><title>Recovered</title>
        <published>2026-01-01T12:00:00Z</published><updated>2026-01-01T12:00:00Z</updated>
        <content><![CDATA[<p><strong>Type:</strong> Incident</p>
        <p><small>Jan 1, 12:00:00 GMT+0</small><br /><strong>Resolved</strong> - ${message}.</p>]]></content>
        </entry></feed>`,
    };
    const read = await readStatusFeeds('https://synthetic-lamp.example.com', 'instatus', {
      resolve: async () => ['8.8.8.8'],
      fetch: async input => new Response(responses[new URL(input).pathname]),
    });
    assert.ok(read);
    assert.equal(read.page.incidents.length, 1);
    assert.equal(read.page.incidents[0].updates[0].body, `${expected}.`);
  }
});
