-- RPC: Cancel a vehicle transfer (owner-only)
-- Bypasses RLS with SECURITY DEFINER while checking ownership.
CREATE OR REPLACE FUNCTION cancel_vehicle_transfer(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_transfer RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Nicht angemeldet');
  END IF;

  -- Find the transfer
  SELECT vt.id, vt.vehicle_id, vt.status
  INTO v_transfer
  FROM vehicle_transfers vt
  WHERE vt.token = p_token;

  IF v_transfer IS NULL THEN
    RETURN json_build_object('error', 'Transfer nicht gefunden');
  END IF;

  IF v_transfer.status != 'offen' THEN
    RETURN json_build_object('error', 'Transfer ist nicht mehr aktiv');
  END IF;

  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM vehicles
    WHERE id = v_transfer.vehicle_id AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('error', 'Nur der Besitzer kann den Transfer abbrechen');
  END IF;

  -- Cancel the transfer
  UPDATE vehicle_transfers SET status = 'abgebrochen' WHERE id = v_transfer.id;

  RETURN json_build_object('success', true);
END;
$$;


-- RPC: Get pending requests (transfers + invitations) for the current user
-- Returns only requests addressed to the user's email (not their own vehicles).
CREATE OR REPLACE FUNCTION get_pending_requests()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_transfers JSON;
  v_invitations JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('transfers', '[]'::json, 'invitations', '[]'::json);
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Pending transfers addressed to this user (not for vehicles they own)
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_transfers
  FROM (
    SELECT vt.id, vt.token, vt.expires_at,
           v.make || ' ' || v.model AS vehicle_name
    FROM vehicle_transfers vt
    JOIN vehicles v ON v.id = vt.vehicle_id
    WHERE lower(vt.to_email) = lower(v_user_email)
      AND vt.status = 'offen'
      AND vt.expires_at > NOW()
      AND v.user_id != v_user_id
    ORDER BY vt.created_at DESC
    LIMIT 10
  ) t;

  -- Pending invitations addressed to this user (not for vehicles they own)
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_invitations
  FROM (
    SELECT vi.id, vi.token, vi.role, vi.expires_at,
           v.make || ' ' || v.model AS vehicle_name
    FROM vehicle_invitations vi
    JOIN vehicles v ON v.id = vi.vehicle_id
    WHERE lower(vi.email) = lower(v_user_email)
      AND vi.status = 'offen'
      AND vi.expires_at > NOW()
      AND v.user_id != v_user_id
    ORDER BY vi.created_at DESC
    LIMIT 10
  ) t;

  RETURN json_build_object('transfers', v_transfers, 'invitations', v_invitations);
END;
$$;
