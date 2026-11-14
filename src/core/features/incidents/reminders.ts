import { ensureScheduledWork } from "../scheduled-work/repository";
import { defaultIncidentEscalationPolicy, type IncidentEscalationPolicy, type UpdateDuePolicy } from "./policies";
import { createCommunicationOwnerRepository } from "./communication-owner.repository";

export type UpdateReminderKind = "due-soon" | "overdue" | "escalation";

export interface UpdateReminderEvent {
  kind: UpdateReminderKind;
  incidentId: string;
  reference: string;
  title: string;
  updateId: string;
  nextUpdateAt: string;
  recipients?: string[];
  draftId?: string | null;
}

/** An open incident's latest published commitment that may still need a reminder. */
interface OpenCommitment { incidentId: string; reference: string; title: string; updateId: string; nextUpdateAt: string }

export interface UpdateReminders {
  /** Sends what is due at `now`, the scheduled trigger's time; returns the events sent. */
  remindDue(now: string): Promise<UpdateReminderEvent[]>;
}

export function createUpdateReminders(binding: D1Database, policy: UpdateDuePolicy, send: (event: UpdateReminderEvent) => Promise<void>, escalationPolicy: IncidentEscalationPolicy = defaultIncidentEscalationPolicy, prepareDraft?: (commitment: OpenCommitment, now: string) => Promise<string | null>): UpdateReminders {
  return {
    async remindDue(now) {
      await ensureScheduledWork(binding);
      const instant = Date.parse(now);
      const lead = policy.leadMinutes() * 60_000;
      const escalation = escalationPolicy.overdueMinutes() * 60_000;
      // Each index selects only unsent current obligations at their due time.
      // Publication and resolution maintain the derived work row atomically;
      // accumulated incident/update history is never revisited by Cron.
      const open = await binding.prepare(`WITH due AS (
          SELECT incident_id FROM (SELECT incident_id FROM incident_update_reminder_work WHERE due_soon_sent=0 AND next_update_at>=? AND next_update_at<=? ORDER BY next_update_at,incident_id LIMIT 100)
          UNION SELECT incident_id FROM (SELECT incident_id FROM incident_update_reminder_work WHERE overdue_sent=0 AND next_update_at<? ORDER BY next_update_at,incident_id LIMIT 100)
          UNION SELECT incident_id FROM (SELECT incident_id FROM incident_update_reminder_work WHERE escalation_sent=0 AND next_update_at<=? ORDER BY next_update_at,incident_id LIMIT 100)
        ) SELECT i.id AS incidentId,i.reference,i.title,w.update_id AS updateId,w.next_update_at AS nextUpdateAt
        FROM due JOIN incident_update_reminder_work w ON w.incident_id=due.incident_id JOIN incidents i ON i.id=w.incident_id
        ORDER BY w.next_update_at,w.incident_id LIMIT 100`)
        .bind(now,new Date(instant+lead).toISOString(),now,new Date(instant-escalation).toISOString()).all<OpenCommitment>();
      const sent: UpdateReminderEvent[] = [];
      for (const commitment of open.results) {
        const due = Date.parse(commitment.nextUpdateAt);
        const draftId = instant >= due - lead && instant <= due ? await prepareDraft?.(commitment, now) : null;
        const kinds: UpdateReminderKind[] = instant > due ? ["overdue"] : instant >= due - lead ? ["due-soon"] : [];
        if (instant >= due + escalationPolicy.overdueMinutes() * 60_000) kinds.push("escalation");
        for (const kind of kinds) {
          const recorded = kind === "escalation"
            ? await binding.prepare(`SELECT 1 AS sent FROM incident_update_escalations WHERE update_id = ?`).bind(commitment.updateId).first()
            : await binding.prepare(`SELECT 1 AS sent FROM incident_update_reminders WHERE update_id = ? AND kind = ?`).bind(commitment.updateId, kind).first();
          if (recorded) continue;
          // Each event freezes its recipient set in the durable idempotent queue.
          const recipients = kind === "escalation" ? undefined : await createCommunicationOwnerRepository(binding).recipients(commitment.incidentId);
          const event = { kind, ...commitment, recipients, draftId };
          await send(event);
          if (kind === "escalation") await binding.prepare(`INSERT OR IGNORE INTO incident_update_escalations (update_id, recorded_at) VALUES (?, ?)`).bind(commitment.updateId, now).run();
          else await binding.prepare(`INSERT OR IGNORE INTO incident_update_reminders (update_id, kind, recorded_at) VALUES (?, ?, ?)`).bind(commitment.updateId, kind, now).run();
          sent.push(event);
        }
      }
      return sent;
    },
  };
}

/** The operator app's view of an incident's live commitment under the policy. */
export function updateDueState(input: { lifecycle: string; nextUpdateAt: string | null; leadMinutes: number; now: number }) {
  if (input.lifecycle === "Resolved" || !input.nextUpdateAt) return { updateDueAt: null, updateDue: false, overdue: false };
  const due = Date.parse(input.nextUpdateAt);
  const overdue = due < input.now;
  const updateDue = !overdue && input.now >= due - input.leadMinutes * 60_000;
  return { updateDueAt: overdue || updateDue ? input.nextUpdateAt : null, updateDue, overdue };
}
