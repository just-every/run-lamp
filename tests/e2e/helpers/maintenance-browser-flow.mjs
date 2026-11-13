import assert from 'node:assert/strict';
import { operatorHydrated } from './operator-hydrated.mjs';

// Extend the existing operator journey. Assertions run at its 1440 width;
// the shared capture helper records the same populated screens at 390 too.
export async function maintenanceBrowserFlow({ page, appUrl, pageUrl, api, screenshots }) {
  const component = (await api('/api/app/components', 'POST', {
    name: 'Synthetic Lamp shared-surface service', groupId: null, description: '', internal: false, displayOrder: 0, note: '',
  })).component;
  const incident = (await api('/api/app/incidents', 'POST', {
    title: 'Synthetic Lamp separate incident', components: [{ componentId: component.id, state: 'Degraded performance', relationship: 'Primary' }],
  })).incident;
  await api(`/api/app/incidents/${incident.id}/draft`, 'PUT', {
    lifecycle: 'Identified', affectedAudience: 'Synthetic Lamp service customers.', customerImpact: 'Unplanned requests are delayed.',
    whatStillWorks: 'Existing requests complete.', details: 'Responders are investigating.', nextUpdateAt: new Date(Date.now() + 3600_000).toISOString(),
  });
  await api(`/api/app/incidents/${incident.id}/publish`, 'POST', { channels: [] });
  const input = { title: 'Synthetic Lamp separate maintenance', affectedAudience: 'Synthetic Lamp service customers.',
    customerImpact: 'Planned requests may pause.', componentIds: [component.id],
    startsAt: new Date(Date.now() + 3600_000).toISOString(), endsAt: new Date(Date.now() + 7200_000).toISOString(), autoStart: false, autoComplete: false };
  const maintenance = (await api('/api/app/maintenance', 'POST', input)).maintenance;
  await page.goto(`${appUrl}/app`); await operatorHydrated(page);
  const incidents = page.getByRole('region', { name: 'Active incidents', exact: true });
  const upcoming = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Upcoming maintenance', exact: true }) });
  await incidents.getByText(`${incident.reference} · ${incident.title}`, { exact: true }).waitFor();
  await upcoming.getByText(maintenance.title, { exact: true }).waitFor();
  assert.ok(!(await incidents.textContent()).includes(maintenance.title));
  assert.ok(!(await upcoming.textContent()).includes(incident.title));
  await screenshots(page, 'maintenance-overview');
  await page.goto(`${appUrl}/app/maintenance`); await operatorHydrated(page);
  await page.getByRole('heading', { name: maintenance.title, exact: true }).waitFor();
  assert.ok((await page.locator('main').textContent()).includes(component.name));
  await screenshots(page, 'maintenance-saved');
  const publicPage = await page.context().newPage();
  try {
    for (let attempt = 0; attempt < 50; attempt++) {
      await publicPage.goto(pageUrl);
      if (await publicPage.locator('article.maintenance').filter({ hasText: maintenance.title }).count()) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const publicIncident = publicPage.locator('article.incident').filter({ hasText: incident.title });
    const publicMaintenance = publicPage.locator('article.maintenance').filter({ hasText: maintenance.title });
    assert.equal(await publicIncident.count(), 1); assert.equal(await publicMaintenance.count(), 1);
    assert.ok(!(await publicIncident.textContent()).includes(maintenance.title));
    assert.ok(!(await publicMaintenance.textContent()).includes(incident.title));
    assert.ok((await publicMaintenance.textContent()).includes(component.name));
    assert.deepEqual(await publicMaintenance.locator('.maintenance-window time').evaluateAll(nodes => nodes.map(node => node.dateTime)), [input.startsAt, input.endsAt]);
    await screenshots(publicPage, 'maintenance-public');
  } finally { await publicPage.close(); }
}
