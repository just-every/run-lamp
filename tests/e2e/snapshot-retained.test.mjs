import { healthSchemaProof, schemaProbeClock } from "./helpers/health-schema-proof.mjs";
import { themeHeaderImage } from "./helpers/theme-fixture.mjs";
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { parse } from 'parse5';
import { addStatusPage, privateStatusUrl } from './helpers/audience-pages-flow.mjs';
import { openStatusJourney, eventually } from './helpers/status-journey.mjs';
import { Miniflare, retainedSnapshotOptions } from './helpers/retained-snapshot-runtime.mjs';

const descendants = node => [node, ...(node.childNodes ?? []).flatMap(descendants)];

test('Repeated public health probes read zero D1 rows from a warm isolate', async () => {
  const j = await openStatusJourney({ workerEntry: 'tests/e2e/helpers/clocked-status-journey.worker.ts', extraBindings: { LAMP_TEST_AUDIENCE_READS: 'true' } });
  try {
    await j.db.prepare("CREATE TABLE rer_migrations (name TEXT PRIMARY KEY, sha256 TEXT NOT NULL)").run();
    await j.db.prepare("INSERT INTO rer_migrations VALUES ('0001_fixture.sql', lower(hex(zeroblob(32))))").run();
    const advance = schemaProbeClock(j.raw);
    const read = async (origin, warm = false) => {
      const response = await j.raw(origin + '/health');
      assert.equal(response.status, 200, await response.clone().text());
      if (warm) assert.equal(response.headers.get('x-test-d1-reads'), '0', 'zero D1 calls bounds rows_read at zero');
      return (await response.json()).schemaObservation;
    };
    const first = await read(j.appOrigin);
    assert.equal(first.state, 'available');
    for (const origin of [j.appOrigin, j.publicOrigin, j.appOrigin]) {
      const now = await advance(1000);
      const latest = await read(origin, true);
      assert.deepEqual(latest, { ...first, ageMs: now - Date.parse(first.observedAt) });
      assert.ok(latest.ageMs > 0);
    }
    await j.db.prepare('DROP TABLE rer_migrations').run();
    await healthSchemaProof(j);
  } finally {
    await j.close();
  }
});

async function assertNativeGenerationRevalidation(j, component, incident, initialImpact) {
  const maintenanceTitle = 'Synthetic Lamp cache maintenance';
  const maintenanceImpact = 'Capacity maintenance briefly delayed customer requests.';
  const now = Date.now();
  const { maintenance } = await j.json('/api/app/maintenance', 'POST', {
    title: maintenanceTitle, affectedAudience: 'API customers', customerImpact: maintenanceImpact,
    startsAt: new Date(now + 3600_000).toISOString(), endsAt: new Date(now + 7200_000).toISOString(),
    componentIds: [component.id], autoStart: false, autoComplete: false,
  }, 201);
  const endpoint = `/api/app/maintenance/${maintenance.id}`;
  await j.json(`${endpoint}/start`, 'POST', {});
  await j.json(`${endpoint}/complete`, 'POST', {});
  const maintenancePath = `/maintenance/${maintenance.reference}`;
  await j.visible('/history', maintenanceTitle);

  const incidentPath = `/incidents/${incident.reference}`;
  const surfaces = new Map([
    ['/', impact => [incident.title, impact]],
    ['/history', () => [`href="${maintenancePath}"`, maintenanceTitle, maintenanceImpact]],
    [incidentPath, impact => [incident.title, impact]],
    [maintenancePath, () => [maintenanceTitle, maintenanceImpact]],
    ['/feed.atom', impact => [incident.title, incidentPath, impact]],
    ['/widget.js', impact => [incident.title, incident.reference, impact]],
    ['/api/public/status', () => []],
  ]);
  const bucket = await j.runtime.getR2Bucket('SNAPSHOTS');
  const currentPointer = async () => (await bucket.get('snapshots/current.json'))?.json();
  const read = (path, etag) => etag === undefined
    ? j.publicResponse(path)
    : j.raw(new URL(path, j.publicOrigin).href, { headers: { 'If-None-Match': etag } });

  const checkGeneration = (response, generation, label) => {
    assert.equal(response.headers.get('x-lamp-snapshot-state'), null, label);
    assert.equal(response.headers.get('x-lamp-snapshot-version'), generation.version, label);
    assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), generation.generatedAt, label);
  };
  const checkContent = async (response, path, impact, generation, label) => {
    assert.equal(response.status, 200, label);
    checkGeneration(response, generation, label);
    const body = await response.text();
    for (const expected of surfaces.get(path)(impact)) assert.ok(body.includes(expected), `${label} contains ${expected}`);
    if (path === '/api/public/status') {
      const status = JSON.parse(body);
      assert.equal(status.generatedAt, generation.generatedAt, label);
      assert.equal(status.incident?.reference, incident.reference, label);
      assert.equal(status.incident?.title, incident.title, label);
      assert.equal(status.incident?.summary, `Identified · ${impact}`, label);
    }
    const etag = response.headers.get('etag');
    assert.ok(etag, `${label} supplies a validator`);
    return etag;
  };
  const checkReuse = async (path, etag, generation) => {
    const response = await read(path, etag);
    assert.equal(response.status, 304, `${path} reuses the current validator`);
    checkGeneration(response, generation, path);
    assert.equal(response.headers.get('etag'), etag, path);
    assert.equal((await response.arrayBuffer()).byteLength, 0, path);
  };

  const initial = await currentPointer();
  assert.ok(initial?.version && initial.generatedAt, 'the native publication has a current generation');
  const validators = new Map();
  for (const path of surfaces.keys()) {
    validators.set(path, await checkContent(await read(path), path, initialImpact, initial, `warm ${path}`));
    await checkReuse(path, validators.get(path), initial);
  }

  const updatedImpact = 'The API is recovering and queued requests are clearing.';
  await j.save(incident.id, { customerImpact: updatedImpact });
  await j.publish(incident.id);
  const current = await eventually(currentPointer, pointer => pointer?.version && pointer.version !== initial.version, 'native incident publication advances the current generation');
  for (const [path, oldValidator] of validators) {
    const etag = await checkContent(await read(path, oldValidator), path, updatedImpact, current, `superseded validator on ${path}`);
    assert.notEqual(etag, oldValidator, `${path} supplies a new validator`);
    await checkReuse(path, etag, current);
  }
  console.info('PROBE PAGE-007 1: seven warmed public addresses after native publication -> superseded validators return 200 with current generation and expected content, current validators return empty 304');
}

