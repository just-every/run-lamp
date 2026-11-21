import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { createRequire } from "node:module";
import { unstable_getMiniflareWorkerOptions } from "wrangler";
import { migrate, executeSql } from "../reference-storage/runtime.mjs";
import { secret } from "../auth-adoption/runtime.mjs";

const require = createRequire(import.meta.url), workerRequire = createRequire(require.resolve("wrangler"));
const { Miniflare, convertV4MiniflareOptions } = workerRequire("miniflare");

import { legacyApiFixtureSql } from "./fixtures/legacy-api-fixture.mjs";
import { reservePort } from "./worker-startup.mjs";
import { fixtureFetch as fetch } from "../public-snapshots/fixture-fetch.mjs";

const staffLogo = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==", "base64");
const logo = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Jm4kAAAAASUVORK5CYII=", "base64");

// A former teammate authored one update; subscribers hold every consent state.
const ownerHistorySql = `
INSERT INTO oa_operators (id,email,display_name,role,status,created_at) VALUES ('01J00000000000000000000099','former@example.test','Former Teammate','owner','inactive',1788825600000);
INSERT INTO incident_updates (id,incident_id,lifecycle,affected_audience,customer_impact,what_still_works,details,next_update_at,published_at,author_operator_id,created_at,updated_at) VALUES
  ('01J00000000000000000000025','01J00000000000000000000020','Investigating','API customers','Some requests fail.','Dashboards','We are investigating.',NULL,'2026-09-08T00:30:00.000Z','01J00000000000000000000099','2026-09-08T00:30:00.000Z','2026-09-08T00:30:00.000Z');
INSERT INTO subscribers (id,channel,destination,contact_email,state,selection_mode,token_hash,deactivation_reason,deactivated_at,created_at,updated_at) VALUES
  ('01J00000000000000000000044','email','left@customer.example',NULL,'deactivated','all','fixture-left','unsubscribed','2026-09-10T00:00:00.000Z','2026-09-08T00:00:00.000Z','2026-09-10T00:00:00.000Z'),
  ('01J00000000000000000000045','email','pending@customer.example',NULL,'pending','all','fixture-pending',NULL,NULL,'2026-09-09T00:00:00.000Z','2026-09-09T00:00:00.000Z');
INSERT INTO subscriber_tokens (id,subscriber_id,scope,token_hash,expires_at,revoked_at,created_at,updated_at) VALUES
  ('01J00000000000000000000060','01J00000000000000000000040','confirm','fixture-confirm-40','2026-09-11T00:00:00.000Z','2026-09-08T00:05:00.000Z','2026-09-08T00:00:00.000Z','2026-09-08T00:05:00.000Z'),
  ('01J00000000000000000000061','01J00000000000000000000044','confirm','fixture-confirm-44','2026-09-11T00:00:00.000Z','2026-09-08T00:06:00.000Z','2026-09-08T00:00:00.000Z','2026-09-08T00:06:00.000Z'),
  ('01J00000000000000000000062','01J00000000000000000000044','manage','fixture-manage-44',NULL,'2026-09-10T00:00:00.000Z','2026-09-08T00:06:00.000Z','2026-09-10T00:00:00.000Z');
INSERT INTO reference_counters (namespace,last_number) VALUES ('INC',4821) ON CONFLICT(namespace) DO UPDATE SET last_number=excluded.last_number;
`;

// Both pages share one subscriber signing secret, as a recovery given the original's secrets does.
const signingSecret = { SUBSCRIBER_TOKEN_SECRET: "test-only-page-data-subscriber-secret-cccccccccccc" };

