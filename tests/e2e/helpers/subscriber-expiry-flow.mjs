import assert from "node:assert/strict";
import { submitPublicSubscriptionAt } from "./public-subscribe-request.mjs";
import { openSubscriberManagementFixture } from "./subscriber-management-fixture.mjs";

const HOUR = 3_600_000;

/** Native subscription and scheduled doors share one controlled Worker clock. */
export async function subscriberExpiryFlow() {
  const fixture = await openSubscriberManagementFixture({ workerEntry: "tests/e2e/helpers/automation-clock-worker.ts" });
  const { api, raw, db, list, publicOrigin } = fixture;
  const start = Date.now() + 60_000;
  const address = number => [`synthetic-lamp-expiry-${number}`, "example.test"].join("@");
  const clock = async now => {
    const response = await raw("/test/clock", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ now }) });
    assert.equal(response.status, 204, await response.text());
  };
  const tick = async now => {
    await clock(now);
    const result = await (await fixture.runtime.getWorker()).scheduled({ cron: "* * * * *", scheduledTime: now });
    assert.equal(result.outcome, "ok", "the native scheduled handler completes at the controlled instant");
  };
  const subscribe = async (number, now) => {
    const email = address(number);
    const response = await submitPublicSubscriptionAt(raw, `${publicOrigin}/subscribe`, { method: "POST", headers: {
      Origin: publicOrigin, "Content-Type": "application/x-www-form-urlencoded", "CF-Connecting-IP": `192.0.2.${number}`,
    }, body: new URLSearchParams({ email }).toString() }, now);
    assert.equal(response.status, 202, await response.text());
    const subscriber = (await list()).find(row => row.destination === email);
    assert.ok(subscriber, "the operator inventory contains the publicly submitted address");
    assert.equal(subscriber.state, "pending");
    const mail = fixture.messagesFor(email).find(message => message.text.includes("/confirm-subscription/"));
    assert.ok(mail, "the real mail transport captured this subscription's confirmation");
    return { ...subscriber, confirmation: mail.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0] };
  };
  const inventory = async expected => {
    const rows = await list();
    const identities = records => records.map(({ id, channel, state, destination }) => ({
      id, channel, state, destination,
    })).sort((left, right) => left.id.localeCompare(right.id));
    assert.deepEqual(identities(rows), identities(expected), "operator inventory exactly reconciles pending expiry and the confirmed control");
    return rows.filter(row => row.state === "pending" || row.state === "active").length;
  };
  // The growth ledger is dated by SQLite. The Worker clock controls expiry only.
  const databaseUtcDay = () => db.prepare("SELECT date('now')").first("date('now')");
  const persisted = id => db.prepare("SELECT * FROM subscribers WHERE id = ?").bind(id).first();
  const erased = async subscriber => {
    assert.equal(await persisted(subscriber.id), null, "expiry deletes the persisted subscription itself");
    for (const [table, rows] of await fixture.databaseState()) assert.ok(!rows.includes(subscriber.destination), `${table} retains no expired address`);
    assert.equal((await raw(subscriber.confirmation)).status, 404, "replaying the old confirmation cannot restore the expired address");
    assert.equal(await persisted(subscriber.id), null, "the replay leaves the subscription absent");
  };
  try {
    const from = await databaseUtcDay();
    const to = new Date(Date.parse(from) + 4 * 24 * HOUR).toISOString().slice(0, 10);
    const reportPath = `/api/app/subscriber-reporting?from=${from}&to=${to}`;
    await clock(start);
    const first = await subscribe(1, start);
    const control = await subscribe(2, start);
    await fixture.confirm(control.destination);
    const confirmed = { ...control, state: "active" };
    const active = await persisted(confirmed.id);
    assert.equal(active.state, "active");
    await clock(start + 2 * HOUR);
    const second = await subscribe(3, start + 2 * HOUR);
    assert.equal(Date.parse(first.createdAt), start);
    assert.equal(Date.parse(second.createdAt), start + 2 * HOUR, "each subscription has its own creation instant");

    const observe = async expected => {
      // Read the first report after the tick, before replaying the old confirmation.
      const report = await api(reportPath);
      assert.equal(report.status, 200, report.text);
      for (const { id, destination } of [first, confirmed, second]) {
        assert.ok(!report.text.includes(id) && !report.text.includes(destination), "reported growth contains no subscriber identity or address");
      }
      assert.equal(report.body.eligible, await inventory(expected), "reported eligible inventory matches the independent subscriber list");
      return {
        eligible: report.body.eligible,
        leaves: report.body.daily.filter(row => row.left !== 0).map(({ day, channel, left }) => ({ day, channel, left })),
      };
    };

    let expectedLeaves = [];
    for (const [expiring, survivors] of [[first, [confirmed, second]], [second, [confirmed]]]) {
      const deadline = Date.parse(expiring.createdAt) + 72 * HOUR;
      await tick(deadline - 1);
      // The ordinary operator session expires during the three-day advance.
      await fixture.signIn(undefined, { fresh: true });
      const before = await observe([expiring, ...survivors]);
      assert.deepEqual(before.leaves, expectedLeaves, "the pre-deadline tick records no leave");
      const pending = await persisted(expiring.id);
      assert.equal(pending.state, "pending", "one millisecond before its deadline the subscription remains pending");
      assert.equal(pending.destination, expiring.destination, "its address remains while confirmation is possible");

      const dayBefore = await databaseUtcDay();
      await tick(deadline);
      const dayAfter = await databaseUtcDay();
      const after = await observe(survivors);
      assert.equal(after.eligible, before.eligible - 1, "the expiry removes exactly one eligible address");
      // If the tick straddles UTC midnight, either observed DB day can contain the leave.
      const leave = after.leaves.find(row => {
        const previous = before.leaves.find(item => item.day === row.day && item.channel === row.channel);
        return row.left > (previous?.left ?? 0);
      });
      assert.ok(leave && leave.channel === "email" && dayBefore <= leave.day && leave.day <= dayAfter,
        "the expiry records an email leave on the database observation day");
      const previous = expectedLeaves.find(row => row.day === leave.day);
      expectedLeaves = previous
        ? expectedLeaves.map(row => row === previous ? { ...row, left: row.left + 1 } : row)
        : [...expectedLeaves, { day: leave.day, channel: "email", left: 1 }];
      assert.deepEqual(after.leaves, expectedLeaves, "the first report adds exactly one email leave");

      await erased(expiring);
      assert.deepEqual(await persisted(confirmed.id), active, "scheduled expiry preserves every field of the confirmed subscription");
      await tick(deadline);
      assert.deepEqual(await observe(survivors), after, "the repeated native tick adds no leave and changes no eligible count");
      await erased(expiring);
    }
  } finally { await fixture.close(); }
}
