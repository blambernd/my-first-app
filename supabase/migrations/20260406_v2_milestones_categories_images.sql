-- PROJ-5 v2: Fahrzeug-Timeline Redesign — Categories + Multi-Photo
-- Run this AFTER 20260405_create_vehicle_milestones.sql
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ============================================================
-- 1. ALTER VEHICLE_MILESTONES: Add category, increase description, drop photo_path
-- ============================================================

-- Add category column with CHECK constraint
ALTER TABLE vehicle_milestones
  ADD COLUMN category TEXT NOT NULL DEFAULT 'sonstiges'
  CHECK (category IN (
    'erstzulassung', 'kauf', 'restauration', 'unfall',
    'trophaee', 'lackierung', 'umbau', 'sonstiges'
  ));

-- Increase description limit from 1000 to 2000
ALTER TABLE vehicle_milestones
  DROP CONSTRAINT IF EXISTS vehicle_milestones_description_check;

ALTER TABLE vehicle_milestones
  ADD CONSTRAINT vehicle_milestones_description_check
  CHECK (description IS NULL OR length(description) <= 2000);

-- Drop photo_path column (replaced by vehicle_milestone_images table)
ALTER TABLE vehicle_milestones
  DROP COLUMN IF EXISTS photo_path;

-- Index on category for filtering
CREATE INDEX idx_vehicle_milestones_category ON vehicle_milestones(vehicle_id, category);

-- ============================================================
-- 2. VEHICLE_MILESTONE_IMAGES TABLE
-- ============================================================
CREATE TABLE vehicle_milestone_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES vehicle_milestones(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_milestone_images_milestone_id ON vehicle_milestone_images(milestone_id);

-- RLS
ALTER TABLE vehicle_milestone_images ENABLE ROW LEVEL SECURITY;

-- RLS via milestone → vehicle ownership
CREATE POLICY "Users can view images of own milestones"
  ON vehicle_milestone_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      JOIN vehicles ON vehicles.id = vehicle_milestones.vehicle_id
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create images for own milestones"
  ON vehicle_milestone_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      JOIN vehicles ON vehicles.id = vehicle_milestones.vehicle_id
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images of own milestones"
  ON vehicle_milestone_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      JOIN vehicles ON vehicles.id = vehicle_milestones.vehicle_id
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images of own milestones"
  ON vehicle_milestone_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      JOIN vehicles ON vehicles.id = vehicle_milestones.vehicle_id
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND vehicles.user_id = auth.uid()
    )
  );