async function startPage(seedSql, vars = signingSecret) {
  const port = await reservePort({ label: "page data Worker" });
  const app = `http://127.0.0.1:${port}`, page = `http://localhost:${port}`;
  const state = await mkdtemp(join(tmpdir(), "lamp-page-data-"));
  const options = unstable_getMiniflareWorkerOptions(resolve("dist/server/wrangler.json"));
  const { modulesRules, ...workerOptions } = options.workerOptions;
  async function moduleFiles(directory) {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await moduleFiles(path));
      else if (/\.(?:js|mjs|txt|html|sql|bin|wasm)$/.test(path)) files.push({ type: /\.(?:js|mjs)$/.test(path) ? 'ESModule' : /\.(?:txt|html|sql)$/.test(path) ? 'Text' : path.endsWith('.bin') ? 'Data' : 'CompiledWasm', path });
    }
    return files;
  }
  const modules = await moduleFiles(dirname(options.main));
  modules.sort((a, b) => a.path === options.main ? -1 : b.path === options.main ? 1 : a.path.localeCompare(b.path));
  const messages = [];
  let runtime;
  const stop = async () => { await runtime?.dispose(); await rm(state, { recursive: true, force: true }); };
  try {
    runtime = new Miniflare(convertV4MiniflareOptions({ port, inspectorPort: 0, resourcePersistencePath: state, workers: [{
      ...workerOptions, modules, modulesRoot: dirname(options.main),
      bindings: { ...workerOptions.bindings, LAMP_APP_HOST: '127.0.0.1', LAMP_PAGE_HOST: 'localhost', LAMP_LOCAL_ORIGIN: app,
        AUTH_ORIGIN: app, AUTH_LOCAL: 'true', SESSION_SECRET: secret, SETUP_OPERATOR_EMAIL: 'operator@example.test',
        MAIL_PROVIDER: 'resend', MAIL_FROM_ADDRESS: 'lamp@example.test', MAIL_PROVIDER_API_KEY: 'synthetic-page-data-mail-key', ...vars },
      // Production mail adapter and HTTP envelope; only its provider edge is synthetic.
      outboundService: async request => {
        const url = new URL(request.url);
        assert.equal(url.origin + url.pathname, 'https://api.resend.com/emails', 'confirmation mail uses the configured provider');
        messages.push(await request.json());
        return Response.json({ id: `synthetic-page-data-receipt-${messages.length}` });
      },
    }, ...options.externalWorkers] }));
    const { DB: db } = await runtime.getBindings();
    await migrate(db);
    if (seedSql) await executeSql(db, seedSql);
    await executeSql(db, `INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES ('01J00000000000000000000001','operator@example.test','Contract Operator','owner','active',${Date.now()});
      INSERT INTO oa_bootstrap(singleton,claim_id,claimed_at) VALUES(1,'01J00000000000000000000001',${Date.now()}) ON CONFLICT DO NOTHING;
      INSERT INTO page_settings(id,page_name,tagline,accent_color,timezone,hostname,footer_credit_enabled,mail_from_address,feed_id,created_at,updated_at) VALUES ('default','Atlas Cloud Status','Current availability and incident communications for Atlas Cloud.','#16794C','America/Los_Angeles','status.atlascloud.example',1,'lamp@localhost.invalid','test-feed-identity-00000000000001','2026-08-31','2026-08-31') ON CONFLICT(id) DO NOTHING;
      INSERT OR IGNORE INTO setup_readiness(step,evidence_key,checked_at) VALUES('first-run','complete','2026-08-31');`);
    const requested = await fetch(`${app}/auth/magic-link`, { ...json({ email: 'operator@example.test' }), headers: { ...json({}).headers, Origin: app } });
    assert.equal(requested.status, 202, await requested.clone().text());
    const invitation = messages.find(message => message.to.includes('operator@example.test'));
    assert.ok(invitation, 'the real mail adapter delivers the owner sign-in link');
    const token = new URL(invitation.text.match(/https?:\/\/[^\s]+/)[0]).searchParams.get('token');
    const confirmed = await fetch(`${app}/auth/confirm`, { ...json({ token }), redirect: 'manual', headers: { ...json({}).headers, Origin: app } });
    assert.equal(confirmed.status, 303, await confirmed.clone().text());
    const cookie = confirmed.headers.get('set-cookie').split(';')[0];
    return {
      page, messages,
      subscribers: async () => (await db.prepare("SELECT destination, state, deactivation_reason FROM subscribers ORDER BY destination").all()).results,
      request: (path, init = {}) => fetch(`${app}${path}`, { ...init, headers: { Cookie: cookie, Origin: app, Connection: "close", ...init.headers } }),
      stop,
    };
  } catch (cause) { await stop(); throw cause; }
}

