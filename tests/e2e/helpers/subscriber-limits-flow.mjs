import assert from "node:assert/strict";
import { openSubscriberManagementFixture, subscriberCsv, pageOrigin } from "./subscriber-management-fixture.mjs";
import { moveInDoor, importedRecordInventory, notificationInventory } from "../../helpers/import-notifications.mjs";

/** Only bulk population is setup SQL. The limits, refusal, row accounting,
 * operator messages and recovery below are exercised through product doors. */
export async function seedSubscriberLimitFixture(db,start,count,channel="email") {
  const now=new Date().toISOString();
  await db.prepare(`WITH RECURSIVE sequence(n) AS (SELECT ? UNION ALL SELECT n+1 FROM sequence WHERE n<?)
    INSERT INTO subscribers(id,channel,chat_kind,destination,contact_email,state,selection_mode,token_hash,created_at,updated_at)
    SELECT '01JLIMIT' || printf('%018d',n),?,?,CASE WHEN ?='email' THEN 'synthetic-lamp-limit-' || n || '@example.test'
      ELSE 'https://receiver.example.test/synthetic-lamp-limit-' || n END,NULL,'active','all','synthetic-lamp-limit-token-' || n,?,? FROM sequence`)
    .bind(start,start+count-1,channel === "slack" || channel === "teams" ? "webhook" : channel,channel === "slack" || channel === "teams" ? channel : null,channel,now,now).run();
}
const address = name => [name, "example.test"].join("@");
const sourceComponent = "synthetic-lamp-limit-component";
const sourceStart = "2026-10-01T00:00:00.000Z";
export const subscriberLimitSourceFiles = count => {
  const json = (name, value) => ({ name, text: JSON.stringify(value) });
  return [
    json("page.json", { id: "synthetic-lamp-limit-page", name: "Synthetic Lamp source", viewers_must_be_team_members: false, ip_restrictions: null }),
    json("page-access-groups.json", []),
    json("component-groups.json", [{ id: "synthetic-lamp-limit-group", name: "Synthetic Lamp imported group", components: [sourceComponent], position: 1, created_at: sourceStart }]),
    json("components.json", [{ id: sourceComponent, name: "Synthetic Lamp imported API", description: "Imported capacity control", group_id: "synthetic-lamp-limit-group", position: 1, status: "operational", created_at: sourceStart }]),
    json("incidents.json", [{
      id: "synthetic-lamp-limit-incident", name: "Synthetic Lamp imported incident", status: "resolved", impact: "major", created_at: "2026-10-02T01:00:00.000Z", resolved_at: "2026-10-02T02:00:00.000Z",
      components: [{ id: sourceComponent }], postmortem_body: "Synthetic Lamp complete recovery report", postmortem_published_at: "2026-10-02T03:00:00.000Z",
      incident_updates: [
        { id: "synthetic-lamp-limit-open", status: "investigating", body: "Synthetic Lamp requests failed", created_at: "2026-10-02T01:00:00.000Z", affected_components: [{ code: sourceComponent, old_status: "operational", new_status: "partial_outage" }] },
        { id: "synthetic-lamp-limit-resolved", status: "resolved", body: "Synthetic Lamp requests recovered", created_at: "2026-10-02T02:00:00.000Z", affected_components: [{ code: sourceComponent, old_status: "partial_outage", new_status: "operational" }] },
      ],
    }]),
    json("incidents-scheduled.json", [{ id: "synthetic-lamp-limit-maintenance", name: "Synthetic Lamp imported maintenance", status: "completed", created_at: sourceStart, scheduled_for: "2026-10-03T01:00:00.000Z", scheduled_until: "2026-10-03T02:00:00.000Z", components: [{ id: sourceComponent }], incident_updates: [] }]),
    json("incident-templates.json", [{ id: "synthetic-lamp-limit-template", name: "Synthetic Lamp imported template", title: "Synthetic Lamp reusable incident", body: "Synthetic Lamp template impact\n\nSynthetic Lamp template details", update_status: "identified", should_send_notifications: false, components: [{ id: sourceComponent, status: "partial_outage" }] }]),
    json("subscribers.json", Array.from({ length: count }, (_, index) => ({ id: `synthetic-lamp-limit-import-${index}`, mode: "email", email: address(`synthetic-lamp-limit-import-${index}`), components: [sourceComponent], created_at: sourceStart }))),
  ];
};

