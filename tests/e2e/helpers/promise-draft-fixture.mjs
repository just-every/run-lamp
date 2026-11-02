import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

// Expected evidence is retained from submitted alerts, independently of the
// preparation response and the brief renderer. Distinct instants fix its order.
export async function promiseDraftFixture({ json, raw, publicOrigin, clock, tick, beforePublication }) {
  const started = Date.now() + 1000;
  await clock(started);
  const component = (await json('/api/app/components', 'POST', { name: 'Synthetic Lamp promise API', groupId: null, description: '', internal: false, displayOrder: 0, note: '' }, 201)).component;
  const secret = 'synthetic-lamp-promise-source-1';
  const sourceName = 'Synthetic Lamp promise monitor';
  const source = (await json('/api/app/intake/sources', 'POST', {
    name: sourceName, credentialKind: 'hmac-sha256', signingSecret: secret,
    deduplicationPath: '$.alert.id', titlePath: '$.alert.title', statePath: '$.alert.state', recoveredValue: 'recovered',
  }, 201)).source;
  const send = async (title, at) => {
    await clock(at);
    const payload = { alert: { id: 'synthetic-lamp-promise-1', title, state: 'firing' } };
    const body = JSON.stringify(payload), timestamp = new Date(at).toISOString();
    const response = await raw(`${publicOrigin}/api/intake/${source.id}`, { method: 'POST', headers: {
      'Content-Type': 'application/json', 'x-lamp-timestamp': timestamp,
      'x-lamp-signature': createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('base64url'),
    }, body });
    assert.equal(response.status, 202, await response.clone().text());
    const accepted = await response.json();
    assert.equal(accepted.replayed, false);
    return { accepted, payload, receivedAt: timestamp };
  };
  const initial = await send('Synthetic Lamp initial monitor failure', started);
  const id = initial.accepted.incidentId;
  await json(`/api/app/incidents/${id}/components`, 'POST', { componentId: component.id, state: 'Major outage', relationship: 'Primary' }, 201);
  const commitment = new Date(started + 3600_000).toISOString();
  const wording = {
    lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp API customers.',
    customerImpact: 'Requests are delayed while responders restore capacity.',
    whatStillWorks: 'Existing sessions remain available.', details: 'Responders are checking queue capacity.', nextUpdateAt: commitment,
  };
  await clock(started + 1000);
  await beforePublication?.(component);
  await json(`/api/app/incidents/${id}/draft`, 'PUT', wording);
  const publication = await json(`/api/app/incidents/${id}/publish`, 'POST', { channels: ['email'] });
  const published = (await json(`/api/app/incidents/${id}`)).incident;
  assert.equal(published.draft, null);
  assert.equal(published.updates.length, 1);
  const evidence = [];
  for (let index = 0; index < 8; index++) {
    const title = `Synthetic Lamp evidence ${index + 1}: queue ${index + 11} remains delayed; responders retained this distinct observation.`;
    const event = await send(title, started + (index + 2) * 1000);
    assert.equal(event.accepted.incidentId, id);
    evidence.push({ ref: `A${index + 2}`, text: `${sourceName}: ${title}; firing`, ...event });
  }
  const expectedEvidence = evidence.map(({ ref, text }) => ({ ref, text }));
  const citations = ['U1', ...expectedEvidence.map(item => item.ref)];
  assert.ok(expectedEvidence.reduce((length, item) => length + item.text.length, 0) > 500, 'the complete evidence needs the panel beyond composer wording limits');
  const prepareAt = Date.parse(commitment) - 10 * 60_000;
  await clock(prepareAt - 1);
  await tick(prepareAt - 1);
  assert.equal((await json(`/api/app/incidents/${id}`)).incident.draft, null, 'no preparation before the ten-minute boundary');
  return { id, component, sourceName, initial, evidence, expectedEvidence, citations, wording, commitment, publication, published, prepareAt };
}

export async function assertPromiseDraft(json, scenario) {
  const incident = (await json(`/api/app/incidents/${scenario.id}`)).incident;
  const draft = incident.draft;
  assert.ok(draft?.agentPreparation, 'native scheduled preparation creates the draft');
  assert.equal(draft.agentPreparation.preparedBy, 'Lamp');
  assert.equal(draft.agentPreparation.preparedAt, new Date(scenario.prepareAt).toISOString());
  assert.equal(draft.agentPreparation.commitmentAt, scenario.commitment);
  assert.equal(draft.agentPreparation.sourceUpdateRef, 'U1');
  assert.equal(draft.agentPreparation.noEvidenceChange, false);
  assert.deepEqual(draft.agentPreparation.evidence, scenario.expectedEvidence, 'every submitted post-publication observation is retained in order');
  assert.deepEqual(draft.agentPreparation.citations, scenario.citations, 'the original public update and every changed evidence item are cited');
  for (const field of ['lifecycle', 'affectedAudience', 'customerImpact', 'whatStillWorks', 'nextUpdateAt']) assert.equal(draft[field], scenario.wording[field], field);
  assert.ok(draft.details.length <= 500);
  assert.ok(!draft.details.includes(scenario.evidence.at(-1).payload.alert.title), 'the fixture exercises shortened composer wording');
  assert.deepEqual(incident.updates, scenario.published.updates, 'preparation retains every native publication field');
  return draft;
}
