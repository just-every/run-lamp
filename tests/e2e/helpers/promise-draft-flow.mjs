import assert from 'node:assert/strict';
import { openStatusJourney, eventually } from './status-journey.mjs';
import { promiseDraftFixture, assertPromiseDraft } from './promise-draft-fixture.mjs';
import { retainedPublicProof } from './retained-public-proof.mjs';

export async function promiseDraftFlow(t) {
  const modelRequests = [];
  const aiEndpoint = 'https://ai.example.test/v1/chat/completions';
  const j = await openStatusJourney({ workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts',
    extraBindings: { AI_PROVIDER_URL: aiEndpoint, AI_PROVIDER_API_KEY: 'synthetic-lamp-promise-model-1', AI_PROVIDER_MODEL: 'synthetic-lamp-promise-1' },
    providerEdge: async request => {
      if (request.url === aiEndpoint) { modelRequests.push(await request.text()); return Response.json({ error: 'Synthetic Lamp model must not be requested' }, { status: 503 }); }
    },
  });
  try {
    const clock = async now => assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now }) })).status, 204);
    const subscriber = ['synthetic-lamp-promise-reader', 'example.test'].join('@');
    const scenario = await promiseDraftFixture({ ...j, clock, beforePublication: async component => {
      const response = await j.raw(`${j.publicOrigin}/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: subscriber, componentId: component.id }).toString() });
      assert.equal(response.status, 202, await response.text());
      const invitation = await eventually(() => j.messages.find(message => message.to.includes(subscriber)), Boolean, 'the reader receives real confirmation mail');
      const confirmed = await j.raw(invitation.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0]);
      assert.equal(confirmed.status, 200);
    } });
    await eventually(() => j.messages.filter(message => message.to.includes(subscriber)), rows => rows.length === 2, 'explicit publication reaches the confirmed reader');
    assert.equal((await j.json('/api/app/ai/status')).configured, true, 'a configured model makes the silent preparation assertion meaningful');
    const bucket = await j.runtime.getR2Bucket('SNAPSHOTS');
    const snapshot = () => retainedPublicProof({ ...j, bucket });
    const before = await snapshot();
    const keys = new Set(before.artifacts.map(item => item.key));
    for (const key of ['page.html', `incidents/${scenario.published.reference}.html`, 'feed.atom', 'feed.rss', 'history.atom', 'history.rss', 'widget.js', 'embed/script.js', 'badge.svg', 'api/v2/summary.json', 'api/public/v1/incidents.json']) assert.ok(keys.has(key), `the settled inventory includes ${key}`);
    const rows = async table => (await j.db.prepare(`SELECT * FROM ${table} ORDER BY id`).all()).results;
    const publications = await rows('incident_updates');
    const notifications = await rows('notification_deliveries');
    const otherDeliveries = await rows('component_notification_deliveries');
    const reportDeliveries = await rows('report_notification_deliveries');
    const dispatches = async () => (await j.db.prepare("SELECT * FROM notification_outbox WHERE kind='delivery-dispatch' ORDER BY id").all()).results;
    const queuedPublications = await dispatches();
    assert.ok(notifications.length > 0, 'the publication has a real subscriber delivery');
    const subscriberMessages = j.messages.filter(message => message.to.includes(subscriber));
    const owner = (await j.json('/api/app/session')).operator;
    await clock(scenario.prepareAt); await j.tick(scenario.prepareAt);
    const draft = await assertPromiseDraft(j.json, scenario);
    const due = () => j.messages.filter(message => message.subject.includes(scenario.published.reference) && /update due at/i.test(message.subject));
    await eventually(due, rows => rows.length === 1, 'one owner reminder reaches the provider');
    assert.deepEqual(due()[0].to, [owner.email]);
    assert.ok(due()[0].text.includes(`/app/incidents/${scenario.id}#prepared-draft`), 'the owner reminder links the prepared composer');
    for (const at of [scenario.prepareAt, scenario.prepareAt + 60_000]) {
      await clock(at); await j.tick(at);
      assert.deepEqual((await j.read(scenario.id)).draft, draft, 'repeat triggers retain every prepared field and identity');
    }
    assert.equal(due().length, 1);
    assert.deepEqual(await rows('incident_updates'), publications);
    assert.deepEqual(await rows('notification_deliveries'), notifications, 'preparation creates no subscriber delivery and mutates no existing delivery');
    assert.deepEqual(await rows('component_notification_deliveries'), otherDeliveries);
    assert.deepEqual(await rows('report_notification_deliveries'), reportDeliveries);
    assert.deepEqual(await dispatches(), queuedPublications, 'preparation queues no subscriber publication work');
    assert.deepEqual(j.messages.filter(message => message.to.includes(subscriber)), subscriberMessages);
    assert.deepEqual(modelRequests, [], 'preparation makes no model request');
    assert.deepEqual(await snapshot(), before, 'preparation preserves the complete artifact inventory, every retained byte, every public response byte and generation identity');
    t.diagnostic(`PROBE AGENT-002 acceptance-4: signed post-publication intake and native Cron at the ten-minute boundary -> ${scenario.expectedEvidence.length} complete evidence entries and ${scenario.citations.length} independently expected citations, shortened wording, stable repeat triggers and one linked owner reminder`);
    t.diagnostic(`PROBE AGENT-002 acceptance-5: native Cron preparation -> ${before.artifacts.length} retained artifacts and public responses unchanged with their generation; original commitment and complete publications retained; existing reader receives no additional notification; configured model receives zero requests`);
    await clock(Date.parse(scenario.commitment) + 1); await j.tick(Date.parse(scenario.commitment) + 1);
    assert.equal((await j.read(scenario.id)).overdue, true);
    assert.ok((await j.publicText(`/incidents/${scenario.published.reference}`)).includes(scenario.commitment), 'without publication the original public commitment survives overdue');

    // A departed communication owner leaves the next promise to all remaining
    // communicators. Invitations, role changes and revocation use native doors.
    const departing = ['synthetic-lamp-promise-departing', 'example.test'].join('@');
    const communicator = ['synthetic-lamp-promise-communicator', 'example.test'].join('@');
    const people = [];
    await j.signIn(undefined, { fresh: true });
    for (const email of [departing, communicator]) {
      await j.json('/api/app/operators/invite', 'POST', { email, displayName: email === departing ? 'Departing communicator' : 'Remaining communicator' }, 202);
      await j.signIn(email);
      people.push((await j.json('/api/app/session')).operator);
      await j.signIn();
    }
    await j.json(`/api/app/operators/${people[1].id}/role`, 'POST', { role: 'communicator' });
    await j.json(`/api/app/incidents/${scenario.id}/owner`, 'PUT', { operatorId: people[0].id });
    const revoked = await j.request(`/api/app/operators/${people[0].id}/revoke-access`, { method: 'POST', body: '{}' });
    assert.equal(revoked.status, 204);
    assert.equal((await j.read(scenario.id)).unowned, true);
    const nextCommitment = new Date(Date.parse(scenario.commitment) + 3600_000).toISOString();
    await j.save(scenario.id, { ...scenario.wording, nextUpdateAt: nextCommitment }); await j.publish(scenario.id);
    const mailOffset = j.messages.length;
    const nextPreparation = Date.parse(nextCommitment) - 10 * 60_000;
    await clock(nextPreparation); await j.tick(nextPreparation); await j.tick(nextPreparation);
    const unownedMail = () => j.messages.slice(mailOffset).filter(message => message.subject.includes(scenario.published.reference) && /update due at/i.test(message.subject));
    await eventually(unownedMail, rows => rows.length === 2, 'the unowned promise reaches every remaining communicator once');
    assert.deepEqual(unownedMail().flatMap(message => message.to).sort(), [owner.email, communicator].sort());
    assert.ok(unownedMail().every(message => message.text.includes(`/app/incidents/${scenario.id}#prepared-draft`)));
    assert.equal((await j.read(scenario.id)).draft.agentPreparation.forOwnerId, null);
    t.diagnostic('PROBE AGENT-002 acceptance-2: native owner revocation and next commitment -> unowned preparation and one linked reminder per remaining communicator, none to the revoked owner');
  } finally { await j.close(); }
}