/** The owner reviews the whole source, refuses its excess without a partial
 * import, then removes email and imports its complete non-subscriber graph. */
export async function subscriberMoveInCapacityFlow(t) {
  const fixture = await openSubscriberManagementFixture();
  try {
    const { db, api } = fixture;
    const all = (await api('/api/app/subscribers?limit=1')).body.capacity.find(row => row.channel === 'all');
    await seedSubscriberLimitFixture(db, 1, all.limit - all.count - 100);
    assert.equal((await api('/api/app/subscribers?limit=1')).body.capacity.find(row => row.channel === 'all').count, all.limit - 100);
    const moveIn = moveInDoor((path, body, headers) => api(path, { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
    const records = await importedRecordInventory(fixture), quiet = await notificationInventory(fixture);
    const files = subscriberLimitSourceFiles(300);
    const reviewed = await moveIn.preview({ files });
    assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
    assert.deepEqual(reviewed.body.report.limits, ['email would reach 25,200, over the 25,000 limit by 200']);
    const decisions = reviewed.body.report.items.filter(row => row.kind === 'subscriber');
    assert.deepEqual(decisions.map(({ sourceId, outcome }) => ({ sourceId, outcome })), Array.from({ length: 300 }, (_, index) => ({ sourceId: `synthetic-lamp-limit-import-${index}`, outcome: index < 100 ? 'imported' : 'rejected' })));
    assert.deepEqual(decisions.slice(100).map(row => row.reason), Array(200).fill('over the subscriber limit'));
    assert.deepEqual(await importedRecordInventory(fixture), records, 'review changes no product record, including subscriber states');
    assert.deepEqual(await notificationInventory(fixture), quiet, 'review creates no outbound work or captured transport');
    t?.diagnostic('PROBE SUB-023 1: owner Move in review with 300 email rows and 100 free slots -> exact email excess 200, first 100 fit, final 200 refused with over-limit reason');
    const before = await fixture.databaseState();
    const refused = await moveIn.apply(reviewed.body);
    assert.equal(refused.status, 409, JSON.stringify(refused.body));
    assert.equal(refused.body.error, 'This import is over the subscriber limit. Leave out subscribers or channels and run a fresh dry run.');
    await fixture.assertUnchanged(before);
    assert.deepEqual(await importedRecordInventory(fixture), records, 'refused apply preserves complete product rows in every state');
    assert.deepEqual(await notificationInventory(fixture), quiet, 'refused apply changes no outbound record or transport');
    t?.diagnostic('PROBE SUB-023 2: apply the over-limit reviewed plan -> 409, every application table and complete outbound inventory unchanged');
    const narrowed = await moveIn.preview({ files: files.filter(row => row.name !== 'subscribers.json') });
    assert.equal(narrowed.status, 200, JSON.stringify(narrowed.body));
    assert.notEqual(narrowed.body.planId, reviewed.body.planId, 'removing email requires a fresh plan');
    assert.deepEqual(narrowed.body.report.limits, []);
    assert.deepEqual(narrowed.body.report.items.filter(row => row.kind === 'subscriber'), []);
    assert.deepEqual(await importedRecordInventory(fixture), records, 'fresh email-free review still writes no product records');
    const applied = await moveIn.apply(narrowed.body);
    assert.equal(applied.status, 200, JSON.stringify(applied.body));
    assert.equal(applied.body.job.state, 'completed');
    await assertCapacityImportGraph(fixture, records);
    assert.deepEqual(await notificationInventory(fixture), quiet, 'email-free apply creates no outbound work or transport');
    t?.diagnostic('PROBE SUB-023 4: remove email, freshly review and apply -> completed; group, component, complete incident history, report, maintenance and template graph reconciled; existing subscribers and outbound work unchanged');
  } finally { await fixture.close(); }
}

async function assertCapacityImportGraph(fixture, before) {
  const after = await importedRecordInventory(fixture);
  const added = table => after[table].filter(row => !before[table].some(prior => JSON.stringify(prior) === JSON.stringify(row)));
  for (const table of ['subscribers', 'subscriber_components', 'incident_subscriptions']) assert.deepEqual(after[table], before[table], `${table}: email-free import preserves the complete existing inventory`);
  const expectedCounts = { component_groups: 1, components: 1, component_claim_events: 5, component_state_history: 5, incidents: 1, incident_components: 1, incident_updates: 2, incident_reports: 1, maintenance: 1, maintenance_components: 1, incident_templates: 1, incident_template_components: 1 };
  for (const [table, count] of Object.entries(expectedCounts)) {
    assert.equal(added(table).length, count, `${table}: complete imported graph`);
    assert.equal(after[table].length, before[table].length + count, `${table}: no prior record removed or overwritten`);
  }
  for (const table of ['component_standing_claims', 'incident_drafts', 'incident_attachments', 'maintenance_notices', 'import_maintenance_updates']) assert.deepEqual(after[table], before[table], `${table}: no unreviewed records`);
  const [group] = added('component_groups'), [component] = added('components'), [incident] = added('incidents'), [maintenance] = added('maintenance'), [template] = added('incident_templates');
  const catalogue = (await fixture.api('/api/app/components')).body;
  assert.deepEqual(catalogue.groups.map(row => [row.id, row.name]), [[group.id, 'Synthetic Lamp imported group']]);
  assert.deepEqual(catalogue.components.map(row => [row.id, row.name, row.description, row.groupId, row.publicState]), [[component.id, 'Synthetic Lamp imported API', 'Imported capacity control', group.id, 'Operational']]);
  const read = (await fixture.api(`/api/app/incidents/${incident.id}`)).body.incident;
  assert.deepEqual([read.title, read.lifecycle, read.components.map(row => row.componentId)], ['Synthetic Lamp imported incident', 'Resolved', [component.id]]);
  assert.deepEqual(read.updates.map(row => [row.lifecycle, row.customerImpact, row.publishedAt]).sort(), [
    ['Investigating', 'Synthetic Lamp requests failed', '2026-10-02T01:00:00.000Z'], ['Resolved', 'Synthetic Lamp requests recovered', '2026-10-02T02:00:00.000Z'],
  ]);
  assert.deepEqual(added('incident_reports').map(row => [row.incident_id, row.summary, row.published_at]), [[incident.id, 'Synthetic Lamp complete recovery report', '2026-10-02T03:00:00.000Z']]);
  const windows = (await fixture.api('/api/app/maintenance')).body.maintenance;
  assert.deepEqual(windows.map(row => [row.id, row.title, row.state, row.startsAt, row.endsAt, row.components.map(item => item.componentId)]), [[maintenance.id, 'Synthetic Lamp imported maintenance', 'Completed', '2026-10-03T01:00:00.000Z', '2026-10-03T02:00:00.000Z', [component.id]]]);
  const templates = (await fixture.api('/api/app/incident-templates')).body.templates;
  assert.deepEqual(templates.map(row => [row.id, row.name, row.title, row.lifecycle, row.customerImpact, row.details, row.components.map(item => item.componentId)]), [[template.id, 'Synthetic Lamp imported template', 'Synthetic Lamp reusable incident', 'Identified', 'Synthetic Lamp template impact', 'Synthetic Lamp template details', [component.id]]]);
  for (const table of ['incident_components', 'maintenance_components', 'incident_template_components']) assert.ok(added(table).every(row => row.component_id === component.id));
  assert.deepEqual(added('component_state_history').map(row => [row.new_state, row.changed_at]).sort((a, b) => a[1].localeCompare(b[1])), [
    ['Operational', sourceStart], ['Partially unavailable', '2026-10-02T01:00:00.000Z'], ['Operational', '2026-10-02T02:00:00.000Z'], ['Under maintenance', '2026-10-03T01:00:00.000Z'], ['Operational', '2026-10-03T02:00:00.000Z'],
  ]);
}

/** Saturate the capacity declared by this installation, refuse without a
 * partial CSV write or email, then free a real subscription and admit again. */
export async function subscriberLimitsFlow() {
  const fixture = await openSubscriberManagementFixture();
  try {
    const { api, post, db } = fixture;
    const capacity = (await api('/api/app/subscribers?limit=1')).body.capacity;
    const all = capacity.find(row => row.channel === 'all');
    assert.ok(all && all.limit > all.count);
    await seedSubscriberLimitFixture(db, 1, all.limit - all.count - 100);
    await subscriberCsvCapacityReview(fixture);
    const occupied = (await api('/api/app/subscribers?limit=1')).body.capacity.find(row => row.channel === 'all').count;
    await seedSubscriberLimitFixture(db, all.limit + 1, all.limit - occupied - 1);
    const address = 'capacity-reader@example.test';
    const subscribe = email => fixture.raw(pageOrigin + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' }, body: new URLSearchParams({ email }) });
    assert.equal((await subscribe(address)).status, 202);
    const current = (await api('/api/app/subscribers?limit=1')).body.capacity.find(row => row.channel === 'all');
    assert.equal(current.count, current.limit);
    const mailBefore = fixture.messages.length;
    const answers = [];
    for (const email of [address, 'new-capacity-reader@example.test']) {
      const denied = await subscribe(email); assert.equal(denied.status, 409);
      const html = await denied.text(); answers.push(html);
      assert.ok(html.includes('/feed.atom') && html.includes('/feed.rss'), 'a full page still offers public feeds');
    }
    assert.equal(answers[0], answers[1], 'capacity refusals cannot enumerate addresses');
    assert.equal(fixture.messages.length, mailBefore, 'full capacity sends no confirmation or management email');
    const csv = subscriberCsvInput('over-capacity@example.test');
    const before = await fixture.databaseState();
    const preview = await post('/api/app/subscribers/import/preview', { csv });
    assert.equal(preview.status, 200, preview.text);
    assert.equal(preview.body.counts.refused, 1);
    assert.ok(preview.body.limits.length);
    const apply = await post('/api/app/subscribers/import/apply', { csv, reviewedFingerprint: preview.body.fingerprint });
    assert.equal(apply.status, 409, apply.text);
    await fixture.assertUnchanged(before);
    const row = await db.prepare('SELECT id FROM subscribers WHERE destination=?').bind(address).first();
    assert.equal((await api(`/api/app/subscribers/${row.id}`, { method: 'DELETE' })).status, 204);
    const fitting = await post('/api/app/subscribers/import/preview', { csv });
    assert.equal(fitting.body.counts.created, 1);
    assert.equal((await post('/api/app/subscribers/import/apply', { csv, reviewedFingerprint: fitting.body.fingerprint })).status, 200);
    const fullAgain = (await api('/api/app/subscribers?limit=1')).body.capacity.find(row => row.channel === 'all');
    assert.equal(fullAgain.count, fullAgain.limit);
  } finally { await fixture.close(); }
}

const subscriberCsvInput = email => `email\r\n${email}\r\n`;

/** Keep this within the existing CSV journey and retain its full-installation
 * refusal above. Every over-limit row is accounted for before any write. */
async function subscriberCsvCapacityReview(fixture) {
  const { api, post } = fixture;
  const csv = subscriberCsv(['email'], Array.from({ length: 300 }, (_, index) => [address(`synthetic-lamp-capacity-csv-${index}`)]));
  const before = await fixture.databaseState(), quiet = await notificationInventory(fixture);
  const reviewed = await post('/api/app/subscribers/import/preview', { csv });
  assert.equal(reviewed.status, 200, reviewed.text);
  assert.deepEqual(reviewed.body.limits, ['email would reach 25,200, over the 25,000 limit by 200']);
  assert.deepEqual(reviewed.body.counts, { created: 100, skipped: 0, refused: 200 });
  assert.deepEqual(reviewed.body.rows, Array.from({ length: 300 }, (_, index) => ({ row: index + 2, outcome: index < 100 ? 'created' : 'refused', reason: index < 100 ? null : 'over the subscriber limit' })));
  await fixture.assertUnchanged(before);
  const refused = await post('/api/app/subscribers/import/apply', { csv, reviewedFingerprint: reviewed.body.fingerprint });
  assert.equal(refused.status, 409, refused.text);
  assert.equal(refused.body.error, 'email would reach 25,200, over the 25,000 limit by 200');
  await fixture.assertUnchanged(before);
  assert.deepEqual(await notificationInventory(fixture), quiet, 'CSV review and refused apply change no outbound row or transport');
  const expected = [
    { destination: address('synthetic-lamp-capacity-csv-0'), channel: 'email', contactEmail: null, state: 'pending' },
    { destination: 'https://receiver.example.test/synthetic-lamp-capacity-csv', channel: 'webhook', contactEmail: address('synthetic-lamp-capacity-contact'), state: 'pending' },
  ];
  const fresh = subscriberCsv(['email', 'webhook_url', 'contact_email'], expected.map(row => row.channel === 'email' ? [row.destination, '', ''] : ['', row.destination, row.contactEmail]));
  const fitting = await post('/api/app/subscribers/import/preview', { csv: fresh });
  assert.equal(fitting.status, 200, fitting.text);
  assert.deepEqual(fitting.body.limits, []);
  assert.deepEqual(fitting.body.counts, { created: 2, skipped: 0, refused: 0 });
  assert.notEqual(fitting.body.fingerprint, reviewed.body.fingerprint);
  await fixture.assertUnchanged(before);
  const applied = await post('/api/app/subscribers/import/apply', { csv: fresh, reviewedFingerprint: fitting.body.fingerprint });
  assert.equal(applied.status, 200, applied.text);
  assert.deepEqual(applied.body.counts, { created: 2, skipped: 0, refused: 0 });
  const priorSubscribers = JSON.parse(before.get('subscribers')).map(JSON.parse);
  const listed = await api(`/api/app/subscribers?limit=100&offset=${priorSubscribers.length}`);
  assert.equal(listed.status, 200, listed.text);
  const retained = listed.body.subscribers.filter(row => applied.body.subscriberIds.includes(row.id));
  assert.equal(retained.length, expected.length, 'every newly applied subscriber is independently read through the native list');
  assert.deepEqual(retained.map(({ destination, channel, contactEmail, state }) => ({ destination, channel, contactEmail, state })).sort((a, b) => a.channel.localeCompare(b.channel)), expected);
  const afterSubscribers = JSON.parse((await fixture.databaseState()).get('subscribers')).map(JSON.parse);
  assert.equal(afterSubscribers.length, priorSubscribers.length + expected.length, 'only the fitting file creates subscriptions');
  assert.deepEqual(afterSubscribers.filter(row => !applied.body.subscriberIds.includes(row.id)), priorSubscribers, 'the fitting file preserves every prior subscriber in every state');
  assert.ok(fixture.messages.every(message => !expected.some(row => message.to.includes(row.contactEmail ?? row.destination))), 'fresh CSV apply never sends an invitation implicitly');
}