test('AUD-001 THEME-001 PAGE-005 PAGE-006 PAGE-007 PAGE-018 — a published status survives storage, database and queue failures, cold restart and an independent heartbeat silence alarm', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lamp-resilience-'));
  let runtime, j, monitor, alarmTimer;
  let receipt = null, alarm = false, pings = 0;
  try {
    monitor = createServer((request, response) => {
      assert.equal(request.method, 'GET'); assert.equal(request.url, '/ping');
      receipt = Date.now(); pings++; alarm = false; clearTimeout(alarmTimer);
      alarmTimer = setTimeout(() => { alarm = true; }, 750);
      response.end('ok');
    });
    await new Promise(resolve => monitor.listen(0, '127.0.0.1', resolve));
    const edge = async request => {
      if (request.url === 'https://heartbeat.example.test/ping') {
        assert.equal(request.method, 'GET'); assert.equal(await request.text(), '', 'the monitor receives no product data');
        return fetch(`http://127.0.0.1:${monitor.address().port}/ping`);
      }
    };
    j = await openStatusJourney({ providerEdge: edge }); await j.tick(Date.now());
    assert.equal(pings, 0, 'an unconfigured installation sends no heartbeat');
    await j.close(); j = await openStatusJourney({ providerEdge: edge, extraBindings: { LAMP_TEST_AUDIENCE_READS: 'true', LAMP_HEARTBEAT_URL: 'https://heartbeat.example.test/ping', LAMP_HEARTBEAT_INTERVAL_MINUTES: '1' } });
    const component = await j.component('Customer API during dependency outage');
    const incident = await j.incident('Known API degradation', [component]);
    const initialImpact = 'Customer API requests are failing intermittently.';
    await j.save(incident.id, { customerImpact: initialImpact });
    await j.publish(incident.id); await j.visible('/', incident.title);
    await assertNativeGenerationRevalidation(j, component, incident, initialImpact);
    const staff = await addStatusPage(j, {
      path: 'operator-status', kind: 'staff', pageName: 'Operator status',
      tagline: 'Retained-public isolation control', accentColor: '#6b4a9f',
      timezone: 'UTC', componentIds: [component.id],
    });
    const protectedIncident = await j.incident('Private operational assessment', [component]);
    const protectedImpact = 'Only operators need the resilience assessment wording.';
    await j.save(protectedIncident.id, { customerImpact: protectedImpact });
    const { update: protectedUpdate } = await j.publish(protectedIncident.id, { pagePaths: [staff.path] });
    await eventually(async () => {
      const response = await j.request(privateStatusUrl(staff, '/feed.atom'));
      return await response.text();
    }, body => body.includes(protectedUpdate.id), 'present Staff publication in its own retained generation');

    for (const path of ['/', '/feed.atom', '/feed.rss', '/widget.js', '/badge.svg', '/badge.json', '/api/public/status']) {
      const healthy = await j.publicResponse(path);
      const healthyBody = await healthy.text();
      const retained = await j.raw(new URL(path, j.publicOrigin).href, { headers: { 'X-Test-D1-Unavailable': '1' } });
      assert.equal(retained.status, 200, path);
      assert.equal(retained.headers.get('x-test-d1-reads'), '0', path);
      assert.equal(retained.headers.get('x-lamp-snapshot-version'), healthy.headers.get('x-lamp-snapshot-version'), path);
      const retainedBody = await retained.text();
      assert.equal(retainedBody, healthyBody, path);
      for (const marker of [protectedIncident.title, protectedImpact, protectedUpdate.id]) assert.ok(!retainedBody.includes(marker), path);
      if (['/', '/feed.atom', '/feed.rss', '/widget.js', '/api/public/status'].includes(path)) assert.ok(retainedBody.includes(incident.title), path);
      else assert.ok(retainedBody.includes('Down'), path);
    }
    console.info('PROBE AUD-001 5: unauthenticated public Worker reads with D1 unavailable -> previous populated public generation and no Staff publication');
    await j.tick(Date.now()); assert.ok(pings > 0 && receipt);
    await j.raw('/test/effects', { method: 'PUT', body: JSON.stringify({ paused: true }) });
    const beforePause = pings; await j.tick(Date.now()); assert.equal(pings, beforePause, 'a transferring host stops external effects');
    await j.raw('/test/effects', { method: 'PUT', body: JSON.stringify({ paused: false }) });
    const expected = new Map();
    for (const path of ['/', '/feed.atom', '/widget.js', '/badge.json']) expected.set(path, await j.publicText(path));
    await j.raw('/test/queue', { method: 'PUT', body: JSON.stringify({ outage: true }) });
    const beforeOutage = pings;
    await (await j.runtime.getWorker()).scheduled({ cron: '* * * * *', scheduledTime: Date.now() });
    assert.equal(pings, beforeOutage, 'a running Cron cannot certify a failed Queue dependency');
    assert.equal((await j.request('/health')).status, 503);
    for (const [path, body] of expected) assert.equal(await j.publicText(path), body, `${path} retains its published state`);
    await eventually(() => alarm, Boolean, 'the separate monitor reports missed receipts');
    await j.raw('/test/queue', { method: 'PUT', body: JSON.stringify({ outage: false }) });
    await j.tick(Date.now()); assert.ok(pings > beforeOutage); assert.equal((await j.request('/health')).status, 200);
    await j.close(); j = null;

    // Real public routes, R2 and durable replica. Its repository throws on every
    // read; only the provider edges are replaced to inject failure.
    const options = await retainedSnapshotOptions({
      name: 'lamp-retained-journey',
      resourcePersistencePath: join(directory, 'storage'),
    });
    runtime = new Miniflare(options);
    const read = (path, init) => runtime.dispatchFetch(`https://page.example${path}`, init);
    const bucket = await runtime.getR2Bucket('SNAPSHOTS');
    const firstPublicationPaths = new Map([
      ['/', /^text\/html\b/],
      ['/feed.atom', /^application\/atom\+xml\b/],
      ['/widget.js', /^application\/javascript\b/],
    ]);
    const cacheQuery = new URLSearchParams();
    for (const path of firstPublicationPaths.keys()) cacheQuery.append('path', path);
    const emptyCache = { replicaGeneration: null, cachedPaths: [] };
    const snapshotCache = async () => {
      const response = await read(`/test/snapshot-cache?${cacheQuery}`);
      assert.equal(response.status, 200);
      return response.json();
    };
    assert.deepEqual((await bucket.list()).objects, [], 'object storage starts empty');
    assert.deepEqual(await snapshotCache(), emptyCache, 'the replica and edge cache start empty');
    for (const path of firstPublicationPaths.keys()) {
      const response = await read(path);
      assert.equal(response.status, 503, `${path} is unavailable before the first publication`);
      assert.equal(response.headers.get('x-lamp-snapshot-version'), null, path);
      assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), null, path);
      assert.ok((await response.text()).includes('snapshot is unavailable'), path);
    }
    assert.equal((await read('/?storage=down')).status, 503, 'a fresh installation never invents an all-clear');
    assert.deepEqual(await snapshotCache(), emptyCache, 'unavailable responses do not seed a fallback');
    assert.deepEqual((await bucket.list({ prefix: 'snapshots/' })).objects, [], 'public reads do not publish a snapshot');
    console.info('FIRST SNAPSHOT GET / /feed.atom /widget.js → 503; no snapshot or cached status');

    const publishedAt = new Date().toISOString();
    const source = {
      settings: { pageName: 'Known service status <synthetic-lamp> & $&', tagline: 'Current customer facts', accentColor: '#16794C', timezone: 'America/Los_Angeles', hostname: 'page.example', footerCreditEnabled: false, logoKey: null, logoContentType: null, widgetAllowedOrigins: '[]', feedId: 'synthetic-lamp-resilience' },
      components: [{ id: 'customer-api', name: 'Customer API', groupName: null, groupOrder: null, displayOrder: 0, note: '' }],
      claims: [{ componentId: 'customer-api', state: 'Major outage' }], history: [], corrections: [],
      incidents: [{ id: 'incident', reference: 'INC-1', title: 'Known API outage', lifecycle: 'Identified', openedAt: publishedAt, resolvedAt: null }],
      incidentComponents: [{ incidentId: 'incident', componentId: 'customer-api', componentName: 'Customer API', state: 'Major outage', relationship: 'Primary', publishedAt }],
      updates: [{ id: 'outage-update', incidentId: 'incident', lifecycle: 'Identified', affectedAudience: 'API customers', customerImpact: 'Major outage affects customer requests.', whatStillWorks: 'Status information remains available.', details: 'The operator is restoring service.', nextUpdateAt: new Date(Date.parse(publishedAt) + 3600000).toISOString(), publishedAt }],
      maintenance: [], maintenanceComponents: [], reports: [], maintenanceNotices: [],
    };
    // Repeated component resources make the full footer travel through the
    // retained representation as well as each ordinary stored document.
    for (let number = 2; number <= 6; number++) source.components.push({ id: `synthetic-lamp-retained-${number}`, name: `Synthetic retained service ${number}`, groupName: null, groupOrder: null, displayOrder: number, note: "" });
    // Seed populated, nonconsecutive archive months before the real rebuild.
    // Public reads below use a repository that throws on any access.
    const archived = [
      ['oldest', '2020-01-01T00:30:00.000Z', '2019-12', 'incident'],
      ['spring', '2020-04-01T07:01:00.000Z', '2020-04', 'incident'],
      ['latest', '2025-04-20T12:00:00.000Z', '2025-04', 'incident'],
      ['winter-work', '2020-03-01T07:59:00.000Z', '2020-02', 'maintenance'],
      ['spring-work', '2020-04-01T07:02:00.000Z', '2020-04', 'maintenance'],
    ].map(([id, at, month, kind], index) => ({ id, at, month, kind, title: `Synthetic Lamp retained ${id}`, reference: `${kind === 'incident' ? 'INC' : 'SCH'}-${index + 2}` }));
    for (const row of archived) {
      const startedAt = new Date(Date.parse(row.at) - 3_600_000).toISOString();
      if (row.kind === 'incident') {
        source.incidents.push({ id: row.id, reference: row.reference, title: row.title, lifecycle: 'Resolved', openedAt: startedAt, resolvedAt: row.at });
        source.incidentComponents.push({ incidentId: row.id, componentId: 'customer-api', componentName: 'Customer API', state: 'Major outage', relationship: 'Primary', publishedAt: row.at });
        source.updates.push({ ...source.updates[0], id: `synthetic-lamp-update-${row.id}`, incidentId: row.id, lifecycle: 'Resolved', publishedAt: row.at, nextUpdateAt: null });
      } else {
        source.maintenance.push({ id: row.id, reference: row.reference, title: row.title, state: 'Completed', startsAt: startedAt, endsAt: row.at, completedAt: row.at });
        source.maintenanceComponents.push({ maintenanceId: row.id, componentId: 'customer-api', componentName: 'Customer API' });
        source.maintenanceNotices.push({ id: `synthetic-lamp-notice-${row.id}`, maintenanceId: row.id, kind: 'Completed', body: 'Synthetic Lamp retained work complete', publishedAt: row.at });
      }
    }
    const image = themeHeaderImage();
    const font = await readFile('src/core/features/public-snapshot/fonts/inter-latin.woff2');
    const themeAssets = { header: { key: 'branding/theme-image', contentType: 'image/png' }, font: { key: 'branding/theme-font', contentType: 'font/woff2' } };
    await bucket.put(themeAssets.header.key, image);
    await bucket.put(themeAssets.font.key, font);
    source.settings.themeAssets = JSON.stringify(themeAssets);
    source.settings.theme = JSON.stringify({ headerImage: true, font: 'uploaded' });
    const rebuild = async input => (await read('/test/rebuild', { method: 'POST', body: JSON.stringify({ source, ...input }) })).json();
    const generation = await rebuild({ generation: 1 });
    assert.equal(generation.failure, null);
    assert.equal(generation.completed, true);
    assert.equal(generation.pointer.generation, 1);
    assert.equal(generation.replica.generation, 1);
    assert.ok(generation.pointer.version);
    assert.equal(generation.pointer.version, generation.replica.version);
    assert.equal(generation.pointer.generatedAt, generation.replica.generatedAt);
    const pageKey = `snapshots/${generation.pointer.version}/page.html`;
    const pageObject = await bucket.get(pageKey);
    await bucket.put(pageKey, (await pageObject.text()).replace('<body', '<body data-synthetic-note="a > b"'), { httpMetadata: { contentType: 'text/html; charset=utf-8' } });
    const monthObjects = await bucket.list({ prefix: `snapshots/${generation.pointer.version}/history/` });
    const monthPaths = monthObjects.objects.map(object => '/' + object.key.slice(`snapshots/${generation.pointer.version}/`.length).replace(/\.html$/, '')).sort();
    assert.deepEqual(monthPaths, ['/history/2019-12', '/history/2020-02', '/history/2020-04', '/history/2025-04'], 'every independently expected populated month is generated');
    const checkMonth = async (path, suffix = '') => {
      const response = await read(path + suffix);
      assert.equal(response.status, 200, `database-unavailable month ${path}`);
      assert.equal(response.headers.get('x-lamp-snapshot-version'), generation.pointer.version);
      const html = await response.text();
      for (const row of archived) {
        const href = `/${row.kind === 'incident' ? 'incidents' : 'maintenance'}/${row.reference}`;
        assert.equal(html.includes(`<a href="${href}">${row.title}</a>`), path.endsWith(row.month), `${path} retains exact membership for ${row.title}`);
      }
      if (suffix) assert.equal(response.headers.get('x-lamp-snapshot-state'), 'stale');
      else assert.equal(response.headers.get('x-lamp-snapshot-state'), null);
      return html;
    };
    for (const path of monthPaths) await checkMonth(path);
    assert.equal((await (await read('/test/database-touches')).json()).accesses, 0);
    const paths = ['/', '/feed.atom', '/feed.rss', '/widget.js', '/api/public/status', '/badge.svg', '/badge.json'];
    const artifactKeys = ['page.html', 'feed.atom', 'feed.rss', 'widget.js', 'status.json', 'badge.svg', 'badge.json'];
    const blobReads = async () => (await read('/test/blob-reads')).json();
    const beforeCold = await blobReads();
    const coldBodies = new Map();
    const validators = new Map();
    for (const [index, path] of paths.entries()) {
      const key = `snapshots/${generation.pointer.version}/${artifactKeys[index]}`;
      assert.equal(beforeCold.getBytes[key] ?? 0, 0, `${path} starts with an unread generation artifact`);
      const response = await read(path);
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get('x-lamp-snapshot-state'), null, `${path} is healthy with a repository that throws on access`);
      assert.equal(response.headers.get('x-lamp-snapshot-version'), generation.pointer.version, path);
      assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), generation.pointer.generatedAt, path);
      coldBodies.set(path, Buffer.from(await response.arrayBuffer()));
      if (firstPublicationPaths.has(path)) {
        assert.match(response.headers.get('content-type') ?? '', firstPublicationPaths.get(path), path);
      }
      validators.set(path, response.headers.get('etag'));
      assert.ok(validators.get(path), `${path} supplies a validator`);
      assert.equal((await blobReads()).getBytes[key], 1, `${path} reads its immutable artifact once when cold`);
    }
    const firstPage = descendants(parse(coldBodies.get('/').toString()));
    const headline = firstPage.find(node => node.attrs?.some(attr => attr.name === 'id' && attr.value === 'overall-status'));
    assert.equal(headline?.childNodes[0]?.value, 'Down');
    const time = firstPage.find(node => node.attrs?.some(attr => attr.name === 'data-generated-at'))?.childNodes.find(node => node.tagName === 'time');
    assert.equal(time?.attrs.find(attr => attr.name === 'datetime')?.value, generation.pointer.generatedAt);
    const atom = coldBodies.get('/feed.atom').toString();
    assert.equal(atom.split('<entry>')[0].match(/<updated>([^<]+)<\/updated>/)?.[1], generation.pointer.generatedAt);
    const entry = atom.match(/<entry>.*?<\/entry>/gs)?.find(value => value.includes('<title>INC-1: Known API outage</title>'));
    assert.ok(entry?.includes('Major outage affects customer requests.'), 'the Atom incident entry carries the known outage');
    const widget = coldBodies.get('/widget.js').toString();
    assert.ok(widget.includes('"overall":"Major outage"'), 'the widget starts with the known outage');
    assert.ok(widget.includes('"reference":"INC-1","title":"Known API outage"'), 'the widget carries the published incident');
    assert.ok(widget.includes(`"generatedAt":"${generation.pointer.generatedAt}"`), 'the widget starts with the published generation instant');
    console.info(`FIRST SNAPSHOT GET / /feed.atom /widget.js → 200; Major outage; generation=1; version=${generation.pointer.version}; generatedAt=${generation.pointer.generatedAt}`);

    const afterCold = await blobReads();
    assert.equal(afterCold.getText['snapshots/current.json'] - (beforeCold.getText['snapshots/current.json'] ?? 0), paths.length, 'every cold read validates the current pointer');
    assert.equal(afterCold.getText['snapshots/stale.json'] - (beforeCold.getText['snapshots/stale.json'] ?? 0), paths.length, 'every cold read checks snapshot freshness');
    for (let round = 0; round < 3; round++) {
      for (const path of paths) {
        const response = await read(path);
        assert.equal(response.status, 200, path);
        assert.equal(response.headers.get('x-lamp-snapshot-state'), null, path);
        assert.equal(response.headers.get('x-lamp-snapshot-version'), generation.pointer.version, path);
        assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), generation.pointer.generatedAt, path);
        assert.equal(response.headers.get('etag'), validators.get(path), path);
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), coldBodies.get(path), `${path} reuses identical generation bytes`);
      }
      const afterWarm = await blobReads();
      assert.deepEqual(afterWarm.getBytes, afterCold.getBytes, 'warm public reads fetch no additional object bytes');
      assert.equal(afterWarm.getText['snapshots/current.json'] - afterCold.getText['snapshots/current.json'], paths.length * (round + 1), 'every warm read still validates the current pointer');
      assert.equal(afterWarm.getText['snapshots/stale.json'] - afterCold.getText['snapshots/stale.json'], paths.length * (round + 1), 'every warm read still checks snapshot freshness');
    }
    const beforeConditional = await blobReads();
    for (const path of paths) {
      const response = await read(path, { headers: { 'If-None-Match': validators.get(path) } });
      assert.equal(response.status, 304, path);
      assert.equal(response.headers.get('x-lamp-snapshot-version'), generation.pointer.version, path);
      assert.equal((await response.arrayBuffer()).byteLength, 0, path);
    }
    const afterConditional = await blobReads();
    assert.deepEqual(afterConditional.getBytes, afterCold.getBytes, 'conditional warm reads also reuse cached artifact bytes');
    assert.equal(afterConditional.getText['snapshots/current.json'] - beforeConditional.getText['snapshots/current.json'], paths.length, 'conditional responses validate the pointer before accepting old bytes');
    const edgeFallback = await read('/?storage=down&replica=down');
    assert.equal(edgeFallback.status, 200);
    assert.equal(edgeFallback.headers.get('x-lamp-snapshot-state'), 'stale');
    const body = descendants(parse(await edgeFallback.text())).find(node => node.tagName === 'body');
    assert.equal(body.attrs.find(attr => attr.name === 'data-synthetic-note')?.value, 'a > b', 'stale labeling preserves quoted body attributes');
    const banner = body.childNodes.find(node => node.tagName === 'aside' && node.attrs.some(attr => attr.name === 'class' && attr.value === 'snapshot-stale'));
    assert.ok(banner, 'the stale notice is an actual child of the body');
    assert.ok(banner.childNodes.some(node => node.value?.includes(generation.pointer.generatedAt)), 'the notice identifies the retained generation');
    const failed = await rebuild({ generation: 2, replicaFailure: 'always' });
    assert.ok(failed.failure); assert.equal(failed.completed, false);
    for (const path of paths) {
      const response = await read(path + '?storage=down'); assert.equal(response.status, 200, path);
      assert.equal(response.headers.get('x-lamp-snapshot-state'), 'stale');
      assert.ok(response.headers.get('x-lamp-snapshot-generated-at'));
      const text = await response.text();
      if (path === '/feed.atom' || path === '/feed.rss') {
        const original = coldBodies.get(path).toString();
        assert.equal(text.slice(0, text.indexOf('</title>') + '</title>'.length), original.slice(0, original.indexOf('</title>') + '</title>'.length), 'stale feed labeling preserves the complete escaped title');
        assert.ok(text.includes('Known service status &lt;synthetic-lamp&gt; &amp; $&'));
        assert.ok(text.includes(`content generated at ${generation.pointer.generatedAt}`));
      }
      if (path === '/badge.json') assert.equal(JSON.parse(text).message, 'Down', 'the endpoint badge keeps the known outage');
      else if (path === '/badge.svg') assert.match(text, /id="value"[^>]*>Down<\/text>/);
      else assert.ok(text.includes('Major outage') || text.includes('major-outage'), `${path} keeps the known outage`);
      if (path === '/') for (const component of source.components) assert.ok(text.includes(`/components/${component.id}/feed.atom`), 'storage failure preserves every component resource in the shared footer');
      // Badge protocols retain their consumer schema; every surface carries
      // the stale/generated-at HTTP headers checked above. Human and status
      // representations also expose staleness in their body.
      if (!path.startsWith('/badge.')) assert.ok(text.includes('Last known state') || text.includes('"snapshotState":"stale"'), path);
    }
    for (const path of monthPaths) await checkMonth(path, '?storage=down');
    await runtime.dispose(); runtime = new Miniflare(options);
    for (const path of paths) assert.equal((await read(path + '?storage=down&cold=1')).status, 200, `cold retained read ${path}`);
    for (const path of monthPaths) await checkMonth(path, '?storage=down&cold=1');
    for (const row of archived.filter(row => row.kind === 'incident')) {
      const response = await read(`/incidents/${row.reference}?storage=down&cold=1`);
      assert.equal(response.status, 200, 'every retained month incident link survives database and storage failure');
      assert.equal(response.headers.get('x-lamp-snapshot-state'), 'stale');
      assert.ok((await response.text()).includes(row.title));
    }
    assert.equal((await (await read('/test/database-touches')).json()).accesses, 0, 'cold retained month reads never access the database');
    console.log('PROBE HIST-008 4: all four generated month routes and incident permalinks -> 200 with exact membership through throwing D1, storage failure and cold restart; zero database accesses');
    for (const [kind, bytes, type] of [['header', image, 'image/png'], ['font', font, 'font/woff2']]) {
      const response = await read(`/assets/theme-${kind}?storage=down&cold=1`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), type);
      assert.equal(response.headers.get('set-cookie'), null);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes, 'the cold retained snapshot preserves uploaded theme bytes');
    }
    const failedHealth = await read('/health?storage=down');
    assert.equal(failedHealth.status, 503);
    assert.equal(failedHealth.headers.get('cache-control'), 'no-store');
    const failedHealthBody = await failedHealth.json();
    assert.equal(failedHealthBody.status, 'unavailable');
    assert.equal(failedHealthBody.dependency, 'database', 'schema metadata preserves the failing dependency');
    assert.equal(failedHealthBody.schemaObservation.state, 'unavailable');
    assert.equal(failedHealthBody.schemaObservation.reason, 'db_missing', 'a missing DB binding is distinct from a missing ledger');
    assert.equal(failedHealthBody.schemaObservation.completeCount, null);
    assert.equal(failedHealthBody.schemaObservation.partialCount, null);
    assert.equal(failedHealthBody.schemaObservation.inventorySha256, null);
    assert.equal(failedHealthBody.deployment, undefined, 'failure never claims deployment success');
    const restored = await rebuild({ generation: 3 }); assert.equal(restored.failure, null); assert.equal(restored.completed, true);
    assert.notEqual(restored.pointer.version, generation.pointer.version);
    for (const [index, path] of paths.entries()) {
      const response = await read(path, { headers: { 'If-None-Match': validators.get(path) } });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('x-lamp-snapshot-state'), null);
      assert.equal(response.headers.get('x-lamp-snapshot-version'), restored.pointer.version, 'the new current generation replaces warmed bytes');
      assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), restored.pointer.generatedAt);
      await response.arrayBuffer();
      assert.equal((await blobReads()).getBytes[`snapshots/${restored.pointer.version}/${artifactKeys[index]}`], 1, `${path} reads the new generation artifact once`);
    }
  } finally {
    await j?.close(); await runtime?.dispose(); clearTimeout(alarmTimer);
    monitor?.closeAllConnections(); if (monitor) await new Promise(resolve => monitor.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('First-run confirmation waits for the three-component public snapshot and retries a refused publication', async () => {
  const thirdComponentWrite = Promise.withResolvers();
  const releaseWrite = Promise.withResolvers();
  let refuseWrite = true;
  const publicationEdge = 'https://r2.example.test/first-run';
  const journey = await openStatusJourney({
    workerEntry: 'tests/e2e/snapshot-retention.worker.ts',
    extraBindings: { LAMP_TEST_SETUP_PUBLICATION_EDGE: publicationEdge },
    async providerEdge(request) {
      if (request.url !== publicationEdge) return;
      thirdComponentWrite.resolve();
      await releaseWrite.promise;
      return new Response(null, { status: refuseWrite ? 503 : 204 });
    },
  });
  let first;
  try {
    await journey.execute("DELETE FROM setup_readiness WHERE step='first-run'");
    const components = ['ChargeDesk website', 'ChargeDesk app', 'Customer support'];
    const finish = () => journey.post('/api/app/overview/first-run', { components });
    const setupState = async () => (await (await journey.raw('/setup/state')).json()).state;
    const publishedComponents = async () => (await (await journey.publicResponse('/api/public/v1/components.json')).json()).data.map(component => component.name);
    first = finish();
    await Promise.race([thirdComponentWrite.promise, first.then(() => assert.fail('Setup finished before the third snapshot write'))]);
    assert.deepEqual(await publishedComponents(), components.slice(0, 2));
    assert.equal(await setupState(), 'unclaimed');
    assert.equal((await finish()).status, 409, 'another press during publication does not start another setup');
    releaseWrite.resolve();
    const failed = await first;
    assert.equal(failed.status, 400);
    assert.match(failed.body.error, /Customer support/);
    assert.equal(await setupState(), 'unclaimed');
    refuseWrite = false;
    const retried = await finish();
    assert.equal(retried.status, 200);
    assert.equal(retried.body.complete, true);
    assert.equal(await setupState(), 'claimed');
    assert.deepEqual(await publishedComponents(), components);
  } finally {
    releaseWrite.resolve();
    await first?.catch(() => {});
    await journey.close();
  }
});

test('Published snapshot retention keeps two versions, drains old piles and protects failed and overlapping publications', async () => {
  const j = await openStatusJourney({ workerEntry: 'tests/e2e/snapshot-retention.worker.ts' });
  try {
    const bucket = await j.runtime.getR2Bucket('SNAPSHOTS');
    const keys = async () => (await bucket.list({ prefix: 'snapshots/' })).objects.map(object => object.key);
    const versions = async () => [...new Set((await keys()).filter(key => key.split('/').length > 2).map(key => key.split('/')[1]))];
    const pointer = async () => (await bucket.get('snapshots/current.json'))?.json();
    const component = await j.component('Synthetic Lamp retention service');
    const incident = await j.incident('Synthetic Lamp retention publication', [component]);
    const publish = async number => {
      await j.save(incident.id, { details: `Synthetic Lamp retention update ${number}` });
      await j.publish(incident.id);
      await j.visible('/', `Synthetic Lamp retention update ${number}`);
      await eventually(versions, value => value.length === 2, 'publication completes bounded cleanup');
    };
    for (let number = 1; number <= 5; number++) {
      const previous = await pointer();
      await publish(number);
      const current = await pointer();
      assert.notEqual(current.version, previous.version);
      assert.deepEqual((await versions()).sort(), [current.version, previous.version].sort());
    }
    console.info('RETENTION operator publish route: five publishes hold exactly current+previous=2');
    const before = await keys();
    const deletes = (await j.json('/test/retention')).deletes;
    await j.json('/test/retention', 'PUT', { failWrites: true });
    await j.save(incident.id, { details: 'Synthetic Lamp failed snapshot write' });
    // Incident publication succeeds independently of retryable snapshot delivery.
    await j.publish(incident.id);
    const latest = await j.db.prepare('SELECT status FROM snapshot_builds ORDER BY rowid DESC LIMIT 1').first();
    assert.equal(latest.status, 'failed');
    assert.deepEqual((await keys()).sort(), before.sort());
    assert.equal((await j.json('/test/retention')).deletes, deletes);
    await j.json('/test/retention', 'PUT', { failWrites: false });
    for (let number = 0; number < 10; number++) {
      const version = `synthetic-lamp-legacy-${number}`;
      await bucket.put(`snapshots/${version}/retained.json`, JSON.stringify({ version, generation: 0 }));
      await bucket.put(`snapshots/${version}/page.html`, `Synthetic legacy page ${number}`);
    }
    const counts = [];
    for (let number = 6; number <= 10; number++) {
      await j.save(incident.id, { details: `Synthetic Lamp retention update ${number}` });
      await j.publish(incident.id);
      await j.visible('/', `Synthetic Lamp retention update ${number}`);
      counts.push((await versions()).length);
      if (counts.at(-1) === 2) break;
    }
    assert.equal(counts.at(-1), 2, 'real publish requests drain the legacy pile');
    console.info(`RETENTION operator publish route: ten old versions drained; versionCounts=${counts.join(',')}`);
  } finally { await j.close(); }
  const runtime = new Miniflare(await retainedSnapshotOptions({ name: 'lamp-retention' }));
  try {
    const bucket = await runtime.getR2Bucket('SNAPSHOTS');
    const publish = async input => {
      const response = await runtime.dispatchFetch('https://page.example/test/rebuild', { method: 'POST', body: JSON.stringify(input) });
      assert.equal(response.status, 200);
      return response.json();
    };
    const keys = async () => (await bucket.list({ prefix: 'snapshots/' })).objects.map(object => object.key).sort();
    const versions = async () => [...new Set((await keys()).filter(key => key.split('/').length > 2).map(key => key.split('/')[1]))].sort();
    const published = [];
    for (let generation = 1; generation <= 5; generation++) {
      const result = await publish({ generation });
      assert.equal(result.failure, null);
      published.push(result.pointer.version);
      assert.deepEqual(await versions(), published.slice(-2).sort(), 'only the current and actual predecessor remain');
      const response = await runtime.dispatchFetch('https://page.example/');
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('x-lamp-snapshot-version'), result.pointer.version);
      await response.arrayBuffer();
    }
    console.info('RETENTION five publishes: versions=2');
    for (const failure of [{ replicaFailure: 'always' }, { pointerFailure: true }]) {
      const before = await keys();
      const result = await publish({ generation: failure.pointerFailure ? 7 : 6, ...failure });
      assert.ok(result.failure);
      assert.deepEqual(result.cleanup.deletes, []);
      assert.deepEqual(result.cleanup.lists, []);
      const after = await keys();
      for (const key of before) assert.ok(after.includes(key), 'a failed publish deletes no existing object');
    }
    // An upgrade can find legacy versions with only the existing retained bundle
    // as their sequence fence. Give one more than a deletion page to prove resume.
    const legacy = [];
    for (let generation = 0; generation < 10; generation++) {
      const version = `synthetic-lamp-old-${generation}`;
      legacy.push(version);
      await bucket.put(`snapshots/${version}/retained.json`, JSON.stringify({ version, generation }));
      for (let item = 0; item < (generation === 0 ? 300 : 1); item++) await bucket.put(`snapshots/${version}/artifact-${item}`, 'synthetic snapshot');
    }
    const deferred = await publish({ generation: 20, cleanupFailure: true });
    assert.equal(deferred.failure, null, 'cleanup failure cannot undo a successful publish');
    const timed = await publish({ generation: 21, cleanupDelay: 1_050 });
    assert.equal(timed.failure, null);
    assert.deepEqual(timed.cleanup.deletes, [], 'no further storage work starts after the time budget');
    let remaining = legacy.length, rounds = 0;
    const counts = [];
    while (rounds < 8) {
      const result = await publish({ generation: 22 + rounds++ });
      assert.equal(result.failure, null);
      const present = await versions();
      remaining = legacy.filter(version => present.includes(version)).length;
      counts.push(remaining);
      assert.ok(result.cleanup.deletes.length <= 4, 'bounded deletion pages per publication');
      for (const batch of result.cleanup.deletes) assert.ok(batch.length <= 256, 'bounded explicit key batches');
      if (present.length === 2) break;
    }
    assert.equal(remaining, 0);
    assert.equal((await versions()).length, 2);
    console.info(`RETENTION legacy pile: oldVersions=10 remaining=${counts.join(',')} finalVersions=2`);
    const overlapping = await publish({ generation: 40, overlapGeneration: 41 });
    assert.equal(overlapping.failure, null);
    assert.equal(overlapping.overlap.failure, null);
    assert.equal(overlapping.pointer.generation, 41);
    const current = overlapping.pointer.version;
    const previous = overlapping.builds.find(build => build.status === 'published').version;
    assert.deepEqual(await versions(), [current, previous].sort(), 'the delayed older cleanup preserves the concurrent winner and its predecessor');
    const superseded = await publish({ generation: 39 });
    assert.equal(superseded.completed, false);
    assert.deepEqual(superseded.cleanup.deletes, [], 'a superseded publish cannot run retention');
  } finally { await runtime.dispose(); }
});
