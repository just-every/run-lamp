import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { openStatusJourney } from './helpers/status-journey.mjs';
import { retainedPublicSnapshot } from './helpers/retained-public-snapshot.mjs';

const aiEndpoint = 'https://ai.example.test/v1/chat/completions';

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
      deduplicationPath: '$.alert.id', titlePath: '$.alert.title', statePath: '$.alert.state', recoveredValue: 'recovered', componentId: component.id,
    }, 201)).source;
    const endpoint = new URL(`/api/intake/${source.id}`, j.publicOrigin).href;
    const signedAlert = payload => {
      const body = JSON.stringify(payload), at = new Date().toISOString();
      return { method: 'POST', headers: {
        'Content-Type': 'application/json', 'x-lamp-timestamp': at,
        'x-lamp-signature': createHmac('sha256', 'synthetic-lamp-source-secret').update(`${at}.${body}`).digest('base64url'),
      }, body };
    };
    const alert = payload => j.raw(endpoint, signedAlert(payload));
    const bucket = await j.runtime.getR2Bucket('SNAPSHOTS');
    const snapshot = (privateIncidents = []) => retainedPublicSnapshot({
      query: async sql => (await j.db.prepare(sql).all()).results,
      object: async key => {
        const stored = await bucket.get(key);
        assert.ok(stored, `${key} is retained`);
        return stored.json();
      },
      response: j.publicResponse, privateIncidents,
    });
    const timedAlert = async (request, key, expectedIncidentId) => {
      const started = performance.now(), wallStarted = Date.now();
      const response = await j.raw(endpoint, request);
      assert.equal(response.status, 202);
      const accepted = await response.json();
      assert.equal(accepted.replayed, false);
      assert.ok(accepted.incidentId); assert.ok(accepted.receiptId);
      if (expectedIncidentId) assert.equal(accepted.incidentId, expectedIncidentId);
      // Read both private work and the exact receipt through independent native
      // requests. Time includes the signed request and all associated readback.
      const incident = await j.read(accepted.incidentId);
      const { receipts } = await j.json(`/api/app/intake/receipts?receipt=${accepted.receiptId}`);
      const elapsed = performance.now() - started;
      assert.ok(elapsed <= 30_000, `accepted alert reaches its private draft and evidence in ${elapsed}ms`);
      assert.equal(receipts.length, 1);
      assert.deepEqual([receipts[0].id, receipts[0].sourceId, receipts[0].deduplicationKey, receipts[0].incidentId, receipts[0].state, receipts[0].error],
        [accepted.receiptId, source.id, key, accepted.incidentId, 'firing', null]);
      assert.ok(Date.parse(receipts[0].receivedAt) >= wallStarted && Date.parse(receipts[0].receivedAt) <= Date.now());
      assert.equal(incident.id, accepted.incidentId);
      assert.equal(incident.draft.incidentId, incident.id);
      assert.equal(incident.draft.lifecycle, 'Investigating');
      assert.equal(incident.updates.length, 0);
      t.diagnostic(`PROBE INTAKE-002 1: signed native alert ${key} -> HTTP 202, associated receipt and private draft in ${elapsed.toFixed(1)}ms`);
      return { response, accepted, incident };
    };
    assert.equal((await j.raw(new URL(`/api/intake/${source.id}`, j.publicOrigin).href, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
    const payload = { alert: { id: 'checkout-outage', title: 'PRIVATE monitor wording', state: 'firing' } };
    const beforeIntake = await snapshot();
    const originalRequest = signedAlert(payload);
    const first = await timedAlert(originalRequest, payload.alert.id);
    const accepted = first.response, original = first.accepted, id = original.incidentId;
    assert.equal(first.incident.title, payload.alert.title);
    const privateSnapshot = await snapshot([first.incident]);
    assert.deepEqual({ ...privateSnapshot, absent: [] }, beforeIntake, 'fresh accepted alert preserves the complete retained inventory, generation and public bytes');
    assert.ok(id); assert.ok(original.receiptId); assert.equal(original.replayed, false);
    const inventory = async () => {
      const tables = ['incidents', 'incident_drafts', 'alert_receipts'];
      const rows = await j.db.batch(tables.map(table => j.db.prepare(`SELECT * FROM ${table} ORDER BY id`)));
      return Object.fromEntries(tables.map((table, index) => [table, rows[index].results]));
    };
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
    const { accepted: distinct, incident: repeatedIncident } = await timedAlert(signedAlert({ alert: { ...payload.alert, title: 'PRIVATE changed monitor wording' } }), payload.alert.id, id);
    assert.deepEqual(repeatedIncident.draft, first.incident.draft, 'another alert retains the existing private draft');
    assert.deepEqual(await snapshot([first.incident]), privateSnapshot, 'distinct accepted delivery changes no public artifact, generation, served byte or private 404');
    assert.equal(distinct.incidentId, id); assert.notEqual(distinct.receiptId, original.receiptId);
    assert.equal(distinct.replayed, false);
    const afterDistinct = await inventory();
    assert.deepEqual(afterDistinct.incidents, beforeReplay.incidents);
    assert.deepEqual(afterDistinct.incident_drafts, beforeReplay.incident_drafts);
    assert.deepEqual(afterDistinct.alert_receipts.map(row => row.id).sort(), [original.receiptId, distinct.receiptId].sort());
    assert.equal((await alert({ alert: { title: 'Missing deduplication key', state: 'firing' } })).status, 400);
    await j.json(`/api/app/incidents/${id}/components`, 'POST', { componentId: component.id, state: 'Major outage', relationship: 'Primary' }, 201);
    await j.json(`/api/app/incidents/${id}/internal-notes`, 'POST', { body: 'PRIVATE responder investigation' }, 201);
    await j.json(`/api/app/incidents/${id}/components`, 'POST', { componentId: hidden.id, state: 'Major outage', relationship: 'Dependent' }, 201);
    const brief = async () => (await j.json(`/api/app/incidents/${id}/brief`)).brief;
    const privateBrief = await brief();
    assert.ok(privateBrief.whatWeKnow.alerts.some(row => row.source === source.name));
    assert.ok(privateBrief.whatWeKnow.components.some(row => row.name === component.name));
    assert.ok(!JSON.stringify(privateBrief).includes(hidden.name));
    assert.ok(!JSON.stringify(privateBrief).includes('PRIVATE responder investigation'));
    assert.equal((await j.read(id)).updates.length, 0);
    for (const path of ['/', '/history', '/feed.atom', '/widget.js']) assert.ok(!(await j.publicText(path)).includes(payload.alert.title));
    const incomplete = await j.read(id);
    const refused = await j.publish(id, {}, 400);
    assert.equal(refused.error, 'Who is affected and customer impact are required.');
    assert.deepEqual(await j.read(id), incomplete, 'an alert payload cannot publish or change private work without operator narrative');
    await j.save(id, { affectedAudience: 'Checkout customers', customerImpact: 'Some checkout requests fail.' });
    const before = await j.read(id);
    answer = () => Response.json({ choices: [{ message: { content: JSON.stringify({
      affectedAudience: { text: 'Checkout customers', sources: ['C1'] },
      customerImpact: { text: 'Some checkout requests fail.', sources: ['A999'] },
      whatStillWorks: { text: 'Browsing remains available.', sources: ['C1'] }, details: { text: '', sources: [] },
      lifecycle: 'Resolved', nextUpdateAt: '2099-01-01T00:00:00.000Z',
    }) } }] });
    const suggested = await j.json(`/api/app/incidents/${id}/ai-suggestion`, 'POST', {});
    assert.deepEqual(JSON.parse(requests.at(-1).messages.find(row => row.role === 'user').content), suggested.brief);
    assert.ok(!JSON.stringify(requests.at(-1)).includes('PRIVATE responder investigation'));
    assert.ok(!JSON.stringify(requests.at(-1)).includes(hidden.name));
    assert.equal(suggested.suggestion.affectedAudience.text, 'Checkout customers');
    assert.deepEqual(suggested.suggestion.customerImpact.sources, []);
    assert.ok(!('lifecycle' in suggested.suggestion) && !('nextUpdateAt' in suggested.suggestion));
    assert.deepEqual((await j.read(id)).draft, before.draft);
    assert.deepEqual((await j.read(id)).updates, before.updates);
    const publication = (await j.publish(id)).update;
    for (const field of ['lifecycle', 'affectedAudience', 'customerImpact', 'whatStillWorks', 'details', 'nextUpdateAt']) {
      assert.equal(publication[field], before.draft[field], `explicit publication uses the saved operator ${field}`);
    }
    await j.visible(`/incidents/${before.reference}`, 'Some checkout requests fail.');
    const populated = await snapshot();
    assert.ok(populated.responses.some(row => row.key === `incidents/${before.reference}.html` && Buffer.from(row.bytes, 'base64').toString('utf8').includes('Some checkout requests fail.')), 'invariance has a populated public incident control');
    const freshPayload = { alert: { id: 'synthetic-lamp-private-2', title: 'PRIVATE second alert', state: 'firing' } };
    const fresh = await timedAlert(signedAlert(freshPayload), freshPayload.alert.id);
    assert.notEqual(fresh.incident.id, id);
    const afterFresh = await snapshot([fresh.incident]);
    assert.deepEqual({ ...afterFresh, absent: [] }, populated, 'new accepted alert preserves populated public pages, feeds, widgets, badges and public APIs byte for byte');
    t.diagnostic(`PROBE INTAKE-002 2: fresh and repeated signed alerts -> unchanged ${populated.artifacts.length} retained artifacts and actual public responses, stable generation, private permalink HTTP 404`);
    t.diagnostic('PROBE INTAKE-002 3: native publish with alert-only draft -> HTTP 400 and unchanged records; saved operator narrative plus explicit publish -> matching committed fields and public permalink');
    assert.equal((await alert({ alert: { ...payload.alert, state: 'recovered' } })).status, 202);
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
