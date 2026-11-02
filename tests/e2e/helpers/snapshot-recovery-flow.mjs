import assert from 'node:assert/strict';
import { eventually, visibleText } from './status-journey.mjs';

/** A committed update survives a publication outage without replacing the
 * last complete generation. Recovery uses the real Worker Cron entry point. */
export async function snapshotRecoveryFlow(j, incident, component, original) {
  const bucket = await j.runtime.getR2Bucket('SNAPSHOTS');
  const pointer = async () => JSON.parse(await (await bucket.get('snapshots/current.json')).text());
  const work = () => j.db.prepare('SELECT requested_revision, completed_revision FROM public_snapshot_work').first();
  const publications = async () => (await j.read(incident.id)).updates;
  const prior = await pointer();
  const paths = ['/', '/feed.atom', '/widget.js'];
  const priorBodies = new Map();
  for (const path of paths) {
    const response = await j.publicResponse(path);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-lamp-snapshot-version'), prior.version);
    const body = await response.text();
    assert.ok(visibleText(body).includes(original.details), `${path} starts with the original customer wording`);
    priorBodies.set(path, body);
  }
  const fault = async failing => {
    assert.equal((await j.raw('/test/snapshot-publication', { method: 'PUT', body: JSON.stringify({ failing }) })).status, 204);
  };
  await fault(true);
  await j.save(incident.id, {
    lifecycle: 'Monitoring', affectedAudience: 'Recovered API customers',
    customerImpact: 'New requests are succeeding after the connection repair.',
    whatStillWorks: 'Existing sessions stayed available throughout the repair.',
    details: 'Distinct recovery publication waiting for snapshot storage.',
    componentChanges: [{ componentId: component.id, state: 'Degraded performance' }],
  });
  const attempted = (await j.publish(incident.id)).update;
  assert.notEqual(attempted.id, original.id);
  assert.notEqual(attempted.publishedAt, original.publishedAt);
  const committed = await publications();
  assert.deepEqual(committed.map(row => row.id).sort(), [original.id, attempted.id].sort());
  const failed = await eventually(
    () => j.db.prepare('SELECT status, attempts, error FROM snapshot_builds ORDER BY rowid DESC LIMIT 1').first(),
    row => row?.status === 'failed', 'the native publication exhausts its immediate snapshot retries',
  );
  assert.equal(failed.attempts, 3);
  assert.match(failed.error, /Retained snapshot cache publication failed/);
  const followUps = (await j.json('/api/app/overview/follow-ups')).followUps;
  const failure = followUps.find(item => item.kind === 'snapshot-publication');
  assert.ok(failure, 'the failed snapshot job is visible through the operator follow-up door');
  assert.equal(failure.title, 'Public snapshot publication');
  assert.equal(failure.failure.state, 'failed');
  assert.match(failure.failure.message, /previous publication remains available/);
  assert.match(failure.stopCondition, /Automatic retries continue/);
  assert.equal(failure.link, '/app');
  const pending = await work();
  assert.ok(pending.requested_revision > pending.completed_revision);
  assert.deepEqual(await pointer(), prior, 'failed publication never selects incomplete artifacts');
  const injected = await (await j.raw('/test/snapshot-publication')).json();
  assert.equal(injected.failing, true);
  assert.equal(injected.attempts.length, 3);
  assert.equal(new Set(injected.attempts).size, 1, 'immediate retries retain one attempted generation identity');

  for (const path of paths) {
    const response = await j.publicResponse(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('x-lamp-snapshot-state'), 'stale', path);
    assert.equal(response.headers.get('x-lamp-snapshot-version'), prior.version, path);
    assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), prior.generatedAt, path);
    const body = await response.text();
    // Stale labeling is the only added content; the complete prior customer
    // body remains, including publication identities in Atom.
    if (path === '/') assert.equal(body.replace(/<aside\b[^>]*class="snapshot-stale"[^>]*>[\s\S]*?<\/aside>/, ''), priorBodies.get(path));
    if (path === '/feed.atom') {
      assert.equal(body.replace(/<subtitle>Last known state[^<]*<\/subtitle>/, ''), priorBodies.get(path));
      assert.ok(body.includes(`:event:update-${original.id}</id>`));
      assert.ok(!body.includes(`:event:update-${attempted.id}</id>`));
    }
    if (path === '/widget.js') assert.ok(body.startsWith(priorBodies.get(path)), 'the entire prior widget program is retained');
    assert.ok(visibleText(body).includes(original.details), path);
    for (const value of [attempted.customerImpact, attempted.whatStillWorks, attempted.details]) assert.ok(!body.includes(value), `${path} never leaks attempted content`);
  }
  assert.equal((await (await j.raw('/test/snapshot-publication')).json()).failing, true, 'the write fault remains active throughout all three reads');
  await fault(false);
  await j.tick(Date.now());
  const recovered = await pointer();
  assert.notEqual(recovered.version, prior.version);
  assert.ok(recovered.generation > prior.generation);
  const finished = await work();
  assert.equal(finished.requested_revision, pending.requested_revision, 'recovery does not request another publication');
  assert.equal(finished.completed_revision, pending.requested_revision);
  assert.deepEqual(await publications(), committed, 'Cron publishes pending snapshot work without another incident update');
  assert.ok(!(await j.json('/api/app/overview/follow-ups')).followUps.some(item => item.kind === 'snapshot-publication'), 'successful recovery clears the operator failure');
  for (const path of paths) {
    const response = await j.publicResponse(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('x-lamp-snapshot-state'), null, path);
    assert.equal(response.headers.get('x-lamp-snapshot-version'), recovered.version, path);
    assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), recovered.generatedAt, path);
    const body = await response.text();
    for (const value of [attempted.customerImpact, attempted.whatStillWorks, attempted.details]) assert.ok(visibleText(body).includes(value), `${path} serves the recovered publication`);
    if (path === '/feed.atom') for (const update of [original, attempted]) assert.ok(body.includes(`:event:update-${update.id}</id>`));
    if (path === '/widget.js') assert.ok(!body.includes(original.details), 'the widget switches from the original publication to the recovery');
  }
  console.log(`PROBE PAGE-005 3: native publish with replica PUT failure -> prior page, Atom and widget retained; Cron recovered revision ${finished.completed_revision} without another publication`);
}
