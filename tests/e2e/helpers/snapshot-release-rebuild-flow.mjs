import assert from 'node:assert/strict';
import { openStatusJourney } from './status-journey.mjs';

const OLD_TEXT = 'Subscribe to status updates (written by an earlier release)';
const OLD_MARK = '<!-- earlier release -->';
const HEADING = 'Subscribe to status updates';

/** U101-14: a deploy that changes the page's code rebuilds the stored public page, once, and a
 * reset database still advances the bucket's pointer. The Worker, D1, R2 and the retained
 * replica are real; a deploy is a new Worker over the same storage with another release
 * identity, and "the earlier release's renderer" is its stored page.html. */
/** Runs the deploys and returns what each left behind; the caller closes `j`. */
export async function observeSnapshotReleaseRebuild({ afterDatabaseReset } = {}) {
  const j = await openStatusJourney({ extraBindings: { RER_RELEASE_DIGEST: 'release-1' } });
  try {
    const bucket = () => j.runtime.getR2Bucket('SNAPSHOTS');
    const pointer = async () => JSON.parse(await (await (await bucket()).get('snapshots/current.json')).text());
    const count = async sql => (await j.db.prepare(sql).first()).n;
    const builds = () => count('SELECT count(*) AS n FROM snapshot_builds');
    const work = () => j.db.prepare('SELECT requested_revision AS requested, completed_revision AS completed FROM public_snapshot_work').first();
    const control = () => count('SELECT next_generation AS n FROM snapshot_build_control');
    // What is stored (never cached by the edge, so a stored page can be rewritten) and what a reader is served.
    const page = async () => ({ html: await (await (await bucket()).get(`snapshots/${(await pointer()).version}/page.html`)).text() });
    const served = async () => { const response = await j.publicResponse('/'); return { status: response.status, html: await response.text(), robots: response.headers.get('x-robots-tag') }; };
    const health = async () => (await j.raw('/health')).status;
    const deploy = async release => { await j.restart({ bindings: { RER_RELEASE_DIGEST: release } }); };
    const stored = async () => { const current = await pointer(); return { pointer: current, builds: await builds(), work: await work(), page: await page() }; };
    // The page as the previous release rendered it: the stored bytes, not what today's renderer writes.
    const writeEarlierRelease = async () => {
      const current = await pointer(); const key = `snapshots/${current.version}/page.html`;
      const object = await (await bucket()).get(key);
      await (await bucket()).put(key, (await object.text()).replace(HEADING, OLD_TEXT).replace('</body>', `${OLD_MARK}</body>`), { httpMetadata: { contentType: 'text/html; charset=utf-8' } });
    };
    const facts = {};

    // A restored settings row may have the migration's placeholder rather
    // than a feed identity. Cron must recover it without a setup-page write.
    await j.db.prepare("UPDATE page_settings SET feed_id = 'pending-feed-identity'").run();
    await j.tick(Date.now());
    const recoveredIdentity = (await j.db.prepare("SELECT feed_id AS id FROM page_settings WHERE id='default'").first()).id;
    assert.ok(recoveredIdentity && recoveredIdentity !== 'pending-feed-identity', 'Cron persists a deployment feed identity');
    for (const path of ['/api/public/status', '/history', '/feed.atom']) {
      const response = await j.publicResponse(path);
      assert.equal(response.status, 200, `Cron produces ${path} from the native settings row`);
      const body = await response.text();
      if (path === '/feed.atom') assert.ok(body.includes(`urn:lamp:${recoveredIdentity}`));
    }
    // The repaired settings mutation is durable public work too. Let its
    // revision settle before checking the following idle tick.
    await j.tick(Date.now());
    const recoveredVersion = (await pointer()).version;
    await j.tick(Date.now());
    assert.equal((await pointer()).version, recoveredVersion, 'an idle tick retains the complete snapshot');
    assert.equal((await j.db.prepare("SELECT feed_id AS id FROM page_settings WHERE id='default'").first()).id, recoveredIdentity, 'idle work never rotates the feed identity');

    // Three generations built the ordinary way, each by a real operator change.
    for (const name of ['Synthetic Lamp rebuild one', 'Synthetic Lamp rebuild two', 'Synthetic Lamp rebuild three']) await j.visible('/', (await j.component(name)).name);
    assert.equal(await health(), 200);
    facts.first = await stored();
    await writeEarlierRelease();

    // Same release, complete work: health builds nothing.
    await deploy('release-1');
    for (let call = 0; call < 3; call++) assert.equal(await health(), 200);
    facts.sameRelease = await stored();

    // A new release.
    await deploy('release-2');
    facts.newReleaseHealth = await health();
    facts.newRelease = await stored();
    facts.newRelease.served = await served();
    await deploy('release-2');
    assert.equal(await health(), 200);
    facts.newReleaseAgain = await stored();

    // Pending work with an unchanged release.
    await j.db.prepare('UPDATE public_snapshot_work SET requested_revision = completed_revision + 1').run();
    await deploy('release-2');
    facts.pendingHealth = await health();
    facts.pending = await stored();

    // The database was reset (a new one under the old bucket): its counters restart, the bucket's pointer does not.
    await j.db.batch([
      j.db.prepare('DELETE FROM snapshot_builds'),
      j.db.prepare("UPDATE snapshot_build_control SET next_generation = 0"),
      j.db.prepare('UPDATE public_snapshot_work SET requested_revision = 1, completed_revision = 0, retry_lease_id = NULL, retry_lease_until = NULL'),
    ]);
    await writeEarlierRelease();
    facts.beforeReset = await stored();
    await deploy('release-4');
    facts.resetHealth = await health();
    await afterDatabaseReset?.(j);
    facts.reset = await stored();
    facts.reset.served = await served();
    facts.resetBuilds = (await j.db.prepare('SELECT status, error FROM snapshot_builds ORDER BY started_at').all()).results;

    // Pre-launch survives a rebuild.
    const prelaunch = await j.api('/api/app/prelaunch', { method: 'PATCH', body: JSON.stringify({ enabled: true }) });
    assert.equal(prelaunch.status, 200, prelaunch.text);
    await j.visible('/', 'Synthetic Lamp rebuild one');
    facts.prelaunchBefore = await stored();
    await writeEarlierRelease();
    await deploy('release-5');
    facts.prelaunchHealth = await health();
    facts.prelaunch = await stored();
    facts.prelaunch.served = await served();

    // The scheduled path: nothing is rebuilt that is not due, and an operator change still publishes.
    await deploy('release-5');
    await j.tick(Date.now());
    facts.cronSameRelease = await stored();
    facts.cronControl = await control();
    // An operator change still publishes through the ordinary path.
    await j.visible('/', (await j.component('Synthetic Lamp after the rebuilds')).name);
    facts.afterChange = await stored();

    // A rebuild that cannot finish (the logo object is gone) never fails health, and the next health completes it.
    await j.db.prepare("UPDATE page_settings SET logo_key = 'branding/missing', logo_content_type = 'image/png'").run();
    await deploy('release-6');
    facts.failingHealth = await health();
    facts.failing = await stored();
    facts.failingBuild = await j.db.prepare("SELECT status, error FROM snapshot_builds ORDER BY started_at DESC LIMIT 1").first();
    await j.db.prepare('UPDATE page_settings SET logo_key = NULL, logo_content_type = NULL').run();
    await deploy('release-6');
    facts.recoveredHealth = await health();
    facts.recovered = await stored();

    return { j, facts };
  } catch (cause) {
    await j.close();
    throw cause;
  }
}

