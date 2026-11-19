-- Keep the released preset constraints and existing alert connections intact.
ALTER TABLE alert_sources ADD COLUMN uptime_kuma_preset TEXT CHECK (uptime_kuma_preset = 'uptime-kuma');
