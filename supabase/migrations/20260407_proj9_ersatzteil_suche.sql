-- PROJ-9: Ersatzteil-Suche & Preis-Alerts — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Run AFTER all previous migrations.

-- ============================================================
-- 1. PART_ALERTS TABLE
-- ============================================================
CREATE TABLE part_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL CHECK (length(search_query) >= 2 AND length(search_query) <= 200),
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  max_price_cents INTEGER CHECK (max_price_cents IS NULL OR max_price_cents >= 0),
  condition_filter TEXT NOT NULL DEFAULT 'all' CHECK (condition_filter IN ('all', 'new', 'used')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_part_alerts_vehicle_id ON part_alerts(vehicle_id);
CREATE INDEX idx_part_alerts_user_id ON part_alerts(user_id);
CREATE INDEX idx_part_alerts_status ON part_alerts(status) WHERE status = 'active';

-- RLS
ALTER TABLE part_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view alerts for vehicles they own or are members of
CREATE POLICY "Users can view own alerts"
  ON part_alerts FOR SELECT
  USING (user_id = auth.uid());

-- Users can create alerts for vehicles they own or are members of
CREATE POLICY "Users can create alerts for accessible vehicles"
  ON part_alerts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM vehicles
        WHERE vehicles.id = part_alerts.vehicle_id
        AND vehicles.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM vehicle_members
        WHERE vehicle_members.vehicle_id = part_alerts.vehicle_id
        AND vehicle_members.user_id = auth.uid()
      )
    )
  );

-- Users can update their own alerts
CREATE POLICY "Users can update own alerts"
  ON part_alerts FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own alerts
CREATE POLICY "Users can delete own alerts"
  ON part_alerts FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- 2. PART_ALERT_MATCHES TABLE
-- ============================================================
CREATE TABLE part_alert_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES part_alerts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price_cents INTEGER,
  condition TEXT NOT NULL DEFAULT 'unknown' CHECK (condition IN ('new', 'used', 'unknown')),
  platform TEXT NOT NULL,
  platform_label TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  found_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_part_alert_matches_alert_id ON part_alert_matches(alert_id);
CREATE INDEX idx_part_alert_matches_unread ON part_alert_matches(alert_id, is_read) WHERE is_read = FALSE;

-- RLS
ALTER TABLE part_alert_matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches for their own alerts
CREATE POLICY "Users can view matches for own alerts"
  ON part_alert_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM part_alerts
      WHERE part_alerts.id = part_alert_matches.alert_id
      AND part_alerts.user_id = auth.uid()
    )
  );

-- Users can update (mark as read) matches for their own alerts
CREATE POLICY "Users can update matches for own alerts"
  ON part_alert_matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM part_alerts
      WHERE part_alerts.id = part_alert_matches.alert_id
      AND part_alerts.user_id = auth.uid()
    )
  );


-- ============================================================
-- 3. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('part_alert_match')),
  reference_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());
