import assert from 'node:assert/strict';

const PUBLIC_APP_PATHS = ['/', '/docs', '/docs/moving-in', '/docs/accessibility/vpat'];
const navigate = { 'Sec-Fetch-Mode': 'navigate' };

/** SUB-024 on the app host: while the page has not launched, the Lobby and the docs ask search engines to stay away
 * and the app host's robots.txt disallows everything; clearing the setting gives back today's answers exactly.
 * `request(path, host, init)` and `appRequest(path, init)` are the built Worker's real doors (appRequest signs in). */
export async function appHostPrelaunchProof({ request, appRequest, appHost }) {
  const snapshot = async () => {
    const answers = {};
    for (const path of [...PUBLIC_APP_PATHS, '/robots.txt']) {
      const response = await request(path, appHost, { headers: navigate });
      const headers = Object.fromEntries([...response.headers].filter(([name]) => !['date', 'etag', 'content-length'].includes(name)));
      answers[path] = { status: response.status, headers, body: await response.text() };
    }
    return answers;
  };
  const setPrelaunch = async enabled => {
    const response = await appRequest('/api/app/prelaunch', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) });
    assert.equal(response.status, 200, await response.text());
  };
  const open = await snapshot();
  // Server-rendered documents may carry per-request markup: those are compared by status and headers only.
  const again = await snapshot();
  const stable = Object.keys(open).filter(path => open[path].body === again[path].body);
  assert.ok(stable.includes('/') && stable.includes('/robots.txt'), 'the Lobby and robots.txt answer the same bytes every time');
  for (const path of PUBLIC_APP_PATHS) assert.equal(open[path].status, 200, `${path} is public on the app host`);
  assert.equal(open['/robots.txt'].status, 404, 'an app host that is not pre-launch has no robots.txt of its own');
  await setPrelaunch(true);
  try {
    const closed = await snapshot();
    for (const path of PUBLIC_APP_PATHS) {
      assert.equal(closed[path].status, 200, `${path} still answers while pre-launch`);
      assert.equal(closed[path].headers['x-robots-tag'], 'noindex, nofollow', `${path} asks search engines to stay away`);
    }
    assert.equal(closed['/robots.txt'].status, 200);
    assert.equal(closed['/robots.txt'].body, 'User-agent: *\nDisallow: /\n');
    assert.equal(closed['/robots.txt'].headers['x-robots-tag'], 'noindex, nofollow');
  } finally {
    await setPrelaunch(false);
  }
  const cleared = await snapshot();
  for (const path of Object.keys(open)) {
    assert.equal(cleared[path].status, open[path].status, `${path} status is back`);
    assert.deepEqual(cleared[path].headers, open[path].headers, `${path} headers are back`);
    if (stable.includes(path)) assert.ok(cleared[path].body === open[path].body, `${path} body is back byte for byte`);
  }
}
