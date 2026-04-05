-- PROJ-5: Fahrzeug-Timeline — Database Schema (Milestones)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ============================================================
-- VEHICLE_MILESTONES TABLE
-- ============================================================
CREATE TABLE vehicle_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  milestone_date DATE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) <= 200),
  description TEXT CHECK (description IS NULL OR length(description) <= 1000),
  photo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vehicle_milestones_vehicle_id ON vehicle_milestones(vehicle_id);
CREATE INDEX idx_vehicle_milestones_date ON vehicle_milestones(vehicle_id, milestone_date DESC);

-- RLS
ALTER TABLE vehicle_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones of own vehicles"
  ON vehicle_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_milestones.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create milestones for own vehicles"
  ON vehicle_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_milestones.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones of own vehicles"
  ON vehicle_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_milestones.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones of own vehicles"
  ON vehicle_milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_milestones.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Reuse the existing updated_at trigger function from PROJ-2
CREATE TRIGGER vehicle_milestones_updated_at
  BEFORE UPDATE ON vehicle_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
