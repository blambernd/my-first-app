-- PROJ-36: Der Käufer darf beim Übernehmen die Währung neu wählen.
--
-- Warum überhaupt: Ohne diese Wahl säße ein Schweizer Käufer eines deutschen
-- Wagens fest und müsste Franken-Beträge in ein Euro-Feld tippen. Die
-- Kostendaten des Verkäufers werden bei der Übergabe ohnehin gelöscht
-- (PROJ-32) — es bleibt also nichts falsch beschriftet zurück.
--
-- Die alte Fassung wird AUSDRÜCKLICH entfernt und nicht nur ersetzt. Am
-- 2026-08-04 entstand bei genau dieser Funktion eine zweite Fassung mit
-- weniger Parametern, weil CREATE OR REPLACE mit geänderter Signatur eine
-- Überladung anlegt statt zu überschreiben. Ein Aufruf hätte dann still die
-- Angaben des Käufers verworfen. Zwei Fassungen nebeneinander sind hier kein
-- Schönheitsfehler, sondern lautloser Datenverlust.
DROP FUNCTION IF EXISTS accept_vehicle_transfer(uuid, bigint, integer, integer, boolean);

CREATE OR REPLACE FUNCTION public.accept_vehicle_transfer(
  p_token uuid,
  p_price_cents bigint DEFAULT NULL::bigint,
  p_condition_grade integer DEFAULT NULL::integer,
  p_mileage_km integer DEFAULT NULL::integer,
  p_share boolean DEFAULT false,
  p_currency text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_transfer vehicle_transfers%ROWTYPE;
  v_new_user_id UUID;
  v_new_user_email TEXT;
  v_vehicle vehicles%ROWTYPE;
  v_old_owner_id UUID;
  v_grade INT;
  v_km INT;
  v_paar_bisher INT;
  v_currency TEXT;
BEGIN
  v_new_user_id := auth.uid();
  IF v_new_user_id IS NULL THEN
    RETURN json_build_object('error', 'Nicht angemeldet');
  END IF;

  SELECT email INTO v_new_user_email FROM auth.users WHERE id = v_new_user_id;

  SELECT * INTO v_transfer FROM vehicle_transfers WHERE token = p_token FOR UPDATE;

  IF v_transfer IS NULL THEN
    RETURN json_build_object('error', 'Transfer nicht gefunden');
  END IF;

  IF v_transfer.status != 'offen' THEN
    RETURN json_build_object('error', 'Transfer ist nicht mehr aktiv');
  END IF;

  IF v_transfer.expires_at < NOW() THEN
    UPDATE vehicle_transfers SET status = 'abgelaufen' WHERE id = v_transfer.id;
    RETURN json_build_object('error', 'Transfer ist abgelaufen');
  END IF;

  IF lower(v_new_user_email) != lower(v_transfer.to_email) THEN
    RETURN json_build_object('error', 'Deine E-Mail-Adresse stimmt nicht mit der Einladung überein');
  END IF;

  IF v_new_user_id = v_transfer.from_user_id THEN
    RETURN json_build_object('error', 'Du kannst das Fahrzeug nicht an dich selbst übertragen');
  END IF;

  SELECT * INTO v_vehicle FROM vehicles WHERE id = v_transfer.vehicle_id;
  v_old_owner_id := v_vehicle.user_id;

  -- Ein unbekannter oder fehlender Code behält die bisherige Währung. Die
  -- Übergabe an einer Währungsangabe scheitern zu lassen wäre die schlechtere
  -- Antwort: Der Besitzerwechsel ist die Hauptsache, die Währung eine
  -- Nebenangabe, die der Käufer jederzeit im Fahrzeug ändern kann.
  v_currency := CASE
    WHEN p_currency IN ('EUR','CHF','GBP','USD','SEK','DKK','NOK','PLN','CZK')
      THEN p_currency
    ELSE v_vehicle.currency
  END;

  DELETE FROM vehicle_purchases WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM recurring_costs   WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM one_off_costs     WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM vehicle_market_values WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM market_analyses   WHERE vehicle_id = v_transfer.vehicle_id;

  UPDATE service_entries SET cost_cents = NULL
  WHERE vehicle_id = v_transfer.vehicle_id AND cost_cents IS NOT NULL;

  UPDATE fuel_entries SET cost_cents = NULL
  WHERE vehicle_id = v_transfer.vehicle_id AND cost_cents IS NOT NULL;

  UPDATE vehicles
  SET user_id = v_new_user_id,
      currency = v_currency,
      costs_cleared_at = NOW(),
      updated_at = NOW()
  WHERE id = v_transfer.vehicle_id;

  v_grade := COALESCE(p_condition_grade, v_vehicle.condition_grade);
  v_km := COALESCE(
    p_mileage_km,
    (SELECT max(mileage_km) FROM fuel_entries WHERE vehicle_id = v_transfer.vehicle_id),
    (SELECT max(mileage_km) FROM service_entries WHERE vehicle_id = v_transfer.vehicle_id)
  );

  IF p_price_cents IS NOT NULL AND p_price_cents > 0 THEN
    INSERT INTO vehicle_purchases (vehicle_id, price_cents, purchased_on, created_by)
    VALUES (v_transfer.vehicle_id, p_price_cents, NOW()::DATE, v_new_user_id);
  END IF;

  -- Ungerichtet: Der laufende Transfer steht noch auf 'offen' und zaehlt nicht.
  v_paar_bisher := zaehle_paar_uebertragungen(v_transfer.from_user_id, v_new_user_id);

  -- Die Plausibilitaetsgrenzen (500 bis 2.000.000) gelten je Waehrung
  -- unveraendert und ohne Umrechnung: Sie fangen Zehnerpotenz-Vertipper, sie
  -- bilden keine Kaufkraft ab.
  IF p_share
     AND NOT v_vehicle.sale_reported
     AND v_paar_bisher < 3
     AND p_price_cents IS NOT NULL
     AND p_price_cents BETWEEN 50000 AND 200000000
     AND v_grade BETWEEN 1 AND 5
     AND v_km IS NOT NULL AND v_km >= 0
     AND v_vehicle.make IS NOT NULL
     AND v_vehicle.model IS NOT NULL
     AND v_vehicle.year IS NOT NULL
  THEN
    INSERT INTO vehicle_sales (
      make, model, build_year, mileage_bucket, condition_grade, price_cents,
      sold_month, currency
    )
    VALUES (
      v_vehicle.make, v_vehicle.model, v_vehicle.year,
      LEAST(FLOOR(v_km / 25000) * 25000, 250000),
      v_grade, p_price_cents, to_char(NOW(), 'YYYY-MM'), v_currency
    );

    UPDATE vehicles SET sale_reported = true WHERE id = v_transfer.vehicle_id;
  END IF;

  IF v_transfer.keep_as_viewer THEN
    INSERT INTO vehicle_members (vehicle_id, user_id, role, user_email)
    VALUES (v_transfer.vehicle_id, v_old_owner_id, 'betrachter',
            (SELECT email FROM auth.users WHERE id = v_old_owner_id))
    ON CONFLICT (vehicle_id, user_id) DO UPDATE SET role = 'betrachter';
  END IF;

  DELETE FROM vehicle_members
  WHERE vehicle_id = v_transfer.vehicle_id AND user_id = v_new_user_id;

  INSERT INTO vehicle_milestones (vehicle_id, category, milestone_date, title, description, created_by)
  VALUES (v_transfer.vehicle_id, 'besitzerwechsel', NOW()::DATE, 'Besitzerwechsel',
          'Fahrzeug wurde an einen neuen Besitzer übertragen.', v_new_user_id);

  UPDATE vehicle_transfers SET status = 'angenommen' WHERE id = v_transfer.id;

  RETURN json_build_object('success', true, 'vehicleId', v_transfer.vehicle_id);
END;
$function$;
