import test from "node:test";
import assert from "node:assert/strict";
import { openFollowUpsRuntime } from "./helpers/follow-ups-runtime.mjs";

// Every tool on a Workers Free account shares 5,000,000 D1 rows read a day.
// A minute Cron under this ceiling reads under a fifth of that, and its cost
// must not grow as incidents, alerts, posts and provider callbacks accumulate.
const RUN_CEILING = 600;
const DAYS = 30;
const HOUR = 3_600_000;
const iso = at => new Date(at).toISOString();

test("Scheduled runs read a bounded number of D1 rows that does not grow with thirty days of history", { timeout: 600_000 }, async () => {
  const fixture = await openFollowUpsRuntime({
    workerEntry: "tests/e2e/helpers/d1-meter-worker.ts",
    providerEdge: async request => new URL(request.url).origin === "https://hooks.slack.com" ? new Response("ok") : undefined,
  });
  const { api, post, raw, db } = fixture;
  fixture.recoverWebhook();
  let clock = 0;
  const worker = await fixture.runtime.getWorker();
  const tick = async () => { const result = await worker.scheduled({ cron: "* * * * *", scheduledTime: Date.now() }); assert.equal(result.outcome, "ok"); };
  const metered = async () => { await tick(); return (await raw("/test/d1-meter")).json(); };
  try {
    const components = [];
    for (let index = 0; index < 6; index++) {
      const made = await post("/api/app/components", { name: `Budget component ${index}`, groupId: null, description: "", internal: false, displayOrder: 0, note: "" });
      assert.equal(made.status, 201, made.text);
      components.push(made.body.component);
    }
    const channel = await post("/api/app/channels", { kind: "slack", name: "Budget Slack", url: "https://hooks.slack.com/services/synthetic-lamp-1/synthetic-lamp-2/synthetic-lamp-budget", componentIds: components.map(component => component.id) });
    assert.equal(channel.status, 201, channel.text);
    for (let index = 0; index < 3; index++) {
      const email = `budget-reader${index}@customer${index}.example.test`;
      const subscribed = await post("/api/app/subscribers", { channel: "email", email, componentIds: components.map(component => component.id), eventKinds: ["incidents", "components"] });
      assert.equal(subscribed.status, 201, subscribed.text);
      let message;
      for (let attempt = 0; attempt < 100 && !message; attempt++) {
        message = fixture.messages.find(row => row.to.includes(email) && row.text.includes("/confirm-subscription/"));
        if (!message) await new Promise(resolve => setTimeout(resolve, 50));
      }
      assert.ok(message, `${email} receives its confirmation`);
      assert.equal((await raw(message.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0])).status, 200);
    }
    const source = (await post("/api/app/intake/sources", { name: "Budget monitor", preset: "pingdom", componentId: components[0].id, credentialKind: "bearer-token" })).body.source;
    const rule = await api(`/api/app/intake/rules/${source.id}/${components[0].id}`, { method: "PUT", body: JSON.stringify({ firingDelaySeconds: 0, recoveryHoldSeconds: 0, name: "Budget claim", mode: "claim", state: "Degraded performance" }) });
    assert.equal(rule.status, 200, rule.text);
    const alert = (key, recovered) => raw(fixture.publicOrigin + source.endpointPath, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${source.token}` },
      body: JSON.stringify({ check_id: key, check_name: `check ${key}`, current_state: recovered ? "UP" : "DOWN", previous_state: recovered ? "DOWN" : "UP", description: recovered ? "Recovered" : "Down" }) });
    const metric = await post("/api/app/metrics", { componentId: components[1].id, provider: "push", name: "Budget latency", unit: "ms" });
    assert.equal(metric.status, 201, metric.text);
    const minute = Math.floor(Date.now() / 60_000) * 60_000;
    const pushed = await post(`/api/app/metrics/${metric.body.metric.id}/points`, { points: Array.from({ length: 1440 }, (_, index) => ({ at: minute - (1439 - index) * 60_000, value: 100 + index % 7 })) });
    assert.equal(pushed.status, 200, pushed.text);

    let day = 0, alerts = 0;
    const advance = async minutes => {
      clock = Math.max(clock, Date.now()) + minutes * 60_000;
      assert.equal((await api("/test/clock", { method: "PUT", body: JSON.stringify({ now: clock }) })).status, 204);
    };
    async function liveDay() {
      day++;
      // Each day's alerts arrive in their own intake rate window.
      await advance(1);
      const created = await post("/api/app/incidents", { title: `Budget incident ${day}`, components: [{ componentId: components[day % components.length].id, state: "Partially unavailable", relationship: "Primary" }] });
      assert.equal(created.status, 201, created.text);
      const incident = created.body.incident.id;
      for (const lifecycle of ["Investigating", "Resolved"]) {
        const draft = await api(`/api/app/incidents/${incident}/draft`, { method: "PUT", body: JSON.stringify({ lifecycle, affectedAudience: "Customers", customerImpact: "Requests are delayed.", whatStillWorks: "", details: `Day ${day}`, nextUpdateAt: lifecycle === "Resolved" ? null : iso(Date.now() + HOUR) }) });
        assert.equal(draft.status, 200, draft.text);
        const published = await post(`/api/app/incidents/${incident}/publish`, { channels: ["email", "chat"], ...(lifecycle === "Resolved" ? { overrideReason: "verified" } : {}) });
        assert.equal(published.status, 200, published.text);
      }
      for (let pair = 0; pair < 3; pair++) {
        alerts++;
        for (const recovered of [false, true]) { const received = await alert(`budget-${alerts}`, recovered); assert.ok(received.status < 300, await received.text()); }
      }
      // A day's provider callbacks: three applied per accepted email, and other
      // senders' callbacks on the shared provider account that never match.
      await db.prepare(`INSERT INTO mail_provider_webhook_events(id,provider_event_id,provider_message_id,event_type,received_at,created_at,applied_at)
        SELECT a.id||'.'||n.value,a.id||'.'||n.value,a.provider_message_id,'delivered',a.attempted_at,a.attempted_at,a.attempted_at
        FROM notification_delivery_attempts a CROSS JOIN json_each('[1,2,3]') n WHERE a.provider_message_id IS NOT NULL
        AND NOT EXISTS(SELECT 1 FROM mail_provider_webhook_events e WHERE e.provider_event_id=a.id||'.1')`).run();
      await db.prepare(`WITH RECURSIVE n(i) AS (SELECT 0 UNION ALL SELECT i+1 FROM n WHERE i<99)
        INSERT INTO mail_provider_webhook_events(id,provider_event_id,provider_message_id,event_type,received_at,created_at)
        SELECT 'budget-other-'||?||'-'||i,'budget-other-'||?||'-'||i,'other-sender-'||?||'-'||i,'delivered',?,? FROM n`).bind(day, day, day, iso(Date.now() - 2 * HOUR), iso(Date.now() - 2 * HOUR)).run();
    }
    async function settledRuns() {
      for (let index = 0; index < 4; index++) { await tick(); await new Promise(resolve => setTimeout(resolve, 200)); }
      const runs = [];
      for (let index = 0; index < 3; index++) runs.push(await metered());
      // The page's five-minute refresh is part of the minute schedule too.
      await advance(6);
      runs.push(await metered());
      for (const run of runs) assert.ok(run.rows < RUN_CEILING, `a scheduled run read ${run.rows} rows; expected under ${RUN_CEILING}: ${JSON.stringify(run.top)}`);
      return runs;
    }

    await liveDay();
    const first = await settledRuns();
    while (day < DAYS) await liveDay();
    const last = await settledRuns();
    const counts = await db.prepare(`SELECT (SELECT count(*) FROM alert_receipts) receipts,(SELECT count(*) FROM channel_posts) posts,
      (SELECT count(*) FROM notification_delivery_attempts) attempts,(SELECT count(*) FROM mail_provider_webhook_events) callbacks`).first();
    assert.ok(counts.receipts >= DAYS * 6 && counts.posts >= DAYS * 2 && counts.callbacks >= DAYS * 100, `thirty days of history accumulated: ${JSON.stringify(counts)}`);
    const peak = runs => Math.max(...runs.map(run => run.rows));
    console.log(`Scheduled run D1 rows read, day 1: ${first.map(run => run.rows).join(", ")}; day ${DAYS}: ${last.map(run => run.rows).join(", ")}; history ${JSON.stringify(counts)}`);
    assert.ok(peak(last) <= peak(first) * 1.25 + 20, `scheduled runs grew from ${peak(first)} to ${peak(last)} rows with history: ${JSON.stringify(last.map(run => run.top))}`);
  } finally {
    await fixture.close();
  }
});
