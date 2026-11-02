import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { retainedPublicSnapshot } from './retained-public-snapshot.mjs';

// Inspect the retained inventory, then read every artifact through its public URL.
// All incident and intake mutations still use authenticated native HTTP doors.
async function publicSnapshot({ runtime, publicOrigin, sql, privateIncidents }) {
  const configPath = runtime.env.LAMP_WRANGLER_CONFIG;
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const bucket = config.r2_buckets.find(row => row.binding === 'SNAPSHOTS').bucket_name;
  function object(key) {
    return JSON.parse(execFileSync('pnpm', ['exec', 'wrangler', 'r2', 'object', 'get', `${bucket}/${key}`, '--local', '--persist-to', runtime.state, '--config', configPath, '--pipe'], { env: runtime.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000 }));
  }
  return retainedPublicSnapshot({ query: sql, object, response: path => fetch(`${publicOrigin}${path}`, { redirect: 'manual' }), privateIncidents });
}

async function receipt(api, id) {
  const response = await api(`/api/app/intake/receipts?receipt=${id}`);
  assert.equal(response.status, 200, response.text);
  assert.equal(response.body.receipts.length, 1, 'read the returned receipt independently');
  assert.equal(response.body.receipts[0].id, id);
  return response.body.receipts[0];
}