const earlier = state => state.page.html.includes(OLD_MARK);
const offersSubscription = html => /action="\/subscribe|href="\/#subscribe"|id="subscribe"/.test(html);

export async function snapshotReleaseRebuildFlow() {
  const { j, facts } = await observeSnapshotReleaseRebuild();
  try {
    const { first } = facts;
    assert.equal(first.pointer.releaseIdentity, 'release-1', 'the stored page names the release that built it');
    assert.ok(first.pointer.generation >= 3);
    assert.equal(first.work.completed, first.work.requested, 'ordinary builds complete their work');

    // (b) no churn for the same release.
    assert.equal(facts.sameRelease.builds, first.builds, 'health on the release that built the page builds nothing');
    assert.equal(facts.sameRelease.pointer.generation, first.pointer.generation);
    assert.ok(earlier(facts.sameRelease), 'and leaves the stored page as it was');

    // (a) a new release rebuilds before health answers; the next health on it does not.
    assert.equal(facts.newReleaseHealth, 200);
    assert.equal(facts.newRelease.builds, first.builds + 1, 'a new release is rebuilt once');
    assert.equal(facts.newRelease.pointer.releaseIdentity, 'release-2');
    assert.ok(facts.newRelease.pointer.generation > first.pointer.generation);
    assert.ok(!earlier(facts.newRelease), 'the page now shows what the new release renders');
    assert.ok(facts.newRelease.served.html.includes('>Subscribe to status updates<') && !facts.newRelease.served.html.includes(OLD_TEXT), 'and a reader is served it');
    assert.deepEqual(facts.newRelease.work, { requested: facts.newRelease.work.requested, completed: facts.newRelease.work.requested });
    assert.equal(facts.newReleaseAgain.builds, facts.newRelease.builds, 'the second health on the same release builds nothing');
    assert.equal(facts.newReleaseAgain.pointer.version, facts.newRelease.pointer.version);

    // (c) pending work is retried.
    assert.equal(facts.pendingHealth, 200);
    assert.equal(facts.pending.builds, facts.newReleaseAgain.builds + 1, 'work still pending is built');
    assert.equal(facts.pending.work.completed, facts.pending.work.requested);

    // (d) a reset database still advances a pointer that is already further on.
    assert.ok(facts.beforeReset.work.completed < facts.beforeReset.work.requested);
    assert.equal(facts.resetHealth, 200);
    assert.ok(facts.reset.pointer.generation > facts.beforeReset.pointer.generation, `the pointer advances past ${facts.beforeReset.pointer.generation}: ${facts.reset.pointer.generation}`);
    assert.equal(facts.reset.pointer.releaseIdentity, 'release-4');
    assert.ok(!earlier(facts.reset));
    assert.equal(facts.reset.work.completed, facts.reset.work.requested);
    assert.deepEqual(facts.resetBuilds.map(build => build.status), ['published']);
    assert.equal(facts.resetBuilds[0].error, null, 'the build was not superseded');

    // (e) pre-launch keeps its omissions and headers through a rebuild.
    assert.ok(facts.prelaunchBefore.pointer.prelaunch);
    assert.ok(!offersSubscription(facts.prelaunchBefore.page.html));
    assert.equal(facts.prelaunchHealth, 200);
    assert.equal(facts.prelaunch.pointer.releaseIdentity, 'release-5');
    assert.ok(facts.prelaunch.pointer.generation > facts.prelaunchBefore.pointer.generation, 'the pre-launch page was rebuilt');
    assert.ok(!earlier(facts.prelaunch));
    assert.ok(facts.prelaunch.pointer.prelaunch);
    assert.ok(!offersSubscription(facts.prelaunch.served.html) && !offersSubscription(facts.prelaunch.page.html), 'a rebuilt pre-launch page offers no way to subscribe');
    assert.equal(facts.prelaunch.served.robots, 'noindex, nofollow');
    assert.equal((await (await j.publicResponse('/robots.txt')).text()), 'User-agent: *\nDisallow: /\n');

    // (f) the scheduled path builds nothing that is not due.
    assert.equal(facts.cronSameRelease.builds, facts.prelaunch.builds, 'Cron on the release that built the page builds nothing');
    assert.equal(facts.cronSameRelease.pointer.version, facts.prelaunch.pointer.version);

    // A failing rebuild never fails health; the next health finishes it.
    assert.equal(facts.failingHealth, 200, 'health answers although the rebuild failed');
    assert.equal(facts.failingBuild.status, 'failed');
    assert.equal(facts.failing.pointer.version, facts.afterChange.pointer.version, 'the published page is untouched by the failed build');
    assert.ok(facts.failing.work.completed < facts.failing.work.requested, 'the failed work stays pending');
    assert.equal(facts.recoveredHealth, 200);
    assert.equal(facts.recovered.pointer.releaseIdentity, 'release-6');
    assert.equal(facts.recovered.work.completed, facts.recovered.work.requested);
  } finally {
    await j.close();
  }
}
