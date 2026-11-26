import assert from "node:assert/strict";
import { openSubscriberManagementFixture } from "./subscriber-management-fixture.mjs";

export async function subscribeBotcheckFlow() {
  let turnstileCalls = 0;
  const fixture = await openSubscriberManagementFixture({
    workerEntry: "tests/e2e/helpers/automation-clock-worker.ts",
    providerEdge: async request => {
      if (request.url !== "https://challenges.cloudflare.com/turnstile/v0/siteverify") return;
      turnstileCalls++;
      assert.equal(request.method, "POST");
      const body = new URLSearchParams(await request.text());
      assert.ok(body.has("secret"));
      assert.equal(body.has("email"), false);
      return Response.json({ success: true, hostname: "status.example.test",
        action: body.get("response") === "valid-widget" ? "lamp_subscribe" : "unrelated" });
    },
  });
  const { raw, publicOrigin } = fixture;
  const mailBefore = fixture.messages.length;
  const clock = async now => {
    const response = await raw("/test/clock", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ now }),
    });
    assert.equal(response.status, 204, await response.text());
  };
  const primary = "192.0.2.100", secondary = "192.0.2.101";
  const address = "team-reader@example.test";
  const headers = network => ({ Accept: "text/html", "CF-Connecting-IP": network });
  const challenge = async (network = primary) => {
    const response = await raw(publicOrigin + "/subscribe/challenge", { headers: headers(network) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("Cache-Control"), /no-store/);
    return response.json();
  };
  const submit = async (fields, network = primary, path = "/subscribe") => {
    const response = await raw(publicOrigin + path, {
      method: "POST", headers: headers(network), body: new URLSearchParams({ email: address, subscribeWebsite: "", ...fields }),
    });
    assert.equal(response.status, 202);
    return response.text();
  };
  try {
    const start = Math.ceil(Date.now() / 60_000) * 60_000 + 60_000;
    await clock(start);
    const issued = await Promise.all(Array.from({ length: 16 }, () => challenge()));
    const otherNetwork = await challenge(secondary);
    const [{ token, waitMs, expiresInMs }] = issued;
    const tooFast = await submit({ subscribeToken: token });
    const noToken = await submit({});
    assert.equal(fixture.messages.length, mailBefore);

    await clock(start + waitMs);
    const honeypot = await submit({ subscribeToken: token, subscribeWebsite: "spam.example.test" });
    const wrongNetwork = await submit({ subscribeToken: token }, secondary);
    assert.equal(fixture.messages.length, mailBefore);
    const accepted = await submit({ subscribeToken: token });
    assert.deepEqual([tooFast, noToken, honeypot, wrongNetwork], Array(4).fill(accepted));
    assert.equal(fixture.messagesFor(address).length, 1);
    assert.match(fixture.messagesFor(address)[0].text, /\/confirm-subscription\//);

    // A request from another IP still shares the confirmation address allowance.
    await submit({ email: address.toUpperCase(), subscribeToken: otherNetwork.token }, secondary);
    assert.equal(fixture.messages.length, mailBefore + 1);
    const rejectedAddress = "blocked-reader@example.test";
    await submit({ email: rejectedAddress, subscribeToken: token });
    // The requests still exercise rate counters while the already-claimed
    // address keeps the provider inventory at exactly one confirmation.
    for (const { token: fresh } of issued.slice(1, -1)) await submit({ subscribeToken: fresh });
    const limited = await submit({ email: rejectedAddress, subscribeToken: issued.at(-1).token });
    assert.equal(limited, accepted.replace(address, rejectedAddress));
    await clock(start + expiresInMs);
    await submit({ email: rejectedAddress, subscribeToken: issued.at(-1).token });

    // Incident follow is another public form with a caller-chosen email recipient.
    const incidentId = "01J00000000000000000000091";
    await submit({ incidentId, channel: "email", email: rejectedAddress }, secondary, "/subscribe/incident");
    assert.deepEqual((await fixture.list()).map(row => row.destination), [address]);
    assert.equal(fixture.messages.length, mailBefore + 1);
    assert.equal(turnstileCalls, 0);

    await fixture.restart({ bindings: { TURNSTILE_SITE_KEY: "synthetic-site-key", TURNSTILE_SECRET_KEY: "synthetic-verification-key" } });
    await clock(start + 2 * expiresInMs);
    const widget = await Promise.all(Array.from({ length: 3 }, () => challenge()));
    assert.ok(widget[0].siteKey);
    await clock(start + 2 * expiresInMs + waitMs);
    const widgetAddress = "widget-reader@example.test";
    const missing = await submit({ email: widgetAddress, subscribeToken: widget[0].token });
    const failed = await submit({ email: widgetAddress, subscribeToken: widget[1].token, "cf-turnstile-response": "wrong-action" });
    assert.equal(fixture.messagesFor(widgetAddress).length, 0);
    const good = await submit({ email: widgetAddress, subscribeToken: widget[2].token, "cf-turnstile-response": "valid-widget" });
    assert.equal(missing, good);
    assert.equal(failed, good);
    assert.equal(turnstileCalls, 2);
    assert.equal(fixture.messagesFor(widgetAddress).length, 1);
  } finally {
    await fixture.close();
  }
}
