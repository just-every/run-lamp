-- Cron must seek eligible work instead of revisiting accumulated subscriber
-- and incident history. Additive indexes preserve the existing records/ledgers.
CREATE INDEX IF NOT EXISTS subscribers_held_created_idx
  ON subscribers(state, deactivation_reason, created_at);
CREATE INDEX IF NOT EXISTS subscribers_held_deactivated_idx
  ON subscribers(state, deactivation_reason, deactivated_at);
CREATE INDEX IF NOT EXISTS component_history_observations_idx
  ON component_state_history(changed_at, created_at) WHERE cause_type <> 'correction';
CREATE INDEX IF NOT EXISTS incidents_active_work_idx
  ON incidents(id) WHERE deleted_at IS NULL AND lifecycle <> 'Resolved';
CREATE INDEX IF NOT EXISTS incidents_unresolved_work_idx
  ON incidents(id) WHERE resolved_at IS NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS incidents_report_due_idx
  ON incidents(peak_impact, resolved_at, id) WHERE lifecycle = 'Resolved' AND deleted_at IS NULL;


-- Derived current obligations keep each minute proportional to due work. The
-- existing incident/update/report/reminder rows remain the authority and archive.
CREATE TABLE incident_update_reminder_work (
  incident_id TEXT PRIMARY KEY REFERENCES incidents(id) ON DELETE CASCADE,
  update_id TEXT NOT NULL REFERENCES incident_updates(id) ON DELETE CASCADE,
  next_update_at TEXT NOT NULL,
  due_soon_sent INTEGER NOT NULL DEFAULT 0,
  overdue_sent INTEGER NOT NULL DEFAULT 0,
  escalation_sent INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX incident_reminder_soon_due ON incident_update_reminder_work(due_soon_sent,next_update_at,incident_id);
CREATE INDEX incident_reminder_overdue ON incident_update_reminder_work(overdue_sent,next_update_at,incident_id);
CREATE INDEX incident_reminder_escalation ON incident_update_reminder_work(escalation_sent,next_update_at,incident_id);

CREATE VIEW incident_update_reminder_candidates AS
SELECT i.id AS incident_id,u.id AS update_id,u.next_update_at,
  EXISTS(SELECT 1 FROM incident_update_reminders r WHERE r.update_id=u.id AND r.kind='due-soon') AS due_soon_sent,
  EXISTS(SELECT 1 FROM incident_update_reminders r WHERE r.update_id=u.id AND r.kind='overdue') AS overdue_sent,
  EXISTS(SELECT 1 FROM incident_update_escalations e WHERE e.update_id=u.id) AS escalation_sent
FROM incidents i INDEXED BY incidents_active_work_idx JOIN incident_updates u ON u.id=(SELECT latest.id FROM incident_updates latest WHERE latest.incident_id=i.id ORDER BY latest.published_at DESC,latest.id DESC LIMIT 1)
WHERE i.deleted_at IS NULL AND i.lifecycle<>'Resolved' AND u.lifecycle<>'Resolved' AND u.is_retroactive=0 AND u.next_update_at IS NOT NULL;

CREATE TRIGGER incident_reminder_incident_insert AFTER INSERT ON incidents BEGIN
  INSERT INTO incident_update_reminder_work SELECT * FROM incident_update_reminder_candidates WHERE incident_id=NEW.id;
END;
CREATE TRIGGER incident_reminder_incident_update AFTER UPDATE OF lifecycle,deleted_at ON incidents BEGIN
  DELETE FROM incident_update_reminder_work WHERE incident_id=NEW.id;
  INSERT INTO incident_update_reminder_work SELECT * FROM incident_update_reminder_candidates WHERE incident_id=NEW.id;
END;
CREATE TRIGGER incident_reminder_update_insert AFTER INSERT ON incident_updates BEGIN
  DELETE FROM incident_update_reminder_work WHERE incident_id=NEW.incident_id;
  INSERT INTO incident_update_reminder_work SELECT * FROM incident_update_reminder_candidates WHERE incident_id=NEW.incident_id;
END;
CREATE TRIGGER incident_reminder_update_change AFTER UPDATE OF incident_id,lifecycle,published_at,is_retroactive,next_update_at ON incident_updates BEGIN
  DELETE FROM incident_update_reminder_work WHERE incident_id IN(OLD.incident_id,NEW.incident_id);
  INSERT INTO incident_update_reminder_work SELECT * FROM incident_update_reminder_candidates WHERE incident_id IN(OLD.incident_id,NEW.incident_id);
END;
CREATE TRIGGER incident_reminder_update_delete AFTER DELETE ON incident_updates BEGIN
  DELETE FROM incident_update_reminder_work WHERE incident_id=OLD.incident_id;
  INSERT INTO incident_update_reminder_work SELECT * FROM incident_update_reminder_candidates WHERE incident_id=OLD.incident_id;
END;
CREATE TRIGGER incident_reminder_recorded AFTER INSERT ON incident_update_reminders BEGIN
  UPDATE incident_update_reminder_work SET due_soon_sent=(due_soon_sent OR NEW.kind='due-soon'),
    overdue_sent=(overdue_sent OR NEW.kind='overdue') WHERE update_id=NEW.update_id;
END;
CREATE TRIGGER incident_escalation_recorded AFTER INSERT ON incident_update_escalations BEGIN
  UPDATE incident_update_reminder_work SET escalation_sent=1 WHERE update_id=NEW.update_id;
END;

CREATE TABLE incident_report_reminder_work (
  incident_id TEXT PRIMARY KEY REFERENCES incidents(id) ON DELETE CASCADE,
  next_due_at TEXT NOT NULL
);
CREATE INDEX incident_report_reminder_due ON incident_report_reminder_work(next_due_at,incident_id);
CREATE VIEW incident_report_reminder_candidates AS
SELECT i.id AS incident_id,strftime('%Y-%m-%dT%H:%M:%fZ',i.resolved_at,'+' || (7*(COALESCE((SELECT MAX(r.week) FROM report_reminders r WHERE r.incident_id=i.id),-1)+2)) || ' days') AS next_due_at
FROM incidents i INDEXED BY incidents_report_due_idx WHERE i.lifecycle='Resolved' AND i.deleted_at IS NULL AND i.resolved_at IS NOT NULL
  AND i.peak_impact IN('Partially unavailable','Major outage')
  AND NOT EXISTS(SELECT 1 FROM incident_reports p WHERE p.incident_id=i.id AND p.published_at IS NOT NULL)
  AND NOT EXISTS(SELECT 1 FROM report_waivers w WHERE w.incident_id=i.id)
  AND (NOT EXISTS(SELECT 1 FROM statuspage_import_targets imported WHERE imported.kind='incident' AND imported.id=i.id)
    OR EXISTS(SELECT 1 FROM incident_updates live WHERE live.incident_id=i.id AND live.is_retroactive=0));

CREATE TRIGGER report_reminder_incident_insert AFTER INSERT ON incidents BEGIN
  INSERT INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id=NEW.id;
END;
CREATE TRIGGER report_reminder_incident_update AFTER UPDATE OF lifecycle,deleted_at,resolved_at,peak_impact ON incidents BEGIN
  DELETE FROM incident_report_reminder_work WHERE incident_id=NEW.id;
  INSERT INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id=NEW.id;
END;
CREATE TRIGGER report_reminder_update_insert AFTER INSERT ON incident_updates BEGIN
  INSERT OR REPLACE INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id=NEW.incident_id;
END;
CREATE TRIGGER report_reminder_import_insert AFTER INSERT ON statuspage_import_targets WHEN NEW.kind='incident' BEGIN
  DELETE FROM incident_report_reminder_work WHERE incident_id=NEW.id;
  INSERT INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id=NEW.id;
END;
CREATE TRIGGER report_reminder_import_delete AFTER DELETE ON statuspage_import_targets WHEN OLD.kind='incident' BEGIN
  INSERT OR REPLACE INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id=OLD.id;
END;
CREATE TRIGGER report_reminder_report_insert AFTER INSERT ON incident_reports WHEN NEW.published_at IS NOT NULL BEGIN
  DELETE FROM incident_report_reminder_work WHERE incident_id=NEW.incident_id;
END;
CREATE TRIGGER report_reminder_report_update AFTER UPDATE OF published_at ON incident_reports BEGIN
  DELETE FROM incident_report_reminder_work WHERE incident_id=NEW.incident_id;
  INSERT INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id=NEW.incident_id;
END;
CREATE TRIGGER report_reminder_waiver_insert AFTER INSERT ON report_waivers BEGIN
  DELETE FROM incident_report_reminder_work WHERE incident_id=NEW.incident_id;
END;
CREATE TRIGGER report_reminder_recorded AFTER INSERT ON report_reminders BEGIN
  UPDATE incident_report_reminder_work SET next_due_at=(SELECT strftime('%Y-%m-%dT%H:%M:%fZ',i.resolved_at,'+' || (7*(NEW.week+2)) || ' days') FROM incidents i WHERE i.id=NEW.incident_id)
    WHERE incident_id=NEW.incident_id;
END;

-- Capacity alerts use exact counters, maintained in the subscriber mutation's
-- transaction, instead of recounting the entire directory every minute.
CREATE TABLE subscriber_limit_counts (
  channel TEXT PRIMARY KEY CHECK(channel IN('email','webhook','slack','teams','sms')),
  total INTEGER NOT NULL CHECK(total>=0)
);
INSERT INTO subscriber_limit_counts(channel,total)
SELECT 'email',0 UNION ALL SELECT 'webhook',0 UNION ALL SELECT 'slack',0 UNION ALL SELECT 'teams',0 UNION ALL SELECT 'sms',0;
UPDATE subscriber_limit_counts SET total=(SELECT COUNT(*) FROM subscribers s INDEXED BY subscribers_capacity_idx WHERE s.state IN('pending','active') AND (CASE WHEN s.sms_kind=1 THEN 'sms' ELSE COALESCE(s.chat_kind,s.channel) END)=subscriber_limit_counts.channel);
-- Old native archives restore with application triggers dropped. Leave the
-- derived baseline unset until its first product use can atomically rebuild it
-- from the complete restored canonical records and reminder ledgers.
CREATE TABLE scheduled_work_initialization (
  id INTEGER PRIMARY KEY CHECK(id=1),
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN(0,1))
);
INSERT INTO scheduled_work_initialization(id,completed) VALUES(1,0);
CREATE TRIGGER subscriber_limit_count_insert AFTER INSERT ON subscribers WHEN NEW.state IN('pending','active') BEGIN
  UPDATE subscriber_limit_counts SET total=total+1 WHERE channel=IIF(NEW.sms_kind=1,'sms',COALESCE(NEW.chat_kind,NEW.channel));
