import assert from 'node:assert/strict';
import { incidentSnapshot } from '../../helpers/incident-snapshot.mjs';
import { notificationInventory } from '../../helpers/import-notifications.mjs';
import { eventually } from './status-journey.mjs';

const id = value => `synthetic-lamp-statusio-${value}`;
const pageId = id('page');
const at = time => `2026-01-07T${time}:00.000Z`;
const east = { _id: id('east'), name: 'Synthetic Lamp East', position: 0 };
const west = { _id: id('west'), name: 'Synthetic Lamp West', position: 1 };
const apiComponent = { _id: id('api'), name: 'Synthetic Lamp API', position: 0, statuspage: pageId, containers: [east, west] };
const consoleComponent = { _id: id('console'), name: 'Synthetic Lamp Console', position: 1, statuspage: pageId, containers: [east] };
const docsComponent = { _id: id('docs'), name: 'Synthetic Lamp Docs', position: 2, statuspage: pageId, containers: [] };
const pair = (component, container) => ({ component: { _id: component._id }, container: { _id: container._id } });
const message = (name, time, state, status, container, details) => ({
  _id: id(name), datetime: at(time), details, state, status, components: [apiComponent._id], containers: [container._id],
});
const incident = {
  _id: id('incident'), name: 'Synthetic Lamp Status.io incident', statuspage: pageId,
  datetime_open: at('10:00'), datetime_resolve: at('10:42'), infrastructure_affected: [pair(apiComponent, west)],
  messages: [
    message('incident-open', '10:03', 100, 500, west, 'API requests in West are failing.'),
    message('incident-monitor', '10:21', 300, 300, west, 'API requests in West are recovering.'),
    message('incident-resolved', '10:40', 400, 100, west, 'API requests in West have recovered.'),
  ],
};
const maintenance = {
  _id: id('maintenance'), name: 'Synthetic Lamp Status.io maintenance', statuspage: pageId,
  datetime_open: at('09:00'), datetime_planned_start: at('13:00'), datetime_planned_end: at('14:00'),
  infrastructure_affected: [pair(apiComponent, east)],
  messages: [
    message('maintenance-planned', '09:07', 100, 100, east, 'The API in East will undergo scheduled work.'),
    message('maintenance-start', '13:04', 200, 200, east, 'Work on the API in East has started.'),
    message('maintenance-end', '14:06', 300, 100, east, 'Work on the API in East is complete.'),
  ],
};
const aliasPaths = [`/pages/incident/${pageId}/${incident._id}`, `/pages/maintenance/${pageId}/${maintenance._id}`];

export function statusIoSavedInput() {
  const responses = {
    'statusio-components.json': [apiComponent, consoleComponent, docsComponent],
    'statusio-incidents-active.json': [],
    'statusio-incidents-resolved.json': [incident],
    'statusio-maintenances-pending.json': [],
    'statusio-maintenances-active.json': [],
    'statusio-maintenances-closed.json': [maintenance],
  };
  const files = Object.entries(responses).map(([name, result]) => ({
    name, text: JSON.stringify({ status: { error: 'no', message: 'OK' }, result }),
  }));
  return { source: 'statusio', pageId, publicAccessAcknowledged: true, files };
}

