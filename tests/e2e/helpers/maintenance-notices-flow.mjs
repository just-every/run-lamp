import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { openStatusJourney, eventually } from './status-journey.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

const hour = 3_600_000;
const iso = value => new Date(value).toISOString();

export async function maintenanceReminderTimingFlow() {
  const providerRequests = [];
  const j = await openStatusJourney({
    workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts',
    providerEdge: async request => {
      const url = new URL(request.url);
      if (url.origin === 'https://api.resend.com' && url.pathname === '/emails') {
        providerRequests.push({
          idempotencyKey: request.headers.get('Idempotency-Key'),
          message: await request.clone().json(),
        });
      }
    },
  });
  try {
    const now = Date.now() + 60_000;
    await j.json('/test/clock', 'PUT', { now }, 204);
    const component = await j.component('synthetic-maintenance-timing');
    const otherComponent = await j.component('synthetic-maintenance-unrelated');
    const create = async (title, starts) => (await j.json('/api/app/maintenance', 'POST', {
      title, affectedAudience: 'Account owners', customerImpact: 'Updates will pause.',
      startsAt: iso(starts), endsAt: iso(starts + hour), componentIds: [component.id], autoStart: true, autoComplete: true,
    }, 201)).maintenance;
    const reader = ['synthetic-lamp-1', 'example.test'].join('@');
    const otherReader = ['synthetic-lamp-2', 'example.test'].join('@');
    for (const [email, selected] of [[reader, component], [otherReader, otherComponent]]) {
      assert.equal((await j.raw(j.publicOrigin + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email, componentId: selected.id }) })).status, 202);
      const confirmation = await eventually(() => j.messages.find(mail => mail.to.includes(email)), Boolean, 'reminder subscriber confirmation');
      assert.equal((await j.raw(confirmation.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0])).status, 200);
    }
    const subscribers = (await j.json('/api/app/subscribers')).subscribers;
    const selectedReader = subscribers.find(row => row.destination === reader);
    for (const [subscriber, selected] of [[selectedReader, component], [subscribers.find(row => row.destination === otherReader), otherComponent]]) {
      assert.ok(subscriber, 'confirmed subscriber is in the native directory');
      assert.equal(subscriber.state, 'active');
      assert.equal(subscriber.selectionMode, 'selected');
      assert.deepEqual(subscriber.componentSelections.map(row => row.componentId), [selected.id]);
    }
    const early = await create('Advance notice', now + 48 * hour);
    const tonight = await create('Tonight’s upgrade', now + 6 * hour);
    const atBoundary = await create('Tomorrow’s upgrade', now + 24 * hour);
    const changed = await create('Changed upgrade', now + 50 * hour);
    const cancelled = await create('Cancelled upgrade', now + 48 * hour);
    await j.json(`/api/app/maintenance/${cancelled.id}/cancel`, 'POST', {});
    const read = async item => (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === item.id);
    const reminders = async item => (await read(item)).notices.filter(row => row.kind === 'reminder');
    const tick = async time => { await j.json('/test/clock', 'PUT', { now: time }, 204); await j.tick(time); };
    const earlyDeliveries = async () => (await j.json('/api/app/deliveries')).deliveries.filter(row => row.maintenanceId === early.id);
    const earlyMail = () => j.messages.filter(mail => mail.subject.endsWith(early.title));
    const assertNoticeDelivery = async (kind, state, subjectPrefix) => {
      const window = await read(early);
      assert.equal(window.state, state);
      const notices = window.notices.filter(row => row.kind === kind);
      assert.equal(notices.length, 1, `one ${kind} notice for the advance window`);
      const [notice] = notices;
      assert.equal(notice.maintenanceId, early.id);
      const [delivery] = await eventually(async () => (await earlyDeliveries()).filter(row => row.maintenanceNoticeKind === kind),
        rows => rows.length === 1 && Boolean(rows[0].providerAcceptedAt), `the ${kind} notice reaches its confirmed subscriber`);
      assert.deepEqual(
        [delivery.subscriberId, delivery.destination, delivery.channel, delivery.maintenanceReference, delivery.queuedAt],
        [selectedReader.id, reader, 'email', early.reference, notice.publishedAt],
      );
      // The delivery log exposes the notice kind. Read the stored event link to
      // distinguish this notice from another publication of the same kind.
      const event = await j.db.prepare('SELECT notification_event_id, notification_event_type FROM notification_delivery_records WHERE id = ?').bind(delivery.id).first();
      assert.deepEqual(event, { notification_event_id: notice.id, notification_event_type: 'maintenance-notice' });
      const idempotencyKey = `notification/${delivery.id}`;
      const requests = providerRequests.filter(request => request.idempotencyKey === idempotencyKey);
      const receipts = j.mailReceipts.filter(row => row.idempotencyKey === idempotencyKey);
      const submissions = earlyMail().filter(mail => mail.subject.endsWith(`: ${subjectPrefix}: ${early.title}`));
      assert.equal(requests.length, 1, `one captured provider request for the ${kind} delivery`);
      assert.equal(receipts.length, 1, 'the same request receives one provider acceptance');
      const { results: attempts } = await j.db.prepare('SELECT provider_message_id FROM notification_attempt_records WHERE delivery_id = ?').bind(delivery.id).all();
      assert.deepEqual(attempts, [{ provider_message_id: receipts[0].id }]);
      const [{ message }] = requests;
      assert.deepEqual(submissions, [message]);
      assert.deepEqual(message.to, [reader]);
      assert.equal(message.headers['Message-ID'], `<lamp-notification-${delivery.id}@${new URL(j.publicOrigin).host}>`);
      assert.ok(message.text.split('\n\n').includes(`Status: ${state}`));
      return { notice, delivery };
    };
    await tick(now + 2 * 60_000);
    for (const item of [early, tonight, atBoundary, changed, cancelled]) assert.equal((await reminders(item)).length, 0, `${item.title}: no reminder minutes after scheduling`);
    await assertNoticeDelivery('scheduled', 'Scheduled', 'Scheduled');
    const followUps = (await j.json('/api/app/overview/follow-ups')).followUps;
    assert.ok(!followUps.some(row => row.kind === 'maintenance-reminder' && [tonight.id, atBoundary.id].some(id => row.id.endsWith(id))), 'a notice inside the lead window creates no reminder debt');
    await tick(now + 24 * hour - 1);
    assert.equal((await reminders(early)).length, 0, 'the reminder cannot precede the lead boundary');
    await tick(now + 24 * hour);
    assert.equal((await reminders(early)).length, 1, 'an advance announcement gets its reminder at the lead boundary');
    await assertNoticeDelivery('reminder', 'Scheduled', 'Reminder');
    assert.equal((await reminders(cancelled)).length, 0, 'cancelled work never reminds');
    await j.json(`/api/app/maintenance/${changed.id}/window`, 'PUT', { startsAt: iso(now + 48 * hour), endsAt: iso(now + 49 * hour) });
    await tick(now + 26 * hour);
    assert.equal((await reminders(changed)).length, 0, 'a change notice inside the lead window replaces the reminder');
    await tick(now + 27 * hour);
    assert.equal((await reminders(early)).length, 1, 'repeated scheduled runs cannot repeat a reminder');

    for (const [time, kind, previousState, state, subjectPrefix] of [
      [Date.parse(early.startsAt), 'started', 'Scheduled', 'In progress', 'Started'],
      [Date.parse(early.endsAt), 'completed', 'In progress', 'Completed', 'Completed'],
    ]) {
      const before = await read(early);
      const priorDeliveries = await earlyDeliveries();
      const priorMailCount = earlyMail().length;
      assert.equal(before.state, previousState);
      assert.ok(!before.notices.some(row => row.kind === kind));
      assert.ok(!priorDeliveries.some(row => row.maintenanceNoticeKind === kind));
      await tick(time);
      const { notice, delivery } = await assertNoticeDelivery(kind, state, subjectPrefix);
      assert.equal(notice.publishedAt, iso(time));
      assert.equal(notice.authorOperatorId, null, 'Cron publishes the transition without an operator');
      const window = await read(early);
      const deliveries = await earlyDeliveries();
      assert.deepEqual(window.notices.filter(row => row.id !== notice.id), before.notices);
      assert.deepEqual(deliveries.filter(row => row.id !== delivery.id), priorDeliveries);
      const submissions = earlyMail();
      assert.equal(submissions.length, priorMailCount + 1, `Cron sends only the ${kind} message for this window`);
      const requestCount = providerRequests.length;
      const receiptCount = j.mailReceipts.length;
      await j.tick(time);
      await tick(time + 60_000);
      assert.deepEqual(await read(early), window, `repeating Cron at ${kind} retains the exact notices and state`);
      assert.deepEqual(await earlyDeliveries(), deliveries, `repeating Cron at ${kind} retains the exact deliveries`);
      assert.deepEqual(earlyMail(), submissions, `repeating Cron at ${kind} sends no more window mail`);
      assert.equal(providerRequests.length, requestCount, `repeating Cron at ${kind} makes no additional provider requests`);
      assert.equal(j.mailReceipts.length, receiptCount, `repeating Cron at ${kind} yields no new provider acceptances`);
    }
    assert.deepEqual((await earlyDeliveries()).map(row => row.maintenanceNoticeKind), ['scheduled', 'reminder', 'started', 'completed']);
    assert.equal(earlyMail().length, 4, 'each of the four notices reached only the selected subscriber once');
  } finally { await j.close(); }
}