const json = (body) => ({ method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json", Accept: "application/json" } });
const withoutTime = ({ exportedAt: _time, integrity: _integrity, ...file }) => file;

test("Page data restores verified consent and holds unverified addresses until confirmation", async () => {
  const source = await startPage(`${legacyApiFixtureSql()}\n${ownerHistorySql}`);
  let exported;
  let staffIncident, staffMaintenance;
  try {
    const form = new FormData();
    form.set("logo", new Blob([logo], { type: "image/png" }), "logo.png");
    assert.equal((await source.request("/api/app/page-settings/logo", { method: "POST", body: form, headers: { Accept: "application/json" } })).status, 200);
    const template = await source.request("/api/app/incident-templates", json({ name: "Regional API recovery", lifecycle: "Monitoring", affectedAudience: "Public API customers", customerImpact: "Request errors are recovering.", whatStillWorks: "The dashboard remains available.", details: "We are watching the recovered workers.", nextUpdateOffsetMinutes: 60, components: [{ componentId: "01J00000000000000000000011", state: "Degraded performance", relationship: "Primary" }] }));
    assert.equal(template.status, 201, await template.clone().text());
    const savedTemplate = (await template.json()).template;
    const templateMetadata = await source.request(`/api/app/incident-templates/${savedTemplate.id}`, { method: "PUT", body: JSON.stringify({ title: "API recovery", folder: "Operations", shouldSendNotifications: false }), headers: { "Content-Type": "application/json" } });
    assert.equal(templateMetadata.status, 200, await templateMetadata.clone().text());
    const impact = await source.request("/api/app/incidents/01J00000000000000000000020/impact", { method: "PUT", body: JSON.stringify({ impactOverride: "minor" }), headers: { "Content-Type": "application/json" } });
    assert.equal(impact.status, 200, await impact.clone().text());
    const { settings } = await (await source.request("/api/app/page-settings")).json();
    const input = Object.fromEntries(["pageName","tagline","accentColor","timezone","hostname","footerCreditEnabled","mailFromAddress"].map(key => [key, settings[key]]));
    const emailBranding = { displayName: "Atlas service updates", replyTo: "help@atlascloud.example", subjectPrefix: "[Atlas]", header: "Service updates", footer: "Atlas Cloud, 100 Market Street", usePageLogo: true };
    const widgetAppearance = { variant: "floating", position: "top-left", background: "#eff4ee", color: "#183c28", hideOperational: true };
    assert.equal((await source.request("/api/app/page-settings", { ...json({ ...input, emailBranding, widgetAppearance }), method: "PUT" })).status, 200);
    // Older callers omit tag choices; their next settings write must retain them.
    assert.equal((await source.request("/api/app/page-settings", { ...json(input), method: "PUT" })).status, 200);
    const componentId = "01J00000000000000000000011";
    const staffSettings = { path: "staff", kind: "staff", pageName: "Synthetic Lamp staff operations", tagline: "Maintenance desk", accentColor: "#428260", timezone: "UTC", componentIds: [componentId], footerCreditEnabled: false };
    const staff = await source.request("/api/app/status-pages", json(staffSettings));
    assert.equal(staff.status, 201, await staff.clone().text());
    const staffBrand = new FormData();
    staffBrand.set("logo", new Blob([staffLogo], { type: "image/png" }), "staff.png");
    assert.equal((await source.request("/api/app/status-pages/staff/logo", { method: "POST", body: staffBrand })).status, 200);
    const incident = await source.request("/api/app/incidents", json({
      title: "Synthetic Lamp private scope incident",
      pagePaths: ["staff"],
      components: [{ componentId, state: "Major outage", relationship: "Primary" }],
      update: { lifecycle: "Identified", affectedAudience: "Operators", customerImpact: "Staff are reviewing the failover.", whatStillWorks: "", details: "", nextUpdateAt: new Date(Date.now() + 3600_000).toISOString() },
    }));
    assert.equal(incident.status, 201, await incident.clone().text());
    staffIncident = (await incident.json()).incident;
    const publish = json({ channels: [] });
    const published = await source.request(`/api/app/incidents/${staffIncident.id}/publish`, { ...publish, headers: { ...publish.headers, "If-Match": `${staffIncident.draft.id}:0` } });
    assert.equal(published.status, 200, await published.clone().text());
    const maintenance = await source.request("/api/app/maintenance", json({
      title: "Synthetic Lamp private scope maintenance",
      affectedAudience: "Operators", customerImpact: "Staff are updating the fallback queue.",
      componentIds: [componentId], pagePaths: ["staff"], autoStart: false,
      startsAt: new Date(Date.now() + 3600_000).toISOString(), endsAt: new Date(Date.now() + 7200_000).toISOString(),
    }));
    assert.equal(maintenance.status, 201, await maintenance.clone().text());
    staffMaintenance = (await maintenance.json()).maintenance;

    const download = await source.request("/api/app/page-data");
    assert.equal(download.status, 200);
    assert.match(download.headers.get("content-disposition") ?? "", /attachment; filename=lamp-page-data-\d{4}-\d{2}-\d{2}\.json/);
    exported = await download.json();
    assert.equal(exported.format, "lamp-page-data");
    assert.deepEqual(exported.page.emailBranding, emailBranding);
    assert.deepEqual(exported.page.widgetAppearance, widgetAppearance);
    assert.equal(exported.page.logo.base64, logo.toString("base64"));
    assert.deepEqual(exported.statusPageLogos, [{ path: "staff", contentType: "image/png", base64: staffLogo.toString("base64") }]);
    assert.deepEqual(exported.records.incident_status_pages, [{ incident_id: staffIncident.id, page_path: "staff" }]);
    assert.deepEqual(exported.records.maintenance_status_pages, [{ maintenance_id: staffMaintenance.id, page_path: "staff" }]);
    assert.ok(exported.records.status_pages.every(row => !("logo_key" in row)));
    assert.deepEqual(exported.people.map((person) => person.email), ["former@example.test", "operator@example.test"]);
    const subscribers = Object.fromEntries(exported.records.subscribers.map((row) => [row.destination, row]));
    assert.equal(subscribers["ops-team@atlascloud.example"].confirmed_at, "2026-09-08T00:05:00.000Z");
    assert.equal(subscribers["left@customer.example"].state, "deactivated");
    assert.equal(subscribers["left@customer.example"].confirmed_at, "2026-09-08T00:06:00.000Z");
    assert.equal(subscribers["pending@customer.example"].confirmed_at, null);
    assert.ok(exported.records.subscribers.every((row) => !("token_hash" in row)), "an installation credential left in the file");
    assert.ok(exported.records.incident_updates.some((row) => row.author_email === "former@example.test"));
    assert.equal(exported.records.incident_templates[0].name, "Regional API recovery");
    assert.equal(exported.records.incident_templates[0].should_send_notifications, 0);
    assert.equal(exported.records.incident_template_components[0].component_id, "01J00000000000000000000011");
    assert.equal(exported.records.incident_impact_changes[0].impact_override, "minor");
    assert.ok(exported.records.incident_impact_changes[0].operator_email, "impact attribution travels as an author, never an installation operator ID");


    const populated = await (await source.request("/api/app/page-data/check", json(exported))).json();
    assert.equal(populated.check.ok, false, "a page that already holds records must refuse a restore");
    assert.match(populated.check.problems[0], /already holds/);
  } finally {
    await source.stop();
  }

  const destination = await startPage();
  try {
    const foreign = await (await destination.request("/api/app/page-data/check", json({ page: {} }))).json();
    assert.match(foreign.check.problems[0], /not a Lamp page data file/);
    const checked = await (await destination.request("/api/app/page-data/check", json(exported))).json();
    assert.equal(checked.check.ok, true, checked.check.problems.join(" "));
    assert.equal(checked.check.counts.subscribers, 4);
    assert.deepEqual(checked.check.consent, { kept: true, provenance: "verified", emailSubscribers: 2 });

    const unsafe = structuredClone(exported);
    unsafe.records.status_pages[0].logo_key = "snapshots/current.json";
    assert.equal((await destination.request("/api/app/page-data/restore", json(unsafe))).status, 409, "restored logos cannot name storage keys");
    const missingScope = structuredClone(exported);
    delete missingScope.records.incidents.find(row => row.id === staffIncident.id).public_hidden;
    assert.equal((await destination.request("/api/app/page-data/restore", json(missingScope))).status, 409, "a missing flag cannot make a private record public");

    const restored = await destination.request("/api/app/page-data/restore", json(exported));
    assert.equal(restored.status, 200, JSON.stringify(await restored.clone().json()));
    const again = await (await destination.request("/api/app/page-data")).json();
    assert.deepEqual(withoutTime(again), withoutTime(exported));

    const publicPage = await (await fetch(`${destination.page}/`)).text();
    assert.match(publicPage, /Elevated API error rates/);
    assert.ok(!publicPage.includes(staffIncident.title));
    assert.ok(!publicPage.includes(staffMaintenance.title));
    for (const [kind, record] of [["incidents", staffIncident], ["maintenance", staffMaintenance]]) {
      const protectedRecord = await destination.request(`/status-pages/staff/${kind}/${record.reference}`);
      assert.equal(protectedRecord.status, 200, await protectedRecord.clone().text());
      assert.ok((await protectedRecord.text()).includes(record.title));
    }
    const protectedLogo = await destination.request("/status-pages/staff/assets/logo");
    assert.equal(protectedLogo.status, 200);
    assert.deepEqual(Buffer.from(await protectedLogo.arrayBuffer()), staffLogo);
    const repeat = await destination.request("/api/app/page-data/restore", json(exported));
    assert.equal(repeat.status, 409, "a second restore must not duplicate the page");
  } finally {
    await destination.stop();
  }
  await verifyUntrustedPageDataRestore();
});

async function verifyUntrustedPageDataRestore() {
  const source = await startPage(legacyApiFixtureSql());
  let edited;
  try {
    edited = await (await source.request("/api/app/page-data")).json();
  } finally {
    await source.stop();
  }
  // Version 1 files made before audience pages lack their tables and fields.
  const legacy = structuredClone(edited);
  delete legacy.integrity;
  for (const table of ["status_pages", "incident_status_pages", "maintenance_status_pages"]) delete legacy.records[table];
  for (const table of ["incidents", "maintenance"]) for (const row of legacy.records[table]) delete row.public_hidden;
  for (const row of legacy.records.incident_drafts) delete row.page_paths;
  const sortKeys = value => Array.isArray(value) ? value.map(sortKeys)
    : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])])) : value;
  const key = createHmac("sha256", signingSecret.SUBSCRIBER_TOKEN_SECRET).update("lamp-page-data-integrity.v1").digest("base64url");
  legacy.integrity = { algorithm: "HMAC-SHA256", value: createHmac("sha256", key).update(JSON.stringify(sortKeys(legacy))).digest("base64url") };

  edited.records.subscribers.push({ ...edited.records.subscribers.find((row) => row.destination === "ops-team@atlascloud.example"), id: "01J00000000000000000000098", destination: "bought-list@example.test", confirmed_at: "2026-09-08T00:05:00.000Z" });

  // The restored page sends real production mail through a synthetic provider edge.
  const destination = await startPage();
  try {
    const checkedLegacy = await (await destination.request("/api/app/page-data/check", json(legacy))).json();
    assert.equal(checkedLegacy.check.ok, true, checkedLegacy.check.problems.join(" "));
    assert.equal(checkedLegacy.check.consent.provenance, "verified", "older signed files verify with the original bytes");
    const { integrity: _integrity, ...unsigned } = edited;
    assert.equal((await (await destination.request("/api/app/page-data/check", json(unsigned))).json()).check.consent.provenance, "unsigned");
    const checked = await (await destination.request("/api/app/page-data/check", json(edited))).json();
    assert.deepEqual(checked.check.consent, { kept: false, provenance: "unverified", emailSubscribers: 2 });
    assert.equal((await destination.request("/api/app/page-data/restore", json(edited))).status, 200);
    const held = "held for page data confirmation";
    assert.deepEqual(await destination.subscribers(), [
      { destination: "bought-list@example.test", state: "deactivated", deactivation_reason: held },
      { destination: "https://status-receiver.atlascloud.example/events", state: "active", deactivation_reason: null },
      { destination: "ops-team@atlascloud.example", state: "deactivated", deactivation_reason: held },
    ]);
    assert.equal((await (await destination.request("/api/app/page-data/confirmations")).json()).confirmations.held, 2);

    const send = await destination.request("/api/app/page-data/confirmations", { method: "POST", headers: { Accept: "application/json" } });
    assert.equal(send.status, 200, await send.clone().text());
    const sent = await send.json();
    assert.deepEqual(sent.confirmations, { sent: 2, held: 0, deleteAfter: null });
    for (const address of ["bought-list@example.test", "ops-team@atlascloud.example"]) {
      const confirmation = destination.messages.filter(message => message.to.includes(address));
      assert.equal(confirmation.length, 1, "each held address receives one confirmation");
      assert.match(confirmation[0].text, /\/confirm-subscription\//);
    }
    assert.deepEqual((await destination.subscribers()).map((row) => row.state), ["pending", "active", "pending"], "a confirmation starts each address's pending window");
  } finally {
    await destination.stop();
  }
}
