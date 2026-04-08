-- RPC function to accept an invitation atomically (bypasses RLS).
-- Looks up invitation by token, creates membership, marks invitation accepted.
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION accept_vehicle_invitation(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_invite RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Nicht angemeldet');
  END IF;

  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users WHERE id = v_user_id;

  -- Lock and fetch the invitation
  SELECT * INTO v_invite
  FROM vehicle_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RETURN json_build_object('error', 'Einladung nicht gefunden');
  END IF;

  IF v_invite.status != 'offen' THEN
    RETURN json_build_object('error', 'Einladung ist nicht mehr aktiv');
  END IF;

  IF v_invite.expires_at < NOW() THEN
    UPDATE vehicle_invitations SET status = 'abgelaufen'
    WHERE id = v_invite.id;
    RETURN json_build_object('error', 'Einladung ist abgelaufen');
  END IF;

  -- Create membership (ON CONFLICT = already a member)
  INSERT INTO vehicle_members (vehicle_id, user_id, role, user_email)
  VALUES (v_invite.vehicle_id, v_user_id, v_invite.role, v_user_email)
  ON CONFLICT (vehicle_id, user_id) DO UPDATE SET role = v_invite.role;

  -- Mark invitation as accepted
  UPDATE vehicle_invitations
  SET status = 'angenommen'
  WHERE id = v_invite.id;

  RETURN json_build_object('success', true, 'vehicleId', v_invite.vehicle_id);
END;
$$;
