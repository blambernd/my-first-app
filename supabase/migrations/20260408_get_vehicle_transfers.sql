-- RPC function to load transfers for a vehicle (owner-only)
-- Bypasses RLS issues with SECURITY DEFINER while still checking ownership.
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION get_vehicle_transfers(p_vehicle_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_active JSON;
  v_past JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Nicht angemeldet');
  END IF;

  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM vehicles
    WHERE id = p_vehicle_id AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('error', 'Kein Zugriff');
  END IF;

  -- Get active transfer
  SELECT row_to_json(t) INTO v_active
  FROM (
    SELECT id, vehicle_id, from_user_id, to_email, token, keep_as_viewer, status, expires_at, created_at
    FROM vehicle_transfers
    WHERE vehicle_id = p_vehicle_id AND status = 'offen'
    LIMIT 1
  ) t;

  -- Get past transfers
  SELECT json_agg(row_to_json(t)) INTO v_past
  FROM (
    SELECT id, vehicle_id, from_user_id, to_email, token, keep_as_viewer, status, expires_at, created_at
    FROM vehicle_transfers
    WHERE vehicle_id = p_vehicle_id AND status != 'offen'
    ORDER BY created_at DESC
    LIMIT 10
  ) t;

  RETURN json_build_object(
    'active', v_active,
    'past', COALESCE(v_past, '[]'::json)
  );
END;
$$;
