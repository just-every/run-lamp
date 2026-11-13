import { subscriberChannelsFlow } from './subscriber-channels-flow.mjs';
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { openSubscriberManagementFixture, eventuallySubscriber } from "./subscriber-management-fixture.mjs";

const DAY = 24 * 3_600_000;
const address = suffix => [`synthetic-lamp-consent-${suffix}`, "example.test"].join("@");

/** Generic page consent uses real HTTP, D1 and mail serialization; only the
 * provider network edge and the isolated Worker's clock are controlled. */
export async function subscriberPublicConsentFlow() {
  const fixture = await openSubscriberManagementFixture({ workerEntry: "tests/e2e/helpers/automation-clock-worker.ts" });
  const { raw, publicOrigin } = fixture;
  const start = Date.now() + 60_000;
  const pendingAddress = address("pending"), activeAddress = address("active");
  const measurements = [];
  const clock = async now => {
    const response = await raw("/test/clock", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ now }) });
    assert.equal(response.status, 204, await response.text());
  };
  const subscribe = async email => {
    // Deliberately send no Origin, Cookie, Authorization or form token. This
    // request never loads a form or signs in on the public host beforehand.
    const response = await raw(`${publicOrigin}/subscribe`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ email }).toString() });
    assert.equal(response.status, 202, await response.text());
    assert.equal(response.headers.get("set-cookie"), null, "public submission needs no ambient session");
  };
  const confirmation = email => {
    const mails = fixture.messagesFor(email);
    const mail = mails.at(-1);
    assert.match(mail.text, /\/confirm-subscription\//, "the captured provider envelope is a confirmation");
    const recipients = [mail.to, mail.cc ?? [], mail.bcc ?? []].flat();
    assert.deepEqual(recipients, [email], "the complete confirmation recipient set equals the submitted address");
    assert.ok(fixture.mailReceipts.some(receipt => receipt.id === `synthetic-lamp-mail-${fixture.messages.indexOf(mail) + 1}`), "the provider returned its acceptance identity");
    return mail;
  };
  const freshConfirmation = async email => {
    const before = fixture.messagesFor(email).length, started = performance.now();
    await subscribe(email);
    const elapsedMs = performance.now() - started;
    assert.equal(fixture.messagesFor(email).length, before + 1, "one new confirmation crosses the provider edge");
    const mail = confirmation(email);
    assert.ok(elapsedMs <= 60_000, `provider acceptance completed in ${elapsedMs} ms, within sixty seconds`);
    measurements.push({ operation: "confirmation", elapsedMs, recipientCount: 1, providerAccepted: true });
    return mail;
  };
  const link = (mail, door) => mail.text.match(new RegExp(`https?:\\/\\/\\S+\\/${door}\\/\\S+`))[0];
  try {
    await subscriberChannelsFlow();
    await clock(start);
    const first = await freshConfirmation(pendingAddress);
    const pending = (await fixture.list()).find(row => row.destination === pendingAddress);
    assert.equal(pending.state, "pending", "the anonymous form creates a pending subscription");
    assert.equal(Date.parse(pending.createdAt), start);
    await subscribe(pendingAddress);
    assert.equal(fixture.messagesFor(pendingAddress).length, 1, "an immediate repeat sends no confirmation");

    // A confirmed, independently submitted control proves publication actually
    // dispatched; an empty outbox alone cannot prove pending suppression.
    await freshConfirmation(activeAddress);
    await fixture.confirm(activeAddress);
    const active = (await fixture.list()).find(row => row.destination === activeAddress);
    assert.equal(active.state, "active");
    const component = await fixture.createComponent("Synthetic Lamp generic consent API");
    const published = await fixture.publish(component, "Synthetic Lamp generic consent publication");
    const deliveries = await eventuallySubscriber(async () => {
      const response = await fixture.api(`/api/app/deliveries?incidentUpdateId=${published.update.id}&limit=100`);
      assert.equal(response.status, 200, response.text);
      return response.body.deliveries;
    }, rows => rows.length === 1 && Boolean(rows[0].providerAcceptedAt), "the active control reaches actual provider acceptance");
    assert.deepEqual(deliveries.map(row => row.subscriberId), [active.id], "the complete publication recipient inventory excludes the pending subscriber");
    assert.ok(fixture.messagesFor(activeAddress).some(mail => mail.text.includes("Requests are delayed.")), "the active control receives this publication");
    assert.deepEqual(fixture.messagesFor(pendingAddress), [first], "the pending subscription receives only its confirmation");
    assert.deepEqual((await fixture.list()).find(row => row.id === pending.id), pending, "publication leaves the pending subscription unchanged");

    await clock(start + DAY - 1);
    await fixture.signIn(undefined, { fresh: true });
    await subscribe(pendingAddress);
    assert.equal(fixture.messagesFor(pendingAddress).length, 1, "one millisecond before twenty-four hours another confirmation is refused");
    assert.deepEqual((await fixture.list()).find(row => row.id === pending.id), pending);
    await clock(start + DAY);
    await freshConfirmation(pendingAddress);
    assert.deepEqual((await fixture.list()).find(row => row.id === pending.id), pending, "the boundary resend retains the original pending identity and lifetime");
    await subscribe(pendingAddress);
    assert.equal(fixture.messagesFor(pendingAddress).length, 2, "the admitted boundary resend consumes the next allowance");

    await clock(start + DAY + 1);
    const unsubscribeUrl = link(confirmation(pendingAddress), "unsubscribe");
    const shown = await raw(unsubscribeUrl);
    assert.equal(shown.status, 200, await shown.text());
    const removed = await raw(unsubscribeUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "action=unsubscribe" });
    assert.equal(removed.status, 200, await removed.text());
    assert.equal((await fixture.list()).find(row => row.id === pending.id).state, "deactivated");
    const reopened = await freshConfirmation(pendingAddress);
    const reopenedRow = (await fixture.list()).find(row => row.destination === pendingAddress);
    assert.equal(reopenedRow.state, "pending");
    assert.equal(reopenedRow.createdAt, new Date(start + DAY + 1).toISOString(), "unsubscribe immediately restores the allowance without a clock advance");
    assert.notEqual(link(reopened, "confirm-subscription"), link(first, "confirm-subscription"), "the new lifetime has fresh confirmation authority");
    assert.equal((await raw(link(first, "confirm-subscription"))).status, 404, "the revoked old confirmation cannot activate the new lifetime");
    assert.equal((await fixture.list()).find(row => row.id === reopenedRow.id).state, "pending");

    const before = await fixture.databaseState(), messagesBefore = structuredClone(fixture.messages);
    for (const email of [address("cross-site"), pendingAddress]) {
      const refused = await raw(`${publicOrigin}/subscribe`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://unrelated.example.test", "Sec-Fetch-Site": "cross-site" }, body: new URLSearchParams({ email }).toString() });
      assert.equal(refused.status, 403, await refused.text());
      await fixture.assertUnchanged(before);
      assert.deepEqual(fixture.messages, messagesBefore, "cross-site refusal sends no message to any recipient");
    }
    assert.equal((await raw(link(reopened, "confirm-subscription"))).status, 200, "only the fresh emailed link activates the new subscription");
    assert.equal((await fixture.list()).find(row => row.id === reopenedRow.id).state, "active");
    if (process.env.LAMP_SUBSCRIPTION_RECEIPT) await writeFile(process.env.LAMP_SUBSCRIPTION_RECEIPT, JSON.stringify({ journey: "subscriberPublicConsentFlow", measurements, boundaryBeforeMs: DAY - 1, boundaryAtMs: DAY, unsubscribeResetWithoutAdvance: true, pendingPublicationRecipients: 0, activePublicationRecipients: 1, crossSiteRefusals: 2 }, null, 2) + "\n");
  } finally { await fixture.close(); }
}
