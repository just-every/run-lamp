import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { parse, parseFragment } from 'parse5';
import { maintenanceIdentityFlow, assertSeparateRecords } from './helpers/maintenance-identity-flow.mjs';
import { chatDeskNativeFlow } from '../chat-desk/flow.mjs';
import { literalLinkFields } from './helpers/update-link-evidence.mjs';
import { assertUpdateLinkSurfaces } from './helpers/update-link-surfaces.mjs';
import { openStatusJourney, eventually, wording, visibleText } from './helpers/status-journey.mjs';
import { assertEmptyCalendar, validateMaintenanceCalendar } from './helpers/calendar-assertions.mjs';
import { assertHistoryRecord } from './helpers/history-assertions.mjs';
import { scheduledUpdateFlow } from './helpers/scheduled-update-flow.mjs';
import { maintenanceReminderFlow } from './helpers/maintenance-reminder-flow.mjs';
import { maintenanceAudienceFlow } from './helpers/maintenance-audience-flow.mjs';

function descendants(node) {
  return (node.childNodes ?? []).flatMap(child => [child, ...descendants(child)]);
}
function nodeText(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(nodeText).join('');
}
function publicUpdate(html, details) {
  const updates = descendants(parse(html)).filter(node => node.tagName === 'article'
    && node.attrs.some(attr => attr.name === 'class' && attr.value.split(' ').includes('update'))
    && nodeText(node).includes(details));
  assert.equal(updates.length, 1, `one public update contains ${details}`);
  return updates[0];
}
// Brisbane has a fixed ten-hour offset. Compute the expected calendar date
// independently of Lamp's formatter, including a possible UTC date rollover.
function brisbaneTime(instant) {
  const local = new Date(Date.parse(instant) + 10 * 3600_000);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][local.getUTCMonth()];
  return `${month} ${local.getUTCDate()}, ${local.getUTCFullYear()}, ${local.toISOString().slice(11, 16)} UTC+10:00`;
}
function brisbaneMonth(instant) {
  return new Date(Date.parse(instant) + 10 * 3600_000).toISOString().slice(0, 7);
}

function assertPublicationPage(html, publication, expectedFields, surface) {
  const update = publicUpdate(html, publication.customerImpact);
  const heading = update.childNodes.find(node => node.tagName === 'div');
  assert.equal(nodeText(heading.childNodes.find(node => node.tagName === 'strong')), publication.lifecycle, surface);
  assert.equal(descendants(heading).find(node => node.tagName === 'time').attrs.find(attr => attr.name === 'datetime').value, publication.publishedAt, surface);
  const fields = descendants(update).filter(node => node.tagName === 'div' && node.childNodes.some(child => child.tagName === 'dt'));
  assert.deepEqual(fields.map(field => [nodeText(field.childNodes.find(node => node.tagName === 'dt')), nodeText(field.childNodes.find(node => node.tagName === 'dd'))])
    .filter(([label]) => label !== 'Component state'), expectedFields, `${surface}: the complete wording belongs to this publication`);
  if (publication.nextUpdateAt) {
    const commitment = fields.find(field => nodeText(field.childNodes.find(node => node.tagName === 'dt')) === 'Next update by');
    assert.equal(descendants(commitment).find(node => node.tagName === 'time').attrs.find(attr => attr.name === 'datetime').value, publication.nextUpdateAt, `${surface}: exact commitment instant`);
  }
}

function atomPublication(xml, publication) {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(match => match[1])
    .filter(entry => entry.includes(`:event:update-${publication.id}</id>`));
  assert.equal(entries.length, 1, 'one Atom entry has this committed publication identity');
  assert.equal(entries[0].match(/<updated>([^<]+)<\/updated>/)[1], publication.publishedAt);
  const encoded = entries[0].match(/<content type="html">([^<]*)<\/content>/)[1];
  return nodeText(parse(nodeText(parse(encoded))));
}

function assertPublicationText(text, incident, publication, expectedFields, surface) {
  const paragraphs = text.split('\n\n');
  assert.ok(paragraphs.includes(`${incident.reference}: ${incident.title}`), `${surface}: incident identity`);
  assert.ok(paragraphs.includes(`Status: ${publication.lifecycle}`), `${surface}: publication lifecycle`);
  const labels = ['Who is affected', 'Customer impact', 'What still works', 'Next update by', 'Additional details'];
  assert.deepEqual(paragraphs.filter(paragraph => labels.some(label => paragraph.startsWith(`${label}:`))),
    expectedFields.map(([label, value]) => `${label}: ${value}`), `${surface}: exact populated fields and no absent fields`);
}

