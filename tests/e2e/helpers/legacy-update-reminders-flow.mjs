import assert from 'node:assert/strict';
import { openStatusJourney } from './status-journey.mjs';
import { settleOperatorEmails } from './operator-email-proof.mjs';

/** Released pre-reminder data is present before the unchanged upgrade runs.
 * Later assertions use authenticated reads and the real scheduled entry point;
 * only the mail provider is captured at its network edge. */
export async function legacyUpdateRemindersFlow(t) {
  const legacy = [
    { id: '01J00000000000000000000071', updateId: '01J00000000000000000000072', reference: 'INC-90001', commitment: '2000-01-01T12:00:00.000Z' },
    { id: '01J00000000000000000000073', updateId: '01J00000000000000000000074', reference: 'INC-90002', commitment: '2000-01-02T12:00:00.000Z' },
  ];
  const authorId = '01J00000000000000000000075';
  let seededBeforeUpgrade = false;
  const j = await openStatusJourney({
    workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts',
    beforeMigration: async ({ name, db }) => {
      if (name !== '0021_update_reminders.sql') return;
      assert.equal(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='incident_update_reminders'").first(), null, 'the reminder schema has not been introduced');
      const at = '2000-01-01T00:00:00.000Z';
      await db.prepare('INSERT INTO operators(id,email,display_name,is_setup_operator,created_at,updated_at) VALUES(?,?,?,0,?,?)')
        .bind(authorId, ['synthetic-lamp-75', 'example.test'].join('@'), 'Synthetic Lamp earlier operator', at, at).run();
      for (const record of legacy) {
        await db.prepare("INSERT INTO incidents(id,reference,title,lifecycle,opened_at,created_by_operator_id,created_at,updated_at) VALUES(?,?,?,'Investigating',?,?,?,?)")
          .bind(record.id, record.reference, `Synthetic Lamp earlier commitment ${record.reference}`, at, authorId, at, at).run();
        await db.prepare("INSERT INTO incident_updates(id,incident_id,lifecycle,affected_audience,customer_impact,next_update_at,published_at,author_operator_id,created_at,updated_at) VALUES(?,?,'Investigating',?,?,?,?,?,?,?)")
          .bind(record.updateId, record.id, 'Synthetic Lamp earlier readers', 'Requests are delayed.', record.commitment, at, authorId, at, at).run();
      }
      assert.equal((await db.prepare('SELECT count(*) AS count FROM incident_updates').first()).count, 2, 'both expired commitments exist in the old schema');
      seededBeforeUpgrade = true;
    },
  });
  const advance = async now => {
    const response = await j.raw('/test/clock', { method: 'PUT', body: JSON.stringify({ now }) });
    assert.equal(response.status, 204, await response.text());
    await j.signIn(undefined, { fresh: true });
  };
  const reminderMail = reference => j.messages.filter(message => message.subject.includes(reference) && /Lamp (?:update due at|incident is overdue for an update)/i.test(message.subject));
  try {
    assert.equal(seededBeforeUpgrade, true);
    const receipts = async () => (await j.db.prepare('SELECT update_id,kind,recorded_at FROM incident_update_reminders ORDER BY update_id,kind').all()).results;
    const backfilled = await receipts();
    assert.deepEqual(backfilled.map(({ update_id, kind }) => ({ update_id, kind })), legacy.flatMap(record => [
      { update_id: record.updateId, kind: 'due-soon' }, { update_id: record.updateId, kind: 'overdue' },
    ]));
    for (const receipt of backfilled) assert.ok(Date.parse(receipt.recorded_at) > Date.parse('2000-01-02T12:00:00.000Z'), 'the migration itself recorded the expired reminder');
    const now = Date.UTC(2030, 0, 15, 12);
    await advance(now);
    for (const record of legacy) {
      const read = await j.read(record.id);
      assert.equal(read.lifecycle, 'Investigating');
      assert.equal(read.updates[0].nextUpdateAt, record.commitment);
      assert.equal(read.updateDueAt, record.commitment, 'the legacy promise remains visible to the operator');
      assert.equal(read.overdue, true);
    }
    await j.tick(now); await j.tick(now);
    await settleOperatorEmails(j);
    for (const record of legacy) assert.equal(reminderMail(record.reference).length, 0, 'an expired pre-upgrade commitment sends neither reminder');
    assert.deepEqual(await receipts(), backfilled, 'scheduled processing retains the migration suppression receipts');

    // A new native commitment proves that this Worker and captured transport
    // still send both reminder kinds after the same upgrade.
    const component = await j.component('Synthetic Lamp upgraded reminder control');
    const current = await j.incident('Synthetic Lamp new communication promise', [component]);
    const due = now + 3_600_000;
    await j.save(current.id, { nextUpdateAt: new Date(due).toISOString() });
    await j.publish(current.id);
    await advance(due - 600_000);
    await j.tick(due - 600_000);
    await settleOperatorEmails(j);
    assert.equal(reminderMail(current.reference).filter(message => /due at/i.test(message.subject)).length, 1);
    await advance(due + 1);
    await j.tick(due + 1); await j.tick(due + 1);
    await settleOperatorEmails(j);
    assert.equal(reminderMail(current.reference).filter(message => /overdue/i.test(message.subject)).length, 1);
    for (const record of legacy) assert.equal(reminderMail(record.reference).length, 0, 'the legacy promises stay silent while new promises send normally');
    t.diagnostic('PROBE INCIDENT-010 acceptance-6: two expired commitments seeded before unchanged migration 0021, then repeated native Cron -> no due or overdue mail; a new native publication sends each reminder once.');
  } finally { await j.close(); }
}
