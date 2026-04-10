-- Fix notifications type constraint to allow service_reminder type
-- The original constraint only allowed 'part_alert_match', but
-- the check-reminders cron job inserts 'service_reminder' notifications.

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('part_alert_match', 'service_reminder'));
