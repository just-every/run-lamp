import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { parse } from 'parse5';
import { openStatusJourney, eventually, visibleText } from './status-journey.mjs';

const nodes = node => [node, ...(node.childNodes ?? []).flatMap(nodes)];
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const hasClass = (node, name) => attr(node, 'class')?.split(' ').includes(name);

// Execute the served widget program against a tiny host document; assert its
// initial customer-visible state without calling a renderer or payload helper.
function widgetView(program) {
  let inserted;
  const element = () => ({ children: [], style: { setProperty() {} }, setAttribute() {}, appendChild(child) { this.children.push(child); } });
  const document = {
    currentScript: { dataset: {}, src: 'https://status.example.test/widget.js', parentNode: { insertBefore(root) { inserted = root; } } },
    createElement: element,
  };
  runInNewContext(program, { document, window: { location: { origin: 'https://customer.example.test' }, setInterval() {} }, URL }, { timeout: 1000 });
  assert.ok(inserted, 'the served widget inserts its status banner');
  return { overall: inserted.children[1].textContent, message: inserted.children[2].textContent };
}

export async function snapshotMutationsFlow({ inspect } = {}) {
  const j = await openStatusJourney({ workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  try {
    const epoch = Date.now() + 60000;
    let clock = epoch;
    const advance = async (milliseconds = 1000) => {
      clock += milliseconds;
      assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: clock }) })).status, 204);
    };
    await advance();
    const settings = (await j.json('/api/app/page-settings')).settings;
    const fields = Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'footerCreditEnabled', 'mailFromAddress'].map(key => [key, settings[key]]));
    await j.json('/api/app/page-settings', 'PUT', { ...fields, widgetAllowedOrigins: ['https://customer.example.test'] });
    const bucket = await j.runtime.getR2Bucket('SNAPSHOTS');
    const pointer = async () => JSON.parse(await (await bucket.get('snapshots/current.json')).text());
    let previous = await pointer();
    let components = [], incidents = [], maintenance = [];
    let overall = 'Operational';
    let groupName;
    const checkpoint = async (category, extra = () => {}) => {
      const selected = await eventually(pointer, value => value.generation > previous.generation, `${category} selects a new complete snapshot`);
      assert.notEqual(selected.version, previous.version, category);
      const bodies = {};
      for (const [path, key, contentType] of [['/', 'page.html', 'text/html'], ['/feed.atom', 'feed.atom', 'application/atom+xml'], ['/widget.js', 'widget.js', 'javascript']]) {
        const response = await j.publicResponse(path);
        assert.equal(response.status, 200, `${category}: ${path}`);
        assert.ok(response.headers.get('content-type').includes(contentType));
        assert.equal(response.headers.get('x-lamp-snapshot-version'), selected.version, `${category}: ${path} shares the selected identity`);
        assert.equal(response.headers.get('x-lamp-snapshot-generated-at'), selected.generatedAt, path);
        assert.equal(response.headers.get('x-lamp-snapshot-state'), null, path);
        bodies[path] = await response.text();
        const artifact = await bucket.get(`snapshots/${selected.version}/${key}`);
        assert.ok(artifact, `${category} stores a complete ${key}`);
        if (path !== '/') assert.equal(bodies[path], await artifact.text(), `${category}: the route serves its immutable artifact`);
      }
      const page = parse(bodies['/']);
      const componentRows = nodes(page).filter(node => node.tagName === 'article' && hasClass(node, 'component'));
      assert.deepEqual(componentRows.map(row => text(nodes(row).find(node => node.tagName === 'h4'))), components.map(item => item.name), `${category}: complete ordered catalogue`);
      for (const [index, component] of components.entries()) {
        const row = componentRows[index];
        assert.equal(text(nodes(row).find(node => hasClass(node, 'component-state'))), component.state, `${category}: ${component.name} state`);
        const note = nodes(row).find(node => hasClass(node, 'component-note'));
        assert.equal(note ? text(note) : '', component.note, `${category}: ${component.name} note`);
        assert.ok(nodes(row).some(node => hasClass(node, 'uptime-number')), 'every component retains its uptime figure');
        assert.ok(nodes(row).some(node => hasClass(node, 'uptime-mark')), 'every component retains its daily record');
      }
      if (groupName) assert.ok(visibleText(bodies['/']).includes(groupName));
      const publicIncidents = nodes(page).filter(node => node.tagName === 'article' && hasClass(node, 'incident') && !hasClass(node, 'resolved-incident'));
      const unresolved = incidents.filter(item => item.lifecycle !== 'Resolved');
      assert.deepEqual(publicIncidents.map(row => text(nodes(row).find(node => hasClass(node, 'record-title'))).replace('Current incident', '')), unresolved.map(item => item.title), `${category}: every current incident`);
      for (const [index, incident] of unresolved.entries()) {
        const row = publicIncidents[index];
        const updates = nodes(row).filter(node => node.tagName === 'article' && hasClass(node, 'update'));
        assert.equal(updates.length, Math.min(5, incident.updates.length));
        for (const [position, update] of incident.updates.slice(0, 5).entries()) {
          for (const field of ['affectedAudience', 'customerImpact', 'whatStillWorks', 'details']) assert.ok(text(updates[position]).includes(update[field]), `${category}: publication ${update.id} keeps ${field} in order`);
          assert.ok(nodes(updates[position]).some(node => node.tagName === 'time' && attr(node, 'datetime') === update.publishedAt));
        }
        assert.ok(nodes(row).some(node => node.tagName === 'a' && attr(node, 'href') === `/incidents/${incident.reference}`));
      }
      const visibleMaintenance = maintenance.filter(item => ['Scheduled', 'In progress'].includes(item.state));
      const publicMaintenance = nodes(page).filter(node => node.tagName === 'article' && hasClass(node, 'maintenance'));
      assert.deepEqual(publicMaintenance.map(row => text(nodes(row).find(node => node.tagName === 'h4'))).sort(), visibleMaintenance.map(item => item.title).sort(), `${category}: complete relevant maintenance`);
      for (const item of visibleMaintenance) assert.ok(publicMaintenance.some(row => text(row).includes(item.title) && attr(nodes(row).find(node => hasClass(node, 'maintenance-window')), 'data-maintenance-state') === item.state));

      const entries = [...bodies['/feed.atom'].matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(match => match[1]);
      const expectedEntries = [
        ...incidents.flatMap(item => item.updates.map(update => ({ id: `update-${update.id}`, title: item.title, at: update.publishedAt, wording: [update.affectedAudience, update.customerImpact, update.whatStillWorks, update.details] }))),
        ...maintenance.flatMap(item => item.notices.map(notice => ({ id: `maintenance-notice-${notice.id}`, title: item.title, at: notice.publishedAt, wording: [notice.kind, notice.body] }))),
      ].sort((left, right) => right.at.localeCompare(left.at));
      assert.deepEqual(entries.map(entry => entry.match(/<id>[^<]*:event:([^<]+)<\/id>/)[1]), expectedEntries.map(entry => entry.id), `${category}: complete Atom publication inventory`);
      for (const [index, entry] of expectedEntries.entries()) {
        assert.ok(entries[index].includes(entry.title));
        assert.ok(entries[index].includes(`<updated>${entry.at}</updated>`));
        for (const value of entry.wording) assert.ok(visibleText(visibleText(entries[index])).includes(value), `${category}: Atom ${entry.id} keeps its wording`);
      }
      const widget = widgetView(bodies['/widget.js']);
      assert.equal(widget.overall, overall, `${category}: widget rollup`);
      const latest = unresolved[0]?.updates[0];
      if (latest) for (const field of ['affectedAudience', 'customerImpact', 'whatStillWorks', 'details']) assert.ok(widget.message.includes(latest[field]), `${category}: widget uses the latest unresolved publication`);
      else if (maintenance.some(item => item.state === 'In progress')) assert.ok(widget.message.includes(maintenance.find(item => item.state === 'In progress').title));
      else assert.equal(widget.message, '', `${category}: widget removes ended incidents and maintenance`);
      await extra({ bodies, componentRows, selected });
      previous = selected;
      console.log(`PROBE PAGE-005 1 ${category}: native mutation -> complete page, Atom and widget generation reconciled`);
    };
    const patchComponent = async (component, patch) => {
      await advance();
      const input = { name: component.name, note: component.note, description: '', internal: false, groupId: null, displayOrder: 0, ...patch };
      await j.json(`/api/app/components/${component.id}`, 'PUT', input);
      Object.assign(component, patch);
    };
    const first = { ...await j.component('Snapshot customer API', { note: 'Original API customer note.' }), state: 'Operational' };
    components.push(first); await checkpoint('component creation');
    await advance();
    const second = { ...await j.component('Snapshot search service', { displayOrder: 1, note: 'Search remains available.' }), state: 'Operational' };
    components.push(second); await checkpoint('catalogue expansion');
    await patchComponent(first, { name: 'Renamed snapshot customer API' }); await checkpoint('component rename');
    await patchComponent(first, { note: 'Distinct replacement API customer note.' }); await checkpoint('component note');
    await advance();
    const group = (await j.json('/api/app/component-groups', 'POST', { name: 'Customer services', displayOrder: 0 }, 201)).group;
    await checkpoint('group creation');
    await patchComponent(first, { groupId: group.id }); groupName = group.name; await checkpoint('group assignment');
    await advance(); groupName = 'Renamed customer services';
    await j.json(`/api/app/component-groups/${group.id}`, 'PUT', { name: groupName }, 204); await checkpoint('group rename');
    await patchComponent(second, { internal: true }); components = [first]; await checkpoint('component visibility');
    await patchComponent(second, { internal: false, groupId: group.id, displayOrder: 1 }); components.push(second); await checkpoint('component visibility restoration');
    await advance();
    const catalogue = await j.json('/api/app/components/bulk');
    const edited = structuredClone(catalogue.catalogue);
    edited.components.find(item => item.id === first.id).displayOrder = 1;
    edited.components.find(item => item.id === second.id).displayOrder = 0;
    const preview = await j.json('/api/app/components/bulk/preview', 'POST', { catalogue: edited, revision: catalogue.revision });
    await j.json('/api/app/components/bulk/apply', 'POST', { catalogue: edited, revision: catalogue.revision, reviewToken: preview.reviewToken });
    components = [second, first]; await checkpoint('reviewed catalogue reorder');
    await advance();
    await j.json(`/api/app/components/${first.id}/standing-claim`, 'PUT', { state: 'Degraded performance' });
    first.state = overall = 'Degraded performance'; await checkpoint('standing state and history transition');
    await advance();
    await j.json(`/api/app/components/${first.id}/standing-claim`, 'PUT', { state: null });
    first.state = overall = 'Operational'; await checkpoint('standing claim release');
    await advance(3600000);
    await j.json(`/api/app/components/${first.id}/history-corrections`, 'POST', {
      state: 'Major outage', startsAt: new Date(clock - 7200000).toISOString(), endsAt: new Date(clock - 3600000).toISOString(), reason: 'Customer request log reconciliation',
    }, 204);
    await checkpoint('closed history correction', ({ componentRows }) => {
      assert.equal(text(nodes(componentRows[1]).find(node => hasClass(node, 'uptime-number'))), '50.00% over 2 hours');
      assert.ok(nodes(componentRows[1]).some(node => hasClass(node, 'downtime')), 'corrected downtime reaches the rendered daily record');
    });
    await advance();
    const incident = { ...await j.incident('Distinct snapshot API investigation', [first]), updates: [] };
    const publish = async (category, lifecycle, details) => {
      await advance();
      await j.save(incident.id, { lifecycle, affectedAudience: 'Snapshot API customers', customerImpact: `${category} customer impact.`, whatStillWorks: 'Snapshot search remains available.', details, nextUpdateAt: lifecycle === 'Resolved' ? null : new Date(clock + 3600000).toISOString() });
      const update = (await j.publish(incident.id)).update;
      incident.updates.unshift(update); incident.lifecycle = lifecycle;
      first.state = overall = lifecycle === 'Resolved' ? 'Operational' : 'Major outage';
      if (!incidents.length) incidents = [incident];
      await checkpoint(category);
      return update;
    };
    const original = await publish('incident publication', 'Identified', 'Original snapshot investigation details.');
    await advance();
    await j.save(incident.id, { details: 'Corrected distinctive snapshot investigation details.' });
    await j.json(`/api/app/incidents/${incident.id}/draft/correction`, 'POST', { updateId: original.id });
    const corrected = (await j.publish(incident.id)).update;
    assert.equal(corrected.correctsUpdateId, original.id);
    incident.updates.unshift(corrected); await checkpoint('incident correction');
    for (let index = 0; index < 4; index++) await publish(`incident progress ${index + 1}`, 'Monitoring', `Independent retained progress publication ${index + 1}.`);
    await publish('incident resolution', 'Resolved', 'The snapshot API has recovered.');
    await publish('incident reopening', 'Investigating', 'A distinct follow-up investigation is active.');
    await advance();
    const input = { title: 'Snapshot database maintenance', affectedAudience: 'Database customers', customerImpact: 'Database requests pause during the upgrade.', startsAt: new Date(clock + 3600000).toISOString(), endsAt: new Date(clock + 7200000).toISOString(), componentIds: [second.id], autoStart: false, autoComplete: false };
    const planned = (await j.json('/api/app/maintenance', 'POST', input, 201)).maintenance;
    maintenance = [planned]; await checkpoint('maintenance scheduling');
    await advance();
    const rescheduled = (await j.json(`/api/app/maintenance/${planned.id}/window`, 'PUT', { startsAt: new Date(clock + 7200000).toISOString(), endsAt: new Date(clock + 10800000).toISOString() })).maintenance;
    maintenance = [rescheduled]; await checkpoint('maintenance rescheduling');
    await advance();
    const active = (await j.json(`/api/app/maintenance/${planned.id}/start`, 'POST', {})).maintenance;
    maintenance = [active]; second.state = 'Under maintenance'; await checkpoint('maintenance start');
    await inspect?.(j);
    await advance();
    const completed = (await j.json(`/api/app/maintenance/${planned.id}/complete`, 'POST', {})).maintenance;
    maintenance = [completed]; second.state = 'Operational'; await checkpoint('maintenance completion');
    await advance();
    const cancelled = (await j.json('/api/app/maintenance', 'POST', { ...input, title: 'Cancelled snapshot maintenance' }, 201)).maintenance;
    maintenance.push(cancelled); await checkpoint('second maintenance scheduling');
    await advance();
    maintenance[1] = (await j.json(`/api/app/maintenance/${cancelled.id}/cancel`, 'POST', {})).maintenance;
    await checkpoint('maintenance cancellation');
    await advance();
    await j.json(`/api/app/incidents/${incident.id}`, 'DELETE', { reason: 'Duplicate public investigation reviewed by the owner' });
    incidents = []; first.state = overall = 'Operational'; await checkpoint('audited incident deletion');
    await advance();
    await j.json(`/api/app/components/${second.id}`, 'DELETE', undefined, 204);
    components = [first]; await checkpoint('component deletion with retained maintenance notices');
    await advance();
    await j.json(`/api/app/component-groups/${group.id}`, 'DELETE', undefined, 204);
    groupName = undefined; await checkpoint('group removal');
  } finally { await j.close(); }
}