export async function maintenanceCancellationFlow() {
  const j = await openStatusJourney({ pageHost: 'localhost', builtWorker: true });
  let browser;
  try {
    const now = Date.parse('2031-02-10T12:00:00.000Z');
    await j.json('/test/clock', 'PUT', { now }, 204);
    await j.signIn(undefined, { fresh: true });
    const { settings } = await j.json('/api/app/page-settings');
    const { pageName, tagline, accentColor, hostname, footerCreditEnabled, widgetAllowedOrigins, mailFromAddress } = settings;
    await j.json('/api/app/page-settings', 'PUT', { pageName, tagline, accentColor, hostname, footerCreditEnabled, widgetAllowedOrigins, mailFromAddress, timezone: 'Australia/Brisbane' });
    const component = await j.component('Billing');
    const reader = 'synthetic-maintenance-reader@example.test';
    assert.equal((await j.raw(j.publicOrigin + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: reader, componentId: component.id }) })).status, 202);
    const confirmation = await eventually(() => j.messages.find(mail => mail.to.includes(reader)), Boolean, 'subscriber confirmation');
    assert.equal((await j.raw(confirmation.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0])).status, 200);
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const context = await browser.newContext({ timezoneId: 'America/Los_Angeles', viewport: { width: 1440, height: 1000 } });
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
    await form.getByLabel('Starts', { exact: true }).fill('2031-02-11T04:00');
    await form.getByLabel('Ends', { exact: true }).fill('2031-02-11T05:00');
    const readPreviewEffects = async () => {
      const published = await j.publicResponse('/api/public/status');
      assert.equal(published.status, 200);
      const generation = published.headers.get('x-lamp-snapshot-version');
      await published.text();
      assert.ok(generation, 'the public page already serves a retained generation');
      const tables = ['maintenance_notices', 'notification_delivery_records', 'notification_outbox'];
      const stored = await j.db.batch(tables.map(table => j.db.prepare(`SELECT id FROM ${table} ORDER BY id`)));
      return {
        windows: (await j.json('/api/app/maintenance')).maintenance,
        generation, build: await j.db.prepare('SELECT next_generation FROM snapshot_build_control').first(),
        rows: stored.map(result => result.results),
        sent: j.messages.length, accepted: j.mailReceipts.length,
      };
    };
    await j.visible('/', component.name);
    const beforePreview = await readPreviewEffects();
    const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/app/maintenance/preview');
    await form.getByRole('button', { name: 'Preview notice', exact: true }).click();
    const previewResponse = await responsePromise;
    assert.equal(previewResponse.status(), 200);
    assert.equal(previewResponse.headers()['cache-control'], 'no-store');
    const anonymousPreview = await j.raw(j.appOrigin + '/api/app/maintenance/preview', {
      method: 'POST', headers: { Origin: j.appOrigin, 'Content-Type': 'application/json' }, body: previewResponse.request().postData(),
    });
    assert.equal(anonymousPreview.status, 401);
    await anonymousPreview.text();
    const preview = form.getByRole('complementary', { name: 'Scheduled notice preview' });
    await preview.getByRole('heading', { name: title, exact: true }).waitFor();
    const readWindow = async target => ({
      wording: (await target.innerText()).replace(/\s+/g, ' '),
      instants: await target.locator('time').evaluateAll(times => times.map(time => time.dateTime)),
    });
    const readWording = target => target.locator('dl > div').evaluateAll(fields => fields.map(field => [field.querySelector('dt').textContent, field.querySelector('dd').textContent]));
    const pageCard = preview.locator('.preview-card');
    assert.equal(await pageCard.locator('.state-pill').textContent(), 'Scheduled');
    const previewWindow = await readWindow(pageCard.locator('.maintenance-window'));
    assert.deepEqual(previewWindow, { wording: 'Feb 11, 04:00 AM – 05:00 AM Brisbane time', instants: ['2031-02-10T18:00:00.000Z', '2031-02-10T19:00:00.000Z'] });
    const previewWording = await readWording(pageCard);
    assert.deepEqual(previewWording, [['Who is affected', audience], ['Customer impact', impact]]);
    const previewProof = process.env.LAMP_MAINTENANCE_PREVIEW_EVIDENCE;
    const capturePreview = async name => {
      if (!previewProof) return;
      await mkdir(previewProof, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: `${previewProof}/scheduled-${name}-${width}.png`, fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    };
    await capturePreview('page');
    await preview.getByRole('button', { name: 'Email', exact: true }).click();
    const emailCard = preview.locator('.email-preview');
    const emailContent = emailCard.frameLocator('iframe[title="Notification email message"]').locator('main > div');
    await emailContent.waitFor();
    const emailSubject = await emailCard.getByRole('heading').textContent();
    const emailWording = await emailContent.textContent();
    assert.equal(emailSubject, `${pageName}: Scheduled: ${title}`);
    assert.equal(emailWording, [title, 'Status: Scheduled', 'Notice: Scheduled',
      'Start: Feb 11, 2031, 04:00 UTC+10:00', 'End: Feb 11, 2031, 05:00 UTC+10:00',
      `Who is affected: ${audience}`, `Customer impact: ${impact}`].join('\n\n'));
    await capturePreview('email');
    assert.deepEqual(await readPreviewEffects(), beforePreview, 'preview creates no window, notice, generation, delivery or send');
    assert.ok(!(await j.publicText('/')).includes(title), 'the draft wording is absent from the public page');

    const scheduled = page.waitForResponse(response => response.url().endsWith('/api/app/maintenance') && response.request().method() === 'POST');
    await form.getByRole('button', { name: 'Schedule window', exact: true }).click();
    const item = (await (await scheduled).json()).maintenance;
    const read = async () => (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === item.id);
    const row = page.locator('.maintenance-row').filter({ hasText: title });
    const customerMail = () => j.messages.filter(mail => mail.to.includes(reader) && !mail.text.includes('/confirm-subscription/'));
    await j.tick(now + 120_000);
    assert.equal((await read()).notices.filter(notice => notice.kind === 'reminder').length, 0);
    const [scheduledEmail] = await eventually(customerMail, messages => messages.length === 1, 'one scheduling email');
    assert.equal(scheduledEmail.subject, emailSubject);
    assert.equal(scheduledEmail.text.split('\n\n').slice(1, -1).join('\n\n'), emailWording);
    const publicPath = '/maintenance/' + item.reference;
    await j.visible(publicPath, impact);
    await publicPage.goto(j.publicOrigin + publicPath);
    const publicRecord = publicPage.locator('article.maintenance');
    assert.equal(await publicRecord.getByRole('heading', { level: 1 }).textContent(), title);
    assert.equal(await publicRecord.locator('.state-pill').textContent(), 'Scheduled');
    assert.deepEqual(await readWindow(publicRecord.locator('.maintenance-window')), previewWindow);
    const publicScheduled = publicRecord.locator('.maintenance-notice').filter({ has: publicPage.locator('.update-head strong', { hasText: /^scheduled$/ }) });
    assert.deepEqual(await readWording(publicScheduled), previewWording);
    if (previewProof) await writeFile(`${previewProof}/preview-receipt.json`, JSON.stringify({
      widths: [1440, 390], assertionsWidth: 1440, pageWindow: previewWindow, wording: previewWording,
      emailSubject, emailWording, publicPermalinkMatched: true, capturedEmailMatched: true,
      previewEffectsUnchanged: true, generation: beforePreview.generation,
    }, null, 2) + '\n');
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
