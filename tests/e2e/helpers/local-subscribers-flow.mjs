import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import { operatorHydrated } from './operator-hydrated.mjs';
import { withDraftVersion } from '../draft-version-helper.mjs';

/** Real local public/operator doors and silent development mail; no transport
 * fake and no direct subscriber-state mutation participates in this journey. */
export async function localSubscribersFlow({ browser, context, origin }) {
  const page = await context.newPage();
  const publicOrigin = origin.replace('127.0.0.1', 'localhost');
  const evidence = process.env.LAMP_LOCAL_SUBSCRIBERS_EVIDENCE;
  const api = async (path, body, method = body ? 'POST' : 'GET') => {
    const init = await withDraftVersion(path, { method, headers: { Origin: origin }, ...(body ? { body: JSON.stringify(body) } : {}) }, path => fetchResponse(path));
    const response = await context.request.fetch(origin + path, { method: init.method, headers: { ...init.headers, 'Content-Type': 'application/json' }, ...(body ? { data: body } : {}) });
    assert.ok(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`);
    return response.json();
  };
  async function fetchResponse(path) {
    const response = await context.request.get(origin + path);
    return { status: response.status(), json: () => response.json() };
  }
  async function screens(name) {
    if (!evidence) return;
    await mkdir(evidence, { recursive: true });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.screenshot({ path: join(evidence, `${name}-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  const pageEmail = 'synthetic-lamp-local-page@synthetic-lamp-local-page.example';
  const incidentEmail = 'synthetic-lamp-local-incident@synthetic-lamp-local-incident.example';
  const publish = async (incident, customerImpact, channels) => {
    await api(`/api/app/incidents/${incident.id}/draft`, { lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp local customers', customerImpact, whatStillWorks: 'The status page works.', details: '', nextUpdateAt: new Date(Date.now() + 3600000).toISOString() }, 'PUT');
    return api(`/api/app/incidents/${incident.id}/publish`, { channels });
  };
  try {
    await api('/api/app/prelaunch', { enabled: false }, 'PATCH');
    await page.goto(publicOrigin + '/');
    const form = page.locator('form[action="/subscribe"]');
    await form.locator('input[name="email"]').fill(pageEmail);
    await form.locator('button[type="submit"]').click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Local subscription');
    await expect(page.locator('main')).toContainText(/No email was sent on this computer/);
    await expect(page.locator('main')).not.toContainText(/We sent|Check your inbox|SendGrid/);
    await screens('local-page-subscription');
    const { component } = await api('/api/app/components', { groupId: null, name: 'Synthetic Lamp local payments', description: '', internal: false, displayOrder: 1, note: '' });
    const { incident } = await api('/api/app/incidents', { title: 'Synthetic Lamp local payment delays', components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }] });
    await publish(incident, 'Payment requests are delayed.', []);
    await expect.poll(async () => { const response = await context.request.get(`${publicOrigin}/incidents/${incident.reference}`); return response.ok() && (await response.text()).includes('Payment requests are delayed.'); }, { timeout: 30000 }).toBe(true);
    await page.goto(`${publicOrigin}/incidents/${incident.reference}`);
    const follow = page.locator('form[action="/subscribe/incident"]').filter({ has: page.locator('input[name="email"]') });
    await follow.locator('input[name="email"]').fill(incidentEmail);
    await follow.locator('button[type="submit"]').click();
    await expect(page.locator('main')).toContainText(/No email was sent on this computer/);
    await screens('local-incident-subscription');
    const subscribers = (await api('/api/app/subscribers')).subscribers.filter(row => [pageEmail, incidentEmail].includes(row.destination));
    assert.equal(subscribers.length, 2);
    assert.ok(subscribers.every(row => row.state === 'pending'));
    const outsider = await browser.newContext();
    try {
      const denied = await outsider.request.post(`${origin}/api/app/subscribers/${subscribers[0].id}/confirm-local`, { headers: { Origin: origin }, data: {} });
      assert.equal(denied.status(), 401, 'local confirmation still requires operator authentication');
    } finally { await outsider.close(); }
    await page.goto(origin + '/app/subscribers?view=log'); await operatorHydrated(page);
    const mail = page.getByRole('region', { name: 'Subscription emails', exact: true });
    for (const subscriber of subscribers) {
      const row = mail.getByRole('row').filter({ hasText: subscriber.destination });
      await expect(row).toContainText('pending subscriber');
      await expect(row).toContainText('Not sent locally');
      await expect(row).not.toContainText(/Accepted by|SendGrid/);
    }
    await screens('local-pending-delivery-log');
    for (const subscriber of subscribers) {
      const row = mail.getByRole('row').filter({ hasText: subscriber.destination });
      await row.getByRole('button', { name: 'Confirm locally', exact: true }).click();
      await expect(row).toContainText('active subscriber');
      await expect(row.getByRole('button')).toHaveCount(0);
    }
    const followers = (await api(`/api/app/incidents/${incident.id}/subscribers`)).subscribers;
    assert.ok(followers.some(row => row.destination === incidentEmail && row.state === 'active'), 'the same confirmed incident identity follows the incident');
    await page.goto(`${origin}/app/incidents/${incident.id}`); await operatorHydrated(page);
    const audience = page.getByRole('button', { name: /Incident subscribers/ });
    await audience.click();
    await expect(page.getByRole('region', { name: 'Incident subscriber records' })).toContainText(incidentEmail);
    await screens('local-incident-follower');
    const { update } = await publish(incident, 'Payment processing is recovering.', ['email']);
    await expect.poll(async () => (await api(`/api/app/deliveries?incidentUpdateId=${update.id}`)).deliveries.filter(row => [pageEmail, incidentEmail].includes(row.destination) && row.outcome === 'suppressed').length, { timeout: 30000 }).toBe(2);
    const logged = (await api(`/api/app/deliveries?incidentUpdateId=${update.id}`)).deliveries;
    for (const subscriber of subscribers) {
      const row = logged.find(row => row.subscriberId === subscriber.id);
      assert.ok(row, 'the notification identifies its subscriber');
      assert.equal(row.channel, 'email');
      assert.equal(row.incidentUpdateId, update.id);
      assert.equal(row.outcome, 'suppressed');
      assert.ok(Number.isFinite(Date.parse(row.queuedAt)) && Number.isFinite(Date.parse(row.outcomeAt)), 'queue and outcome times are recorded');
    }
    await page.goto(origin + '/app/subscribers?view=log'); await operatorHydrated(page);
    const records = page.getByRole('region', { name: 'Delivery records', exact: true });
    for (const email of [pageEmail, incidentEmail]) {
      const row = records.getByRole('row').filter({ hasText: email });
      await expect(row).toContainText('Not sent locally');
      await expect(row).not.toContainText(/Accepted by|SendGrid/);
    }
    await screens('local-notification-delivery-log');
    const result = await context.request.post(`${origin}/api/app/subscribers/${subscribers[0].id}/confirm-local`, { headers: { Origin: origin }, data: {} });
    assert.equal(result.status(), 409, 'confirmation cannot be replayed on an active subscriber');
    await page.goto(origin + '/app/subscribers'); await operatorHydrated(page);
    const add = page.getByRole('region', { name: 'Add subscriber', exact: true });
    const addedEmail = 'synthetic-lamp-local-added@example.test';
    await add.getByLabel('Email address', { exact: true }).fill(addedEmail);
    await add.getByRole('button', { name: 'Add subscriber', exact: true }).click();
    await expect(add.getByRole('status')).toContainText(/No email was sent on this computer/);
    await screens('local-add-subscriber');
    await page.goto(origin + '/app/subscribers?view=log'); await operatorHydrated(page);
    const added = page.getByRole('region', { name: 'Subscription emails', exact: true }).getByRole('row').filter({ hasText: addedEmail });
    await added.getByRole('button', { name: 'Confirm locally', exact: true }).click();
    await expect(added).toContainText('active subscriber');

    // Remove through the desk, then inspect both anonymous histories. Erasure
    // must not replace a personal address with an internal identifier on screen.
    await page.goto(origin + '/app/subscribers'); await operatorHydrated(page);
    const directory = page.getByRole('region', { name: 'Subscriber records', exact: true });
    const rowCount = await directory.locator('tbody tr').count();
    const historyBefore = await api('/api/app/deliveries?limit=100');
    for (const subscriber of subscribers) {
      const index = await directory.locator('tbody tr').evaluateAll((rows, email) => rows.findIndex(row => row.textContent.includes(email)), subscriber.destination);
      assert.ok(index >= 0);
      const removed = page.waitForResponse(response => response.url().endsWith(`/api/app/subscribers/${subscriber.id}`) && response.request().method() === 'DELETE');
      page.once('dialog', dialog => dialog.accept());
      await directory.getByRole('row').filter({ hasText: subscriber.destination }).getByRole('button', { name: 'Remove', exact: true }).click();
      assert.equal((await removed).status(), 204);
      await expect(directory).not.toContainText(subscriber.destination);
      await expect(directory.locator('tbody tr')).toHaveCount(rowCount);
      const anonymous = directory.locator('tbody tr').nth(index);
      assert.ok((await anonymous.locator('.subscriber-destination strong').innerText()).trim().length > 0, 'the retained anonymous row has a readable label');
      await expect(anonymous.getByRole('button')).toHaveCount(0, 'an erased subscriber cannot be removed again');
    }
    const assertAnonymousDesk = async () => {
      for (const subscriber of subscribers) for (const value of [subscriber.id, 'deleted:', ...subscriber.destination.split('@')]) {
        await expect(page.locator('main')).not.toContainText(value);
      }
    };
    await assertAnonymousDesk();
    await screens('local-removed-subscribers');
    await page.goto(origin + '/app/subscribers?view=log'); await operatorHydrated(page);
    await expect(records.locator('tbody tr')).toHaveCount(historyBefore.deliveries.length);
    await expect(page.locator('.table-scroll[aria-label="Subscription emails"] tbody tr')).toHaveCount(historyBefore.subscriptionMail.length);
    await assertAnonymousDesk();
    const retained = (await api(`/api/app/deliveries?incidentUpdateId=${update.id}`)).deliveries;
    const historyFacts = rows => rows.map(({ id, subscriberId, incidentUpdateId, channel, outcome, queuedAt, outcomeAt }) => ({ id, subscriberId, incidentUpdateId, channel, outcome, queuedAt, outcomeAt }));
    assert.deepEqual(historyFacts(retained), historyFacts(logged), 'removal preserves the complete non-identifying delivery history');
    await screens('local-removed-delivery-log');
    await page.goto(`${origin}/app/incidents/${incident.id}`); await operatorHydrated(page);
    const remainingFollowers = (await api(`/api/app/incidents/${incident.id}/subscribers`)).subscribers;
    assert.ok(!remainingFollowers.some(row => row.id === subscribers.find(row => row.destination === incidentEmail).id), 'erasure removes the personal incident subscription as before');
    await assertAnonymousDesk();
  } catch (cause) {
    console.error('Local subscriber journey at', page.url(), await page.locator('body').innerText());
    throw cause;
  } finally { await page.close(); }
}