test('INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion', async () => {
  const j = await openStatusJourney({ extraBindings: { LAMP_TEST_REQUIRE_REVIEW: 'true' } });
  const linkedWording = literalLinkFields(wording);
  const reviewer = 'synthetic-lamp-reviewer@example.test';
  const owner = () => j.signIn();
  const review = async id => {
    await j.signIn(reviewer);
    await j.json(`/api/app/incidents/${id}/draft/review`, 'POST', {});
  };
  const saveReviewed = async (id, patch) => { await owner(); await j.save(id, patch); await review(id); };
  try {
    const savedSettings = (await j.json('/api/app/page-settings')).settings;
    const settings = Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'mailFromAddress', 'template', 'footerCreditEnabled', 'widgetAllowedOrigins'].map(key => [key, savedSettings[key]]));
    await j.json('/api/app/page-settings', 'PUT', { ...settings, timezone: ['Australia', 'Brisbane'].join('/') });
    assert.equal((await j.raw('/api/app/components')).status, 401);
    assert.equal((await j.raw(new URL('/api/app/components', j.publicOrigin).href)).status, 404);
    await j.json('/api/app/operators/invite', 'POST', { email: reviewer, displayName: 'Incident reviewer' }, 202);
    const component = await j.component('Payments API');
    const hidden = await j.component('PRIVATE internal queue', { internal: true });
    const template = (await j.json('/api/app/incident-templates', 'POST', {
      name: 'Customer API recovery', ...linkedWording, nextUpdateOffsetMinutes: 60,
      components: [{ componentId: component.id, state: 'Major outage', relationship: 'Primary' }],
    }, 201)).template;
    const incident = await j.incident('Payment requests delayed', [component, hidden]);
    const endpoint = `/api/app/incidents/${incident.id}`;
    const publishedUpdates = async () => (await j.db.prepare('SELECT * FROM incident_updates WHERE incident_id = ? ORDER BY published_at, created_at, id').bind(incident.id).all()).results;
    assert.equal(incident.lifecycle, 'Investigating');
    assert.equal((await j.read(incident.id)).lifecycle, 'Investigating');
    assert.ok(incident.reference);
    await j.json(`${endpoint}/internal-notes`, 'POST', { body: 'PRIVATE investigation note' }, 201);
    await j.publish(incident.id, {}, 400);
    await j.json(`${endpoint}/templates/${template.id}/apply`, 'POST', {});
    const privateDraft = (await j.read(incident.id)).draft;
    assert.equal(privateDraft.customerImpact, linkedWording.customerImpact);
    for (const path of ['/', '/history', '/feed.atom', '/api/public/status']) {
      const body = await j.publicText(path);
      assert.ok(!body.includes(incident.title) && !body.includes('PRIVATE investigation note'));
    }
    await j.json(`${endpoint}/draft/review`, 'POST', {}, 409);
    await j.publish(incident.id, {}, 409);
    const preview = await j.json(`${endpoint}/draft/preview`, 'POST', { ...linkedWording, nextUpdateAt: privateDraft.nextUpdateAt });
    assert.ok(JSON.stringify(preview.preview).includes(wording.customerImpact));
    await review(incident.id);
    const subscriber = 'reviewed-publication-reader@example.test';
    const subscription = await j.raw(new URL('/subscribe', j.publicOrigin).href, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: subscriber, componentId: component.id }) });
    assert.equal(subscription.status, 202);
    const confirmation = await eventually(() => j.messages.find(mail => mail.to.includes(subscriber)), Boolean, 'subscriber confirmation mail');
    assert.equal((await j.raw(confirmation.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0])).status, 200);
    const first = (await j.publish(incident.id, { channels: ['email'] })).update;
    await j.tick(Date.now());
    const reached = await eventually(() => j.json(`${endpoint}/reach?updateId=${first.id}`), body => body.updates[0].channels.some(row => row.channel === 'email' && row.providerAccepted === 1), 'the frozen publication reaches its committed subscriber');
    assert.equal(reached.updates[0].channels.find(row => row.channel === 'email').committed, 1);
    const customerMail = j.messages.find(mail => mail.to.includes(subscriber) && !mail.text.includes('/confirm-subscription/'));
    for (const value of Object.values(linkedWording).filter(value => value !== 'Identified')) assert.ok(customerMail.text.includes(value));
    assert.equal(customerMail.subject, preview.preview.email.subject, 'notification subject matches the preview');
    assert.equal(customerMail.text.split('\n\nManage this subscription:')[0], preview.preview.email.plainText, 'the complete customer message matches the preview before personal subscription links');
    await j.visible(`/incidents/${incident.reference}`, wording.customerImpact);
    for (const path of ['/', `/incidents/${incident.reference}`, '/feed.atom', '/widget.js']) {
      const body = await j.publicText(path);
      assert.ok(body.includes(incident.title), path);
      if (path !== '/feed.atom') assert.ok(visibleText(body).includes(wording.customerImpact), path);
      assert.ok(!body.includes('PRIVATE investigation note') && !body.includes(hidden.name), path);
    }
    await assertUpdateLinkSurfaces(j, incident, component, first);
    const populatedFields = [
      ['Who is affected', linkedWording.affectedAudience], ['Customer impact', linkedWording.customerImpact],
      ['What still works', linkedWording.whatStillWorks], ['Next update by', brisbaneTime(privateDraft.nextUpdateAt)],
      ['Additional details', linkedWording.details],
    ];
    assert.equal(first.nextUpdateAt, privateDraft.nextUpdateAt);
    assert.deepEqual((await j.read(incident.id)).updates.find(update => update.id === first.id), first);
    for (const path of ['/', `/incidents/${incident.reference}`]) {
      assertPublicationPage(await j.publicText(path), first, populatedFields, path);
    }
    assertPublicationText(atomPublication(await j.publicText('/feed.atom'), first), incident, first, populatedFields, 'populated Atom');
    assertPublicationText(customerMail.text, incident, first, populatedFields, 'actual populated email');
    for (const value of Object.values(linkedWording).filter(value => value !== 'Identified')) {
      assert.ok(preview.preview.public.fields.some(field => field.value === value));
      assert.ok(preview.preview.email.plainText.includes(value));
    }
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === component.id).publicState, 'Major outage');

    const identified = await j.read(incident.id);
    assert.equal(first.lifecycle, 'Identified');
    assert.equal(identified.lifecycle, 'Identified');
    assert.deepEqual(identified.updates, [first]);
    const identifiedUpdates = await publishedUpdates();
    assert.equal(identifiedUpdates.length, 1);

    await owner();
    const originalRecovery = { lifecycle: 'Monitoring', customerImpact: 'Payments are recovering.', details: 'The original recovery estimate is based on the first restored payment queue.' };
    await j.save(incident.id, { ...originalRecovery, componentChanges: [
      { componentId: component.id, state: 'Degraded performance' },
      { componentId: hidden.id, state: 'Degraded performance' },
    ] });
    const savedMonitoring = await j.read(incident.id);
    assert.equal(savedMonitoring.draft.lifecycle, 'Monitoring');
    assert.equal(savedMonitoring.lifecycle, 'Identified');
    assert.deepEqual(savedMonitoring.updates, identified.updates);
    assert.deepEqual(await publishedUpdates(), identifiedUpdates);

    for (const lifecycle of [['Identified', 'Monitoring'], 'Identified, Monitoring']) {
      const refused = await j.json(`${endpoint}/draft`, 'PUT', { ...wording, lifecycle }, 400);
      assert.equal(refused.error, 'Invalid incident draft.');
      assert.deepEqual(await j.read(incident.id), savedMonitoring, 'multiple lifecycle choices leave the incident and saved draft unchanged');
      assert.deepEqual(await publishedUpdates(), identifiedUpdates);
    }

    await review(incident.id);
    const reviewedMonitoring = await j.read(incident.id);
    assert.equal(reviewedMonitoring.draft.lifecycle, 'Monitoring');
    assert.ok(reviewedMonitoring.draft.reviewedAt);
    assert.equal(reviewedMonitoring.lifecycle, 'Identified');
    assert.deepEqual(reviewedMonitoring.updates, identified.updates);
    assert.deepEqual(await publishedUpdates(), identifiedUpdates);
    const monitoring = (await j.publish(incident.id)).update;
    assert.equal(monitoring.lifecycle, 'Monitoring');
    const publishedMonitoring = await j.read(incident.id);
    assert.equal(publishedMonitoring.lifecycle, 'Monitoring');
    assert.equal(publishedMonitoring.draft, null);
    assert.deepEqual(publishedMonitoring.updates.find(row => row.id === monitoring.id), monitoring);
    assert.deepEqual(publishedMonitoring.updates.find(row => row.id === first.id), first);
    const monitoringUpdates = await publishedUpdates();
    assert.equal(monitoringUpdates.length, identifiedUpdates.length + 1);
    assert.deepEqual(monitoringUpdates.filter(row => row.id !== monitoring.id), identifiedUpdates);
    assert.equal(monitoringUpdates.find(row => row.id === monitoring.id).lifecycle, 'Monitoring');
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === component.id).publicState, 'Degraded performance');
    assert.equal((await j.read(incident.id)).impact, 'Major outage');
    const impact = (await j.json(`${endpoint}/impact`, 'PUT', { impactOverride: 'minor' })).impact;
    assert.equal(impact.effectiveImpact, 'minor');
    const publicIncident = (await (await j.publicResponse('/api/v2/incidents.json')).json()).incidents.find(row => row.shortlink.endsWith(incident.reference));
    assert.equal(publicIncident.impact, 'minor');
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === component.id).publicState, 'Degraded performance');
    await j.json(`${endpoint}/impact`, 'PUT', { impactOverride: null });
    const oldVersion = `${privateDraft.id}:0`;
    const stale = await j.api(`${endpoint}/publish`, { method: 'POST', headers: { 'If-Match': oldVersion }, body: JSON.stringify({ channels: [] }) });
    assert.equal(stale.status, 409);

    await owner();
    const originalUpdates = (await j.read(incident.id)).updates;
    const storedUpdates = async () => (await j.db.prepare('SELECT * FROM incident_updates WHERE incident_id = ? ORDER BY id').bind(incident.id).all()).results;
    const originalRows = await storedUpdates();
    assert.deepEqual(originalUpdates.map(update => update.id), [monitoring.id, first.id]);
    assert.deepEqual(originalRows.map(row => row.id).sort(), [first.id, monitoring.id].sort());
    for (const method of ['PUT', 'DELETE']) {
      const refused = await j.request(`${endpoint}/updates/${monitoring.id}`, {
        method, body: JSON.stringify({ ...wording, customerImpact: 'An unsafe rewrite must never replace the published recovery update.', nextUpdateAt: monitoring.nextUpdateAt }),
      });
      assert.equal(refused.status, 404, `${method} cannot mutate a published update`);
      assert.deepEqual((await j.read(incident.id)).updates, originalUpdates, `${method} preserves every complete original update`);
      assert.deepEqual(await storedUpdates(), originalRows, `${method} leaves all persisted publication fields unchanged`);
    }
    const correctedRecovery = { lifecycle: 'Monitoring', customerImpact: 'Payment retries are recovering more slowly than the first estimate.', details: 'Corrected recovery wording: the remaining payment queue is still draining.' };
    await j.save(incident.id, { ...correctedRecovery, nextUpdateAt: new Date(Date.now() - 60000).toISOString() });
    const committedTime = (await j.read(incident.id)).draft.nextUpdateAt;
    assert.ok(committedTime, 'the saved draft has a next-update commitment');
    await j.json(`${endpoint}/draft/correction`, 'POST', { updateId: monitoring.id });
    await review(incident.id);
    const corrected = (await j.publish(incident.id)).update;
    assert.equal(corrected.nextUpdateAt, committedTime, 'publication keeps the saved commitment');
    assert.equal(corrected.correctsUpdateId, monitoring.id);
    const correctedView = await j.read(incident.id);
    const savedCorrection = correctedView.updates.find(row => row.id === corrected.id);
    assert.equal(savedCorrection.correctsUpdateId, monitoring.id, 'the independently read publication identifies the original update');
    assert.equal(savedCorrection.customerImpact, correctedRecovery.customerImpact);
    assert.equal(savedCorrection.details, correctedRecovery.details);
    assert.deepEqual(correctedView.updates.find(row => row.id === first.id), first);
    assert.deepEqual(correctedView.updates.find(row => row.id === monitoring.id), monitoring);
    assert.deepEqual((await storedUpdates()).filter(row => row.id !== corrected.id), originalRows, 'a correction adds a publication without rewriting any original field');
    assert.notEqual(corrected.id, monitoring.id);
    assert.ok(Date.parse(corrected.publishedAt) > Date.parse(monitoring.publishedAt));
    assert.ok(Date.parse(monitoring.publishedAt) > Date.parse(first.publishedAt));
    const timeline = await j.visible(`/incidents/${incident.reference}`, correctedRecovery.details);
    const matchingDescendants = (node, predicate) => (node.childNodes ?? []).flatMap(child => [...(predicate(child) ? [child] : []), ...matchingDescendants(child, predicate)]);
    const publishedAttribute = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
    const publishedText = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(publishedText).join('');
    const publishedArticles = matchingDescendants(parseFragment(timeline), node => node.tagName === 'article' && publishedAttribute(node, 'class') === 'update');
    const publicUpdates = publishedArticles.map(article => {
      const head = matchingDescendants(article, node => publishedAttribute(node, 'class') === 'update-head')[0];
      const fields = Object.fromEntries(matchingDescendants(article, node => node.tagName === 'div').filter(node => node.childNodes?.some(child => child.tagName === 'dt')).map(node => [publishedText(node.childNodes.find(child => child.tagName === 'dt')), publishedText(node.childNodes.find(child => child.tagName === 'dd'))]));
      return { lifecycle: publishedText(matchingDescendants(head, node => node.tagName === 'strong')[0]), publishedAt: publishedAttribute(matchingDescendants(head, node => node.tagName === 'time')[0], 'datetime'), customerImpact: fields['Customer impact'], details: fields['Additional details'] };
    });
    assert.deepEqual(publicUpdates, [
      { ...correctedRecovery, publishedAt: corrected.publishedAt },
      { ...originalRecovery, publishedAt: monitoring.publishedAt },
      { lifecycle: linkedWording.lifecycle, customerImpact: linkedWording.customerImpact, details: linkedWording.details, publishedAt: first.publishedAt },
    ], 'the public timeline associates each complete original and correction with its exact publication instant, newest first');
    assert.equal(correctedView.overdue, true);
    assert.ok(!(await j.publicText(`/incidents/${incident.reference}`)).includes('overdue'));
    for (const path of ['/', `/incidents/${incident.reference}`]) {
      const html = await j.visible(path, corrected.details);
      const update = publicUpdate(html, corrected.details);
      const fields = descendants(update).filter(node => node.tagName === 'div'
        && node.childNodes.some(child => child.tagName === 'dt' && nodeText(child) === 'Next update by'));
      assert.equal(fields.length, 1, `${path}: the overdue update retains its labeled commitment`);
      const value = fields[0].childNodes.find(node => node.tagName === 'dd');
      const times = descendants(value).filter(node => node.tagName === 'time');
      assert.equal(times.length, 1, `${path}: the commitment has one semantic timestamp`);
      assert.equal(times[0].attrs.find(attr => attr.name === 'datetime')?.value, committedTime, `${path}: the committed instant is unchanged`);
      assert.equal(nodeText(value), brisbaneTime(committedTime), `${path}: the commitment stays in the configured zone`);
      assert.doesNotMatch(nodeText(parse(html)), /overdue/i, `${path}: no public overdue label`);
    }

    const blankWording = {
      affectedAudience: 'Customers waiting for a second payment attempt.',
      customerImpact: 'Second payment attempts remain queued for review.',
      lifecycle: 'Monitoring', whatStillWorks: '', details: '', nextUpdateAt: new Date(Date.now() + 7200_000).toISOString(),
    };
    await saveReviewed(incident.id, blankWording);
    const blank = (await j.publish(incident.id, { channels: ['email'] })).update;
    const blankFields = [
      ['Who is affected', blankWording.affectedAudience], ['Customer impact', blankWording.customerImpact],
      ['Next update by', brisbaneTime(blankWording.nextUpdateAt)],
    ];
    assert.equal(blank.whatStillWorks, ''); assert.equal(blank.details, '');
    assert.equal(blank.nextUpdateAt, blankWording.nextUpdateAt);
    for (const path of ['/', `/incidents/${incident.reference}`]) {
      assertPublicationPage(await j.visible(path, blankWording.customerImpact), blank, blankFields, path);
    }
    assertPublicationText(atomPublication(await j.publicText('/feed.atom'), blank), incident, blank, blankFields, 'blank-optional Atom');
    await j.tick(Date.now());
    const blankMail = await eventually(() => j.messages.find(mail => mail.to.includes(subscriber) && mail.text.includes(blankWording.customerImpact)), Boolean, 'blank-optional publication reaches the subscriber');
    assertPublicationText(blankMail.text, incident, blank, blankFields, 'actual blank-optional email');

    await saveReviewed(incident.id, { lifecycle: 'Resolved', customerImpact: 'Payment processing has recovered.', whatStillWorks: '', details: '', nextUpdateAt: null });
    const resolution = (await j.publish(incident.id, { channels: ['email'] })).update;
    assert.equal(resolution.lifecycle, 'Resolved');
    const resolvedFields = [['Who is affected', wording.affectedAudience], ['Customer impact', 'Payment processing has recovered.']];
    assert.equal(resolution.nextUpdateAt, null);
    assertPublicationPage(await j.visible(`/incidents/${incident.reference}`, resolution.customerImpact), resolution, resolvedFields, 'resolved permalink');
    const resolvedRoot = descendants(parse(await j.visible('/', resolution.customerImpact))).filter(node => node.tagName === 'article'
      && node.attrs.some(attr => attr.name === 'class' && attr.value.split(' ').includes('resolved-incident'))
      && nodeText(node).includes(incident.title));
    assert.equal(resolvedRoot.length, 1, 'the root shows this resolved incident');
    assert.ok(nodeText(resolvedRoot[0]).includes('Payment processing has recovered.'));
    for (const label of ['What still works', 'Additional details', 'Next update by']) {
      assert.ok(!nodeText(resolvedRoot[0]).includes(label), `resolved root omits ${label}`);
    }
    assertPublicationText(atomPublication(await j.publicText('/feed.atom'), resolution), incident, resolution, resolvedFields, 'resolved Atom');
    await j.tick(Date.now());
    const resolvedMail = await eventually(() => j.messages.find(mail => mail.to.includes(subscriber) && mail.text.includes('Payment processing has recovered.')), Boolean, 'resolved publication reaches the subscriber');
    assertPublicationText(resolvedMail.text, incident, resolution, resolvedFields, 'actual resolved email');
    const resolved = await j.read(incident.id);
    assert.equal(resolved.lifecycle, 'Resolved');
    assert.deepEqual(resolved.updates.find(row => row.id === resolution.id), resolution);
    assert.equal(resolved.impact, 'Major outage', 'resolution retains the greatest published component impact');
    assert.equal(resolved.effectiveImpact, 'critical');
    assert.equal(typeof resolved.resolvedAt, 'string');
    assert.equal((await j.read(incident.id)).draft, null);
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === component.id).publicState, 'Operational');
    await j.visible('/history', incident.title);
    await assertUpdateLinkSurfaces(j, incident, component, first, { history: true });
    const reportPath = `${endpoint}/report`;
    const generated = (await j.json(`${reportPath}/draft`, 'POST', {})).report;
    assert.equal(generated.publishedAt, null);
    assert.ok(!JSON.stringify(generated).includes('PRIVATE investigation note'));
    await j.json(`${reportPath}/publish`, 'POST', { channels: [] }, 400);
    const report = { summary: 'Payment incident reviewed', timeline: generated.timeline, cause: 'A connection pool was exhausted.', remediation: 'We increased capacity and added alerting.' };
    await j.json(reportPath, 'PUT', report);
    await j.json(`${reportPath}/publish`, 'POST', { channels: [] });
    await j.visible(`/incidents/${incident.reference}`, report.cause);
    await j.json(reportPath, 'PUT', { ...report, cause: 'Changed later' }, 409);
    await j.json(`${reportPath}/publish`, 'POST', { channels: [] }, 409);
    assert.ok(!(await j.json('/api/app/reports/owing')).incidentIds.includes(incident.id));

    await saveReviewed(incident.id, { lifecycle: 'Investigating', customerImpact: 'Payments need another investigation.' });
    const reopening = (await j.publish(incident.id)).update;
    const reopened = await j.read(incident.id);
    assert.equal(reopened.lifecycle, 'Investigating');
    assert.deepEqual(reopened.updates.find(row => row.id === resolution.id), resolution);
    assert.deepEqual(reopened.updates.find(row => row.id === reopening.id), reopening);
    assert.notEqual(reopening.id, resolution.id);
    assert.notEqual(reopening.publishedAt, resolution.publishedAt);
    const reopenedTimeline = await j.visible(`/incidents/${incident.reference}`, 'Payments need another investigation.');
    const timelineDescendants = node => [node, ...(node.childNodes ?? []).flatMap(timelineDescendants)];
    const text = node => timelineDescendants(node).filter(child => child.nodeName === '#text').map(child => child.value).join('');
    const attribute = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
    const articles = timelineDescendants(parse(reopenedTimeline)).filter(node => node.tagName === 'article' && attribute(node, 'class')?.split(' ').includes('update'));
    for (const [update, lifecycle, customerImpact] of [
      [resolution, 'Resolved', 'Payment processing has recovered.'],
      [reopening, 'Investigating', 'Payments need another investigation.'],
    ]) {
      const matching = articles.filter(article => timelineDescendants(article).some(node => node.tagName === 'dd' && text(node) === customerImpact));
      assert.equal(matching.length, 1, `${lifecycle} wording remains in its own public update article after reopening`);
      const header = timelineDescendants(matching[0]).find(node => attribute(node, 'class') === 'update-head');
      assert.ok(header, `${lifecycle} has its public publication header`);
      assert.equal(text(header.childNodes.find(node => node.tagName === 'strong')), lifecycle);
      const published = timelineDescendants(header).filter(node => node.tagName === 'time');
      assert.equal(published.length, 1, `${lifecycle} has one associated publication time`);
      assert.equal(attribute(published[0], 'datetime'), update.publishedAt, `${lifecycle} retains its exact publication instant`);
    }
    await saveReviewed(incident.id, { lifecycle: 'Resolved', nextUpdateAt: null });
    await owner();
    const scheduleAt = Date.now() + 10000;
    await j.json(`${endpoint}/draft/schedule`, 'POST', { publishAt: new Date(scheduleAt).toISOString(), channels: [] }, 202);
    await j.tick(scheduleAt - 1000);
    assert.equal((await j.read(incident.id)).lifecycle, 'Investigating');
    await new Promise(resolve => setTimeout(resolve, Math.max(0, scheduleAt - Date.now()) + 100));
    await j.tick(scheduleAt + 1000);
    await eventually(() => j.read(incident.id), row => row.lifecycle === 'Resolved', 'scheduled reviewed publication');
    assert.equal((await j.read(incident.id)).updates.filter(row => row.lifecycle === 'Resolved').length, 2);
    await j.tick(scheduleAt + 2000);
    assert.equal((await j.read(incident.id)).updates.filter(row => row.lifecycle === 'Resolved').length, 2);

    // Backdate a complete incident through the same HTTP door, with an active
    // incident on the component: replay must preserve the current claim.
    const live = await j.incident('Current payment investigation', [component]);
    await saveReviewed(live.id, {}); await j.publish(live.id);
    const start = '2024-06-15T13:04:05.000Z';
    const end = new Date(Date.parse(start) + 3600000).toISOString();
    const historical = await j.incident('Historical payment degradation', [component], { openedAt: start });
    const originalDetails = 'Historical investigation from the original service log.';
    const resolutionDetails = 'Historical recovery from the original service log.';
    await saveReviewed(historical.id, { lifecycle: 'Investigating', details: originalDetails });
    const original = (await j.publish(historical.id, { publishedAt: start, channels: ['email'] })).update;
    await saveReviewed(historical.id, { lifecycle: 'Resolved', details: resolutionDetails, nextUpdateAt: null });
    const historicalResolution = (await j.publish(historical.id, { publishedAt: end, channels: ['email'] })).update;
    assert.equal(original.publishedAt, start);
    assert.equal(historicalResolution.publishedAt, end);
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === component.id).publicState, 'Major outage');
    const month = start.slice(0, 7);
    const availability = await j.json(`/api/app/availability-report?component=${component.id}&month=${month}&format=json`);
    assert.ok(availability.incidents.some(row => row.id === historical.id));
    assert.ok(Number(availability.downtimeMinutes) > 0);
    await j.visible(`/history/${start.slice(0, 7)}`, historical.title);
    const retainedHistorical = await j.read(historical.id);
    assert.deepEqual(retainedHistorical.updates.map(update => update.id).sort(), [original.id, historicalResolution.id].sort());
    assertHistoryRecord(await j.publicText(`/history/${start.slice(0, 7)}`), {
      href: `/incidents/${historical.reference}`, title: historical.title, state: 'Resolved', startsAt: start, endsAt: end,
      duration: '1h 0m', components: [component.name], updates: [original, historicalResolution],
    });
    for (const path of [`/incidents/${historical.reference}`, `/history/${start.slice(0, 7)}`]) {
      const html = await j.visible(path, resolutionDetails);
      for (const [details, lifecycle, instant, display] of [
        [originalDetails, 'Investigating', start, 'Jun 15, 2024, 23:04 UTC+10:00'],
        [resolutionDetails, 'Resolved', end, 'Jun 16, 2024, 00:04 UTC+10:00'],
      ]) {
        const update = publicUpdate(html, details);
        const heading = update.childNodes.find(node => node.tagName === 'div' && node.attrs.some(attr => attr.name === 'class' && attr.value === 'update-head'));
        assert.equal(nodeText(heading.childNodes.find(node => node.tagName === 'strong')), lifecycle, `${path}: the original publication belongs to its lifecycle`);
        const times = descendants(heading).filter(node => node.tagName === 'time');
        assert.equal(times.length, 1, `${path}: one publication time belongs to this update`);
        assert.equal(times[0].attrs.find(attr => attr.name === 'datetime')?.value, instant, `${path}: the original publication instant`);
        assert.equal(nodeText(times[0]), display, `${path}: the original time in the configured zone`);
      }
    }
    const history = (await j.json(`/api/app/components/${component.id}/history`)).history;
    for (const [instant, state] of [[start, 'Major outage'], [end, 'Operational']]) {
      assert.ok(history.some(row => row.causeId === historical.id && row.changedAt === instant && row.newState === state), 'the original claim transition enters component history');
    }
    await saveReviewed(historical.id, { lifecycle: 'Monitoring', details: 'Current correction of the historical record.' });
    await j.publish(historical.id, { channels: ['email'] });
    await j.tick(Date.now());
    const historicalReach = await j.json(`/api/app/incidents/${historical.id}/reach`);
    assert.equal(historicalReach.updates.length, 3);
    assert.ok(historicalReach.updates.every(update => update.channels.every(channel => channel.committed === 0)), 'historical and later current-time updates create no subscriber delivery');
    assert.ok(!j.messages.some(mail => mail.text.includes(historical.title)), 'no historical incident notification reaches the provider');
    // The report month follows the page's fixed Brisbane offset.
    const performanceMonth = brisbaneMonth((await j.read(incident.id)).openedAt);
    const performance = await j.json(`/api/app/communication-performance?month=${performanceMonth}`);
    assert.ok(performance.incidents.some(row => row.incidentId === incident.id));
    assert.ok(performance.summary.commitments.evaluated > 0);
    const performanceCsv = await j.request(`/api/app/communication-performance?month=${performanceMonth}&format=csv`);
    assert.equal(performanceCsv.status, 200); assert.ok((await performanceCsv.text()).includes(incident.reference));
    for (const format of ['csv', 'pdf']) {
      const response = await j.request(`/api/app/availability-report?component=${component.id}&month=${month}&format=${format}`);
      assert.equal(response.status, 200); assert.ok((await response.arrayBuffer()).byteLength);
    }
    const reach = await j.json(`/api/app/incidents/${incident.id}/reach`);
    assert.ok(reach.incident);
    await j.json(endpoint, 'DELETE', {}, 400);
    await j.json(endpoint, 'DELETE', { reason: 'Duplicate incident replaced after review' });
    await j.json(endpoint, 'GET', undefined, 404);
    await eventually(() => j.publicText('/history'), body => !body.includes(incident.title), 'audited incident removed from public history');
    const audit = await j.json('/api/app/audit-log?limit=100');
    assert.ok(audit.entries.some(row => row.entityId === incident.id && row.reason === 'Duplicate incident replaced after review'));

    // A never-published incident has no historical peak to retain after its
    // sole component is detached. A complete reviewed draft still needs an
    // affected component before it may become public.
    await owner();
    const unclaimed = await j.incident('Unpublished incident with no affected component', [component]);
    await j.json(`/api/app/incidents/${unclaimed.id}/components/${component.id}`, 'DELETE');
    const detached = await j.read(unclaimed.id);
    assert.deepEqual(detached.components, []);
    assert.equal(detached.impact, null);
    assert.equal(detached.effectiveImpact, 'none');
    await saveReviewed(unclaimed.id, { customerImpact: 'A complete draft must not publish without an affected component.' });
    const prepared = await j.read(unclaimed.id);
    assert.ok(prepared.draft);
    assert.deepEqual(prepared.components, []);
    assert.deepEqual(prepared.updates, []);
    const publications = async () => (await j.db.prepare('SELECT * FROM incident_updates ORDER BY id').all()).results;
    const beforePublications = await publications();
    assert.ok(beforePublications.length > 0, 'the unchanged-publication control contains the earlier committed updates');
    const publicPaths = ['/', '/history', '/feed.atom', '/api/public/status'];
    const beforePublic = await Promise.all(publicPaths.map(path => j.publicText(path)));
    const refusal = await j.publish(unclaimed.id, {}, 400);
    assert.equal(refusal.error, 'Attach at least one component before publishing.');
    assert.deepEqual(await j.read(unclaimed.id), prepared, 'refusal leaves the reviewed draft and unpublished incident unchanged');
    assert.deepEqual(await publications(), beforePublications, 'refusal adds no publication and changes no earlier publication');
    assert.deepEqual(await Promise.all(publicPaths.map(path => j.publicText(path))), beforePublic, 'refusal leaves every checked public surface unchanged');
    for (const body of beforePublic) assert.ok(!body.includes(unclaimed.title));
  } finally { await j.close(); }
});

