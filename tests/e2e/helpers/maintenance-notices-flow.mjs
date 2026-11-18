import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { openStatusJourney, eventually } from './status-journey.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

const hour = 3_600_000;
const iso = value => new Date(value).toISOString();

export async function maintenanceReminderTimingFlow() {
  const j = await openStatusJourney({ workerEntry: "tests/e2e/helpers/automation-clock-worker.ts" });
  try {
    const now = Date.now() + 60_000;
    await j.json('/test/clock', 'PUT', { now }, 204);
    const component = await j.component('synthetic-maintenance-timing');
    const create = async (title, starts) => (await j.json('/api/app/maintenance', 'POST', {
      title, affectedAudience: 'Account owners', customerImpact: 'Updates will pause.',
      startsAt: iso(starts), endsAt: iso(starts + hour), componentIds: [component.id], autoStart: true, autoComplete: true,
    }, 201)).maintenance;
    const reader = 'synthetic-reminder-reader@example.test';
    assert.equal((await j.raw(j.publicOrigin + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: reader, componentId: component.id }) })).status, 202);
    const confirmation = await eventually(() => j.messages.find(mail => mail.to.includes(reader)), Boolean, 'reminder subscriber confirmation');
    assert.equal((await j.raw(confirmation.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0])).status, 200);
    const early = await create('Advance notice', now + 48 * hour);
    const tonight = await create('Tonight’s upgrade', now + 6 * hour);
    const atBoundary = await create('Tomorrow’s upgrade', now + 24 * hour);
    const changed = await create('Changed upgrade', now + 50 * hour);
    const cancelled = await create('Cancelled upgrade', now + 48 * hour);
    await j.json(`/api/app/maintenance/${cancelled.id}/cancel`, 'POST', {});
    const read = async item => (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === item.id);
    const reminders = async item => (await read(item)).notices.filter(row => row.kind === 'reminder');
    const tick = async time => { await j.json('/test/clock', 'PUT', { now: time }, 204); await j.tick(time); };
    await tick(now + 2 * 60_000);
    for (const item of [early, tonight, atBoundary, changed, cancelled]) assert.equal((await reminders(item)).length, 0, `${item.title}: no reminder minutes after scheduling`);
    const followUps = (await j.json('/api/app/overview/follow-ups')).followUps;
    assert.ok(!followUps.some(row => row.kind === 'maintenance-reminder' && [tonight.id, atBoundary.id].some(id => row.id.endsWith(id))), 'a notice inside the lead window creates no reminder debt');
    await tick(now + 24 * hour - 1);
    assert.equal((await reminders(early)).length, 0, 'the reminder cannot precede the lead boundary');
    await tick(now + 24 * hour);
    assert.equal((await reminders(early)).length, 1, 'an advance announcement gets its reminder at the lead boundary');
    const reminderDeliveries = await eventually(async () => (await j.json('/api/app/deliveries')).deliveries.filter(row => row.maintenanceReference === early.reference && row.maintenanceNoticeKind === 'reminder'), rows => rows.length === 1 && Boolean(rows[0].providerAcceptedAt), 'due reminder reaches its confirmed subscriber');
    assert.equal(reminderDeliveries[0].destination, reader);
    assert.equal((await reminders(cancelled)).length, 0, 'cancelled work never reminds');
    await j.json(`/api/app/maintenance/${changed.id}/window`, 'PUT', { startsAt: iso(now + 48 * hour), endsAt: iso(now + 49 * hour) });
    await tick(now + 26 * hour);
    assert.equal((await reminders(changed)).length, 0, 'a change notice inside the lead window replaces the reminder');
    await tick(now + 27 * hour);
    assert.equal((await reminders(early)).length, 1, 'repeated scheduled runs cannot repeat a reminder');
  } finally { await j.close(); }
}

