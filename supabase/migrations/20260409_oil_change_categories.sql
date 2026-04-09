-- Add oil change subcategories with individual next due dates
-- Stored as JSONB array: [{"category": "motor_oil", "next_due_date": "2027-01-15"}, ...]
ALTER TABLE service_entries
  ADD COLUMN IF NOT EXISTS oil_change_categories JSONB;

-- Allow "oil_change" as a due_type in vehicle_due_dates
ALTER TABLE vehicle_due_dates
  DROP CONSTRAINT IF EXISTS vehicle_due_dates_due_type_check;

ALTER TABLE vehicle_due_dates
  ADD CONSTRAINT vehicle_due_dates_due_type_check
  CHECK (due_type IN ('tuv_hu', 'service', 'oil_change'));
