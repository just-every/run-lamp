-- Minute Cron work and routine reads stay flat as history grows. Each
-- scheduled query reads only rows that are still due, through an index whose
-- predicate matches it; finished work never re-enters the minute scan.

-- Automatic rule work: only unfinished work with retries left is due.
CREATE INDEX alert_rule_work_due ON alert_rule_work(next_attempt_at)
WHERE completed_at IS NULL AND attempts < 5;

-- Chat and social posts record when their durable delivery was queued. The
-- marker is written by the delivery insert itself, so it commits with it.
ALTER TABLE channel_posts ADD COLUMN enqueued_at INTEGER;
ALTER TABLE subscriber_channel_posts ADD COLUMN enqueued_at INTEGER;
ALTER TABLE channel_subscriber_events ADD COLUMN enqueued_at INTEGER;
ALTER TABLE social_posts ADD COLUMN enqueued_at INTEGER;
UPDATE channel_posts SET enqueued_at = (SELECT x.created_at FROM integration_deliveries x WHERE x.namespace = 'lamp-channels' AND x.id = channel_posts.id)
WHERE EXISTS (SELECT 1 FROM integration_deliveries x WHERE x.namespace = 'lamp-channels' AND x.id = channel_posts.id);
UPDATE subscriber_channel_posts SET enqueued_at = (SELECT x.created_at FROM integration_deliveries x WHERE x.namespace = 'lamp-channels' AND x.id = subscriber_channel_posts.id)
WHERE EXISTS (SELECT 1 FROM integration_deliveries x WHERE x.namespace = 'lamp-channels' AND x.id = subscriber_channel_posts.id);
UPDATE channel_subscriber_events SET enqueued_at = (SELECT x.created_at FROM integration_deliveries x WHERE x.namespace = 'lamp-channels' AND x.id = channel_subscriber_events.id)
WHERE EXISTS (SELECT 1 FROM integration_deliveries x WHERE x.namespace = 'lamp-channels' AND x.id = channel_subscriber_events.id);
UPDATE social_posts SET enqueued_at = (SELECT x.created_at FROM integration_deliveries x WHERE x.namespace = 'lamp-social' AND x.id = social_posts.id)
WHERE EXISTS (SELECT 1 FROM integration_deliveries x WHERE x.namespace = 'lamp-social' AND x.id = social_posts.id);
CREATE INDEX channel_posts_unqueued ON channel_posts(queued_at, id) WHERE enqueued_at IS NULL;
CREATE INDEX subscriber_channel_posts_unqueued ON subscriber_channel_posts(queued_at, id) WHERE enqueued_at IS NULL;
CREATE INDEX channel_subscriber_events_unqueued ON channel_subscriber_events(queued_at, id) WHERE enqueued_at IS NULL;
CREATE INDEX social_posts_unqueued ON social_posts(queued_at, id) WHERE enqueued_at IS NULL;
CREATE TRIGGER integration_deliveries_channel_queued AFTER INSERT ON integration_deliveries
WHEN NEW.namespace = 'lamp-channels' BEGIN
  UPDATE channel_posts SET enqueued_at = NEW.created_at WHERE id = NEW.id AND enqueued_at IS NULL;
  UPDATE subscriber_channel_posts SET enqueued_at = NEW.created_at WHERE id = NEW.id AND enqueued_at IS NULL;
  UPDATE channel_subscriber_events SET enqueued_at = NEW.created_at WHERE id = NEW.id AND enqueued_at IS NULL;
END;
CREATE TRIGGER integration_deliveries_social_queued AFTER INSERT ON integration_deliveries
WHEN NEW.namespace = 'lamp-social' BEGIN
  UPDATE social_posts SET enqueued_at = NEW.created_at WHERE id = NEW.id AND enqueued_at IS NULL;
END;

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

-- Public metric charts read one stored series row per metric. Minute points
-- no longer request a full page rebuild; the five-minute refresh reads the
-- series. A metric's first data, a reset to no data, or a stale change still do.
CREATE TABLE public_metric_series (
  metric_id TEXT PRIMARY KEY NOT NULL REFERENCES public_metrics(id) ON DELETE CASCADE,
  points_json TEXT NOT NULL
);
INSERT INTO public_metric_series(metric_id, points_json)
SELECT metric_id, json_group_object(CAST(bucket AS TEXT), value_sum / samples) FROM metric_points WHERE resolution = 60 GROUP BY metric_id;
CREATE TRIGGER metric_points_series_insert AFTER INSERT ON metric_points WHEN NEW.resolution = 60 BEGIN
  INSERT INTO public_metric_series(metric_id, points_json) VALUES (NEW.metric_id, json_object(CAST(NEW.bucket AS TEXT), NEW.value_sum / NEW.samples))
  ON CONFLICT(metric_id) DO UPDATE SET points_json = json_set(points_json, '$."' || NEW.bucket || '"', NEW.value_sum / NEW.samples);
END;
CREATE TRIGGER metric_points_series_update AFTER UPDATE ON metric_points WHEN NEW.resolution = 60 BEGIN
  UPDATE public_metric_series SET points_json = json_set(points_json, '$."' || NEW.bucket || '"', NEW.value_sum / NEW.samples) WHERE metric_id = NEW.metric_id;
END;
CREATE TRIGGER metric_points_series_delete AFTER DELETE ON metric_points WHEN OLD.resolution = 60 BEGIN
  UPDATE public_metric_series SET points_json = json_remove(points_json, '$."' || OLD.bucket || '"') WHERE metric_id = OLD.metric_id;
END;
DROP TRIGGER metric_points_dirty_insert;
DROP TRIGGER metric_points_dirty_update;
DROP TRIGGER public_metrics_dirty_update;
CREATE TRIGGER public_metrics_dirty_update AFTER UPDATE ON public_metrics
WHEN NEW.name <> OLD.name OR NEW.unit <> OLD.unit OR NEW.component_id <> OLD.component_id
  OR (NEW.last_reported_at IS NULL) <> (OLD.last_reported_at IS NULL) OR NEW.stale <> OLD.stale BEGIN
  UPDATE public_snapshot_work SET requested_revision = requested_revision + 1 WHERE id = 'default';
END;
