import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { incidentComposer, newIncidentForm } from './incident-composer.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

// One publication journey through the operator page and the public incident page.
// Assertions use 1440. Evidence captures the same changed screens at both widths.
export async function incidentOwnerJourney({ page, browserContext, appUrl, pageUrl, api }) {
  const evidence = process.env.LAMP_INCIDENT_PROOF;
  const observations = { phase: 'after', screens: [] };
  const capture = async (surface, name) => {
    if (!evidence) return;
    await mkdir(evidence, { recursive: true });
    for (const width of [1440, 390]) {
      await surface.setViewportSize({ width, height: 1000 });
      await surface.screenshot({ path: join(evidence, `${name}-${width}.png`), fullPage: true });
      observations.screens.push(`${name}-${width}.png`);
    }
    await surface.setViewportSize({ width: 1440, height: 1000 });
  };
  const component = (await api('/api/app/components', 'POST', {
    name: 'Mobile apps', groupId: null, description: '', internal: false, displayOrder: 0, note: '',
  })).component;
  await page.goto(`${appUrl}/app/components`); await operatorHydrated(page);
  await page.locator('.component-row-summary').filter({ hasText: component.name }).click();
  await page.getByRole('button', { name: 'Status', exact: true }).click();
  await page.locator('.component-status select').selectOption('Degraded performance');
  await page.getByRole('button', { name: 'Save status', exact: true }).click();
  await page.getByText('Status saved', { exact: true }).waitFor();

  await page.goto(`${appUrl}/app/incidents/new`); await operatorHydrated(page);
  const form = newIncidentForm(page);
  await form.title.fill('Mobile requests are slow');
  await form.impact.fill('Some mobile requests take longer to finish.');
  await form.addComponent(component.name);
  await form.audience.fill('Customers using mobile apps.');
  await page.getByRole('button', { name: '30 min', exact: true }).click();
  const state = page.getByLabel(`${component.name} state with this update`, { exact: true });
  assert.equal(await state.inputValue(), '', 'adding a component leaves its state unset');
  assert.equal(await form.publish.isDisabled(), true, 'the owner must choose an affected state to publish');
  const reason = await form.publish.getAttribute('aria-describedby');
  assert.ok((await page.locator(`[id="${reason}"]`).innerText()).includes(component.name));
  await form.componentState(component.name, 'Degraded performance');
  await page.getByRole('button', { name: 'Email', exact: true }).click();
  const preview = page.locator('.preview-panel');
  await page.frameLocator('iframe[title="Notification email message"]').getByText('Some mobile requests take longer to finish.', { exact: false }).waitFor();
  observations.newEmail = await preview.innerText();
  const rendered = (await api('/api/app/incidents/preview', 'POST', {
    title: 'Mobile requests are slow', components: [{ componentId: component.id, state: 'Degraded performance' }],
    update: { lifecycle: 'Investigating', affectedAudience: 'Customers using mobile apps.', customerImpact: 'Some mobile requests take longer to finish.', whatStillWorks: '', details: '', nextUpdateAt: '2027-09-08T21:00:00.000Z' },
  })).preview;
  assert.ok(rendered.email.html, 'the preview exposes the same branded document sent to customers');
  assert.equal(rendered.email.deliverySuppressed, true, 'the preview reports local email suppression');
  assert.equal(await preview.locator('dt').filter({ hasText: /^Message$/ }).count(), 0);
  await capture(page, 'new-email');
  await form.publish.click();
  await page.waitForURL(url => /^\/app\/incidents\/[0-9A-Z]{26}$/.test(url.pathname));
  const id = new URL(page.url()).pathname.split('/').at(-1);
  const path = `/api/app/incidents/${id}`;
  const composer = incidentComposer(page);
  const firstUpdate = (await api(path)).incident.updates[0];
  const live = page.getByRole('region', { name: 'What customers see now' });
  await live.getByText(firstUpdate.customerImpact, { exact: true }).waitFor();
  assert.equal(await live.locator('.state-pill').innerText(), firstUpdate.lifecycle);
  assert.equal(await live.locator('time').getAttribute('datetime'), firstUpdate.nextUpdateAt);
  assert.equal(await composer.impact.isVisible(), false, 'publication closes the next draft');
  const [publicIncident] = await Promise.all([
    browserContext.waitForEvent('page'),
    page.getByRole('link', { name: 'View public page' }).click(),
  ]);
  try {
    const update = publicIncident.locator(`#update-${firstUpdate.id}`);
    await update.getByText(firstUpdate.customerImpact, { exact: true }).waitFor();
    assert.equal(await update.locator('dl time').getAttribute('datetime'), firstUpdate.nextUpdateAt);
  } finally { await publicIncident.close(); }
  await composer.openDraft();
  await composer.setStatus('Resolved');
  await composer.impact.fill('Fixed. Mobile requests finish normally again.');
  await page.locator('.autosave-status.is-saved').waitFor();
  await page.getByRole('region', { name: 'Component statuses after resolution' }).waitFor();
  observations.resolve = await page.locator('.composer-panel').innerText();
  await capture(page, 'resolve-manual');
  await page.getByRole('button', { name: 'Email', exact: true }).click();
  await page.frameLocator('iframe[title="Notification email message"]').getByText(/Update: Fixed/).waitFor();
  await capture(page, 'resolved-email');
  await composer.publish.click();
  await page.waitForFunction(() => document.querySelector('.composer-panel textarea')?.value === '');
  let incident = (await api(path)).incident;
  const resolution = incident.updates[0];
  const publicPage = await browserContext.newPage();
  try {
    for (let attempt = 0; attempt < 60; attempt++) {
      const html = await (await fetch(`${pageUrl}/incidents/${incident.reference}`)).text();
      if (html.includes(resolution.customerImpact)) break;
      if (attempt === 59) throw Error('Public resolution did not appear.');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await publicPage.goto(`${pageUrl}/incidents/${incident.reference}`);
    const entry = publicPage.locator(`#update-${resolution.id}`);
    observations.publicResolution = await entry.innerText();
    const current = (await api('/api/app/components')).components.find(row => row.id === component.id);
    assert.equal(current.publicState, 'Degraded performance');
    assert.equal((await entry.innerText()).includes('→ Operational'), false, 'a manual degradation must not be announced as recovered');
    assert.ok((await entry.innerText()).includes('Degraded performance'));
    await capture(publicPage, 'public-resolved');
    observations.correctButtons = await page.locator('.timeline').getByRole('button', { name: 'Correct', exact: true }).count();
    await capture(page, 'timeline');
    await page.locator(`#update-${resolution.id}`).getByRole('button', { name: 'Correct', exact: true }).click();
    assert.equal(await composer.impact.inputValue(), resolution.customerImpact, 'Correct opens the original wording for editing');
    const corrected = 'Fixed. Mobile requests have finished normally since the recovery check.';
    await composer.impact.fill(corrected);
    await page.locator('.autosave-status.is-saved').waitFor();
    assert.equal((await api(path)).incident.draft.correctsUpdateId, resolution.id, 'autosave retains the correction target');
    await page.reload(); await operatorHydrated(page);
    await page.locator('.autosave-status.is-saved').waitFor();
    assert.equal(await composer.impact.inputValue(), corrected, 'the correction draft survives a new editing visit');
    await capture(page, 'correction-draft');
    await composer.publish.click();
    await page.waitForFunction(() => document.querySelector('.composer-panel textarea')?.value === '');
    incident = (await api(path)).incident;
    assert.equal(incident.lifecycle, 'Resolved', 'a text correction does not reopen the incident');
    assert.equal(incident.updates[0].correctsUpdateId, resolution.id);
    assert.deepEqual(incident.updates.find(row => row.id === resolution.id), resolution, 'the original publication is retained');
    for (let attempt = 0; attempt < 60; attempt++) {
      const html = await (await fetch(`${pageUrl}/incidents/${incident.reference}`)).text();
      if (html.includes(corrected)) break;
      if (attempt === 59) throw Error('Public correction did not appear.');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await publicPage.reload();
    const marker = publicPage.locator(`[data-corrects-update-id="${resolution.id}"]`);
    await marker.waitFor();
    await publicPage.locator(`#update-${resolution.id} [data-corrected-by-update-id="${incident.updates[0].id}"]`).waitFor();
    assert.ok((await marker.locator('a').getAttribute('href')).endsWith(`#update-${resolution.id}`));
    assert.ok((await publicPage.locator(`#update-${incident.updates[0].id}`).innerText()).includes(corrected));
    await capture(publicPage, 'public-correction');
    // Returning the manual setting to Automatic does not change the retained resolution.
    await composer.openDraft();
    await composer.setStatus('Resolved');
    await page.getByRole('button', { name: `Set ${component.name} to Automatic`, exact: true }).click();
    await page.getByRole('region', { name: 'Component statuses after resolution' }).waitFor({ state: 'detached' });
    const automatic = (await api('/api/app/components')).components.find(row => row.id === component.id);
    assert.equal(automatic.standingClaimState, null);
    assert.equal(automatic.publicState, 'Operational');
    assert.deepEqual((await api(path)).incident.updates.find(row => row.id === resolution.id), resolution);
  } finally { await publicPage.close(); }
  if (evidence) await writeFile(join(evidence, 'observations.json'), JSON.stringify(observations, null, 2) + '\n');
}
