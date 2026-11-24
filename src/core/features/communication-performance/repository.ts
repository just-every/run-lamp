import type { ChannelFact, IncidentFact, PerformanceFacts, PostFact, SelectionFact, UpdateFact } from "./types";

export interface PerformanceScope { incidentId?: string; startsAt?: string; endsAt?: string; measuredAt: string }
export interface CommunicationPerformanceRepository {
  timezone(): Promise<string>;
  read(scope: PerformanceScope): Promise<PerformanceFacts>;
}

const widen = (instant: string, days: number) => new Date(Date.parse(instant) + days * 86_400_000).toISOString();

export function createCommunicationPerformanceRepository(db: D1Database): CommunicationPerformanceRepository {
  return {
    async timezone() {
      const settings = await db.prepare("SELECT timezone FROM page_settings WHERE id = 'default'").first<{ timezone: string }>();
      if (!settings) throw new Error("Page settings are not configured.");
      return settings.timezone;
    },
    async read(scope) {
      const parameters: string[] = [scope.measuredAt];
      const conditions = ["i.deleted_at IS NULL", "julianday(i.created_at) <= julianday(?)"];
      if (scope.incidentId) { conditions.push("i.id = ?"); parameters.push(scope.incidentId); }
      if (scope.startsAt && scope.endsAt) {
        // The text range only narrows the index seek; two days either side
        // covers any stored offset. julianday() still decides membership.
        conditions.push("i.opened_at >= ? AND i.opened_at < ?", "julianday(i.opened_at) >= julianday(?) AND julianday(i.opened_at) < julianday(?)");
        parameters.push(widen(scope.startsAt, -2), widen(scope.endsAt, 2), scope.startsAt, scope.endsAt);
      }
      const cohort = `WITH cohort AS MATERIALIZED (SELECT i.* FROM incidents i WHERE ${conditions.join(" AND ")})`;
      const imported = "EXISTS(SELECT 1 FROM statuspage_import_targets t WHERE t.kind = 'incident' AND t.id = i.id)";
      const statements = [
        db.prepare(`${cohort} SELECT i.id AS incidentId,i.reference,i.title,i.lifecycle,i.opened_at AS openedAt,i.resolved_at AS resolvedAt,i.peak_impact AS peakImpact,
          ${imported} AS retainedImport,
          (SELECT MIN(received_at) FROM alert_receipts a WHERE a.incident_id = i.id AND a.state <> 'invalid' AND a.error IS NULL AND julianday(a.received_at) <= julianday(?)) AS firstAcceptedAlertAt,
          (SELECT published_at FROM incident_reports r WHERE r.incident_id = i.id) AS reportPublishedAt FROM cohort i ORDER BY i.opened_at,i.id`).bind(...parameters, scope.measuredAt),
        db.prepare(`${cohort} SELECT u.id AS updateId,u.incident_id AS incidentId,u.lifecycle,u.published_at AS publishedAt,u.created_at AS createdAt,u.next_update_at AS nextUpdateAt,u.is_retroactive AS isRetroactive,
          (${imported} AND u.is_retroactive = 1 AND u.created_at = i.created_at) AS retainedImport
          FROM cohort i JOIN incident_updates u ON u.incident_id = i.id WHERE julianday(u.created_at) <= julianday(?) ORDER BY u.created_at,u.id`).bind(...parameters, scope.measuredAt),
        // Attempts are reduced to one row per delivery BEFORE aggregation. A
        // retried delivery never multiplies committed, outcome or reach counts.
        // Only notification_deliveries carry an incident update (component and
        // report deliveries CHECK it NULL), so the cohort seeks its own rows.
        db.prepare(`${cohort}, accepted AS MATERIALIZED (
          SELECT a.delivery_id,MIN(a.attempted_at) AS acceptedAt FROM cohort i
          CROSS JOIN incident_updates u ON u.incident_id = i.id CROSS JOIN notification_deliveries d ON d.incident_update_id = u.id
          CROSS JOIN notification_delivery_attempts a ON a.delivery_id = d.id
          WHERE a.provider_message_id IS NOT NULL AND a.error IS NULL AND julianday(a.attempted_at) <= julianday(?) GROUP BY a.delivery_id
        ), facts AS MATERIALIZED (
          SELECT d.*,u.incident_id,a.acceptedAt FROM cohort i
          CROSS JOIN incident_updates u ON u.incident_id = i.id CROSS JOIN notification_deliveries d ON d.incident_update_id = u.id
          LEFT JOIN accepted a ON a.delivery_id = d.id WHERE julianday(d.created_at) <= julianday(?)
        ), scopes AS (
          SELECT 'update:' || incident_update_id AS scopeId,* FROM facts
          UNION ALL SELECT 'incident:' || incident_id AS scopeId,* FROM facts
          UNION ALL SELECT 'month' AS scopeId,* FROM facts
        ) SELECT scopeId,channel,COUNT(*) AS committed,COUNT(DISTINCT subscriber_id) AS distinctCommitted,
          SUM(acceptedAt IS NOT NULL) AS providerAccepted,COUNT(DISTINCT CASE WHEN acceptedAt IS NOT NULL THEN subscriber_id END) AS distinctProviderAccepted,
          SUM(outcome = 'delivered') AS delivered,COUNT(DISTINCT CASE WHEN outcome = 'delivered' THEN subscriber_id END) AS distinctDelivered,
          SUM(outcome = 'queued') AS queued,SUM(outcome = 'bounced') AS bounced,SUM(outcome = 'complained') AS complained,
          SUM(outcome = 'suppressed') AS suppressed,SUM(outcome = 'failed') AS failed,MIN(acceptedAt) AS firstProviderAcceptedAt
          FROM scopes GROUP BY scopeId,channel`).bind(...parameters, scope.measuredAt, scope.measuredAt),
        db.prepare(`${cohort}, facts AS MATERIALIZED (${["channel_posts", "subscriber_channel_posts"].map(posts => `
          SELECT p.incident_update_id AS updateId,u.incident_id AS incidentId,d.kind,COALESCE(x.state,'queued') AS state
          FROM cohort i CROSS JOIN incident_updates u ON u.incident_id = i.id CROSS JOIN ${posts} p ON p.incident_update_id = u.id
          JOIN delivery_channel_destinations d ON d.id = p.destination_id
          LEFT JOIN integration_deliveries x ON x.namespace = 'lamp-channels' AND x.id = p.id WHERE julianday(p.queued_at) <= julianday(?)`).join(" UNION ALL ")}
        ), scopes AS (
          SELECT 'update:' || updateId AS scopeId,* FROM facts UNION ALL SELECT 'incident:' || incidentId AS scopeId,* FROM facts UNION ALL SELECT 'month' AS scopeId,* FROM facts
        ) SELECT scopeId,kind AS channel,COUNT(*) AS committed,SUM(state = 'accepted') AS accepted,SUM(state = 'rejected') AS rejected,SUM(state = 'uncertain') AS uncertain,SUM(state IN ('queued','sending')) AS pending FROM scopes GROUP BY scopeId,kind`).bind(...parameters, scope.measuredAt, scope.measuredAt),
        db.prepare(`${cohort} SELECT s.incident_update_id AS updateId,s.channel FROM cohort i CROSS JOIN incident_updates u ON u.incident_id = i.id CROSS JOIN notification_channel_selections s ON s.incident_update_id = u.id WHERE julianday(s.created_at) <= julianday(?) ORDER BY s.rowid`).bind(...parameters, scope.measuredAt),
      ];
      // D1 batches give all counts and timing facts the same read transaction.
      const [incidents, updates, channels, posts, selections] = await db.batch(statements);
      return { incidents: incidents.results as unknown as IncidentFact[], updates: updates.results as unknown as UpdateFact[], channels: channels.results as unknown as ChannelFact[], posts: posts.results as unknown as PostFact[], selections: selections.results as unknown as SelectionFact[] };
    },
  };
}
