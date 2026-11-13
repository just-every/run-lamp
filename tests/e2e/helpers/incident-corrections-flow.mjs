import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { incidentComposer } from './incident-composer.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

// Continue the existing incident journey through its operator and public doors.
// Assertions run at 1440; the same changed screens are captured once at both widths.
export async function incidentCorrectionsFlow({ page, browserContext, appUrl, pageUrl, api, incident, component }) {
  const path = `/api/app/incidents/${incident.id}`;
  const composer = incidentComposer(page);
  const read = async () => (await api(path)).incident;
  const saved = () => page.locator('.autosave-status.is-saved').waitFor();
  const capture = async (surface, name) => {
    if (!process.env.LAMP_INCIDENT_SCREENSHOTS || !name.startsWith('reopened-')) return;
    await mkdir(process.env.LAMP_INCIDENT_SCREENSHOTS, { recursive: true });
    for (const width of [1440, 390]) {
      await surface.setViewportSize({ width, height: 1000 });
      await surface.screenshot({ path: join(process.env.LAMP_INCIDENT_SCREENSHOTS, `${name}-${width}.png`), fullPage: true });
    }
    await surface.setViewportSize({ width: 1440, height: 1000 });
  };
  const markCorrection = async target => {
    await composer.option('Publish as a correction');
    await page.getByLabel('Published update to correct').selectOption(target.id);
    const marked = page.waitForResponse(response => response.url().endsWith(`${path}/draft/correction`) && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Mark as correction', exact: true }).click();
    assert.equal((await marked).status(), 200);
    assert.equal((await read()).draft.correctsUpdateId, target.id);
  };
  const publish = async () => {
    assert.equal(await composer.publish.isEnabled(), true);
    const published = page.waitForResponse(response => response.url().endsWith(`${path}/publish`) && response.request().method() === 'POST');
    await composer.publish.click();
    assert.equal((await published).status(), 200);
    await page.waitForFunction(() => document.querySelector('.composer-panel textarea')?.value === '');
    return read();
  };
  const ordinaryNextDraft = async () => {
    assert.equal(await composer.impact.inputValue(), '', 'publication consumes the correction text');
    assert.equal((await read()).draft, null, 'publication consumes the stored correction selection');
    assert.equal(await page.getByLabel('Published update to correct').isVisible(), false, 'publication closes correction choices with the consumed draft');
    assert.equal(await page.locator('.option-message').count(), 0, 'feedback from the consumed correction does not describe the next draft');
  };
  const operatorCorrection = async (update, target) => {
    const entry = page.locator(`.timeline [data-update-id="${update.id}"]`);
    const marker = entry.locator(`[data-corrects-update-id="${target.id}"]`);
    await marker.waitFor();
    assert.ok((await marker.innerText()).includes(target.lifecycle));
    assert.equal(await marker.locator('time').getAttribute('datetime'), target.publishedAt);
    assert.equal(await marker.locator('a').getAttribute('href'), `#update-${target.id}`);
    assert.equal(await page.locator(`.timeline #update-${target.id} > p`).first().innerText(), target.customerImpact);
  };
  const publicPage = await browserContext.newPage();
  await publicPage.setViewportSize({ width: 1440, height: 1000 });
  const publicCorrection = async (current, correction, target) => {
    // Snapshot publication is asynchronous; wait for the actual public read to advance.
    for (let attempt = 0; attempt < 60; attempt++) {
      const html = await (await fetch(`${pageUrl}/incidents/${current.reference}`)).text();
      if (html.includes(current.updates[0].customerImpact)) break;
      if (attempt === 59) throw new Error('The public correction snapshot did not advance.');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await publicPage.goto(`${pageUrl}/incidents/${current.reference}`);
    const entry = publicPage.locator(`article.update[data-update-id="${correction.id}"]`);
    const marker = entry.locator(`[data-corrects-update-id="${target.id}"]`);
    await marker.waitFor();
    assert.ok((await marker.innerText()).includes(target.lifecycle));
    assert.equal(await marker.locator('time').getAttribute('datetime'), target.publishedAt);
    assert.equal(await marker.locator('a').getAttribute('href'), `/incidents/${current.reference}#update-${target.id}`);
    const original = publicPage.locator(`#update-${target.id}`);
    assert.ok((await original.innerText()).includes(target.customerImpact), 'original public wording is retained');
    assert.deepEqual(await publicPage.locator('article.update').evaluateAll(entries => entries.map(entry => entry.dataset.updateId)), current.updates.map(update => update.id), 'public updates retain newest-first publication order');
    await marker.locator('a').click();
    assert.equal(new URL(publicPage.url()).hash, `#update-${target.id}`, 'the correction opens its original update');
    await publicPage.goto(pageUrl);
    const publicMarker = publicPage.locator(`[data-corrects-update-id="${target.id}"]`).first();
    await publicMarker.waitFor();
    assert.equal(await publicMarker.locator('time').getAttribute('datetime'), target.publishedAt, 'the public page also identifies the correction target');
  };

  try {
    await page.goto(`${appUrl}/app/incidents/${incident.id}`); await operatorHydrated(page);
    await composer.impact.waitFor();
    assert.equal((await read()).lifecycle, 'Resolved');
    const resolution = incident.updates.find(update => update.lifecycle === 'Resolved');
    assert.ok(resolution);
    assert.equal(await composer.status(), 'Resolved');
    await composer.impact.fill('Harbour Cart recovery completed later than first reported.');
    await saved();
    await markCorrection(resolution);
    const resolvedCorrectionIncident = await publish();
    const resolvedCorrection = resolvedCorrectionIncident.updates[0];
    assert.equal(resolvedCorrectionIncident.lifecycle, 'Resolved', 'a resolved correction keeps the incident closed');
    assert.equal(resolvedCorrection.correctsUpdateId, resolution.id);
    for (const original of incident.updates) assert.deepEqual(resolvedCorrectionIncident.updates.find(update => update.id === original.id), original, 'correction preserves every original publication');
    await ordinaryNextDraft();
    await operatorCorrection(resolvedCorrection, resolution);
    await capture(page, 'resolved-correction-operator');
    await publicCorrection(resolvedCorrectionIncident, resolvedCorrection, resolution);
    await capture(publicPage, 'resolved-correction-public');

    await composer.setStatus('Investigating');
    await composer.impact.fill('Harbour Cart checkout is failing again; investigation has reopened.');
    await page.getByLabel(`${component.name} state with this update`, { exact: true }).selectOption('Partially unavailable');
    await composer.nextUpdate.fill('2027-09-08T15:00');
    await saved();
    assert.equal((await read()).draft.correctsUpdateId, null, 'the next saved draft is ordinary');
    assert.equal((await api('/api/app/components')).components.find(row => row.id === component.id).publicState, 'Operational', 'readers see recovery before reopening');
    const preview = (await api(path)).preview;
    assert.ok(JSON.stringify(preview).includes(`${component.name}: Operational → Partially unavailable`), 'the reopen preview uses the same recovered baseline');
    const priorUpdates = (await read()).updates;
    const reopened = await publish();
    const reopening = reopened.updates[0];
    const change = reopening.componentChanges.find(row => row.componentId === component.id);
    assert.deepEqual([change?.previousState, change?.newState], ['Operational', 'Partially unavailable'], 'reopening starts from the state readers last saw');
    for (const original of priorUpdates) assert.deepEqual(reopened.updates.find(update => update.id === original.id), original, 'reopening preserves all earlier publications');
    assert.equal(reopened.lifecycle, 'Investigating', 'publishing through the resolved composer reopens the incident');
    assert.equal(reopening.correctsUpdateId, null, 'the next ordinary publication does not inherit correction mode');
    await publicCorrection(reopened, resolvedCorrection, resolution);
    await publicPage.goto(`${pageUrl}/incidents/${incident.reference}`);
    for (const [surface, selector] of [[page, `.timeline [data-update-id="${reopening.id}"]`], [publicPage, `article.update[data-update-id="${reopening.id}"]`]]) {
      const text = await surface.locator(selector).innerText();
      assert.ok(text.includes(`${component.name}: Operational → Partially unavailable`), 'operator and public reopening timelines use the recovered baseline');
    }
    await capture(page, 'reopened-operator');
    await capture(publicPage, 'reopened-public');
    const publicIds = await publicPage.locator('article.update').evaluateAll(entries => entries.map(entry => entry.dataset.updateId));
    assert.ok(publicIds.indexOf(reopening.id) < publicIds.indexOf(resolution.id), 'reopening and resolution remain in publication order');
    for (const update of [resolution, reopening]) {
      const entry = publicPage.locator(`#update-${update.id}`);
      assert.equal(await entry.locator('.update-head > strong').innerText(), update.lifecycle);
      assert.equal(await entry.locator('.update-head time').getAttribute('datetime'), update.publishedAt);
    }

    // Active incidents use exactly the same correction controls.
    await composer.setStatus('Identified');
    await composer.impact.fill('Harbour Cart retries sometimes succeed while checkout capacity recovers.');
    await composer.nextUpdate.fill('2027-09-08T16:00');
    await saved();
    await markCorrection(reopening);
    const activeCorrectionIncident = await publish();
    const activeCorrection = activeCorrectionIncident.updates[0];
    assert.equal(activeCorrection.correctsUpdateId, reopening.id);
    assert.deepEqual(activeCorrectionIncident.updates.find(update => update.id === reopening.id), reopening);
    await ordinaryNextDraft();
    await operatorCorrection(activeCorrection, reopening);
    await capture(page, 'active-correction-operator');
    await publicCorrection(activeCorrectionIncident, activeCorrection, reopening);
    await capture(publicPage, 'active-correction-public');
    await publicPage.goto(`${pageUrl}/incidents/${incident.reference}`);
    await capture(publicPage, 'corrections-permalink');
    await page.reload(); await operatorHydrated(page);
    await ordinaryNextDraft();
  } finally { await publicPage.close(); }
}
