import { submitPublicSubscription } from "./helpers/public-subscribe-request.mjs";
import { completeRoute } from './helpers/complete-route.mjs';
import { incidentSnapshot } from '../helpers/incident-snapshot.mjs';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { openStatusJourney, eventually, visibleText } from './helpers/status-journey.mjs';
import { Miniflare, retainedSnapshotOptions } from './helpers/retained-snapshot-runtime.mjs';
import { notificationActivity, assertNoNewNotifications, assertNoNewNotificationWork, moveInDoor, importedRecordInventory, notificationInventory, undoNotificationInventory, publicAliasInventory } from '../helpers/import-notifications.mjs';
import { importedIncidentLiveFlow } from './helpers/imported-incident-live-flow.mjs';
import { incidentSubscriberFiles, incidentSubscriberImportFlow } from './helpers/incident-subscriber-import-flow.mjs';
import { postmortemTemplateImportFlow } from './helpers/postmortem-template-import-flow.mjs';
import { invitationFiles, importInvitationFlow, unsentExpiredImportFlow } from './helpers/import-invitation-flow.mjs';
import { subscriberMoveInCapacityFlow } from './helpers/subscriber-limits-flow.mjs';
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

function enrichStatuspageCapture(files) {
  const components = parsed(files, 'components.json');
  const [selected] = components;
  selected.only_show_if_degraded = true;
  components.push({
    id: 'synthetic-lamp-history-control', name: 'Unaffected history control', position: 3,
    page_id: selected.page_id, created_at: '2026-01-04T12:34:56.789Z', status: 'operational',
  });
  files.find(file => file.name === 'components.json').text = JSON.stringify(components);

  const incidents = parsed(files, 'incidents.json');
  const [incident, continuityIncident] = incidents;
  const [opened, resolved] = incident.incident_updates;
  // The published instants precede the source write times, even at resolution.
  opened.display_at = '2026-01-11T08:54:03.201Z';
  resolved.display_at = '2026-01-11T10:27:19.405Z';
  incident.resolved_at = resolved.display_at;
  resolved.affected_components[0].old_status = 'degraded_performance';
  incident.incident_updates = [
    opened,
    {
      id: 'synthetic-lamp-history-monitoring', incident_id: incident.id, status: 'monitoring',
      body: 'API recovery is under observation as errors subside.',
      created_at: '2026-01-11T10:06:43.000Z', display_at: '2026-01-11T10:02:41.302Z',
      affected_components: [{ code: selected.id, name: selected.name, old_status: 'partial_outage', new_status: 'degraded_performance' }],
    },
    resolved,
  ];
  // Keep the continuity incident well inside the rolling Atom window while
  // preserving the source's intervals and the first incident's exact dates.
  const offset = Date.now() - 30 * 86_400_000 - Date.parse(continuityIncident.created_at);
  const shift = instant => new Date(Date.parse(instant) + offset).toISOString();
  for (const key of ['created_at', 'updated_at', 'resolved_at']) {
    continuityIncident[key] = shift(continuityIncident[key]);
  }
  for (const update of continuityIncident.incident_updates) {
    for (const key of ['created_at', 'display_at', 'updated_at']) update[key] = shift(update[key]);
  }
  files.find(file => file.name === 'incidents.json').text = JSON.stringify(incidents);
  return continuityIncident;
}

