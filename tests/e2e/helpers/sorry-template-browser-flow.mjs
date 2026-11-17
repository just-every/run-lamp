import assert from 'node:assert/strict';
import { sorryTemplateFixture } from './sorry-template-fixture.mjs';
import { moveInDoor } from '../../helpers/import-notifications.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';
import { incidentComposer, newIncidentForm } from './incident-composer.mjs';

export async function sorryTemplateBrowserFlow({ page, appUrl, appFetch, api, screens }) {
  const fixture = sorryTemplateFixture();
  const current = (await api('/api/app/page-settings')).settings;
  const { pageName, tagline, accentColor, hostname, footerCreditEnabled, widgetAllowedOrigins, mailFromAddress, timezone } = current;
  await api('/api/app/page-settings', 'PUT', { pageName, tagline, accentColor, hostname, footerCreditEnabled, widgetAllowedOrigins, mailFromAddress, timezone });
  const move = moveInDoor(async (path, body, headers) => {
    const response = await appFetch(path, { method: body === undefined ? 'GET' : 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }), headers });
    return { status: response.status, body: await response.json() };
  });
  const reviewed = await move.preview({ source: 'sorry', pageId: fixture.pageId, files: fixture.files, publicAccessAcknowledged: true });
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  const applied = await move.apply(reviewed.body);
  assert.equal(applied.status, 200, JSON.stringify(applied.body));
  const templates = (await api('/api/app/incident-templates')).templates;
  const sourceMetadata = async source => {
    const metadata = page.getByRole('region', { name: 'Sorry template source', exact: true });
    await metadata.waitFor();
    const text = await metadata.innerText();
    assert.ok(text.includes(source.subject));
    assert.ok(text.includes(`Collection page ${source.component_id}`));
    assert.ok(text.includes(source.created_at));
    assert.ok(text.includes(source.updated_at));
    assert.match(text, /Review status and affected services in the private draft/);
    await metadata.getByText('Original Sorry wording', { exact: true }).click();
    assert.equal(await metadata.getByLabel('Original Sorry wording', { exact: true }).inputValue(), source.body, 'complete original body remains readable');
  };
  for (const kind of ['notice', 'update']) {
    const source = fixture.templates.find(row => row.kind === kind);
    const template = templates.find(row => row.kind === kind && row.sourceMetadata.id === source.id);
    assert.ok(template);
    await page.goto(`${appUrl}/app/settings#templates`); await operatorHydrated(page);
    await page.getByLabel('Saved update template', { exact: true }).selectOption(template.id);
    await sourceMetadata(source);
    assert.equal(await page.getByLabel('Template customer impact', { exact: true }).inputValue(), source.body.split('\n\n')[0]);
    assert.equal(await page.getByLabel('Template details', { exact: true }).inputValue(), source.body.split('\n\n').slice(1).join('\n\n'));
    assert.equal(await page.getByLabel('Template status', { exact: true }).count(), 0, 'no status default is represented as source-authored');
    await screens(page, `sorry-${kind}-settings`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (kind === 'notice') {
      await page.goto(`${appUrl}/app/incidents/new`); await operatorHydrated(page);
      const form = newIncidentForm(page);
      await form.option('Use a template');
      await page.getByLabel('Saved update template', { exact: true }).selectOption(template.id);
      await sourceMetadata(source);
      await page.getByRole('button', { name: 'Apply template', exact: true }).click();
      assert.equal(await form.impact.inputValue(), template.customerImpact);
      assert.equal(await form.audience.inputValue(), '', 'wording does not invent an affected audience');
      assert.equal(await page.getByLabel('Billing API state with this update', { exact: true }).count(), 0, 'collection scope does not attach a service');
      assert.equal(await form.publish.isDisabled(), true);
      await form.option('Details');
      assert.equal(await page.getByLabel('Details', { exact: true }).inputValue(), template.details);
      await screens(page, 'sorry-notice-new-composer');
    } else {
      const component = (await api('/api/app/components')).components.find(row => row.name === 'Billing API');
      const incident = (await api('/api/app/incidents', 'POST', { title: 'Synthetic private update template review', components: [{ componentId: component.id, state: 'Major outage', relationship: 'Primary' }] })).incident;
      const nextUpdateAt = '2027-09-08T14:00:00.000Z';
      await api(`/api/app/incidents/${incident.id}/draft`, 'PUT', { lifecycle: 'Identified', affectedAudience: 'Reviewed existing audience', customerImpact: 'Prior private wording', whatStillWorks: '', details: '', nextUpdateAt });
      await page.goto(`${appUrl}/app/incidents/${incident.id}`); await operatorHydrated(page);
      const composer = incidentComposer(page);
      await composer.option('Use a template');
      await page.getByLabel('Saved update template', { exact: true }).selectOption(template.id);
      await sourceMetadata(source);
      await page.getByRole('button', { name: 'Apply template', exact: true }).click();
      await page.getByRole('status').filter({ hasText: /Template filled the private draft/ }).waitFor();
      assert.equal(await composer.impact.inputValue(), template.customerImpact);
      assert.equal(await composer.audience.inputValue(), 'Reviewed existing audience');
      assert.equal(await composer.status(), 'Identified', 'application preserves the chosen draft lifecycle');
      assert.equal(await page.getByLabel('Billing API state with this update', { exact: true }).inputValue(), 'Major outage');
      await composer.option('Details');
      assert.equal(await composer.details.inputValue(), template.details);
      await screens(page, 'sorry-update-existing-composer');
      const after = (await api(`/api/app/incidents/${incident.id}`)).incident;
      assert.equal(after.updates.length, 0, 'template application remains private');
      assert.equal(after.draft.nextUpdateAt, nextUpdateAt);
    }
  }
  await page.goto(`${appUrl}/app/settings#templates`); await operatorHydrated(page);
  const longSource = fixture.templates.find(row => row.kind === 'update' && row.name.endsWith(' 27'));
  const long = templates.find(row => row.sourceMetadata?.id === longSource.id);
  await page.getByLabel('Saved update template', { exact: true }).selectOption(long.id);
  assert.equal(await page.getByLabel('Template details', { exact: true }).inputValue(), longSource.body.split('\n\n').slice(1).join('\n\n'));
  await page.getByLabel('Template details', { exact: true }).fill('Shortened complete review wording.');
  await page.getByRole('button', { name: 'Save template changes', exact: true }).click();
  await page.getByText('Template changes saved.', { exact: true }).waitFor();
  const saved = (await api('/api/app/incident-templates')).templates.find(row => row.id === long.id);
  assert.deepEqual(saved.fieldsToShorten, []);
  assert.equal(saved.sourceMetadata.body, longSource.body, 'shortening preserves the original source body');
}
