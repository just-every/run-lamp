import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { moveInDoor } from '../../helpers/import-notifications.mjs';
import { eventually } from './status-journey.mjs';

const descendants = node => (node.childNodes ?? []).flatMap(child => [child, ...descendants(child)]);
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
export function recordContaining(html, title, className) {
  const records = descendants(parse(html)).filter(node => node.tagName === 'article'
    && node.attrs.some(attr => attr.name === 'class' && attr.value.split(' ').includes(className)) && text(node).includes(title));
  assert.equal(records.length, 1, `one ${className} record contains ${title}`);
  return records[0];
}
export function assertSeparateRecords(html, incident, maintenance, className) {
  const left = recordContaining(html, incident.title, className ?? 'incident');
  const right = recordContaining(html, maintenance.title, className ?? 'maintenance');
  const kicker = node => descendants(node).filter(child => child.attrs?.some(attr => attr.name === 'class' && /(?:section|tl)-kicker/.test(attr.value))).map(text).join(' ');
  assert.match(kicker(left), /[Ii]ncident|Ongoing/);
  assert.match(kicker(right), /[Mm]aintenance/);
  assert.ok(!text(left).includes(maintenance.title));
  assert.ok(!text(right).includes(incident.title));
}

export async function maintenanceIdentityFlow(j, component, maintenance, input) {
  const number = (reference, prefix) => {
    assert.match(reference, new RegExp(`^${prefix}-[0-9]+$`));
    return Number(reference.slice(prefix.length + 1));
  };
  assert.equal(number(maintenance.reference, 'SCH'), 1);
  const saved = (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === maintenance.id);
  for (const record of [maintenance, saved]) {
    assert.equal(record.startsAt, input.startsAt); assert.equal(record.endsAt, input.endsAt);
    assert.deepEqual(record.components.map(row => ({ id: row.componentId, name: row.componentName, state: row.state })), [
      { id: component.id, name: component.name, state: 'Under maintenance' },
    ]);
  }
  const publicRows = async kind => (await (await j.publicResponse(`/api/public/v1/${kind}`)).json()).data;
  const nativePublic = await eventually(() => publicRows('maintenance'), rows => rows.some(row => row.id === maintenance.id), 'saved public maintenance');
  const publicRecord = nativePublic.find(row => row.id === maintenance.id);
  assert.equal(publicRecord.startsAt, input.startsAt); assert.equal(publicRecord.endsAt, input.endsAt);
  assert.deepEqual(publicRecord.components, [component.name]);
  const permalink = await j.visible(`/maintenance/${maintenance.reference}`, input.customerImpact);
  const article = recordContaining(permalink, input.title.trim(), 'maintenance');
  assert.ok(text(article).includes(component.name));
  assert.deepEqual(descendants(article).filter(node => node.tagName === 'time').slice(0, 2)
    .map(node => node.attrs.find(attr => attr.name === 'datetime').value), [input.startsAt, input.endsAt]);

  // Fixture rows represent an installed version's timestamp references.
  const legacyMaintenance = 'SCH-202610010101', legacyIncident = 'INC-202610010102';
  await j.db.prepare(`INSERT INTO maintenance(id,reference,title,state,starts_at,ends_at,completed_at,created_by_operator_id,created_at,updated_at)
    SELECT ?,?,?,'Completed',starts_at,ends_at,ends_at,created_by_operator_id,created_at,updated_at FROM maintenance WHERE id=?`)
    .bind('01J00000000000000000000081', legacyMaintenance, 'Synthetic Lamp legacy maintenance', maintenance.id).run();
  const incidentComponent = await j.component('Synthetic Lamp incident-only service');
  const incident = await j.incident('Synthetic Lamp unscheduled incident', [incidentComponent]);
  assert.equal(number(incident.reference, 'INC'), 1, 'maintenance does not advance incidents');
  await j.db.prepare(`INSERT INTO incidents(id,reference,title,lifecycle,opened_at,resolved_at,created_by_operator_id,created_at,updated_at)
    SELECT ?,?,?,'Resolved',opened_at,opened_at,created_by_operator_id,created_at,updated_at FROM incidents WHERE id=?`)
    .bind('01J00000000000000000000082', legacyIncident, 'Synthetic Lamp legacy incident', incident.id).run();
  await j.save(incident.id, { customerImpact: 'Unscheduled requests are failing beside planned maintenance.' });
  await j.publish(incident.id);
  const secondIncident = await j.incident('Synthetic Lamp independent second incident', [incidentComponent]);
  assert.equal(number(secondIncident.reference, 'INC'), 2, 'legacy timestamps do not raise the short incident sequence');
  const overview = (await j.json('/api/app/overview')).overview;
  assert.ok(overview.activeIncidents.some(row => row.id === incident.id));
  assert.ok(!overview.activeIncidents.some(row => row.id === maintenance.id));
  assert.ok(overview.maintenance.some(row => row.id === maintenance.id));
  assert.ok(!overview.maintenance.some(row => row.id === incident.id));
  assertSeparateRecords(await j.visible('/', 'Unscheduled requests are failing beside planned maintenance.'), incident, maintenance);
  await j.component('Synthetic Lamp western region', { region: 'California' });
  await j.component('Synthetic Lamp eastern region', { region: 'Virginia' });
  const savedSettings = (await j.json('/api/app/page-settings')).settings;
  const settings = Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'mailFromAddress', 'template', 'footerCreditEnabled', 'widgetAllowedOrigins'].map(key => [key, savedSettings[key]]));
  for (const template of ['calm', 'uptime', 'regions']) {
    await j.json('/api/app/page-settings', 'PUT', { ...settings, template });
    const html = await eventually(() => j.publicText('/'), body => body.includes(`data-template="${template}"`) && body.includes(incident.title) && body.includes(maintenance.title), `${template} separates the two record kinds`);
    assertSeparateRecords(html, incident, maintenance, 'tl-body');
  }
  await j.json('/api/app/page-settings', 'PUT', settings);
  await eventually(() => j.publicText('/'), body => body.includes('class="incident"') && body.includes(incident.title), 'restore the original public layout');
  const summary = await eventually(async () => (await (await j.publicResponse('/api/v2/summary.json')).json()),
    value => value.incidents.some(row => row.shortlink.endsWith(`/incidents/${incident.reference}`)), 'mixed public summary');
  assert.ok(!summary.incidents.some(row => row.shortlink.endsWith(`/maintenance/${maintenance.reference}`)));
  assert.ok(summary.scheduled_maintenances.some(row => row.shortlink.endsWith(`/maintenance/${maintenance.reference}`)));
  assert.ok(!summary.scheduled_maintenances.some(row => row.shortlink.endsWith(`/incidents/${incident.reference}`)));
  const incidents = await publicRows('incidents');
  assert.ok(incidents.some(row => row.id === incident.id));
  assert.ok(!incidents.some(row => row.id === maintenance.id));
  assert.ok(!nativePublic.some(row => row.id === incident.id));
  for (const path of ['/feed.atom', '/feed.rss']) {
    const feed = await j.visible(path, incident.title), tag = path.endsWith('atom') ? 'entry' : 'item';
    const entries = [...feed.matchAll(new RegExp(`<${tag}[ >][\\s\\S]*?</${tag}>`, 'g'))].map(match => match[0]);
    const incidentEntries = entries.filter(body => body.includes(incident.title));
    assert.equal(incidentEntries.length, 1);
    assert.ok(incidentEntries[0].includes(`/incidents/${incident.reference}`));
    assert.ok(!incidentEntries[0].includes(`/maintenance/${maintenance.reference}`));
    const maintenanceEntries = entries.filter(body => body.includes(`/maintenance/${maintenance.reference}`));
    assert.equal(maintenanceEntries.length, 1);
    assert.ok(!maintenanceEntries[0].includes(incident.title));
    assert.ok(maintenanceEntries[0].includes(maintenance.reference));
  }

  const moveIn = moveInDoor((path, body, headers) => j.api(path, {
    ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), headers,
  }));
  const old = '2026-01-01T10:00:00.000Z', end = '2026-01-01T11:00:00.000Z', sourceComponent = 'synthetic-lamp-import-component-1';
  const files = Object.entries({
    'page.json': { id: 'synthetic-lamp-maintenance-page-1', name: 'Synthetic Lamp source', viewers_must_be_team_members: false, ip_restrictions: null },
    'page-access-groups.json': [], 'component-groups.json': [],
    'components.json': [{ id: sourceComponent, name: 'Synthetic Lamp imported service', group: false, group_id: null, position: 1, status: 'operational', created_at: old }],
    'incidents.json': [], 'subscribers.json': [],
    'incidents-scheduled.json': [{ id: 'synthetic-lamp-import-maintenance-1', name: 'Synthetic Lamp removable import', status: 'completed',
      impact: 'maintenance', created_at: old, scheduled_for: old, scheduled_until: end, resolved_at: end,
      components: [{ id: sourceComponent }], incident_updates: [] }],
  }).map(([name, value]) => ({ name, text: JSON.stringify(value) }));
  const reviewed = await moveIn.preview({ files });
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  const applied = await moveIn.apply(reviewed.body);
  assert.equal(applied.status, 200, JSON.stringify(applied.body)); assert.equal(applied.body.job.state, 'completed');
  const imported = (await j.json('/api/app/maintenance')).maintenance.find(row => row.title === 'Synthetic Lamp removable import');
  assert.ok(imported); assert.equal(number(imported.reference, 'SCH'), 2, 'incident and legacy references do not advance maintenance');
  const undone = await moveIn.undo({ ...applied.body.job, ...reviewed.body });
  assert.equal(undone.status, 200, JSON.stringify(undone.body)); assert.equal(undone.body.job.state, 'undone');
  assert.ok(!(await j.json('/api/app/maintenance')).maintenance.some(row => row.id === imported.id));
  const reserved = reference => j.db.prepare('SELECT reference FROM reference_allocations WHERE namespace=? AND reference=?').bind('SCH', reference).first();
  assert.equal((await reserved(imported.reference))?.reference, imported.reference, 'undo preserves the removed reservation');
  const create = title => j.json('/api/app/maintenance', 'POST', { ...input, title, autoStart: false, autoComplete: false }, 201);
  const afterDeletion = (await create('Synthetic Lamp after removed maintenance')).maintenance;
  assert.equal(number(afterDeletion.reference, 'SCH'), 3, 'native creation skips the deleted reference');
  const beforeFailure = (await j.json('/api/app/maintenance')).maintenance;
  const beforeAllocations = (await j.db.prepare("SELECT reference FROM reference_allocations WHERE namespace='SCH' ORDER BY reference").all()).results;
  // Fail the product insert after the allocator's separate durable transaction.
  await j.execute(`CREATE TRIGGER synthetic_lamp_maintenance_failure BEFORE INSERT ON maintenance
    WHEN NEW.title='Synthetic Lamp failed maintenance' BEGIN SELECT RAISE(ABORT,'Synthetic Lamp insert failure'); END;`);
  try {
    const failed = await j.json('/api/app/maintenance', 'POST', { ...input, title: 'Synthetic Lamp failed maintenance' }, 409);
    assert.ok(failed.error.includes('Synthetic Lamp insert failure'));
  } finally { await j.execute('DROP TRIGGER synthetic_lamp_maintenance_failure;'); }
  assert.deepEqual((await j.json('/api/app/maintenance')).maintenance, beforeFailure, 'failed creation leaves the complete inventory unchanged');
  const allocations = (await j.db.prepare("SELECT reference FROM reference_allocations WHERE namespace='SCH' ORDER BY reference").all()).results;
  assert.deepEqual(allocations.filter(row => !beforeAllocations.some(prior => prior.reference === row.reference)), [{ reference: 'SCH-4' }]);
  const afterFailure = (await create('Synthetic Lamp after failed maintenance')).maintenance;
  assert.equal(number(afterFailure.reference, 'SCH'), 5, 'native creation never reuses the failed reserved gap');
  await j.restart();
  const restarted = (await create('Synthetic Lamp after maintenance restart')).maintenance;
  assert.equal(number(restarted.reference, 'SCH'), 6, 'allocation survives a new Worker process');
  assert.equal((await reserved(imported.reference))?.reference, imported.reference); assert.equal((await reserved('SCH-4'))?.reference, 'SCH-4');
  const readBack = (await j.json('/api/app/maintenance')).maintenance;
  assert.equal(readBack.find(row => row.id === maintenance.id).reference, maintenance.reference);
  assert.equal(readBack.find(row => row.id === '01J00000000000000000000081').reference, legacyMaintenance);
  assert.equal((await j.read('01J00000000000000000000082')).reference, legacyIncident);
  const thirdIncident = await j.incident('Synthetic Lamp incident after restart', [incidentComponent]);
  assert.equal(number(thirdIncident.reference, 'INC'), 3, 'failed, deleted and restarted maintenance never consume incident numbers');
  return incident;
}