async function assertRetainedStatuspageIncident(journey, source, incidents, t) {
  const incident = incidents.find(row => row.title === source.name);
  assert.ok(incident, 'the imported incident has a native identity');
  const oldPath = `/incidents/${source.id}`;
  const nativePath = `/incidents/${incident.reference}`;
  const importedWording = source.incident_updates.at(-1).body;
  const sourceBucket = await journey.runtime.getR2Bucket('SNAPSHOTS');
  const { pointer, pointerBytes } = await eventually(async () => {
    const work = await journey.db.prepare('SELECT requested_revision, completed_revision FROM public_snapshot_work').first();
    const building = await journey.db.prepare("SELECT id FROM snapshot_builds WHERE status = 'building'").first();
    if (building || work.requested_revision !== work.completed_revision) return null;
    const current = await sourceBucket.get('snapshots/current.json');
    if (!current) return null;
    const pointerBytes = await current.arrayBuffer();
    const pointer = JSON.parse(Buffer.from(pointerBytes).toString());
    return pointer.sourceRevision === work.completed_revision ? { pointer, pointerBytes } : null;
  }, Boolean, 'the reviewed import has a settled public generation');

  const paths = new Map([
    [oldPath, `aliases/${encodeURIComponent(oldPath)}.json`],
    [nativePath, `incidents/${incident.reference}.html`],
    ['/history.atom', 'history.atom'],
    ['/feed.atom', 'feed.atom'],
  ]);
  const runtime = new Miniflare(await retainedSnapshotOptions({ name: 'lamp-retained-import' }));
  try {
    const bucket = await runtime.getR2Bucket('SNAPSHOTS');
    const generationRoot = `snapshots/${pointer.version}/`;
    const stored = new Map();
    for (const artifact of [...paths.values(), 'retained.json']) {
      const key = generationRoot + artifact;
      const object = await sourceBucket.get(key);
      assert.ok(object, `import generation contains ${artifact}`);
      const bytes = await object.arrayBuffer();
      await bucket.put(key, bytes, { httpMetadata: object.httpMetadata });
      stored.set(artifact, Buffer.from(bytes));
    }
    await bucket.put('snapshots/current.json', pointerBytes, { httpMetadata: { contentType: 'application/json' } });

    const read = (path) => runtime.dispatchFetch(`https://page.example${path}`, { redirect: 'manual' });
    const evidence = async (path) => {
      const response = await read(path);
      assert.equal(response.status, 200, path);
      return response.json();
    };
    const cacheQuery = new URLSearchParams([...paths.keys()].map(path => ['path', path]));
    assert.deepEqual(await evidence(`/test/snapshot-cache?${cacheQuery}`), { replicaGeneration: null, cachedPaths: [] });
    assert.deepEqual((await evidence('/test/blob-reads')).getBytes, {}, 'no public artifact has been loaded');

    const readGeneration = async (path, status) => {
      const response = await read(path);
      assert.equal(response.status, status, path);
      assert.equal(response.headers.get('x-lamp-snapshot-version'), pointer.version, path);
      assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), pointer.generatedAt, path);
      assert.equal(response.headers.get('x-lamp-snapshot-state'), null, path);
      return response;
    };
    const redirect = await readGeneration(oldPath, 301);
    assert.equal(redirect.headers.get('location'), nativePath);
    const destination = await readGeneration(redirect.headers.get('location'), 200);
    const wording = visibleText(await destination.text());
    assert.ok(wording.includes(source.name) && wording.includes(importedWording), 'the redirect reaches the imported title and update');

    const feeds = new Map();
    for (const path of ['/history.atom', '/feed.atom']) {
      const response = await readGeneration(path, 200);
      assert.match(response.headers.get('content-type'), /^application\/atom\+xml\b/);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.deepEqual(bytes, stored.get(paths.get(path)), `${path} serves the exact published Atom bytes`);
      feeds.set(path, bytes);
    }
    assert.deepEqual(feeds.get('/history.atom'), feeds.get('/feed.atom'), 'old and native Atom addresses are byte-identical');
    const entries = feeds.get('/feed.atom').toString().match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    assert.ok(entries.some(entry => entry.includes(`<title>${incident.reference}: ${source.name}</title>`)
      && entry.includes(`href="${journey.publicOrigin}${nativePath}"`)
      && entry.includes(importedWording)), 'an Atom entry identifies this incident, links to its permalink and carries the imported update');

    const { getBytes } = await evidence('/test/blob-reads');
    for (const key of paths.values()) assert.equal(getBytes[generationRoot + key], 1, key);
    const { accesses } = await evidence('/test/database-touches');
    assert.equal(accesses, 0, 'cold import continuity does not ask the repository');
    t.diagnostic(`PROBE MOVE-005 4: GET ${oldPath} -> 301 ${nativePath}; GET ${nativePath} -> 200 with "${source.name}" and "${importedWording}"; both Atom routes -> 200 with ${feeds.get('/feed.atom').length} identical published bytes and the incident entry; snapshot ${pointer.version}, generated ${pointer.generatedAt}, cold cache, ${accesses} database touches`);
  } finally { await runtime.dispose(); }
}

async function reconcileComponentHistory(api, component, expected) {
  const rows = [], cursors = new Set();
  const limit = 2;
  let cursor = null;
  do {
    const query = new URLSearchParams({ limit });
    if (cursor !== null) query.set('cursor', cursor);
    const page = await api(`/api/app/components/${component.id}/history?${query}`);
    assert.equal(page.status, 200, JSON.stringify(page.body));
    assert.equal(page.body.historyPage.limit, limit);
    assert.equal(page.body.history.length, Math.min(limit, expected.length - rows.length), 'the history page contains its expected rows');
    rows.push(...page.body.history);
    cursor = page.body.historyPage.nextCursor;
    if (cursor !== null) {
      assert.ok(rows.length < expected.length && !cursors.has(cursor), 'the history cursor advances towards the final expected row');
      cursors.add(cursor);
    }
  } while (cursor !== null);
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length, 'each transition has one native history identity');
  assert.deepEqual(rows.map(({ previousState, newState, changedAt, causeType, causeId }) => ({
    previousState, newState, changedAt, causeType, causeId,
  })), expected, `${component.name}: complete newest-first native history`);
}

