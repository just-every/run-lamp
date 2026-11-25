import { localSubscribersFlow } from "./helpers/local-subscribers-flow.mjs";
import {appHost, appOrigin, pageOrigin} from './helpers/hosts.mjs';
import { devKey } from '../helpers/dev-key.mjs';
import { auditDesktopSurfaces } from './helpers/accessibility-subscription-flow.mjs';
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { insertRealOperatorSession } from "./real-session-helper.mjs";
import { reservePort, startViteWorker } from "./worker-startup.mjs";
import { sessionCookieName } from "../helpers/session-cookie.mjs";
import { operatorHydrated } from "./helpers/operator-hydrated.mjs";
import { newIncidentForm } from "./helpers/incident-composer.mjs";
import { expect } from "@playwright/test";

let worker, browser, context, page, statePath, cachePath, origin, sessionId;
const subscriberTokenSecret = "synthetic-lamp-020-subscriber-token-secret";
before(async () => {
  const firstPort = await reservePort({ label: "Maintenance timezone Worker" });
  const configureOrigin = (port) => {
    // Exercise the shipped silent development-mail transport. Its local key
    // stays in this isolated Worker fixture; the real operator session remains
    // the authority because development identity is disabled.
    return appOrigin(port, { SUBSCRIBER_TOKEN_SECRET: subscriberTokenSecret,
      RER_DEV_KEY: devKey, RER_DEV_ORIGIN: `http://${appHost}:${port}`, RER_DEV_IDENTITY: "off" });
  };
  origin = configureOrigin(firstPort);
  statePath = await mkdtemp(join(tmpdir(), "lamp-maintenance-timezone-d1-"));
  cachePath = await mkdtemp(resolve("node_modules/.lamp-maintenance-timezone-vite-"));
  execFileSync("pnpm", ["exec", "wrangler", "d1", "migrations", "apply", "DB", "--local", "--config", "wrangler.jsonc", "--persist-to", statePath], { maxBuffer: 8 * 1024 * 1024, stdio: "pipe" });
  sessionId = await insertRealOperatorSession({ persistTo: statePath });
  ({ child: worker } = await startViteWorker({
    label: "Maintenance timezone Worker",
    firstPort,
    start(port) {
      if (port !== firstPort) origin = configureOrigin(port);
      return spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
        detached: true, stdio: "pipe", env: { ...process.env, LAMP_WORKERS_STATE_PATH: statePath, LAMP_VITE_CACHE_DIR: cachePath, LAMP_DISABLE_INSPECTOR: "true" },
      });
    },
  }));
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ["--no-sandbox", "--use-mock-keychain", "--password-store=basic"] });

});
after(async () => {
  await browser?.close();
  if (worker && worker.exitCode === null) {
    const closed = new Promise(resolve => worker.once("close", resolve));
    try { process.kill(-worker.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
    await closed;
  }
  await Promise.all([statePath, cachePath].filter(Boolean).map(path => rm(path, { recursive: true, force: true })));
});

async function api(path, method = "GET", body) {
  const response = await context.request.fetch(`${origin}${path}`, { method, headers:{Origin:origin}, ...(body ? { data: body } : {}) });
  assert.ok(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`);
  return response.json();
}

test("MAINT-009 PAGE-020 — operator schedules, reschedules and publishes maintenance in its configured zone, and public pages remain accessible", { timeout: 360_000 }, async t => {
  context = await browser.newContext({ timezoneId: "America/Los_Angeles", viewport: { width: 1440, height: 1000 } });
  await context.addCookies([{ name: sessionCookieName(origin), value: sessionId, url: origin }]);
  page = await context.newPage();
  try {
    const { settings } = await api("/api/app/page-settings");
    const { pageName, tagline, accentColor, hostname, footerCreditEnabled, widgetAllowedOrigins, mailFromAddress } = settings;
    const configure = timezone => api("/api/app/page-settings", "PUT", { pageName, tagline, accentColor, hostname, footerCreditEnabled, widgetAllowedOrigins, mailFromAddress, timezone });
    await configure("Australia/Brisbane");
    const { component } = await api("/api/app/components", "POST", { groupId: null, name: "Configured-zone service", description: "", internal: false, displayOrder: 200, note: "" });
    await page.goto(`${origin}/app/maintenance`);
    await operatorHydrated(page);
    const create = page.locator(".maintenance-schedule-card");
    await create.getByLabel("Title", { exact: true }).fill("Configured-zone window");
    await create.getByLabel("Affected audience", { exact: true }).fill("Customers using the configured-zone service.");
    await create.getByLabel("Customer impact", { exact: true }).fill("Requests may be interrupted during the configured window.");
    await create.getByLabel("Configured-zone service", { exact: true }).check();
    const orderingHint = create.locator(".window-validation:not(.is-valid)");
    const scheduleWindow = create.getByRole("button", { name: "Schedule window", exact: true });
    assert.equal(await orderingHint.count(), 0);
    await create.getByLabel("Starts", { exact: true }).fill("2027-07-15T09:00");
    assert.equal(await orderingHint.count(), 0);
    for (const end of ["2027-07-15T08:00", "2027-07-15T09:00"]) {
      await create.getByLabel("Ends", { exact: true }).fill(end);
      await orderingHint.waitFor();
      assert.equal(await scheduleWindow.isEnabled(), false);
    }
    await create.getByLabel("Ends", { exact: true }).fill("2027-07-15T10:00");
    await orderingHint.waitFor({ state: "detached" });
    assert.equal(await scheduleWindow.isEnabled(), true);
    await create.getByLabel("Starts", { exact: true }).fill("2027-07-15T11:00");
    await orderingHint.waitFor();
    assert.equal(await scheduleWindow.isEnabled(), false);
    await create.getByLabel("Starts", { exact: true }).fill("");
    await orderingHint.waitFor({ state: "detached" });
    assert.equal(await scheduleWindow.isEnabled(), false);
    await create.getByLabel("Starts", { exact: true }).fill("2027-07-15T09:00");
    assert.equal(await scheduleWindow.isEnabled(), true);
    await create.getByRole("button", { name: "Preview notice", exact: true }).click();
    const preview = create.getByRole("complementary", { name: "Scheduled notice preview" });
    await preview.getByRole("heading", { name: "Configured-zone window", exact: true }).waitFor();
    const previewWindow = preview.locator(".maintenance-window");
    assert.equal((await previewWindow.innerText()).replace(/\s+/g, " "), "Jul 15, 09:00 AM – 10:00 AM Brisbane time");
    const times = target => target.locator("time").evaluateAll(nodes => nodes.map(node => node.dateTime));
    assert.deepEqual(await times(previewWindow), ["2027-07-14T23:00:00.000Z", "2027-07-15T00:00:00.000Z"]);
    assert.equal(await preview.getByRole("button", { name: "Email", exact: true }).count(), 0, "email-off local maintenance has only a page preview");
    const revisedImpact = "Reports may load slowly while the index is rebuilt.";
    await create.getByLabel("Customer impact", { exact: true }).fill(revisedImpact);
    await preview.getByText(revisedImpact, { exact: true }).waitFor();
    assert.deepEqual((await api("/api/app/maintenance")).maintenance, [], "previewing and editing do not create a window");
    const created = page.waitForResponse(response => response.url().endsWith("/api/app/maintenance") && response.request().method() === "POST");
    await create.getByRole("button", { name: "Schedule window", exact: true }).click();
    const window = (await (await created).json()).maintenance;
    assert.equal(window.startsAt, "2027-07-14T23:00:00.000Z"); assert.equal(window.endsAt, "2027-07-15T00:00:00.000Z");
    const permalink = await context.newPage();
    try {
      const publicUrl = `${pageOrigin(new URL(origin).port)}/maintenance/${window.reference}`;
      await expect.poll(async () => (await permalink.goto(publicUrl)).status()).toBe(200);
      const publicWindow = permalink.locator("article.maintenance .maintenance-window");
      await publicWindow.waitFor();
      assert.equal((await publicWindow.innerText()).replace(/\s+/g, " "), "Jul 15, 09:00 AM – 10:00 AM Brisbane time");
      assert.deepEqual(await times(publicWindow), [window.startsAt, window.endsAt]);
      const publicNotice = permalink.locator(".maintenance-notice").filter({ has: permalink.locator(".update-head strong", { hasText: /^scheduled$/ }) });
      assert.deepEqual(await publicNotice.locator("dd").allTextContents(), ["Customers using the configured-zone service.", revisedImpact]);
    } finally { await permalink.close(); }
    await page.goto(`${origin}/app`); await operatorHydrated(page);
    const scheduled = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Scheduled', exact: true }) });
    await scheduled.getByText(window.title, { exact: true }).waitFor();
    assert.match(await scheduled.innerText(), /Jul 15, 2027, 09:00 Brisbane time/);
    assert.doesNotMatch(await scheduled.innerText(), /\b(?:UTC|GMT)[+-]\d/);
    const automationTimes = await scheduled.locator('time').evaluateAll(nodes => nodes.map(node => node.dateTime));
    assert.deepEqual(automationTimes, [window.startsAt, window.endsAt], 'the automatic plan uses the actual saved window');
    const followUps = page.getByRole('region', { name: 'Follow-ups', exact: true });
    const followUpsLoaded = page.waitForResponse(response => response.url().endsWith("/api/app/overview/follow-ups") && response.ok());
    await followUps.getByRole("button", { name: "Refresh follow-ups" }).click();
    const { followUps: rows } = await (await followUpsLoaded).json();
    assert.ok(!rows.some(item => item.id === `maintenance-reminder:${window.id}`), "mail-off maintenance without an active non-email channel has no subscriber reminder");
    assert.equal(await followUps.locator(`[data-follow-up="maintenance-reminder:${window.id}"]`).count(), 0);
    assert.equal(await followUps.locator(`[data-follow-up="maintenance-start:${window.id}"], [data-follow-up="maintenance-end:${window.id}"]`).count(), 0, 'future automatic steps need no owner action');
    if (process.env.LAMP_MAINTENANCE_OVERVIEW_EVIDENCE) {
      await mkdir(process.env.LAMP_MAINTENANCE_OVERVIEW_EVIDENCE, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: join(process.env.LAMP_MAINTENANCE_OVERVIEW_EVIDENCE, `scheduled-overview-${width}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await page.goto(`${origin}/app/maintenance`); await operatorHydrated(page);
    const scheduledRow = page.locator('.maintenance-row').filter({ hasText: window.reference });
    await scheduledRow.getByText('Change dates', { exact: true }).click();
    const scheduledStart = scheduledRow.getByLabel(`${window.reference} start`, { exact: true });
    assert.equal(await scheduledStart.inputValue(), '2027-07-15T09:00');
    await scheduledStart.fill('2027-07-15T09:15');
    await scheduledRow.getByRole('checkbox', { name: 'Auto-start maintenance', exact: true }).uncheck();
    const rescheduled = page.waitForResponse(response => response.url().endsWith(`/maintenance/${window.id}/window`) && response.request().method() === 'PUT');
    await scheduledRow.getByRole('button', { name: 'Reschedule', exact: true }).click();
    assert.equal((await rescheduled).status(), 200);
    const changed = (await api('/api/app/maintenance')).maintenance.find(row => row.id === window.id);
    assert.equal(changed.startsAt, '2027-07-14T23:15:00.000Z');
    assert.equal(changed.endsAt, window.endsAt);
    assert.equal(changed.autoStart, false);
    window.startsAt = changed.startsAt;
    await page.reload(); await operatorHydrated(page);
    await scheduledRow.getByRole('button', { name: 'Start maintenance', exact: true }).waitFor();
    await page.goto(`${origin}/app/components`);
    await operatorHydrated(page);
    await page.locator(".component-row").filter({ hasText: "Configured-zone service" }).getByRole("button", { name: "Configured-zone service" }).click();
    const drawer = page.getByRole("dialog", { name: "Configured-zone service", exact: true });
    await drawer.getByRole("button", { name: "History", exact: true }).click();
    await (await import('./helpers/availability-download-flow.mjs')).availabilityDownloadFlow({ page, drawer, component, api, context, origin });
    await drawer.getByText("Correct a past period", { exact: true }).click();
    const timezoneLink = drawer.getByRole("link", { name: /Times in Brisbane time/ });
    assert.equal(await timezoneLink.getAttribute("href"), "/app/settings#page-timezone");
    const correctionState = drawer.getByLabel("Correct state", { exact: true });
    assert.equal(await correctionState.inputValue(), "");
    await correctionState.selectOption("Operational");
    await drawer.getByLabel("Starts at", { exact: true }).fill("2020-07-15T09:00");
    await drawer.getByLabel("Ends at", { exact: true }).fill("2020-07-15T10:00");
    await drawer.getByLabel("Reason", { exact: true }).fill("Recorded outage interval");
    const corrected = page.waitForResponse(response => response.url().endsWith(`/components/${component.id}/history-corrections`));
    await drawer.getByRole("button", { name: "Save correction", exact: true }).click();
    assert.equal((await corrected).status(), 204);
    const correction = (await api(`/api/app/components/${component.id}/history`)).corrections[0];
    assert.equal(correction.state, "Operational");
    assert.equal(correction.startsAt, "2020-07-14T23:00:00.000Z"); assert.equal(correction.endsAt, "2020-07-15T00:00:00.000Z");
    await timezoneLink.click();
    await page.waitForURL(url => url.pathname === "/app/settings" && url.hash === "#page-timezone");
    const pageTimezone = page.locator("#page-timezone").getByRole("combobox", { name: "Time zone" });
    await pageTimezone.waitFor();
    assert.match(await pageTimezone.inputValue(), /^Brisbane/);
    const timezoneDetails = page.locator("#page-timezone details");
    assert.equal(await timezoneDetails.locator("p").isVisible(), false);
    await timezoneDetails.locator("summary").click();
    assert.match(await timezoneDetails.locator("p").innerText(), /UTC\+10:00/);
    await page.goto(`${origin}/app/incidents`);
    await operatorHydrated(page);
    await page.getByRole("heading", { name: "New incident", exact: true }).waitFor();
    const form = newIncidentForm(page);
    await form.title.fill("Historical configured-zone incident");
    await form.impact.fill("An earlier outage interval.");
    await form.addComponent(component.name);
    await form.componentState(component.name, "Major outage");
    await form.audience.fill("Configured-zone customers.");
    await form.nextUpdate.fill("2027-07-15T09:00");
    await form.option("Opened at");
    await page.getByLabel("Opened at", { exact: true }).fill("2020-07-15T09:00");
    const opened = page.waitForResponse(response => response.url().endsWith("/api/app/incidents") && response.request().method() === "POST");
    await form.publish.click();
    const historicalIncident = (await (await opened).json()).incident;
    assert.equal(historicalIncident.openedAt, "2020-07-14T23:00:00.000Z");
    await page.waitForURL(url => /^\/app\/incidents\/[0-9A-Z]{26}$/.test(url.pathname));
    await configure("America/New_York");
    await page.goto(`${origin}/app/maintenance`);
    await operatorHydrated(page);
    await create.getByLabel("Starts", { exact: true }).fill("2027-03-14T02:30");
    await create.getByLabel("Ends", { exact: true }).fill("2027-03-14T04:00");
    await create.getByRole("alert").waitFor();
    assert.equal(await create.getByRole("button", { name: "Schedule window", exact: true }).isEnabled(), false);
    const row = page.locator(".maintenance-row").filter({ hasText: window.reference });
    await row.getByText("Change dates", { exact: true }).click();
    await row.getByLabel(`${window.reference} start`, { exact: true }).fill("2027-11-07T01:30");
    await row.getByRole("button", { name: "Reschedule", exact: true }).click();
    await page.locator('.page-stack > [role="alert"]:has(+ .maintenance-workspace)').waitFor();
    assert.equal(await create.getByRole("alert").isVisible(), true);
    assert.equal((await api("/api/app/maintenance")).maintenance.find(item => item.id === window.id).startsAt, window.startsAt);
    const reader = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    try {
      await auditDesktopSurfaces({ page: reader, appUrl: origin, pageUrl: pageOrigin(new URL(origin).port),
        incident: historicalIncident, maintenance: window, diagnostic: text => t.diagnostic(text) });
    } finally { await reader.close(); }
  } finally { await context.close(); }
});


test("SETUP-001 SUB-002 NOTIFY-001 NOTIFY-004 — Local public pages hide email signup while the owner can confirm pending subscribers", { timeout: 180_000 }, async () => {
  const localContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await localContext.addCookies([{ name: sessionCookieName(origin), value: sessionId, url: origin }]);
  try { await localSubscribersFlow({ browser, context: localContext, origin }); }
  finally { await localContext.close(); }
});


test("TEAM-002 — Local operator invitations stay pending without email or a share action", { timeout: 120_000 }, async () => {
  const localContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await localContext.addCookies([{ name: sessionCookieName(origin), value: sessionId, url: origin }]);
  try {
    const localPage = await localContext.newPage();
    await localPage.goto(origin + '/app/settings#operators'); await operatorHydrated(localPage);
    const panel = localPage.getByRole('region', { name: 'Operators', exact: true });
    const email = 'synthetic-lamp-local-operator@example.test';
    await panel.getByLabel('Email', { exact: true }).fill(email);
    await panel.getByLabel('Name', { exact: true }).fill('Brightwell Support');
    const invitation = localPage.waitForResponse(response => new URL(response.url()).pathname === '/api/app/operators/invite' && response.request().method() === 'POST');
    await panel.getByRole('button', { name: 'Invite operator', exact: true }).click();
    const response = await invitation;
    assert.equal(response.status(), 202);
    assert.equal((await response.json()).email, 'suppressed');
    await panel.getByRole('status').waitFor();
    const row = panel.getByRole('region', { name: 'Pending invitations' }).locator('.operator-row').filter({ hasText: email });
    await row.waitFor();
    assert.equal(await row.getByRole('button', { name: 'Copy link', exact: true }).count(), 0);
    if (process.env.LAMP_LOCAL_SUBSCRIBERS_EVIDENCE) {
      await mkdir(process.env.LAMP_LOCAL_SUBSCRIBERS_EVIDENCE, { recursive: true });
      for (const width of [1440, 390]) {
        await localPage.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await localPage.screenshot({ path: join(process.env.LAMP_LOCAL_SUBSCRIBERS_EVIDENCE, `local-operator-invitation-${width}.png`), fullPage: true });
      }
    }
  } finally { await localContext.close(); }
});
