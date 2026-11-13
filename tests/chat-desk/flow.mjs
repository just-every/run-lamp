import assert from 'node:assert/strict';
import { createHmac, generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { runtime, origin, page } from './runtime.mjs';
import { waitForWorker } from '../e2e/worker-startup.mjs';
const slackFixture = JSON.parse(await readFile('tests/fixtures/chat-desk/slack.json', 'utf8'));
const teamsFixture = JSON.parse(await readFile('tests/fixtures/chat-desk/teams.json', 'utf8'));
const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 }), kid = randomBytes(12).toString('hex');
const jwk = { ...keyPair.publicKey.export({ format: 'jwk' }), kid, use: 'sig', alg: 'RS256' };
const update = () => ({ lifecycle: 'Investigating', affectedAudience: 'Synthetic API customers', customerImpact: 'Synthetic requests fail', whatStillWorks: 'The dashboard works', details: 'Engineers are investigating', nextUpdateAt: new Date(Date.now() + 3_600_000).toISOString() });
async function stop(child) { if (child?.pid && child.exitCode === null) { const done = new Promise(resolve => child.once('exit', resolve)); process.kill(-child.pid, 'SIGTERM'); await done; } }
function token(audience, { invalid = false, stale = false } = {}) {
  const now = Math.floor(Date.now() / 1000), encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const body = `${encode({ alg: 'RS256', kid })}.${encode({ iss: 'https://api.botframework.com', aud: audience, nbf: now - 60, exp: stale ? now - 1 : now + 300, serviceurl: teamsFixture.serviceUrl })}`;
  return `${body}.${(invalid ? randomBytes(256) : sign('RSA-SHA256', Buffer.from(body), keyPair.privateKey)).toString('base64url')}`;
}
async function response(response) { return { status: response.status, body: await response.json() }; }
export { jwk as chatSigningKey };

