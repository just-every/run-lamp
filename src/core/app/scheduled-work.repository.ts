import type { LampServerExtensions } from "../api/extensions";
import { lampServerExtensions } from "../../ext/index.server";
import { defaultUpdateDuePolicy, defaultIncidentEscalationPolicy } from "../features/incidents/policies";
import { HELD_SORRY_DAYS } from "../features/statuspage-import/held-sorry";

const DAY_MS = 24 * 60 * 60_000;
const REFRESH_MS = 5 * 60_000;
const PAGE_CHECK_MS = 2 * 60_000;

export interface ScheduledWork {
  automation: number;
  dependencies: number;
  metrics: number;
  subscriberExpiry: number;
  heldExpiry: number;
  restoreExpiry: number;
  incidents: number;
  maintenance: number;
  updateReminders: number;
  reports: number;
  deliveries: number;
  channels: number;
  social: number;
  sms: number;
  snapshot: number;
  pageCheck: number;
  sender: number;
}

const dueSql = `
  SELECT
    (EXISTS(SELECT 1 FROM alert_rule_work WHERE completed_at IS NULL AND attempts<5 AND next_attempt_at<=?1)
      OR EXISTS(SELECT 1 FROM alert_rule_windows WHERE completed=0 AND due_at<=?1)) AS automation,
    EXISTS(SELECT 1 FROM vendor_source_reads r WHERE read_after<=?1
      AND EXISTS(SELECT 1 FROM vendor_dependencies d WHERE d.source_url=r.source_url)) AS dependencies,
    EXISTS(SELECT 1 FROM public_metrics m WHERE (stale=0 AND last_reported_at<?2)
      OR (provider NOT IN ('push','uptime') AND sealed_credentials IS NOT NULL AND pull_after<=?1
        AND (pull_lease_until IS NULL OR pull_lease_until<=?1))
      OR NOT EXISTS(SELECT 1 FROM public_metric_series s WHERE s.metric_id=m.id))
      OR EXISTS(SELECT 1 FROM metric_points WHERE resolution=60 AND bucket<?3)
      OR EXISTS(SELECT 1 FROM metric_points WHERE resolution=3600 AND bucket<?4)
      OR EXISTS(SELECT 1 FROM metric_points WHERE resolution=86400 AND bucket<?14) AS metrics,
    (EXISTS(SELECT 1 FROM subscribers WHERE state='pending' AND created_at<=?5)
      OR EXISTS(SELECT 1 FROM incident_subscriptions WHERE ended_at IS NOT NULL)
      OR EXISTS(SELECT 1 FROM incident_subscriptions WHERE ended_at IS NULL AND include_report=0 AND resolution_at<=?6)
      OR EXISTS(SELECT 1 FROM incident_subscriptions WHERE ended_at IS NULL AND include_report=1 AND resolution_at<=?7)) AS subscriberExpiry,
    EXISTS(SELECT 1 FROM subscribers WHERE state='deactivated' AND deactivation_reason IN ('held for Sorry cutover','held for Business cutover')
      AND created_at<?8) AS heldExpiry,
    EXISTS(SELECT 1 FROM subscribers WHERE state='deactivated' AND deactivation_reason='held for page data confirmation'
      AND deactivated_at<?7) AS restoreExpiry,
    EXISTS(SELECT 1 FROM incident_drafts WHERE scheduled_publish_at IS NOT NULL AND scheduled_publish_at<=?9) AS incidents,
    (EXISTS(SELECT 1 FROM maintenance WHERE state='Scheduled' AND starts_at<=?9)
      OR EXISTS(SELECT 1 FROM maintenance m WHERE m.state='Scheduled' AND m.starts_at>?9 AND m.starts_at<=?10
        AND EXISTS(SELECT 1 FROM maintenance_notices n WHERE n.maintenance_id=m.id AND n.kind IN ('scheduled','rescheduled'))
        AND NOT EXISTS(SELECT 1 FROM maintenance_notices n WHERE n.maintenance_id=m.id
          AND (n.kind='reminder' OR (n.kind IN ('scheduled','rescheduled') AND julianday(n.published_at)>=julianday(m.starts_at,'-24 hours')))))
      OR EXISTS(SELECT 1 FROM maintenance WHERE state='In progress' AND ends_at<=?9)) AS maintenance,
    (EXISTS(SELECT 1 FROM scheduled_work_initialization WHERE completed=0)
      OR EXISTS(SELECT 1 FROM incident_update_reminder_work WHERE due_soon_sent=0 AND next_update_at BETWEEN ?17 AND ?11)
      OR EXISTS(SELECT 1 FROM incident_update_reminder_work WHERE overdue_sent=0 AND next_update_at<?17)
      OR EXISTS(SELECT 1 FROM incident_update_reminder_work WHERE escalation_sent=0 AND next_update_at<=?15)) AS updateReminders,
    (EXISTS(SELECT 1 FROM incident_report_reminder_work WHERE next_due_at<=?9)
      OR (?16=1 AND EXISTS(SELECT 1 FROM incidents WHERE lifecycle='Resolved' AND deleted_at IS NULL))) AS reports,
    (EXISTS(SELECT 1 FROM notification_outbox WHERE completed_at IS NULL AND failed_at IS NULL AND available_at<=?9)
      OR EXISTS(SELECT 1 FROM mail_provider_webhook_events INDEXED BY mail_provider_webhook_events_unapplied
        WHERE applied_at IS NULL AND provider_message_id IS NOT NULL AND unmatched_at IS NULL)) AS deliveries,
    (EXISTS(SELECT 1 FROM channel_posts WHERE enqueued_at IS NULL)
      OR EXISTS(SELECT 1 FROM subscriber_channel_posts WHERE enqueued_at IS NULL)
      OR EXISTS(SELECT 1 FROM channel_subscriber_events WHERE enqueued_at IS NULL)
      OR EXISTS(SELECT 1 FROM integration_deliveries WHERE namespace='lamp-channels' AND state='queued' AND next_at<=?1)
      OR EXISTS(SELECT 1 FROM integration_deliveries WHERE namespace='lamp-channels' AND state='sending' AND claim_until<=?1)) AS channels,
    (EXISTS(SELECT 1 FROM social_posts WHERE enqueued_at IS NULL)
      OR EXISTS(SELECT 1 FROM integration_deliveries WHERE namespace='lamp-social' AND state='queued' AND next_at<=?1)
      OR EXISTS(SELECT 1 FROM integration_deliveries WHERE namespace='lamp-social' AND state='sending' AND claim_until<=?1)) AS social,
    EXISTS(SELECT 1 FROM sms_deliveries WHERE outcome='queued') AS sms,
    (EXISTS(SELECT 1 FROM public_snapshot_work WHERE id='default' AND requested_revision>completed_revision
        AND (retry_lease_until IS NULL OR retry_lease_until<=?9))
      OR EXISTS(SELECT 1 FROM status_page_snapshot_work WHERE requested_revision
        + COALESCE((SELECT requested_revision FROM public_snapshot_work WHERE id='default'),0)>completed_revision
        AND (retry_lease_until IS NULL OR retry_lease_until<=?9))
      OR EXISTS(SELECT 1 FROM snapshot_builds WHERE status='building' AND started_at<=?12)
      OR (EXISTS(SELECT 1 FROM page_settings WHERE id='default')
        AND NOT EXISTS(SELECT 1 FROM snapshot_builds WHERE status='published' AND page_path='public' AND started_at>?12))) AS snapshot,
    (EXISTS(SELECT 1 FROM page_settings WHERE id='default')
      AND NOT EXISTS(SELECT 1 FROM setup_readiness WHERE step='page-check' AND checked_at>?13)) AS pageCheck,
    (EXISTS(SELECT 1 FROM page_settings WHERE id='default')
      AND NOT EXISTS(SELECT 1 FROM setup_readiness WHERE step IN ('sender','sender-failed') AND checked_at>?6)) AS sender
`;

