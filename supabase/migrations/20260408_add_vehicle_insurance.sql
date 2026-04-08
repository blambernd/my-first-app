-- Add insurance fields to vehicles table
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS insurance_company TEXT,
  ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
