import assert from 'node:assert/strict';

// Admit the second person through the same invitation and sign-in doors as an
// installation. Keep the creator identity separate from the later actor.
export async function admitAttributionOperator(fixture, label) {
  const creator = (await fixture.api('/api/app/session')).body.operator;
  const email = [`synthetic-lamp-${label}`, 'example.test'].join('@');
  const invitation = await fixture.api('/api/app/operators/invite', {
    method: 'POST', body: JSON.stringify({ email, displayName: `Synthetic Lamp ${label}` }),
  });
  assert.equal(invitation.status, 202, invitation.text);
  await fixture.signIn(email);
  const actor = (await fixture.api('/api/app/session')).body.operator;
  assert.notEqual(actor.id, creator.id, 'the acting person is independently admitted');
  assert.equal(actor.email, email);
  return { creator, actor, email };
}

export async function actorAudits(fixture, entityType, entityId, action) {
  return (await fixture.db.prepare('SELECT * FROM audit_entries WHERE entity_type = ? AND entity_id = ? AND action = ? ORDER BY id')
    .bind(entityType, entityId, action).all()).results;
}

export async function assertActorAudit(fixture, entityType, entityId, action, actor, before = []) {
  const rows = await actorAudits(fixture, entityType, entityId, action);
  const added = rows.filter(row => !before.some(prior => prior.id === row.id));
  assert.equal(added.length, 1, `${action}: one audit belongs to the native action`);
  const stored = added[0];
  assert.equal(stored.operator_id, actor.id, `${action}: the audit records the actor`);
  const response = await fixture.api(`/api/app/audit-log?action=${action}&actorId=${actor.id}&limit=100`);
  assert.equal(response.status, 200, response.text);
  const visible = response.body.entries.filter(row => row.id === stored.id);
  assert.equal(visible.length, 1, 'the exact durable audit is independently readable');
  assert.equal(visible[0].entityType, entityType);
  assert.equal(visible[0].entityId, entityId);
  assert.equal(visible[0].actorId, actor.id);
  assert.equal(visible[0].createdAt, stored.created_at);
  return stored;
}

export async function assertPublicationActor(j, incidentId, update, actor) {
  assert.equal(update.authorOperatorId, actor.id);
  const readback = (await j.read(incidentId)).updates.find(row => row.id === update.id);
  assert.equal(readback.authorOperatorId, actor.id, 'native publication readback names its publisher');
  const stored = await j.db.prepare('SELECT * FROM incident_updates WHERE id = ?').bind(update.id).first();
  assert.equal(stored.author_operator_id, actor.id, 'publication storage names its publisher');
  const audit = await assertActorAudit(j, 'incident-update', update.id, 'published', actor);
  assert.equal(JSON.parse(audit.payload_json).correctsUpdateId, update.correctsUpdateId);
  assert.equal(audit.created_at, stored.created_at);
}

export async function assertMaintenanceActor(j, maintenanceId, kind, actor, before) {
  const record = (await j.json('/api/app/maintenance')).maintenance.find(row => row.id === maintenanceId);
  const notices = record.notices.filter(row => row.kind === kind);
  const notice = notices.toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  assert.ok(notice, `the native record retains the ${kind} notice`);
  assert.equal(notice.authorOperatorId, actor.id);
  const stored = await j.db.prepare('SELECT * FROM maintenance_notices WHERE id = ?').bind(notice.id).first();
  assert.equal(stored.author_operator_id, actor.id);
  const audit = await assertActorAudit(j, 'maintenance', maintenanceId, 'notice-published', actor, before);
  assert.equal(audit.created_at, stored.created_at, 'the notice and its audit belong to the same action');
  return notice;
}
