import assert from 'node:assert/strict';
import { sorryTemplateFixture } from './sorry-template-fixture.mjs';

const { pageId, files } = sorryTemplateFixture();
const seen = new Set();
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  assert.equal(url.origin, 'https://api.sorryapp.com', 'authenticated capture uses the fixed provider origin');
  assert.equal(init?.method, 'GET', 'capture performs only reads');
  assert.equal(init?.redirect, 'manual', 'capture refuses credential redirects');
  assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer synthetic-lamp-capture-only', 'only the explicitly supplied synthetic credential reaches the provider edge');
  const suffix = url.pathname.slice(`/v1/pages/${pageId}`.length);
  assert.ok(url.pathname.startsWith(`/v1/pages/${pageId}`));
  let name;
  if (!suffix) name = 'sorry-page.json';
  else if (suffix === '/components') { assert.equal(url.search, ''); name = 'sorry-components.json'; }
  else if (suffix === '/notices') { assert.equal(url.searchParams.get('include'), 'components,updates'); name = 'sorry-notices.json'; }
  else if (suffix === '/subscribers') { assert.equal(url.searchParams.get('per_page'), '500'); name = 'sorry-subscribers.json'; }
  else {
    assert.ok(['/notice_templates', '/update_templates'].includes(suffix), 'capture reads only documented resources');
    const page = url.searchParams.get('page');
    assert.ok(['1', '2'].includes(page));
    assert.equal(url.searchParams.get('per_page'), '25', 'template collections cross the documented page boundary');
    name = `sorry-${suffix.slice(1).replaceAll('_', '-')}${page === '1' ? '' : '-2'}.json`;
  }
  assert.equal(seen.has(name), false, 'every original response is captured once');
  seen.add(name);
  const file = files.find(row => row.name === name);
  assert.ok(file, 'every request has an explicit original synthetic response');
  return new Response(file.text, { headers: { 'Content-Type': 'application/json' } });
};
