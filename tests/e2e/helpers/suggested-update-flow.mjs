import assert from 'node:assert/strict';
import { incidentComposer } from './incident-composer.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

// The provider edge supplies wording; every incident, brief, save and source
// disclosure still comes from the native operator doors.
export async function suggestedUpdateFlow({ page, appUrl, api, configureSuggestion, screens, diagnostic }) {
  const component = async name => (await api('/api/app/components', 'POST', {
    name, groupId: null, description: '', internal: false, displayOrder: 0, note: '',
  })).component;
  const checkout = await component('Suggestion checkout');
  const catalogue = await component('Suggestion catalogue');
  const { incident } = await api('/api/app/incidents', 'POST', {
    title: 'Suggestion evidence remains private until publication',
    components: [{ componentId: checkout.id, state: 'Major outage', relationship: 'Primary' }],
  });
  // Separate writes make the two brief component identities deterministic.
  await api(`/api/app/incidents/${incident.id}/components`, 'POST', {
    componentId: catalogue.id, state: 'Degraded performance', relationship: 'Dependent',
  });
  const endpoint = `/api/app/incidents/${incident.id}`;
  await api(`${endpoint}/draft`, 'PUT', {
    lifecycle: 'Identified', affectedAudience: 'Published checkout shoppers.',
    customerImpact: 'Published payment attempts are delayed.', whatStillWorks: 'Published browsing is available.',
    details: 'Published responders are restoring payment capacity.', nextUpdateAt: '2099-09-08T14:00:00.000Z',
  });
  await api(`${endpoint}/publish`, 'POST', { channels: [] });
  const existing = {
    lifecycle: 'Monitoring', affectedAudience: 'Existing audience written by the operator.',
    customerImpact: 'Existing impact written by the operator.', whatStillWorks: 'Existing working service written by the operator.',
    details: 'Existing details written by the operator.', nextUpdateAt: '2099-09-08T15:00:00.000Z',
  };
  await api(`${endpoint}/draft`, 'PUT', existing);
  const { brief } = await api(`${endpoint}/brief`);
  assert.deepEqual(brief.whatWeKnow.components, [
    { ref: 'C1', name: 'Suggestion checkout', state: 'Major outage', relationship: 'Primary' },
    { ref: 'C2', name: 'Suggestion catalogue', state: 'Degraded performance', relationship: 'Dependent' },
  ]);
  assert.equal(brief.whatWeKnow.updates.length, 1);
  assert.equal(brief.whatWeKnow.updates[0].ref, 'U1');
  assert.equal(brief.whatWeKnow.updates[0].customerImpact, 'Published payment attempts are delayed.');
  await page.goto(`${appUrl}/app/incidents/${incident.id}`);
  await operatorHydrated(page);
  const saved = () => page.locator('.autosave-status.is-saved').waitFor();
  await saved();
  const composer = incidentComposer(page);
  const fields = { affectedAudience: composer.audience, customerImpact: composer.impact, whatStillWorks: composer.stillWorks, details: composer.details };
  const sources = key => key === 'whatStillWorks' || key === 'details'
    ? fields[key].locator('..').locator('.field-sources')
    : page.locator(key === 'customerImpact' ? '.impact-field:has(textarea) + .field-sources' : 'fieldset.impact-field + .field-sources');
  const nextUpdate = await composer.nextUpdate.inputValue();
  const values = async expected => {
    for (const [key, field] of Object.entries(fields)) assert.equal(await field.inputValue(), expected[key], key);
    assert.equal(await composer.status(), 'Monitoring');
    assert.equal(await composer.nextUpdate.inputValue(), nextUpdate);
  };
  const suggest = async answer => {
    configureSuggestion({ ...answer, lifecycle: 'Resolved', nextUpdateAt: '2099-12-31T00:00:00.000Z' });
    const response = page.waitForResponse(response => response.url().endsWith(`${endpoint}/ai-suggestion`) && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Suggest update', exact: true }).click();
    assert.equal((await response).status(), 200);
    await page.locator('.ai-suggestion [role=status]').filter({ hasText: /^Suggestion filled/ }).waitFor();
    await saved();
  };
  const targets = {
    C1: ['Suggestion checkout: Major outage (primary)'],
    C2: ['Suggestion catalogue: Degraded performance (dependent)'],
    U1: ['Identified update published', 'Published checkout shoppers.', 'Published payment attempts are delayed.', 'Published browsing is available.', 'Published responders are restoring payment capacity.'],
  };
  async function openSources(key, expected) {
    const source = sources(key);
    assert.equal(await source.isVisible(), true, `${key} has sources beside its field`);
    assert.deepEqual(await source.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))), expected.map(ref => `#brief-${ref}`));
    for (const ref of expected) {
      const toggle = page.getByRole('button', { name: 'Brief', exact: true });
      if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
      const target = page.locator(`#brief-${ref}`);
      assert.equal(await target.isVisible(), false);
      await source.locator(`a[href="#brief-${ref}"]`).click();
      await target.waitFor({ state: 'visible' });
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      for (const text of targets[ref]) assert.ok((await target.textContent()).includes(text), `${key} opens ${ref}: ${text}`);
      if (ref === 'U1') assert.equal(await target.locator('details').getAttribute('open'), '');
      await page.waitForFunction(id => {
        const rect = document.getElementById(id).getBoundingClientRect();
        return rect.bottom > 0 && rect.top < innerHeight;
      }, `brief-${ref}`);
    }
  }
  try {
    await values(existing);
    await suggest({
      affectedAudience: { text: 'Suggested card-payment customers.', sources: ['C1', 'C1', 'C999'] },
      customerImpact: { text: '', sources: ['C2'] },
      whatStillWorks: { text: 'The assistant believes saved carts remain available.', sources: ['Q-overdue', 'A999'] },
      details: { text: 'Responders continue the published payment investigation.', sources: ['U1'] },
    });
    const first = {
      affectedAudience: 'Suggested card-payment customers.', customerImpact: 'Existing impact written by the operator.',
      whatStillWorks: 'The assistant believes saved carts remain available.', details: 'Responders continue the published payment investigation.',
    };
    await values(first);
    assert.equal(await sources('customerImpact').count(), 0, 'an empty suggestion does not claim existing operator text');
    assert.equal(await sources('whatStillWorks').isVisible(), true);
    assert.match(await sources('whatStillWorks').textContent(), /No source: written by the assistant/);
    assert.equal(await sources('whatStillWorks').locator('a').count(), 0);
    await openSources('affectedAudience', ['C1']);
    await openSources('details', ['U1']);
    const briefToggle = page.getByRole('button', { name: 'Brief', exact: true });
    if (await briefToggle.getAttribute('aria-expanded') === 'true') await briefToggle.click();
    await page.locator('.composer-panel').scrollIntoViewIfNeeded();
    await screens(page, 'draft-suggestions');
    diagnostic('PROBE DRAFT-001 1 and 2: composer Suggest update with mixed nonempty, empty and uncited fields -> suggested wording, preserved impact and visible assistant authorship');

    await suggest({
      affectedAudience: { text: '', sources: ['C2'] },
      customerImpact: { text: 'Suggested catalogue searches are slower.', sources: ['C2'] },
      whatStillWorks: { text: 'The earlier update confirms that browsing works.', sources: ['U1', 'C1'] },
      details: { text: '', sources: ['C2'] },
    });
    await values({ ...first, customerImpact: 'Suggested catalogue searches are slower.', whatStillWorks: 'The earlier update confirms that browsing works.' });
    await openSources('customerImpact', ['C2']);
    await openSources('whatStillWorks', ['U1', 'C1']);
    diagnostic('PROBE DRAFT-001 3: source links beside all four fields -> exact C1 and C2 components and expanded U1 published update in the Brief row');

    const edited = {
      affectedAudience: 'Operator corrected the suggested audience.', customerImpact: 'Operator corrected the suggested impact.',
      whatStillWorks: 'Operator corrected the suggested working service.', details: 'Operator corrected the suggested details.',
    };
    for (const [key, value] of Object.entries(edited)) {
      assert.equal(await fields[key].isEditable(), true, key);
      await fields[key].fill(value);
      assert.equal(await fields[key].inputValue(), value);
      assert.equal(await sources(key).count(), 0, 'edited text belongs to the operator');
    }
    await saved();
    await suggest(Object.fromEntries(Object.keys(fields).map(key => [key, { text: '', sources: ['C1'] }])));
    await values(edited);
    const stored = (await api(endpoint)).incident;
    for (const [key, value] of Object.entries(edited)) assert.equal(stored.draft[key], value, `saved ${key}`);
    assert.equal(stored.draft.lifecycle, 'Monitoring');
    assert.equal(stored.draft.nextUpdateAt, '2099-09-08T15:00:00.000Z');
    assert.equal(stored.updates.length, 1, 'suggestions do not publish another update');
    await page.reload(); await operatorHydrated(page); await saved();
    await values(edited);
    diagnostic('PROBE DRAFT-001 1 and 4: edit all four suggested fields, then request all-empty results -> exact operator text survives save and reload; lifecycle and commitment unchanged');
  } finally { configureSuggestion(null); }
}
