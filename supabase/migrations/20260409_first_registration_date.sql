-- Add first_registration_date column to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS first_registration_date DATE;

-- Backfill: set first_registration_date from existing year (Jan 1 of that year)
UPDATE vehicles SET first_registration_date = make_date(year, 1, 1) WHERE first_registration_date IS NULL AND year IS NOT NULL;
