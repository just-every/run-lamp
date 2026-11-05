import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { eventually, openStatusJourney } from './helpers/status-journey.mjs';

const aiEndpoint = 'https://ai.example.test/v1/chat/completions';

async function settledPublicStory(j, { reference, published }) {
  await j.publicText('/');
  for (let attempt = 0; ; attempt++) {
    const work = await j.db.prepare('SELECT requested_revision, completed_revision FROM public_snapshot_work').first();
    const building = await j.db.prepare("SELECT id FROM snapshot_builds WHERE status = 'building'").first();
    if (work && work.requested_revision === work.completed_revision && !building) break;
    assert.ok(attempt < 100, 'public publication settles before suggestion proof');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const story = [];
  for (const path of ['/', '/history', '/feed.atom', '/feed.rss', '/widget.js', '/embed/script.js', '/api/public/status', `/incidents/${reference}`]) {
    const response = await j.publicResponse(path);
    assert.equal(response.status, path === `/incidents/${reference}` && !published ? 404 : 200, path);
    story.push({ path, status: response.status, version: response.headers.get('x-lamp-snapshot-version'), generatedAt: response.headers.get('x-lamp-snapshot-generated-at'), body: await response.text() });
  }
  assert.ok(story[0].version, 'comparison uses a retained public generation');
  return story;
}

test('INTAKE-001 INTAKE-002 INTAKE-003 INTAKE-004 INTAKE-005 DRAFT-001 DRAFT-002 DRAFT-003 DRAFT-004 AGENT-002 AGENT-004 — authenticated alert to private evidence, cited suggestion and operator-approved recovery even when AI fails', async t => {
  const requests = [];
  let answer = () => Response.json({ error: 'Provider unavailable' }, { status: 503 });
  const j = await openStatusJourney({ extraBindings: { AI_PROVIDER_URL: aiEndpoint, AI_PROVIDER_API_KEY: 'synthetic-lamp-ai-key', AI_PROVIDER_MODEL: 'synthetic-lamp-model' }, providerEdge: async request => {
    if (request.url === aiEndpoint) { requests.push(await request.json()); return answer(); }
  } });
  try {
    const component = await j.component('Checkout API');
    const hidden = await j.component('PRIVATE internal service', { internal: true });
    const source = (await j.json('/api/app/intake/sources', 'POST', {
      name: 'Customer API alerts', credentialKind: 'hmac-sha256', signingSecret: 'synthetic-lamp-source-secret',
      deduplicationPath: '$.monitor.identity.key', titlePath: '$.monitor.presentation.summary', statePath: '$.monitor.health.phase', recoveredValue: 'service-restored', componentId: component.id,
    }, 201)).source;
    const savedSource = (await j.json('/api/app/intake/sources')).sources.find(row => row.id === source.id);
    assert.ok(savedSource);
    assert.equal(savedSource.deduplicationPath, '$.monitor.identity.key');
    assert.equal(savedSource.titlePath, '$.monitor.presentation.summary');
    assert.equal(savedSource.statePath, '$.monitor.health.phase');
    assert.equal(savedSource.recoveredValue, 'service-restored');
    const receipt = async receiptId => {
      const rows = (await j.json(`/api/app/intake/receipts?receipt=${receiptId}`)).receipts;
      assert.equal(rows.length, 1);
      assert.equal(rows[0].id, receiptId);
      assert.equal(rows[0].sourceId, source.id);
      assert.equal(rows[0].sourceName, 'Customer API alerts');
      return rows[0];
    };
    const endpoint = new URL(`/api/intake/${source.id}`, j.publicOrigin).href;
    const signedAlert = payload => {
      const body = JSON.stringify(payload), at = new Date().toISOString();
      return { method: 'POST', headers: {
        'Content-Type': 'application/json', 'x-lamp-timestamp': at,
        'x-lamp-signature': createHmac('sha256', 'synthetic-lamp-source-secret').update(`${at}.${body}`).digest('base64url'),
      }, body };
    };
    const alert = payload => j.raw(endpoint, signedAlert(payload));
    assert.equal((await j.raw(new URL(`/api/intake/${source.id}`, j.publicOrigin).href, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
    const payload = {
      alert: { id: 'unmapped-key', title: 'PRIVATE unmapped title', state: 'recovered' },
      monitor: { identity: { key: 'checkout-outage' }, presentation: { summary: 'PRIVATE monitor wording' }, health: { phase: 'service-unhealthy' } },
    };
    const originalRequest = signedAlert(payload);
    const accepted = await j.raw(endpoint, originalRequest); assert.equal(accepted.status, 202);
    const original = await accepted.json(), id = original.incidentId;
    assert.ok(id); assert.ok(original.receiptId); assert.equal(original.replayed, false);
    const inventory = async () => {
      const tables = ['incidents', 'incident_drafts', 'alert_receipts'];
      const rows = await j.db.batch(tables.map(table => j.db.prepare(`SELECT * FROM ${table} ORDER BY id`)));
      return Object.fromEntries(tables.map((table, index) => [table, rows[index].results]));
    };
    assert.equal((await j.read(id)).title, 'PRIVATE monitor wording');
    const firing = await receipt(original.receiptId);
    assert.equal(firing.deduplicationKey, 'checkout-outage');
    assert.equal(firing.incidentId, id);
    assert.equal(firing.state, 'firing');
    assert.equal(firing.error, null);
    const beforeReplay = await inventory();
    assert.deepEqual(beforeReplay.incidents.map(row => row.id), [id]);
    assert.deepEqual(beforeReplay.incident_drafts.map(row => row.incident_id), [id]);
    assert.deepEqual(beforeReplay.alert_receipts.map(row => row.id), [original.receiptId]);
    // Reuse the body, timestamp and signature while the original authentication is valid.
    const replay = await j.raw(endpoint, originalRequest);
    assert.equal(replay.status, accepted.status);
    const replayed = await replay.json();
    assert.equal(replayed.incidentId, id); assert.equal(replayed.receiptId, original.receiptId);
    assert.equal(replayed.replayed, true);
    assert.deepEqual(await inventory(), beforeReplay, 'accepted replay leaves every incident, draft and alert receipt unchanged');
    const changed = await alert({ ...payload, monitor: { ...payload.monitor, presentation: { summary: 'PRIVATE changed monitor wording' } } });
    assert.equal(changed.status, 202);
    const distinct = await changed.json();
    assert.equal(distinct.incidentId, id); assert.notEqual(distinct.receiptId, original.receiptId);
    assert.equal(distinct.replayed, false);
    const afterDistinct = await inventory();
    assert.deepEqual(afterDistinct.incidents, beforeReplay.incidents);
    assert.deepEqual(afterDistinct.incident_drafts, beforeReplay.incident_drafts);
    assert.deepEqual(afterDistinct.alert_receipts.map(row => row.id).sort(), [original.receiptId, distinct.receiptId].sort());
    const missingKey = await alert({ ...payload, monitor: { ...payload.monitor, identity: {} } });
    assert.equal(missingKey.status, 400);
    const invalid = await receipt((await missingKey.json()).receiptId);
    assert.equal(invalid.state, 'invalid');
    assert.equal(invalid.deduplicationKey, null);
    assert.equal(invalid.incidentId, null);
    assert.equal(invalid.error, 'The configured deduplication path did not produce a string.');
    await j.json(`/api/app/incidents/${id}/components`, 'POST', { componentId: component.id, state: 'Major outage', relationship: 'Primary' }, 201);
    await j.json(`/api/app/incidents/${id}/internal-notes`, 'POST', { body: 'PRIVATE responder investigation' }, 201);
    await j.json(`/api/app/incidents/${id}/components`, 'POST', { componentId: hidden.id, state: 'Major outage', relationship: 'Dependent' }, 201);
    const brief = async (incidentId = id) => {
      const count = requests.length;
      const result = (await j.json(`/api/app/incidents/${incidentId}/brief`)).brief;
      assert.equal(requests.length, count, 'reading a brief never requests a model, even with a configured provider');
      return result;
    };
    const privateBrief = await brief();
    assert.ok(privateBrief.whatWeKnow.alerts.some(row => row.source === source.name));
    assert.ok(privateBrief.whatWeKnow.components.some(row => row.name === component.name));
    const receipts = (await j.json('/api/app/intake/receipts')).receipts
      .filter(row => row.incidentId === id && row.state === 'firing')
      .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt) || a.id.localeCompare(b.id));
    assert.deepEqual(receipts.map(row => row.id).sort(), [original.receiptId, distinct.receiptId].sort());
    const expectedAlerts = receipts.map((row, index) => {
      const title = row.id === original.receiptId ? 'PRIVATE monitor wording' : 'PRIVATE changed monitor wording';
      return { ref: `A${index + 1}`, receivedAt: row.receivedAt, source: 'Customer API alerts', state: 'firing', title,
        payload: { ...payload, monitor: { ...payload.monitor, presentation: { summary: title } } } };
    });
    assert.deepEqual(privateBrief.whatWeKnow, { alerts: expectedAlerts, updates: [],
      components: [{ ref: 'C1', name: 'Checkout API', state: 'Major outage', relationship: 'Primary' }] });
    const unanswered = [
      { ref: 'Q-audience', question: 'Who is affected? No affected-audience statement is written yet.' },
      { ref: 'Q-impact', question: 'What is the customer impact? No customer-impact statement is written yet.' },
      { ref: 'Q-next-update', question: 'When will you update next? The draft has no next-update time.' },
      { ref: 'Q-unpublished-alert', question: 'This draft came from an alert and has never been published. Customers see nothing about it yet.' },
    ];
    assert.deepEqual(privateBrief.whatWeDoNotKnowYet, unanswered);
    assert.deepEqual(await brief(), privateBrief, 'every fact and question retains its reference on another read');
    assert.ok(!JSON.stringify(privateBrief).includes(hidden.name));
    assert.ok(!JSON.stringify(privateBrief).includes('PRIVATE responder investigation'));
    assert.equal((await j.read(id)).updates.length, 0);

    // A fresh incident has no historical component claim to retain after detachment.
    const detached = await j.incident('Synthetic Lamp unattached draft', [component]);
    assert.deepEqual((await j.read(detached.id)).components.map(row => row.componentId), [component.id]);
    await j.json(`/api/app/incidents/${detached.id}/components/${component.id}`, 'DELETE');
    const empty = await j.read(detached.id);
    assert.deepEqual(empty.components, []);
    assert.deepEqual(empty.updates, []);
    const emptyBrief = await brief(detached.id);
    assert.deepEqual(emptyBrief.whatWeKnow, { alerts: [], updates: [], components: [] });
    assert.deepEqual(emptyBrief.whatWeDoNotKnowYet, [
      { ref: 'Q-components', question: 'Which components are affected? None is attached, so this incident cannot be published.' },
      ...unanswered.slice(0, 3),
    ]);
    assert.deepEqual(await brief(detached.id), emptyBrief);
    t.diagnostic('PROBE DRAFT-004 acceptance 2: native component DELETE then incident and brief GET -> empty attachments and exact stable Q-components question');

    for (const path of ['/', '/history', '/feed.atom', '/widget.js']) assert.ok(!(await j.publicText(path)).includes(payload.monitor.presentation.summary));
    const commitment = new Date(Date.now() - 60_000).toISOString();
    await j.save(id, { affectedAudience: 'Checkout customers', customerImpact: 'Some checkout requests fail.', nextUpdateAt: commitment });
    const answered = await brief();
    assert.deepEqual(answered.whatWeDoNotKnowYet, [unanswered[3]], 'saved wording and commitment answer only their questions');
    const before = await j.read(id);
    const privateStory = () => settledPublicStory(j, { reference: before.reference, published: false });
    const publicBefore = await privateStory();
    answer = () => Response.json({ choices: [{ message: { content: JSON.stringify({
      affectedAudience: { text: 'Checkout customers', sources: ['C1', 'Q-unpublished-alert', 'A999', 'C1'] },
      customerImpact: { text: 'Some checkout requests fail.', sources: ['A999'] },
      whatStillWorks: { text: 'Browsing remains available.', sources: ['C1'] }, details: { text: '', sources: [] },
      lifecycle: 'Resolved', nextUpdateAt: '2099-01-01T00:00:00.000Z',
    }) } }] });
    const suggested = await j.json(`/api/app/incidents/${id}/ai-suggestion`, 'POST', {});
    assert.equal(requests.length, 1, 'only the explicit suggestion crosses the provider boundary');
    assert.deepEqual(suggested.brief, answered);
    assert.deepEqual(JSON.parse(requests.at(-1).messages.find(row => row.role === 'user').content), suggested.brief);
    assert.ok(!JSON.stringify(requests.at(-1)).includes('PRIVATE responder investigation'));
    assert.ok(!JSON.stringify(requests.at(-1)).includes(hidden.name));
    assert.equal(suggested.suggestion.affectedAudience.text, 'Checkout customers');
    assert.deepEqual(suggested.suggestion.affectedAudience.sources, ['C1'], 'only known facts survive; questions, unknown references and duplicate citations do not');
    assert.deepEqual(suggested.suggestion.customerImpact.sources, []);
    assert.ok(!('lifecycle' in suggested.suggestion) && !('nextUpdateAt' in suggested.suggestion));
    assert.deepEqual((await j.read(id)).draft, before.draft);
    assert.deepEqual((await j.read(id)).updates, before.updates);
    assert.deepEqual(await j.read(id), before, 'generation preserves the complete saved incident');
    assert.deepEqual(await privateStory(), publicBefore, 'generation preserves settled public pages, both feeds, both widget doors and the private permalink refusal');
    const published = (await j.publish(id)).update;
    const publishedBrief = await brief();
    assert.deepEqual(publishedBrief.whatWeKnow.updates, [{ ref: 'U1', lifecycle: 'Identified',
      affectedAudience: before.draft.affectedAudience, customerImpact: before.draft.customerImpact,
      whatStillWorks: before.draft.whatStillWorks, details: before.draft.details,
      nextUpdateAt: commitment, publishedAt: published.publishedAt }]);
    assert.deepEqual(publishedBrief.whatWeDoNotKnowYet, [
      { ref: 'Q-overdue', question: 'The next update this incident promised is overdue.', at: commitment },
    ]);
    await j.visible(`/incidents/${before.reference}`, 'Some checkout requests fail.');
    const publishedBefore = await j.read(id);
    const publicStory = () => settledPublicStory(j, { reference: before.reference, published: true });
    const publishedStory = await publicStory();
    await j.json(`/api/app/incidents/${id}/ai-suggestion`, 'POST', {});
    assert.deepEqual(await j.read(id), publishedBefore, 'a suggestion also preserves an already published incident and its saved records');
    assert.deepEqual(await publicStory(), publishedStory, 'suggestions cannot alter the populated public story or its generation');
    t.diagnostic('PROBE DRAFT-001 2, 4 and 5: native suggestion with known, question and unknown citations plus provider lifecycle and time -> only known citations and text fields; complete saved incidents and eight settled public responses unchanged before and after explicit publication');
    const settledPublication = () => eventually(async () => {
      const work = await j.db.prepare('SELECT requested_revision, completed_revision FROM public_snapshot_work').first();
      const building = await j.db.prepare("SELECT COUNT(*) AS n FROM snapshot_builds WHERE status = 'building'").first();
      return work.requested_revision === work.completed_revision && building.n === 0;
    }, Boolean, 'all requested publications finish before comparing recovery effects');
    const publicSnapshot = async () => {
      await settledPublication();
      const bucket = await j.runtime.getR2Bucket('SNAPSHOTS');
      const pointer = await (await bucket.get('snapshots/current.json')).json();
      const bundle = await (await bucket.get(`snapshots/${pointer.version}/retained.json`)).json();
      assert.equal(bundle.version, pointer.version);
      assert.equal(bundle.generation, pointer.generation);
      assert.equal(bundle.generatedAt, pointer.generatedAt);
      const artifacts = bundle.artifacts.sort((a, b) => a.key.localeCompare(b.key));
      assert.ok(artifacts.length > 0);
      const responses = [];
      for (const artifact of artifacts) {
        let path = '/' + artifact.key;
        if (artifact.key === 'page.html') path = '/';
        else if (artifact.key === 'status.json') path = '/api/public/status';
        else if (artifact.key === 'not-found.html') path = '/incidents/synthetic-lamp-missing';
        else if (artifact.key.startsWith('aliases/')) path = decodeURIComponent(artifact.key.slice('aliases/'.length, -5));
        else if (artifact.key.endsWith('.html')) path = path.slice(0, -5);
        const collection = /^api\/public\/v1\/(components|incidents|maintenance)(?:\/([^/]+))?\.json$/.exec(artifact.key);
        if (collection) path = `/api/public/v1/${collection[1]}${collection[2] ? `?cursor=${collection[2]}` : ''}`;
        const response = await j.publicResponse(path);
        assert.equal(response.status, artifact.key === 'not-found.html' ? 404 : artifact.contentType === 'application/vnd.lamp.redirect+json' ? 301 : 200, path);
        responses.push({ path, bytes: Buffer.from(await response.arrayBuffer()), location: response.headers.get('Location'), version: response.headers.get('X-Lamp-Snapshot-Version'), generatedAt: response.headers.get('X-Lamp-Snapshot-Generated-At') });
      }
      for (const path of ['/', '/history', `/incidents/${before.reference}`, '/feed.atom', '/feed.rss', '/history.atom', '/history.rss', '/widget.js', '/embed/script.js', '/badge.svg', '/badge.json', '/api/public/status', '/api/public/v1/components', '/api/public/v1/incidents', '/api/public/v1/summary.json', '/api/v2/summary.json', '/api/v2/incidents.json']) {
        assert.ok(responses.some(row => row.path === path), `populated recovery proof includes ${path}`);
      }
      return { pointer, artifacts, responses };
    };
    const beforeRecovery = await j.read(id);
    assert.ok(beforeRecovery.updates.length > 0);
    const publicBeforeRecovery = await publicSnapshot();
    const recoveryStarted = Date.now();
    const recovered = await alert({ ...payload, monitor: { ...payload.monitor, health: { phase: 'service-restored' } } });
    const recoveryFinished = Date.now();
    assert.equal(recovered.status, 202);
    const recoveredResult = await recovered.json();
    assert.equal(recoveredResult.incidentId, id);
    const recoveredReceipt = await receipt(recoveredResult.receiptId);
    assert.equal(recoveredReceipt.deduplicationKey, 'checkout-outage');
    assert.equal(recoveredReceipt.incidentId, id);
    assert.equal(recoveredReceipt.state, 'recovered');
    assert.equal(recoveredReceipt.error, null);
    assert.equal(recoveredReceipt.recoveredAt, recoveredReceipt.receivedAt);
    assert.ok(Date.parse(recoveredReceipt.recoveredAt) >= recoveryStarted && Date.parse(recoveredReceipt.recoveredAt) <= recoveryFinished, 'recovery time is the independently bounded receipt instant');
    const recoveredFiring = await receipt(distinct.receiptId);
    assert.equal(recoveredFiring.state, 'firing');
    assert.equal(recoveredFiring.deduplicationKey, 'checkout-outage');
    assert.equal(recoveredFiring.incidentId, id);
    assert.equal(recoveredFiring.recoveredAt, recoveredReceipt.recoveredAt);
    const afterRecovery = await j.read(id);
    assert.equal(afterRecovery.lifecycle, beforeRecovery.lifecycle);
    assert.deepEqual(afterRecovery.updates, beforeRecovery.updates, 'generic recovery preserves every committed publication value');
    assert.deepEqual(await publicSnapshot(), publicBeforeRecovery, 'generic recovery preserves the complete retained artifact inventory, generation and public response bytes');
    const recoveredBrief = await brief();
    assert.deepEqual(recoveredBrief.whatWeKnow.alerts, [...expectedAlerts, {
      ref: 'A3', receivedAt: recoveredReceipt.receivedAt, source: 'Customer API alerts', state: 'recovered',
      title: 'PRIVATE monitor wording', payload: { ...payload, monitor: { ...payload.monitor, health: { phase: 'service-restored' } } },
    }]);
    assert.deepEqual(recoveredBrief.whatWeDoNotKnowYet, [
      { ref: 'Q-recovery', question: 'The monitor reports recovery; confirm, then publish Resolved.', at: recoveredReceipt.receivedAt },
      publishedBrief.whatWeDoNotKnowYet[0],
    ]);
    assert.deepEqual(await brief(), recoveredBrief);
    t.diagnostic('PROBE DRAFT-004 acceptance 5: repeated native brief GETs before and after explicit suggestion -> provider counts stay 0, 1 and 2 across explicit suggestions; saved facts, references and questions reconcile');
    const recovery = (await j.json(`/api/app/incidents/${id}/recovery-check`)).recovery;
    assert.equal(recovery.passed, false);
    assert.ok(recovery.items.some(row => row.state === 'holding'));
    assert.equal((await j.read(id)).lifecycle, 'Identified');
    answer = () => Response.json({ error: 'Provider down' }, { status: 500 });
    const failed = await j.api(`/api/app/incidents/${id}/ai-suggestion`, { method: 'POST', body: '{}' });
    assert.equal(failed.status, 502); assert.ok(failed.body.error);
    await j.save(id, { lifecycle: 'Resolved', customerImpact: 'Checkout has recovered.', nextUpdateAt: null });
    await j.publish(id, {}, 409);
    const reason = 'Operator verified customer checkout recovery';
    const resolved = (await j.publish(id, { overrideReason: reason })).update;
    assert.equal((await j.read(id)).lifecycle, 'Resolved');
    const finalBrief = await brief();
    assert.deepEqual(finalBrief.whatWeDoNotKnowYet, []);
    assert.deepEqual(finalBrief.whatWeKnow.updates, [...publishedBrief.whatWeKnow.updates, {
      ref: 'U2', lifecycle: 'Resolved', affectedAudience: resolved.affectedAudience, customerImpact: 'Checkout has recovered.',
      whatStillWorks: resolved.whatStillWorks, details: resolved.details, nextUpdateAt: null, publishedAt: resolved.publishedAt,
    }]);
    const audit = await j.json('/api/app/audit-log?limit=100');
    assert.ok(audit.entries.some(row => row.reason === reason && row.actorId && row.entityId === resolved.id), 'the publishing operator and incident are recorded with the private override reason');
    assert.ok((await j.read(id)).internalNotes.some(row => row.body.includes(reason)));
    assert.ok(!(await j.publicText(`/incidents/${before.reference}`)).includes(reason));
    await j.visible(`/incidents/${before.reference}`, 'Checkout has recovered.');
  } finally { await j.close(); }
  const without = await openStatusJourney();
  try {
    const component = await without.component('Provider-free API');
    const incident = await without.incident('Provider-free recovery', [component]);
    assert.equal((await without.json('/api/app/ai/status')).configured, false);
    await without.json(`/api/app/incidents/${incident.id}/ai-suggestion`, 'POST', {}, 404);
    await without.save(incident.id); await without.publish(incident.id);
    assert.ok((await without.json(`/api/app/incidents/${incident.id}/brief`)).brief);
  } finally { await without.close(); }
});
