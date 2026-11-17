import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { importedRecordInventory, notificationInventory, publicAliasInventory } from '../../helpers/import-notifications.mjs';
import { sorryTemplateFixture } from './sorry-template-fixture.mjs';

const execute = promisify(execFile);
const byId = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id));

/** One documentation-derived template journey. Only the Sorry network edge is
 * mocked: capture, uploaded original files, owner review, native composer,
 * edits, repeat and undo all use their ordinary command/HTTP doors. */
export async function sorryTemplateImportFlow({ runtime, move, send, t }) {
  const fixture = sorryTemplateFixture();
  const source = { source: 'sorry', pageId: fixture.pageId, publicAccessAcknowledged: true };
  const directory = await mkdtemp(join(tmpdir(), 'lamp-sorry-templates-'));
  try {
    const keyFile = join(directory, 'synthetic-key'), capture = join(directory, 'capture');
    await writeFile(keyFile, 'synthetic-lamp-capture-only\n', { mode: 0o600 });
    const captured = await execute(process.execPath, ['--experimental-strip-types', '--import', resolve('tests/e2e/helpers/sorry-template-edge.mjs'),
      'scripts/sorry-capture.mjs', '--page-id', fixture.pageId, '--key-file', keyFile, '--out', capture], { timeout: 120_000, maxBuffer: 2 * 1024 * 1024 });
    assert.match(captured.stdout, /Saved 8 unchanged Sorry response files/);
    assert.deepEqual((await readdir(capture)).sort(), fixture.files.map(row => row.name).sort());
    const files = await Promise.all(fixture.files.map(async original => {
      const text = await readFile(join(capture, original.name), 'utf8');
      assert.equal(text, original.text, `${original.name}: capture retains all original bytes`);
      return { name: original.name, text };
    }));
    const templateRows = async () => byId((await runtime.json('/api/app/incident-templates')).templates);
    const ownerComponent = await runtime.component('Synthetic owner composer service');
    for (const kind of ['notice', 'update']) await runtime.json('/api/app/incident-templates', 'POST', {
      name: `Synthetic existing ${kind} control`, lifecycle: 'Identified', affectedAudience: 'Existing customers', customerImpact: 'Existing impact',
      whatStillWorks: '', details: 'Existing complete wording', nextUpdateOffsetMinutes: 45,
      components: [{ componentId: ownerComponent.id, state: 'Degraded performance', relationship: 'Primary' }],
    }, 201);
    const before = { native: await importedRecordInventory(runtime), templates: await templateRows(), public: await publicAliasInventory(runtime), notifications: await notificationInventory(runtime) };
    const reviewed = await move.preview({ ...source, files });
    assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
    const report = reviewed.body.report;
    // The reader retains both resource kinds independently even if IDs overlap.
    for (const kind of ['template', 'update-template']) {
      assert.equal(report.counts[kind].read, 27, `${kind}: both source pages are counted`);
      assert.equal(report.counts[kind].imported, 27);
      assert.equal(report.counts[kind].changed, 27, 'changed discloses absent defaults independently of native imports');
    }
    for (const kind of ['notice', 'update']) {
      const overflow = report.items.find(row => row.name === `Synthetic ${kind} template 27`);
      assert.ok(overflow && /shorten.*details|details.*shorten/i.test(overflow.reason), `${kind}: dry run names oversized details without truncation`);
    }
    assert.deepEqual(await importedRecordInventory(runtime), before.native, 'template review writes no native record');
    assert.deepEqual(await publicAliasInventory(runtime), before.public, 'template review leaves the public page unchanged');
    assert.deepEqual(await notificationInventory(runtime), before.notifications, 'template capture and review send nothing');

    async function refuses(mutate, description) {
      const changed = structuredClone(files);
      mutate(changed);
      const refused = await move.preview({ ...source, files: changed });
      assert.notEqual(refused.status, 200, description);
      assert.deepEqual(await importedRecordInventory(runtime), before.native, `${description}: no partial write`);
      assert.deepEqual(await notificationInventory(runtime), before.notifications, `${description}: no mail`);
      return refused;
    }
    for (const kind of ['notice', 'update']) {
      const missing = await refuses(changed => changed.splice(changed.findIndex(row => row.name === `sorry-${kind}-templates-2.json`), 1), `${kind}: a missing second page refuses the complete input`);
      assert.match(JSON.stringify(missing.body), new RegExp(`sorry-${kind}-templates-2`), 'missing-page refusal identifies the file');
      await refuses(changed => {
        const file = changed.find(row => row.name === `sorry-${kind}-templates.json`), value = JSON.parse(file.text);
        value.response[0].content = 'Conflicting reusable wording.';
        value.response[0].initial_comment = 'Original reusable wording.';
        file.text = JSON.stringify(value);
      }, `${kind}: conflicting initial_comment/content refuses visibly`);
      await refuses(changed => {
        const file = changed.find(row => row.name === `sorry-${kind}-templates-2.json`), value = JSON.parse(file.text);
        value.response[0].component_id = 'synthetic-other-page'; file.text = JSON.stringify(value);
      }, `${kind}: collection scope outside the captured page refuses visibly`);
      await refuses(changed => {
        const file = changed.find(row => row.name === `sorry-${kind}-templates-2.json`), value = JSON.parse(file.text);
        value.response[0].page_id = 'synthetic-other-page'; file.text = JSON.stringify(value);
      }, `${kind}: a different owning page refuses visibly`);
    }

    const colliding = structuredClone(files);
    for (const kind of ['notice', 'update']) {
      const file = colliding.find(row => row.name === `sorry-${kind}-templates.json`), value = JSON.parse(file.text);
      value.response[0].name = `Synthetic existing ${kind} control`; file.text = JSON.stringify(value);
    }
    const nameConflict = await move.preview({ ...source, files: colliding });
    assert.equal(nameConflict.status, 200, JSON.stringify(nameConflict.body));
    for (const kind of ['template', 'update-template']) assert.equal(nameConflict.body.report.counts[kind].rejected, 1, `${kind}: an existing name is refused instead of replaced`);
    assert.deepEqual(await templateRows(), before.templates, 'name conflicts preserve complete existing templates of both kinds');

    const applied = await move.apply(reviewed.body);
    assert.equal(applied.status, 200, JSON.stringify(applied.body));
    assert.equal(applied.body.job.state, 'completed');
    const templates = await templateRows();
    assert.equal(templates.length, before.templates.length + 54);
    assert.deepEqual(templates.filter(row => before.templates.some(prior => prior.id === row.id)), before.templates, 'import preserves every existing template');
    for (const sourceTemplate of fixture.templates) {
      const actual = templates.find(row => row.name === sourceTemplate.name);
      assert.ok(actual, sourceTemplate.name);
      assert.equal(actual.kind, sourceTemplate.kind);
      assert.equal(actual.title, sourceTemplate.subject ?? '');
      assert.equal(actual.sourceMetadata.provider, 'sorry');
      assert.equal(actual.sourceMetadata.id, sourceTemplate.id);
      assert.equal(actual.sourceMetadata.body, sourceTemplate.body, 'whole source wording survives native API reads');
      assert.equal(actual.sourceMetadata.subject, sourceTemplate.subject);
      assert.equal(actual.sourceMetadata.componentId, sourceTemplate.component_id, 'collection-page scope remains separate from affected services');
      assert.equal(actual.sourceMetadata.createdAt, sourceTemplate.created_at);
      assert.equal(actual.sourceMetadata.updatedAt, sourceTemplate.updated_at);
      assert.equal(actual.sourceMetadata.needsLifecycle, true);
      assert.equal(actual.sourceMetadata.needsComponents, true);
      assert.equal(actual.shouldSendNotifications, null, 'source has no publishing default');
      assert.equal(actual.nextUpdateOffsetMinutes, null, 'source has no promised next-update default');
      assert.deepEqual(actual.components, [], 'collection-page availability never invents affected-service impact');
      const [impact, details] = sourceTemplate.body.split('\n\n');
      assert.equal(actual.customerImpact, impact);
      assert.equal(actual.details, details);
      assert.deepEqual(actual.fieldsToShorten, sourceTemplate.name.endsWith(' 27') ? ['details'] : []);
    }
    const exactNative = await importedRecordInventory(runtime);
    assert.deepEqual(await notificationInventory(runtime), before.notifications, 'apply and complete template reads remain silent');
    assert.deepEqual(await publicAliasInventory(runtime), before.public, 'template imports publish no incident or alias');
    const repeated = await move.preview({ ...source, files });
    assert.equal(repeated.status, 200, JSON.stringify(repeated.body));
    assert.equal(repeated.body.report.state, 'already imported');
    assert.equal((await move.apply(repeated.body)).status, 200);
    assert.deepEqual(await importedRecordInventory(runtime), exactNative, 'repeat creates no template or dependency of either kind');

    const scopedComponent = (await runtime.json('/api/app/components')).components.find(row => row.name === 'Billing API');
    const incident = await runtime.incident('Synthetic private Sorry template review', [ownerComponent]);
    await runtime.save(incident.id, { lifecycle: 'Monitoring', affectedAudience: 'Owner-selected customers', customerImpact: 'Owner impact', whatStillWorks: 'Other services work', details: 'Owner draft details' });
    const incidentBefore = await runtime.read(incident.id);
    const edited = [];
    for (const kind of ['notice', 'update']) {
      const first = templates.find(row => row.name === `Synthetic ${kind} template 1`);
      const response = await runtime.request(`/api/app/incidents/${incident.id}/templates/${first.id}/apply`, { method: 'POST', body: '{}' });
      assert.equal(response.status, 200, await response.clone().text());
      const filled = await response.json();
      assert.equal(filled.draft.lifecycle, 'Monitoring', 'applying wording keeps the owner-reviewed lifecycle');
      assert.equal(filled.draft.customerImpact, `Synthetic ${kind} impact 1.`);
      assert.equal(filled.draft.details, `Synthetic ${kind} complete details 1.`);
      assert.equal(filled.draft.componentChanges.some(row => row.componentId === scopedComponent.id), false, 'collection scope does not become a staged component claim');
      const readback = await runtime.read(incident.id);
      assert.deepEqual(readback.updates, incidentBefore.updates, 'apply fills only a private draft');
      assert.deepEqual(readback.components, incidentBefore.components, 'apply changes no live incident component state');
      const longTitle = templates.find(row => row.name === `Synthetic ${kind} template 25`);
      const titleBlocked = await runtime.request(`/api/app/incidents/${incident.id}/templates/${longTitle.id}/apply`, { method: 'POST', body: '{}' });
      assert.equal(titleBlocked.status, 409, await titleBlocked.clone().text());
      assert.match((await titleBlocked.json()).error, /shorten.*title/i);
      const titleSaved = await runtime.request(`/api/app/incident-templates/${longTitle.id}`, { method: 'PUT', body: JSON.stringify({ title: `Owner-shortened ${kind} title` }) });
      assert.equal(titleSaved.status, 200, await titleSaved.clone().text());
      const shortened = (await titleSaved.json()).template;
      assert.equal(shortened.sourceMetadata.subject, longTitle.sourceMetadata.subject, 'shortening the title keeps the entire original subject');
      edited.push(shortened);
      const titleApplied = await runtime.request(`/api/app/incidents/${incident.id}/templates/${longTitle.id}/apply`, { method: 'POST', body: '{}' });
      assert.equal(titleApplied.status, 200, await titleApplied.clone().text());
      const overflow = templates.find(row => row.name === `Synthetic ${kind} template 27`);
      const blocked = await runtime.request(`/api/app/incidents/${incident.id}/templates/${overflow.id}/apply`, { method: 'POST', body: '{}' });
      assert.equal(blocked.status, 409, await blocked.clone().text());
      assert.match((await blocked.json()).error, /shorten/i, 'oversized wording asks for shortening before private application');
    }
    assert.deepEqual(await notificationInventory(runtime), before.notifications, 'private template application sends no mail');

    // Native edits use both template kinds and acquire a real component
    // dependency. Undo must retain those edits and the component they now need.
    for (const kind of ['notice', 'update']) {
      const template = templates.find(row => row.name === `Synthetic ${kind} template 27`);
      const response = await runtime.request(`/api/app/incident-templates/${template.id}`, { method: 'PUT', body: JSON.stringify({
        details: `Owner-shortened ${kind} wording.`, affectedAudience: 'Owner-reviewed customers', lifecycle: 'Identified',
        components: [{ componentId: scopedComponent.id, state: 'Degraded performance', relationship: 'Dependent' }],
      }) });
      assert.equal(response.status, 200, await response.clone().text());
      edited.push((await response.json()).template);
    }
    const changedFiles = structuredClone(files);
    for (const file of changedFiles.filter(row => /templates-2\.json$/.test(row.name))) {
      const value = JSON.parse(file.text); value.response[1].name += ' changed at source'; file.text = JSON.stringify(value);
    }
    const beforeConflict = await templateRows();
    const conflict = await move.preview({ ...source, files: changedFiles });
    assert.ok(conflict.status !== 200 || conflict.body.report.items.some(row => /conflict|edit|preserv/i.test(row.reason) && ['rejected', 'skipped'].includes(row.outcome)), 'source refresh cannot overwrite edited templates');
    assert.deepEqual(await templateRows(), beforeConflict);
    const undone = await move.undo(applied.body.door);
    assert.equal(undone.status, 200, JSON.stringify(undone.body));
    const afterUndo = await templateRows();
    assert.deepEqual(afterUndo, byId([...before.templates, ...edited]), 'undo removes both unchanged kinds and retains complete owner edits');
    assert.ok((await runtime.json('/api/app/components')).components.some(row => row.id === scopedComponent.id), 'edited templates keep their affected component dependency');
    const retainedReasons = JSON.stringify(undone.body);
    for (const template of edited) assert.ok(retainedReasons.includes(template.name) || retainedReasons.includes(template.id), 'undo identifies each edited template');
    assert.deepEqual(await notificationInventory(runtime), before.notifications, 'repeat, conflict and undo remain silent');
    t.diagnostic('PROBE Sorry templates: capture 27 notice + 27 update across 25-row pages; 54 exact metadata/body reads; refusal, private draft, repeat, edited-template dependency undo all passed');
    if (process.env.LAMP_SORRY_SYNTHETIC_PROOF) await writeFile(join(process.env.LAMP_SORRY_SYNTHETIC_PROOF, 'templates-receipt.json'), JSON.stringify({
      schemaVersion: 1, type: 'lamp.sorry.template-synthetic-proof', synthetic: true, signed: false,
      author: 'Run Edit Run fleet', completedAt: new Date().toISOString(),
      revision: (await execute('git', ['rev-parse', 'HEAD'])).stdout.trim(),
      counts: { notice: 27, update: 27, capturedOriginalFiles: files.length, imported: 54, unchangedRemovedByUndo: 50, editedRetainedByUndo: 4 },
      originalBytesPreserved: true, metadataPreserved: true, scopeDoesNotClaimComponents: true, noPublication: true, silent: true,
      nameConflictsPreserved: true, oversizedSubjectPreservedAndShortened: true, missingPageRefused: true, conflictingWordingRefused: true, crossPageScopeRefused: true, repeatUnchanged: true, editedDependenciesRetained: true,
    }, null, 2) + '\n');
  } finally { await rm(directory, { recursive: true, force: true }); }
}
