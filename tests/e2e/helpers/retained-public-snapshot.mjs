import assert from 'node:assert/strict';

// The inventory comes from retained storage; every response crosses the public
// routing boundary, including transformations applied while serving HTML.
export async function retainedPublicSnapshot({ query, object, response, privateIncidents = [] }) {
  const deadline = performance.now() + 30_000;
  while (true) {
    const root = await response('/');
    await root.arrayBuffer();
    const [work] = await query('SELECT requested_revision, completed_revision FROM public_snapshot_work');
    const building = await query("SELECT id FROM snapshot_builds WHERE status = 'building'");
    if (work && work.requested_revision === work.completed_revision && building.length === 0) break;
    assert.ok(performance.now() < deadline, 'public snapshot publication settles before intake proof');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  const pointer = await object('snapshots/current.json');
  const bundle = await object(`snapshots/${pointer.version}/retained.json`);
  assert.equal(bundle.version, pointer.version);
  assert.equal(bundle.generation, pointer.generation);
  assert.equal(bundle.generatedAt, pointer.generatedAt);
  const artifacts = bundle.artifacts.toSorted((a, b) => a.key.localeCompare(b.key));
  assert.equal(new Set(artifacts.map(row => row.key)).size, artifacts.length);
  for (const incident of privateIncidents) {
    assert.ok(!artifacts.some(row => row.key === `incidents/${incident.reference}.html`), 'private incident has no retained permalink');
    for (const artifact of artifacts) {
      assert.ok(!artifact.body.includes(incident.reference), `${artifact.key} excludes the private reference`);
      assert.ok(!artifact.body.includes(incident.id), `${artifact.key} excludes the private identity`);
    }
  }
  const responses = [];
  for (const artifact of artifacts) {
    let path = `/${artifact.key}`;
    if (artifact.key === 'page.html') path = '/';
    else if (artifact.key === 'history.html') path = '/history';
    else if (artifact.key === 'status.json') path = '/api/public/status';
    else if (artifact.key === 'not-found.html') path = '/incidents/synthetic-lamp-missing';
    else if (artifact.key.startsWith('aliases/')) path = decodeURIComponent(artifact.key.slice('aliases/'.length, -5));
    else if (/^(?:incidents|maintenance|history)\/.+\.html$/.test(artifact.key)) path = path.slice(0, -5);
    else {
      const collection = /^api\/public\/v1\/(components|incidents|maintenance)(?:\/(.+))?\.json$/.exec(artifact.key);
      if (collection) path = `/api/public/v1/${collection[1]}${collection[2] ? `?cursor=${collection[2]}` : ''}`;
    }
    const served = await response(path);
    const bytes = Buffer.from(await served.arrayBuffer()).toString('base64');
    const expectedStatus = artifact.key === 'not-found.html' ? 404 : artifact.contentType === 'application/vnd.lamp.redirect+json' ? 301 : 200;
    assert.equal(served.status, expectedStatus, path);
    if (served.status !== 404) assert.equal(served.headers.get('x-lamp-snapshot-version'), pointer.version, path);
    assert.equal(served.headers.get('x-lamp-snapshot-generated-at'), pointer.generatedAt, path);
    responses.push({ key: artifact.key, path, status: served.status, location: served.headers.get('location'), version: served.headers.get('x-lamp-snapshot-version'), generatedAt: served.headers.get('x-lamp-snapshot-generated-at'), bytes });
  }
  const absent = [];
  for (const incident of privateIncidents) {
    const served = await response(`/incidents/${incident.reference}`);
    assert.equal(served.status, 404, `${incident.reference} stays private`);
    absent.push({ reference: incident.reference, status: served.status, bytes: Buffer.from(await served.arrayBuffer()).toString('base64') });
  }
  return { pointer, artifacts, responses, absent };
}
