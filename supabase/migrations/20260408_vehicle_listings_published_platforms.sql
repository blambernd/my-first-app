-- PROJ-13: Add published_platforms column to vehicle_listings
ALTER TABLE vehicle_listings
ADD COLUMN IF NOT EXISTS published_platforms JSONB NOT NULL DEFAULT '[]'::jsonb;
