import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { openStatusJourney } from './helpers/status-journey.mjs';
import { notificationActivity, assertNoNewNotifications, moveInDoor, importedRecordInventory, notificationInventory, publicAliasInventory } from '../helpers/import-notifications.mjs';
import { importedIncidentLiveFlow } from './helpers/imported-incident-live-flow.mjs';
import { incidentSubscriberFiles, incidentSubscriberImportFlow } from './helpers/incident-subscriber-import-flow.mjs';
import { postmortemTemplateImportFlow } from './helpers/postmortem-template-import-flow.mjs';
import { invitationFiles, importInvitationFlow, unsentExpiredImportFlow } from './helpers/import-invitation-flow.mjs';
import { historyCatchupFlow } from './helpers/history-catchup-flow.mjs';

const fixtures = source => readdirSync(`tests/fixtures/${source}/small`).map(name => ({ name, text: readFileSync(`tests/fixtures/${source}/small/${name}`, 'utf8') }));
const parsed = (files, name) => JSON.parse(files.find(file => file.name === name).text);
function sourceHistory(source, files) {
  if (source === 'statuspage') return parsed(files, 'incidents.json').map(row => ({ title: row.name, times: row.incident_updates.map(update => update.display_at) }));
  if (source === 'instatus') return parsed(files, 'instatus-incidents.json').map(row => ({ title: row.name, times: row.updates.map(update => update.started) }));
  return parsed(files, 'status-reports.json').data.filter(row => row.attributes.report_type !== 'maintenance').map(row => ({
    title: row.attributes.title,
    times: files.filter(file => file.name.startsWith(`status-updates-${row.id}`)).flatMap(file => JSON.parse(file.text).data.map(update => update.attributes.published_at)),
  }));
}

