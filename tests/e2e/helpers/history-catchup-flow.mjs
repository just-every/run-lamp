import assert from 'node:assert/strict';
import { importedRecordInventory, notificationInventory } from '../../helpers/import-notifications.mjs';

const publicUrl = 'https://status.synthetic-history.example/';
const key = (kind, id) => JSON.stringify([kind, id]);

/** The same synthetic page under its own source ids, addresses and short links,
 * so the record this flow leaves kept never meets the other import journeys. */
function pageFiles(original) {
  return original.map(file => ({ ...file, text: file.text.replaceAll('i000000000', 'historyi').replaceAll('c000000000', 'historyc').replaceAll('s000000000', 'historys')
    .replaceAll('subscriber', 'historysubscriber').replaceAll('https://stspg.io/', 'https://stspg.io/history-') }));
}

/** Setup's keyless capture of that page: Statuspage's public summary and incident
 * list, as `captureStatusFeeds` saves them. The public summary shows no descriptions. */
function publicCapture(files) {
  const json = name => JSON.parse(files.find(file => file.name === name).text), page = { id: json('page.json').id, name: json('page.json').name, url: publicUrl };
  const components = json('components.json').map(({ automation_email: _email, ...row }) => ({ ...row, description: null }));
  return [
    { name: 'public-summary.json', text: JSON.stringify({ page, status: { indicator: 'none', description: 'All Systems Operational' }, components, incidents: [], scheduled_maintenances: [] }) },
    { name: 'public-incidents.json', text: JSON.stringify({ page, incidents: json('incidents.json') }) },
  ];
}

/** RL-6: setup's "Bring its incident history too" imports a page's resolved history
 * through the owner door (bring-history.ts), with the one component the owner kept.
 * The owner writes one incident's report, then runs the full Move in of the same
 * page. It is the history import's catch-up (ct ruling on MOVE-003): that incident is
 * listed as a conflict and keeps the owner's version, the other history records are
 * replaced in place, what setup left out is added once, and no one is notified.
 * After both are undone the edited incident stays, with no catch-up baseline: a
 * new upload naming it is refused with advice the owner can follow, and following it
 * imports the rest afresh. */
