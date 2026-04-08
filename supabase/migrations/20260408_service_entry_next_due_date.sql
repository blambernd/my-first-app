-- Add next_due_date column to service_entries for service/TÜV reminders
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

ALTER TABLE service_entries
  ADD COLUMN IF NOT EXISTS next_due_date DATE;

COMMENT ON COLUMN service_entries.next_due_date IS 'Optional: When is the next service/TÜV due? Used for reminder display.';
