import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
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
  const source = { source: 'sorry', pageId: fixture.pageId, publicAccessAcknowledged: true };
  const byId = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id));
  const templateRows = async () => byId((await api('/api/app/incident-templates')).templates);
  const beforeTemplates = await templateRows();
  const quietBefore = await api('/api/app/deliveries');
  const componentIdsBefore = (await api('/api/app/components')).components.map(row => row.id).sort();
  const refusalEvidence = [];
  for (const kind of ['notice', 'update']) {
    for (const fault of ['missing-page', 'conflicting-wording', 'cross-page-scope', 'wrong-owning-page']) {
      const files = structuredClone(fixture.files);
      const file = files.find(row => row.name === `sorry-${kind}-templates${fault === 'conflicting-wording' ? '' : '-2'}.json`);
      if (fault === 'missing-page') files.splice(files.indexOf(file), 1);
      else {
        const envelope = JSON.parse(file.text);
        if (fault === 'conflicting-wording') {
          envelope.response[0].content = 'Conflicting reusable wording.';
          envelope.response[0].initial_comment = 'Original reusable wording.';
        } else if (fault === 'cross-page-scope') envelope.response[0].component_id = 12;
        else envelope.response[0].page_id = 'synthetic-other-page';
        file.text = JSON.stringify(envelope);
      }
      const refused = await move.preview({ ...source, files });
      assert.notEqual(refused.status, 200, `${kind}: ${fault} refuses visibly`);
      const explanation = JSON.stringify(refused.body);
      assert.match(explanation, /error|invalid|incomplete|scope|disagree|page/i, 'refusal includes a visible reason');
      if (fault === 'missing-page') assert.ok(explanation.includes(`sorry-${kind}-templates-2.json`));
      assert.deepEqual(await templateRows(), beforeTemplates, 'a refused collection writes no partial template');
      assert.deepEqual((await api('/api/app/components')).components.map(row => row.id).sort(), componentIdsBefore, 'a refused collection writes no partial dependency');
      refusalEvidence.push({ kind, fault, status: refused.status });
    }
  }
  const reviewed = await move.preview({ ...source, files: fixture.files });
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  for (const kind of ['template', 'update-template']) {
    assert.equal(reviewed.body.report.counts[kind].read, 27, `${kind}: complete two-page census`);
    assert.equal(reviewed.body.report.counts[kind].imported, 27);
    assert.equal(reviewed.body.report.counts[kind].changed, 27, 'private-draft choices are disclosed');
  }
  assert.deepEqual(await templateRows(), beforeTemplates, 'dry run changes no native template');
  const applied = await move.apply(reviewed.body);
  assert.equal(applied.status, 200, JSON.stringify(applied.body));
  assert.equal(applied.body.job.state, 'completed');
  const templates = await templateRows();
  assert.equal(templates.length, beforeTemplates.length + 54);
  for (const expected of fixture.templates) {
    const actual = templates.find(row => row.sourceMetadata?.id === expected.id && row.kind === expected.kind);
    assert.ok(actual, expected.name);
    assert.equal(actual.name, expected.name);
    assert.equal(actual.title, expected.subject ?? '');
    assert.deepEqual(actual.sourceMetadata, {
      provider: 'sorry', id: expected.id, ...(expected.subject === undefined ? {} : { subject: expected.subject }),
      componentId: expected.component_id, body: expected.body, createdAt: expected.created_at, updatedAt: expected.updated_at,
      needsLifecycle: true, needsComponents: true,
    }, 'every source subject/body/scope/timestamp survives native API reads');
    assert.deepEqual(actual.components, [], 'collection scope does not invent affected-service claims');
    assert.equal(actual.customerImpact, expected.body.split('\n\n')[0]);
    assert.equal(actual.details, expected.body.split('\n\n').slice(1).join('\n\n'));
    assert.equal(actual.shouldSendNotifications, null);
    assert.equal(actual.nextUpdateOffsetMinutes, null);
  }
  const repeated = await move.preview({ ...source, files: fixture.files });
  assert.equal(repeated.status, 200, JSON.stringify(repeated.body));
  assert.equal(repeated.body.report.state, 'already imported');
  assert.equal((await move.apply(repeated.body)).status, 200);
  assert.deepEqual(await templateRows(), templates, 'identical import adds or replaces no template of either kind');
  let privateIncidentId;
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
      privateIncidentId = incident.id;
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
  const component = (await api('/api/app/components')).components.find(row => row.name === 'Billing API');
  const edited = [];
  for (const kind of ['notice', 'update']) {
    const template = templates.find(row => row.kind === kind && row.name.endsWith(kind === 'notice' ? ' 1' : ' 27'));
    const editedTemplate = (await api(`/api/app/incident-templates/${template.id}`, 'PUT', {
      details: `Owner-reviewed ${kind} wording.`,
      components: [{ componentId: component.id, state: 'Degraded performance', relationship: 'Dependent' }],
    })).template;
    assert.equal(editedTemplate.sourceMetadata.body, template.sourceMetadata.body, 'native edits preserve full original wording');
    edited.push(editedTemplate);
    const overTitle = templates.find(row => row.kind === kind && row.name.endsWith(' 25'));
    const refusal = await appFetch(`/api/app/incidents/${privateIncidentId}/templates/${overTitle.id}/apply`, { method: 'POST', body: '{}' });
    assert.equal(refusal.status, 409, 'oversized subjects require shortening before application');
    assert.match((await refusal.json()).error, /shorten.*title/i);
  }
  const refreshFiles = structuredClone(fixture.files);
  for (const kind of ['notice', 'update']) {
    const name = `sorry-${kind}-templates${kind === 'notice' ? '' : '-2'}.json`;
    const file = refreshFiles.find(row => row.name === name), envelope = JSON.parse(file.text);
    const target = envelope.response.find(row => row.name.endsWith(kind === 'notice' ? ' 1' : ' 27'));
    target.name += ' changed at source'; file.text = JSON.stringify(envelope);
  }
  const beforeConflict = await templateRows();
  const conflict = await move.preview({ ...source, files: refreshFiles });
  assert.equal(conflict.status, 200, JSON.stringify(conflict.body));
  const rejected = conflict.body.rejected.filter(row => row.kind === 'template' || row.kind === 'update-template');
  assert.deepEqual(rejected.map(({ kind, sourceId }) => [kind, sourceId]).sort(), [
    ['template', 'synthetic-lamp-notice-1'],
    ['update-template', 'synthetic-lamp-update-27'],
  ], 'catch-up rejects both changed sources whose native templates were edited');
  for (const { reason } of rejected) assert.match(reason, /Native edit conflict/);
  assert.deepEqual(await templateRows(), beforeConflict, 'source conflict preserves both edited templates');
  const undone = await move.undo(applied.body.door);
  assert.equal(undone.status, 200, JSON.stringify(undone.body));
  assert.deepEqual(await templateRows(), byId([...beforeTemplates, ...edited]), 'undo removes52 unchanged templates and retains both complete owner edits');
  assert.ok((await api('/api/app/components')).components.some(row => row.id === component.id), 'edited templates and native incident retain their component dependency');
  const retainedReasons = JSON.stringify(undone.body);
  for (const template of edited) assert.ok(retainedReasons.includes(template.name) || retainedReasons.includes(template.id), 'undo names each preserved template');
  assert.equal((await api(`/api/app/incidents/${privateIncidentId}`)).incident.updates.length, 0, 'undo leaves private composer work unpublished');
  const quietAfter = await api('/api/app/deliveries');
  assert.deepEqual(quietAfter.deliveries, quietBefore.deliveries, 'preview, apply, repeat, private drafts and undo send no customer updates');
  assert.deepEqual(quietAfter.subscriptionMail, quietBefore.subscriptionMail, 'import sends no subscription mail');
  if (process.env.LAMP_SORRY_SYNTHETIC_PROOF) await writeFile(join(process.env.LAMP_SORRY_SYNTHETIC_PROOF, 'templates-http-receipt.json'), JSON.stringify({
    schemaVersion: 1, type: 'lamp.sorry.template-http-proof', synthetic: true, signed: false,
    author: 'Run Edit Run fleet', completedAt: new Date().toISOString(),
    counts: { notice: 27, update: 27, imported: 54, unchangedRemovedByUndo: 52, editedRetainedByUndo: 2 },
    exactMetadataReads: 54, refusals: refusalEvidence, identicalRepeatAddsNothing: true, sourceConflictsPreserveEdits: true,
    editedDependenciesRetained: true, originalWordingRetainedAfterShortening: true, noPublication: true, noCustomerMail: true,
  }, null, 2) + '\n');
}