// Shared real signing and wire payloads for native and Settings browser proof.
export function chatTransports(getRuntime) {
  const slack = async (action, options = {}) => {
    const r = getRuntime();
    const payload = structuredClone(slackFixture); payload.user.id = options.unlinked ? 'synthetic-lamp-99' : payload.user.id;
    if (options.deliveryId) payload.trigger_id = options.deliveryId;
    if (options.identity) { payload.team.id = options.identity.tenant; payload.user.id = options.identity.subject; }
    payload.actions[0].value = JSON.stringify(action);
    if (options.card) {
      const button = options.card.blocks.flatMap(block => block.elements ?? []).find(element => element.text?.text === options.control);
      assert.ok(button, `Slack card exposes ${options.control}`);
      payload.actions = [structuredClone(button)];
      payload.state = { values: Object.fromEntries(options.card.blocks.filter(block => block.type === 'input').map(block => {
        const input = block.element, value = options.values?.[block.block_id] ?? input.initial_value ?? input.initial_option?.value ?? '';
        let selected;
        if (input.type === 'multi_static_select') {
          selected = { selected_options: value.map(id => { const option = input.options.find(option => option.value === id); assert.ok(option, `Slack offers ${id}`); return option; }) };
        } else if (input.type === 'static_select') {
          const option = input.options.find(option => option.value === value); assert.ok(option, `Slack offers ${value}`); selected = { selected_option: option };
        } else selected = { value };
        return [block.block_id, { [input.action_id]: selected }];
      })) };
    }
    if (options.badResponse) payload.response_url = 'https://untrusted.example.test/response';
    const raw = options.code || options.compose ? new URLSearchParams({ command: '/lamp', team_id: payload.team.id, user_id: payload.user.id, text: options.compose ? 'incident' : `link ${options.code}` }).toString() : new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const timestamp = String(Math.floor(Date.now() / 1000) - (options.stale ? 301 : 0));
    const signature = `v0=${createHmac('sha256', r.signingSecret).update(`v0:${timestamp}:${raw}`).digest('hex')}`;
    return response(await r.worker.dispatchFetch((r.origin ?? origin) + '/api/chat/slack', { method: 'POST', body: options.tampered ? `${raw}&changed=1` : raw, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Slack-Request-Timestamp': timestamp, 'X-Slack-Signature': options.invalid ? `v0=${'0'.repeat(64)}` : signature } }));
  };
  const teams = async (action, options = {}) => {
    const r = getRuntime();
    const body = structuredClone(teamsFixture);
    if (options.deliveryId) body.id = options.deliveryId;
    if (options.unlinked) body.from.aadObjectId = 'synthetic-lamp-99';
    if (options.identity) { body.channelData.tenant.id = options.identity.tenant; body.from.aadObjectId = options.identity.subject; }
    if (options.code) { body.type = 'message'; body.text = `link ${options.code}`; delete body.name; delete body.value; }
    else if (options.compose) { body.name = 'composeExtension/fetchTask'; body.value = { commandId: 'incident' }; }
    else if (options.card) {
      const control = options.card.actions.find(control => control.title === options.control);
      assert.ok(control, `Teams card exposes ${options.control}`);
      const values = Object.fromEntries(options.card.body.filter(input => input.type.startsWith('Input.')).map(input => {
        const value = options.values?.[input.id] ?? input.value ?? '';
        if (input.choices && value) for (const choice of String(value).split(',')) assert.ok(input.choices.some(option => option.value === choice), `Teams offers ${choice}`);
        return [input.id, value];
      }));
      if (control.type === 'Action.Submit') {
        body.name = 'composeExtension/submitAction';
        body.value = { commandId: 'incident', parameters: Object.entries({ ...control.data, ...values }).map(([name, value]) => ({ name, value })) };
      } else body.value.action = { ...structuredClone(control), data: { ...control.data, ...(control.associatedInputs === 'none' ? {} : values) } };
    }
    else if (options.extension) { body.name = 'composeExtension/submitAction'; body.value = { commandId: 'incident', parameters: Object.entries(action).filter(([name]) => name !== 'action').map(([name, value]) => ({ name, value })) }; }
    else body.value.action.data = action;
    return response(await r.worker.dispatchFetch((r.origin ?? origin) + '/api/chat/teams', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(options.wrongAudience ? 'synthetic-lamp-incorrect' : r.appId, options)}` } }));
  };
  return { slack, teams };
}

async function chatReviewFlow({ r, slack, teams, card, t }) {
  const reviewer = await r.db.prepare('SELECT id,email FROM oa_operators WHERE id<>?').bind(r.operator).first();
  const reviewerCookie = await r.signIn(reviewer.email);
  const identity = { tenant: 'synthetic-lamp-review-tenant', subject: 'synthetic-lamp-reviewer' };
  const component = (await r.call('/api/app/components', { groupId: null, name: 'Synthetic Lamp reviewed component', description: '', internal: false, displayOrder: 10, note: '' })).body.component;
  const records = () => Promise.all([
    'incidents', 'incident_drafts', 'incident_updates', 'incident_components', 'components',
    'component_state_history', 'component_claim_events', 'notification_channel_selections',
    'notification_outbox', 'notification_deliveries', 'audit_entries',
  ].map(async table => ({ table, rows: (await r.db.prepare(`SELECT * FROM ${table}`).all()).results.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) })));
  for (const [name, send] of [['Slack', slack], ['Teams', teams]]) {
    for (const [credential, actor] of [[r.cookie, {}], [reviewerCookie, { identity }]]) {
      const minted = await r.call('/api/app/chat-links', {}, 'POST', credential);
      assert.equal(minted.status, 201, JSON.stringify(minted.body));
      assert.equal((await send(null, { ...actor, code: minted.body.code })).status, 200);
    }
    const opened = await send({ action: 'open', title: `Synthetic Lamp ${name} reviewed publication`, components: [{ componentId: component.id, state: 'Major outage', relationship: 'Primary' }], update: { ...update(), customerImpact: '' } });
    assert.equal(opened.status, 200, JSON.stringify(opened.body));
    const { incidentId } = opened.body.result;
    const incomplete = card(name, opened.body);
    const invalidBefore = await records();
    const overlength = await send({ action: 'save', incidentId, version: opened.body.result.version, update: { ...update(), affectedAudience: 'x'.repeat(251) } });
    assert.equal(overlength.status, 400, `${name} uses the web field-length validation`);
    assert.deepEqual(await records(), invalidBefore, `${name} invalid field input changes no business records`);
    const incompletePreview = await send(null, { card: incomplete, control: 'Preview update' });
    assert.equal(incompletePreview.status, 200, JSON.stringify(incompletePreview.body));
    const invalidPublish = await send(null, { card: card(name, incompletePreview.body), control: 'Publish update' });
    assert.equal(invalidPublish.status, 409);
    assert.equal(invalidPublish.body.error, 'Who is affected and customer impact are required.');
    assert.deepEqual(await records(), invalidBefore, `${name} incomplete publication changes no business records`);
    const completed = await send(null, { card: incomplete, control: 'Save draft', values: update() });
    assert.equal(completed.status, 200, JSON.stringify(completed.body));
    const editor = card(name, completed.body);
    const before = await records();
    const publicBefore = await (await r.worker.dispatchFetch(page + '/')).text();
    const selfReview = await send(null, { card: editor, control: 'Review draft' });
    assert.equal(selfReview.status, 409);
    assert.equal(selfReview.body.error, 'A different operator must review the saved draft.');
    assert.deepEqual(await records(), before, `${name} self-review refusal changes no incident, draft, claim, history, publication, delivery or audit record`);
    const previewed = await send(null, { card: editor, control: 'Preview update' });
    assert.equal(previewed.status, 200, JSON.stringify(previewed.body));
    const unreviewed = await send(null, { card: card(name, previewed.body), control: 'Publish update' });
    assert.equal(unreviewed.status, 409);
    assert.equal(unreviewed.body.error, 'This update requires review by another operator.');
    assert.deepEqual(await records(), before, `${name} unreviewed publication refusal changes no persisted business records`);
    assert.equal(await (await r.worker.dispatchFetch(page + '/')).text(), publicBefore, `${name} refused review and publication expose no public change`);
    const reviewed = await send(null, { card: editor, control: 'Review draft', identity });
    assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
    const draft = (await r.call(`/api/app/incidents/${incidentId}`)).body.incident.draft;
    assert.equal(draft.authorOperatorId, r.operator);
    assert.equal(draft.reviewedByOperatorId, reviewer.id, `${name} distinct linked reviewer is recorded on the saved draft`);
    assert.ok(Number.isFinite(Date.parse(draft.reviewedAt)));
    const freshPreview = await send(null, { card: card(name, reviewed.body), control: 'Preview update', deliveryId: `synthetic-lamp-reviewed-${name}` });
    assert.equal(freshPreview.status, 200, JSON.stringify(freshPreview.body));
    const published = await send(null, { card: card(name, freshPreview.body), control: 'Publish update' });
    assert.equal(published.status, 200, JSON.stringify(published.body));
    const current = (await r.call(`/api/app/incidents/${incidentId}`)).body.incident;
    assert.equal(current.updates.length, 1);
    assert.equal(current.updates[0].id, published.body.result.updateId);
    assert.equal(current.updates[0].authorOperatorId, r.operator, `${name} explicit Publish retains the linked publisher's attribution`);
    assert.equal((await r.db.prepare('SELECT author_operator_id FROM incident_updates WHERE id=?').bind(published.body.result.updateId).first()).author_operator_id, r.operator);
    const audit = await r.db.prepare("SELECT operator_id FROM audit_entries WHERE action='chat-desk' AND entity_id=?").bind(published.body.result.updateId).first();
    assert.equal(audit.operator_id, r.operator);
    const publicAfter = await (await r.worker.dispatchFetch(page + `/incidents/${current.reference}`)).text();
    assert.ok(publicAfter.includes(current.title) && publicAfter.includes(draft.customerImpact), `${name} reviewed publication reaches the public incident`);
    const after = await records();
    assert.equal((await send(null, { card: card(name, freshPreview.body), control: 'Publish update' })).status, 409);
    assert.deepEqual(await records(), after, `${name} replay creates no second publication`);
    t.diagnostic(`PROBE INCIDENT-012 point 4 ${name}: signed save, review and Publish actions -> overlength, incomplete, self-review and no-review refused with unchanged records; distinct linked review and attributed publication succeeded; replay refused`);
  }
}

export async function chatDeskNativeFlow(t) {
  let r;
  try {
    r = await runtime(t, [jwk]);
    assert.equal((await r.worker.dispatchFetch(origin + '/api/app/chat-links')).status, 401, 'chat-link management requires an operator session');
    const { slack, teams } = chatTransports(() => r);
    const componentIds = [];
    for (const n of [1, 2, 3]) {
      const created = await r.call('/api/app/components', { groupId: null, name: `synthetic-lamp-${n}`, description: '', internal: false, displayOrder: n, note: '' });
      assert.equal(created.status, 201, JSON.stringify(created.body)); componentIds.push(created.body.component.id);
    }
    const count = async table => (await r.db.prepare(`SELECT count(*) AS n FROM ${table}`).first()).n;
    const unchangedTables = () => Promise.all(['incidents', 'incident_updates', 'incident_drafts', 'audit_entries'].map(count));
    const card = (name, body) => name === 'Slack' ? body : body.task?.value.card.content ?? body.value;
    for (const [name, send] of [['Slack', slack], ['Teams', teams]]) {
      t.diagnostic(`INCIDENT-012 ${name}: signed identity, private draft, shared preview, explicit attributed publication and state changes`);
      const open = { action: 'open', title: `synthetic-lamp-${name}`, components: [{ componentId: componentIds[0], state: 'Major outage', relationship: 'Primary' }], update: update() };
      const before = await count('incidents');
      const unlinkedCounts = await unchangedTables();
      assert.equal((await send(open, { unlinked: true })).status, 403); assert.equal(await count('incidents'), before);
      assert.deepEqual(await unchangedTables(), unlinkedCounts, `${name}'s unlinked actor creates no incident, update, draft or audit entry`);
      for (const options of [{ invalid: true }, { stale: true }, ...(name === 'Teams' ? [{ wrongAudience: true }] : [{ tampered: true }])]) { assert.equal((await send(open, options)).status, 401); assert.equal(await count('incidents'), before); }
      if (name === 'Slack') { assert.equal((await send(open, { badResponse: true })).status, 409); assert.equal(await count('incidents'), before); }
      let minted = await r.call('/api/app/chat-links', {}); assert.equal(minted.status, 201);
      assert.equal((await send(null, { code: minted.body.code })).status, 200);
      assert.equal((await send(null, { code: minted.body.code })).status, 409, 'a link code is single use');
      const composer = await send(null, { compose: true }); assert.equal(composer.status, 200, JSON.stringify(composer.body));
      const openControls = { card: card(name, composer.body), control: 'Open draft', values: { title: open.title, ...open.update, state: 'Major outage', components: name === 'Slack' ? [componentIds[0], componentIds[2]] : componentIds[0] } };
      const opened = await send(null, openControls); assert.equal(opened.status, 200, JSON.stringify(opened.body));
      if (name === 'Teams') assert.equal(opened.body.task.value.card.content.type, 'AdaptiveCard');
      let result = opened.body.result, id = result.incidentId, editorCard = card(name, opened.body);
      assert.equal((await r.call(`/api/app/incidents/${id}`)).body.incident.updates.length, 0);
      assert.equal((await send(null, openControls)).status, 409, 'replayed open creates no second draft');
      assert.equal(await count('incidents'), before + 1);
      const claims = rows => rows.map(({ componentId, state }) => ({ componentId, state })).sort((a, b) => a.componentId.localeCompare(b.componentId));
      if (name === 'Slack') {
        const selected = (await r.call(`/api/app/incidents/${id}`)).body.incident.components;
        assert.deepEqual(claims(selected), claims([0, 2].map(n => ({ componentId: componentIds[n], state: 'Major outage' }))), 'Slack opens exactly the selected components, excluding the unselected component');
      }
      const expectedClaims = name === 'Slack'
        ? [{ componentId: componentIds[0], state: 'Partially unavailable' }, { componentId: componentIds[2], state: 'Degraded performance' }]
        : componentIds.map(componentId => ({ componentId, state: 'Major outage' }));
      const submitted = { ...open.update, lifecycle: 'Identified' };
      {
        const attached = await send(null, { card: editorCard, control: 'Save draft', values: { ...submitted, ...Object.fromEntries(expectedClaims.map(({ componentId, state }) => [`component_${componentId}`, state])) } });
        assert.equal(attached.status, 200, JSON.stringify(attached.body)); result = attached.body.result; editorCard = card(name, attached.body);
        const staged = (await r.call(`/api/app/incidents/${id}`)).body.incident.draft.componentChanges;
        assert.deepEqual(claims(staged), claims(expectedClaims), `${name} stages exactly the selected component identities and their independent claimed states`);
      }
      const premature = await send({ action: 'publish', incidentId: id, version: result.version, previewCode: randomBytes(24).toString('hex') }); assert.equal(premature.status, 409);
      const previewed = await send(null, { card: editorCard, control: 'Preview update' }); assert.equal(previewed.status, 200, JSON.stringify(previewed.body));
      const web = await r.call(`/api/app/incidents/${id}`);
      assert.deepEqual(previewed.body.result.preview, web.body.preview, 'chat preview is UPDATE-004 renderer output');
      const next = new Date(submitted.nextUpdateAt);
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][next.getUTCMonth()];
      const fields = [
        { label: 'Who is affected', value: submitted.affectedAudience },
        { label: 'Customer impact', value: submitted.customerImpact },
        { label: 'What still works', value: submitted.whatStillWorks },
        { label: 'Next update by', value: `${month} ${next.getUTCDate()}, ${next.getUTCFullYear()}, ${next.toISOString().slice(11, 16)} UTC+00:00`, instant: submitted.nextUpdateAt },
        { label: 'Additional details', value: submitted.details },
      ];
      const expectedHeading = `${web.body.incident.reference}: ${open.title}`;
      const expectedSubject = `Synthetic Lamp: [${web.body.incident.reference}] ${open.title}`;
      const preview = previewed.body.result.preview;
      assert.equal(preview.public.heading, expectedHeading);
      assert.equal(preview.public.lifecycle, 'Identified');
      assert.deepEqual(preview.public.fields.filter(field => field.label !== 'Component state'), fields, `${name} preview independently retains every UPDATE-001 field and submitted value`);
      const componentLines = expectedClaims.map(({ componentId, state }) => `synthetic-lamp-${componentIds.indexOf(componentId) + 1}: Operational → ${state}`);
      assert.deepEqual(preview.public.fields.filter(field => field.label === 'Component state').map(field => field.value).sort(), [...componentLines].sort());
      assert.equal(preview.email.subject, expectedSubject);
      const expectedEmail = ['Synthetic Lamp', expectedHeading, 'Status: Identified', ...fields.map(field => `${field.label}: ${field.value}`), ...componentLines.map(line => `Component state: ${line}`), `Incident impact: ${name === 'Slack' ? 'Major' : 'Critical'}`].join('\n\n');
      assert.equal(preview.email.plainText, expectedEmail, `${name} email preview retains the complete independently expected message`);
      assert.ok(JSON.stringify(name === 'Teams' ? previewed.body.value : previewed.body.blocks).includes(open.update.customerImpact));
      const visible = name === 'Slack' ? previewed.body.blocks.filter(block => block.type === 'section').map(block => block.text.text).join('') : previewed.body.value.body.filter(block => block.type === 'TextBlock').map(block => block.text).join('\n');
      for (const text of [web.body.preview.public.heading, `Status: ${web.body.preview.public.lifecycle}`, ...web.body.preview.public.fields.map(field => `${field.label}: ${field.value}`), `Email subject: ${web.body.preview.email.subject}`, web.body.preview.email.plainText]) assert.ok(visible.includes(text), `${name}'s visible card carries UPDATE-004 preview: ${text}`);
      const published = await send(null, { card: card(name, previewed.body), control: 'Publish update' }); assert.equal(published.status, 200, JSON.stringify(published.body));
      assert.equal((await r.call(`/api/app/incidents/${id}`)).body.incident.updates[0].authorOperatorId, r.operator);
      const html = await (await r.worker.dispatchFetch(page + '/')).text(); assert.ok(html.includes(open.title)); assert.ok(html.includes(open.update.customerImpact));
      const snapshot = await r.db.prepare('SELECT author_operator_id FROM incident_updates WHERE id=?').bind(published.body.result.updateId).first(); assert.equal(snapshot.author_operator_id, r.operator);
      const committed = (await r.call(`/api/app/incidents/${id}`)).body.incident;
      assert.deepEqual(claims(committed.components), claims(expectedClaims), `${name} commits exactly the selected component identities and claims`);
      const committedUpdate = committed.updates.find(update => update.id === published.body.result.updateId);
      for (const [field, value] of Object.entries(submitted)) assert.equal(committedUpdate[field], value, `${name} commits submitted ${field}`);
      assert.deepEqual(committedUpdate.componentSnapshot.map(({ componentId, newState }) => ({ componentId, state: newState })).sort((a, b) => a.componentId.localeCompare(b.componentId)), claims(expectedClaims), `${name} immutable publication retains the selected claims`);
      t.diagnostic(`PROBE INCIDENT-012 points 2 and 3 ${name}: signed composer selection, save, preview and publish -> exact staged and committed claims, five narrative fields, lifecycle, commitment and complete email matched`);
      if (name === 'Teams') {
        const current = (await r.call(`/api/app/incidents/${id}`)).body.incident;
        assert.equal(current.components.find(component => component.componentId === componentIds[1]).state, 'Major outage', 'Teams component initially claims Major outage');
        assert.deepEqual(current.components.filter(component => componentIds.slice(1).includes(component.componentId)).map(({ componentId, state }) => ({ componentId, state })).sort((a, b) => a.componentId.localeCompare(b.componentId)), componentIds.slice(1).map(componentId => ({ componentId, state: 'Major outage' })).sort((a, b) => a.componentId.localeCompare(b.componentId)), 'Teams publishes both attached component identities and claimed states');
        const historyBefore = (await r.call(`/api/app/components/${componentIds[1]}/history`)).body.history;
        const saved = await send(null, { card: card(name, published.body), control: 'Save draft', values: { ...update(), lifecycle: 'Monitoring', [`component_${componentIds[1]}`]: 'Degraded performance' } });
        assert.equal(saved.status, 200, JSON.stringify(saved.body));
        const preview = await send(null, { card: card(name, saved.body), control: 'Preview update' }); assert.equal(preview.status, 200);
        const changed = await send(null, { card: card(name, preview.body), control: 'Publish update' }); assert.equal(changed.status, 200);
        const historyAfter = (await r.call(`/api/app/components/${componentIds[1]}/history`)).body.history; assert.equal(historyAfter.length, historyBefore.length + 1); assert.equal(historyAfter[0].operatorId, r.operator);
        const newHistory = historyAfter.filter(entry => !historyBefore.some(previous => previous.id === entry.id));
        assert.equal(newHistory.length, 1, 'Teams publication writes exactly one new component history entry');
        const changedUpdate = (await r.call(`/api/app/incidents/${id}`)).body.incident.updates.find(update => update.id === changed.body.result.updateId);
        assert.ok(changedUpdate, 'the component transition belongs to the published update');
        assert.deepEqual({ previousState: newHistory[0].previousState, newState: newHistory[0].newState, causeType: newHistory[0].causeType, causeId: newHistory[0].causeId, changedAt: newHistory[0].changedAt }, { previousState: 'Major outage', newState: 'Degraded performance', causeType: 'incident', causeId: id, changedAt: changedUpdate.publishedAt });
        assert.deepEqual(changedUpdate.componentChanges.filter(change => change.componentId === componentIds[1]).map(({ componentId, previousState, newState }) => ({ componentId, previousState, newState })), [{ componentId: componentIds[1], previousState: 'Major outage', newState: 'Degraded performance' }]);
        assert.equal((await r.call('/api/app/components')).body.components.find(component => component.id === componentIds[1]).publicState, 'Degraded performance');
      }
    }
    const expired = await r.call('/api/app/chat-links', {}); await r.db.prepare('UPDATE chat_link_codes SET expires_at=0').run();
    assert.equal((await slack(null, { code: expired.body.code })).status, 409);
    const links = (await r.call('/api/app/chat-links')).body.links; assert.equal(links.length, 2);
    assert.ok(!JSON.stringify((await r.db.prepare('SELECT * FROM chat_link_codes').all()).results).includes(expired.body.code));
    for (const link of links) assert.equal((await r.call(`/api/app/chat-links/${link.id}`, undefined, 'DELETE')).status, 204);
    assert.equal((await r.call('/api/app/chat-links')).body.links.length, 0);
    assert.equal((await r.db.prepare("SELECT count(*) AS n FROM audit_entries WHERE action='chat-desk'").first()).n, 7, 'two links, two removals and three explicit publications are audited');
    assert.equal(r.replies.length, 4, 'Slack draft, save, preview and publication replies use the declared response endpoint');
    assert.equal(r.requests.length, 2, 'Bot Framework metadata and keys are cached between verified activities');
    const revokeCode = (await r.call('/api/app/chat-links', {})).body.code;
    assert.equal((await slack(null, { code: revokeCode })).status, 200);
    const revokeTeamsCode = (await r.call('/api/app/chat-links', {})).body.code;
    assert.equal((await teams(null, { code: revokeTeamsCode })).status, 200);
    assert.equal(await count('chat_links'), 2, 'both signed chat identities belong to the operator before authority is revoked');
    const revoked = await r.call(`/api/app/operators/${r.operator}/revoke-access`, {}); assert.equal(revoked.status, 204, JSON.stringify(revoked.body));
    assert.equal(await count('chat_links'), 0, 'revoking an operator removes chat identities');
    assert.equal(await count('chat_link_codes'), 0, 'revoking an operator removes pending link authority');
    assert.equal(await count('chat_previews'), 0, 'revoking an operator removes pending preview authority');
    const refusedCounts = await Promise.all(['incidents','incident_updates','incident_drafts','audit_entries'].map(count));
    for (const [name, send] of [['Slack', slack], ['Teams', teams]]) {
      const refused = await send({ action: 'open', title: `synthetic-lamp-revoked-${name}`, components: [{ componentId: componentIds[0], state: 'Major outage', relationship: 'Primary' }], update: update() });
      assert.equal(refused.status, 403, `${name}'s signed door refuses the formerly linked actor after operator authority is revoked`);
      assert.deepEqual(await Promise.all(['incidents','incident_updates','incident_drafts','audit_entries'].map(count)), refusedCounts, `${name}'s refused actor creates no incident, update, draft or audit entry`);
    }
    await r.close(); r = await runtime(t,[jwk]);
    await (await import('./roles.mjs')).chatRoleFlow({r,slack,teams,update});
    await r.close(); r = await runtime(t, [jwk], { requireReview: true });
    await chatReviewFlow({ r, slack, teams, card, t });
    await r.close(); r = await runtime(t, [jwk], { configured: false });
    for (const endpoint of ['slack', 'teams']) assert.equal((await r.worker.dispatchFetch(`${origin}/api/chat/${endpoint}`, { method: 'POST', body: '{}' })).status, 503);
    assert.equal(await count('incidents'), 0);
  } finally {
    await r?.close();
  }
}

export async function chatDeskFlow({ t, server, appUrl, env }) {
  const spawnArgs = server.spawnargs.slice(1), spawnFile = server.spawnfile;
  await stop(server);
  await chatDeskNativeFlow(t);
  const restarted = spawn(spawnFile, spawnArgs, { cwd: process.cwd(), detached: true, stdio: 'pipe', env });
  let output = ''; restarted.stdout.on('data', chunk => output += chunk); restarted.stderr.on('data', chunk => output += chunk);
  try { await waitForWorker({ origin: appUrl, child: restarted, output: () => output, label: 'API Worker after chat proof' }); }
  catch (error) { await stop(restarted); throw error; }
  return restarted;
}
