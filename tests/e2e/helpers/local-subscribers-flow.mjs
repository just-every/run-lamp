import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import { operatorHydrated } from './operator-hydrated.mjs';
import { withDraftVersion } from '../draft-version-helper.mjs';
import { providerSettingsGuideFlow } from './provider-settings-guide-flow.mjs';

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
    // The actual local sender suppresses delivery even with a provider name in
    // the development bindings. Settings must expose that same mode, with no
    // active primary, before the public journey produces suppressed records.
    const mailSettings = await api('/api/app/mail-settings');
    assert.equal(mailSettings.local, true);
    assert.equal(mailSettings.primaryProvider, null);
    await page.goto(origin + '/app/settings#notifications'); await operatorHydrated(page);
    const emailStatus = page.getByRole('region', { name: 'Email delivery', exact: true }).getByRole('status');
    await expect(emailStatus).toHaveAttribute('data-mail-mode', 'local');
    assert.equal(await emailStatus.getAttribute('data-provider'), null);
    const smsSettings = await api('/api/app/sms/settings');
    await expect(page.getByRole('region', { name: 'SMS delivery', exact: true }).getByRole('status'))
      .toHaveAttribute('data-sms-configured', String(smsSettings.configured));
    await screens('local-notification-settings');
    await providerSettingsGuideFlow(page);
    await api('/api/app/prelaunch', { enabled: false }, 'PATCH');
    const { component } = await api('/api/app/components', { groupId: null, name: 'Synthetic Lamp local payments', description: '', internal: false, displayOrder: 1, note: '' });
    const { component: orders } = await api('/api/app/components', { groupId: null, name: 'Synthetic Lamp local orders', description: '', internal: false, displayOrder: 2, note: '' });
    await page.goto(publicOrigin + '/');
    const form = page.locator('form[action="/subscribe"]');
    await form.locator('input[name="email"]').fill(pageEmail);
    await form.locator('summary').first().click();
    await form.getByLabel(component.name, { exact: true }).check();
    await form.locator('button[type="submit"]').click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Local subscription');
    await expect(page.locator('main')).toContainText(/No email was sent on this computer/);
    await expect(page.locator('main')).not.toContainText(/We sent|Check your inbox|SendGrid/);
    await screens('local-page-subscription');
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
    await add.getByRole('checkbox', { name: orders.name, exact: true }).check();
    await add.getByRole('button', { name: 'Add subscriber', exact: true }).click();
    await expect(add.getByRole('status')).toContainText(/No email was sent on this computer/);
    await screens('local-add-subscriber');
    await page.goto(origin + '/app/subscribers?view=log'); await operatorHydrated(page);
    const added = page.getByRole('region', { name: 'Subscription emails', exact: true }).getByRole('row').filter({ hasText: addedEmail });
    await added.getByRole('button', { name: 'Confirm locally', exact: true }).click();
    await expect(added).toContainText('active subscriber');

    await page.goto(origin + '/app/subscribers'); await operatorHydrated(page);
    const selectedRows = page.getByRole('region', { name: 'Subscriber records', exact: true });
    for (const [email, followed, excluded] of [[pageEmail, component, orders], [addedEmail, orders, component]]) {
      const selection = selectedRows.getByRole('row').filter({ hasText: email }).locator('[data-label="Selection"]');
      await expect(selection).toContainText(followed.name);
      await expect(selection).not.toContainText(excluded.name);
    }
    await screens('local-subscriber-component-names');

    // The CSV's ordinary review, apply and invite buttons use the real silent
    // local transport. The invitation result must describe that same outcome.
    const imports = page.getByRole('region', { name: 'Import and export subscribers', exact: true });
    const importedEmails = ['synthetic-lamp-local-import-1@example.test', 'synthetic-lamp-local-import-2@example.test'];
    await imports.getByLabel('CSV contents', { exact: true }).fill(['email', ...importedEmails].join('\n'));
    await imports.getByRole('button', { name: 'Dry run CSV', exact: true }).click();
    await expect(imports.getByRole('button', { name: 'Create pending subscriptions', exact: true })).toBeEnabled();
    const applied = page.waitForResponse(response => response.url().endsWith('/api/app/subscribers/import/apply') && response.request().method() === 'POST');
    await imports.getByRole('button', { name: 'Create pending subscriptions', exact: true }).click();
    const applyResponse = await applied;
    assert.equal(applyResponse.status(), 200);
    const batch = await applyResponse.json();
    const picker = imports.getByLabel('Import batch');
    await expect(picker).toHaveValue(batch.batchId);
    const label = await picker.locator('option:checked').innerText();
    assert.ok(!label.includes(batch.batchId) && !label.includes(batch.batchId.slice(-6)), 'the batch label exposes no internal identifier');
    assert.match(label, /CSV/i);
    assert.ok(label.includes(String(importedEmails.length)) && /\d{4}/.test(label), 'the batch retains its remaining count and import time');
    for (const email of importedEmails) await expect(selectedRows.getByRole('row').filter({ hasText: email }).locator('[data-label="Selection"]')).toContainText(/All components/i);
    const invited = page.waitForResponse(response => response.url().endsWith(`/${batch.batchId}/send-invitations`) && response.request().method() === 'POST');
    await imports.getByRole('button', { name: 'Send invitations', exact: true }).click();
    const inviteResponse = await invited;
    assert.equal(inviteResponse.status(), 200);
    await expect(imports.getByRole('status')).toContainText(/No email was sent/i);
    await expect(imports.getByRole('status')).not.toContainText(/\b\d+ invitations? sent/i);
    await expect(imports.getByRole('button', { name: 'Send invitations', exact: true })).toBeDisabled();
    await imports.scrollIntoViewIfNeeded(); await screens('local-import-invitation-result');
    await imports.getByRole('link', { name: /Confirm locally.*Delivery log/i }).click();
    await operatorHydrated(page);
    for (const email of importedEmails) {
      const row = page.getByRole('region', { name: 'Subscription emails', exact: true }).getByRole('row').filter({ hasText: email });
      await expect(row).toContainText('Not sent locally');
      await expect(row).toContainText('pending subscriber');
      await row.getByRole('button', { name: 'Confirm locally', exact: true }).click();
      await expect(row).toContainText('active subscriber');
    }

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
