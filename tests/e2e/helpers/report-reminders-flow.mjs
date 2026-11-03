import assert from "node:assert/strict";
import { openFollowUpsRuntime, eventuallyFollowUp, pageOrigin } from "./follow-ups-runtime.mjs";
import { followUpsImport } from "./follow-ups-import.mjs";

/** HIST-003 and AUTO-004: the real report and scheduled doors share a controlled
 * clock, with fake Resend, Slack and Teams edges. No report obligation, reminder,
 * outbox or delivery record is manufactured. */
export async function reportRemindersFlow(t) {
  const posts = [];
  const slack = "https://hooks.slack.com/services/synthetic-lamp-11/synthetic-lamp-12/synthetic-lamp-13";
  const teams = "https://synthetic-lamp-11.logic.azure.com/workflows/synthetic-lamp-12/triggers/manual/paths/invoke?sig=synthetic-lamp-13";
  const publicationOnly = "https://hooks.slack.com/services/synthetic-lamp-14/synthetic-lamp-15/synthetic-lamp-16";
  const fixture = await openFollowUpsRuntime({ workerEntry: "tests/e2e/helpers/automation-clock-worker.ts", providerEdge: async request => {
    if ([slack, teams, publicationOnly].includes(request.url)) {
      posts.push({ url: request.url, body: await request.json() });
      return new Response(request.url === teams ? "" : "ok", { status: 200 });
    }
  } });
  const { post, api, runtime } = fixture;
  let now = Date.now();
  const advanceClock = async time => {
    now = time;
    const changed = await fixture.raw("/test/clock", { method: "PUT", body: JSON.stringify({ now: time }) });
    assert.equal(changed.status, 204, await changed.text());
    // Cross-day reads use a newly issued native session at the controlled time.
    await fixture.signIn(undefined, { fresh: true });
  };
  const tick = async time => {
    await advanceClock(time);
    const result = await (await runtime.getWorker()).scheduled({ cron: "* * * * *", scheduledTime: time });
    assert.equal(result.outcome, "ok");
  };
  try {
    const startedAt = Date.UTC(2030, 0, 15, 12);
    await advanceClock(startedAt);
    const owner = (await api("/api/app/session")).body.operator;
    const component = (await post("/api/app/components", { groupId: null, name: "synthetic-lamp-11", description: "", internal: false, displayOrder: 0, note: "" })).body.component;
    for (const [kind, url, operatorAlerts] of [["slack", slack, true], ["teams", teams, true], ["slack", publicationOnly, false]]) {
      const connected = await post("/api/app/channels", { kind, url, name: `synthetic-lamp-11 ${kind}`, componentIds: [component.id], operatorAlerts });
      assert.equal(connected.status, 201, connected.text);
    }
    const subscriber = ["synthetic-lamp-report-private", "example.test"].join("@");
    const subscription = await fixture.raw(pageOrigin + "/subscribe", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ email: subscriber, componentId: component.id }) });
    assert.equal(subscription.status, 202);
    const invitation = fixture.messages.find(message => message.to.includes(subscriber));
    assert.ok(invitation, "the subscriber's consent mail crosses the provider edge");
    const confirmationLink = invitation.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0];
    const confirmed = await fixture.raw(confirmationLink);
    assert.equal(confirmed.status, 200);
    const subscriberRecord = (await api("/api/app/subscribers?limit=100")).body.subscribers.find(row => row.destination === subscriber);
    assert.equal(subscriberRecord.state, "active");
    const imported = await followUpsImport(fixture);
    const privateSubscriberData = [subscriber, subscriberRecord.id, confirmationLink, imported.subscriber.id, imported.subscriber.destination];
    const createIncident = async (title, state) => {
      const created = await post("/api/app/incidents", { title, components: [{ componentId: component.id, state, relationship: "Primary" }] });
      assert.equal(created.status, 201, created.text);
      const incident = created.body.incident;
      const assigned = await api(`/api/app/incidents/${incident.id}/owner`, { method: "PUT", body: JSON.stringify({ operatorId: owner.id }) });
      assert.equal(assigned.status, 200, assigned.text);
      const saved = await api(`/api/app/incidents/${incident.id}/draft`, { method: "PUT", body: JSON.stringify({ lifecycle: "Investigating", affectedAudience: "Synthetic Lamp readers", customerImpact: "Requests were unavailable.", whatStillWorks: "", details: "Operators are investigating.", nextUpdateAt: new Date(startedAt + 3_600_000).toISOString() }) });
      assert.equal(saved.status, 200, saved.text);
      const published = await post(`/api/app/incidents/${incident.id}/publish`, { channels: [] });
      assert.equal(published.status, 200, published.text);
      return incident;
    };
    const majorCase = await createIncident("synthetic-lamp-12", "Major outage");
    const partialCase = await createIncident("synthetic-lamp-13", "Partially unavailable");
    await advanceClock(startedAt + 1000);
    const resolveIncident = async (incident, state) => {
      const saved = await api(`/api/app/incidents/${incident.id}/draft`, { method: "PUT", body: JSON.stringify({ lifecycle: "Resolved", affectedAudience: "Synthetic Lamp readers", customerImpact: "Requests were unavailable.", whatStillWorks: "", details: "Service has recovered.", nextUpdateAt: null }) });
      assert.equal(saved.status, 200, saved.text);
      const published = await post(`/api/app/incidents/${incident.id}/publish`, { channels: [] });
      assert.equal(published.status, 200, published.text);
      const read = await api(`/api/app/incidents/${incident.id}`);
      assert.equal(read.status, 200, read.text);
      assert.equal(read.body.incident.lifecycle, "Resolved");
      assert.equal(read.body.incident.impact, state, "resolution retains the incident's severe claim");
      return read.body.incident;
    };
    const incident = await resolveIncident(majorCase, "Major outage");
    const partial = await resolveIncident(partialCase, "Partially unavailable");
    const resolvedAt = Date.parse(incident.resolvedAt);
    assert.equal(partial.resolvedAt, incident.resolvedAt, "both severe cases resolve at the controlled instant");
    const DAY = 86_400_000;
    const dueAt = new Date(resolvedAt + 7 * DAY).toISOString();
    const assertReportState = async due => {
      const owing = await api("/api/app/reports/owing");
      assert.equal(owing.status, 200, owing.text);
      const overview = await api("/api/app/overview/follow-ups");
      assert.equal(overview.status, 200, overview.text);
      for (const record of [incident, partial]) {
        assert.equal(owing.body.incidentIds.includes(record.id), due, `${record.impact} report-due listing at the seven-day boundary`);
        const followUp = overview.body.followUps.find(row => row.id === `report:${record.id}`);
        assert.ok(followUp, `${record.impact} has an Overview report obligation`);
        assert.equal(followUp.dueAt, dueAt);
        assert.equal(followUp.link, `/app/incidents/${record.id}#post-incident-report`);
        assert.deepEqual(followUp.owner, { id: owner.id, displayName: owner.displayName });
        if (due) {
          assert.equal(followUp.failure?.state, "failed", "Overview marks the report overdue at the same instant");
          assert.equal(followUp.failure.occurredAt, dueAt);
        } else assert.equal(followUp.failure, null, "Overview does not mark a report overdue before seven days");
      }
    };
    const assertExcluded = async records => {
      const owing = await api("/api/app/reports/owing");
      assert.equal(owing.status, 200, owing.text);
      const overview = await api("/api/app/overview/follow-ups");
      assert.equal(overview.status, 200, overview.text);
      for (const record of records) {
        assert.ok(!owing.body.incidentIds.includes(record.id), "published or waived reports are absent from the report-due listing");
        for (const kind of ["report", "report-reminder"]) assert.ok(!overview.body.followUps.some(row => row.id === `${kind}:${record.id}`), "publication or waiver removes the Overview obligation");
      }
    };
    const subject = record => `Lamp report follow-up: ${record.reference}`;
    const reportMail = record => fixture.messages.filter(message => message.subject === subject(record));
    const visibleText = row => row.url === teams
      ? row.body.attachments[0].content.body.map(block => block.text).join("\n").replace(/\\(.)/g, "$1")
      : row.body.text;
    const reportPosts = record => posts.filter(row => visibleText(row).includes(subject(record)));
    const assertReminders = async (record, count) => {
      await eventuallyFollowUp(() => reportMail(record), rows => rows.length === count, `${count} report email acceptances for ${record.reference}`);
      await eventuallyFollowUp(() => reportPosts(record), rows => rows.length === count * 2, `${count} report acceptances per operator channel for ${record.reference}`);
      const link = `${fixture.appOrigin}/app/incidents/${record.id}#post-incident-report`;
      for (const message of reportMail(record)) {
        assert.deepEqual(message.to, [owner.email], "only the communication owner receives report email");
        assert.ok(message.text.split(/\s+/).includes(record.reference), "report email includes the exact incident reference");
        assert.deepEqual(message.text.match(/https?:\/\/\S+/g), [link], "report email names only the exact private report link");
        for (const value of privateSubscriberData) assert.ok(!JSON.stringify(message).includes(value), "report email excludes subscriber identity and consent data");
      }
      for (const url of [slack, teams]) assert.equal(reportPosts(record).filter(row => row.url === url).length, count);
      for (const row of reportPosts(record)) {
        const body = visibleText(row);
        assert.ok(body.includes(record.reference));
        assert.ok(body.includes(link));
        for (const value of privateSubscriberData) assert.ok(!JSON.stringify(row.body).includes(value), "report alerts contain no subscriber data");
      }
      assert.equal(posts.filter(row => row.url === publicationOnly).length, 0, "publication-only channels receive no report reminder");
      assert.equal(fixture.messages.filter(message => message.to.includes(subscriber)).length, 1, "report reminders send no subscriber mail");
      assert.equal(fixture.messages.filter(message => message.to.includes(imported.subscriber.destination)).length, 0, "historical import does not mail its pending subscriber");
    };
    const assertHistoricalSilence = async () => {
      const owing = (await api("/api/app/reports/owing")).body.incidentIds;
      const followUps = (await api("/api/app/overview/follow-ups")).body.followUps;
      for (const historical of imported.reports) {
        assert.ok(owing.includes(historical.id), "historical-only imports can owe reports privately");
        assert.ok(followUps.some(row => row.id === `report:${historical.id}`));
        assert.ok(!followUps.some(row => row.id === `report-reminder:${historical.id}`), "historical-only imports create no automatic reminder obligation");
        await assertReminders(historical, 0);
      }
    };
    const publishUpdate = async (record, lifecycle) => {
      const saved = await api(`/api/app/incidents/${record.id}/draft`, { method: "PUT", body: JSON.stringify({ lifecycle, affectedAudience: "Synthetic Lamp readers", customerImpact: "Requests were unavailable.", whatStillWorks: "", details: "Service has recovered.", nextUpdateAt: lifecycle === "Resolved" ? null : new Date(now + 3_600_000).toISOString() }) });
      assert.equal(saved.status, 200, saved.text);
      const published = await post(`/api/app/incidents/${record.id}/publish`, { channels: [] });
      assert.equal(published.status, 200, published.text);
    };
    const publishReport = async record => {
      const fields = { summary: "Synthetic Lamp requests recovered.", timeline: "Operators restored the service and verified requests.", cause: "A synthetic capacity change exhausted request workers.", remediation: "The capacity change was reverted and worker limits corrected." };
      const saved = await api(`/api/app/incidents/${record.id}/report`, { method: "PUT", body: JSON.stringify(fields) });
      assert.equal(saved.status, 200, saved.text);
      const published = await post(`/api/app/incidents/${record.id}/report/publish`, { channels: [] });
      assert.equal(published.status, 200, published.text);
      assert.ok(published.body.report.publishedAt);
      const stored = (await api(`/api/app/incidents/${record.id}/report`)).body.report;
      assert.equal(stored.id, published.body.report.id);
      assert.ok(stored.publishedAt);
      const publicPage = await fixture.raw(`${pageOrigin}/incidents/${record.reference}`);
      assert.equal(publicPage.status, 200);
      assert.ok((await publicPage.text()).includes(fields.remediation), "a published report reaches its public incident page");
    };
    assert.equal((await fixture.raw(`/api/app/incidents/${incident.id}/report`)).status, 401, "the report door requires operator authentication");
    assert.equal((await fixture.raw(`${pageOrigin}/api/app/incidents/${incident.id}/report`)).status, 404, "the private report door is absent from the public host");
    await tick(resolvedAt + 7 * DAY - 1);
    await assertReminders(incident, 0);
    await assertReportState(false);
    await advanceClock(resolvedAt + 7 * DAY);
    await assertReportState(true);
    t.diagnostic(`HIST-003: both severe incidents are absent at ${new Date(resolvedAt + 7 * DAY - 1).toISOString()} and owing at ${dueAt}; native Overview changes from upcoming to overdue at that same instant.`);
    await tick(resolvedAt + 7 * DAY);
    await assertReminders(incident, 1);
    assert.ok((await api("/api/app/reports/owing")).body.incidentIds.includes(incident.id));
    await eventuallyFollowUp(() => reportMail(partial), rows => rows.length === 1, "the partial outage also receives its due-day reminder");
    await publishReport(partial);
    await assertExcluded([partial]);
    await tick(resolvedAt + 7 * DAY);
    await assertReminders(incident, 1);
    await tick(resolvedAt + 14 * DAY);
    await assertReminders(incident, 2);
    assert.equal(reportMail(partial).length, 1, "report publication stops weekly email");
    await assertReminders(partial, 1);
    await assertExcluded([partial]);
    await assertHistoricalSilence();
    const waiverPath = `/api/app/incidents/${incident.id}/report/waive`;
    const refused = await post(waiverPath, { reason: "  " });
    assert.equal(refused.status, 400, refused.text);
    assert.equal((await api(`/api/app/incidents/${incident.id}/report`)).body.waiver, null);
    assert.equal((await api("/api/app/audit-log?action=report.waived&limit=100")).body.entries.filter(row => row.entityId === incident.id).length, 0);
    await tick(resolvedAt + 14 * DAY);
    await assertReminders(incident, 2);
    const waiverBefore = now;
    await advanceClock(now + 1_000);
    const waived = await post(waiverPath, { reason: "Synthetic Lamp customer review already covers this report." });
    assert.equal(waived.status, 200, waived.text);
    await advanceClock(now + 1_000);
    const waiverAfter = now;
    const storedWaiver = (await api(`/api/app/incidents/${incident.id}/report`)).body.waiver;
    assert.deepEqual(storedWaiver, waived.body.waiver);
    assert.ok(Date.parse(storedWaiver.createdAt) >= waiverBefore && Date.parse(storedWaiver.createdAt) <= waiverAfter, "stored waiver time falls inside independently controlled request bounds");
    await tick(resolvedAt + 21 * DAY);
    await assertReminders(incident, 2);
    assert.equal(reportMail(partial).length, 1, "published report stays silent in later weeks");
    assert.ok(!(await api("/api/app/reports/owing")).body.incidentIds.includes(incident.id));
    await assertExcluded([incident, partial]);
    t.diagnostic("HIST-003: published and reasoned-waiver exclusions remain absent from native owing and Overview reads after twenty-one days; weekly reminders stay stopped.");
    const entries = (await api("/api/app/audit-log?action=report.waived&limit=100")).body.entries.filter(row => row.entityId === incident.id);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].actorId, owner.id);
    assert.equal(entries[0].reason, "Synthetic Lamp customer review already covers this report.");
    assert.equal(entries[0].createdAt, storedWaiver.createdAt, "one attributed waiver audit carries the persisted waiver instant");
    await publishReport(incident);
    await tick(resolvedAt + 28 * DAY);
    await assertReminders(incident, 2);
    await assertReminders(partial, 1);
    await assertHistoricalSilence();
    const historical = imported.reports[0];
    await publishUpdate(historical, "Identified");
    await advanceClock(now + 1_000);
    await publishUpdate(historical, "Resolved");
    const live = (await api(`/api/app/incidents/${historical.id}`)).body.incident;
    assert.ok(Date.parse(live.resolvedAt) > Date.parse(historical.resolvedAt), "live resolution replaces the imported historical due boundary");
    const liveDueAt = Date.parse(live.resolvedAt) + 7 * DAY;
    const reminder = (await api("/api/app/overview/follow-ups")).body.followUps.find(row => row.id === `report-reminder:${live.id}`);
    assert.equal(reminder?.dueAt, new Date(liveDueAt).toISOString(), "a live publication makes the imported incident eligible for automatic report follow-up");
    await tick(liveDueAt - 1);
    await assertReminders(live, 0);
    await tick(liveDueAt);
    await assertReminders(live, 1);
    await tick(liveDueAt);
    await assertReminders(live, 1);
    await assertReminders(imported.reports[1], 0);
    await assertReminders(incident, 2);
    await assertReminders(partial, 1);
  } finally { await fixture.close(); }
}