export async function maintenanceCancellationFlow() {
  const j = await openStatusJourney({ pageHost: 'localhost', builtWorker: true });
  let browser;
  try {
    const now = Date.now();
    await j.json('/test/clock', 'PUT', { now }, 204);
    const component = await j.component('Billing');
    const reader = 'synthetic-maintenance-reader@example.test';
    assert.equal((await j.raw(j.publicOrigin + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: reader, componentId: component.id }) })).status, 202);
    const confirmation = await eventually(() => j.messages.find(mail => mail.to.includes(reader)), Boolean, 'subscriber confirmation');
    assert.equal((await j.raw(confirmation.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0])).status, 200);
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const [name, ...value] = j.cookie.split('=');
    await context.addCookies([{ name, value: value.join('='), url: j.appOrigin }]);
    const page = await context.newPage(), publicPage = await context.newPage();
    await page.goto(j.appOrigin + '/app/maintenance'); await operatorHydrated(page);
    const form = page.locator('#schedule-maintenance');
    const title = 'Billing system upgrade';
    const audience = 'Account owners who use billing and invoices';
    const impact = 'Invoices and payment settings will be read-only during the upgrade.';
    await form.getByLabel('Title', { exact: true }).fill(title);
    await form.getByLabel('Affected audience', { exact: true }).fill(audience);
    await form.getByLabel('Customer impact', { exact: true }).fill(impact);
    await form.getByLabel(component.name, { exact: true }).check();
    await form.getByLabel('Starts', { exact: true }).fill(iso(now + 6 * hour).slice(0, 16));
    await form.getByLabel('Ends', { exact: true }).fill(iso(now + 7 * hour).slice(0, 16));
    const scheduled = page.waitForResponse(response => response.url().endsWith('/api/app/maintenance') && response.request().method() === 'POST');
    await form.getByRole('button', { name: 'Schedule window', exact: true }).click();
    const item = (await (await scheduled).json()).maintenance;
    const read = async () => (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === item.id);
    const row = page.locator('.maintenance-row').filter({ hasText: title });
    const customerMail = () => j.messages.filter(mail => mail.to.includes(reader) && !mail.text.includes('/confirm-subscription/'));
    await j.tick(now + 120_000);
    assert.equal((await read()).notices.filter(notice => notice.kind === 'reminder').length, 0);
    await eventually(customerMail, messages => messages.length === 1, 'one scheduling email');
    await row.getByRole('button', { name: 'Cancel maintenance', exact: true }).click();
    const cancelForm = row.getByRole('form', { name: 'Cancel maintenance', exact: true });
    await cancelForm.waitFor();
    assert.equal((await read()).state, 'Scheduled', 'opening confirmation never cancels');
    assert.equal(customerMail().length, 1, 'reviewing cancellation sends no email');
    await cancelForm.getByRole('button', { name: 'Keep scheduled', exact: true }).click();
    assert.equal((await read()).state, 'Scheduled', 'dismissing keeps the window');
    await row.getByRole('button', { name: 'Cancel maintenance', exact: true }).click();
    const proof = process.env.LAMP_MAINTENANCE_PROOF_DIR;
    const capture = async (target, name) => {
      if (!proof) return;
      await mkdir(proof, { recursive: true });
      for (const width of [1440, 390]) {
        await target.setViewportSize({ width, height: 1000 });
        await target.screenshot({ path: `${proof}/${name}-${width}.png`, fullPage: true });
      }
      await target.setViewportSize({ width: 1440, height: 1000 });
    };
    await capture(page, 'after-confirm-cancellation');
    await j.json('/test/clock', 'PUT', { now: now + 120_000 }, 204);
    const reason = 'The upgrade needs more preparation.';
    await cancelForm.getByLabel('Reason for customers (optional)', { exact: true }).fill(reason);
    await cancelForm.getByRole('button', { name: 'Confirm cancellation', exact: true }).click();
    await row.getByText('Cancelled', { exact: true }).waitFor();
    const cancelled = await read();
    assert.equal(cancelled.notices.filter(notice => notice.kind === 'cancelled').length, 1);
    assert.ok(cancelled.notices.find(notice => notice.kind === 'cancelled').body.includes(reason));
    await j.visible('/history', reason);
    await eventually(() => j.publicText('/'), html => !html.includes(title), 'cancellation leaves the upcoming list');
    await j.visible('/maintenance/' + item.reference, reason);
    await publicPage.goto(j.publicOrigin + '/maintenance/' + item.reference);
    const notice = publicPage.locator('.maintenance-notice').filter({ hasText: reason });
    assert.equal(await notice.locator('dd').filter({ hasText: audience }).count(), 1);
    assert.equal(await notice.locator('dd').filter({ hasText: impact }).count(), 1);
    assert.ok(!(await publicPage.locator('body').innerText()).includes(item.reference), 'public notice hides internal references');
    await capture(publicPage, 'after-public-cancelled');
    await eventually(customerMail, messages => messages.length === 2, 'cancellation email');
    assert.ok(customerMail().at(-1).text.includes(reason));
    await capture(page, 'after-owner-cancelled');
    await row.getByRole('button', { name: 'Reinstate maintenance', exact: true }).click();
    const restore = row.getByRole('form', { name: 'Reinstate maintenance', exact: true });
    await restore.getByRole('button', { name: 'Keep cancelled', exact: true }).click();
    assert.equal((await read()).state, 'Cancelled');
    await row.getByRole('button', { name: 'Reinstate maintenance', exact: true }).click();
    await capture(page, 'after-confirm-reinstatement');
    await j.json('/test/clock', 'PUT', { now: now + 180_000 }, 204);
    await restore.getByRole('button', { name: 'Confirm reinstatement', exact: true }).click();
    await row.getByText('Scheduled', { exact: true }).waitFor();
    const restored = await read();
    assert.deepEqual([restored.id, restored.reference, restored.startsAt, restored.endsAt, restored.autoStart, restored.autoComplete], [item.id, item.reference, item.startsAt, item.endsAt, item.autoStart, item.autoComplete], 'undo restores the same window and automation');
    assert.deepEqual(restored.notices.map(notice => notice.kind).sort(), ['cancelled', 'rescheduled', 'scheduled']);
    assert.equal((await j.json('/api/app/maintenance')).maintenance.length, 1, 'no replacement record is created');
    await j.json(`/api/app/maintenance/${item.id}/reinstate`, 'POST', { startsAt: item.startsAt, endsAt: item.endsAt }, 409);
    await j.tick(now + 180_000); await j.tick(now + 180_000);
    await eventually(customerMail, messages => messages.length === 3, 'reinstatement tells the previous audience once');
    assert.ok(customerMail().every(mail => !mail.subject.includes(item.reference) && !mail.text.includes(item.reference)), 'email keeps customer wording without internal references');
    await j.visible('/', impact);
    await publicPage.goto(j.publicOrigin + '/');
    await capture(publicPage, 'after-public-upcoming');
    await publicPage.goto(j.publicOrigin + '/maintenance/' + item.reference);
    await capture(publicPage, 'after-public-reinstated');
    await page.goto(j.appOrigin + '/app/subscribers'); await operatorHydrated(page);
    await page.getByRole('link', { name: 'Delivery log', exact: true }).click();
    await page.getByText(title, { exact: false }).first().waitFor();
    await capture(page, 'after-delivery-log');
    // Restore controls accept revised dates when the original window is past.
    await j.json(`/api/app/maintenance/${item.id}/cancel`, 'POST', {});
    assert.equal((await read()).notices.filter(notice => notice.kind === 'cancelled').length, 2, 'a reinstated window can be cancelled again');
    await j.json(`/api/app/maintenance/${item.id}/cancel`, 'POST', {}, 409);
    await j.json(`/api/app/maintenance/${item.id}/reinstate`, 'POST', { startsAt: iso(now - hour), endsAt: iso(now) }, 409);
    assert.equal((await read()).state, 'Cancelled', 'invalid reinstatement cannot publish or reopen the window');
    const changedStart = iso(now + 2 * hour), changedEnd = iso(now + 3 * hour);
    await j.json(`/api/app/maintenance/${item.id}/reinstate`, 'POST', { startsAt: changedStart, endsAt: changedEnd });
    await j.json('/test/clock', 'PUT', { now: now + 2 * hour }, 204); await j.tick(now + 2 * hour);
    assert.equal((await read()).state, 'In progress', 'reinstatement preserves automatic start');
    await j.json('/test/clock', 'PUT', { now: now + 3 * hour }, 204); await j.tick(now + 3 * hour);
    assert.equal((await read()).state, 'Completed', 'reinstatement preserves automatic completion');
    if (proof) await writeFile(`${proof}/after-receipt.json`, JSON.stringify({ widths: [1440, 390], assertionsWidth: 1440, confirmationDismissedWithoutChange: true, cancelledWithReason: true, restoredSameWindow: true, noticeKindsAfterUndo: restored.notices.map(n => n.kind), nearStartReminderCount: restored.notices.filter(n => n.kind === 'reminder').length, subscriberMessagesAfterUndo: 3, automaticTransitionsAfterUndo: ['In progress', 'Completed'], networkEdges: 'Synthetic mail provider only; no hosted inbox claim' }, null, 2) + '\n');
  } finally { await browser?.close(); await j.close(); }
}