export async function scheduledWork(db: D1Database, scheduledAt: number, now: number): Promise<ScheduledWork> {
  const iso = (at: number) => new Date(at).toISOString();
  const policies: LampServerExtensions["policies"] = lampServerExtensions.policies;
  const lead = policies?.["incident.update-due.v1"] ?? defaultUpdateDuePolicy;
  const escalation = policies?.["incident.escalation.v1"] ?? defaultIncidentEscalationPolicy;
  const result = await db.batch<ScheduledWork>([
    db.prepare(`INSERT INTO setup_readiness (step, evidence_key, checked_at) VALUES ('scheduler','cron',?1)
      ON CONFLICT(step) DO UPDATE SET checked_at=excluded.checked_at
      WHERE excluded.checked_at>setup_readiness.checked_at`).bind(iso(now)),
    db.prepare(dueSql).bind(
      scheduledAt, scheduledAt - 120_000, Math.floor(scheduledAt / 60_000) * 60_000 - DAY_MS,
      Math.floor(scheduledAt / 3_600_000) * 3_600_000 - 30 * DAY_MS,
      iso(scheduledAt - 3 * DAY_MS), iso(scheduledAt - DAY_MS), iso(scheduledAt - 30 * DAY_MS),
      iso(scheduledAt - HELD_SORRY_DAYS * DAY_MS), iso(now), iso(now + DAY_MS), iso(scheduledAt + lead.leadMinutes() * 60_000),
      iso(now - REFRESH_MS), iso(now - PAGE_CHECK_MS), Math.floor(scheduledAt / DAY_MS) * DAY_MS - 90 * DAY_MS,
      iso(scheduledAt - escalation.overdueMinutes() * 60_000), Number(Boolean(policies?.["postmortem.due.v1"])), iso(scheduledAt),
    ),
  ]);
  const work = result[1].results[0];
  if (!work) throw new Error("Lamp's schedule discovery did not return a work row.");
  return work;
}