async function assertStatuspageComponentHistory(api, files, components, incidents) {
  const sourceComponents = parsed(files, 'components.json');
  const sourceIncident = parsed(files, 'incidents.json').find(row => row.id === 'i0000000001');
  assert.ok(sourceIncident, 'the selected source incident is in the reviewed capture');
  const updates = sourceIncident.incident_updates;
  const affectedCodes = updates.flatMap(update => update.affected_components.map(row => row.code));
  const selected = sourceComponents.find(row => row.id === affectedCodes[0]);
  const control = sourceComponents.find(row => row.id === 'synthetic-lamp-history-control');
  assert.ok(selected && control && selected.id !== control.id);
  assert.deepEqual(affectedCodes, [selected.id, selected.id, selected.id], 'only the selected source component changes through resolution');
  assert.ok(updates.every(update => update.incident_id === sourceIncident.id
    && Date.parse(update.display_at) < Date.parse(update.created_at)), 'the reviewed publication instants are distinct from source write times');
  assert.equal(new Set(updates.map(update => Date.parse(update.display_at))).size, updates.length);
  assert.ok(parsed(files, 'incidents.json').every(row => row.incident_updates.every(update =>
    !(update.affected_components ?? []).some(affected => affected.code === control.id))), 'the control is unaffected across the saved capture');

  const match = (rows, field, sourceName) => {
    const matches = rows.filter(row => row[field] === sourceName);
    assert.equal(matches.length, 1, `${sourceName}: exactly one matching native record`);
    assert.ok(matches[0].id, `${sourceName}: the native record has an identity`);
    return matches[0];
  };
  const nativeSelected = match(components, 'name', selected.name);
  const nativeControl = match(components, 'name', control.name);
  const incident = match(incidents, 'title', sourceIncident.name);
  assert.notEqual(nativeSelected.id, nativeControl.id);
  assert.equal(incident.lifecycle, 'Resolved');
  assert.deepEqual(incident.components.map(row => row.componentId), [nativeSelected.id]);
  assert.deepEqual(incident.updates.toSorted((a, b) => a.publishedAt.localeCompare(b.publishedAt))
    .map(({ customerImpact, publishedAt, lifecycle, isRetroactive }) => ({ customerImpact, publishedAt, lifecycle, isRetroactive })),
  updates.map((update, index) => ({
    customerImpact: update.body, publishedAt: update.display_at,
    lifecycle: ['Investigating', 'Monitoring', 'Resolved'][index], isRetroactive: true,
  })), 'the independently matched incident retains each original message and publication instant');

  const standing = source => ({
    previousState: 'Operational', newState: 'Operational', changedAt: source.created_at,
    causeType: 'standing-claim', causeId: null,
  });
  const transition = (update, previousState, newState) => ({
    previousState, newState, changedAt: update.display_at, causeType: 'incident', causeId: incident.id,
  });
  await reconcileComponentHistory(api, nativeSelected, [
    transition(updates[2], 'Degraded performance', 'Operational'),
    transition(updates[1], 'Partially unavailable', 'Degraded performance'),
    transition(updates[0], 'Operational', 'Partially unavailable'),
    standing(selected),
  ]);
  await reconcileComponentHistory(api, nativeControl, [standing(control)]);
}