test('MAINT-001 MAINT-002 MAINT-003 MAINT-004 MAINT-005 MAINT-006 MAINT-007 MAINT-009 MAINT-013 — owner schedules, announces, starts, extends and completes maintenance without losing window or calendar history', async () => {
  const j = await openStatusJourney({ workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  try {
    const component = await j.component('Scheduled database service');
    const operatorComponent = await j.component('Database console');
    const incidentComponent = await j.component('Database replication');
    await j.json(`/api/app/components/${operatorComponent.id}/standing-claim`, 'PUT', { state: 'Degraded performance' });
    const incident = await j.incident('Database replication unavailable', [incidentComponent]);
    await j.save(incident.id);
    await j.publish(incident.id);
    const publishedIncident = await j.read(incident.id);
    const standingClaims = async () => (await j.db.prepare('SELECT * FROM component_standing_claims ORDER BY component_id, id').all()).results;
    const incidentClaims = async () => (await j.db.prepare('SELECT * FROM incident_components WHERE incident_id = ? ORDER BY component_id, id').bind(incident.id).all()).results;
    const retainedStanding = await standingClaims();
    const retainedIncident = await incidentClaims();
    assert.equal(retainedStanding.length, 1);
    assert.equal(retainedStanding[0].component_id, operatorComponent.id);
    assert.equal(retainedStanding[0].state, 'Degraded performance');
    assert.equal(retainedIncident.length, 1);
    assert.equal(retainedIncident[0].component_id, incidentComponent.id);
    assert.equal(retainedIncident[0].incident_id, incident.id);
    assert.equal(retainedIncident[0].state, 'Major outage');
    assert.ok(retainedIncident[0].published_at);
    await assertEmptyCalendar(j);
    const now = Date.now();
    const startsAt = new Date(now + 3600000).toISOString();
    const endsAt = new Date(now + 7200000).toISOString();
    const input = { title: 'Database capacity upgrade ;,\\\n' + 'é'.repeat(70), affectedAudience: 'Customers using the database', customerImpact: 'Writes may pause during the upgrade.', startsAt, endsAt, componentIds: [component.id, operatorComponent.id, incidentComponent.id], autoStart: true, autoComplete: false };
    const maintenance = (await j.json('/api/app/maintenance', 'POST', input, 201)).maintenance;
    const endpoint = `/api/app/maintenance/${maintenance.id}`;
    const list = async () => (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === maintenance.id);
    const attachments = async () => (await j.db.prepare('SELECT * FROM maintenance_components WHERE maintenance_id = ? ORDER BY component_id').bind(maintenance.id).all()).results;
    const retainedAttachments = await attachments();
    assert.deepEqual(retainedAttachments.map(row => [row.component_id, row.state]),
      [...input.componentIds].sort().map(id => [id, 'Under maintenance']));
    let statusIncident = incident;
    const reconcileClaims = async (phase, controlState, active) => {
      assert.equal((await list()).state, phase);
      assert.deepEqual(await standingClaims(), retainedStanding, `${phase}: the exact standing claim survives`);
      assert.deepEqual(await incidentClaims(), retainedIncident, `${phase}: the exact published incident claim survives`);
      const currentIncident = await j.read(incident.id);
      assert.equal(currentIncident.lifecycle, 'Identified');
      assert.deepEqual(currentIncident.components, publishedIncident.components, `${phase}: native incident attachments are unchanged`);
      assert.deepEqual(await attachments(), retainedAttachments, `${phase}: every maintenance attachment is retained`);
      const activeClaims = (await j.db.prepare(`SELECT attached.* FROM maintenance_components AS attached
        JOIN maintenance AS window ON window.id = attached.maintenance_id
        WHERE window.id = ? AND window.state = 'In progress' ORDER BY attached.component_id`).bind(maintenance.id).all()).results;
      assert.deepEqual(activeClaims, active ? retainedAttachments : [], `${phase}: only an in-progress window contributes maintenance claims`);
      const expected = [[component.id, controlState], [operatorComponent.id, 'Degraded performance'], [incidentComponent.id, 'Major outage']];
      const operatorRows = (await j.json('/api/app/components')).components;
      assert.deepEqual(expected.map(([id]) => [id, operatorRows.find(row => row.id === id)?.publicState]), expected, `${phase}: operator aggregates`);
      assert.equal(operatorRows.find(row => row.id === operatorComponent.id).standingClaimState, 'Degraded performance');
      const publicRows = await eventually(async () => (await (await j.publicResponse('/api/public/v1/components')).json()).data,
        rows => expected.every(([id, state]) => rows.find(row => row.id === id)?.state === state), `${phase}: public aggregates`);
      assert.deepEqual(expected.map(([id]) => [id, publicRows.find(row => row.id === id)?.state]), expected);
      const status = await eventually(async () => (await (await j.publicResponse('/api/public/status')).json()),
        row => active ? row.maintenance?.reference === maintenance.reference : row.maintenance === null, `${phase}: public maintenance state`);
      assert.equal(status.overall, 'Major outage');
      assert.equal(status.incident.reference, statusIncident.reference);
    };
    await reconcileClaims('Scheduled', 'Operational', false);
    assert.ok(maintenance.reference);
    const separateIncident = await maintenanceIdentityFlow(j, component, maintenance, input, { attached: [component, operatorComponent, incidentComponent], priorIncidents: 1 });
    statusIncident = separateIncident;
    const uid = `lamp-maintenance-${maintenance.id}@lamp`;
    const readCalendar = async () => {
      const response = await j.publicResponse('/maintenance.ics');
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /^text\/calendar/);
      const body = await response.text(), events = validateMaintenanceCalendar(body);
      return { body, events, event: events.find(event => event.getFirstPropertyValue('uid') === uid) };
    };
    let calendar = await eventually(readCalendar, value => Boolean(value.event), 'scheduled calendar event');
    assert.equal(calendar.event.getFirstPropertyValue('summary'), input.title);
    assert.equal(calendar.event.getFirstPropertyValue('status'), 'CONFIRMED');
    assert.equal(calendar.event.getFirstPropertyValue('sequence'), 0);
    assert.equal(calendar.event.getFirstPropertyValue('dtstart').toJSDate().getTime(), Math.floor(Date.parse(startsAt) / 1000) * 1000);
    assert.ok(!(await j.json('/api/app/incidents')).incidents.some(row => row.id === maintenance.id));
    await j.visible(`/maintenance/${maintenance.reference}`, input.customerImpact);
    await j.tick(now + 1000); await j.tick(now + 1000);
    assert.equal((await list()).notices.filter(row => row.kind === 'reminder').length, 1);
    const actualStart = new Date(now - 7200000).toISOString();
    const elapsedEnd = new Date(Date.now() - 15 * 60000 + 30000).toISOString();
    await j.json(`${endpoint}/window`, 'PUT', { startsAt: actualStart, endsAt: elapsedEnd });
    await j.tick(Date.now());
    assert.equal((await list()).state, 'In progress');
    await reconcileClaims('In progress', 'Under maintenance', true);
    const sharedStatus = await eventually(async () => (await (await j.publicResponse('/api/public/status')).json()), value => value.maintenance?.reference === maintenance.reference, 'active shared status');
    assert.equal(sharedStatus.incident.reference, separateIncident.reference);
    assert.equal(sharedStatus.maintenance.reference, maintenance.reference);
    assert.equal((await list()).overrunning, false, 'an unfinished window has no overrun label before fifteen minutes');
    calendar = await eventually(readCalendar, value => value.event?.getFirstPropertyValue('sequence') === 1, 'rescheduled calendar event');
    assert.equal(calendar.event.getFirstPropertyValue('uid'), uid);
    assert.equal(calendar.event.getFirstPropertyValue('dtstart').toJSDate().getTime(), Math.floor(Date.parse(actualStart) / 1000) * 1000);
    assert.equal(calendar.event.getFirstPropertyValue('dtend').toJSDate().getTime(), Math.floor(Date.parse(elapsedEnd) / 1000) * 1000);
    // Public HTML localizes the human date; its semantic time attributes
    // carry the exact owner-selected window for browsers and calendar readers.
    const publicWindow = ends => eventually(() => j.publicText(`/maintenance/${maintenance.reference}`), html => html.includes(`data-maintenance-ends-at="${ends}"`) && html.includes(`<time datetime="${actualStart}"`), 'public maintenance window');
    const beforeOverrun = await publicWindow(elapsedEnd);
    assert.ok(!beforeOverrun.includes('Running longer than planned'));
    const initialPage = await j.publicResponse('/');
    const oldValidator = initialPage.headers.get('etag');
    assert.ok(Date.parse(initialPage.headers.get('x-lamp-snapshot-generated-at')) < Date.parse(elapsedEnd) + 15 * 60000);
    assert.ok(!(await initialPage.text()).includes('Running longer than planned'));
    await new Promise(resolve => setTimeout(resolve, Math.max(0, Date.parse(elapsedEnd) + 15 * 60000 - Date.now()) + 100));
    const aged = await j.raw(j.publicOrigin + '/', { headers: { 'If-None-Match': oldValidator } });
    assert.equal(aged.status, 200);
    assert.notEqual(aged.headers.get('etag'), oldValidator);
    for (const html of [await aged.text(), await j.publicText(`/maintenance/${maintenance.reference}`)]) {
      assert.ok(html.includes('Running longer than planned'));
      assert.ok(html.includes(`data-maintenance-ends-at="${elapsedEnd}"`), 'the overrun keeps its original end beside the warning');
    }
    assert.equal((await list()).overrunning, true);
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === component.id).publicState, 'Under maintenance');
    await j.tick(now + 3 * 3600000);
    assert.equal((await list()).state, 'In progress', 'an unchecked automatic completion never ends the window');
    await reconcileClaims('In progress', 'Under maintenance', true);
    const later = new Date(now + 4 * 3600000).toISOString();
    await j.json(`${endpoint}/window`, 'PUT', { startsAt: actualStart, endsAt: later });
    assert.equal((await list()).startsAt, actualStart);
    assert.equal((await list()).endsAt, later);
    assert.equal((await list()).overrunning, false);
    await reconcileClaims('In progress', 'Under maintenance', true);
    assert.ok(!(await publicWindow(later)).includes('Running longer than planned'));
    const extendedPage = await eventually(() => j.publicText('/'), html => html.includes(`data-maintenance-ends-at="${later}"`), 'extended public window');
    assert.ok(!extendedPage.includes('Running longer than planned'));
    calendar = await eventually(readCalendar, value => value.event?.getFirstPropertyValue('sequence') === 2, 'extended calendar event');
    assert.equal(calendar.event.getFirstPropertyValue('uid'), uid);
    await j.json(`${endpoint}/complete`, 'POST', {});
    await j.json(`${endpoint}/complete`, 'POST', {}, 409);
    const completed = await eventually(list, row => row.state === 'Completed', 'manual completion');
    await reconcileClaims('Completed', 'Operational', false);
    assert.ok(completed.notices.some(row => row.kind === 'started'));
    assert.equal(completed.notices.filter(row => row.kind === 'completed').length, 1);
    assert.ok(!(await j.visible(`/maintenance/${maintenance.reference}`, 'Completed')).includes('Running longer than planned'));
    await eventually(readCalendar, value => !value.event, 'completed window leaves the calendar');
    assert.ok(completed.notices.some(row => row.kind === 'rescheduled'));
    assert.equal((await j.json('/api/app/components')).components.find(row => row.id === component.id).publicState, 'Operational');
    await j.save(separateIncident.id, { lifecycle: 'Resolved', nextUpdateAt: null });
    await j.publish(separateIncident.id);
    const sharedHistory = await j.visible('/history', input.title.trim());
    assertSeparateRecords(sharedHistory, separateIncident, maintenance, 'history-item');
    const feed = await j.visible('/feed.atom', input.customerImpact);
    assert.ok(feed.includes(maintenance.reference));
    const cancelled = (await j.json('/api/app/maintenance', 'POST', { ...input, title: 'Cancelled upgrade' }, 201)).maintenance;
    await j.json(`/api/app/maintenance/${cancelled.id}/window`, 'PUT', { startsAt: new Date(now + 5 * 3600000).toISOString(), endsAt: new Date(now + 6 * 3600000).toISOString() });
    await j.json(`/api/app/maintenance/${cancelled.id}/cancel`, 'POST', {});
    assert.equal((await j.json('/api/app/maintenance')).maintenance.find(row => row.id === cancelled.id).state, 'Cancelled');
    await eventually(readCalendar, value => value.events.some(event => event.getFirstPropertyValue('uid') === `lamp-maintenance-${cancelled.id}@lamp` && event.getFirstPropertyValue('status') === 'CANCELLED'), 'cancelled calendar event');
    const internal = await j.component('Internal database topology', { internal: true });
    const hidden = (await j.json('/api/app/maintenance', 'POST', { ...input, title: 'Internal-only upgrade', componentIds: [internal.id] }, 201)).maintenance;
    const barrier = (await j.json('/api/app/maintenance', 'POST', { ...input, title: 'Public calendar generation barrier', componentIds: [component.id, internal.id] }, 201)).maintenance;
    calendar = await eventually(readCalendar, value => value.body.includes(barrier.id), 'later public calendar generation');
    for (const privateValue of [hidden.id, hidden.title, internal.id, internal.name]) assert.ok(!calendar.body.includes(privateValue), 'a later calendar generation excludes internal-only windows and component details');
    // A second window keeps automatic completion on and proves both scheduled
    // transitions, rather than treating manual completion as a Cron result.
    const automatic = (await j.json('/api/app/maintenance', 'POST', { ...input, title: 'Automatic maintenance', startsAt: new Date(now - 7200000).toISOString(), endsAt: new Date(now - 3600000).toISOString(), autoComplete: true }, 201)).maintenance;
    await j.tick(Date.now()); await j.tick(Date.now());
    assert.equal((await j.json('/api/app/maintenance')).maintenance.find(row => row.id === automatic.id).state, 'Completed');

    // A future window proves both deadlines without backdating the record or
    // asking an operator to start or complete it. Move Date as well as Cron's
    // event time so the real maintenance scheduler observes each boundary.
    const boundedStart = Date.now() + 10 * 60000;
    const boundedEnd = boundedStart + 20 * 60000;
    const bounded = (await j.json('/api/app/maintenance', 'POST', {
      ...input, title: 'Future automatic database maintenance',
      startsAt: new Date(boundedStart).toISOString(), endsAt: new Date(boundedEnd).toISOString(), autoComplete: true,
    }, 201)).maintenance;
    const readBounded = async () => (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === bounded.id);
    const advanceAndTick = async at => {
      assert.equal((await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now: at }) })).status, 204);
      await j.tick(at);
    };
    await advanceAndTick(boundedStart - 1);
    const beforeStart = await readBounded();
    assert.equal(beforeStart.state, 'Scheduled', 'automatic maintenance cannot start before its window');
    assert.equal(beforeStart.completedAt, null);
    assert.deepEqual(beforeStart.notices.filter(row => ['started', 'completed'].includes(row.kind)), []);
    await j.visible(`/maintenance/${bounded.reference}`, 'Scheduled');

    const startDeadline = boundedStart + 240000;
    await advanceAndTick(startDeadline);
    const started = await readBounded();
    assert.equal(started.state, 'In progress', 'automatic start meets the 240-second deadline');
    const startedNotices = started.notices.filter(row => row.kind === 'started');
    assert.equal(startedNotices.length, 1);
    assert.equal(startedNotices[0].authorOperatorId, null);
    assert.equal(startedNotices[0].publishedAt, new Date(startDeadline).toISOString());
    assert.equal(started.notices.filter(row => row.kind === 'completed').length, 0);
    await j.visible(`/maintenance/${bounded.reference}`, 'In progress');
    await j.tick(startDeadline);
    assert.deepEqual(await readBounded(), started, 'a repeated start tick adds no notice or transition');

    await advanceAndTick(boundedEnd - 1);
    const beforeEnd = await readBounded();
    assert.equal(beforeEnd.state, 'In progress', 'automatic completion cannot precede the window end');
    assert.equal(beforeEnd.completedAt, null);
    assert.deepEqual(beforeEnd.notices, started.notices);

    const completionDeadline = boundedEnd + 240000;
    await advanceAndTick(completionDeadline);
    const finished = await readBounded();
    assert.equal(finished.state, 'Completed', 'automatic completion meets the 240-second deadline');
    assert.equal(finished.completedAt, new Date(completionDeadline).toISOString());
    assert.deepEqual(finished.notices.filter(row => row.kind === 'started'), startedNotices);
    const completedNotices = finished.notices.filter(row => row.kind === 'completed');
    assert.equal(completedNotices.length, 1);
    assert.equal(completedNotices[0].authorOperatorId, null);
    assert.equal(completedNotices[0].publishedAt, new Date(completionDeadline).toISOString());
    await j.visible(`/maintenance/${bounded.reference}`, 'Completed');
    await j.tick(completionDeadline);
    await advanceAndTick(completionDeadline + 60000);
    assert.deepEqual(await readBounded(), finished, 'repeated completion ticks retain exactly one notice for each transition');
  } finally { await j.close(); }
});

