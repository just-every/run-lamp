import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { operatorHydrated } from "./operator-hydrated.mjs";

// Execute the exact text the owner copies. Never include the credential-bearing command in an error.
async function sendSample(sample) {
  const child = spawn("sh", ["-c", sample], { stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout.on("data", data => { output += data; });
  child.stderr.resume();
  const timer = setTimeout(() => child.kill("SIGTERM"), 20_000);
  try {
    const code = await new Promise((resolve, reject) => { child.once("error", () => reject(new Error("Could not run the copied request"))); child.once("close", resolve); });
    assert.equal(code, 0, "the copied curl request completes");
    return JSON.parse(output);
  } finally { clearTimeout(timer); }
}

/** Connect, copy, send and open the alert through Settings' actual Another tool form. */
export async function anotherToolSetupJourney({ origin, cookie, api, devLink, width = 1440 }) {
  const browser = await chromium.launch({ headless: true, args: ["--use-mock-keychain", "--password-store=basic"] });
  try {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
    if (cookie) await context.addCookies(cookie.split("; ").map(pair => ({ name: pair.slice(0, pair.indexOf("=")), value: pair.slice(pair.indexOf("=") + 1), url: origin })));
    const page = await context.newPage();
    if (devLink) { await page.goto(await devLink()); await page.waitForURL(url => url.pathname === "/app"); }
    await page.goto(`${origin}/app/settings#tools`); await operatorHydrated(page);
    await page.getByRole("button", { name: "Another tool", exact: true }).click();
    const form = page.locator("section.tool-form");
    const sample = form.getByRole("textbox", { name: "Sample request", exact: true });
    const name = `Northwind Payments ${width}`;
    await form.getByLabel("Name", { exact: true }).fill(name);
    const mappings = form.getByRole("group", { name: "Payload fields", exact: true });
    for (const label of ["Alert ID path", "Title path", "State path", "Recovered value"]) {
      await expect(mappings.getByRole("textbox", { name: label, exact: true })).toBeVisible();
      assert.ok(await mappings.getByRole("textbox", { name: label, exact: true }).getAttribute("aria-describedby"), "each mapping has an accessible explanation");
    }
    await inspect("connect");
    await form.getByRole("button", { name: "Connect", exact: true }).click();
    await sample.waitFor();
    const address = await form.getByRole("textbox", { name: "Address", exact: true }).inputValue();
    const firstToken = await form.getByRole("textbox", { name: "Token", exact: true }).inputValue();
    const original = await copyRequest();
    assert.ok(original.includes(address) && original.includes(`Authorization: Bearer ${firstToken}`), "sample carries this install's address and newly shown token");
    const first = await sendSample(original);
    assert.equal(first.status, 202); assert.ok(first.incidentId);
    assert.equal(first.replayed, false);
    await inspect("connected", firstToken);
    await form.getByRole("button", { name: "Done", exact: true }).click();
    await page.reload(); await operatorHydrated(page);
    const row = page.locator(`#receipt-${first.receiptId}`);
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Open draft", exact: true }).click();
    await page.waitForURL(url => url.pathname === `/app/incidents/${first.incidentId}`);
    const opened = (await api(`/api/app/incidents/${first.incidentId}`)).body.incident;
    await expect(page.getByRole("heading", { name: opened.title, exact: true, level: 1 })).toBeVisible();
    assert.equal(opened.lifecycle, "Investigating"); assert.ok(opened.draft); assert.equal(opened.updates.length, 0);
    await page.goto(`${origin}/app/settings#tools`); await operatorHydrated(page);
    await page.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
    assert.ok(!(await page.content()).includes(firstToken), "closing and reopening does not recover the secret");
    await form.getByLabel("Alert ID path", { exact: true }).fill("$.events[0].identity");
    await form.getByLabel("Title path", { exact: true }).fill("$.events[0].summary");
    await form.getByLabel("State path", { exact: true }).fill("$.events[0].phase");
    await form.getByLabel("Recovered value", { exact: true }).fill("firing");
    await form.getByRole("button", { name: "Close", exact: true }).click();
    await form.waitFor({ state: "hidden" });
    await page.reload(); await operatorHydrated(page);
    await page.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
    await expect(form.getByLabel("Alert ID path", { exact: true })).toHaveValue("$.events[0].identity");
    await expect(form.getByLabel("Recovered value", { exact: true })).toHaveValue("firing");
    await inspect("edit");
    await form.getByRole("button", { name: "New token", exact: true }).click();
    await form.getByRole("button", { name: "Make a new token", exact: true }).click();
    await sample.waitFor();
    const newToken = await form.getByRole("textbox", { name: "Token", exact: true }).inputValue();
    assert.ok(newToken !== firstToken, "replacement has a new credential");
    const replacement = await copyRequest();
    const body = JSON.parse(replacement.match(/--data-raw '([\s\S]*)'$/)[1].replaceAll(`'"'"'`, "'"));
    assert.ok(Array.isArray(body.events), "custom numeric paths become actual JSON arrays");
    assert.equal(typeof body.events[0].identity, "string");
    assert.equal(typeof body.events[0].summary, "string");
    assert.notEqual(body.events[0].phase, "firing", "the sample's state differs from the configured recovered value");
    const accepted = await sendSample(replacement);
    assert.equal(accepted.status, 202); assert.equal(accepted.incidentId, first.incidentId);
    const receipt = (await api(`/api/app/intake/receipts?receipt=${accepted.receiptId}`)).body.receipts[0];
    assert.equal(receipt.state, "firing"); assert.equal(receipt.deduplicationKey, body.events[0].identity);
    const refused = await fetch(address, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${firstToken}` }, body: JSON.stringify(body) });
    assert.equal(refused.status, 401); await refused.arrayBuffer();
    await inspect("new-token", newToken);
    await context.close();

    async function copyRequest() {
      const displayed = await sample.inputValue();
      await form.getByRole("button", { name: "Copy request", exact: true }).click();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      assert.ok(copied === displayed, "Copy request copies the complete displayed command");
      return copied;
    }
    async function inspect(stage, token) {
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${stage}: page fits viewport`);
      assert.ok(await form.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${stage}: form fits viewport`);
      if (await sample.isVisible()) assert.ok(await sample.evaluate(el => el.scrollHeight <= el.clientHeight + 1), "the complete request is visible without scrolling inside the field");
      if (!process.env.LAMP_ANOTHER_TOOL_SCREENSHOTS) return;
      await mkdir(process.env.LAMP_ANOTHER_TOOL_SCREENSHOTS, { recursive: true });
      // Keep credentials out of evidence while retaining the complete request's visible layout.
      const redacted = await form.locator("input,textarea").evaluateAll((elements, secret) => elements.flatMap((el, index) => {
        if (!secret || !el.value.includes(secret)) return [];
        const original = el.value; el.value = original.replaceAll(secret, "TOKEN_SHOWN_ONCE".padEnd(secret.length, "X"));
        return [{ index, original }];
      }), token);
      try { await form.screenshot({ path: `${process.env.LAMP_ANOTHER_TOOL_SCREENSHOTS}/${width}-another-tool-${stage}.png` }); }
      finally { await form.locator("input,textarea").evaluateAll((elements, values) => { for (const { index, original } of values) elements[index].value = original; }, redacted); }
    }
  } finally { await browser.close(); }
}