test('SUB-019 MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-009 MOVE-011 MOVE-012 MOVE-013 MOVE-014 SUB-023 ACCESS-001 — owner reviews provider history, imports silently, keeps public readers, invites deliberately and conditionally undoes', { timeout: 600_000 }, async t => {
  await subscriberMoveInCapacityFlow(t);
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
      const rows = await Promise.all([api('/api/app/components'), incidentSnapshot(api), api('/api/app/maintenance'), api('/api/app/subscribers?limit=100')]);
      return { components: rows[0].body.components.length, groups: rows[0].body.groups.length, incidents: rows[1].length, maintenance: rows[2].body.maintenance.length, subscribers: rows[3].body.subscribers.length };
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

    const nativeComponent = native.body.component;
    const nativeIncident = await runtime.incident('Owner investigation kept in draft', [nativeComponent]);
    const { draft: nativeDraft } = await runtime.save(nativeIncident.id, { customerImpact: 'Owner wording kept private.' });
    const nativeAddress = ['synthetic-lamp-preview', 'example.test'].join('@');
    const subscription = await submitPublicSubscription(fetch, publicOrigin + '/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: publicOrigin, Accept: 'text/html' },
      body: new URLSearchParams({ email: nativeAddress, componentId: nativeComponent.id }).toString(),
    });
    assert.equal(subscription.status, 202, await subscription.text());
    const nativeConfirmation = await eventually(
      () => runtime.messages.find(message => message.to.includes(nativeAddress) && message.text.includes('/confirm-subscription/')),
      Boolean, 'the native subscription sends a confirmation before the review',
    );

    // Each row is the same owner migration, using one saved export per provider.
    // Assertions compare source records with native documents, rather than pinning fixture sizes.
    for (const source of ['statuspage', 'betterstack', 'instatus']) {
      const priorIds = new Set((await api('/api/app/subscribers?limit=100')).body.subscribers.map(row => row.id));
      // Finish the preceding source's explicit invitation expiry and native
      // publication work before measuring this independent silent import.
      await runtime.tick(Date.now());
      const files = invitationFiles(source, fixtures(source)), input = { source, files, pageId: 'synthpage01', publicAccessAcknowledged: true };
      const continuityIncident = source === 'statuspage' ? enrichStatuspageCapture(files) : null;
      const before = await counts(), quiet = await notificationActivity(runtime);
      const firstStatuspageReview = source === 'statuspage';
      const recordsBeforeReview = firstStatuspageReview ? await importedRecordInventory(runtime) : null;
      const outboundBeforeReview = firstStatuspageReview ? await undoNotificationInventory(runtime) : null;
      if (firstStatuspageReview) {
        assert.ok(recordsBeforeReview.components.some(row => row.id === nativeComponent.id));
        assert.ok(recordsBeforeReview.incidents.some(row => row.id === nativeIncident.id));
        assert.ok(recordsBeforeReview.incident_drafts.some(row => row.id === nativeDraft.id));
        const nativeSubscriber = recordsBeforeReview.subscribers.find(row => row.destination === nativeAddress);
        assert.ok(nativeSubscriber, 'the pending native subscriber is present in the record baseline');
        assert.ok(outboundBeforeReview.tables.subscriber_tokens.some(row => row.subscriber_id === nativeSubscriber.id));
        assert.ok(outboundBeforeReview.transports.messages.some(message => message.text === nativeConfirmation.text));
      }
      const reviewed = await moveIn.preview(input); assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
      assert.deepEqual(await counts(), before, `${source} review writes nothing`);
      if (firstStatuspageReview) {
        const { planId, fingerprint, report } = reviewed.body;
        assert.ok(planId && fingerprint, 'the saved responses produce a review the owner can apply');
        assert.equal(report.state, 'dry run', 'the saved responses have never been applied');
        assert.ok(report.counts.component.imported > 0, 'the review includes actual importable components');
        const savedPlan = await runtime.db.prepare('SELECT complete, fingerprint, job_id FROM ik_door_plans WHERE id=?').bind(planId).first();
        assert.deepEqual(savedPlan, { complete: 1, fingerprint, job_id: null }, 'review retains a complete plan without creating an apply job');
        assert.deepEqual(await importedRecordInventory(runtime), recordsBeforeReview, 'the first saved Statuspage review preserves every complete native record');
        assert.deepEqual(await undoNotificationInventory(runtime), outboundBeforeReview, 'the first saved Statuspage review preserves all outbound rows and captured transports');
        t.diagnostic('PROBE MOVE-001 2: first saved Statuspage review on a populated native install -> importable plan retained without an apply job; complete native rows and outbound work unchanged');
      }
      const changed = reviewed.body.fingerprint[0] === '0' ? '1' : '0';
      assert.equal((await moveIn.apply(reviewed.body, changed + reviewed.body.fingerprint.slice(1))).status, 409);
      assert.deepEqual(await counts(), before, 'unreviewed source bytes cannot apply');
      const { review, result } = await apply(input);
      if (firstStatuspageReview) {
        assert.equal(review.planId, reviewed.body.planId, 'explicit apply uses the same saved Statuspage plan');
        assert.equal(review.fingerprint, reviewed.body.fingerprint, 'explicit apply uses the reviewed fingerprint');
        assert.equal(result.door.planId, reviewed.body.planId, 'the completed job belongs to the reviewed plan');
      }
      assert.deepEqual(result.report.counts, review.report.counts);
      const after = await counts();
      for (const [kind, plural] of [['component', 'components'], ['group', 'groups'], ['incident', 'incidents'], ['maintenance', 'maintenance'], ['subscriber', 'subscribers']]) {
        assert.equal(after[plural] - before[plural], result.report.counts[kind].imported + result.report.counts[kind].changed, `${source} applies its complete reviewed ${kind} inventory`);
      }
      const incidents = await incidentSnapshot(api);
      if (source === 'statuspage') {
        const sourceComponents = parsed(files, 'components.json');
        const componentList = await api('/api/app/components');
        assert.equal(componentList.status, 200, JSON.stringify(componentList.body));
        const imported = componentList.body.components;
        await assertStatuspageComponentHistory(api, files, imported, incidents);
        await assertRetainedStatuspageIncident(runtime, continuityIncident, incidents, t);
        t.diagnostic('PROBE MOVE-002 1: reviewed Statuspage capture and native component history at two entries per page -> exact incident transitions at original publication instants, and only the creation baseline for the unaffected control');
        const conditional = imported.find(row => row.name === sourceComponents[0].name);
        const visible = imported.find(row => row.name === sourceComponents[1].name);
        assert.ok(conditional && visible, 'both reviewed source components are independently readable after import');
        assert.equal(conditional.onlyShowIfDegraded, true, 'reviewed import preserves a true conditional flag');
        assert.equal(visible.onlyShowIfDegraded, false, 'reviewed import preserves the false flag control');
        assert.equal(conditional.publicState, 'Operational');
        const componentLists = await eventually(async () => Promise.all(['/api/v2/components.json', '/api/v2/summary.json'].map(async path => {
          const response = await fetch(publicOrigin + path);
          assert.equal(response.status, 200);
          return (await response.json()).components;
        })), lists => lists.every(rows => !rows.some(row => row.name === conditional.name) && rows.some(row => row.name === visible.name)), 'operational imported conditional component is omitted from Statuspage-compatible lists');
        for (const rows of componentLists) {
          assert.equal(rows.find(row => row.name === visible.name).only_show_if_degraded, false, 'the visible control explicitly exposes its compatible conditional flag');
          assert.ok(!rows.some(row => row.name === conditional.name), 'a preserved true flag hides its Operational component');
        }
        // Execute the retained provider program unchanged. Only its network
        // transport is bridged to this migrated Worker's public host.
        const browser = await chromium.launch({ executablePath: process.env.LAMP_CHROMIUM_PATH, headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
        try {
          const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
          const reads = [];
          await context.route(`${publicOrigin}/**`, async route => {
            if (new URL(route.request().url()).pathname === '/synthetic-lamp-client.js') return route.fulfill({ contentType: 'application/javascript', body: readFileSync('tests/fixtures/statuspage-public/se-v2.js', 'utf8') });
            const response = await fetch(route.request().url());
            reads.push(new URL(route.request().url()).pathname);
            const body = Buffer.from(await response.arrayBuffer());
            await completeRoute(() => route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body }));
          });
          const page = await context.newPage();
          await page.goto(publicOrigin + '/');
          await page.addScriptTag({ url: publicOrigin + '/synthetic-lamp-client.js' });
          const summary = await page.evaluate(() => new Promise((resolve, reject) => {
            const client = new StatusPage.page({ page: 'synthetic-lamp-1', test: true });
            client.summary({ success: resolve, error: () => reject(new Error('Statuspage client could not read the moved summary')) });
          }));
          assert.ok(reads.includes('/api/v2/summary.json'), 'the unmodified client requests the moved summary endpoint');
          assert.equal(summary.page.url, publicOrigin);
          assert.deepEqual(summary.status, { indicator: 'none', description: 'All Systems Operational' });
          assert.deepEqual(summary.components.filter(row => ['Public API', 'Dashboard'].includes(row.name)).map(row => ({ name: row.name, status: row.status, only_show_if_degraded: row.only_show_if_degraded })), [
            { name: 'Dashboard', status: 'operational', only_show_if_degraded: false },
          ], 'the retained client parses the imported visible component and omits the degraded-only Operational component');
          assert.deepEqual(summary.incidents, [], 'resolved imported history is not presented as an unresolved incident');
          assert.ok(Array.isArray(summary.scheduled_maintenances));
          await context.close();
        } finally { await browser.close(); }
        for (const report of [review.report.cutover, result.report.cutover, (await moveIn.read(result.job.id)).body.report.cutover]) {
          assert.deepEqual(report.feeds, ['/history.atom']);
          const readers = report.readerGaps.join(' ');
          for (const served of [/Statuspage \/api\/v2\/ read endpoints.*are served/, /\/history\.rss.*are served/, /\/history\.atom.*are served/, /\/embed\/script\.js tags serve Lamp’s floating notice on the moved hostname/]) assert.match(readers, served);
          for (const unavailable of [/Per-window switches and Verifying are unavailable/, /Webhook body compatibility and component automation email addresses remain unavailable/]) assert.match(readers, unavailable);
        }
        const rss = await (await fetch(publicOrigin + '/history.rss')).text();
        assert.equal(rss, await (await fetch(publicOrigin + '/feed.rss')).text(), 'the old RSS address serves the native RSS feed');
        assert.match(rss, /<rss\b/);
        for (const incident of parsed(files, 'incidents.json')) assert.ok(rss.includes(incident.name), 'the old RSS reader retains imported incident history');
        t.diagnostic('PROBE MOVE-009 1: retained Statuspage client after native import -> moved summary parsed with Dashboard Operational and the conditional Operational component omitted; Atom continuity and RSS remain asserted');
        t.diagnostic('PROBE MOVE-009 2: dry run, apply and saved Cutover -> API, RSS, Atom and embed served; maintenance switches, Verifying, webhook bodies and automation addresses explicitly unavailable');
      }
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
      const invitationDeadline = await importInvitationFlow({ runtime, api, source, result, priorIds, control: invitationControl });
      const beforeUndo = await undoNotificationInventory(runtime);
      const undone = await moveIn.undo(result.door); assert.equal(undone.status, 200, JSON.stringify(undone.body));
      assert.equal(undone.body.job.state, 'undone');
      await assertNoNewNotificationWork(runtime, beforeUndo, `${source} conditional undo`);
      await runtime.tick(invitationDeadline);
      await assertNoNewNotificationWork(runtime, beforeUndo, `${source} scheduled drain after conditional undo`);
      t.diagnostic(`PROBE MOVE-004 3 ${source}: native conditional undo and scheduled drain -> no new notification work or attempt identities, captured transports unchanged`);
      assert.ok(undone.body.undo.dispositions.some(row => row.targetKind === 'incident' && row.disposition === 'retained' && row.reason));
      const retained = await incidentSnapshot(api);
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
    await postmortemTemplateImportFlow({ api, request: (path, init) => nativeRequest(path, init), importAll, moveIn, original: sourceFiles, publicOrigin, runtime, t, preserveEdits: true, fetcher: fetch });
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

test('MAINT-015 — imported maintenance messages retain their own source lifecycle labels', { timeout: 120_000 }, async t => {
  const runtime = await openStatusJourney();
  try {
    const api = async (path, body, headers, method = body === undefined ? 'GET' : 'POST') => {
      const response = await runtime.request(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }), headers });
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    };
    const moveIn = moveInDoor(api);
    const files = fixtures('statuspage');
    const times = ['2026-01-10T09:00:00.000Z', '2026-01-11T09:00:00.000Z', '2026-01-11T10:00:00.000Z'];
    const messages = [
      { status: 'scheduled', body: 'Scheduled database work is planned for tomorrow.' },
      { status: 'in_progress', body: 'The database work is now underway.' },
      { status: 'completed', body: 'Database work is complete and normal service has resumed.' },
    ];
    const window = {
      id: 'labelwindow1', name: 'Source maintenance lifecycle', status: 'completed', impact: 'maintenance',
      created_at: times[0], scheduled_for: times[1], scheduled_until: times[2], resolved_at: times[2],
      components: [{ id: 'c0000000001' }],
      incident_updates: messages.map((message, index) => ({
        ...message, id: 'labelupdate' + index, created_at: times[index], display_at: times[index],
        affected_components: [{ code: 'c0000000001', new_status: index === 2 ? 'operational' : 'under_maintenance' }],
      })),
    };
    const now = Date.now();
    const daysFromNow = days => new Date(now + days * 86_400_000).toISOString();
    const future = {
      id: 'synthetic-lamp-future', name: 'Future switch choices', status: 'scheduled', impact: 'maintenance',
      created_at: daysFromNow(-2), scheduled_for: daysFromNow(2), scheduled_until: daysFromNow(3),
      components: window.components, incident_updates: [],
      scheduled_auto_in_progress: false, scheduled_auto_completed: true,
    };
    const running = {
      ...future, id: 'synthetic-lamp-running', name: 'Running switch choices', status: 'in_progress',
      scheduled_for: daysFromNow(-1), scheduled_until: daysFromNow(1),
      scheduled_auto_in_progress: true, scheduled_auto_completed: false,
    };
    const capture = (scheduled, underway, history = window) => ({
      source: 'statuspage', pageId: 'synthpage01', publicAccessAcknowledged: true,
      files: [
        ...files.map(file => file.name === 'incidents.json' ? { ...file, text: JSON.stringify([history, scheduled, underway]) } : file),
        { name: 'incidents-scheduled.json', text: JSON.stringify([scheduled]) },
      ],
    });
    const input = capture(future, running);
    const readWindows = async () => {
      const response = await api('/api/app/maintenance');
      assert.equal(response.status, 200);
      return response.body.maintenance;
    };
    const findWindow = (windows, title) => {
      const found = windows.filter(row => row.title === title);
      assert.equal(found.length, 1, title + ' has one native record');
      return found[0];
    };
    const switches = row => [row.autoStart, row.autoComplete];
    const identities = windows => windows.map(({ id, reference }) => [id, reference]).sort();
    const quiet = await notificationActivity(runtime);
    const outbound = await undoNotificationInventory(runtime);
    const review = await moveIn.preview(input);
    assert.equal(review.status, 200, JSON.stringify(review.body));
    assert.deepEqual(await readWindows(), [], 'review writes no maintenance');
    await assertNoNewNotificationWork(runtime, outbound, 'maintenance review');
    const applied = await moveIn.apply(review.body);
    assert.equal(applied.status, 200, JSON.stringify(applied.body));
    assert.equal(applied.body.job.state, 'completed');
    const windows = await readWindows();
    assert.equal(windows.length, 3);
    const imported = findWindow(windows, window.name);
    const futureWindow = findWindow(windows, future.name);
    const runningWindow = findWindow(windows, running.name);
    assert.equal(futureWindow.state, 'Scheduled');
    assert.deepEqual(switches(futureWindow), [false, true]);
    assert.equal(runningWindow.state, 'In progress');
    assert.deepEqual(switches(runningWindow), [true, false]);
    assert.deepEqual(switches(imported), [true, true], 'omitted fields keep the original automation defaults');
    const records = await importedRecordInventory(runtime);
    assert.equal(records.maintenance_automation.length, 2, 'only windows with explicit switches have a sidecar');
    assert.ok(!records.maintenance_automation.some(row => row.maintenance_id === imported.id));
    await assertNoNewNotificationWork(runtime, outbound, 'reviewed maintenance apply');
    assert.equal(imported.notices.length, 0, 'historical messages never become native notification notices');
    assert.equal(imported.importedUpdates.length, messages.length, 'every source maintenance message survives the public import door');
    assert.deepEqual(imported.importedUpdates.map(row => row.publishedAt).sort(), times);
    for (const path of ['/maintenance/' + imported.reference, '/history/2026-01']) {
      const html = await runtime.visible(path, messages[0].body);
      for (const [index, label] of ['Scheduled', 'In progress', 'Completed'].entries()) {
        assert.ok(html.includes('<strong>' + label + '</strong>'), path + ' labels ' + messages[index].status);
        assert.ok(html.includes(messages[index].body), path + ' keeps source message');
      }
    }
    const compatible = await eventually(async () => (await (await runtime.publicResponse('/api/v2/scheduled-maintenances.json')).json()).scheduled_maintenances.find(row => row.name === window.name),
      row => row?.incident_updates.length === messages.length, 'imported maintenance messages reach the Statuspage-compatible API');
    assert.deepEqual(compatible.incident_updates.map(update => [update.status, update.body, update.created_at]), messages.map((message, index) => [message.status, message.body, times[index]]).reverse(), 'the compatible API lists the messages the public page shows');
    assert.equal(compatible.updated_at, times[2]);
    const front = await (await runtime.publicResponse('/')).text();
    assert.match(front, /Availability counted since <time datetime="2026-01-01T00:00:00.000Z"[^>]*>[^<]*<\/time>, the first component's recorded start\. Incident and maintenance records since <time datetime="2026-01-11T09:00:00.000Z"/, 'the front page names what each history date is');
    await assertNoNewNotifications(runtime, quiet);
    const replay = await moveIn.preview(input);
    assert.equal(replay.status, 200, JSON.stringify(replay.body));
    assert.equal(replay.body.report.state, 'already imported');
    const replayed = await moveIn.apply(replay.body);
    assert.equal(replayed.status, 200, JSON.stringify(replayed.body));
    assert.equal(replayed.body.job.id, applied.body.job.id);
    assert.equal(replayed.body.job.state, 'completed');
    assert.deepEqual(identities(await readWindows()), identities(windows), 'replay keeps one native identity for each source');
    assert.deepEqual(await importedRecordInventory(runtime), records, 'replay preserves the complete native records');
    await assertNoNewNotificationWork(runtime, outbound, 'maintenance replay');

    const saved = await api('/api/app/maintenance/' + runningWindow.id + '/window', {
      startsAt: runningWindow.startsAt, endsAt: runningWindow.endsAt, autoComplete: true,
    }, undefined, 'PUT');
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.deepEqual(switches(findWindow(await readWindows(), running.name)), [true, true]);
    const afterNativeEdit = await undoNotificationInventory(runtime);
    const corrected = { ...window, name: window.name + ' corrected at source' };
    const updatedFuture = { ...future, scheduled_auto_in_progress: true };
    delete updatedFuture.scheduled_auto_completed;
    const updated = await moveIn.preview(capture(updatedFuture, { ...running, scheduled_auto_in_progress: false }, corrected));
    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    const key = source => JSON.stringify(['maintenance', source.id]);
    assert.deepEqual(updated.body.differences.conflicts, [key(running)], 'a changed source cannot take ownership back from a native edit');
    const replacements = updated.body.differences.replacements.filter(item => JSON.parse(item)[0] === 'maintenance');
    assert.deepEqual(replacements.toSorted(), [key(future), key(window)].toSorted(), 'the unedited sidecar and sidecar-free journal are both eligible for replacement');
    const caughtUp = await moveIn.apply(updated.body);
    assert.equal(caughtUp.status, 200, JSON.stringify(caughtUp.body));
    assert.equal(caughtUp.body.job.state, 'completed');
    const afterCatchup = await readWindows();
    assert.deepEqual(identities(afterCatchup), identities(windows));
    assert.deepEqual(switches(findWindow(afterCatchup, future.name)), [true, true], 'the remaining explicit switch is stored and the omitted one keeps its default');
    assert.deepEqual(switches(findWindow(afterCatchup, running.name)), [true, true], 'the native edit survives a conflicting source change');
    assert.deepEqual(switches(findWindow(afterCatchup, corrected.name)), [true, true]);
    const caughtUpRecords = await importedRecordInventory(runtime);
    assert.deepEqual(caughtUpRecords.maintenance_automation.map(row => [row.maintenance_id, row.auto_start, row.auto_complete]).sort(),
      [[futureWindow.id, 1, 1], [runningWindow.id, 1, 1]].sort(), 'the explicit true and native edit are stored while the absent pair stays sidecar-free');
    await assertNoNewNotificationWork(runtime, afterNativeEdit, 'maintenance catch-up');
    t.diagnostic('PROBE MAINT-015 1: saved Statuspage review, apply and replay -> Scheduled false and true, In progress true and false, absent pair stays default, one record per source and no new notification work');
    t.diagnostic('PROBE MAINT-015: scheduled, in_progress and completed source messages survive review/apply, native read, public permalink and monthly history at original times without notifications');
  } finally { await runtime.close(); }
});

