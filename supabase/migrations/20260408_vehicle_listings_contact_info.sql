-- Add contact_info JSONB column to vehicle_listings
ALTER TABLE vehicle_listings
ADD COLUMN contact_info JSONB NOT NULL DEFAULT '{}'::jsonb;
