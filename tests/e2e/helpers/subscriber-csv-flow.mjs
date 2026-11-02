import assert from 'node:assert/strict';
import { openSubscriberManagementFixture, subscriberCsv, subscriberCsvRows, eventuallySubscriber } from './subscriber-management-fixture.mjs';
import { subscriberLimitsFlow } from './subscriber-limits-flow.mjs';

/** An owner reviews a mixed CSV, imports silently, explicitly invites, then
 * observes consent and real selected delivery. The source bytes are the input;
 * no file layout, wording or implementation fingerprint is pinned. */
export async function subscriberCsvFlow() {
  await subscriberHundredRowCsvFlow();
  const fixture = await openSubscriberManagementFixture();
  try {
    const { api, post, list, messagesFor } = fixture;
    const component = await fixture.createComponent('Imported API');
    const email = '+imported-reader@example.test', contact = 'hook-owner@example.test';
    const destination = 'https://receiver.example.test/synthetic-lamp-1';
    const csv = subscriberCsv(['email', 'webhook_url', 'contact_email', 'components'], [
      [email, '', '', component.id],
      ['', destination, contact, component.id],
      ['invalid-address', '', '', component.id],
      [email, '', '', component.id],
    ]);
    assert.equal((await fixture.raw('/api/app/subscribers/import/preview', { method: 'POST', body: JSON.stringify({ csv }) })).status, 401);
    const before = await fixture.databaseState(), mailBefore = fixture.messages.length;
    const preview = await post('/api/app/subscribers/import/preview', { csv });
    assert.equal(preview.status, 200, preview.text);
    assert.deepEqual(preview.body.counts, { created: 2, refused: 1, skipped: 1 });
    assert.ok(preview.body.rows.find(row => row.outcome === 'refused').reason);
    await fixture.assertUnchanged(before);
    const changed = await post('/api/app/subscribers/import/apply', { csv: csv.replace(email, 'changed@example.test'), reviewedFingerprint: preview.body.fingerprint });
    assert.equal(changed.status, 409, changed.text);
    await fixture.assertUnchanged(before);
    const applied = await post('/api/app/subscribers/import/apply', { csv, reviewedFingerprint: preview.body.fingerprint });
    assert.equal(applied.status, 200, applied.text);
    assert.deepEqual(applied.body.counts, preview.body.counts);
    const pending = await list();
    assert.equal(pending.length, 2);
    assert.ok(pending.every(row => row.state === 'pending' && row.componentSelections.some(selection => selection.componentId === component.id)));
    assert.equal(fixture.messages.length, mailBefore, 'review and apply never imply permission to send');
    await fixture.publish(component, 'Published before imported readers consent');
    assert.equal(fixture.messages.length, mailBefore, 'pending imported destinations receive no publication');
    const owner = (await api('/api/app/session')).body.operator;
    assert.ok(pending.every(row => row.addedBy.id === owner.id));
    const batches = await api('/api/app/subscribers/import/batches');
    assert.ok(batches.body.batches.some(row => row.batchId === applied.body.batchId && row.remaining === pending.length));
    assert.ok(!batches.text.includes(email) && !batches.text.includes(contact));
    const exported = subscriberCsvRows(await (await fixture.request('/api/app/subscribers.csv')).text());
    assert.ok(exported.some(row => row.destination === "'" + email && row.consent_at === ''), 'CSV prevents formula execution and never invents consent');
    assert.ok(exported.some(row => row.destination === destination && row.contact_email === contact));
    const invite = `/api/app/subscribers/import/${applied.body.batchId}/send-invitations`;
    assert.equal((await fixture.raw(invite, { method: 'POST', body: '{}' })).status, 401);
    assert.equal((await api(invite, { method: 'POST', headers: { 'Sec-Fetch-Site': 'cross-site' }, body: '{}' })).status, 403);
    const sent = await post(invite);
    assert.equal(sent.status, 200, sent.text);
    assert.equal(sent.body.sent, pending.length);
    assert.equal(sent.body.remaining, 0);
    for (const repeated of await Promise.all([post(invite), post(invite)])) assert.equal(repeated.body.sent, 0);
    for (const recipient of [email, contact]) assert.equal(messagesFor(recipient).length, 1, 'one deliberate invitation per imported recipient');
    assert.ok((await list()).every(row => row.state === 'pending'), 'an invitation is not consent');
    const reportBeforeConsent = (await api('/api/app/subscriber-reporting')).body;
    assert.equal(reportBeforeConsent.total, pending.length);
    const changes = report => report.daily.reduce((sum, row) => sum + row.netChange, 0);
    await fixture.confirm(email); await fixture.confirm(contact); fixture.recoverWebhook();
    const report = (await api('/api/app/subscriber-reporting')).body;
    assert.equal(changes(report), changes(reportBeforeConsent), 'consent changes eligibility, not subscriber inventory');
    assert.equal(report.total, (await list()).length);
    for (const count of report.counts) assert.equal(count.count, (await list()).filter(row => row.channel === count.channel && row.state === count.state).length);
    const reportCsv = subscriberCsvRows(await (await fixture.request('/api/app/subscriber-reporting?format=csv')).text());
    assert.equal(Number(reportCsv.find(row => row.scope === 'summary').total), report.total);
    for (const day of report.daily) {
      assert.equal(day.netChange, day.joined - day.left);
      assert.equal(day.closingInventory, day.openingInventory + day.netChange);
      const exportedDay = reportCsv.find(row => row.scope === 'daily' && row.day === day.day && row.channel === day.channel);
      assert.equal(Number(exportedDay.net_change), day.netChange);
    }
    await fixture.publish(component, 'Published after imported readers consent');
    assert.ok(messagesFor(email).some(message => message.text.includes('Requests are delayed.')));
    assert.equal(fixture.webhookRequests.length, 1);
    assert.ok((await list()).every(row => row.state === 'active'));
    const audit = await api('/api/app/audit-log?action=subscriber.imported&limit=100');
    assert.ok(pending.every(row => audit.body.entries.some(entry => entry.entityId === row.id && entry.actorId === owner.id)));
    for (const row of pending) assert.equal((await api(`/api/app/subscribers/${row.id}`, { method: 'DELETE' })).status, 204);
    const reportAfterErasure = (await api('/api/app/subscriber-reporting')).body;
    assert.equal(reportAfterErasure.total, 0);
    assert.equal(changes(reportAfterErasure), changes(report) - pending.length, 'erasure leaves the reported daily inventory once');
    assert.ok(!JSON.stringify(reportAfterErasure).includes(email) && !JSON.stringify(reportAfterErasure).includes(contact));
    const erased = await fixture.databaseState();
    for (const [table, bytes] of erased) for (const address of [email, contact, destination]) assert.ok(!bytes.includes(address), `erasure removed imported contact from ${table}`);
    await subscriberBatchAuthorityFlow(fixture);
    // The same consent/reporting journey remains usable by a Communicator.
    const communicatorEmail='synthetic-lamp-reporting@example.test';
    assert.equal((await post('/api/app/operators/invite',{email:communicatorEmail,displayName:'Synthetic Lamp reporting operator'})).status,202);
    await fixture.signIn(communicatorEmail);
    const communicator=(await api('/api/app/session')).body.operator;
    await fixture.signIn();
    assert.equal((await post(`/api/app/operators/${communicator.id}/role`,{role:'communicator'})).status,200);
    await fixture.signIn(communicatorEmail,{fresh:true});
    assert.equal((await api('/api/app/session')).body.operator.role,'communicator');
    assert.equal((await api('/api/app/subscriber-reporting')).status,200);
    const communicatorCsv=await fixture.request('/api/app/subscriber-reporting?format=csv');
    assert.equal(communicatorCsv.status,200);assert.ok(subscriberCsvRows(await communicatorCsv.text()).length);
    const addedByCommunicator=await post('/api/app/subscribers',{channel:'email',email:'synthetic-lamp-communicator-reader@example.test',componentIds:[component.id]});
    assert.equal(addedByCommunicator.status,201,addedByCommunicator.text);
    const addedId=addedByCommunicator.body.subscriber.id;
    assert.ok((await list()).some(row=>row.id===addedId));
    assert.equal((await api(`/api/app/subscribers/${addedId}`,{method:'DELETE'})).status,204);
    await fixture.signIn();
  } finally { await fixture.close(); }
  await subscriberLimitsFlow();
}

