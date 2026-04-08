-- RPC function to look up an invitation by token (bypasses RLS).
-- Similar to get_transfer_by_token — returns only non-sensitive data.
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_vehicle RECORD;
BEGIN
  SELECT id, vehicle_id, role, status, expires_at, email
  INTO v_invite
  FROM vehicle_invitations
  WHERE token = p_token;

  IF v_invite IS NULL THEN
    RETURN json_build_object('status', 'invalid');
  END IF;

  IF v_invite.status = 'angenommen' THEN
    RETURN json_build_object('status', 'accepted');
  END IF;

  IF v_invite.status IN ('widerrufen', 'abgelaufen') THEN
    RETURN json_build_object('status', 'expired');
  END IF;

  IF v_invite.expires_at < NOW() THEN
    RETURN json_build_object('status', 'expired');
  END IF;

  -- Get vehicle name
  SELECT make, model, year INTO v_vehicle
  FROM vehicles WHERE id = v_invite.vehicle_id;

  RETURN json_build_object(
    'status', 'valid',
    'role', v_invite.role,
    'expiresAt', v_invite.expires_at,
    'vehicleName', COALESCE(
      v_vehicle.make || ' ' || v_vehicle.model || ' (' || v_vehicle.year || ')',
      'Fahrzeug'
    )
  );
END;
$$;
