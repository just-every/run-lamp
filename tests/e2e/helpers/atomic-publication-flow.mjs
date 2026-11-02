import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { openSubscriberManagementFixture, eventuallySubscriber, pageOrigin } from './subscriber-management-fixture.mjs';

/** Real publication, token-authorized preference changes and Worker Queue
 * dispatch, with a transaction failure injected only in this disposable D1. */
export async function atomicPublicationFlow() {
  const fixture = await openSubscriberManagementFixture({ workerEntry: 'tests/e2e/helpers/status-journey.worker.ts' });
  let browser;
  const { api, post, raw, db } = fixture;
  const pause = async paused => assert.equal((await raw('/test/effects', {
    method: 'PUT', body: JSON.stringify({ paused }),
  })).status, 204);
  const records = async () => {
    const result = {};
    for (const table of ['incident_updates', 'notification_delivery_records', 'notification_outbox']) {
      result[table] = (await db.prepare(`SELECT * FROM ${table} ORDER BY id`).all()).results;
    }
    return result;
  };
  const identities = rows => Object.fromEntries(Object.entries(rows).map(([table, entries]) => [table, entries.map(row => row.id)]));
  const deliveries = async updateId => {
    const response = await api(`/api/app/deliveries?incidentUpdateId=${updateId}&limit=100`);
    assert.equal(response.status, 200, response.text);
    return response.body.deliveries;
  };
  const draft = async (component, title, impact) => {
    const created = await post('/api/app/incidents', { title,
      components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }],
    });
    assert.equal(created.status, 201, created.text);
    const incident = created.body.incident;
    const saved = await api(`/api/app/incidents/${incident.id}/draft`, {
      method: 'PUT', body: JSON.stringify({ lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp readers',
        customerImpact: impact, whatStillWorks: 'The dashboard is available.', details: 'Operators are restoring service.',
        nextUpdateAt: new Date(Date.now() + 3_600_000).toISOString() }),
    });
    assert.equal(saved.status, 200, saved.text);
    return { incident, updateId: saved.body.draft.id };
  };
  const dispatch = async updateId => {
    const result = await (await fixture.runtime.getWorker()).queue('lamp-follow-ups-jobs', [{
      id: `synthetic-lamp-atomic-${updateId}`, timestamp: new Date(), attempts: 1,
      body: { type: 'delivery-dispatch', eventId: updateId },
    }]);
    assert.equal(result.outcome, 'ok', 'the real Worker Queue consumes the original publication event');
  };
  const publicSnapshot = async privateIncident => {
    await eventuallySubscriber(async () => {
      // Reading the root also exercises the public generation's ordinary door.
      await (await raw(`${pageOrigin}/`)).arrayBuffer();
      const work = await db.prepare('SELECT requested_revision, completed_revision FROM public_snapshot_work').first();
      const building = await db.prepare("SELECT id FROM snapshot_builds WHERE status='building'").all();
      return work && work.requested_revision === work.completed_revision && building.results.length === 0;
    }, Boolean, 'the public generation settles before comparing failed publication');
    const bucket = await fixture.runtime.getR2Bucket('SNAPSHOTS');
    const pointer = await (await bucket.get('snapshots/current.json')).json();
    const responses = [];
    for (const path of ['/', '/feed.atom', '/feed.rss', '/widget.js', '/embed/script.js',
      '/api/public/status', `/incidents/${privateIncident.reference}`]) {
      const response = await raw(`${pageOrigin}${path}`);
      assert.equal(response.status, path.startsWith('/incidents/') ? 404 : 200, path);
      const body = await response.text();
      assert.ok(!body.includes(privateIncident.id), `${path} excludes the private incident identity`);
      assert.ok(!body.includes(privateIncident.title), `${path} excludes the private title`);
      responses.push({ path, status: response.status, body,
        version: response.headers.get('x-lamp-snapshot-version'),
        generatedAt: response.headers.get('x-lamp-snapshot-generated-at') });
    }
    return { pointer, responses };
  };
  try {
    fixture.recoverWebhook();
    const original = await fixture.createComponent('Synthetic Lamp original delivery component');
    const retained = await fixture.createComponent('Synthetic Lamp retained selection component');
    const contact = ['synthetic-lamp-atomic', 'example.test'].join('@');
    const added = await post('/api/app/subscribers', { channel: 'webhook',
      destination: 'https://receiver.example.test/synthetic-lamp-1', contactEmail: contact,
      componentIds: [original.id, retained.id], eventKinds: ['incidents'],
    });
    assert.equal(added.status, 201, added.text);
    await fixture.confirm(contact);
    const subscriberId = added.body.subscriber.id;
    const selection = async () => (await fixture.list()).find(row => row.id === subscriberId);
    assert.equal((await selection()).state, 'active');
    assert.deepEqual((await selection()).componentSelections.map(row => row.componentId).sort(), [original.id, retained.id].sort());
    const manageUrl = fixture.messagesFor(contact)[0].text.match(/https?:\/\/\S+\/manage\/\S+/)?.[0];
    assert.ok(manageUrl, 'the actual confirmation email supplies the management link');

    await pause(true);
    const first = await draft(original, 'Synthetic Lamp frozen recipients', 'Synthetic Lamp original committed impact.');
    const published = await post(`/api/app/incidents/${first.incident.id}/publish`, { channels: ['webhook'] });
    assert.equal(published.status, 200, published.text);
    assert.equal(published.body.update.id, first.updateId);
    const [committed] = await deliveries(first.updateId);
    assert.ok(committed, 'publication success exposes its already committed recipient');
    assert.equal(committed.subscriberId, subscriberId);
    assert.equal(committed.outcome, 'queued');
    assert.equal(fixture.webhookRequests.length, 0, 'publication succeeds before paused transport dispatch');
    const frozen = await records();
    assert.deepEqual(frozen.incident_updates.map(row => row.id), [first.updateId]);
    assert.deepEqual(frozen.notification_delivery_records.map(row => row.id), [committed.id]);
    assert.equal(frozen.notification_outbox.filter(row => row.kind === 'delivery-dispatch' && row.aggregate_id === first.updateId).length, 1);

    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
      headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, javaScriptEnabled: false });
    await context.route(`${pageOrigin}/**`, async route => {
      const request = route.request();
      const response = await raw(request.url(), { method: request.method(), headers: request.headers(), body: request.postDataBuffer() ?? undefined });
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) });
    });
    const page = await context.newPage();
    assert.equal((await page.goto(manageUrl)).status(), 200);
    assert.deepEqual(await context.cookies(), [], 'the emailed management door needs no operator session');
    assert.equal(await page.getByRole('checkbox', { name: original.name, exact: true }).isChecked(), true);
    assert.equal(await page.getByRole('checkbox', { name: retained.name, exact: true }).isChecked(), true);
    await page.getByRole('checkbox', { name: original.name, exact: true }).uncheck();
    await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Save selection', exact: true }).click()]);
    await page.getByRole('heading', { name: 'Subscription updated', exact: true }).waitFor();
    assert.equal((await page.goto(manageUrl)).status(), 200);
    assert.equal(await page.getByRole('checkbox', { name: original.name, exact: true }).isChecked(), false);
    assert.equal(await page.getByRole('checkbox', { name: retained.name, exact: true }).isChecked(), true);
    const narrowed = await selection();
    assert.equal(narrowed.state, 'active', 'narrowing is distinct from unsubscribing');
    assert.deepEqual(narrowed.componentSelections.map(row => row.componentId), [retained.id], 'independent operator readback confirms the original component was removed');
    assert.deepEqual(await records(), frozen, 'narrowing preserves every complete committed update, recipient and outbox record');
    if (process.env.LAMP_BROWSER_EVIDENCE) {
      await mkdir(process.env.LAMP_BROWSER_EVIDENCE, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: join(process.env.LAMP_BROWSER_EVIDENCE, `atomic-management-${width}.png`), fullPage: true });
      }
    }
    await browser.close(); browser = undefined;
    await pause(false);
    await dispatch(first.updateId);
    const [delivered] = await eventuallySubscriber(() => deliveries(first.updateId), rows => rows.length === 1 && rows[0].outcome === 'delivered', 'narrowing does not suppress the original delivery');
    assert.equal(delivered.id, committed.id);
    assert.equal(fixture.webhookRequests.length, 1, 'the original delivery receives exactly one receiver acceptance');
    const received = fixture.webhookRequests[0];
    assert.equal(received.headers['webhook-id'], committed.id);
    assert.equal(received.body.deliveryId, committed.id);
    assert.deepEqual(received.body.incident, { reference: first.incident.reference, title: first.incident.title, impact: "major" });
    assert.deepEqual(received.body.updates.map(row => row.id), [first.updateId]);
    assert.equal(received.body.updates[0].customerImpact, 'Synthetic Lamp original committed impact.');
    await dispatch(first.updateId);
    assert.equal(fixture.webhookRequests.length, 1, 'Queue redelivery cannot accept the original notification twice');
    assert.deepEqual(identities(await records()), identities(frozen), 'dispatch retains the original complete identity sets');

    await pause(true);
    const failed = await draft(retained, 'Synthetic Lamp rolled back publication', 'Synthetic Lamp failed impact stays private.');
    const beforePublic = await publicSnapshot(failed.incident);
    const before = await fixture.databaseState();
    const wireCount = fixture.webhookRequests.length, mailCount = fixture.messages.length;
    // This fires after the actual batch inserts the update, captures recipients,
    // and inserts its outbox row. RAISE rolls that entire native transaction back.
    await db.prepare(`CREATE TRIGGER synthetic_lamp_publication_failure AFTER INSERT ON notification_outbox
      WHEN NEW.aggregate_id = '${failed.updateId}' AND NEW.kind = 'delivery-dispatch'
      BEGIN SELECT RAISE(ABORT, 'Synthetic Lamp publication batch failure'); END`).run();
    try {
      const rejected = await post(`/api/app/incidents/${failed.incident.id}/publish`, { channels: ['webhook'] });
      assert.equal(rejected.status, 409, rejected.text);
      assert.match(rejected.body.error, /Synthetic Lamp publication batch failure/, 'the failure comes from inside the actual publication transaction');
    } finally {
      await db.prepare('DROP TRIGGER synthetic_lamp_publication_failure').run();
    }
    await fixture.assertUnchanged(before);
    const unchanged = await api(`/api/app/incidents/${failed.incident.id}`);
    assert.equal(unchanged.status, 200, unchanged.text);
    assert.equal(unchanged.body.incident.draft.id, failed.updateId, 'rollback retains the complete saved draft for recovery');
    assert.deepEqual(unchanged.body.incident.updates, []);
    assert.deepEqual(await deliveries(failed.updateId), [], 'failed publication records no recipients');
    assert.deepEqual(await publicSnapshot(failed.incident), beforePublic, 'failed publication changes no settled public page, feed, widget or generation bytes');
    assert.equal(fixture.webhookRequests.length, wireCount);
    assert.equal(fixture.messages.length, mailCount);

    const recovered = await post(`/api/app/incidents/${failed.incident.id}/publish`, { channels: ['webhook'] });
    assert.equal(recovered.status, 200, recovered.text);
    assert.equal(recovered.body.update.id, failed.updateId, 'ordinary retry publishes the original retained draft');
    const [recoveredRecipient] = await deliveries(failed.updateId);
    assert.equal(recoveredRecipient.subscriberId, subscriberId);
    assert.equal(recoveredRecipient.outcome, 'queued');
    assert.equal(fixture.webhookRequests.length, wireCount, 'successful recovery still commits before dispatch');
    await pause(false);
    await dispatch(failed.updateId);
    const [recoveredDelivery] = await eventuallySubscriber(() => deliveries(failed.updateId), rows => rows.length === 1 && rows[0].outcome === 'delivered', 'recovery delivers the newly committed set');
    assert.equal(recoveredDelivery.id, recoveredRecipient.id);
    assert.equal(fixture.webhookRequests.length, wireCount + 1);
    assert.equal(fixture.webhookRequests.at(-1).body.deliveryId, recoveredRecipient.id);
    assert.deepEqual(fixture.webhookRequests.at(-1).body.updates.map(row => row.id), [failed.updateId]);
    await eventuallySubscriber(async () => {
      const response = await raw(`${pageOrigin}/incidents/${failed.incident.reference}`);
      return { status: response.status, body: await response.text() };
    }, response => response.status === 200 && response.body.includes('Synthetic Lamp failed impact stays private.'), 'successful recovery exposes the committed update through its public permalink');
  } finally {
    try { await browser?.close(); } finally { await fixture.close(); }
  }
}
