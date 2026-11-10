import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { openStatusJourney } from './helpers/status-journey.mjs';
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

    // A row that is genuinely lost still warns: a grandchild flattens the hierarchy, which no parent-as-group rule explains.
    const nested = await moveIn.preview({ ...source, files: withComponents(rows, [row(90, 'Billing detail', 11)]) });
    assert.equal(nested.status, 200, JSON.stringify(nested.body));
    const warnings = nested.body.diagnostics.filter(item => item.code === 'UNMAPPED');
    assert.deepEqual(warnings.map(item => [item.kind, item.sourceId]), [['group', '11']], 'only the flattened nested group warns');
    assert.match(warnings[0].message, /Nested Sorry component grouping/);
    assert.equal(nested.body.counts.unmapped, 1);
    assert.equal(nested.body.report.reconciliation.statement, "17 source component rows -> 14 components + 3 groups (a parent row is shown once, as its children's group)");
    t.diagnostic('PROBE: genuinely unmapped row -> still warns (1 warning, nested group 11)');
  } finally { await runtime.close(); }
});
