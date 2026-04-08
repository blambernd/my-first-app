-- RPC function to load all invitations for a vehicle (owner-only).
-- Bypasses RLS with SECURITY DEFINER while checking ownership.
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION get_vehicle_invitations(p_vehicle_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM vehicles
    WHERE id = p_vehicle_id AND user_id = v_user_id
  ) THEN
    RETURN '[]'::json;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_result
  FROM (
    SELECT id, vehicle_id, email, token, role, invited_by, expires_at, status, created_at
    FROM vehicle_invitations
    WHERE vehicle_id = p_vehicle_id
    ORDER BY created_at DESC
    LIMIT 50
  ) t;

  RETURN v_result;
END;
$$;
