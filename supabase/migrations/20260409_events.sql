-- PROJ-19: Veranstaltungsübersicht - Events table for Oldtimer events

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE,
  location TEXT NOT NULL,
  plz TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('rallye', 'messe', 'regional')),
  description TEXT,
  entry_price TEXT,
  website_url TEXT,
  source_url TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Events are publicly readable by authenticated users
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete (via cron scraper)
-- No INSERT/UPDATE/DELETE policies for authenticated users

-- Indexes for query performance
CREATE INDEX idx_events_date_start ON events(date_start);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_lat_lng ON events(lat, lng);

-- The idx_events_date_start index above already covers date range queries efficiently.
-- A partial index with CURRENT_DATE is not possible (not IMMUTABLE).
