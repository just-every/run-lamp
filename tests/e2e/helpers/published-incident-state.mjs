import assert from 'node:assert/strict';

// Stay on the incident after publication: a navigation would hide stale panel reads.
export async function publishedIncidentState({ page, composer, component, update, resolved = false, claimState = 'Major outage', screens }) {
  await composer.row('Brief');
  await composer.row('Impact');
  const brief = page.getByRole('region', { name: 'Brief', exact: true });
  await brief.locator('.brief-list summary').filter({ hasText: `${update.lifecycle} update published` }).waitFor();
  await brief.locator('.brief-list > li').filter({ hasText: component.name }).waitFor();
  assert.ok((await brief.innerText()).includes(claimState), 'the brief shows the incident claim, retained in resolved history');
  assert.equal(await brief.locator('.brief-questions').getByText(/never been published|None is attached/).count(), 0, 'publication answers the draft-only questions');
  const impact = page.getByRole('region', { name: 'Impact', exact: true });
  await impact.getByRole('option', { name: 'From components (Critical)', exact: true }).waitFor({ state: 'attached' });
  assert.ok((await impact.innerText()).includes('Critical'), 'the impact panel retains the peak published component impact');
  if (resolved) {
    assert.equal(await composer.publish.count(), 1, 'a resolved incident keeps its publication composer for corrections and reopening');
    assert.equal(await composer.publish.isDisabled(), true, 'an empty resolved draft cannot publish');
    assert.equal(await composer.impact.inputValue(), '', 'resolution consumes the previous customer message');
    assert.equal(await page.locator('.preview-panel').count(), 1, 'a resolved incident keeps the update preview');
    await page.getByRole('button', { name: 'Post-incident report', exact: true }).waitFor();
  } else {
    assert.equal(await composer.audience.inputValue(), update.affectedAudience, 'the next draft carries the last published audience');
    assert.equal(await composer.impact.inputValue(), '', 'publication consumes the customer message');
  }
  await screens(page, resolved ? 'incident-resolved' : 'incident-published');
}

export async function emptyAudienceReason({ page, composer, audience, screens }) {
  await composer.setStatus('Monitoring');
  await composer.impact.fill('Checkout recovery is being monitored.');
  await composer.nextUpdate.fill('2027-09-08T14:30');
  await composer.audience.fill('');
  await page.locator('.autosave-status.is-saved').waitFor();
  assert.equal(await composer.publish.isDisabled(), true);
  assert.equal(await composer.audience.getAttribute('aria-invalid'), 'true', 'the missing audience is marked');
  const reasonId = await composer.publish.getAttribute('aria-describedby');
  assert.ok(reasonId, 'the disabled publication action points to its visible reason');
  const reason = page.locator(`[id="${reasonId}"]`);
  await reason.waitFor();
  assert.ok((await reason.innerText()).trim(), 'the refusal is explained beside Publish');
  await screens(page, 'incident-missing-audience');
  await composer.audience.fill(audience);
  await page.locator('.autosave-status.is-saved').waitFor();
  assert.equal(await composer.publish.isEnabled(), true, 'changing the carried audience restores publication');
}
