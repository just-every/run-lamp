/** These tables are derived work, not new reminder or consent facts. A native
 * archive restores canonical rows with triggers dropped; older archives have no
 * derived tables. Reconstruct once, atomically, before their first scheduler use.
 * The marker travels with current archives and remains unset for older ones. */
const initializing = new WeakMap<D1Database, Promise<void>>();

export async function ensureScheduledWork(binding: D1Database): Promise<void> {
  const pending = initializing.get(binding);
  if (pending) return pending;
  const initialize = (async () => {
    const state = await binding.prepare("SELECT completed FROM scheduled_work_initialization WHERE id=1").first<{ completed: number }>();
    if (!state) throw new Error("Scheduled work initialization is missing.");
    if (state.completed) return;
    // Every statement checks the same durable marker. A concurrent initializer
    // which already committed makes this whole transaction an idempotent no-op.
    const uninitialized = "(SELECT completed FROM scheduled_work_initialization WHERE id=1)=0";
    await binding.batch([
      binding.prepare(`DELETE FROM incident_update_reminder_work WHERE ${uninitialized}`),
      binding.prepare(`INSERT INTO incident_update_reminder_work(incident_id,update_id,next_update_at,due_soon_sent,overdue_sent,escalation_sent)
        SELECT incident_id,update_id,next_update_at,due_soon_sent,overdue_sent,escalation_sent FROM incident_update_reminder_candidates WHERE ${uninitialized}`),
      binding.prepare(`DELETE FROM incident_report_reminder_work WHERE ${uninitialized}`),
      binding.prepare(`INSERT INTO incident_report_reminder_work(incident_id,next_due_at)
        SELECT incident_id,next_due_at FROM incident_report_reminder_candidates WHERE ${uninitialized}`),
      binding.prepare(`UPDATE scheduled_work_initialization SET completed=1 WHERE id=1 AND completed=0`),
    ]);
  })();
  initializing.set(binding, initialize);
  try { await initialize; }
  finally { initializing.delete(binding); }
}
