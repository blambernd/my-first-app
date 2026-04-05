-- PROJ-3: Digitales Scheckheft — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ============================================================
-- SERVICE_ENTRIES TABLE
-- ============================================================
CREATE TABLE service_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('inspection', 'oil_change', 'repair', 'tuv_hu', 'restoration', 'other')),
  description TEXT NOT NULL CHECK (length(description) <= 2000),
  mileage_km INTEGER NOT NULL CHECK (mileage_km >= 0 AND mileage_km <= 9999999),
  is_odometer_correction BOOLEAN NOT NULL DEFAULT FALSE,
  cost_cents INTEGER CHECK (cost_cents IS NULL OR cost_cents >= 0),
  workshop_name TEXT CHECK (workshop_name IS NULL OR length(workshop_name) <= 200),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_service_entries_vehicle_id ON service_entries(vehicle_id);
CREATE INDEX idx_service_entries_service_date ON service_entries(vehicle_id, service_date DESC);
CREATE INDEX idx_service_entries_type ON service_entries(vehicle_id, entry_type);

-- RLS
ALTER TABLE service_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service entries of own vehicles"
  ON service_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = service_entries.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create service entries for own vehicles"
  ON service_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = service_entries.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update service entries of own vehicles"
  ON service_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = service_entries.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete service entries of own vehicles"
  ON service_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = service_entries.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Reuse the existing updated_at trigger function from PROJ-2
CREATE TRIGGER service_entries_updated_at
  BEFORE UPDATE ON service_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
