import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { generateSorryFixture } from '../../scripts/generate-sorry-fixture.mjs';
import { sorryTemplateImportFlow } from './helpers/sorry-template-import-flow.mjs';
import { openStatusJourney } from './helpers/status-journey.mjs';
import { importedRecordInventory, notificationInventory, publicAliasInventory, moveInDoor } from '../helpers/import-notifications.mjs';

const root = resolve('tests/fixtures/sorry/generated');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const load = async mode => Promise.all((await readdir(join(root, mode))).sort().map(async name => ({ name, text: await readFile(join(root, mode, name), 'utf8') })));

test('documented Sorry generator reproduces all bytes and hashes without provider reads', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lamp-sorry-generated-'));
  try {
    const first = await generateSorryFixture(join(directory, 'first'));
    const second = await generateSorryFixture(join(directory, 'second'));
    assert.deepEqual(first, second);
    const walk = async (base, prefix = '') => {
      const results = [];
      for (const item of await readdir(join(base, prefix), { withFileTypes: true })) {
        const name = join(prefix, item.name);
        if (item.isDirectory()) results.push(...await walk(base, name));
        else {
          assert.ok(item.isFile() && !item.isSymbolicLink());
          const bytes = await readFile(join(base, name));
          results.push([name, bytes.length, hash(bytes)]);
        }
      }
      return results.sort(([a], [b]) => a.localeCompare(b));
    };
    const actual = await walk(join(directory, 'first'));
    assert.deepEqual(actual, await walk(join(directory, 'second')));
    assert.deepEqual(actual, await walk(root), 'committed fixture bytes are exactly reproducible');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('documented Sorry exports account for every field through preview, saved jobs and explicit refusals', { timeout: process.env.LAMP_SORRY_FULL_SCALE === '1' ? 1_800_000 : 600_000 }, async t => {
  const expected = JSON.parse(await readFile(join(root, 'expected-inventory.json'), 'utf8'));
  const runtime = await openStatusJourney();
  const results = [];
  try {
    const send = async (path, body, headers) => {
      const response = await runtime.request(path, { method: body === undefined ? 'GET' : 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }), headers });
      return { status: response.status, body: await response.json() };
    };
    const move = moveInDoor(send);
    const { pageName, tagline, accentColor, hostname, footerCreditEnabled, widgetAllowedOrigins, mailFromAddress, timezone } = (await runtime.json('/api/app/page-settings')).settings;
    await runtime.json('/api/app/page-settings', 'PUT', { pageName, tagline, accentColor, hostname, footerCreditEnabled, widgetAllowedOrigins, mailFromAddress, timezone });
    const census = expected.census;
    const initial = {
      native: await importedRecordInventory(runtime),
      public: await publicAliasInventory(runtime),
      notifications: await notificationInventory(runtime),
    };
    for (const mode of ['authenticated', 'public']) {
      const files = await load(mode);
      const input = { source: 'sorry', pageId: mode === 'authenticated' ? 'synthetic-lamp-1' : '', publicAccessAcknowledged: true, files };
      const before = {
        native: await importedRecordInventory(runtime), public: await publicAliasInventory(runtime),
        notifications: await notificationInventory(runtime),
      };
      console.log('Synthetic Sorry ' + mode + ': preview');
      const preview = await move.preview(input);
      assert.equal(preview.status, 200, JSON.stringify(preview.body));
      const report = preview.body.report, fields = report.fieldLedger;
      assert.ok(fields?.length);
      const expectedPaths = Object.entries(expected.paths).filter(([name]) => name.startsWith(mode + '/'))
        .flatMap(([name, paths]) => paths.map(path => name.slice(mode.length + 1) + path)).sort();
      assert.deepEqual(fields.map(field => field.file + field.path).sort(), expectedPaths, 'every supplied leaf has exactly one independent ledger row');
      assert.ok(fields.every(field => field.reason && field.action && ['mapped', 'changed', 'raw-only', 'deleted', 'refused'].includes(field.outcome)));
      const find = (file, path) => fields.find(field => field.file === file && field.path === path);
      for (const probe of expected.cases.filter(row => row.file.startsWith(mode + '/'))) {
        const field = find(probe.file.slice(mode.length + 1), probe.path);
        assert.ok(field, probe.file + probe.path + ' is accounted for');
        assert.equal(field.outcome, probe.expected, probe.reason);
      }
      const componentFile = 'sorry-components.json', componentRoot = mode === 'public' ? '/components' : '/response';
      assert.equal(find(componentFile, componentRoot + '/4/future_metadata/nested/owner~1note~0text').outcome, 'raw-only');
      for (const path of ['/4/name', '/4/description', '/0/name']) assert.equal(find(componentFile, componentRoot + path).outcome, 'changed', 'every bounded long field is named');
      assert.match(find(componentFile, componentRoot + '/4/description').reason, /shortened/);
      assert.equal(find(componentFile, componentRoot + '/0/description').outcome, 'raw-only', 'a parent group has no native description');
      const longMessage = mode === 'public' ? find('sorry-notice-2000.json', '/notice/updates/0/content') : find('sorry-notice-2000-updates.json', '/response/0/content');
      assert.equal(longMessage.outcome, 'changed');
      assert.match(longMessage.reason, /full source message|Full source message/i);
      assert.deepEqual([report.reconciliation.sourceRows, report.reconciliation.components, report.reconciliation.groups],
        [census.sourceComponentRows, census.nativeComponents, census.nativeGroups]);
      assert.deepEqual([report.counts.incident.imported, report.counts.maintenance.imported], [census.nativeIncidents, census.nativeMaintenance]);
      assert.equal(report.counts.subscriber.imported, mode === 'authenticated' ? census.eligibleHeldEmailSubscribers : 0);
      if (mode === 'authenticated') {
        const refusedIds = [...new Set(fields.filter(field => field.kind === 'subscriber' && field.outcome === 'refused').map(field => field.sourceId))].sort();
        assert.deepEqual(refusedIds, census.skippedSubscriberIds);
        assert.equal(find('sorry-subscribers.json', '/response/0/phone_number').outcome, 'deleted');
        assert.equal(find('sorry-subscribers.json', '/response/0/first_name').outcome, 'raw-only');
        assert.ok(!JSON.stringify(fields).includes('synthetic-lamp-1@example.invalid'), 'ledger never copies subscriber values');
      } else assert.equal(find('sorry-components.json', '/components/4/metrics_summary/percentage_uptime/percent').outcome, 'raw-only');

      assert.deepEqual(await importedRecordInventory(runtime), before.native, 'preview writes no native record');
      assert.deepEqual(await publicAliasInventory(runtime), before.public, 'preview changes no public inventory');
      assert.deepEqual(await notificationInventory(runtime), before.notifications, 'preview sends and queues nothing');

      // A complete but unsupported resource must stop the entire input, name
      // the file, and leave native/public/notification inventories unchanged.
      for (const name of (await readdir(join(root, 'unsupported'))).filter(name => !/^sorry-(?:notice|update)-templates\.json$/.test(name))) {
        const refused = await move.preview({ ...input, files: [...files, { name, text: await readFile(join(root, 'unsupported', name), 'utf8') }] });
        assert.notEqual(refused.status, 200, 'unsupported resource cannot be ignored');
        assert.ok(JSON.stringify(refused.body).includes(name), 'refusal names the unsupported resource');
      }
      const hostile = structuredClone(files);
      const component = hostile.find(file => file.name === componentFile);
      const data = JSON.parse(component.text);
      (data.response ?? data.components)[4].future_metadata.operational_secret = 'synthetic-lamp-access-1';
      component.text = JSON.stringify(data);
      const refused = await move.preview({ ...input, files: hostile });
      assert.notEqual(refused.status, 200, 'unknown nested capabilities refuse the entire input');
      assert.ok(JSON.stringify(refused.body).includes('/4/future_metadata/operational_secret'), 'hostile refusal names the field path without its value');
      assert.deepEqual(await importedRecordInventory(runtime), before.native);
      assert.deepEqual(await publicAliasInventory(runtime), before.public);
      assert.deepEqual(await notificationInventory(runtime), before.notifications);

      if (mode === 'authenticated' && process.env.LAMP_SORRY_FULL_SCALE !== '1') {
        t.diagnostic('All 1003 authenticated subscriber rows and 23974 fields reviewed; full subscriber apply/repeat/undo runs in scripts/sorry-synthetic-proof.mjs outside push CI.');
        continue;
      }
      console.log('Synthetic Sorry ' + mode + ': apply');
      const applied = await move.apply(preview.body);
      assert.equal(applied.status, 200, JSON.stringify(applied.body));
      assert.equal(applied.body.job.state, 'completed');
      assert.deepEqual(applied.body.report.fieldLedger, fields, 'saved job carries the exact reviewed field ledger');
      const verification = await send('/api/app/statuspage-import/jobs/' + applied.body.job.id + '/verification');
      assert.equal(verification.status, 200, JSON.stringify(verification.body));
      assert.deepEqual(verification.body.fieldLedger, fields);
      assert.equal(verification.body.unexplainedDifferences, 0);
      assert.deepEqual(verification.body.nativeCounts, {
        group: census.nativeGroups, component: census.nativeComponents, incident: census.nativeIncidents,
        maintenance: census.nativeMaintenance, updates: census.sourceUpdates,
      });
      assert.deepEqual(await notificationInventory(runtime), before.notifications, 'apply and saved reads remain silent');
      const inventory = await importedRecordInventory(runtime);
      assert.equal(inventory.subscribers.length, mode === 'authenticated' ? census.eligibleHeldEmailSubscribers : 0);
      assert.ok(inventory.subscribers.every(row => row.state === 'deactivated'));
      const rawSummary = {
        mode, sourceRows: { components: census.sourceComponentRows, notices: census.sourceNotices, updates: census.sourceUpdates, subscribers: mode === 'authenticated' ? census.sourceSubscribers : 0 },
        nativeCounts: verification.body.nativeCounts, subscriberCount: inventory.subscribers.length,
        ledgerCount: fields.length, outcomes: Object.fromEntries(['mapped', 'changed', 'raw-only', 'deleted', 'refused'].map(outcome => [outcome, fields.filter(field => field.outcome === outcome).length])),
        unexplainedDifferences: verification.body.unexplainedDifferences,
        expectedResourceGaps: (await readdir(join(root, 'unsupported'))).filter(name => !/^sorry-(?:notice|update)-templates\.json$/.test(name)).sort(),
      };
      if (process.env.LAMP_SORRY_SYNTHETIC_PROOF) await writeFile(join(process.env.LAMP_SORRY_SYNTHETIC_PROOF, mode + '-field-ledger.json'), JSON.stringify({ schema: 1, fingerprint: report.fingerprint, fields }, null, 2) + '\n');
      console.log('Synthetic Sorry ' + mode + ': repeat');
      const repeated = await move.preview(input);
      assert.equal(repeated.status, 200, JSON.stringify(repeated.body));
      assert.equal(repeated.body.report.state, 'already imported');
      assert.deepEqual(repeated.body.report.fieldLedger, fields);
      const repeatedApply = await move.apply(repeated.body);
      assert.equal(repeatedApply.status, 200);
      assert.deepEqual(await importedRecordInventory(runtime), inventory, 'repeating source never duplicates native records');
      assert.deepEqual(await notificationInventory(runtime), before.notifications);
      console.log('Synthetic Sorry ' + mode + ': undo');
      const undone = await move.undo(applied.body.door);
      assert.equal(undone.status, 200, JSON.stringify(undone.body));
      assert.equal(undone.body.job.state, 'undone');
      assert.deepEqual(await importedRecordInventory(runtime), { ...before.native, reference_allocations: inventory.reference_allocations },
        'undo removes every imported native record; consumed public references remain reserved against reuse');
      assert.deepEqual(await publicAliasInventory(runtime), before.public, 'undo restores public aliases');
      assert.deepEqual(await notificationInventory(runtime), before.notifications);
      results.push({ ...rawSummary, previewUnchanged: true, hostileRefusalUnchanged: true, repeatUnchanged: true, undoRestoredExceptReservedReferences: true, silent: true });
      t.diagnostic(JSON.stringify(results.at(-1)));
    }
    await sorryTemplateImportFlow({ runtime, move, send, t });
    if (process.env.LAMP_SORRY_SYNTHETIC_PROOF) {
      const receipt = { schemaVersion: 1, type: 'lamp.sorry.synthetic-proof', synthetic: true, signed: false,
        sourceClassification: 'documentation-derived generated fixtures; not a real export',
        author: 'Run Edit Run fleet', completedAt: new Date().toISOString(),
        revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        generatorReproducible: true, results, initialInventoryCounts: Object.fromEntries(Object.entries(initial.native).map(([name, rows]) => [name, rows.length])) };
      await writeFile(join(process.env.LAMP_SORRY_SYNTHETIC_PROOF, 'synthetic-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
    }
  } finally { await runtime.close(); }
});
