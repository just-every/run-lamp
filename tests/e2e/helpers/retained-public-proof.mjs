import assert from 'node:assert/strict';
import { eventually } from './status-journey.mjs';

// Retain the complete inventory, then read every entry through its public door.
// This follows preset-recovery-flow's settled-generation proof with real bindings.
export async function retainedPublicProof({ db, bucket, raw, publicOrigin }) {
  await eventually(async () => {
    await (await raw(`${publicOrigin}/`)).arrayBuffer();
    const work = await db.prepare('SELECT requested_revision, completed_revision FROM public_snapshot_work').first();
    const building = await db.prepare("SELECT COUNT(*) AS count FROM snapshot_builds WHERE status='building'").first();
    return work && work.requested_revision === work.completed_revision && building.count === 0;
  }, Boolean, 'publication settles before retaining public bytes');
  const pointer = await (await bucket.get('snapshots/current.json')).json();
  const bundle = await (await bucket.get(`snapshots/${pointer.version}/retained.json`)).json();
  assert.equal(bundle.version, pointer.version);
  assert.equal(bundle.generation, pointer.generation);
  const artifacts = bundle.artifacts.toSorted((a, b) => a.key.localeCompare(b.key));
  assert.ok(artifacts.length > 0);
  assert.equal(new Set(artifacts.map(item => item.key)).size, artifacts.length);
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
    const response = await raw(`${publicOrigin}${path}`, { redirect: 'manual' });
    const bytes = Buffer.from(await response.arrayBuffer()).toString('base64');
    const status = artifact.key === 'not-found.html' ? 404 : artifact.contentType === 'application/vnd.lamp.redirect+json' ? 301 : 200;
    assert.equal(response.status, status, path);
    if (status !== 404) assert.equal(response.headers.get('x-lamp-snapshot-version'), pointer.version, path);
    assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), pointer.generatedAt, path);
    responses.push({ key: artifact.key, path, status, bytes, location: response.headers.get('location'), version: response.headers.get('x-lamp-snapshot-version'), generatedAt: response.headers.get('x-lamp-snapshot-generated-at') });
  }
  return { pointer, artifacts, responses };
}
