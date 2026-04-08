-- Updated accept_vehicle_invitation RPC to carry can_edit_all from invitation to membership

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

  -- Create membership with can_edit_all from invitation
  INSERT INTO vehicle_members (vehicle_id, user_id, role, user_email, can_edit_all)
  VALUES (v_invite.vehicle_id, v_user_id, v_invite.role, v_user_email, COALESCE(v_invite.can_edit_all, FALSE))
  ON CONFLICT (vehicle_id, user_id) DO UPDATE SET role = v_invite.role, can_edit_all = COALESCE(v_invite.can_edit_all, FALSE);

  -- Mark invitation as accepted
  UPDATE vehicle_invitations
  SET status = 'angenommen'
  WHERE id = v_invite.id;

  RETURN json_build_object('success', true, 'vehicleId', v_invite.vehicle_id);
END;
$$;
