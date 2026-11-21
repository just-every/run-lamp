import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { chromium } from "playwright";
import { eventuallyFollowUp, openFollowUpsRuntime } from "./follow-ups-runtime.mjs";
import { openFresh } from "./operator-hydrated.mjs";

const cloudId = "00000000-0000-4000-8000-000000000014";
const site = index => "https://synthetic-lamp-" + index + ".atlassian.net";
const account = index => ["synthetic-lamp-" + index, "example.test"].join("@");
const auth = (preset, key, email) => preset === "jsm"
  ? "Basic " + Buffer.from(email + ":" + key).toString("base64")
  : "GenieKey " + key;

export async function operationsCredentialsBrowserFlow({ t } = {}) {
  const outbound = [], siteChecks = [];
  const fixture = await openFollowUpsRuntime({
    builtWorker: true,
    pageHost: "localhost",
    providerEdge: async request => {
      if ([31, 32].some(index => request.url === site(index) + "/_edge/tenant_info")) {
        siteChecks.push({ origin: new URL(request.url).origin, authenticated: request.headers.has("authorization") });
        return Response.json({ cloudId });
      }
      const url = new URL(request.url);
      if (url.host !== "api.atlassian.com" && url.host !== "api.opsgenie.com") return;
      outbound.push({ host: url.host, path: url.pathname, authorization: request.headers.get("authorization"), method: request.method });
      return Response.json({ requestId: "synthetic-lamp-33" }, { status: 202 });
    },
  });
  const { api, post, raw, appOrigin, publicOrigin } = fixture;
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.LAMP_CHROMIUM_PATH || undefined,
      args: ["--no-sandbox", "--use-mock-keychain", "--password-store=basic"],
    });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const separator = fixture.cookie.indexOf("=");
    await context.addCookies([{ name: fixture.cookie.slice(0, separator), value: fixture.cookie.slice(separator + 1), url: appOrigin }]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && /hydrat|did not match|server rendered/i.test(message.text())) errors.push(message.text());
    });
    const settings = appOrigin + "/app/settings#tools";
    const screenshots = process.env.LAMP_OPERATIONS_SCREENSHOTS;
    if (screenshots) await mkdir(screenshots, { recursive: true });

    for (const preset of ["jsm", "opsgenie"]) {
      const jsm = preset === "jsm";
      const created = await post("/api/app/components", {
        name: "Synthetic Lamp " + preset + " credential proof", groupId: null, description: "", internal: false, displayOrder: 0, note: "",
      });
      assert.equal(created.status, 201, created.text);
      const component = created.body.component;
      const recorded = JSON.parse(await readFile(new URL("../../fixtures/operations/" + preset + "-create.json", import.meta.url), "utf8"));
      const matches = {
        tag: recorded.alert.tags[0],
        entity: recorded.alert.entity,
        ...(jsm ? { affected_service: recorded.alert.affectedServices[0].id } : {}),
      };
      const originalKey = "synthetic-lamp-34", newKey = "synthetic-lamp-35";
      const credentials = jsm ? { atlassianSite: site(31), atlassianEmail: account(31) } : {};
      const replacement = jsm ? { atlassianSite: site(32), atlassianEmail: account(32) } : {};
      const saved = await post("/api/app/intake/sources", {
        name: component.name, preset, credentialKind: "bearer-token", operationsApiKey: originalKey, ...credentials,
        labelMatchers: [{ componentId: component.id, labels: { ...matches, entity: "synthetic-lamp-36" } }],
        closeAlertOnResolve: false,
      });
      assert.equal(saved.status, 201, saved.text);
      const source = saved.body.source;
      const sourcePath = "/api/app/intake/sources/" + source.id;
      const secrets = [originalKey, newKey, ...[credentials.atlassianEmail, replacement.atlassianEmail].filter(Boolean)];
      const readStored = async () => {
        const row = await fixture.db.prepare("SELECT * FROM alert_sources WHERE id = ?").bind(source.id).first();
        assert.ok(typeof row?.responder_sealed_credentials === "string" && row.responder_sealed_credentials.length > 0);
        assert.ok(secrets.every(secret => !JSON.stringify(row).includes(secret)), preset + " stores no plaintext credentials");
        return row.responder_sealed_credentials;
      };
      const originalSeal = await readStored();
      const readSource = async () => {
        const listed = await api("/api/app/intake/sources");
        assert.equal(listed.status, 200);
        assert.ok([...secrets, originalSeal, source.token].every(secret => !listed.text.includes(secret)), preset + " listing redacts credential material");
        return listed.body.sources.find(row => row.id === source.id);
      };
      const openEditor = async () => {
        await openFresh(page, settings);
        await page.getByRole("button", { name: "Edit " + source.name, exact: true }).click();
        const region = page.getByRole("region", { name: source.name, exact: true });
        await expect(region).toBeVisible();
        return region;
      };
      const editor = await openEditor();
      const key = editor.getByLabel(jsm ? "Atlassian API token" : "Opsgenie API key", { exact: true });
      const save = editor.getByRole("button", { name: "Save key", exact: true });
      const entity = editor.getByLabel("Entity 1", { exact: true });
      const close = editor.getByRole("checkbox", { name: "Close alert on resolve", exact: true });
      const siteInput = editor.getByLabel("Atlassian site", { exact: true });
      const emailInput = editor.getByLabel("Atlassian account email", { exact: true });
      await expect(key).toHaveValue("");
      await expect(key).toHaveAttribute("type", "password");
      await expect(save).toBeDisabled();

      const siteCount = siteChecks.length;
      const edits = [];
      let releaseChoices;
      const holdChoices = new Promise(resolve => { releaseChoices = resolve; });
      const observeWrite = async route => {
        if (route.request().method() === "PUT") {
          const body = route.request().postDataJSON();
          edits.push(body);
          if (edits.length === 1) await holdChoices;
        }
        await route.continue();
      };
      await page.route(appOrigin + sourcePath, observeWrite);
      try {
        if (jsm) {
          await siteInput.fill(replacement.atlassianSite);
          await emailInput.fill(replacement.atlassianEmail);
        }
        await key.fill(newKey);
        await expect(save).toBeEnabled();
        assert.equal(edits.length, 0, "credential inputs alone do not write");
        await entity.fill(matches.entity);
        await close.check();
        await expect.poll(() => edits.length).toBe(1);
        await expect(save).toBeDisabled();
        assert.equal(await readStored(), originalSeal);
      } finally {
        releaseChoices();
      }
      await expect(editor.getByRole("status")).toHaveText("Saved");
      const choices = await readSource();
      assert.deepEqual(choices.labelMatchers, [{ componentId: component.id, labels: matches }]);
      assert.equal(choices.closeAlertOnResolve, true);
      assert.ok(edits.length > 0 && edits.every(body => !["operationsApiKey", "atlassianSite", "atlassianEmail"].some(field => Object.hasOwn(body, field))), "ordinary autosave carries no credential fields");
      await expect(save).toBeEnabled();
      const beforeEnter = edits.length;
      await entity.press("Enter");

      const fired = await raw(publicOrigin + source.endpointPath, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + source.token },
        body: JSON.stringify(recorded),
      });
      assert.equal(fired.status, 202);
      const { incidentId } = await fired.json();
      assert.ok(incidentId, "the compound matcher saved in Settings accepts a real fixture alert");
      const read = await api("/api/app/incidents/" + incidentId);
      assert.equal(read.status, 200, read.text);
      assert.deepEqual(read.body.incident.components.map(item => item.componentId), [component.id]);
      const publish = async lifecycle => {
        const path = "/api/app/incidents/" + incidentId;
        const draft = await api(path + "/draft", {
          method: "PUT",
          body: JSON.stringify({
            lifecycle, affectedAudience: "API customers", customerImpact: "Requests are delayed",
            whatStillWorks: "Dashboard access", details: "Operators are checking failed requests",
            nextUpdateAt: new Date(Date.now() + 3_600_000).toISOString(),
          }),
        });
        assert.equal(draft.status, 200, draft.text);
        const result = await post(path + "/publish", { channels: [] });
        assert.equal(result.status, 200, result.text);
      };
      const notesBefore = outbound.length;
      const host = jsm ? "api.atlassian.com" : "api.opsgenie.com";
      const path = (jsm ? "/jsm/ops/api/" + cloudId + "/v1" : "/v2") + "/alerts/" + recorded.alert.alertId + "/notes";
      async function verifyNote(count, expectedAuth) {
        await eventuallyFollowUp(() => outbound.length, current => current >= count, "synthetic provider receives a publication note");
        assert.equal(outbound.length, count);
        const note = outbound.at(-1);
        assert.deepEqual({ host: note.host, path: note.path, method: note.method }, { host, path, method: "POST" });
        assert.ok(note.authorization === expectedAuth, preset + " authenticates the next request with the expected key");
      }

      await publish("Identified");
      await verifyNote(notesBefore + 1, auth(preset, originalKey, credentials.atlassianEmail));
      assert.equal(edits.length, beforeEnter, "Enter in an ordinary matcher never submits credentials");
      assert.equal(siteChecks.length, siteCount, "editing alone does not discover a replacement site");
      assert.equal(await readStored(), originalSeal, "pending credentials did not change the persisted seal");

      const explicit = page.waitForResponse(response => response.url() === appOrigin + sourcePath && response.request().method() === "PUT");
      await save.click();
      const response = await explicit;
      assert.equal(response.status(), 200);
      await expect(key).toHaveValue("");
      await expect(save).toBeDisabled();
      assert.equal(edits.length, beforeEnter + 1, "explicit Save sends exactly one credential write");
      assert.ok(edits.at(-1)?.operationsApiKey === newKey, "Save submits the replacement key");
      const newSeal = await readStored();
      assert.notEqual(newSeal, originalSeal, "Save replaces the sealed provider key");
      const responseText = await response.text();
      assert.ok([...secrets, newSeal, originalSeal, source.token].every(secret => !responseText.includes(secret)), "the explicit save response never echoes credentials");
      const listed = await api("/api/app/intake/sources");
      assert.equal(listed.status, 200);
      assert.ok([...secrets, newSeal, originalSeal, source.token].every(secret => !listed.text.includes(secret)), "the listing never returns replacement credential material");
      assert.equal(listed.body.sources.find(row => row.id === source.id)?.responderConnection, "connected");
      assert.deepEqual(siteChecks.slice(siteCount), jsm ? [{ origin: site(32), authenticated: false }] : []);
      await publish("Monitoring");
      await verifyNote(notesBefore + 2, auth(preset, newKey, replacement.atlassianEmail));
      await page.unroute(appOrigin + sourcePath, observeWrite);

      await openEditor();
      await expect(key).toHaveValue("");
      await expect(entity).toHaveValue(matches.entity);
      await expect(editor.getByLabel("Tag 1", { exact: true })).toHaveValue(matches.tag);
      await expect(editor.getByLabel("Component 1", { exact: true })).toHaveValue(component.id);
      await expect(close).toBeChecked();
      if (jsm) {
        await expect(siteInput).toHaveValue("");
        await expect(emailInput).toHaveValue("");
        await expect(editor.getByLabel("Affected service 1", { exact: true })).toHaveValue(matches.affected_service);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Settings does not overflow at 1440");
      const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      assert.deepEqual(a11y.violations.filter(row => ["serious", "critical"].includes(row.impact)).map(row => row.id), []);
      if (screenshots) {
        for (const width of [1440, 390]) {
          await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
          await editor.screenshot({ path: join(screenshots, preset + "-credentials-" + width + ".png") });
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
      t?.diagnostic("PROBE INTAKE-014 8 " + preset + ": Settings autosaved compound mapping and close choice with the old key intact; explicit Save sealed and redacted the replacement; the next provider note used the replacement key.");
    }
    assert.deepEqual(errors, [], "Settings has no page or hydration errors");
  } finally {
    try { await browser?.close(); } finally { await fixture.close(); }
  }
}
