-- Add email_enabled preference column (replaces oil_enabled for notification channel control)
-- Users can choose: bell-only (email_enabled=false) or bell+email (email_enabled=true)
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT TRUE;
