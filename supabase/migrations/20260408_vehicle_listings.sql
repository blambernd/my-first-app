-- PROJ-12: Verkaufsinserat erstellen
CREATE TABLE vehicle_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER,
  price_type TEXT NOT NULL CHECK (price_type IN ('festpreis', 'verhandlungsbasis')) DEFAULT 'verhandlungsbasis',
  selected_photo_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  photo_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('entwurf', 'veroeffentlicht')) DEFAULT 'entwurf',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active listing per vehicle
CREATE UNIQUE INDEX idx_vehicle_listings_vehicle_id ON vehicle_listings(vehicle_id);

-- RLS
ALTER TABLE vehicle_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_listings_select" ON vehicle_listings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vehicle_listings_insert" ON vehicle_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vehicle_listings_update" ON vehicle_listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "vehicle_listings_delete" ON vehicle_listings
  FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_vehicle_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_listings_updated_at
  BEFORE UPDATE ON vehicle_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_listings_updated_at();
