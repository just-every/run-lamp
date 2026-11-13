import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { operatorHydrated } from './operator-hydrated.mjs';

/** Readable audit attribution, subjects and export through native operator doors. */
export async function auditLabelsFlow({ page, appUrl, appFetch }) {
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
  const selection = new URLSearchParams({ from: since, actorId: actor.id, limit: '100' });
  const entries = (await api(`/api/app/audit-log?${selection}`)).entries;
  const update = entries.find(row => row.action === 'published' && row.entityName === incident.title);
  assert.ok(update, 'publication resolves its incident title through the saved update');
  const subjects = [
    [update.entityId, incident.title], [maintenance.id, maintenance.title],
    [component.id, component.name], [invitee.id, email],
  ];
  for (const [id, name] of subjects) {
    const rows = entries.filter(row => row.entityId === id);
    assert.ok(rows.length, `the native operation for ${name} is audited`);
    assert.ok(rows.every(row => row.entityName === name && row.actorName === actor.displayName));
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(appUrl + '/app/settings#audit'); await operatorHydrated(page);
  await page.getByRole('button', { name: 'Open audit log', exact: true }).click();
  const panel = page.locator('#audit-log'), table = panel.getByRole('region', { name: 'Audit entries', exact: true });
  for (const [, name] of subjects) await expect(table.getByRole('cell', { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()).toBeVisible();
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
  // Values here contain no quotes/newlines; compare the real export by its headers.
  const [header, ...lines] = (await csv.text()).trimEnd().split('\r\n');
  const keys = header.split(','), exported = lines.map(line => Object.fromEntries(line.split(',').map((value, index) => [keys[index], value.slice(1, -1)])));
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
  // A soft-deleted publication remains auditable without exposing a dead id/title.
  await api(`/api/app/incidents/${incident.id}`, 'DELETE', { reason: 'Synthetic Lamp audit removal' });
  const removed = (await api(`/api/app/audit-log?${selection}`)).entries.find(row => row.id === update.id);
  assert.equal(removed.entityName, 'Removed item');
  await action.selectOption('');
  await panel.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(table.getByRole('cell', { name: 'Removed item', exact: false }).first()).toBeVisible();
}