/** The contractual file is independent of the smaller duplicate, reporting and
 * erasure journey below. Compare every retained row, not only the totals. */
export async function subscriberHundredRowCsvFlow() {
  const fixture = await openSubscriberManagementFixture();
  try {
    const { api, post, list, messagesFor } = fixture;
    const first = await fixture.createComponent('Synthetic Lamp CSV first');
    const second = await fixture.createComponent('Synthetic Lamp CSV second');
    await fixture.createComponent('Synthetic Lamp CSV excluded');
    const address = name => [name, 'example.test'].join('@');
    const expected = Array.from({ length: 97 }, (_, index) => {
      const webhook = index % 2 === 1;
      return {
        channel: webhook ? 'webhook' : 'email',
        destination: webhook ? `https://receiver.example.test/synthetic-lamp-csv-${index}` : address(`synthetic-lamp-csv-${index}`),
        contact_email: webhook ? address(`synthetic-lamp-csv-contact-${index}`) : '',
        state: 'pending', components: (index % 3 === 0 ? [first.id, second.id] : index % 3 === 1 ? [second.id] : []).sort().join(';'),
        consent_at: '',
      };
    });
    const rows = expected.map(row => [row.channel === 'email' ? row.destination : '', row.channel === 'webhook' ? row.destination : '', row.contact_email, row.components]);
    rows.push(['invalid-address', '', '', first.id], ['', 'http://127.0.0.1/synthetic-lamp-1', address('synthetic-lamp-csv-unsafe'), first.id], ['', 'https://receiver.example.test/synthetic-lamp-invalid', 'invalid-contact', first.id]);
    const csv = subscriberCsv(['email', 'webhook_url', 'contact_email', 'components'], rows);
    const before = await fixture.databaseState(), mailBefore = fixture.messages.length;
    const preview = await post('/api/app/subscribers/import/preview', { csv });
    assert.equal(preview.status, 200, preview.text);
    assert.deepEqual(preview.body.counts, { created: 97, skipped: 0, refused: 3 });
    assert.deepEqual(preview.body.rows.map(row => ({ row: row.row, outcome: row.outcome })), Array.from({ length: 100 }, (_, index) => ({ row: index + 2, outcome: index < 97 ? 'created' : 'refused' })));
    assert.ok(preview.body.rows.slice(97).every(row => typeof row.reason === 'string' && row.reason.length > 0), 'each malformed row has a reviewable refusal reason');
    await fixture.assertUnchanged(before);
    assert.equal(fixture.messages.length, mailBefore, 'the complete 100-row review sends nothing');
    const changed = await post('/api/app/subscribers/import/apply', { csv: csv.replace(expected[0].destination, address('synthetic-lamp-csv-changed')), reviewedFingerprint: preview.body.fingerprint });
    assert.equal(changed.status, 409, changed.text);
    await fixture.assertUnchanged(before);
    const applied = await post('/api/app/subscribers/import/apply', { csv, reviewedFingerprint: preview.body.fingerprint });
    assert.equal(applied.status, 200, applied.text);
    assert.deepEqual(applied.body.counts, { created: 97, skipped: 0, refused: 3 });
    const pending = await list(17);
    assert.equal(pending.length, 97);
    assert.equal(new Set(pending.map(row => row.id)).size, 97);
    assert.deepEqual(pending.map(row => row.id).sort(), [...applied.body.subscriberIds].sort());
    const sort = rows => [...rows].sort((a, b) => a.destination.localeCompare(b.destination));
    const inventory = rows => sort(rows.map(row => ({ channel: row.channel, destination: row.destination, contact_email: row.contactEmail ?? '', state: row.state, components: row.componentSelections.map(item => item.componentId).sort().join(';'), consent_at: '' })));
    assert.deepEqual(inventory(pending), sort(expected), 'all 97 native records retain their independently expected channel, destination, contact and exact selection');
    const owner = (await api('/api/app/session')).body.operator;
    for (const row of pending) {
      assert.equal(row.selectionMode, row.componentSelections.length ? 'selected' : 'all');
      assert.deepEqual(row.addedBy, { id: owner.id, displayName: owner.displayName });
    }
    assert.equal(fixture.messages.length, mailBefore, 'applying all 97 pending records remains silent');
    const exportRows = async () => {
      const response = await fixture.request('/api/app/subscribers.csv');
      assert.equal(response.status, 200);
      return sort(subscriberCsvRows(await response.text()));
    };
    assert.deepEqual(await exportRows(), sort(expected), 'the pending export contains all 97 complete rows and no invented consent');
    const invite = `/api/app/subscribers/import/${applied.body.batchId}/send-invitations`;
    const remaining = async () => (await api('/api/app/subscribers/import/batches')).body.batches.find(row => row.batchId === applied.body.batchId).remaining;
    assert.equal(await remaining(), 97);
    await nonOwnerInvitationRefusalFlow(fixture, invite, remaining);
    for (const [sent, left] of [[50, 47], [47, 0], [0, 0]]) {
      const start = fixture.messages.length;
      const invited = await post(invite);
      assert.equal(invited.status, 200, invited.text);
      assert.deepEqual(invited.body, { sent, remaining: left });
      assert.equal(fixture.messages.length - start, sent);
      assert.equal(await remaining(), left);
    }
    for (const row of expected) {
      const messages = messagesFor(row.contact_email || row.destination);
      assert.equal(messages.length, 1, 'every imported recipient receives precisely one explicit confirmation');
      assert.match(messages[0].text, /\/confirm-subscription\//);
    }
    assert.deepEqual(inventory(await list(17)), sort(expected), 'invitations alone grant no consent or component changes');
    for (const row of expected.slice(0, 2)) {
      const started = Date.now();
      await fixture.confirm(row.contact_email || row.destination);
      const ended = Date.now();
      const stored = await fixture.db.prepare('SELECT a.confirmed_at AS consentAt FROM subscriber_intake a JOIN subscriber_directory s ON s.id=a.subscriber_id WHERE s.destination=?').bind(row.destination).first();
      assert.ok(Date.parse(stored.consentAt) >= started && Date.parse(stored.consentAt) <= ended, 'consent is the actual public confirmation instant');
      row.state = 'active'; row.consent_at = stored.consentAt;
    }
    assert.deepEqual(await exportRows(), sort(expected), 'all 97 exported channels, states, selections and consent instants reconcile after real confirmation');
    const audit = await api('/api/app/audit-log?action=subscriber.imported&limit=100');
    assert.equal(audit.status, 200, audit.text);
    assert.ok(pending.every(row => audit.body.entries.some(entry => entry.entityId === row.id && entry.actorId === owner.id)));
  } finally { await fixture.close(); }
}

/** The route role policy admits an Admin and a Communicator to the invitation
 * POST; only the owner's explicit action sends. Each signed-in refusal leaves
 * the mail edge, the remaining invitations and every row as they were, apart
 * from its own attributed access-denied entry. */
async function nonOwnerInvitationRefusalFlow(fixture, invite, remaining) {
  const { api, post, messages } = fixture;
  const before = await remaining();
  assert.ok(before > 0, 'the batch still has invitations to send');
  for (const role of ['admin', 'communicator']) {
    const email = [`synthetic-lamp-invitations-${role}`, 'example.test'].join('@');
    assert.equal((await post('/api/app/operators/invite', { email, displayName: `Synthetic Lamp invitations ${role}` })).status, 202);
    await fixture.signIn(email);
    const person = (await api('/api/app/session')).body.operator;
    await fixture.signIn();
    assert.equal((await post(`/api/app/operators/${person.id}/role`, { role })).status, 200);
    await fixture.signIn(email, { fresh: true });
    assert.equal((await api('/api/app/session')).body.operator.role, role);
    const state = await fixture.databaseState(), mail = messages.length;
    const refused = await post(invite);
    assert.equal(refused.status, 403, refused.text);
    assert.equal(messages.length, mail, `the ${role}'s refused invitation action sends no mail`);
    const after = await fixture.databaseState();
    const prior = JSON.parse(state.get('audit_entries')), current = JSON.parse(after.get('audit_entries'));
    const added = current.filter(row => !prior.includes(row));
    assert.equal(added.length, 1, `the ${role}'s refusal adds exactly its access-denied entry`);
    const denial = JSON.parse(added[0]);
    assert.equal(denial.action, 'access-denied');
    assert.equal(denial.operator_id, person.id);
    assert.equal(denial.entity_id, invite);
    after.set('audit_entries', JSON.stringify(current.filter(row => row !== added[0])));
    assert.deepEqual(after, state, `the ${role}'s refusal changes no other row`);
    await fixture.signIn();
    assert.equal(await remaining(), before, `the ${role}'s refusal leaves every invitation remaining`);
    const denials = await api(`/api/app/audit-log?action=access-denied&actorId=${person.id}`);
    assert.ok(denials.body.entries.some(row => row.id === denial.id && row.entityId === invite), `the owner sees the ${role}'s attributed denial`);
  }
}

/** A native Base member is a read-only Lamp Viewer. Batch invitation custody
 * remains owner-only, including after an actual invitation and confirmation. */
export async function subscriberBatchAuthorityFlow(fixture) {
  const { api, post, raw, appOrigin, messagesFor } = fixture;
  const email=['synthetic-lamp-batches-member','example.test'].join('@');
  const invitation=await post('/auth/invite',{email,displayName:'Synthetic Lamp batch viewer',role:'member'});
  assert.equal(invitation.status,202,invitation.text);
  const message=await eventuallySubscriber(()=>messagesFor(email).find(message=>message.text.includes('/auth/confirm?')),Boolean,'the Viewer invitation crosses the real mail edge');
  const token=new URL(message.text.match(/https?:\/\/[^\s]+/)[0]).searchParams.get('token');
  const confirmed=await raw('/auth/confirm',{method:'POST',headers:{Origin:appOrigin,'Content-Type':'application/json'},body:JSON.stringify({token})});
  assert.equal(confirmed.status,303,await confirmed.clone().text());
  const cookie=confirmed.headers.get('set-cookie').split(';')[0];
  const session=await raw('/api/app/session',{headers:{Cookie:cookie}});
  assert.equal(session.status,200);const person=(await session.json()).operator;assert.equal(person.role,'viewer');
  const before=await api('/api/app/subscribers/import/batches');assert.equal(before.status,200,'the owner retains the batch read');
  const denied=await raw('/api/app/subscribers/import/batches',{headers:{Cookie:cookie}});
  assert.equal(denied.status,403,'a signed-in Viewer cannot read owner invitation batches');
  assert.deepEqual((await api('/api/app/subscribers/import/batches')).body,before.body,'the refused read changes no batch');
  const audit=await api('/api/app/audit-log?action=access-denied&actorId='+person.id);
  assert.equal(audit.status,200);
  assert.ok(audit.body.entries.some(row=>row.entityId==='/api/app/subscribers/import/batches'&&row.actorId===person.id&&Number.isFinite(Date.parse(row.createdAt))));
}
