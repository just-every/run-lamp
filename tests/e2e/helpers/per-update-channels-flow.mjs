import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { openSubscriberManagementFixture, eventuallySubscriber, pageOrigin } from './subscriber-management-fixture.mjs';

/** Ordinary subscriptions follow the operator's choice for each publication.
 * Incident follows retain their independent channel choices under SUB-019. */
export async function perUpdateChannelsFlow() {
  const mailRequests = [];
  const fixture = await openSubscriberManagementFixture({
    workerEntry: 'tests/e2e/helpers/status-journey.worker.ts',
    providerEdge: async request => {
      if (new URL(request.url).origin === 'https://api.resend.com' && new URL(request.url).pathname === '/emails') {
        mailRequests.push({ key: request.headers.get('Idempotency-Key'), body: await request.clone().json() });
      }
    },
  });
  let browser;
  try {
    fixture.recoverWebhook();
    const component = await fixture.createComponent('Synthetic Lamp channel selection API');
    const subscribers = [];
    for (const [channel, number] of [['email', 1], ['email', 2], ['webhook', 1], ['webhook', 2]]) {
      const address = [`synthetic-lamp-${channel}-${number}`, 'example.test'].join('@');
      const destination = number === 1 ? 'https://receiver.example.test/synthetic-lamp-1' : 'https://receiver.example.test/synthetic-lamp-components';
      const added = await fixture.post('/api/app/subscribers', {
        channel, componentIds: [component.id], eventKinds: ['incidents'],
        ...(channel === 'email' ? { email: address } : { destination, contactEmail: address }),
      });
      assert.equal(added.status, 201, added.text);
      await fixture.confirm(address);
      subscribers.push({ id: added.body.subscriber.id, channel, destination: channel === 'email' ? address : destination });
    }
    const inventory = await fixture.list(1);
    assert.deepEqual(inventory.map(row => ({ id: row.id, channel: row.channel, destination: row.destination })).sort((a, b) => a.id.localeCompare(b.id)), [...subscribers].sort((a, b) => a.id.localeCompare(b.id)));
    assert.ok(inventory.every(row => row.state === 'active' && !row.incident), 'all controls are confirmed ordinary subscriptions');

    const settings = (await fixture.api('/api/app/page-settings')).body.settings;
    const widgetOrigin = 'https://synthetic-lamp-widget.example.test';
    const configured = await fixture.api('/api/app/page-settings', { method: 'PUT', body: JSON.stringify({
      ...Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'mailFromAddress', 'template', 'footerCreditEnabled'].map(key => [key, settings[key]])),
      widgetAllowedOrigins: [widgetOrigin],
    }) });
    assert.equal(configured.status, 200, configured.text);
    const created = await fixture.post('/api/app/incidents', {
      title: 'Synthetic Lamp independent channel publications',
      components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }],
    });
    assert.equal(created.status, 201, created.text);
    const incident = created.body.incident;
    const deliveries = async updateId => {
      const rows = []; let offset = 0;
      for (;;) {
        const response = await fixture.api(`/api/app/deliveries?incidentUpdateId=${updateId}&limit=1&offset=${offset}`);
        assert.equal(response.status, 200, response.text);
        rows.push(...response.body.deliveries);
        if (!response.body.hasMore) break;
        offset += response.body.limit;
      }
      assert.equal(new Set(rows.map(row => row.id)).size, rows.length, 'paginated delivery identities occur exactly once');
      return rows;
    };
    const pause = async paused => assert.equal((await fixture.raw('/test/effects', { method: 'PUT', body: JSON.stringify({ paused }) })).status, 204);
    const worker = await fixture.runtime.getWorker();
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === widgetOrigin) return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="en"><title>Synthetic Lamp customer</title><body><script src="${pageOrigin}/widget.js"></script></body></html>` });
      assert.equal(url.origin, pageOrigin, 'public proof contacts only the retained public host');
      const response = await fixture.raw(url.href);
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) });
    });
    const page = await context.newPage(), widget = await context.newPage();
    const expectedSelections = [], expectedDeliveries = [], expectedMailIds = [], expectedWebhookIds = [], expectedUpdates = [];
    for (const [index, channels] of [['email'], ['webhook'], ['email', 'webhook'], []].entries()) {
      const wording = {
        lifecycle: 'Identified', affectedAudience: `Synthetic Lamp audience ${index + 1}`,
        customerImpact: `Synthetic Lamp publication ${index + 1} delays requests.`,
        whatStillWorks: `Synthetic Lamp control ${index + 1} remains available.`,
        details: `Synthetic Lamp operators are applying remedy ${index + 1}.`,
        nextUpdateAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
      const saved = await fixture.api(`/api/app/incidents/${incident.id}/draft`, { method: 'PUT', body: JSON.stringify(wording) });
      assert.equal(saved.status, 200, saved.text);
      await pause(true);
      const published = await fixture.post(`/api/app/incidents/${incident.id}/publish`, { channels });
      assert.equal(published.status, 200, published.text);
      const update = published.body.update;
      assert.equal(update.id, saved.body.draft.id);
      expectedUpdates.push({ id: update.id, impact: wording.customerImpact });
      const expected = subscribers.filter(row => channels.includes(row.channel)).map(row => ({ subscriberId: row.id, channel: row.channel, incidentUpdateId: update.id })).sort((a, b) => a.subscriberId.localeCompare(b.subscriberId));
      const committed = await deliveries(update.id);
      assert.deepEqual(committed.map(({ subscriberId, channel, incidentUpdateId }) => ({ subscriberId, channel, incidentUpdateId })).sort((a, b) => a.subscriberId.localeCompare(b.subscriberId)), expected, 'the complete committed recipient set equals exactly the selected ordinary channels');
      assert.ok(committed.every(row => row.outcome === 'queued'), 'recipient capture precedes transport dispatch');
      expectedSelections.push(...channels.map(channel => ({ incident_update_id: update.id, channel })));
      const selections = (await fixture.db.prepare('SELECT incident_update_id, channel FROM notification_channel_selections ORDER BY incident_update_id, channel').all()).results;
      assert.deepEqual(selections, [...expectedSelections].sort((a, b) => a.incident_update_id.localeCompare(b.incident_update_id) || a.channel.localeCompare(b.channel)), 'all earlier persisted channel choices survive later publications, including none');
      const reach = await fixture.api(`/api/app/incidents/${incident.id}/reach?updateId=${update.id}`);
      assert.equal(reach.status, 200, reach.text);
      assert.deepEqual(reach.body.updates.map(row => ({ id: row.updateId, channels: row.selectedChannels.sort() })), [{ id: update.id, channels: [...channels].sort() }], 'the native delivery reach log retains the exact selected channels');
      await pause(false);
      const dispatched = await worker.queue('lamp-follow-ups-jobs', [{ id: `synthetic-lamp-channels-${index}`, timestamp: new Date(), attempts: 1, body: { type: 'delivery-dispatch', eventId: update.id } }]);
      assert.equal(dispatched.outcome, 'ok', 'even an empty selection traverses the actual Queue consumer');
      const completed = await eventuallySubscriber(() => deliveries(update.id), rows => rows.length === expected.length && rows.every(row => row.channel === 'email' ? Boolean(row.providerAcceptedAt) : row.outcome === 'delivered'), 'every selected recipient crosses its actual transport');
      assert.deepEqual(completed.map(row => row.id).sort(), committed.map(row => row.id).sort(), 'dispatch preserves every captured delivery identity');
      expectedDeliveries.push(...committed.map(row => ({ id: row.id, subscriberId: row.subscriberId, channel: row.channel, incidentUpdateId: row.incidentUpdateId })));
      expectedMailIds.push(...committed.filter(row => row.channel === 'email').map(row => row.id));
      expectedWebhookIds.push(...committed.filter(row => row.channel === 'webhook').map(row => row.id));
      const transportedMail = mailRequests.filter(row => row.key?.startsWith('notification/'));
      assert.deepEqual(transportedMail.map(row => row.key.slice('notification/'.length)).sort(), [...expectedMailIds].sort(), 'selected emails send once and omitted email channels stay silent');
      assert.deepEqual(fixture.webhookRequests.map(row => row.headers['webhook-id']).sort(), [...expectedWebhookIds].sort(), 'selected webhooks send once and omitted webhook channels stay silent');
      for (const delivery of committed) {
        if (delivery.channel === 'email') {
          const received = transportedMail.find(row => row.key === `notification/${delivery.id}`).body;
          assert.deepEqual(received.to, [subscribers.find(row => row.id === delivery.subscriberId).destination]);
          assert.ok(received.text.includes(wording.customerImpact));
          assert.ok(received.text.includes(incident.reference));
        } else {
          const received = fixture.webhookRequests.find(row => row.headers['webhook-id'] === delivery.id).body;
          assert.equal(received.deliveryId, delivery.id);
          assert.equal(received.incident.reference, incident.reference);
          assert.deepEqual(received.updates.map(row => ({ id: row.id, impact: row.customerImpact })), expectedUpdates, 'the webhook retains every exact publication in the incident timeline');
        }
      }
      const publicRoot = await eventuallySubscriber(async () => {
        const response = await fixture.raw(pageOrigin + '/');
        return response.status === 200 ? await response.text() : '';
      }, html => html.includes(wording.details), 'the public root receives the exact publication regardless of subscriber channels');
      assert.ok(publicRoot.includes(incident.title));
      await page.goto(pageOrigin + '/');
      const article = page.locator('article.update').filter({ hasText: wording.customerImpact });
      assert.equal(await article.count(), 1);
      for (const text of [wording.lifecycle, wording.affectedAudience, wording.whatStillWorks, wording.details]) assert.ok((await article.innerText()).includes(text));
      assert.equal(await article.locator('.update-head time').getAttribute('datetime'), update.publishedAt);
      const feed = await fixture.raw(pageOrigin + '/feed.atom');
      assert.equal(feed.status, 200);
      const entries = await page.evaluate(xml => [...new DOMParser().parseFromString(xml, 'application/xml').querySelectorAll('entry')].map(entry => ({ id: entry.querySelector('id')?.textContent, title: entry.querySelector('title')?.textContent, time: entry.querySelector('updated')?.textContent, text: entry.querySelector('content')?.textContent })), await feed.text());
      const entry = entries.find(row => row.id.endsWith(`:event:update-${update.id}`));
      assert.ok(entry, 'Atom positively identifies the committed publication');
      assert.equal(entry.title, `${incident.reference}: ${incident.title}`);
      assert.equal(entry.time, update.publishedAt);
      for (const text of [wording.affectedAudience, wording.customerImpact, wording.whatStillWorks, wording.details]) assert.ok(entry.text.includes(text));
      await widget.goto(widgetOrigin);
      await widget.getByRole('status').waitFor();
      const banner = await widget.getByRole('status').innerText();
      for (const text of [incident.reference, incident.title, wording.lifecycle, wording.affectedAudience, wording.customerImpact, wording.whatStillWorks, wording.details]) assert.ok(banner.includes(text), 'the installed widget receives this distinctive publication');
      const status = await (await fixture.raw(pageOrigin + '/api/public/status')).json();
      assert.equal(status.incident.reference, incident.reference);
      assert.equal(status.incident.publishedAt, update.publishedAt);
    }
    const persistedDeliveries = (await fixture.db.prepare('SELECT id, subscriber_id AS subscriberId, channel, incident_update_id AS incidentUpdateId FROM notification_delivery_records ORDER BY id').all()).results;
    assert.deepEqual(persistedDeliveries, expectedDeliveries.sort((a, b) => a.id.localeCompare(b.id)), 'the complete persisted delivery inventory contains no omitted-channel recipients');
  } finally {
    await browser?.close();
    await fixture.close();
  }
}
