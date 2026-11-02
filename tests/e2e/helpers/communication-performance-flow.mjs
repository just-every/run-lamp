import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { openStatusJourney, eventually } from './status-journey.mjs';
import { assertIncidentCsv, assertMonthlyCsv } from './communication-performance-csv.mjs';
import { moveInDoor } from '../../helpers/import-notifications.mjs';

const MINUTE = 60_000, DAY = 86_400_000;
const START = Date.UTC(2030, 0, 31, 14);
const iso = time => new Date(time).toISOString();
const email = name => [`synthetic-lamp-${name}`, 'example.test'].join('@');
const channel = (reach, kind) => reach.channels.find(row => row.channel === kind);

/** Publication facts and controlled network receipts go through the native
 * doors. No incident, delivery, attempt or outcome is written by the fixture. */
export async function communicationPerformanceFlow(t) {
  const receiptKey = Buffer.from('synthetic-lamp-performance-receipts');
  const slack = 'https://hooks.slack.com/services/synthetic-lamp-71/synthetic-lamp-72/synthetic-lamp-73';
  const teams = 'https://synthetic-lamp-71.logic.azure.com/workflows/synthetic-lamp-72/triggers/manual/paths/invoke?sig=synthetic-lamp-73';
  const webhookCalls = [], posts = [];
  const retryCounts = new Map();
  const j = await openStatusJourney({
    workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts',
    resendWebhookSecret: `whsec_${receiptKey.toString('base64url')}`,
    providerEdge: async request => {
      if ([slack, teams].includes(request.url)) {
        posts.push({ url: request.url, body: await request.json() });
        return new Response(request.url === slack ? 'ok' : '', { status: 200 });
      }
      if (new URL(request.url).origin === 'https://receiver.example.test') {
        const body = await request.json();
        const count = (retryCounts.get(body.deliveryId) ?? 0) + 1;
        retryCounts.set(body.deliveryId, count);
        webhookCalls.push({ url: request.url, body, count });
        return new Response(null, { status: request.url.endsWith('queued') || count === 1 ? 500 : 204 });
      }
    },
  });
  let now, signedInAt;
  const clock = async time => {
    const changed = await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: time }) });
    assert.equal(changed.status, 204, await changed.text());
    now = time;
    if (signedInAt === undefined || time - signedInAt >= DAY) {
      await j.signIn(undefined, { fresh: true });
      signedInAt = time;
    }
  };
  const pause = async paused => assert.equal((await j.raw('/test/effects', { method: 'PUT', body: JSON.stringify({ paused }) })).status, 204);
  const report = () => j.json('/api/app/communication-performance?month=2030-02');
  const reach = id => j.json(`/api/app/incidents/${id}/reach`);
  const deliveries = async updateId => (await j.json(`/api/app/deliveries?incidentUpdateId=${updateId}&limit=100`)).deliveries;
  const queue = async updateId => {
    // A rejected synthetic transport is expected to request Queue retry.
    return (await j.runtime.getWorker()).queue('lamp-follow-ups-jobs', [{
      id: `synthetic-lamp-performance-${updateId}-${now}`, timestamp: new Date(now), attempts: 2,
      body: { type: 'delivery-dispatch', eventId: updateId },
    }]);
  };
  const publish = async (incident, lifecycle, nextUpdateAt, channels = [], options = {}) => {
    await j.save(incident.id, {
      lifecycle, affectedAudience: 'Synthetic Lamp customers', customerImpact: `${incident.title}: ${lifecycle}`,
      whatStillWorks: 'The status page remains available.', details: 'Operators verified the service timeline.',
      nextUpdateAt,
    });
    return (await j.publish(incident.id, { channels, overrideReason: 'Synthetic Lamp operator verified recovery.', ...options })).update;
  };
  const receipt = async (delivery, type) => {
    const accepted = j.mailReceipts.find(row => row.idempotencyKey === `notification/${delivery.id}`);
    assert.ok(accepted, 'the real mail serializer returned an acceptance for this delivery');
    const id = `synthetic-lamp-performance-${type}-${delivery.id}`, timestamp = String(Math.floor(now / 1000));
    const body = JSON.stringify({ type: `email.${type}`, data: { email_id: accepted.id, ...(type === 'bounced' ? { bounce: { type: 'Permanent' } } : {}) } });
    const signature = createHmac('sha256', receiptKey).update(`${id}.${timestamp}.${body}`).digest('base64url');
    const send = () => j.raw(new URL('/api/intake/mail-events', j.publicOrigin).href, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` }, body,
    });
    assert.equal((await send()).status, 200);
    assert.equal((await send()).status, 200, 'replaying an authenticated receipt does not multiply a delivery');
    return { send, body };
  };
  try {
    await clock(START - MINUTE);
    const saved = (await j.json('/api/app/page-settings')).settings;
    const settings = Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'mailFromAddress', 'template', 'footerCreditEnabled', 'widgetAllowedOrigins'].map(key => [key, saved[key]]));
    await j.json('/api/app/page-settings', 'PUT', { ...settings, timezone: ['Australia', 'Brisbane'].join('/') });
    const component = await j.component('Synthetic Lamp report API');
    await clock(START - 1);
    const previous = await j.incident('Synthetic Lamp previous local month', [component]);
    await clock(START);
    const source = (await j.json('/api/app/intake/sources', 'POST', {
      name: 'Synthetic Lamp report monitor', preset: 'pingdom', componentId: component.id, credentialKind: 'bearer-token',
    }, 201)).source;
    const alert = async number => {
      const response = await j.raw(new URL(source.endpointPath, j.publicOrigin).href, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${source.token}` },
        body: JSON.stringify({ check_id: `synthetic-lamp-performance-${number}`, check_name: `Synthetic Lamp report incident ${number}`, current_state: 'DOWN', previous_state: 'UP', description: 'Synthetic accepted alert' }),
      });
      assert.equal(response.status, 202, await response.clone().text());
      const accepted = await response.json();
      const incident = await j.read(accepted.incidentId);
      const evidence = await j.json(`/api/app/intake/receipts?receipt=${accepted.receiptId}`);
      assert.ok(evidence.receipts.some(row => row.incidentId === incident.id && row.receivedAt === iso(now)), 'the independent receipt read retains the exact accepted alert time');
      return incident;
    };
    const first = await alert(1);
    const readers = new Map(), confirmation = new Map();
    for (const name of ['delivered', 'bounced', 'complained', 'rejected', 'suppressed']) {
      const address = email(name);
      const made = await j.json('/api/app/subscribers', 'POST', { channel: 'email', email: address, componentIds: [component.id] }, 201);
      readers.set(name, made.subscriber.id);
      const message = await eventually(() => j.messages.find(row => row.to.includes(address) && row.text.includes('/confirm-subscription/')), Boolean, 'native confirmation mail');
      confirmation.set(name, message);
      assert.equal((await j.raw(message.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0])).status, 200);
    }
    for (const name of ['retry', 'queued']) {
      const contact = email(`webhook-${name}`);
      await j.json('/api/app/subscribers', 'POST', {
        channel: 'webhook', destination: `https://receiver.example.test/synthetic-lamp-${name}`, contactEmail: contact, componentIds: [component.id], eventKinds: ['incidents'],
      }, 201);
      const message = await eventually(() => j.messages.find(row => row.to.includes(contact)), Boolean, 'webhook consent mail');
      assert.equal((await j.raw(message.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0])).status, 200);
    }
    for (const [kind, url] of [['slack', slack], ['teams', teams]]) await j.json('/api/app/channels', 'POST', { kind, url, name: `Synthetic Lamp ${kind} reports`, componentIds: [component.id] }, 201);
    const unsubscribe = async name => {
      const link = confirmation.get(name).text.match(/https?:\/\/\S+\/unsubscribe\/\S+/)?.[0];
      assert.ok(link, 'consent mail retains a public unsubscribe door');
      assert.equal((await j.raw(link, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' })).status, 200);
    };
    await clock(START + 5 * MINUTE);
    await pause(true);
    const firstUpdate = await publish(first, 'Identified', iso(START + 15 * MINUTE), ['email', 'webhook', 'chat']);
    const queued = await deliveries(firstUpdate.id);
    assert.equal(queued.length, 7);
    assert.ok(queued.every(row => row.outcome === 'queued'));
    let measured = await reach(first.id);
    assert.deepEqual(measured.incident.commitments, { kept: 0, missed: 0, pending: 1, evaluated: 0, keptRate: null });
    assert.deepEqual(measured.incident.deliveryFailure, { failures: 0, denominator: 7, rate: 0, denominatorLabel: measured.incident.deliveryFailure.denominatorLabel });
    await unsubscribe('suppressed');
    await pause(false);
    await queue(firstUpdate.id);
    const attempted = await eventually(() => deliveries(firstUpdate.id), rows => rows.find(row => row.subscriberId === readers.get('rejected'))?.outcome === 'failed' && rows.filter(row => row.channel === 'email' && row.providerAcceptedAt).length === 3, 'native delivery attempts settle');
    for (const [name, outcome] of [['delivered', 'delivered'], ['bounced', 'bounced'], ['complained', 'complained']]) await receipt(attempted.find(row => row.subscriberId === readers.get(name)), outcome);
    await unsubscribe('rejected');
    await clock(START + 6 * MINUTE);
    await queue(firstUpdate.id);
    const settled = await eventually(() => reach(first.id), data => channel(data.incident, 'webhook').delivered === 1, 'retrying the same webhook succeeds');
    assert.equal(channel(settled.incident, 'email').delivered, 1);
    assert.equal(channel(settled.incident, 'email').bounced, 1);
    assert.equal(channel(settled.incident, 'email').complained, 1);
    assert.equal(channel(settled.incident, 'email').failed, 1);
    assert.equal(channel(settled.incident, 'email').suppressed, 1);
    assert.equal(channel(settled.incident, 'webhook').queued, 1);
    assert.equal(settled.incident.deliveryFailure.failures, 3);
    assert.equal(settled.incident.deliveryFailure.denominator, 7);
    assert.equal(settled.incident.deliveryFailure.rate, 3 / 7, 'queued and suppressed planned sends remain in the exact denominator');
    assert.ok(webhookCalls.some(row => row.count >= 2), 'a genuine transport retry occurred');
    await assertIncidentCsv(j, first.id, settled);

    await clock(START + 8 * MINUTE);
    const repeat = await publish(first, 'Resolved', null, ['email', 'webhook', 'chat']);
    await eventually(() => deliveries(repeat.id), rows => rows.length === 3 && rows.some(row => row.providerAcceptedAt), 'repeated recipients have a second committed send');
    await receipt((await deliveries(repeat.id)).find(row => row.subscriberId === readers.get('delivered')), 'delivered');
    // First attempts to the retry endpoint fail; repeat the real Queue message.
    await queue(repeat.id);
    await clock(START + 10 * MINUTE);
    const second = await alert(2);
    await clock(START + 12 * MINUTE);
    await publish(first, 'Resolved', null);
    await clock(START + 17 * MINUTE);
    const secondUpdate = await publish(second, 'Identified', iso(START + 27 * MINUTE), ['email', 'webhook', 'chat']);
    await eventually(() => deliveries(secondUpdate.id), rows => rows.length === 3 && rows.some(row => row.providerAcceptedAt), 'the same subscriber receives a different incident');
    await receipt((await deliveries(secondUpdate.id)).find(row => row.subscriberId === readers.get('delivered')), 'delivered');
    await queue(secondUpdate.id);
    await clock(START + 20 * MINUTE);
    const third = await alert(3);
    await clock(START + 22 * MINUTE);
    await publish(third, 'Identified', iso(START + 32 * MINUTE));
    await clock(START + 30 * MINUTE);
    await publish(third, 'Resolved', null);
    await clock(START + 31 * MINUTE);
    await publish(second, 'Resolved', null);
    await pause(true);
    measured = await report();
    assert.deepEqual(measured.incidents.map(row => row.incidentId).sort(), [first.id, second.id, third.id].sort(), 'the UTC-January incidents enter the February cohort in Brisbane');
    assert.equal(measured.startsAt, '2030-01-31T14:00:00.000Z');
    assert.equal(measured.endsAt, '2030-02-28T14:00:00.000Z');
    assert.equal((await j.json('/api/app/communication-performance')).month, '2030-02');
    assert.deepEqual((await j.json('/api/app/communication-performance?month=2030-01')).incidents.map(row => row.incidentId), [previous.id]);
    for (const [incident, alertMinute, firstMinute, latency, duration] of [[first, 0, 5, 5, 12], [second, 10, 17, 7, 21], [third, 20, 22, 2, 10]]) {
      const row = measured.incidents.find(row => row.incidentId === incident.id);
      assert.equal(row.firstAcceptedAlertAt, iso(START + alertMinute * MINUTE));
      assert.equal(row.firstPublicUpdateAt, iso(START + firstMinute * MINUTE));
      assert.equal(row.firstUpdateLatencyMs, latency * MINUTE);
      assert.equal(row.resolutionDurationMs, duration * MINUTE);
      assert.equal((await j.read(incident.id)).resolvedAt, row.resolvedAt);
      assert.equal(row.reportOwed, false);
    }
    assert.deepEqual(measured.summary.commitments, { kept: 2, missed: 1, pending: 0, evaluated: 3, keptRate: 2 / 3 });
    assert.equal(measured.summary.firstUpdateLatencyTotalMs, 14 * MINUTE);
    assert.equal(measured.summary.averageFirstUpdateLatencyMs, 14 * MINUTE / 3);
    assert.equal(measured.summary.resolutionDurationTotalMs, 43 * MINUTE);
    assert.equal(measured.summary.averageResolutionDurationMs, 43 * MINUTE / 3);
    assert.equal(measured.summary.reportsOwed, 0);
    assert.equal(channel(measured.summary, 'email').committed, 7);
    assert.equal(channel(measured.summary, 'email').distinctCommitted, 5);
    assert.equal(channel(measured.summary, 'email').providerAccepted, 5);
    assert.equal(channel(measured.summary, 'email').distinctProviderAccepted, 3);
    assert.equal(channel(measured.summary, 'email').delivered, 3);
    assert.equal(channel(measured.summary, 'email').distinctDelivered, 1);
    assert.equal(channel(measured.summary, 'webhook').committed, 6);
    assert.equal(channel(measured.summary, 'webhook').distinctCommitted, 2);
    assert.equal(channel(measured.summary, 'webhook').delivered, 3);
    assert.equal(channel(measured.summary, 'webhook').distinctDelivered, 1);
    assert.equal(channel(measured.summary, 'webhook').queued, 3);
    assert.equal(measured.summary.deliveryFailure.failures, 3);
    assert.equal(measured.summary.deliveryFailure.denominator, 13);
    assert.equal(measured.summary.deliveryFailure.rate, 3 / 13);
    for (const post of measured.summary.operatorPosts) {
      assert.deepEqual(post, { channel: post.channel, committed: 3, accepted: 3, rejected: 0, uncertain: 0, pending: 0 });
      assert.equal(posts.filter(row => row.url === (post.channel === 'slack' ? slack : teams)).length, 3);
    }
    const attempts = (await j.db.prepare('SELECT * FROM notification_attempt_records ORDER BY id').all()).results;
    assert.ok(attempts.length > 13, 'multiple real attempts cannot inflate the thirteen planned sends');
    await assertMonthlyCsv(j, measured);
    for (const incident of [first, second, third]) await assertIncidentCsv(j, incident.id, await reach(incident.id));
    t.diagnostic('PROBE HIST-005 1: signed native intake and publications at controlled times -> first-update latencies 300000, 420000, 120000 milliseconds.');
    t.diagnostic('PROBE HIST-005 4: native deliveries with repeated subscribers, retries, signed outcomes and six operator posts -> 3 failures / 13 planned sends; distinct email 5 selected, 3 accepted, 1 delivered; distinct webhook 2 selected, 1 delivered.');

    await clock(START + 35 * MINUTE);
    await publish(second, 'Monitoring', iso(START + 26 * MINUTE), ['email', 'webhook'], { publishedAt: iso(START + 25 * MINUTE) });
    measured = await report();
    assert.deepEqual(measured.summary.commitments, { kept: 2, missed: 1, pending: 0, evaluated: 3, keptRate: 2 / 3 }, 'an update backdated before the miss cannot erase actual publication history');
    const secondRow = measured.incidents.find(row => row.incidentId === second.id);
    assert.equal(secondRow.resolutionDurationMs, 21 * MINUTE, 'backdating cannot shorten the actual resolution duration');
    assert.equal(secondRow.firstUpdateLatencyMs, 7 * MINUTE);
    assert.equal(measured.summary.deliveryFailure.denominator, 13);
    t.diagnostic('PROBE HIST-005 2: three native promises, including a four-minute miss, followed by a later backdated update -> 2 kept / 3 evaluated; the miss remains.');

    const owing = async () => (await j.json('/api/app/reports/owing')).incidentIds.sort();
    await clock(START + 12 * MINUTE + 7 * DAY - 1);
    assert.deepEqual(await owing(), []);
    assert.equal((await report()).summary.reportsOwed, 0);
    await clock(START + 12 * MINUTE + 7 * DAY);
    assert.deepEqual(await owing(), [first.id]);
    assert.equal((await report()).summary.reportsOwed, 1);
    await clock(START + 31 * MINUTE + 7 * DAY);
    assert.deepEqual(await owing(), [first.id, second.id, third.id].sort());
    assert.equal((await report()).summary.reportsOwed, 3);
    await j.json(`/api/app/incidents/${first.id}/report`, 'PUT', {
      summary: 'The synthetic service failed and recovered.', timeline: 'Operators investigated and restored service.',
      cause: 'The connection pool exhausted its capacity.', remediation: 'Operators raised capacity and verified recovery.',
    });
    await j.json(`/api/app/incidents/${first.id}/report/publish`, 'POST', { channels: [] });
    await j.json(`/api/app/incidents/${third.id}/report/waive`, 'POST', { reason: 'A separate customer review covers this synthetic incident.' });
    measured = await report();
    assert.deepEqual(await owing(), [second.id]);
    assert.deepEqual(measured.incidents.filter(row => row.reportOwed).map(row => row.incidentId), [second.id], 'per-incident owed flags agree with the native report-due listing, published reports and waivers');
    assert.equal(measured.summary.reportsOwed, 1);
    t.diagnostic('PROBE HIST-005 3: native resolution, seven-day due reads, report publication and reasoned waiver -> 12, 21 and 10 minute durations; exact due cohort reconciles before and at the boundary.');

    const importFiles = await Promise.all(['page.json', 'page-access-groups.json', 'components.json', 'incidents.json', 'subscribers.json'].map(async name => ({ name, text: await readFile(`tests/fixtures/statuspage/small/${name}`, 'utf8') })));
    const importedRecord = JSON.parse(importFiles.find(row => row.name === 'incidents.json').text)[0];
    Object.assign(importedRecord, { name: 'Synthetic Lamp source history without delivery facts', created_at: '2030-02-02T09:00:00.000Z', resolved_at: '2030-02-02T10:30:00.000Z', updated_at: '2030-02-02T10:30:00.000Z' });
    for (const [index, update] of importedRecord.incident_updates.entries()) {
      const instant = index ? importedRecord.resolved_at : importedRecord.created_at;
      Object.assign(update, { created_at: instant, display_at: instant, updated_at: instant });
    }
    importFiles.find(row => row.name === 'incidents.json').text = JSON.stringify([importedRecord]);
    importFiles.find(row => row.name === 'subscribers.json').text = '[]';
    const send = async (path, body, headers) => {
      const response = await j.request(path, { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: response.status, body: await response.json() };
    };
    const moveIn = moveInDoor(send), preview = await moveIn.preview({ files: importFiles });
    assert.equal(preview.status, 200, JSON.stringify(preview.body));
    const applied = await moveIn.apply(preview.body);
    assert.equal(applied.status, 200, JSON.stringify(applied.body));
    const imported = (await j.json('/api/app/incidents')).incidents.find(row => row.title === importedRecord.name);
    assert.ok(imported, 'reviewed source history is readable through the native incident collection');
    const unknown = await reach(imported.id);
    assert.equal(unknown.incident.firstAcceptedAlertAt, null);
    assert.equal(unknown.incident.firstUpdateLatencyMs, null);
    for (const row of unknown.incident.channels) {
      assert.equal(row.coverage, 'unknown');
      for (const key of ['committed', 'distinctCommitted', 'providerAccepted', 'distinctProviderAccepted', 'delivered', 'distinctDelivered', 'queued', 'bounced', 'complained', 'suppressed', 'failed']) assert.equal(row[key], null, `missing source ${key} stays unknown`);
    }
    assert.equal(unknown.incident.deliveryFailure.denominator, null);
    assert.equal(unknown.incident.deliveryFailure.rate, null);
    await assertIncidentCsv(j, imported.id, unknown);
    measured = await report();
    assert.equal(measured.summary.knownFirstUpdateLatencyCount, 3);
    assert.equal(measured.summary.unknownFirstUpdateLatencyCount, 1);
    assert.equal(measured.summary.incidentCount, 4);
    for (const row of measured.summary.channels) assert.equal(row.coverage, 'partial');
    assert.equal(measured.summary.deliveryFailure.denominator, 13);
    assert.equal(measured.summary.deliveryFailure.rate, 3 / 13);
    await assertMonthlyCsv(j, measured);
    const manual = await reach(previous.id);
    assert.equal(manual.incident.firstAcceptedAlertAt, null);
    assert.equal(manual.incident.firstUpdateLatencyMs, null);
    assert.equal(manual.incident.resolutionDurationMs, null);
    await clock(Date.UTC(2030, 1, 28, 14));
    const nextMonth = await j.incident('Synthetic Lamp next local month', [component]);
    assert.equal((await j.json('/api/app/communication-performance')).month, '2030-03');
    assert.ok(!(await report()).incidents.some(row => row.incidentId === nextMonth.id));
    assert.deepEqual((await j.json('/api/app/communication-performance?month=2030-03')).incidents.map(row => row.incidentId), [nextMonth.id]);
    t.diagnostic('PROBE HIST-005 6: native Brisbane cohorts at both month boundaries and reviewed source-history import -> exact February interval, 3 known plus 1 unknown latency; absent source deliveries remain unknown and mixed coverage stays partial.');
    t.diagnostic('PROBE HIST-005 5: incident and monthly CSV downloads opened with independent quoted-field parser -> every channel, timing, commitment, outcome, denominator, operator post and definition equals its report value.');

    const beforeErasure = (await report()).summary;
    await j.json(`/api/app/subscribers/${readers.get('delivered')}`, 'DELETE', undefined, 204);
    const afterErasure = (await report()).summary;
    assert.deepEqual(afterErasure, beforeErasure, 'erasure keeps anonymous communication totals without resurrecting the recipient');
    const erased = await j.db.prepare('SELECT * FROM notification_delivery_records WHERE subscriber_id=?').bind(readers.get('delivered')).all();
    assert.ok(erased.results.every(row => !JSON.stringify(row).includes(email('delivered'))), 'retained delivery facts expose no erased destination');
    await j.json('/api/app/session/signout', 'POST', {}, 204);
    for (const path of ['/api/app/communication-performance?month=2030-02', `/api/app/incidents/${first.id}/reach?format=csv`]) assert.equal((await j.request(path)).status, 401, 'revoked operator session cannot read report data');
  } finally { await j.close(); }
}