export async function presetRecoveryFlow({ api, post, runtime, publicOrigin, sql, sources, payloads, t }) {
  const keys = { datadog: 'cycle-1', uptimerobot: '778', betterstack: '25', pingdom: '12345' };
  const privateIncidents = Object.values(sources).map(source => source.incident);
  const snapshot = () => publicSnapshot({ runtime, publicOrigin, sql, privateIncidents });
  const updates = () => sql('SELECT * FROM incident_updates ORDER BY id');
  async function send(source, payload) {
    const started = Date.now();
    const response = await fetch(`${source.endpointUrl}/${source.token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await response.json();
    const finished = Date.now();
    assert.equal(response.status, 202, JSON.stringify(body));
    assert.equal(body.replayed, false, 'a new transition must not reuse a body-hash replay');
    return { body, started, finished };
  }
  async function recover(preset, source, up, firing, key) {
    const before = await receipt(api, firing.receiptId);
    assert.deepEqual([before.sourceId, before.deduplicationKey, before.incidentId, before.state, before.recoveredAt], [source.id, key, firing.incidentId, 'firing', null]);
    const result = await send(source, up);
    assert.equal(result.body.incidentId, firing.incidentId, `${preset} recovers its matching incident`);
    assert.notEqual(result.body.receiptId, firing.receiptId);
    const recovered = await receipt(api, result.body.receiptId);
    assert.deepEqual([recovered.sourceId, recovered.deduplicationKey, recovered.incidentId, recovered.state, recovered.error], [source.id, key, firing.incidentId, 'recovered', null]);
    assert.equal(recovered.recoveredAt, recovered.receivedAt);
    const instant = Date.parse(recovered.recoveredAt);
    assert.ok(instant >= result.started && instant <= result.finished, `${preset} recovery instant is bounded by its request`);
    assert.deepEqual(await receipt(api, firing.receiptId), { ...before, recoveredAt: recovered.recoveredAt, updatedAt: recovered.recoveredAt }, `${preset} retains the original firing evidence and associates the same recovery instant`);
    return result.body;
  }
  for (const [preset, source] of Object.entries(sources)) {
    const before = await snapshot();
    const beforeUpdates = updates();
    await recover(preset, source, payloads[preset].up, source.firing, keys[preset]);
    const loaded = await api(`/api/app/incidents/${source.firing.incidentId}`);
    assert.equal(loaded.status, 200, loaded.text);
    assert.equal(loaded.body.incident.lifecycle, 'Resolved', `${preset}: draft resolved`);
    assert.equal(loaded.body.incident.updates.length, 0, `${preset}: still nothing public`);
    assert.deepEqual(updates(), beforeUpdates, `${preset}: recovery appends no published update`);
    assert.deepEqual(await snapshot(), before, `${preset}: unpublished recovery preserves every public artifact, response byte and generation`);
    for (const other of Object.values(sources).filter(other => other !== source && !other.recovered)) {
      assert.equal((await api(`/api/app/incidents/${other.firing.incidentId}`)).body.incident.lifecycle, 'Investigating', 'another preset draft is not resolved');
    }
    source.recovered = true;
    t.diagnostic(`PROBE INTAKE-007 1 ${preset}: authenticated recovery -> matching Resolved draft, zero updates, unchanged ${before.artifacts.length} public artifacts and private permalink 404`);
  }
  // New monitor keys ensure every published case is a fresh firing and recovery.
  const publishedPayloads = {
    datadog: { key: 'cycle-2', down: { ...payloads.datadog.down, alert_cycle_key: 'cycle-2' }, up: { ...payloads.datadog.up, alert_cycle_key: 'cycle-2' } },
    uptimerobot: { key: '1778', down: { ...payloads.uptimerobot.down, monitorID: '1778' }, up: { ...payloads.uptimerobot.up, monitorID: '1778' } },
    betterstack: { key: '125', down: { data: { ...payloads.betterstack.down.data, id: '125' } }, up: { data: { ...payloads.betterstack.up.data, id: '125' } } },
    pingdom: { key: '22345', down: { ...payloads.pingdom.down, check_id: 22345 }, up: { ...payloads.pingdom.up, check_id: 22345 } },
  };
  for (const [preset, source] of Object.entries(sources)) {
    const payload = publishedPayloads[preset];
    const { body: firing } = await send(source, payload.down);
    assert.notEqual(firing.incidentId, source.firing.incidentId, 'published scenario has a fresh incident');
    const draft = { lifecycle: 'Investigating', affectedAudience: 'Shoppers.', customerImpact: `The ${preset} shop is down.`, whatStillWorks: 'Browsing works.', details: 'Responders are checking the monitor.', nextUpdateAt: new Date(Date.now() + 3_600_000).toISOString() };
    assert.equal((await api(`/api/app/incidents/${firing.incidentId}/draft`, { method: 'PUT', body: JSON.stringify(draft) })).status, 200);
    const publication = await post(`/api/app/incidents/${firing.incidentId}/publish`, { channels: [] });
    assert.equal(publication.status, 200, publication.text);
    const incidentBefore = (await api(`/api/app/incidents/${firing.incidentId}`)).body.incident;
    assert.equal(incidentBefore.lifecycle, 'Investigating');
    assert.equal(incidentBefore.updates.length, 1, 'published control has a real committed update');
    const before = await snapshot();
    const publicIncident = before.responses.find(row => row.key === `incidents/${incidentBefore.reference}.html`);
    assert.ok(publicIncident, 'the published control has a served public permalink');
    assert.ok(Buffer.from(publicIncident.bytes, 'base64').toString('utf8').includes(draft.customerImpact), 'the public control contains the submitted update');
    const beforeUpdates = updates();
    await recover(preset, source, payload.up, firing, payload.key);
    const incidentAfter = (await api(`/api/app/incidents/${firing.incidentId}`)).body.incident;
    assert.equal(incidentAfter.lifecycle, incidentBefore.lifecycle, `${preset}: published lifecycle is retained`);
    assert.deepEqual(incidentAfter.updates, incidentBefore.updates, `${preset}: all native published-update fields are retained`);
    assert.deepEqual(updates(), beforeUpdates, `${preset}: complete persisted published records are unchanged`);
    assert.deepEqual(await snapshot(), before, `${preset}: published recovery changes no public artifact or generation`);
    t.diagnostic(`PROBE INTAKE-007 2 ${preset}: receipt-specific native reads -> matching recovery and firing evidence, request-bounded instant, unchanged published lifecycle and complete updates`);
  }
}
