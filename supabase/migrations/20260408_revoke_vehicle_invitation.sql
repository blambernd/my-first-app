-- RPC function to revoke an invitation (owner-only, bypasses RLS).
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION revoke_vehicle_invitation(p_invitation_id UUID, p_vehicle_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
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
    RETURN json_build_object('error', 'Keine Berechtigung');
  END IF;

  -- Update invitation status
  UPDATE vehicle_invitations
  SET status = 'widerrufen'
  WHERE id = p_invitation_id
    AND vehicle_id = p_vehicle_id
    AND status = 'offen';

  RETURN json_build_object('success', true);
END;
$$;