export async function statusIoMoveInFlow({ runtime, api, moveIn }) {
  const input = statusIoSavedInput();
  const ok = response => {
    assert.equal(response.status, 200, JSON.stringify(response.body));
    return response.body;
  };
  const read = async path => ok(await api('/api/app/' + path));
  const native = async () => {
    const [{ components, groups }, incidents, { maintenance }, { subscribers }] = await Promise.all([
      read('components'), incidentSnapshot(api), read('maintenance'), read('subscribers?limit=100'),
    ]);
    return { group: groups, component: components, incident: incidents, maintenance, subscriber: subscribers };
  };
  const publicRead = path => runtime.raw(runtime.publicOrigin + path, { redirect: 'manual' });
  const readAliases = () => Promise.all(aliasPaths.map(async path => {
    const response = await publicRead(path);
    return { status: response.status, location: response.headers.get('location') };
  }));
  const [before, quiet, absent] = await Promise.all([native(), notificationInventory(runtime), readAliases()]);
  for (const [badInput, reason] of [
    [{ ...input, publicAccessAcknowledged: undefined }, /public|published|unrestricted/iu],
    [{ ...input, pageId: id('different-page') }, /different page|another page|page.*match/iu],
  ]) {
    const denied = await moveIn.preview(badInput);
    assert.equal(denied.status, 400, JSON.stringify(denied.body));
    assert.match(denied.body.error, reason);
  }

  const reviewed = ok(await moveIn.preview(input));
  assert.equal(reviewed.report.state, 'dry run');
  const groupedName = (component, container) => `${component.name} (${container.name})`;
  const expectedComponents = [
    [groupedName(apiComponent, east), east.name], [groupedName(apiComponent, west), west.name],
    [groupedName(consoleComponent, east), east.name], [docsComponent.name, null],
  ];
  const expectedCounts = { group: 2, component: expectedComponents.length, incident: 1, maintenance: 1, subscriber: 0 };
  for (const [kind, expected] of Object.entries(expectedCounts)) {
    const count = reviewed.report.counts[kind];
    assert.equal(count.read, expected, `read ${kind} count`);
    assert.equal(count.imported + count.changed, expected, `reviewed ${kind} count`);
  }
  const sourceItems = reviewed.report.items;
  assert.match(sourceItems.find(row => row.kind === 'group' && row.name === east.name)?.reason ?? '', /container.*group/iu);
  assert.match(sourceItems.find(row => row.kind === 'component' && row.name === groupedName(apiComponent, west))?.reason ?? '', /component.*container.*pair/iu);
  for (const [source, reason] of [[incident, /original times|timestamps/iu], [maintenance, /window/iu]]) {
    assert.match(sourceItems.find(row => row.sourceId === source._id)?.reason ?? '', reason);
  }
  assert.deepEqual(reviewed.report.cutover.rows.map(row => row.path).sort(), [...aliasPaths].sort());
  assert.deepEqual(await native(), before, 'refused and completed reviews leave native records alone');
  assert.deepEqual(await readAliases(), absent, 'review publishes no redirects');
  assert.deepEqual(await notificationInventory(runtime), quiet, 'review creates no notification work');

  const applied = ok(await moveIn.apply(reviewed));
  assert.equal(applied.job.state, 'completed');
  assert.deepEqual(applied.report.counts, reviewed.report.counts);
  const after = await native();
  const added = Object.fromEntries(Object.keys(before).map(kind => {
    const priorIds = new Set(before[kind].map(row => row.id));
    return [kind, after[kind].filter(row => !priorIds.has(row.id))];
  }));
  assert.deepEqual(Object.fromEntries(Object.entries(added).map(([kind, rows]) => [kind, rows.length])), expectedCounts);
  assert.deepEqual(added.group.map(row => row.name).sort(), [east.name, west.name].sort());
  const groupsById = new Map(added.group.map(row => [row.id, row.name]));
  const actualComponents = added.component.map(row => [row.name, row.groupId === null ? null : groupsById.get(row.groupId)]);
  assert.deepEqual(actualComponents.sort(), expectedComponents.sort());
  const componentsByName = new Map(added.component.map(row => [row.name, row.id]));
  const [movedIncident] = added.incident, [movedMaintenance] = added.maintenance;
  assert.equal(movedIncident.title, incident.name);
  assert.deepEqual([movedIncident.openedAt, movedIncident.resolvedAt, movedIncident.lifecycle], [
    incident.datetime_open, incident.datetime_resolve, 'Resolved',
  ]);
  assert.deepEqual(movedIncident.updates.map(row => [row.publishedAt, row.customerImpact, row.isRetroactive]).sort(),
    incident.messages.map(row => [row.datetime, row.details, true]).sort());
  assert.deepEqual(movedIncident.components.map(row => row.componentId), [componentsByName.get(groupedName(apiComponent, west))]);
  assert.equal(movedMaintenance.title, maintenance.name);
  assert.deepEqual([movedMaintenance.startsAt, movedMaintenance.endsAt, movedMaintenance.state], [
    maintenance.datetime_planned_start, maintenance.datetime_planned_end, 'Completed',
  ]);
  assert.deepEqual(movedMaintenance.importedUpdates.map(row => [row.publishedAt, row.body]).sort(),
    maintenance.messages.map(row => [row.datetime, row.details]).sort());
  assert.deepEqual(movedMaintenance.components.map(row => row.componentId), [componentsByName.get(groupedName(apiComponent, east))]);

  const destinations = [`/incidents/${movedIncident.reference}`, `/maintenance/${movedMaintenance.reference}`];
  const redirects = await eventually(readAliases, rows => rows.every(row => row.status === 301), 'Status.io addresses redirect after apply');
  assert.deepEqual(redirects.map(row => row.location), destinations);
  for (const path of destinations) assert.equal((await publicRead(path)).status, 200, path);

  const repeated = ok(await moveIn.preview(input));
  assert.equal(repeated.report.state, 'already imported');
  const again = ok(await moveIn.apply(repeated));
  assert.equal(again.job.id, applied.job.id);
  assert.equal(again.job.state, 'completed');
  assert.deepEqual(await native(), after, 'repeating a Status.io move creates no duplicates');
  assert.deepEqual(await readAliases(), redirects, 'repeat preserves both redirects');
  await runtime.tick(Date.now());
  assert.deepEqual(await notificationInventory(runtime), quiet, 'applying and repeating history creates no notification work');

  const undone = ok(await moveIn.undo(applied.door));
  assert.equal(undone.job.state, 'undone');
  assert.deepEqual(await native(), before, 'undo removes the imported records');
  await eventually(readAliases, rows => rows.every(row => row.status === 404), 'undo removes both Status.io redirects');
  assert.deepEqual(await notificationInventory(runtime), quiet, 'undo creates no notification work');
}