END;
CREATE TRIGGER subscriber_limit_count_delete AFTER DELETE ON subscribers WHEN OLD.state IN('pending','active') BEGIN
  UPDATE subscriber_limit_counts SET total=total-1 WHERE channel=IIF(OLD.sms_kind=1,'sms',COALESCE(OLD.chat_kind,OLD.channel));
END;
CREATE TRIGGER subscriber_limit_count_update AFTER UPDATE OF state,channel,chat_kind,sms_kind ON subscribers BEGIN
  UPDATE subscriber_limit_counts SET total=total-1 WHERE OLD.state IN('pending','active') AND channel=IIF(OLD.sms_kind=1,'sms',COALESCE(OLD.chat_kind,OLD.channel));
  UPDATE subscriber_limit_counts SET total=total+1 WHERE NEW.state IN('pending','active') AND channel=IIF(NEW.sms_kind=1,'sms',COALESCE(NEW.chat_kind,NEW.channel));
END;
CREATE INDEX subscribers_pending_expiry_idx ON subscribers(created_at,id) WHERE state='pending';
CREATE INDEX incident_subscriptions_resolution_due ON incident_subscriptions(include_report,resolution_at) WHERE ended_at IS NULL AND resolution_at IS NOT NULL;
CREATE INDEX incident_drafts_publication_due ON incident_drafts(scheduled_publish_at) WHERE scheduled_publish_at IS NOT NULL;
CREATE INDEX maintenance_end_due ON maintenance(ends_at) WHERE state='In progress';
CREATE INDEX incident_subscriptions_ended_work ON incident_subscriptions(subscriber_id) WHERE ended_at IS NOT NULL;
CREATE TRIGGER report_reminder_update_change AFTER UPDATE OF incident_id,is_retroactive ON incident_updates BEGIN
  DELETE FROM incident_report_reminder_work WHERE incident_id IN(OLD.incident_id,NEW.incident_id);
  INSERT INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id IN(OLD.incident_id,NEW.incident_id);
