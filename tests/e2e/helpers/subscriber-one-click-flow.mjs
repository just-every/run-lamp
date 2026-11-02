import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { openSubscriberManagementFixture } from "./subscriber-management-fixture.mjs";

/** Capture real notification mail, then exercise the mailbox provider's public
 * one-click door with three independent subscriptions and one controlled clock. */
export async function subscriberOneClickFlow() {
  const fixture = await openSubscriberManagementFixture({ workerEntry: "tests/e2e/helpers/automation-clock-worker.ts" });
  const { raw, publicOrigin } = fixture;
  const network = { "CF-Connecting-IP": "192.0.2.60", "X-Forwarded-For": "192.0.2.60" };
  const minute = Math.ceil((Date.now() + 60_000) / 60_000) * 60_000;
  const addresses = [1, 2, 3].map(number => [`synthetic-lamp-one-click-${number}`, "example.test"].join("@"));
  const clock = async now => {
    const response = await raw("/test/clock", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ now }) });
    assert.equal(response.status, 204, await response.text());
  };
  const send = (url, init = {}) => raw(url, { ...init, headers: { ...network, ...init.headers } });
  const encoded = () => ({ method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/html" }, body: new URLSearchParams({ "List-Unsubscribe": "One-Click" }).toString() });
  const emptySuccess = async response => {
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal(await response.text(), "", "one-click success has an empty body even when the caller accepts HTML");
    assert.equal(response.headers.has("Location"), false, "one-click success never redirects");
    assert.equal(response.headers.has("Set-Cookie"), false, "one-click success sets no cookie");
    assert.equal(response.redirected, false, "the provider needs no further interaction");
  };
  let browser;
  try {
    await clock(minute + 1_000);
    const component = await fixture.createComponent("Synthetic Lamp one-click component");
    for (const email of addresses) {
      const response = await send(`${publicOrigin}/subscribe`, { method: "POST", headers: {
        Origin: publicOrigin, "Content-Type": "application/x-www-form-urlencoded",
      }, body: new URLSearchParams({ email, componentId: component.id }).toString() });
      assert.equal(response.status, 202, await response.text());
      await fixture.confirm(email);
    }
    await fixture.publish(component, "Synthetic Lamp one-click notification");
    const original = await fixture.list();
    assert.equal(original.length, 3);
    assert.ok(original.every(row => row.state === "active"));
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, headless: true,
      args: ["--no-sandbox", "--use-mock-keychain", "--password-store=basic"] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, javaScriptEnabled: false });
    await context.route("**/*", route => route.abort());
    const page = await context.newPage();
    const links = [];
    for (const email of addresses) {
      const notifications = fixture.messagesFor(email).filter(message => message.headers?.["List-Unsubscribe"]);
      assert.equal(notifications.length, 1, "each confirmed reader receives the actual published notification");
      const notification = notifications[0];
      const values = notification.headers["List-Unsubscribe"].split(/,\s*/).map(value => value.match(/^<([^>]+)>$/)?.[1]);
      assert.equal(values.length, 2);
      assert.ok(values.every(Boolean), "both unsubscribe values use the mail header's angle-bracket form");
      const mail = values.filter(value => value.startsWith("mailto:"));
      assert.equal(mail.length, 1, "the mail unsubscribe value is retained");
      assert.equal(new URL(mail[0]).searchParams.get("subject"), "unsubscribe");
      const web = values.filter(value => value.startsWith("https:"));
      assert.equal(web.length, 1, "the web unsubscribe value uses HTTPS");
      assert.equal(new URL(web[0]).origin, publicOrigin);
      assert.ok(new URL(web[0]).pathname.startsWith("/unsubscribe/"));
      assert.equal(notification.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
      assert.ok(notification.text.split("\n").includes(`Unsubscribe: ${web[0]}`), "the text part retains its labelled unsubscribe link");
      await page.setContent(notification.html);
      const visibleLink = page.getByRole("link", { name: "Unsubscribe", exact: true });
      assert.equal(await visibleLink.count(), 1);
      assert.equal(await visibleLink.isVisible(), true, "the notification body visibly offers unsubscribe");
      assert.equal(await visibleLink.getAttribute("href"), web[0], "the actual visible body link and header address the same subscription");
      links.push(web[0]);
    }
    assert.equal(new Set(links).size, 3, "each reader receives independent token authority");
    if (process.env.LAMP_BROWSER_EVIDENCE) {
      await mkdir(process.env.LAMP_BROWSER_EVIDENCE, { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.screenshot({ path: join(process.env.LAMP_BROWSER_EVIDENCE, `one-click-notification-${width}.png`), fullPage: true });
      }
    }
    // No unsubscribe request has used any token's allowance. Every request
    // below sees the same Worker minute and mailbox-provider network identity.
    for (let request = 1; request <= 30; request++) {
      const preview = await send(links[0]);
      assert.equal(preview.status, 200, `token one permits request ${request} in its minute`);
      assert.equal(preview.headers.has("Set-Cookie"), false);
      assert.match(await preview.text(), /<button[^>]*>Unsubscribe<\/button>/);
    }
    assert.deepEqual(await fixture.list(), original, "GET previews never deactivate any subscription");
    const exhausted = await send(links[0], encoded());
    assert.equal(exhausted.status, 429, "request 31 exhausts the actual token allowance");
    assert.deepEqual(await fixture.list(), original, "a rate-limited one-click POST changes no subscription");

    // Send the provider's multipart wire bytes explicitly: Miniflare's bundled
    // Request serializer does not recognize Node's separate FormData class.
    const boundary = "synthetic-lamp-one-click-form";
    const form = `--${boundary}\r\nContent-Disposition: form-data; name="List-Unsubscribe"\r\n\r\nOne-Click\r\n--${boundary}--\r\n`;
    await emptySuccess(await send(links[1], { method: "POST", headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`, Accept: "text/html",
    }, body: form }));
    const afterMultipart = await fixture.list();
    const second = afterMultipart.find(row => row.destination === addresses[1]);
    assert.equal(second.state, "deactivated", "multipart one-click deactivates its intended subscription without a preview or session");
    assert.equal(second.deactivationReason, "unsubscribed");
    assert.equal(second.deactivatedAt, new Date(minute + 1_000).toISOString());
    assert.deepEqual(afterMultipart.find(row => row.destination === addresses[0]), original.find(row => row.destination === addresses[0]), "another token's exhausted allowance never consumes or changes this subscription's authority");
    assert.deepEqual(afterMultipart.find(row => row.destination === addresses[2]), original.find(row => row.destination === addresses[2]), "multipart deactivation leaves the URL-encoded target active and unchanged");

    // Prove the other encoding independently in the same exhausted minute,
    // before any window reset can replenish a shared network allowance.
    await emptySuccess(await send(links[2], encoded()));
    const afterSameMinuteEncoded = await fixture.list();
    const third = afterSameMinuteEncoded.find(row => row.destination === addresses[2]);
    assert.equal(third.state, "deactivated", "URL-encoded one-click remains usable from the same mailbox-provider network after another token is exhausted");
    assert.equal(third.deactivationReason, "unsubscribed");
    assert.equal(third.deactivatedAt, new Date(minute + 1_000).toISOString());
    assert.deepEqual(afterSameMinuteEncoded.filter(row => row.id !== third.id), afterMultipart.filter(row => row.id !== third.id), "URL-encoded deactivation changes only its intended subscription");
    assert.equal((await send(links[0], encoded())).status, 429, "other tokens' successful POSTs do not reset the exhausted token's allowance");
    assert.deepEqual(await fixture.list(), afterSameMinuteEncoded, "the exhausted token still cannot change any subscription");

    await clock(minute + 61_000);
    await emptySuccess(await send(links[0], encoded()));
    const afterEncoded = await fixture.list();
    const first = afterEncoded.find(row => row.destination === addresses[0]);
    assert.equal(first.state, "deactivated", "URL-encoded one-click independently deactivates its intended subscription");
    assert.equal(first.deactivationReason, "unsubscribed");
    assert.equal(first.deactivatedAt, new Date(minute + 61_000).toISOString());
    assert.deepEqual(afterEncoded.find(row => row.id === second.id), second, "URL-encoded deactivation leaves the multipart target unchanged");
    assert.deepEqual(afterEncoded.find(row => row.id === third.id), third, "the new minute leaves the earlier URL-encoded target unchanged");
    for (const link of links) assert.equal((await send(link, encoded())).status, 404, "revoked one-click authority cannot be replayed");
    assert.deepEqual(await fixture.list(), afterEncoded, "replayed tokens cannot resurrect or edit any subscription");
  } finally { try { await browser?.close(); } finally { await fixture.close(); } }
}
