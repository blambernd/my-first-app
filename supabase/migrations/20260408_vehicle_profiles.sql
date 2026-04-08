-- Vehicle public profiles for PROJ-10
CREATE TABLE vehicle_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{
    "sections": {
      "stammdaten": true,
      "fotos": true,
      "scheckheft": true,
      "meilensteine": true,
      "dokumente": true
    },
    "selected_images": [],
    "selected_service_entries": [],
    "selected_milestones": [],
    "selected_documents": []
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One profile per vehicle
CREATE UNIQUE INDEX idx_vehicle_profiles_vehicle_id ON vehicle_profiles(vehicle_id);

-- Fast lookup by token (public access)
CREATE INDEX idx_vehicle_profiles_token ON vehicle_profiles(token);

-- RLS
ALTER TABLE vehicle_profiles ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "vehicle_profiles_select" ON vehicle_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vehicle_profiles_insert" ON vehicle_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vehicle_profiles_update" ON vehicle_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "vehicle_profiles_delete" ON vehicle_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Public read access via token (no auth required) — used by service role in API
-- The public API route will use supabase service role client to bypass RLS

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_vehicle_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_profiles_updated_at
  BEFORE UPDATE ON vehicle_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_profiles_updated_at();
