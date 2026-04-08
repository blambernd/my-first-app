-- PROJ-11: Marktpreis-Analyse
-- Stores market analysis results for vehicles

CREATE TABLE market_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_params JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'insufficient_data', 'error')) DEFAULT 'pending',
  average_price NUMERIC,
  median_price NUMERIC,
  lowest_price NUMERIC,
  highest_price NUMERIC,
  listing_count INTEGER NOT NULL DEFAULT 0,
  recommended_price_low NUMERIC,
  recommended_price_high NUMERIC,
  recommendation_reasoning TEXT,
  listings JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Owners can manage market analyses" ON market_analyses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = market_analyses.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Members can read analyses
CREATE POLICY "Members can view market analyses" ON market_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicle_members
      WHERE vehicle_members.vehicle_id = market_analyses.vehicle_id
      AND vehicle_members.user_id = auth.uid()
    )
  );

-- Indexes for common queries
CREATE INDEX idx_market_analyses_vehicle_id ON market_analyses(vehicle_id);
CREATE INDEX idx_market_analyses_created_at ON market_analyses(created_at DESC);
CREATE INDEX idx_market_analyses_vehicle_created ON market_analyses(vehicle_id, created_at DESC);
