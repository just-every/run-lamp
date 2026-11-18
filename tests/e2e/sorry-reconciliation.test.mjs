import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { openStatusJourney, eventually } from './helpers/status-journey.mjs';
import { moveInDoor } from '../helpers/import-notifications.mjs';

const files = family => readdirSync(`tests/fixtures/sorry/${family}`).map(name => ({ name, text: readFileSync(`tests/fixtures/sorry/${family}/${name}`, 'utf8') }));
const row = (id, name, parent) => ({ id, name, state: 'operational', parent_id: parent ?? null, position: id, created_at: '2025-04-02T10:00:00.000Z', updated_at: '2025-04-02T10:00:00.000Z' });
// Two parents with six children each and two standalone rows: 16 source rows.
const rows = [row(10, 'Customer services'), row(11, 'Billing API', 10), ...[21, 22, 23, 24, 25].map(id => row(id, `Customer part ${id}`, 10)),
  row(20, 'Platform'), ...[26, 27, 28, 29, 30, 31].map(id => row(id, `Platform part ${id}`, 20)), row(40, 'Website'), row(41, 'Mobile app')];
const withComponents = (components, extra = []) => [...files('public').filter(file => file.name !== 'sorry-components.json'),
  { name: 'sorry-components.json', text: JSON.stringify({ components: [...components, ...extra], meta: { count: components.length + extra.length, total_count: components.length + extra.length } }) }];

