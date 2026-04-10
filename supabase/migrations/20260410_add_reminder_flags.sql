-- PROJ-23 BUG-1 fix: Add 14-day and 30-day reminder flags
ALTER TABLE vehicle_due_dates
  ADD COLUMN IF NOT EXISTS reminder_sent_14d BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_sent_30d BOOLEAN NOT NULL DEFAULT FALSE;
