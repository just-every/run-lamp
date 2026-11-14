import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { subscriberCsvRows } from './subscriber-management-fixture.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

/** Readable audit attribution, subjects and export through native operator doors. */
export async function auditLabelsFlow({ page, appUrl, pageUrl, appFetch, screens }) {
  const since = new Date().toISOString();
  async function api(path, method = 'GET', body) {
    const response = await appFetch(path, { method, ...(body ? { body: JSON.stringify(body) } : {}), headers: { Origin: appUrl } });
    assert.ok(response.ok, `${method} ${path}: ${response.status} ${await response.clone().text()}`);
    return response.status === 204 ? null : response.json();
  }
  const actor = (await api('/api/app/session')).operator;
  const { component } = await api('/api/app/components', 'POST', { name: 'Synthetic Lamp audit payments', description: '', groupId: null, internal: false, displayOrder: 0, note: '' });
  const { incident } = await api('/api/app/incidents', 'POST', { title: 'Synthetic Lamp payment delays', components: [{ componentId: component.id, state: 'Degraded performance', relationship: 'Primary' }] });
  await api(`/api/app/incidents/${incident.id}/draft`, 'PUT', { lifecycle: 'Investigating', affectedAudience: 'Payment customers', customerImpact: 'Payments are delayed', whatStillWorks: '', details: '', nextUpdateAt: new Date(Date.now() + 3600000).toISOString() });
  await api(`/api/app/incidents/${incident.id}/publish`, 'POST', { channels: [] });
  const { maintenance } = await api('/api/app/maintenance', 'POST', { title: 'Synthetic Lamp audit database upgrade', affectedAudience: 'Payment customers', customerImpact: 'Payments may briefly pause', startsAt: new Date(Date.now() + 86400000).toISOString(), endsAt: new Date(Date.now() + 90000000).toISOString(), componentIds: [component.id] });
  const email = 'synthetic-lamp-audit-1@example.test';
  await api('/api/app/operators/invite', 'POST', { email, displayName: 'Synthetic Lamp audit invitee' });
  const invitee = (await api('/api/app/operators/invited')).operators.find(row => row.email === email);
  assert.ok(invitee);
  // The public subscribe door records mail as System, while CSV intake records
  // the importing operator. Both must resolve the same live directory identity.
  const destination = 'synthetic-lamp-audit-active@example.test';
  const subscribed = await fetch(pageUrl + '/subscribe', { method: 'POST', headers: { Origin: pageUrl }, body: new URLSearchParams({ email: destination, componentId: component.id }) });
  assert.equal(subscribed.status, 202);
  const subscriber = (await api('/api/app/subscribers')).subscribers.find(row => row.destination === destination);
  assert.ok(subscriber);
  await api(`/api/app/subscribers/${subscriber.id}/confirm-local`, 'POST');
  const importedDestinations = ['synthetic-lamp-audit-casey@example.test', 'synthetic-lamp-audit-jordan@example.test'];
  const csvInput = 'email,components\n' + importedDestinations.map(value => `${value},${component.id}`).join('\n');
  const preview = await api('/api/app/subscribers/import/preview', 'POST', { csv: csvInput });
  const imported = await api('/api/app/subscribers/import/apply', 'POST', { csv: csvInput, reviewedFingerprint: preview.fingerprint });
  assert.equal(imported.counts.created, 2);
  await api(`/api/app/subscribers/import/${imported.batchId}/send-invitations`, 'POST', {});
  const directory = (await api('/api/app/subscribers')).subscribers;
  assert.equal(directory.find(row => row.id === subscriber.id).state, 'active');
  for (const id of imported.subscriberIds) assert.equal(directory.find(row => row.id === id).state, 'pending');
  await api(`/api/app/incidents/${incident.id}/draft`, 'PUT', { lifecycle: 'Resolved', affectedAudience: 'Payment customers', customerImpact: 'Payments have recovered', whatStillWorks: '', details: '' });
  await api(`/api/app/incidents/${incident.id}/publish`, 'POST', { channels: [] });
  const reportPath = `/api/app/incidents/${incident.id}/report`;
  await api(`${reportPath}/draft`, 'POST');
  await api(reportPath, 'PUT', { summary: 'Payment processing recovered.', timeline: 'Payment delays were resolved.', cause: 'A connection pool was exhausted.', remediation: 'Connection limits were increased.' });
  const { report } = await api(`${reportPath}/publish`, 'POST', { channels: [] });
  assert.ok(report.publishedAt);
  // Other durable subjects and configuration events must not fall through to
  // removal wording merely because their event family has no copied name.
  const { metric } = await api('/api/app/metrics', 'POST', { componentId: component.id, provider: 'push', name: 'Synthetic Lamp audit latency', unit: 'ms' });
  const templateInput = { name: 'Synthetic Lamp audit response', lifecycle: 'Investigating', affectedAudience: 'Payment customers', customerImpact: 'Payments are delayed', whatStillWorks: '', details: '', nextUpdateOffsetMinutes: 30, components: [{ componentId: component.id, state: 'Degraded performance', relationship: 'Primary' }] };
  const { template } = await api('/api/app/incident-templates', 'POST', templateInput);
  await api(`/api/app/incident-templates/${template.id}`, 'PUT', { components: templateInput.components });
  await api('/api/app/prelaunch', 'PATCH', { enabled: true });
  await api('/api/app/prelaunch', 'PATCH', { enabled: false });
  await api(`/api/app/components/${component.id}/history-corrections`, 'POST', { state: 'Degraded performance', startsAt: new Date(Date.now() - 120000).toISOString(), endsAt: new Date(Date.now() - 60000).toISOString(), reason: 'Synthetic Lamp audit correction' });
  const { group } = await api('/api/app/component-groups', 'POST', { name: 'Synthetic Lamp audit retired group', displayOrder: 1 });
  const { component: retired } = await api('/api/app/components', 'POST', { name: 'Synthetic Lamp audit retired component', description: '', groupId: group.id, internal: false, displayOrder: 1, note: '' });
  await api(`/api/app/components/${retired.id}`, 'DELETE');
  await api(`/api/app/component-groups/${group.id}`, 'DELETE');
  const selection = new URLSearchParams({ from: since, actorId: actor.id, limit: '100' });
  const entries = (await api(`/api/app/audit-log?${selection}`)).entries;
  const update = entries.find(row => row.action === 'published' && row.entityName === incident.title);
  assert.ok(update, 'publication resolves its incident title through the saved update');
  const subjects = [
    [update.entityId, incident.title], [maintenance.id, maintenance.title],
    [component.id, component.name], [invitee.id, email], [metric.id, metric.name], [template.id, template.name],
  ];
  for (const [id, name] of subjects) {
    const rows = entries.filter(row => row.entityId === id);
    assert.ok(rows.length, `the native operation for ${name} is audited`);
    assert.ok(rows.every(row => row.entityName === name && row.actorName === actor.displayName));
  }
  const correction = entries.find(row => row.entityType === 'component-state-history' && row.action === 'corrected');
  assert.ok(correction && correction.entityName === component.name && correction.actorId === actor.id && Number.isFinite(Date.parse(correction.createdAt)));
  for (const id of [retired.id, group.id]) {
    const deletion = entries.find(row => row.entityId === id && row.action === 'deleted');
    assert.ok(deletion && /removed|erased/i.test(deletion.entityName) && deletion.actorId === actor.id && Number.isFinite(Date.parse(deletion.createdAt)));
  }
  assert.ok(update.actorId === actor.id && Number.isFinite(Date.parse(update.createdAt)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(appUrl + '/app/settings#audit'); await operatorHydrated(page);
  await page.getByRole('button', { name: 'Open audit log', exact: true }).click();
  const panel = page.locator('#audit-log'), table = panel.getByRole('region', { name: 'Audit entries', exact: true });
  for (const [, name] of subjects) await expect(table.getByRole('cell', { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()).toBeVisible();
  await screens(page, 'audit-record-labels');
  const allSelection = new URLSearchParams({ from: since, limit: '100' });
  const liveEntries = (await api(`/api/app/audit-log?${allSelection}`)).entries;
  const liveSubjects = [[subscriber.id, destination], ...imported.subscriberIds.map(id => [id, directory.find(row => row.id === id).destination]), [report.id, incident.title]];
  for (const [id, name] of liveSubjects) {
    const rows = liveEntries.filter(row => row.entityId === id);
    assert.ok(rows.length && rows.every(row => row.entityName.includes(name) && !/removed|erased/i.test(row.entityName)), `live audit subject ${name}: ${JSON.stringify(rows.map(row => ({ action: row.action, entityName: row.entityName })))}`);
    await expect(table.getByRole('cell', { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()).toBeVisible();
  }
  const reportEntry = liveEntries.find(row => row.entityId === report.id);
  assert.ok(reportEntry.entityName.includes(incident.reference), 'reports name their incident reference as well as its title');
  const batch = liveEntries.find(row => row.entityId === imported.batchId);
  assert.ok(batch && !/removed|erased/i.test(batch.entityName) && /import/i.test(batch.entityName));
  const liveCsv = await page.request.get(`${appUrl}/api/app/audit-log?format=csv&from=${encodeURIComponent(since)}`);
  assert.equal(liveCsv.status(), 200);
  const liveExport = subscriberCsvRows(await liveCsv.text());
  assert.deepEqual(liveExport.map(row => [row.id, row.entityName]), liveEntries.map(row => [row.id, row.entityName]), 'CSV and view share every subject name and row');
  const settings = liveEntries.filter(row => row.entityType === 'settings');
  assert.ok(settings.length && settings.every(row => /prelaunch/i.test(row.entityName) && !/removed|erased/i.test(row.entityName)));
  const paged = [];
  for (let offset = 0; offset < liveEntries.length; offset += 3) {
    const result = await api(`/api/app/audit-log?from=${encodeURIComponent(since)}&limit=3&offset=${offset}`);
    paged.push(...result.entries);
    assert.equal(result.hasMore, offset + result.entries.length < liveEntries.length);
  }
  assert.deepEqual(paged.map(row => row.id), liveEntries.map(row => row.id), 'pagination retains the complete ordered matching result');
  const until = liveEntries[Math.floor(liveEntries.length / 2)].createdAt;
  const timeFiltered = (await api(`/api/app/audit-log?from=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&limit=100`)).entries;
  assert.deepEqual(timeFiltered.map(row => row.id), liveEntries.filter(row => row.createdAt < until).map(row => row.id), 'time filters retain exactly their matching rows');
  const visible = await table.innerText();
  for (const id of [actor.id, ...subjects.map(([id]) => id)]) assert.ok(!visible.includes(id), 'opaque ids stay out of the visible audit table');
  assert.ok(!visible.includes('notice-published') && !visible.includes('state-changed'), 'action codes are readable sentences');
  // Selecting a human label must still send the exact recorded code.
  await panel.getByRole('combobox', { name: /^Operator/ }).selectOption(actor.id);
  const action = panel.getByRole('combobox', { name: /^Audit action/ });
  const label = await action.locator('option[value="notice-published"]').innerText();
  assert.ok(!label.includes('notice-published'));
  await action.selectOption({ label });
  const filteredResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/app/audit-log' && new URL(response.url()).searchParams.get('action') === 'notice-published');
  await panel.getByRole('button', { name: 'Apply filters', exact: true }).click();
  const filtered = (await (await filteredResponse).json()).entries;
  assert.ok(filtered.length && filtered.every(row => row.action === 'notice-published' && row.actorId === actor.id));
  await expect(table.locator('tbody tr')).toHaveCount(filtered.length);
  const csv = await page.request.get(appUrl + await panel.getByRole('link', { name: 'Export matching audit CSV', exact: true }).getAttribute('href'));
  assert.equal(csv.status(), 200);
  const exported = subscriberCsvRows(await csv.text());
  assert.deepEqual(exported.map(row => row.id), filtered.map(row => row.id));
  for (const row of exported) {
    const native = filtered.find(entry => entry.id === row.id);
    for (const key of ['actorId', 'actorName', 'action', 'entityId', 'entityName']) assert.equal(row[key], native[key]);
    assert.equal(row.actionLabel, label, 'CSV keeps the display label beside the machine code');
  }
  // Erasure resolves labels again; no copied invitation identity can survive.
  await api(`/api/app/operators/${invitee.id}`, 'DELETE');
  const erased = (await api(`/api/app/audit-log?${selection}`)).entries.filter(row => row.entityId === invitee.id);
  assert.ok(erased.length && erased.every(row => row.entityName === 'Removed item'));
  assert.ok(!JSON.stringify(erased).includes(email), 'erased subjects never regain their address from historic payloads');
  // Every historical subscriber row must resolve the tombstone rather than a
  // copied destination, including System mail, CSV import and invitation rows.
  for (const id of [subscriber.id, imported.subscriberIds[0]]) await api(`/api/app/subscribers/${id}`, 'DELETE');
  const afterErasure = (await api(`/api/app/audit-log?${allSelection}`)).entries;
  for (const id of [subscriber.id, imported.subscriberIds[0]]) {
    const rows = afterErasure.filter(row => row.entityId === id);
    assert.ok(rows.length && rows.every(row => /removed|erased/i.test(row.entityName)));
    assert.ok(rows.some(row => row.action === 'deleted' && row.actorId === actor.id && Number.isFinite(Date.parse(row.createdAt))), 'erasure retains its attributed event and time');
  }
  const erasedDestinations = [destination, directory.find(row => row.id === imported.subscriberIds[0]).destination];
  const erasedCsv = await (await page.request.get(`${appUrl}/api/app/audit-log?format=csv`)).text();
  for (const value of erasedDestinations) {
    assert.ok(!JSON.stringify(afterErasure).includes(value));
    assert.ok(!erasedCsv.includes(value), 'CSV never exposes an erased destination');
  }
  // A soft-deleted publication remains auditable without exposing a dead id/title.
  await api(`/api/app/incidents/${incident.id}`, 'DELETE', { reason: 'Synthetic Lamp audit removal' });
  const removed = (await api(`/api/app/audit-log?${selection}`)).entries.find(row => row.id === update.id);
  assert.equal(removed.entityName, 'Removed item');
  const removedReport = (await api(`/api/app/audit-log?${selection}`)).entries.find(row => row.id === reportEntry.id);
  assert.ok(/removed|erased/i.test(removedReport.entityName), 'deleted incidents no longer name their reports');
  await api(`/api/app/metrics/${metric.id}`, 'DELETE');
  const removedMetric = (await api(`/api/app/audit-log?${selection}`)).entries.filter(row => row.entityId === metric.id);
  assert.ok(removedMetric.length && removedMetric.every(row => /removed|erased/i.test(row.entityName)));
  await panel.getByRole('combobox', { name: /^Operator/ }).selectOption('');
  await action.selectOption('');
  await panel.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(table.getByRole('cell', { name: 'Removed item', exact: false }).first()).toBeVisible();
  for (const value of erasedDestinations) assert.ok(!(await table.innerText()).includes(value), 'the refreshed audit view never exposes an erased destination');
  await screens(page, 'audit-after-erasure');
}