END;
CREATE TRIGGER report_reminder_update_delete AFTER DELETE ON incident_updates BEGIN
  DELETE FROM incident_report_reminder_work WHERE incident_id=OLD.incident_id;
  INSERT INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id=OLD.incident_id;
END;
CREATE TRIGGER report_reminder_report_delete AFTER DELETE ON incident_reports BEGIN
  INSERT OR REPLACE INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id=OLD.incident_id;
END;
CREATE TRIGGER report_reminder_waiver_delete AFTER DELETE ON report_waivers BEGIN
  INSERT OR REPLACE INTO incident_report_reminder_work SELECT * FROM incident_report_reminder_candidates WHERE incident_id=OLD.incident_id;
END;

CREATE INDEX IF NOT EXISTS incidents_resolved_public_window
  ON incidents(resolved_at DESC,id DESC) WHERE deleted_at IS NULL AND lifecycle='Resolved';
CREATE INDEX IF NOT EXISTS component_history_component_window
  ON component_state_history(component_id,changed_at,created_at,id) WHERE cause_type <> 'correction';
CREATE INDEX IF NOT EXISTS component_corrections_window
  ON component_state_corrections(ends_at);
CREATE INDEX IF NOT EXISTS maintenance_completed_public_window
  ON maintenance(COALESCE(completed_at,ends_at) DESC,id DESC) WHERE state IN ('Completed','Cancelled');
CREATE INDEX IF NOT EXISTS maintenance_current_public_window
  ON maintenance(id) WHERE state NOT IN ('Completed','Cancelled');


CREATE INDEX IF NOT EXISTS incident_updates_public_feed_seek ON incident_updates(published_at DESC,id DESC,incident_id);
CREATE INDEX IF NOT EXISTS maintenance_notices_public_feed_seek ON maintenance_notices(published_at DESC,id DESC,maintenance_id);
CREATE INDEX IF NOT EXISTS incidents_public_archive_seek ON incidents(opened_at DESC,id DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS maintenance_public_archive_seek ON maintenance(starts_at,id);
-- Subscriber directory's effective channel must be selected before state;
-- otherwise a cold scheduled SMS preparation revisits every inactive email.
CREATE INDEX IF NOT EXISTS subscribers_effective_channel_state_idx
  ON subscribers(CASE WHEN sms_kind=1 THEN 'sms' ELSE COALESCE(chat_kind,channel) END,state,id);
