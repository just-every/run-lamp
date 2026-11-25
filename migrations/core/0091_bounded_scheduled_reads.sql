-- Minute Cron work and routine reads stay flat as history grows. Each
-- scheduled query reads only rows that are still due, through an index whose
-- predicate matches it; finished work never re-enters the minute scan.

-- Automatic rule work: only unfinished work with retries left is due.
CREATE INDEX alert_rule_work_due ON alert_rule_work(next_attempt_at)
WHERE completed_at IS NULL AND attempts < 5;

-- Chat and social posts record when their durable delivery was queued. The
-- minute sweep marks them from integration_deliveries before it looks for
-- unqueued posts, so only posts not yet queued stay in these indexes.
ALTER TABLE channel_posts ADD COLUMN enqueued_at INTEGER;
ALTER TABLE subscriber_channel_posts ADD COLUMN enqueued_at INTEGER;
ALTER TABLE channel_subscriber_events ADD COLUMN enqueued_at INTEGER;
ALTER TABLE social_posts ADD COLUMN enqueued_at INTEGER;
CREATE INDEX channel_posts_unqueued ON channel_posts(queued_at, id) WHERE enqueued_at IS NULL;
CREATE INDEX subscriber_channel_posts_unqueued ON subscriber_channel_posts(queued_at, id) WHERE enqueued_at IS NULL;
CREATE INDEX channel_subscriber_events_unqueued ON channel_subscriber_events(queued_at, id) WHERE enqueued_at IS NULL;
CREATE INDEX social_posts_unqueued ON social_posts(queued_at, id) WHERE enqueued_at IS NULL;

-- Provider callbacks: the recovery sweep reads only unapplied callbacks it has
-- not yet found to belong to another sender on a shared provider account. A
-- callback set aside here is still applied when its send is recorded later.
ALTER TABLE mail_provider_webhook_events ADD COLUMN unmatched_at TEXT;
CREATE INDEX mail_provider_webhook_events_unapplied ON mail_provider_webhook_events(received_at)
WHERE applied_at IS NULL AND provider_message_id IS NOT NULL AND unmatched_at IS NULL;
CREATE INDEX notification_delivery_attempts_provider_message ON notification_delivery_attempts(provider_message_id)
WHERE provider_message_id IS NOT NULL;
CREATE INDEX component_delivery_attempts_provider_message ON component_delivery_attempts(provider_message_id)
WHERE provider_message_id IS NOT NULL;
CREATE INDEX report_delivery_attempts_provider_message ON report_delivery_attempts(provider_message_id)
WHERE provider_message_id IS NOT NULL;

-- Dispatching one delivery reads that delivery's attempts, its event's
-- deliveries and its subscriber's own links, never every stored row.
CREATE INDEX notification_deliveries_event ON notification_deliveries(notification_event_id);
CREATE INDEX component_deliveries_event ON component_notification_deliveries(notification_event_id);
CREATE INDEX report_deliveries_event ON report_notification_deliveries(notification_event_id);
CREATE INDEX subscriber_tokens_subscriber_scope ON subscriber_tokens(subscriber_id, scope, created_at);

-- Public metric charts read one stored series row per metric: the minute
-- points as a JSON object keyed by bucket, kept by the metrics repository in
-- the same batches that write, expire or reset the points. The repository
-- builds a missing row from the stored minutes (after this upgrade or a
-- restore), so the migration itself writes no rows. Minute points no longer
-- request a full page rebuild; the five-minute refresh reads the series. A
-- metric's first data, a reset to no data, or a stale change still do.
CREATE TABLE public_metric_series (
  metric_id TEXT PRIMARY KEY NOT NULL,
  points_json TEXT NOT NULL
);
DROP TRIGGER metric_points_dirty_insert;
DROP TRIGGER metric_points_dirty_update;
DROP TRIGGER public_metrics_dirty_update;
CREATE TRIGGER public_metrics_dirty_update AFTER UPDATE ON public_metrics
WHEN NEW.name <> OLD.name OR NEW.unit <> OLD.unit OR NEW.component_id <> OLD.component_id
  OR (NEW.last_reported_at IS NULL) <> (OLD.last_reported_at IS NULL) OR NEW.stale <> OLD.stale BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