export async function historyCatchupFlow({ t, runtime, api, moveIn, repeatImport, original }) {
  const full = pageFiles(original), json = name => JSON.parse(full.find(file => file.name === name).text);
  const [kept, leftOut] = json('components.json'), incidents = json('incidents.json'), subscribers = json('subscribers.json');
  const before = await importedRecordInventory(runtime);
  const history = await moveIn.preview({ source: 'statuspage', files: publicCapture(full), publicUrl, components: [{ id: kept.id, name: kept.name }] });
  assert.equal(history.status, 200, JSON.stringify(history.body));
  const brought = await moveIn.apply(history.body);
  assert.equal(brought.status, 200, JSON.stringify(brought.body));
  assert.equal(brought.body.job.state, 'completed');
  const imported = await importedRecordInventory(runtime), added = (inventory, prior, table) => inventory[table].filter(row => !prior[table].some(old => old.id === row.id));
  const [component] = added(imported, before, 'components'), historyIncidents = added(imported, before, 'incidents');
  assert.deepEqual([added(imported, before, 'components').length, component.description, historyIncidents.length, added(imported, before, 'subscribers').length], [1, '', incidents.length, 0], 'setup brings the kept component and resolved history, and no subscribers');

  // The owner reviews the history incident whose component setup left out, and
  // writes its incident report in Lamp.
  const target = historyIncidents.find(row => row.title === incidents[1].name), other = historyIncidents.find(row => row.id !== target.id);
  const report = await api(`/api/app/incidents/${target.id}/report`, { summary: 'Owner review after setup history', timeline: 'Reviewed timeline', cause: 'Reviewed cause', remediation: 'Reviewed actions' }, undefined, 'PUT');
  assert.equal(report.status, 200, JSON.stringify(report.body));

  const edited = await importedRecordInventory(runtime), notifications = await notificationInventory(runtime);
  const input = { source: 'statuspage', files: full, pageId: json('page.json').id, publicAccessAcknowledged: true };
  const reviewed = await moveIn.preview(input);
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  const { differences } = reviewed.body;
  assert.deepEqual(differences.conflicts, [key('incident', incidents[1].id)], 'the incident the owner edited is listed as a conflict');
  assert.deepEqual(differences.additions.toSorted(), [key('component', leftOut.id), ...subscribers.map(row => key('subscriber', row.id))].toSorted(), 'what setup left out comes as new records');
  for (const record of [key('component', kept.id), key('incident', incidents[0].id)]) assert.ok(differences.replacements.includes(record), `${record} is replaced in place`);
  assert.deepEqual(await importedRecordInventory(runtime), edited, 'the full Move in review writes nothing');
  const caught = await moveIn.apply(reviewed.body);
  assert.equal(caught.status, 200, JSON.stringify(caught.body));
  assert.equal(caught.body.job.state, 'completed');

  const moved = await importedRecordInventory(runtime), only = (inventory, table, id) => inventory[table].filter(row => row.id === id);
  assert.deepEqual(only(moved, 'components', component.id).map(row => row.description), [kept.description], 'the kept component is replaced in place with its full description');
  assert.deepEqual(added(moved, edited, 'components').map(row => row.name), [leftOut.name], 'only the component setup left out is added');
  assert.equal(moved.incidents.length, edited.incidents.length, 'no history incident is imported again');
  const versionOf = inventory => ['incidents', 'incident_updates', 'incident_reports'].map(table => inventory[table].filter(row => (row.incident_id ?? row.id) === target.id));
  assert.deepEqual(versionOf(moved), versionOf(edited), "the incident the owner edited keeps the owner's version");
  assert.deepEqual(only(moved, 'incidents', other.id).map(row => [row.title, row.reference]), [[incidents[0].name, other.reference]], 'the other history incident is replaced in place, keeping its id and public reference');
  const arrived = added(moved, edited, 'subscribers');
  assert.equal(arrived.length, subscribers.length, 'each subscriber arrives once');
  assert.ok(arrived.every(row => row.state === 'pending'), 'subscribers arrive pending, with no invitation');
  assert.deepEqual(await notificationInventory(runtime), notifications, 'the full Move in notifies no one');
  await runtime.tick(Date.now());
  assert.deepEqual(await notificationInventory(runtime), notifications, 'native scheduled processing after the full Move in notifies no one');
  await repeatImport(input, caught.body);
  t.diagnostic('PROBE MOVE-003 3: full Move in after setup history -> planned and applied as its catch-up: owner-edited incident listed as a conflict, history replaced in place, left-out component and subscribers added once, silent, repeat stable');

  // Undo newest first. Undoing the history keeps the edited incident.
  for (const job of [caught.body, brought.body]) {
    const undone = await moveIn.undo(job.door);
    assert.equal(undone.status, 200, JSON.stringify(undone.body));
    assert.equal(undone.body.job.state, 'undone');
    if (job === brought.body) assert.ok(undone.body.undo.dispositions.some(row => row.targetId === target.id && row.disposition === 'retained'), 'the edited incident stays');
  }
  // That import is undone, so "undo it first" cannot be followed: the refusal says
  // which records stayed and why, and how to import the rest.
  const remaining = await importedRecordInventory(runtime), refused = await moveIn.preview(input);
  assert.equal(refused.status, 400, JSON.stringify(refused.body));
  assert.match(refused.body.error, /stayed in Lamp when their import was undone, because they were changed here/u);
  assert.ok(refused.body.error.includes(incidents[1].name), 'the refusal names the kept record');
  assert.doesNotMatch(refused.body.error, /Undo that import first/u, 'the advice can be followed: that import is undone already');
  assert.deepEqual(await importedRecordInventory(runtime), remaining, 'the refusal writes nothing');
  const named = new Set([...json('components.json'), ...incidents].filter(row => refused.body.error.includes(row.name)).map(row => row.id));
  const rest = full.map(file => ['components.json', 'incidents.json'].includes(file.name) ? { ...file, text: JSON.stringify(json(file.name).filter(row => !named.has(row.id))) } : file);
  const fresh = await moveIn.preview({ ...input, files: rest });
  assert.equal(fresh.status, 200, JSON.stringify(fresh.body));
  const again = await moveIn.apply(fresh.body);
  assert.equal(again.status, 200, JSON.stringify(again.body));
  assert.equal(again.body.job.state, 'completed');
  const reimported = await importedRecordInventory(runtime);
  assert.deepEqual(versionOf(reimported), versionOf(remaining), "the kept incident keeps the owner's version, once");
  assert.ok(added(reimported, remaining, 'incidents').every(row => row.title !== incidents[1].name), 'the kept record is not imported again');
  const undone = await moveIn.undo(again.body.door);
  assert.equal(undone.status, 200, JSON.stringify(undone.body));
  // Public references an import took stay reserved after its undo; every record row returns.
  const records = ({ reference_allocations: _allocations, reference_counters: _counters, ...rows }) => rows;
  assert.deepEqual(records(await importedRecordInventory(runtime)), records(remaining), 'undo of the fresh import leaves the kept record');
  t.diagnostic(`PROBE MOVE-003 4: after undo kept an owner-edited record -> upload naming it refused with followable advice and no native change; leaving it out imports the rest afresh. Refusal: ${refused.body.error}`);
}