test('Imported incident wording stays whole beyond native field limits', { timeout: 180_000 }, async t => {
  const runtime = await openStatusJourney();
  const send = async (path, body, headers) => {
    const response = await runtime.request(path, { ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), headers });
    return { status: response.status, body: await response.json() };
  };
  const door = moveInDoor(send);
  const body = `${'Customers can continue reading their saved invoices while the processing queue recovers. '.repeat(14)}The final source sentence remains part of this same update.`;
  try {
    for (const source of ['statuspage', 'sorry']) {
      const files = source === 'statuspage' ? fixtures(source) : readdirSync('tests/fixtures/sorry/authenticated').map(name => ({ name, text: readFileSync(`tests/fixtures/sorry/authenticated/${name}`, 'utf8') }));
      let title, publishedAt;
      if (source === 'statuspage') {
        const incidents = parsed(files, 'incidents.json');
        // A real export can retain large undocumented provider metadata. Force
        // a chunked journal shared by several incidents without bloating the
        // customer messages or pinning the journal's storage representation.
        for (const row of incidents) row.export_metadata = randomBytes(120_000).toString('base64');
        incidents[0].incident_updates[0].body = body;
        title = incidents[0].name; publishedAt = incidents[0].incident_updates[0].display_at;
        files.find(file => file.name === 'incidents.json').text = JSON.stringify(incidents);
      } else {
        const notice = parsed(files, 'sorry-notice-100.json').response;
        title = notice.subject; publishedAt = notice.updates[0].created_at;
        const original = notice.updates[0].content;
        for (const file of files) file.text = file.text.replaceAll(original, body);
      }
      const reviewed = await door.preview({ source, files, pageId: 'synthpage01', publicAccessAcknowledged: true });
      assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
      const applied = await door.apply(reviewed.body);
      assert.equal(applied.status, 200, JSON.stringify(applied.body));
      const incidents = await incidentSnapshot(send);
      const incident = incidents.find(row => row.title === title);
      assert.ok(incident, `${source} incident is readable through its native document`);
      const update = incident.updates.find(row => row.publishedAt === publishedAt);
      assert.equal(update.customerImpact, body, `${source} retains the entire source update in its readable wording`);
      assert.equal(update.details, '', 'overflow does not become unrelated Additional details');
      const html = await runtime.publicText(`/incidents/${incident.reference}`);
      assert.ok(html.includes(body), `${source} public permanent page contains the whole update`);
      assert.ok(!html.includes('Additional details'), 'the imported sentence stays in one update field');
      const native = await runtime.db.prepare('SELECT customer_impact,details FROM incident_updates WHERE id=?').bind(update.id).first();
      assert.ok(Array.from(native.customer_impact).length <= 250, 'native row remains within the unchanged schema bound');
      assert.ok(body.startsWith(native.customer_impact));
      assert.ok(/\s/u.test(body[native.customer_impact.length] ?? ' '), 'the saved prefix ends at a word boundary');
      assert.equal(native.details, '');
      t.diagnostic(`PROBE ${source} long incident wording: ${body.length} source characters, complete native/public wording, boundary-safe native prefix`);
      await runtime.save(incident.id, { lifecycle: 'Resolved', affectedAudience: 'Invoice customers', customerImpact: 'Owner-authored historical clarification.', whatStillWorks: '', details: 'Separate owner supplied diagnostics.', nextUpdateAt: null });
      await runtime.publish(incident.id, { publishedAt: '2026-11-01T12:00:00.000Z' });
      const edited = await runtime.read(incident.id);
      const authored = edited.updates.find(row => row.customerImpact === 'Owner-authored historical clarification.');
      assert.equal(authored.isRetroactive, true, 'control is a native backdated update beside imported history');
      assert.equal(authored.details, 'Separate owner supplied diagnostics.', 'a genuine native details field is preserved');
      assert.equal(edited.updates.find(row => row.id === update.id).customerImpact, body);
      const undone = await door.undo(applied.body.door);
      assert.equal(undone.status, 200, JSON.stringify(undone.body));
      const kept = await runtime.read(incident.id);
      assert.equal(kept.updates.find(row => row.id === update.id).customerImpact, body, 'conditional undo preserves readable source wording beside the owner publication');
      assert.equal(kept.updates.find(row => row.id === authored.id).details, authored.details);
    }
  } finally { await runtime.close(); }
});
