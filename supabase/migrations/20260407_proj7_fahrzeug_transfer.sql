-- PROJ-7: Fahrzeug-Transfer — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Run AFTER all previous migrations.

-- ============================================================
-- 1. VEHICLE_TRANSFERS TABLE
-- ============================================================
CREATE TABLE vehicle_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL CHECK (length(to_email) <= 320),
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  keep_as_viewer BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'angenommen', 'abgelehnt', 'abgebrochen')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active (offen) transfer per vehicle at a time
CREATE UNIQUE INDEX idx_vehicle_transfers_unique_active
  ON vehicle_transfers(vehicle_id)
  WHERE (status = 'offen');

-- Indexes
CREATE INDEX idx_vehicle_transfers_vehicle_id ON vehicle_transfers(vehicle_id);
CREATE INDEX idx_vehicle_transfers_token ON vehicle_transfers(token);
CREATE INDEX idx_vehicle_transfers_from_user ON vehicle_transfers(from_user_id);
CREATE INDEX idx_vehicle_transfers_status ON vehicle_transfers(vehicle_id, status);

-- RLS
ALTER TABLE vehicle_transfers ENABLE ROW LEVEL SECURITY;

-- Owner can see transfers for their vehicles
CREATE POLICY "Owner can view vehicle transfers"
  ON vehicle_transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_transfers.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Invited user can view transfers addressed to their email
CREATE POLICY "Invited user can view transfer"
  ON vehicle_transfers FOR SELECT
  USING (
    to_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Only owner can create transfers for their vehicles
CREATE POLICY "Owner can create vehicle transfers"
  ON vehicle_transfers FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_transfers.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Owner can update (cancel) their transfers
CREATE POLICY "Owner can update vehicle transfers"
  ON vehicle_transfers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_transfers.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );


-- ============================================================
-- 2. TOKEN LOOKUP RPC FUNCTION (SECURITY DEFINER)
-- Allows looking up a transfer by token without RLS restrictions.
-- Returns only non-sensitive data (no PII enumeration possible).
-- ============================================================
CREATE OR REPLACE FUNCTION get_transfer_by_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer RECORD;
  v_vehicle RECORD;
BEGIN
  SELECT id, vehicle_id, status, expires_at, keep_as_viewer, to_email, from_user_id
  INTO v_transfer
  FROM vehicle_transfers
  WHERE token = p_token;

  IF v_transfer IS NULL THEN
    RETURN json_build_object('status', 'invalid');
  END IF;

  IF v_transfer.status = 'angenommen' THEN
    RETURN json_build_object('status', 'accepted');
  END IF;

  IF v_transfer.status IN ('abgelehnt') THEN
    RETURN json_build_object('status', 'declined');
  END IF;

  IF v_transfer.status = 'abgebrochen' THEN
    RETURN json_build_object('status', 'expired');
  END IF;

  IF v_transfer.expires_at < NOW() THEN
    RETURN json_build_object('status', 'expired');
  END IF;

  -- Get vehicle name
  SELECT make, model, year INTO v_vehicle
  FROM vehicles WHERE id = v_transfer.vehicle_id;

  RETURN json_build_object(
    'status', 'valid',
    'expiresAt', v_transfer.expires_at,
    'keepAsViewer', v_transfer.keep_as_viewer,
    'vehicleName', COALESCE(v_vehicle.make || ' ' || v_vehicle.model || ' (' || v_vehicle.year || ')', 'Fahrzeug')
  );
END;
$$;


-- ============================================================
-- 3. ATOMIC TRANSFER RPC FUNCTION
-- Accepts a transfer: changes vehicle owner, optionally keeps
-- old owner as viewer, creates timeline milestone.
-- Uses SECURITY DEFINER to bypass RLS during the atomic operation.
-- ============================================================
CREATE OR REPLACE FUNCTION accept_vehicle_transfer(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer vehicle_transfers%ROWTYPE;
  v_new_user_id UUID;
  v_new_user_email TEXT;
  v_vehicle vehicles%ROWTYPE;
  v_old_owner_id UUID;
BEGIN
  -- Get the authenticated user
  v_new_user_id := auth.uid();
  IF v_new_user_id IS NULL THEN
    RETURN json_build_object('error', 'Nicht angemeldet');
  END IF;

  -- Get user email
  SELECT email INTO v_new_user_email
  FROM auth.users WHERE id = v_new_user_id;

  -- Lock and fetch the transfer
  SELECT * INTO v_transfer
  FROM vehicle_transfers
  WHERE token = p_token
  FOR UPDATE;

  IF v_transfer IS NULL THEN
    RETURN json_build_object('error', 'Transfer nicht gefunden');
  END IF;

  IF v_transfer.status != 'offen' THEN
    RETURN json_build_object('error', 'Transfer ist nicht mehr aktiv');
  END IF;

  IF v_transfer.expires_at < NOW() THEN
    -- Auto-expire
    UPDATE vehicle_transfers SET status = 'abgelaufen'
    WHERE id = v_transfer.id;
    RETURN json_build_object('error', 'Transfer ist abgelaufen');
  END IF;

  -- Verify email matches (case-insensitive)
  IF lower(v_new_user_email) != lower(v_transfer.to_email) THEN
    RETURN json_build_object('error', 'Deine E-Mail-Adresse stimmt nicht mit der Einladung überein');
  END IF;

  -- Cannot transfer to yourself
  IF v_new_user_id = v_transfer.from_user_id THEN
    RETURN json_build_object('error', 'Du kannst das Fahrzeug nicht an dich selbst übertragen');
  END IF;

  -- Get vehicle and old owner
  SELECT * INTO v_vehicle
  FROM vehicles WHERE id = v_transfer.vehicle_id;
  v_old_owner_id := v_vehicle.user_id;

  -- === ATOMIC TRANSFER ===

  -- 1. Change vehicle owner
  UPDATE vehicles
  SET user_id = v_new_user_id, updated_at = NOW()
  WHERE id = v_transfer.vehicle_id;

  -- 2. Optionally keep old owner as viewer
  IF v_transfer.keep_as_viewer THEN
    INSERT INTO vehicle_members (vehicle_id, user_id, role, user_email)
    VALUES (v_transfer.vehicle_id, v_old_owner_id, 'betrachter',
            (SELECT email FROM auth.users WHERE id = v_old_owner_id))
    ON CONFLICT (vehicle_id, user_id) DO UPDATE SET role = 'betrachter';
  END IF;

  -- 3. Remove new owner from members if they were one (they're now the owner)
  DELETE FROM vehicle_members
  WHERE vehicle_id = v_transfer.vehicle_id
  AND user_id = v_new_user_id;

  -- 4. Create timeline milestone
  INSERT INTO vehicle_milestones (vehicle_id, category, milestone_date, title, description, created_by)
  VALUES (
    v_transfer.vehicle_id,
    'besitzerwechsel',
    NOW()::DATE,
    'Besitzerwechsel',
    'Fahrzeug wurde an einen neuen Besitzer übertragen.',
    v_new_user_id
  );

  -- 5. Mark transfer as accepted
  UPDATE vehicle_transfers
  SET status = 'angenommen'
  WHERE id = v_transfer.id;

  RETURN json_build_object('success', true, 'vehicleId', v_transfer.vehicle_id);
END;
$$;