test('SUB-019 MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-009 MOVE-011 MOVE-012 MOVE-013 MOVE-014 SUB-023 ACCESS-001 — owner reviews provider history, imports silently, keeps public readers, invites deliberately and conditionally undoes', { timeout: 600_000 }, async t => {
  const sourceFiles = fixtures('statuspage'), apiKey = 'synthetic-owner-import-key';
  const requests = [], invitationControl = { uncertainRecipient: null };
  let incidentSubscriberProbe = false;
  const runtime = await openStatusJourney({ workerEntry: 'tests/e2e/helpers/import-invitation.worker.ts', providerEdge: async request => {
    const url = new URL(request.url);
    if (url.origin === 'https://api.resend.com' && invitationControl.uncertainRecipient) {
      const message = await request.clone().json();
      if (message.to.includes(invitationControl.uncertainRecipient)) {
        runtime.messages.push(message);
        runtime.mailReceipts.push({ id: 'synthetic-lamp-uncertain-invitation', idempotencyKey: request.headers.get('Idempotency-Key') });
        return Response.json({ message: 'Synthetic invitation acknowledgement interrupted' }, { status: 500 });
      }
    }
    if (url.origin !== 'https://api.statuspage.io') return;
    requests.push({ method: request.method, path: url.pathname, url: url.href, authorization: request.headers.get('authorization') });
    if (request.headers.get('authorization') !== `OAuth ${apiKey}`) return Response.json({}, { status: 401 });
    const incidentSubscribers = /^\/v1\/pages\/synthpage01\/incidents\/([^/]+)\/subscribers$/u.exec(url.pathname);
    const selectedFiles = incidentSubscriberProbe ? incidentSubscriberFiles(sourceFiles) : sourceFiles;
    if (incidentSubscribers) return new Response(selectedFiles.find(row => row.name === `incident-subscribers-${incidentSubscribers[1]}.json`)?.text ?? '[]', { headers: { 'Content-Type': 'application/json' } });
    const resource = url.pathname.replace('/v1/pages/synthpage01', '').replace(/^\//, '').replaceAll('_', '-').replace('/', '-');
    const page = Number(url.searchParams.get('page') ?? 1);
    const name = resource ? `${resource}${page > 1 ? `-${page}` : ''}.json` : 'page.json';
    return new Response(selectedFiles.find(file => file.name === name)?.text ?? '[]', { headers: { 'Content-Type': 'application/json' } });
  } });
  const origin = runtime.appOrigin, publicOrigin = runtime.publicOrigin;
  const fetch = (input, init) => runtime.raw(input, init);
  const nativeRequest = (path, { json, ...init } = {}) => runtime.request(path, { ...init, ...(json === undefined ? {} : { body: JSON.stringify(json) }) });
  try {
    const api = async (path, json, headers, method = json === undefined ? 'GET' : 'POST') => {
      const response = await nativeRequest(path, { method, ...(json === undefined ? {} : { json }), headers });
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    };
    const moveIn = moveInDoor(api);
    const counts = async () => {
      const rows = await Promise.all(['/api/app/components', '/api/app/incidents', '/api/app/maintenance', '/api/app/subscribers?limit=100'].map(path => api(path)));
      return { components: rows[0].body.components.length, groups: rows[0].body.groups.length, incidents: rows[1].body.incidents.length, maintenance: rows[2].body.maintenance.length, subscribers: rows[3].body.subscribers.length };
    };
    const apply = async input => {
      const review = await moveIn.preview(input); assert.equal(review.status, 200, JSON.stringify(review.body));
      const result = await moveIn.apply(review.body); assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(result.body.job.state, 'completed');
      return { review: review.body, result: result.body };
    };
    const repeatImport = async (input, result) => {
      const aliases = await publicAliasInventory(runtime);
      const records = await importedRecordInventory(runtime), notifications = await notificationInventory(runtime);
      const reviewed = await moveIn.preview(input);
      assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
      assert.equal(reviewed.body.report.state, 'already imported');
      const again = await moveIn.apply(reviewed.body);
      assert.equal(again.status, 200, JSON.stringify(again.body));
      assert.equal(again.body.job.id, result.job.id);
      assert.equal(again.body.job.state, 'completed', 'the repeated import stays completed');
      assert.deepEqual(await importedRecordInventory(runtime), records, 'repeat preserves every complete native record and its children');
      assert.deepEqual(await publicAliasInventory(runtime), aliases, 'repeat preserves the complete public alias inventory and redirects');
      assert.deepEqual(await notificationInventory(runtime), notifications, 'repeat creates or changes no delivery, attempt, post, invitation claim or captured transport');
      await runtime.tick(Date.now());
      assert.deepEqual(await notificationInventory(runtime), notifications, 'native scheduled processing after repeat creates no notification work');
      assert.deepEqual(await importedRecordInventory(runtime), records, 'scheduled processing preserves imported records and selections');
      t.diagnostic(`PROBE MOVE-003 1 ${input.source ?? 'statuspage'}: repeat saved review and apply, then native scheduled tick -> already imported, same job, complete native rows, aliases and notification inventory unchanged`);
    };
    assert.equal((await runtime.raw('/api/operator/import/uploads', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json', Origin: origin, 'X-Import-Source': 'statuspage' } })).status, 401);
    const fetched = await moveIn.preview({ pageId: 'synthpage01', apiKey });
    assert.equal(fetched.status, 200, JSON.stringify(fetched.body));
    assert.ok(requests.length && requests.every(row => row.method === 'GET' && row.authorization === `OAuth ${apiKey}`));
    assert.ok(!JSON.stringify(fetched.body).includes(apiKey), 'source authority is never returned in the saved plan');
    assert.equal((await moveIn.preview({ pageId: 'synthpage01', apiKey: 'wrong-source-key' })).status, 400);
    const privateFiles = fixtures('statuspage');
    privateFiles.find(file => file.name === 'page.json').text = readFileSync('tests/fixtures/statuspage/private/page.json', 'utf8');
    assert.equal((await moveIn.preview({ files: privateFiles })).status, 400, 'private source history cannot become public');
    const beforeSignout = await counts();
    assert.equal((await nativeRequest('/api/app/session/signout', { method: 'POST', json: {} })).status, 204);
    assert.equal((await moveIn.apply(fetched.body)).status, 401, 'a retained review grants no authority to a revoked session');
    await runtime.signIn(undefined, { fresh: true });
    assert.deepEqual(await counts(), beforeSignout);
    const native = await api('/api/app/components', { name: 'Owner-created service', description: '', groupId: null, internal: false, displayOrder: 0, note: '' });
    assert.equal(native.status, 201, JSON.stringify(native.body));
    assert.equal((await moveIn.apply(fetched.body)).status, 409, 'a page edited after review requires a fresh import review');
    assert.deepEqual(await counts(), { ...beforeSignout, components: beforeSignout.components + 1 });

    // Each row is the same owner migration, using one saved export per provider.
    // Assertions compare source records with native documents, rather than pinning fixture sizes.
    for (const source of ['statuspage', 'betterstack', 'instatus']) {
      const priorIds = new Set((await api('/api/app/subscribers?limit=100')).body.subscribers.map(row => row.id));
      // Finish the preceding source's explicit invitation expiry and native
      // publication work before measuring this independent silent import.
      await runtime.tick(Date.now());
      const files = invitationFiles(source, fixtures(source)), input = { source, files, pageId: 'synthpage01', publicAccessAcknowledged: true };
      const before = await counts(), quiet = await notificationActivity(runtime);
      const reviewed = await moveIn.preview(input); assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
      assert.deepEqual(await counts(), before, `${source} review writes nothing`);
      const changed = reviewed.body.fingerprint[0] === '0' ? '1' : '0';
      assert.equal((await moveIn.apply(reviewed.body, changed + reviewed.body.fingerprint.slice(1))).status, 409);
      assert.deepEqual(await counts(), before, 'unreviewed source bytes cannot apply');
      const { review, result } = await apply(input);
      assert.deepEqual(result.report.counts, review.report.counts);
      const after = await counts();
      for (const [kind, plural] of [['component', 'components'], ['group', 'groups'], ['incident', 'incidents'], ['maintenance', 'maintenance'], ['subscriber', 'subscribers']]) {
        assert.equal(after[plural] - before[plural], result.report.counts[kind].imported + result.report.counts[kind].changed, `${source} applies its complete reviewed ${kind} inventory`);
      }
      const incidents = (await api('/api/app/incidents')).body.incidents;
      for (const row of sourceHistory(source, files)) {
        const incident = incidents.find(candidate => candidate.title === row.title); assert.ok(incident, row.title);
        assert.deepEqual(incident.updates.map(update => Date.parse(update.publishedAt)).sort(), row.times.map(Date.parse).sort());
        assert.ok(incident.updates.every(update => update.isRetroactive));
        const page = await fetch(`${publicOrigin}/incidents/${incident.reference}`); assert.equal(page.status, 200);
        assert.ok((await page.text()).includes(incident.title), 'imported history is immediately readable without script');
      }
      const windows = (await api('/api/app/maintenance')).body.maintenance;
      assert.ok(windows.every(window => window.notices.length === 0), 'imported windows do not replay lifecycle notices');
      if (source === 'betterstack') {
        const window = windows.find(row => row.title.includes('maintenance')); assert.ok(window);
        const html = await (await fetch(`${publicOrigin}/maintenance/${window.reference}`)).text();
        const sourceWindow = parsed(files, 'status-reports.json').data.find(row => row.attributes.report_type === 'maintenance');
        const messages = files.filter(file => file.name.startsWith(`status-updates-${sourceWindow.id}`)).flatMap(file => JSON.parse(file.text).data);
        for (const message of messages) assert.ok(html.includes(message.attributes.message), 'maintenance history keeps every source message');
      }
      for (const row of result.report.cutover.rows) {
        const alias = await fetch(publicOrigin + row.path, { redirect: 'manual' }); assert.equal(alias.status, 301, row.path);
        assert.equal(alias.headers.get('location'), row.target);
        assert.equal((await fetch(publicOrigin + row.target)).status, 200);
        assert.equal((await fetch(origin + row.path, { redirect: 'manual' })).status, 404);
      }
      for (const feed of result.report.cutover.feeds) assert.equal(await (await fetch(publicOrigin + feed)).text(), await (await fetch(publicOrigin + '/feed.atom')).text());
      assert.equal((await fetch(publicOrigin + '/history.rss')).status, 200);
      assert.equal((await fetch(publicOrigin + '/api/v2/summary.json')).status, 200);
      await assertNoNewNotifications(runtime, quiet, 'review, apply and Cutover reads never mail historical incidents');
      await repeatImport(input, result);
      assert.deepEqual(await counts(), after, 'repeating the same source duplicates nothing');
      if (source === 'statuspage') {
        // Later saved bundles of this source name its owned records. Each is this
        // import's catch-up (ct ruling on MOVE-003): compared record by record with
        // the applied import, so no owned record is imported again. The owned
        // component also carries a new creation time, which would derive another
        // native id; a new control detects any partial write.
        const owned = parsed(files, 'components.json')[0], moved = { ...owned, name: 'Synthetic Lamp overlapping upstream record', created_at: '2026-01-03T00:00:00.000Z' };
        const control = { ...owned, id: 'synthetic-lamp-new-component', name: 'Synthetic Lamp new import control', position: 3 };
        const componentBundle = rows => files.map(file => ({ ...file,
          text: file.name === 'page.json' ? file.text : JSON.stringify(file.name === 'components.json' ? rows : []),
        }));
        const key = (kind, id) => JSON.stringify([kind, id]), native = (inventory, table, column, value) => inventory[table].filter(row => row[column] === value);
        const records = await importedRecordInventory(runtime), notifications = await notificationInventory(runtime), aliases = await publicAliasInventory(runtime);
        const overlap = await moveIn.preview({ source, files: componentBundle([moved, control]) });
        assert.equal(overlap.status, 200, JSON.stringify(overlap.body));
        assert.deepEqual([overlap.body.differences.conflicts, overlap.body.differences.additions], [[key('component', owned.id)], [key('component', control.id)]], 'the catch-up lists the owned record as a conflict and adds only the new one');
        assert.deepEqual(await importedRecordInventory(runtime), records, 'the catch-up review preserves all targets and creates no new control');
        assert.deepEqual(await notificationInventory(runtime), notifications, 'the catch-up review creates no notification work');
        assert.deepEqual(await publicAliasInventory(runtime), aliases, 'the catch-up review preserves public redirects');
        // A newer export of the whole page: unchanged records, one incident
        // corrected at source, the owned component with its new creation time, a new one.
        const sourceIncidents = parsed(files, 'incidents.json'), corrected = { ...sourceIncidents[1], name: `${sourceIncidents[1].name} (corrected at source)` };
        const newer = files.map(file => ({ ...file, text: file.name === 'components.json' ? JSON.stringify([moved, ...parsed(files, 'components.json').slice(1), control])
          : file.name === 'incidents.json' ? JSON.stringify(sourceIncidents.map(row => row.id === corrected.id ? corrected : row)) : file.text }));
        const caught = await moveIn.preview({ source, files: newer });
        assert.equal(caught.status, 200, JSON.stringify(caught.body));
        const { differences } = caught.body;
        assert.deepEqual([differences.conflicts, differences.additions], [[key('component', owned.id)], [key('component', control.id)]]);
        assert.ok(differences.replacements.includes(key('incident', corrected.id)), 'the record corrected at source is replaced');
        assert.deepEqual(differences.unchanged.toSorted(), [...parsed(files, 'components.json').slice(1).map(row => key('component', row.id)), ...sourceIncidents.filter(row => row.id !== corrected.id).map(row => key('incident', row.id)),
          ...parsed(files, 'subscribers.json').map(row => key('subscriber', row.id))].toSorted(), 'every other owned record is unchanged');
        assert.deepEqual(await importedRecordInventory(runtime), records, 'the catch-up review writes nothing');
        const applied = await moveIn.apply(caught.body);
        assert.equal(applied.status, 200, JSON.stringify(applied.body));
        assert.equal(applied.body.job.state, 'completed');
        const current = await importedRecordInventory(runtime), [prior] = native(records, 'incidents', 'title', sourceIncidents[1].name);
        for (const { name } of parsed(files, 'components.json')) assert.deepEqual(native(current, 'components', 'name', name), native(records, 'components', 'name', name), `${name}: one native record, unchanged by the catch-up`);
        for (const table of ['subscribers', 'subscriber_components']) assert.deepEqual(current[table], records[table], `unchanged ${table} stay`);
        const unchangedIncident = native(records, 'incidents', 'title', sourceIncidents[0].name)[0];
        assert.deepEqual([native(current, 'incidents', 'id', unchangedIncident.id), native(current, 'incident_updates', 'incident_id', unchangedIncident.id)], [[unchangedIncident], native(records, 'incident_updates', 'incident_id', unchangedIncident.id)], 'the unchanged incident stays');
        assert.deepEqual(native(current, 'incidents', 'id', prior.id).map(row => [row.title, row.reference]), [[corrected.name, prior.reference]], 'the corrected incident is replaced in place, keeping its id and public reference');
        assert.equal(current.incidents.length, records.incidents.length, 'no owned incident is imported again');
        assert.equal(native(current, 'components', 'name', control.name).length, 1, 'the new record is added once');
        assert.equal(current.components.length, records.components.length + 1);
        assert.deepEqual(await notificationInventory(runtime), notifications, 'the catch-up creates no notification work');
        assert.deepEqual(await publicAliasInventory(runtime), aliases, 'the catch-up keeps every public alias and redirect');
        await runtime.tick(Date.now());
        assert.deepEqual(await notificationInventory(runtime), notifications, 'native scheduled processing after the catch-up creates no notification work');
        await repeatImport({ source, files: newer }, applied.body);
        assert.ok((await (await fetch(`${publicOrigin}/incidents/${prior.reference}`)).text()).includes(corrected.name), 'the public page shows the replaced record at its old address');
        const undoneCatchup = await moveIn.undo(applied.body.door);
        assert.equal(undoneCatchup.status, 200, JSON.stringify(undoneCatchup.body));
        assert.deepEqual(await importedRecordInventory(runtime), records, 'undo of the catch-up restores the prior imported inventory');
        const newOnly = await apply({ source, files: componentBundle([control]) });
        const components = (await api('/api/app/components')).body.components;
        assert.equal(components.filter(row => row.name === owned.name).length, 1, 'the original upstream identity still has one unchanged native record');
        assert.equal(components.filter(row => row.name === control.name).length, 1, 'a separately reviewed new-only bundle can apply');
        assert.equal(components.some(row => row.name === 'Synthetic Lamp overlapping upstream record'), false);
        await repeatImport({ source, files: componentBundle([control]) }, newOnly.result);
        const undoneControl = await moveIn.undo(newOnly.result.door);
        assert.equal(undoneControl.status, 200, JSON.stringify(undoneControl.body));
        assert.deepEqual(await importedRecordInventory(runtime), records, 'undo of the new-only import preserves the existing imported inventory');
        // A provider-local id and equal title in another namespace are distinct.
        const alternateFiles = fixtures('instatus').filter(file => /^instatus-(pages|components|incidents|maintenances|subscribers|audience-groups)\.json$/u.test(file.name)).map(file => ({
          ...file, text: file.name === 'instatus-pages.json' ? file.text : JSON.stringify(file.name === 'instatus-components.json'
            ? [{ id: owned.id, name: owned.name, status: 'OPERATIONAL', order: 0, createdAt: owned.created_at }] : []),
        }));
        const alternateInput = { source: 'instatus', pageId: 'synthpage01', publicAccessAcknowledged: true, files: alternateFiles };
        const alternate = await apply(alternateInput);
        const priorIds = new Set(records.components.map(row => row.id));
        const added = (await api('/api/app/components')).body.components.filter(row => !priorIds.has(row.id));
        assert.equal(added.length, 1, 'another provider namespace imports its own explicit identity');
        assert.equal(added[0].name, owned.name, 'equal titles do not merge independent upstream records');
        await repeatImport(alternateInput, alternate.result);
        assert.equal((await moveIn.undo(alternate.result.door)).status, 200);
        assert.deepEqual(await importedRecordInventory(runtime), records, 'removing the other namespace preserves the original identity');
        t.diagnostic('PROBE MOVE-003 2: later Statuspage bundles naming owned records -> planned and applied as the catch-up: owned record with a new creation time listed as a conflict, unchanged records kept, corrected record replaced in place, one new component, silent, repeat stable, undo restores; reviewed new-only bundle -> one new component; other namespace stays distinct');
      }
      const edited = incidents.find(row => row.title === sourceHistory(source, files)[0].title);
      const draft = await api(`/api/app/incidents/${edited.id}/draft`, { lifecycle: 'Resolved', affectedAudience: 'API customers', customerImpact: 'Owner correction after import', whatStillWorks: 'All services', details: 'Owner-reviewed history', nextUpdateAt: null }, { 'If-Match': `-:${edited.updates.length}` }, 'PUT');
      assert.equal(draft.status, 200, JSON.stringify(draft.body));
      const published = await api(`/api/app/incidents/${edited.id}/publish`, { channels: [] }, { 'If-Match': `${draft.body.draft.id}:${edited.updates.length}` });
      assert.equal(published.status, 200, JSON.stringify(published.body));
      await importInvitationFlow({ runtime, api, source, result, priorIds, control: invitationControl });
      const undone = await moveIn.undo(result.door); assert.equal(undone.status, 200, JSON.stringify(undone.body));
      assert.equal(undone.body.job.state, 'undone');
      assert.ok(undone.body.undo.dispositions.some(row => row.targetKind === 'incident' && row.disposition === 'retained' && row.reason));
      const retained = (await api('/api/app/incidents')).body.incidents;
      assert.ok(retained.some(row => row.id === edited.id && row.updates.some(update => update.customerImpact === 'Owner correction after import')));
      assert.equal(retained.length, before.incidents + 1, 'untouched source history is removed while the owner correction survives');
      await unsentExpiredImportFlow({ runtime, api, moveIn, source, files });
    }
    // Published reports, private reports and reusable templates travel with a source,
    // remain private until publication, and retain operator edits through undo.
    const importAll = async files => {
      const { review, result } = await apply({ files });
      await repeatImport({ files }, result);
      return { preview: review, result };
    };
    await postmortemTemplateImportFlow({ api, request: (path, init) => nativeRequest(path, init), importAll, moveIn, original: sourceFiles, publicOrigin, preserveEdits: true, fetcher: fetch });
    const beforeIncidentFollowers = await counts();
    incidentSubscriberProbe = true;
    const requestOffset = requests.length;
    try {
      const fetched = await api('/api/app/statuspage-import/fetch', { source: 'statuspage', pageId: 'synthpage01', apiKey });
      assert.equal(fetched.status, 200, JSON.stringify(fetched.body));
      const file = fetched.body.files.find(row => row.name === 'incident-subscribers-followinc001.json');
      assert.equal(JSON.parse(file.text).length, 3, 'the fixed-origin reader retains every unresolved incident follower response');
      const reads = requests.slice(requestOffset).filter(row => new URL(row.url).pathname.endsWith('/subscribers'));
      const incidentReads = reads.filter(row => row.path.includes('/incidents/'));
      assert.equal(incidentReads.length, 1, 'only the unresolved incident follower endpoint is read');
      assert.ok(incidentReads.every(row => new URL(row.url).searchParams.get('per_page') === '100'), 'incident follower reads use documented pagination');
      assert.ok(reads.every(row => row.method === 'GET' && row.authorization === `OAuth ${apiKey}`));
    } finally { incidentSubscriberProbe = false; }
    await incidentSubscriberImportFlow({ t, runtime, api, moveIn, importAll, original: sourceFiles, origin, publicOrigin });
    assert.deepEqual(await counts(), beforeIncidentFollowers, 'incident follower undo leaves the prior installation intact');
    await importedIncidentLiveFlow(sourceFiles);
    assert.deepEqual(await counts(), beforeIncidentFollowers, 'the separate live import proof leaves the undo installation intact');
    // RL-6: the full Move in after setup's incident history is that import's catch-up.
    await historyCatchupFlow({ t, runtime, api, moveIn, repeatImport, original: sourceFiles });

  } finally { await runtime.close(); }
});
