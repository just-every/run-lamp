import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { openSubscriberManagementFixture, eventuallySubscriber } from './subscriber-management-fixture.mjs';

function publicPath(key) {
  if (key === 'page.html') return '/';
  if (key === 'history.html') return '/history';
  if (key === 'status.json') return '/api/public/status';
  if (key === 'not-found.html') return '/incidents/synthetic-lamp-missing';
  if (key.startsWith('aliases/')) return decodeURIComponent(key.slice('aliases/'.length, -5));
  if (/^(?:incidents|maintenance|history)\/.+\.html$/.test(key)) return `/${key.slice(0, -5)}`;
  const collection = /^api\/public\/v1\/(components|incidents|maintenance)(?:\/(.+))?\.json$/.exec(key);
  if (collection) return `/api/public/v1/${collection[1]}${collection[2] ? `?cursor=${collection[2]}` : ''}`;
  return `/${key}`;
}

/** Only the provider edges and Worker clock are controlled. Every write uses
 * native authenticated routes; privacy is checked against populated artifacts. */
export async function scheduledUpdateFlow(t) {
  const f = await openSubscriberManagementFixture({ workerEntry: 'tests/e2e/helpers/operator-email-worker.ts' });
  const { api, post, raw, db, publicOrigin } = f;
  const json = async (path, method = 'GET', body, status = 200) => {
    const result = await api(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(result.status, status, `${method} ${path}: ${result.text}`);
    return result.body;
  };
  const read = async id => (await json(`/api/app/incidents/${id}`)).incident;
  const clock = async now => {
    const response = await raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now }) });
    assert.equal(response.status, 204, await response.text());
  };
  const tick = async now => {
    await clock(now);
    const result = await (await f.runtime.getWorker()).scheduled({ cron: '* * * * *', scheduledTime: now });
    assert.equal(result.outcome, 'ok', 'the real scheduled handler succeeds with Worker Date and event time advanced together');
  };
  const publicRead = async path => {
    const response = await raw(`${publicOrigin}${path}`);
    return { status: response.status, version: response.headers.get('x-lamp-snapshot-version'), generatedAt: response.headers.get('x-lamp-snapshot-generated-at'), location: response.headers.get('location'), body: Buffer.from(await response.arrayBuffer()).toString('base64') };
  };
  const bucket = await f.runtime.getR2Bucket('SNAPSHOTS');
  const snapshot = async privateIncident => {
    await eventuallySubscriber(async () => {
      const work = await db.prepare('SELECT requested_revision, completed_revision FROM public_snapshot_work').first();
      const building = await db.prepare("SELECT count(*) AS count FROM snapshot_builds WHERE status = 'building'").first();
      return Boolean(work && work.requested_revision === work.completed_revision && building.count === 0);
    }, Boolean, 'all requested public artifacts settle');
    const pointer = await (await bucket.get('snapshots/current.json')).json();
    const retained = await (await bucket.get(`snapshots/${pointer.version}/retained.json`)).json();
    assert.equal(retained.version, pointer.version);
    const artifacts = retained.artifacts.toSorted((a, b) => a.key.localeCompare(b.key));
    assert.ok(artifacts.some(row => row.key.startsWith('incidents/')), 'privacy proof includes an existing published incident');
    const responses = [];
    for (const artifact of artifacts) {
      const response = await publicRead(publicPath(artifact.key));
      assert.equal(response.status, artifact.key === 'not-found.html' ? 404 : artifact.contentType === 'application/vnd.lamp.redirect+json' ? 301 : 200, artifact.key);
      assert.equal(response.generatedAt, pointer.generatedAt, artifact.key);
      responses.push({ key: artifact.key, ...response });
    }
    const absent = await publicRead(`/incidents/${privateIncident.reference}`);
    assert.equal(absent.status, 404, 'the scheduled incident has no public permalink before eligibility');
    for (const value of [privateIncident.id, privateIncident.reference, privateIncident.title, ...Object.values(fields)]) {
      for (const artifact of artifacts) assert.ok(!artifact.body.includes(value), `${artifact.key} excludes the scheduled draft`);
      for (const response of [...responses, absent]) assert.ok(!Buffer.from(response.body, 'base64').toString().includes(value), 'public response excludes the scheduled draft');
    }
    return { pointer, artifacts, responses, absent };
  };
  const notificationWork = async () => [...await f.databaseState()].filter(([name]) => /notification|delivery|channel_selections/.test(name));
  const start = Date.now() + 60_000;
  const email = ['synthetic-lamp-scheduled-reader', 'example.test'].join('@');
  const contact = ['synthetic-lamp-scheduled-webhook', 'example.test'].join('@');
  const reviewer = ['synthetic-lamp-scheduled-reviewer', 'example.test'].join('@');
  const fields = {
    affectedAudience: 'Synthetic Lamp scheduled API customers',
    customerImpact: 'Synthetic Lamp scheduled requests will be delayed.',
    whatStillWorks: 'Synthetic Lamp scheduled dashboard remains available.',
    details: 'Synthetic Lamp scheduled engineers are isolating the queue.',
  };
  try {
    await clock(start);
    f.recoverWebhook();
    const component = await f.createComponent('Synthetic Lamp scheduled API');
    await json('/api/app/operators/invite', 'POST', { email: reviewer, displayName: 'Synthetic Lamp scheduled reviewer' }, 202);
    const create = async title => (await json('/api/app/incidents', 'POST', { title, components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }] }, 201)).incident;
    const save = (incident, wording) => json(`/api/app/incidents/${incident.id}/draft`, 'PUT', { lifecycle: 'Identified', nextUpdateAt: new Date(start + 3_600_000).toISOString(), ...wording });
    const review = async incident => {
      await f.signIn(reviewer);
      await json(`/api/app/incidents/${incident.id}/draft/review`, 'POST', {});
      await f.signIn();
    };
    const existing = await create('Synthetic Lamp existing public incident');
    await save(existing, { affectedAudience: 'Existing customers', customerImpact: 'Existing requests are delayed.', whatStillWorks: '', details: 'Existing public investigation.' });
    await review(existing);
    await json(`/api/app/incidents/${existing.id}/publish`, 'POST', { channels: [] });

    const selected = [];
    for (const input of [
      { channel: 'email', email },
      { channel: 'webhook', destination: 'https://receiver.example.test/synthetic-lamp-1', contactEmail: contact },
    ]) {
      const response = await post('/api/app/subscribers', { ...input, componentIds: [component.id], eventKinds: ['incidents'] });
      assert.equal(response.status, 201, response.text);
      await f.confirm(input.email ?? input.contactEmail);
      selected.push(response.body.subscriber);
    }
    const subscribers = await f.list();
    assert.deepEqual(subscribers.map(row => row.id).sort(), selected.map(row => row.id).sort());
    for (const subscriber of subscribers) {
      assert.equal(subscriber.state, 'active', 'each selected transport has a confirmed recipient');
      assert.deepEqual(subscriber.componentSelections.map(row => row.componentId), [component.id]);
    }

    const incident = await create('Synthetic Lamp future private publication');
    await save(incident, fields);
    await review(incident);
    const publishAt = new Date(start + 300_000).toISOString();
    const beforeSchedule = await snapshot(incident);
    await json(`/api/app/incidents/${incident.id}/draft/schedule`, 'POST', { publishAt, channels: ['email', 'webhook'] }, 202);
    const saved = (await read(incident.id)).draft;
    assert.equal(saved.scheduledPublishAt, publishAt);
    assert.deepEqual(saved.scheduledChannels, ['email', 'webhook']);
    assert.ok(saved.reviewedAt, 'the successful scheduled case satisfies required review');
    for (const [key, value] of Object.entries(fields)) assert.equal(saved[key], value);
    const workBefore = await notificationWork();
    const mailBefore = [f.messagesFor(email), f.messagesFor(contact)].map(rows => [...rows]);
    const webhooksBefore = [...f.webhookRequests];
    assert.equal(webhooksBefore.length, 0);
    assert.equal((await db.prepare('SELECT count(*) AS count FROM notification_deliveries WHERE incident_update_id = ?').bind(saved.id).first()).count, 0);

    for (const at of [start, Date.parse(publishAt) - 1]) {
      await tick(at);
      const current = await read(incident.id);
      assert.deepEqual(current.draft, saved, 'early processing preserves the complete acknowledged scheduled draft');
      assert.deepEqual(current.updates, [], 'no early publication is committed');
      assert.deepEqual(await snapshot(incident), beforeSchedule, 'every retained artifact, public response byte and generation stays unchanged before time');
      assert.deepEqual(await notificationWork(), workBefore, 'no recipient, notification selection, attempt or outbox work is created early');
      assert.deepEqual([f.messagesFor(email), f.messagesFor(contact)], mailBefore, 'neither confirmed subscriber transport receives early mail');
      assert.deepEqual(f.webhookRequests, webhooksBefore, 'the confirmed webhook receives no early request');
    }
    t.diagnostic(`PROBE UPDATE-006 2: native schedule with confirmed email and webhook, repeated Cron through saved instant minus 1 ms -> unchanged draft, ${beforeSchedule.artifacts.length} populated public artifacts and generation, absent permalink, zero notification work and zero subscriber sends`);

    // Account for the minute between the saved instant and the first eligible
    // Cron, plus actual elapsed execution and readback time. publishedAt alone
    // cannot prove the deadline because the publisher retains the saved instant.
    const eligibleAt = Date.parse(publishAt) + 60_000;
    const began = performance.now();
    const elapsed = () => eligibleAt - Date.parse(publishAt) + performance.now() - began;
    await tick(eligibleAt);
    const published = await eventuallySubscriber(() => read(incident.id), row => row.updates.some(update => update.id === saved.id), 'the saved scheduled draft commits as a public update');
    const update = published.updates.find(row => row.id === saved.id);
    assert.equal(published.updates.length, 1);
    assert.equal(update.publishedAt, publishAt);
    assert.equal(update.createdAt, new Date(eligibleAt).toISOString(), 'commit execution uses the advanced Worker Date');
    assert.equal(update.lifecycle, saved.lifecycle);
    assert.equal(update.nextUpdateAt, saved.nextUpdateAt);
    for (const [key, value] of Object.entries(fields)) assert.equal(update[key], value);
    assert.equal(published.draft, null, 'publication consumes the saved draft');
    for (const path of ['/', `/incidents/${incident.reference}`]) {
      const response = await eventuallySubscriber(() => publicRead(path), row => row.status === 200 && Buffer.from(row.body, 'base64').toString().includes(fields.details), 'the committed scheduled wording reaches the public page');
      const html = Buffer.from(response.body, 'base64').toString();
      for (const value of Object.values(fields)) assert.ok(html.includes(value), path);
      assert.ok(html.includes(`datetime="${publishAt}"`), 'the public update retains its exact scheduled publication instant');
      assert.notEqual(response.version, beforeSchedule.pointer.version, 'public readback comes from the committed new generation');
    }
    const observedMs = Math.ceil(elapsed());
    assert.ok(observedMs <= 240_000, `committed publication and public readback took ${observedMs} ms after the saved instant`);
    t.diagnostic(`PROBE UPDATE-006 1: reviewed draft scheduled through native route, Worker Date and Cron advanced to saved instant plus 60000 ms -> exact saved update committed and read from public root and permalink after ${observedMs} ms (deadline 240000 ms)`);

    const deliveries = await eventuallySubscriber(async () => (await json(`/api/app/deliveries?incidentUpdateId=${update.id}&limit=100`)).deliveries,
      rows => rows.length === 2 && rows.every(row => row.channel === 'email' ? Boolean(row.providerAcceptedAt) : row.outcome === 'delivered'), 'both selected transports positively complete their native dispatch');
    assert.deepEqual(deliveries.map(row => row.subscriberId).sort(), selected.map(row => row.id).sort());
    const mail = f.messagesFor(email).filter(row => row.text.includes(fields.details));
    assert.equal(mail.length, 1, 'the selected email crosses the real serializer and recorded provider edge');
    for (const value of Object.values(fields)) assert.ok(mail[0].text.includes(value));
    const webhook = f.webhookRequests.filter(row => row.body.event === 'incident.update.published' && row.body.updates.some(item => item.id === update.id));
    assert.equal(webhook.length, 1, 'the selected webhook positively receives this committed update');
    assert.equal(webhook[0].body.incident.reference, incident.reference);
    assert.equal(webhook[0].body.incident.title, incident.title);
    assert.equal(webhook[0].body.deliveryId, deliveries.find(row => row.channel === 'webhook').id);
    const received = webhook[0].body.updates.find(item => item.id === update.id);
    for (const [key, value] of Object.entries(fields)) assert.equal(received[key], value);
    assert.equal(received.publishedAt, publishAt);
    await tick(eligibleAt);
    assert.deepEqual((await read(incident.id)).updates, published.updates, 'repeated eligible processing cannot publish the saved draft again');
    assert.equal(f.messagesFor(email).filter(row => row.text.includes(fields.details)).length, 1);
    assert.equal(f.webhookRequests.filter(row => row.body.event === 'incident.update.published' && row.body.updates.some(item => item.id === update.id)).length, 1);
    t.diagnostic('PROBE UPDATE-006 2 delivery control: after eligibility the exact committed recipient set receives one captured email and one acknowledged webhook; repeated Cron adds no update or send');
  } finally { await f.close(); }
}
