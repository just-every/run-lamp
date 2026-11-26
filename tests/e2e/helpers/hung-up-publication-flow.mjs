import assert from 'node:assert/strict';
import { openStatusJourney, eventually } from './status-journey.mjs';

const EDGE = 'https://cancelled-request.example.test/';

/** A client that stops waiting never leaves the stored page claimed by a build nothing runs.
 * On ChargeDesk a monitor read /health with a ten-second wait; the request built the page itself,
 * Cloudflare cancelled it with the build's row still `building`, and Cron could not publish for
 * five minutes. The Worker, D1, R2, Queue and Cron entry are real and the client really hangs up.
 * Local workerd does not cancel that request, so the journey's network edge does what Cloudflare
 * does: a selector write a hung-up request reaches never resumes. */
export async function hungUpPublicationFlow() {
  let clientGone = false;
  const j = await openStatusJourney({
    extraBindings: { LAMP_TEST_CANCEL_EDGE: EDGE },
    providerEdge: async request => {
      if (!request.url.startsWith(EDGE)) return undefined;
      if (clientGone && new URL(request.url).searchParams.get('entry') === 'request') await new Promise(() => {});
      return new Response(null, { status: 204 });
    },
  });
  try {
    const state = () => j.db.prepare(`SELECT requested_revision - completed_revision AS pending,
      (SELECT count(*) FROM snapshot_builds WHERE status = 'building') AS building,
      (SELECT count(*) FROM snapshot_builds WHERE status = 'failed') AS failed,
      (SELECT count(*) FROM snapshot_builds) AS builds FROM public_snapshot_work WHERE id = 'default'`).first();
    const published = description => eventually(state, now => !now.pending && !now.building, description);
    /** Sends `request` as a client that stops waiting after `waitMs`; returns its answer, or the abort. */
    const hangUp = async (request, waitMs = 400) => {
      clientGone = true;
      try {
        const answer = await request(AbortSignal.timeout(waitMs)).then(response => response.status, cause => cause.name);
        // Whatever the request still runs after its answer meets the same cancellation.
        await new Promise(resolve => setTimeout(resolve, 300));
        return answer;
      } finally { clientGone = false; }
    };
    const component = await j.component('Synthetic Lamp hang-up API');
    await published('the first page is published');
    const before = await state();

    // A monitor's /health on a fresh isolate with work pending.
    await j.db.prepare("UPDATE public_snapshot_work SET requested_revision = completed_revision + 1 WHERE id = 'default'").run();
    await j.restart();
    const health = await hangUp(signal => j.raw('/health', { signal }));
    await j.tick(Date.now());
    const afterHealth = await published('the page a hung-up health probe found pending is published');

    // A pushed metric point with work pending.
    const { metric } = await j.json('/api/app/metrics', 'POST', { componentId: component.id, provider: 'push', name: 'Synthetic Lamp latency', unit: 'ms' }, 201);
    await published('the metric is published');
    await j.db.prepare("UPDATE public_snapshot_work SET requested_revision = completed_revision + 1 WHERE id = 'default'").run();
    const minute = Math.floor(Date.now() / 60_000) * 60_000;
    const pushed = await hangUp(signal => j.request(`/api/app/metrics/${metric.id}/points`, { method: 'POST', body: JSON.stringify({ points: [{ at: minute, value: 120 }] }), signal }));
    await j.tick(Date.now());
    const afterPush = await published('the page a hung-up metric push found pending is published');

    // An operator's save on a page whose last build took longer than a request can hold one.
    await j.db.prepare("UPDATE snapshot_builds SET started_at = strftime('%Y-%m-%dT%H:%M:%fZ', finished_at, '-40 seconds') WHERE status = 'published'").run();
    const saved = await hangUp(signal => j.request(`/api/app/components/${component.id}/standing-claim`, { method: 'PUT', body: JSON.stringify({ state: 'Major outage' }), signal }));
    await j.tick(Date.now());
    const afterSave = await published('the page an interrupted operator save changed is published');
    await j.visible('/', 'Major outage');

    return { j, facts: { before, health, afterHealth, pushed, afterPush, saved, afterSave } };
  } catch (cause) {
    await j.close();
    throw cause;
  }
}

export async function hungUpPublication() {
  const { j, facts } = await hungUpPublicationFlow();
  try {
    // Each caller is answered inside the time it waited, and the build runs where nothing cancels it.
    assert.deepEqual([facts.health, facts.pushed, facts.saved], [200, 200, 200]);
    for (const after of [facts.afterHealth, facts.afterPush, facts.afterSave]) assert.equal(after.failed, facts.before.failed, 'no build was left for the sweep to fail');
    assert.ok(facts.afterSave.builds > facts.afterPush.builds, 'the save on a slow page is built');
  } finally {
    await j.close();
  }
}