test('UPDATE-006 — reviewed scheduled publication meets its deadline after complete public and subscriber silence', scheduledUpdateFlow);
test('MAINT-005 — subscribers receive scheduling, the exact twenty-four-hour reminder, start and completion once', { timeout: 120_000 }, maintenanceReminderFlow);

test('MAINT-006 — rescheduling and cancellation retain the notified audience and cancelled public history', { timeout: 120_000 }, maintenanceAudienceFlow);

test('INCIDENT-012 — linked operators run a whole private incident draft, preview and explicit publication through signed Slack and Teams', chatDeskNativeFlow);

test('AGENT-005 HIST-002 — cited report reconciles the retained record, requires human explanations and publishes immutable text', async t => {
  const j = await openStatusJourney();
  try {
    const component = await j.component('Synthetic Lamp report service');
    const secret = 'synthetic-lamp-report-1';
    const source = (await j.json('/api/app/intake/sources', 'POST', {
      name: 'Synthetic Lamp responders', preset: 'pagerduty', credentialKind: 'hmac-sha256', signingSecret: secret,
      labelMatchers: [{ componentId: component.id, labels: { service_id: 'synthetic-lamp-service-1' } }],
    }, 201)).source;
    const events = ['triggered', 'acknowledged', 'escalated', 'resolved'].map((action, index) => ({ event: {
      id: `synthetic-lamp-event-${index}`, event_type: `incident.${action}`,
      occurred_at: `2026-10-20T01:0${index}:00.000Z`, agent: { summary: `Synthetic Lamp responder ${index}` },
      data: { id: 'synthetic-lamp-incident-1', title: `Report evidence ${action}\ncontinued source detail`, service: { id: 'synthetic-lamp-service-1' } },
    } }));
    const send = async payload => {
      const body = JSON.stringify(payload);
      const response = await j.raw(source.endpointUrl, { method: 'POST', headers: {
        'Content-Type': 'application/json', 'X-PagerDuty-Signature': `v1=${createHmac('sha256', secret).update(body).digest('hex')}`,
      }, body });
      assert.equal(response.status, 202, await response.clone().text());
      return response.json();
    };
    const firstReceipt = await send(events[0]);
    const id = firstReceipt.incidentId;
    const initial = await j.read(id);
    const openedAt = initial.openedAt;
    const endpoint = `/api/app/incidents/${id}`;
    const reportPath = `${endpoint}/report`;
    await j.json(`${reportPath}/draft`, 'POST', {}, 409);
    const internalNote = 'PRIVATE report investigation must never become a source';
    await j.json(`${endpoint}/internal-notes`, 'POST', { body: internalNote }, 201);
    const publications = [];
    const publish = async (lifecycle, customerImpact) => {
      const fields = { lifecycle, affectedAudience: 'Customers of the report service.', customerImpact,
        whatStillWorks: 'Saved receipts remain readable.', details: `Reviewed ${lifecycle} customer facts.`,
        nextUpdateAt: lifecycle === 'Resolved' ? null : new Date(Date.now() + 3600_000).toISOString() };
      await j.save(id, fields);
      const update = (await j.publish(id, lifecycle === 'Resolved' ? { overrideReason: 'Operator verified service recovery independently.' } : {})).update;
      for (const [key, value] of Object.entries(fields)) assert.equal(update[key], value);
      publications.push(update);
      return update;
    };
    await publish('Identified', 'Report service requests fail.');
    const receiptIds = [firstReceipt.receiptId];
    for (const event of events.slice(1)) {
      const accepted = await send(event);
      assert.equal(accepted.incidentId, id);
      receiptIds.push(accepted.receiptId);
    }
    await publish('Monitoring', 'Report service requests are recovering.');
    const resolution = await publish('Resolved', 'Report service requests work again.');
    const brief = (await j.json(`${endpoint}/brief`)).brief;
    assert.equal(brief.incident.openedAt, openedAt, 'opening is retained independently of the report generator');
    const receipts = (await j.json('/api/app/intake/receipts?limit=250')).receipts.filter(row => row.incidentId === id);
    assert.deepEqual(receipts.map(row => row.id).sort(), receiptIds.toSorted());
    assert.equal(brief.whatWeKnow.alerts.length, events.length);
    assert.equal(brief.whatWeKnow.updates.length, publications.length);
    const publicBeforeDraft = await j.visible(`/incidents/${initial.reference}`, resolution.customerImpact);
    const generated = await j.json(`${reportPath}/draft`, 'POST', {});
    const report = generated.report;
    const persisted = async () => j.db.prepare('SELECT * FROM incident_reports WHERE incident_id = ?').bind(id).first();
    assert.deepEqual((await j.json(reportPath)).report, report);
    assert.equal(report.publishedAt, null);
    assert.ok(report.summary.includes(`Recorded incident window: ${openedAt} to published resolution ${resolution.publishedAt}`));
    assert.match(report.summary, /not a measurement of customer downtime/);
    const lines = report.timeline.split('\n');
    const refs = lines.map(line => {
      const citations = [...line.matchAll(/\[([^\]\r\n]+)\]/g)].map(match => match[1]);
      assert.equal(citations.length, 1, 'each timeline line has exactly one real citation');
      return citations[0];
    });
    const facts = [...brief.whatWeKnow.alerts, ...brief.whatWeKnow.updates];
    assert.equal(lines.length, events.length + publications.length);
    assert.deepEqual(refs.toSorted(), facts.map(row => row.ref).toSorted(), 'every available alert and published update is cited exactly once');
    assert.deepEqual(generated.review.evidenceRefs.toSorted(), refs.toSorted());
    const eventTimes = [];
    for (const payload of events) {
      const fact = brief.whatWeKnow.alerts.find(row => row.payload.event.id === payload.event.id);
      assert.ok(fact, 'the native brief retains each submitted responder event');
      const receipt = receipts.find(row => row.id === receiptIds[events.indexOf(payload)]);
      assert.equal(fact.receivedAt, receipt.receivedAt);
      const line = lines[refs.indexOf(fact.ref)];
      assert.ok(line.startsWith(`${receipt.receivedAt} — `));
      for (const text of [source.name, payload.event.data.title.replace(/\s+/g, ' '), payload.event.agent.summary,
        payload.event.occurred_at, payload.event.event_type.slice('incident.'.length), payload.event.event_type === 'incident.resolved' ? 'recovered' : 'firing']) assert.ok(line.includes(text), `responder line retains ${text}`);
      eventTimes.push(receipt.receivedAt);
    }
    for (const update of publications) {
      const fact = brief.whatWeKnow.updates.find(row => row.publishedAt === update.publishedAt && row.customerImpact === update.customerImpact);
      assert.ok(fact, 'the brief retains each independently captured publication');
      const line = lines[refs.indexOf(fact.ref)];
      assert.ok(line.startsWith(`${update.publishedAt} — `));
      for (const field of ['lifecycle', 'affectedAudience', 'customerImpact', 'whatStillWorks', 'details']) assert.ok(line.includes(update[field]));
      eventTimes.push(update.publishedAt);
    }
    assert.deepEqual(lines.map(line => line.split(' — ')[0]), eventTimes.toSorted(), 'all source lines follow their recorded times');
    assert.ok(!JSON.stringify(generated).includes(internalNote));
    for (const field of ['cause', 'remediation']) {
      assert.equal(report[field], '');
      assert.equal(generated.review[field].required, true);
      assert.ok(generated.review[field].prompt.trim());
    }
    t.diagnostic('PROBE AGENT-005 1-3: signed responder intake, brief and report draft -> all four responder alerts and three publications cited once, recorded opening-to-resolution window, empty flagged explanations; private notes absent');
    const complete = { summary: report.summary, timeline: report.timeline, cause: 'The operator confirmed an exhausted worker pool.', remediation: 'The operator restored capacity and added saturation alerts.' };
    const unchangedDraft = await persisted();
    await j.json(`${reportPath}/draft`, 'POST', {}, 409);
    assert.deepEqual(await persisted(), unchangedDraft, 'drafting never replaces an existing report');
    const invalid = [
      { cause: '', remediation: complete.remediation },
      { cause: generated.review.cause.prompt, remediation: complete.remediation },
      { cause: complete.cause, remediation: '' },
      { cause: complete.cause, remediation: generated.review.remediation.prompt },
    ];
    for (const fields of invalid) {
      await j.json(reportPath, 'PUT', { ...complete, ...fields });
      const before = await persisted();
      const resource = (await j.json(reportPath)).report;
      const refusal = await j.json(`${reportPath}/publish`, 'POST', { channels: [] }, 400);
      assert.ok(refusal.error);
      assert.deepEqual(await persisted(), before, 'refused publication changes no persisted report field');
      assert.deepEqual((await j.json(reportPath)).report, resource);
      assert.equal(await j.publicText(`/incidents/${initial.reference}`), publicBeforeDraft, 'saved and refused reports leave the complete public record unchanged');
    }
    t.diagnostic('PROBE AGENT-005 4: report save then publish with each empty field and each untouched prompt while its counterpart is complete -> four HTTP 400 refusals and identical complete persisted and public records');
    await j.json(reportPath, 'PUT', complete);
    const saved = (await j.json(reportPath)).report;
    await j.json(`${reportPath}/draft`, 'POST', {}, 409);
    assert.deepEqual((await j.json(reportPath)).report, saved);
    assert.equal(await j.publicText(`/incidents/${initial.reference}`), publicBeforeDraft);
    // A manually authored report is also protected, without any generated draft.
    const manualIncident = await j.incident('Synthetic Lamp operator report', [component]);
    await j.save(manualIncident.id, { lifecycle: 'Resolved', nextUpdateAt: null });
    await j.publish(manualIncident.id);
    const manualPath = `/api/app/incidents/${manualIncident.id}/report`;
    await j.json(manualPath, 'PUT', { ...complete, summary: 'An existing operator-authored report.' });
    const manualBefore = (await j.json(manualPath)).report;
    await j.json(`${manualPath}/draft`, 'POST', {}, 409);
    assert.deepEqual((await j.json(manualPath)).report, manualBefore);
    t.diagnostic('PROBE AGENT-005 5: redraft generated and manually authored reports; read saved draft anonymously -> HTTP 409 with unchanged reports and no public report');
    const published = (await j.json(`${reportPath}/publish`, 'POST', { channels: [] })).report;
    for (const [field, value] of Object.entries(complete)) assert.equal(published[field], value);
    const publicHtml = await j.visible(`/incidents/${initial.reference}`, complete.cause);
    const sections = descendants(parse(publicHtml)).filter(node => node.tagName === 'section' && node.attrs.some(attr => attr.name === 'class' && attr.value === 'report'));
    assert.equal(sections.length, 1);
    const rendered = node => node.nodeName === '#text' ? node.value : node.tagName === 'br' ? '\n' : (node.childNodes ?? []).map(rendered).join('');
    const fields = descendants(sections[0]).filter(node => node.tagName === 'div' && node.childNodes.some(child => child.tagName === 'dt'));
    assert.deepEqual(fields.map(node => ({ label: nodeText(node.childNodes.find(child => child.tagName === 'dt')), value: rendered(node.childNodes.find(child => child.tagName === 'dd')) })),
      Object.entries(complete).map(([field, value]) => ({ label: field[0].toUpperCase() + field.slice(1), value })));
    const publishedRow = await persisted();
    for (const action of [
      () => j.json(reportPath, 'PUT', { summary: 'Changed summary', timeline: 'Changed timeline', cause: 'Changed cause', remediation: 'Changed remediation' }, 409),
      () => j.json(`${reportPath}/draft`, 'POST', {}, 409),
      () => j.json(`${reportPath}/publish`, 'POST', { channels: [] }, 409),
    ]) {
      await action();
      assert.deepEqual(await persisted(), publishedRow, 'all published report fields and provenance remain immutable');
      assert.deepEqual((await j.json(reportPath)).report, published);
      assert.equal(await j.publicText(`/incidents/${initial.reference}`), publicHtml, 'refused edits preserve the exact public report');
    }
    assert.ok(!publicHtml.includes(internalNote));
    t.diagnostic('PROBE AGENT-005 6: publish complete report then edit, redraft and republish -> exact four public fields, HTTP 409 refusals, identical persisted provenance and public bytes');
  } finally { await j.close(); }
});