test('MOVE-001 Move in explains how Sorry component rows arrive as components and groups', { timeout: 300_000 }, async t => {
  const runtime = await openStatusJourney({});
  try {
    const owner = async (path, body, method = body === undefined ? 'GET' : 'POST', headers) => {
      const response = await runtime.request(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }), headers });
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    };
    const moveIn = moveInDoor((path, body, headers) => owner(path, body, undefined, headers));
    const source = { source: 'sorry', pageId: 'synthpage01', publicAccessAcknowledged: true };
    const reviewed = await moveIn.preview({ ...source, files: withComponents(rows) });
    assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
    const { report, counts, diagnostics } = reviewed.body, reconciliation = report.reconciliation;
    assert.equal(reconciliation.statement, "16 source component rows -> 14 components + 2 groups (a parent row is shown once, as its children's group)");
    assert.deepEqual([reconciliation.sourceRows, reconciliation.components, reconciliation.groups], [16, 14, 2]);
    assert.deepEqual(reconciliation.groupRows.map(row => row.name).sort(), ['Customer services', 'Platform']);
    assert.equal(reconciliation.sourceRows, report.counts.component.read + report.counts.group.read, 'the reconciliation agrees with the machine-readable counts');
    assert.equal(counts.byKind.component + counts.byKind.group, 16);
    assert.match(reconciliation.effects.statement, new RegExp(`^${counts.effects} effects: 14 components, 2 groups`));
    assert.match(reconciliation.effects.statement, /2 effects lower than importing each parent twice/);
    assert.equal(reconciliation.effects.total, counts.effects, 'the explained effect total is the plan effect total');
    assert.deepEqual([counts.unmapped, diagnostics.filter(item => item.code === 'UNMAPPED')], [0, []], 'a parent row shown as its children\'s group is not an unmapped warning');
    t.diagnostic(`PROBE: ${reconciliation.statement}; unmapped warnings ${counts.unmapped}`);

    const applied = await moveIn.apply(reviewed.body);
    assert.equal(applied.status, 200, JSON.stringify(applied.body));
    assert.equal(applied.body.job.state, 'completed');
    assert.deepEqual(applied.body.report.reconciliation, reconciliation, 'the receipt of the apply carries the dry run\'s reconciliation');
    const evidence = await owner(`/api/app/statuspage-import/jobs/${applied.body.job.id}/verification`);
    assert.equal(evidence.status, 200);
    assert.deepEqual(evidence.body.rowReconciliation, reconciliation, 'the verification evidence carries it too');
    assert.equal(evidence.body.counts.unmapped, 0);
    assert.equal(evidence.body.nativeCounts.component + evidence.body.nativeCounts.group, 16, 'the native rows add back up to the source rows');
    assert.equal(evidence.body.unexplainedDifferences, 0);
    assert.equal((await moveIn.undo(applied.body.door)).status, 200);

    // Source defects are reviewed through the same ordinary Move in door.
    const capture = (patch, updatePatch = updates => updates) => withComponents(rows).map(file => {
      if (!['sorry-notices.json', 'sorry-notice-100.json'].includes(file.name)) return file;
      const data = JSON.parse(file.text);
      if (data.notices) data.notices = data.notices.map(notice => notice.id === 100 ? { ...notice, ...patch } : notice);
      else data.notice = { ...data.notice, ...patch, updates: updatePatch(data.notice.updates) };
      return { ...file, text: JSON.stringify(data) };
    });
    for (const [selection, expected] of [
      [[10, 11], ['Billing API']],
      [[10], rows.filter(row => row.parent_id === 10).map(row => row.name)],
      [[10, 11, 20, 26, 40], ['Billing API', 'Platform part 26', 'Website']],
    ]) {
      const began_at = '2025-04-02T10:00:00.000Z', ended_at = '2025-04-02T09:00:00.000Z';
      const closed = '2025-04-02T10:45:00.000Z';
      const bundle = capture({ components: selection.map(id => ({ id })), began_at, ended_at }, updates => [
        ...updates,
        { id: 1002, state: 'resolved', content: 'Recovery remains confirmed.', created_at: closed, updated_at: closed },
      ]);
      const plan = await moveIn.preview({ ...source, files: bundle });
      assert.equal(plan.status, 200, JSON.stringify(plan.body));
      const change = plan.body.report.items.find(item => item.sourceId === '100' && item.kind === 'incident');
      assert.equal(change.outcome, 'changed');
      assert.ok(change.reason.includes(ended_at) && change.reason.includes(began_at) && change.reason.includes(closed), 'review discloses the original invalid end and the source-supported replacement');
      const result = await moveIn.apply(plan.body);
      assert.equal(result.status, 200, JSON.stringify(result.body));
      const incidents = (await owner('/api/app/incidents')).body.incidents;
      const incident = incidents.find(item => item.title === 'Delayed invoice processing');
      const detail = (await owner(`/api/app/incidents/${incident.id}`)).body.incident;
      assert.deepEqual(detail.components.map(item => item.componentName).sort(), [...expected].sort());
      assert.equal(Date.parse(detail.openedAt), Date.parse(began_at));
      assert.equal(Date.parse(detail.resolvedAt), Date.parse(closed));
      assert.deepEqual(detail.updates.map(item => Date.parse(item.publishedAt)).sort(), [began_at, '2025-04-02T10:30:00.000Z', closed].map(Date.parse).sort(), 'every authored update keeps its source instant');
      const publicIncident = await eventually(async () => {
        const response = await runtime.raw(runtime.publicOrigin + '/api/public/v1/incidents');
        return response.status === 200 ? (await response.json()).data.find(item => item.id === incident.id) : null;
      }, value => value?.title === incident.title, 'normalized incident reaches the public API');
      assert.deepEqual(publicIncident.components.sort(), [...expected].sort(), 'public affected set excludes unlisted siblings');
      assert.equal(Date.parse(publicIncident.openedAt), Date.parse(began_at));
      assert.equal(Date.parse(publicIncident.resolvedAt), Date.parse(closed));
      assert.deepEqual(publicIncident.updates.map(item => Date.parse(item.publishedAt)).sort(), detail.updates.map(item => Date.parse(item.publishedAt)).sort(), 'public updates retain every source publication time');
      assert.equal((await moveIn.undo(result.body.door)).status, 200);
    }
    for (const updatePatch of [updates => updates.slice(0, 1), updates => updates.map(update => ({ ...update, created_at: '2025-04-02T09:00:00.000Z' }))]) {
      const refused = await moveIn.preview({ ...source, files: capture({ ended_at: '2025-04-02T09:00:00.000Z' }, updatePatch) });
      assert.equal(refused.status, 200, JSON.stringify(refused.body));
      const rejection = refused.body.report.items.find(item => item.sourceId === '100' && item.kind === 'incident');
      assert.equal(rejection.outcome, 'rejected', 'no usable authored resolution must remain refused');
      assert.match(rejection.reason, /end precedes its start/);
    }

    t.diagnostic('PROBE: mixed parent/child selection affects only listed children; parent alone includes its group; malformed end uses latest authored resolution and discloses it; absent or pre-start resolution still refuses');

    // A recursive source keeps each parent once, retaining its actual name,
    // description, original state and timestamps independently of Lamp edits.
    const fullName = 'Billing API ' + 'source-label '.repeat(20);
    const fullDescription = 'Nested source description. '.repeat(30);
    const sourceEditedAt = '2025-04-03T08:15:00.000Z';
    const nestedRows = rows.map(item => item.id === 11 ? { ...item, name: fullName, description: fullDescription, state: 'partially-degraded', updated_at: sourceEditedAt } : item);
    const nestedFiles = withComponents(nestedRows, [row(90, 'Billing detail', 11)]);
    const nested = await moveIn.preview({ ...source, files: nestedFiles });
    assert.equal(nested.status, 200, JSON.stringify(nested.body));
    assert.equal(nested.body.counts.unmapped, 0, 'recursive parents are retained instead of flattened or dropped');
    assert.equal(nested.body.report.reconciliation.statement, "17 source component rows -> 14 components + 3 groups (a parent row is shown once, as its children's group)");
    const nestedApplied = await moveIn.apply(nested.body);
    assert.equal(nestedApplied.status, 200, JSON.stringify(nestedApplied.body));
    const catalogue = (await owner('/api/app/components')).body;
    assert.deepEqual([catalogue.components.length, catalogue.groups.length], [14, 3], 'every source row becomes one native group or leaf');
    const parent = catalogue.groups.find(group => group.sourceMetadata?.id === '10');
    const child = catalogue.groups.find(group => group.sourceMetadata?.id === '11');
    const leaf = catalogue.components.find(component => component.sourceMetadata?.id === '90');
    assert.equal(child.parentId, parent.id);
    assert.equal(leaf.groupId, child.id);
    assert.equal(child.sourceMetadata.name, fullName);
    assert.equal(child.sourceMetadata.description, fullDescription);
    assert.deepEqual(child.sourceMetadata.ancestorIds, ['10']);
    assert.equal(child.sourceMetadata.state, 'partially-degraded');
    assert.equal(child.sourceMetadata.position, 11);
    assert.equal(Date.parse(child.sourceMetadata.createdAt), Date.parse(nestedRows.find(row => row.id === 11).created_at));
    assert.equal(Date.parse(child.sourceMetadata.updatedAt), Date.parse(sourceEditedAt));
    const bulk = await owner('/api/app/components/bulk');
    assert.equal(bulk.status, 200, JSON.stringify(bulk.body));
    assert.equal(bulk.body.catalogue.groups.find(group => group.id === child.id).parentId, parent.id, 'bulk editing reads the same hierarchy');
    const repeat = await moveIn.preview({ ...source, files: nestedFiles });
    assert.equal(repeat.status, 200, JSON.stringify(repeat.body));
    assert.equal((await moveIn.apply(repeat.body)).status, 200);
    assert.deepEqual((await owner('/api/app/components')).body, catalogue, 'repeat import does not duplicate groups, leaves or source metadata');
    const rootFiles = withComponents(nestedRows.map(item => item.id === 11 ? { ...item, parent_id: null, description: null } : item), [row(90, 'Billing detail', 11)]);
    const rootPlan = await moveIn.preview({ ...source, files: rootFiles });
    assert.equal(rootPlan.status, 200, JSON.stringify(rootPlan.body));
    const rootApplied = await moveIn.apply(rootPlan.body);
    assert.equal(rootApplied.status, 200, JSON.stringify(rootApplied.body));
    const rootGroup = (await owner('/api/app/components')).body.groups.find(group => group.id === child.id);
    assert.equal(rootGroup.parentId, null, 'catch-up can remove a former source parent');
    assert.equal(rootGroup.description, '', 'catch-up can remove the former source description');
    assert.equal((await moveIn.undo(rootApplied.body.door)).status, 200);
    assert.deepEqual((await owner('/api/app/components')).body, catalogue, 'undo restores the complete child and metadata inventory');
    const ownerLeaf = await owner('/api/app/components', { name: 'Owner child', groupId: child.id, description: '', internal: false, displayOrder: 100, note: '' });
    assert.equal(ownerLeaf.status, 201, JSON.stringify(ownerLeaf.body));
    assert.equal((await owner(`/api/app/component-groups/${child.id}`, { name: 'Owner group name' }, 'PUT')).status, 204);
    const undone = await moveIn.undo(nestedApplied.body.door);
    assert.equal(undone.status, 200, JSON.stringify(undone.body));
    const remaining = (await owner('/api/app/components')).body;
    assert.ok(remaining.components.some(component => component.id === ownerLeaf.body.component.id));
    assert.ok(remaining.groups.some(group => group.id === child.id && group.name === 'Owner group name'), 'undo keeps owner edits');
    assert.ok(remaining.groups.some(group => group.id === parent.id), 'undo retains the ancestry of a preserved child group');
    t.diagnostic('PROBE: recursive groups reconcile once with full original metadata; repeat is stable; undo keeps edited groups, their ancestry and an owner-created child');

  } finally { await runtime.close(); }
});
