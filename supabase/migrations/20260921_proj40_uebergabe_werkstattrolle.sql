-- PROJ-40: Fahrzeug-Übergabe an den Kunden
--
-- ## Was sich ändert
--
-- Bisher konnte der bisherige Besitzer nach einer Übergabe nur als
-- **Betrachter** verbunden bleiben. Für eine Werkstatt ist das zu wenig:
-- Sie übergibt das Fahrzeug an den Kunden und verliert im selben Moment das
-- Recht, die nächste Inspektion einzutragen. Die Übergabe bestraft damit
-- genau das Verhalten, das erwünscht ist.
--
-- Künftig kann der bisherige Besitzer als **Werkstatt** verbunden bleiben —
-- aber nur, wenn der neue Besitzer dem bei der Annahme zustimmt.
--
-- ## Wer entscheidet
--
-- Bisher entschied der **Absender** beim Anstoßen (`keep_as_viewer`), und
-- der Empfänger sah das nur noch als Mitteilung. Für die Werkstattrolle ist
-- das umgekehrt:
--
--   * `offer_workshop_role` — der **Wunsch** der Werkstatt, gesetzt beim
--     Anstoßen. Er steuert allein, ob die Frage überhaupt erscheint.
--   * `p_grant_workshop`    — die **Entscheidung des Kunden**, gesendet von
--     der Annahmeseite.
--
-- Beide müssen zutreffen. Die doppelte Prüfung ist kein Gürtel-und-
-- Hosenträger: Ohne sie könnte ein zurechtgebauter Aufruf der Annahmeseite
-- einem Vorbesitzer Schreibrechte verschaffen, die er nie angeboten hat.
--
-- ## Umfang des Eingriffs
--
-- Diese Funktion ist der empfindlichste Baustein des Projekts — acht
-- Änderungen aus fünf Features stecken darin. Geändert wird deshalb genau
-- ein Abschnitt: der, der den alten Besitzer als Betrachter einträgt. Alles
-- andere ist Zeile für Zeile aus der Fassung vom 2026-09-20 übernommen.

-- ---- 1. Der Wunsch der Werkstatt an der Übergabe ------------------------

ALTER TABLE vehicle_transfers
  ADD COLUMN IF NOT EXISTS offer_workshop_role BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN vehicle_transfers.offer_workshop_role IS
  'Wunsch des Absenders, nach der Uebergabe als Werkstatt verbunden zu '
  'bleiben (PROJ-40). Steuert nur, ob die Frage bei der Annahme erscheint — '
  'wirksam wird sie erst durch die Zustimmung des Empfaengers.';

-- Die Zustimmung wird festgehalten, nicht nur ihre Wirkung. Sie ist die
-- Rechtsgrundlage dafuer, dass ein fremder Betrieb dauerhaft Zugriff auf
-- die Fahrzeugdaten eines Privatmanns behaelt. Wer sie nur in ihrer Wirkung
-- speichert, kann spaeter nicht belegen, dass sie erteilt wurde.
ALTER TABLE vehicle_transfers
  ADD COLUMN IF NOT EXISTS workshop_role_granted_at TIMESTAMPTZ;

COMMENT ON COLUMN vehicle_transfers.workshop_role_granted_at IS
  'Zeitpunkt, zu dem der Empfaenger der Werkstattrolle zugestimmt hat '
  '(PROJ-40). NULL bedeutet: nicht angeboten oder abgelehnt.';

-- ---- 2. Die Übergabefunktion --------------------------------------------
--
-- ## Die alte Signatur muss weg, bevor die neue kommt
--
-- `CREATE OR REPLACE` ersetzt eine Funktion nur, wenn die Signatur gleich
-- bleibt. Ein zusaetzlicher Parameter macht daraus eine **zweite** Funktion
-- neben der alten. Beide nehmen einen Aufruf mit sechs Argumenten an — der
-- siebte hat ja einen Vorgabewert —, und Postgres lehnt einen solchen Aufruf
-- dann als mehrdeutig ab:
--
--     function accept_vehicle_transfer(...) is not unique
--
-- Das Ergebnis waere, dass **keine einzige Uebergabe mehr funktioniert**.
-- Dieselbe Stelle haben PROJ-33 und PROJ-36 vor uns getroffen; beide loesen
-- es genauso.
DROP FUNCTION IF EXISTS public.accept_vehicle_transfer(
  uuid, bigint, integer, integer, boolean, text
);

CREATE OR REPLACE FUNCTION public.accept_vehicle_transfer(
  p_token uuid,
  p_price_cents bigint DEFAULT NULL::bigint,
  p_condition_grade integer DEFAULT NULL::integer,
  p_mileage_km integer DEFAULT NULL::integer,
  p_share boolean DEFAULT false,
  p_currency text DEFAULT NULL::text,
  -- Neu und mit Vorbelegung ans Ende: Datenbank und Anwendung werden nicht
  -- im selben Moment ausgeliefert. Fuer einige Minuten ruft die alte
  -- Anwendung diese Funktion ohne die neue Angabe auf — mit der Vorbelegung
  -- verhaelt sie sich dann exakt wie bisher, statt Uebergaben scheitern zu
  -- lassen.
  p_grant_workshop boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  -- PROJ-38
  v_seller_is_dealer BOOLEAN;
  v_purchase vehicle_purchases%ROWTYPE;
  v_seller_price BIGINT;
  v_bestehender_vorgang UUID;
  -- PROJ-40
  v_verbleibende_rolle TEXT;
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

  -- ---- PROJ-38: Bestandsvorgang des Verkäufers -------------------------
  -- Muss VOR dem folgenden DELETE stehen. Danach wäre der Kaufpreis fort.
  SELECT COALESCE(is_dealer, false) INTO v_seller_is_dealer
  FROM subscriptions WHERE user_id = v_old_owner_id;

  IF COALESCE(v_seller_is_dealer, false) THEN
    SELECT * INTO v_purchase
    FROM vehicle_purchases
    WHERE vehicle_id = v_transfer.vehicle_id
    LIMIT 1;

    SELECT price_cents INTO v_seller_price
    FROM dealer_transfer_prices
    WHERE transfer_id = v_transfer.id;

    -- QA BUG-6: Hat der Händler dasselbe Fahrzeug schon von Hand als
    -- verkauft gekennzeichnet und holt die Übergabe später nach, entstünde
    -- ein zweiter Vorgang zum selben Verkauf — die Rohspanne würde doppelt
    -- gezählt. Ein vorhandener Vorgang wird deshalb ergänzt, nicht verdoppelt.
    SELECT id INTO v_bestehender_vorgang
    FROM dealer_sales
    WHERE user_id = v_old_owner_id
      AND vehicle_id = v_transfer.vehicle_id
    LIMIT 1;

    IF v_bestehender_vorgang IS NOT NULL THEN
      UPDATE dealer_sales
      SET origin = 'transfer',
          -- Ein beim Absenden erfasster Erlös ist die jüngere Angabe; ohne
          -- ihn bleibt der bereits eingetragene stehen.
          sale_price_cents = COALESCE(v_seller_price, sale_price_cents),
          -- Die Kennung zeigt ab jetzt auf ein fremdes Fahrzeug und wird
          -- für den Bestandsfilter nicht mehr gebraucht.
          vehicle_id = NULL,
          updated_at = NOW()
      WHERE id = v_bestehender_vorgang;
    ELSE
      INSERT INTO dealer_sales (
        user_id, make, model, year, currency,
        purchased_on, purchase_price_cents,
        sold_on, sale_price_cents, origin
      )
      VALUES (
        v_old_owner_id,
        v_vehicle.make, v_vehicle.model, v_vehicle.year,
        -- Die bisherige Währung des Verkäufers, nicht die vom Käufer
        -- gewählte: Sein Einkauf ist in seiner Währung erfasst.
        v_vehicle.currency,
        COALESCE(v_purchase.purchased_on, v_vehicle.created_at::DATE),
        v_purchase.price_cents,
        NOW()::DATE,
        v_seller_price,
        'transfer'
      );
    END IF;
  END IF;

  -- Die Zwischenablage wird in jedem Fall geräumt.
  DELETE FROM dealer_transfer_prices WHERE transfer_id = v_transfer.id;
  -- ---- Ende PROJ-38 ----------------------------------------------------

  DELETE FROM vehicle_purchases WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM recurring_costs   WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM one_off_costs     WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM vehicle_market_values WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM market_analyses   WHERE vehicle_id = v_transfer.vehicle_id;

  -- PROJ-40: Die Kundenangabe der Werkstatt gehoert ihr, nicht dem
  -- Fahrzeug. Sie geht nicht an den neuen Besitzer ueber — er saehe sonst,
  -- unter welchem Namen und welcher Nummer die Werkstatt ihn gefuehrt hat.
  DELETE FROM vehicle_customers WHERE vehicle_id = v_transfer.vehicle_id;

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

  -- ---- PROJ-40: Welche Rolle der bisherige Besitzer behaelt ------------
  --
  -- Der einzige geaenderte Abschnitt dieser Funktion. Vorher stand hier
  -- fest 'betrachter'.
  --
  -- Die Werkstattrolle setzt **beides** voraus: dass die Werkstatt sie
  -- angeboten hat und dass der Kunde zugestimmt hat. Fehlt eines von
  -- beiden, gilt unveraendert die bisherige Regel — Betrachter oder gar
  -- nichts. Damit verhaelt sich jede Uebergabe ohne Werkstattbezug exakt
  -- wie vor dieser Aenderung.
  v_verbleibende_rolle := CASE
    WHEN p_grant_workshop AND COALESCE(v_transfer.offer_workshop_role, false)
      THEN 'werkstatt'
    WHEN v_transfer.keep_as_viewer
      THEN 'betrachter'
    ELSE NULL
  END;

  IF v_verbleibende_rolle IS NOT NULL THEN
    INSERT INTO vehicle_members (vehicle_id, user_id, role, user_email)
    VALUES (v_transfer.vehicle_id, v_old_owner_id, v_verbleibende_rolle,
            (SELECT email FROM auth.users WHERE id = v_old_owner_id))
    ON CONFLICT (vehicle_id, user_id) DO UPDATE SET role = v_verbleibende_rolle;

    IF v_verbleibende_rolle = 'werkstatt' THEN
      UPDATE vehicle_transfers
      SET workshop_role_granted_at = NOW()
      WHERE id = v_transfer.id;
    END IF;
  END IF;
  -- ---- Ende PROJ-40 ----------------------------------------------------

  DELETE FROM vehicle_members
  WHERE vehicle_id = v_transfer.vehicle_id AND user_id = v_new_user_id;

  INSERT INTO vehicle_milestones (vehicle_id, category, milestone_date, title, description, created_by)
  VALUES (v_transfer.vehicle_id, 'besitzerwechsel', NOW()::DATE, 'Besitzerwechsel',
          'Fahrzeug wurde an einen neuen Besitzer übertragen.', v_new_user_id);

  UPDATE vehicle_transfers SET status = 'angenommen' WHERE id = v_transfer.id;

  RETURN json_build_object('success', true, 'vehicleId', v_transfer.vehicle_id);
END;
$function$;

-- ---- 3. Die Uebergabe-Vorschau um den Wunsch ergaenzen ------------------
--
-- Die Annahmeseite braucht zwei Angaben zusaetzlich: ob die Werkstattrolle
-- angeboten wurde und wer sie anbietet — ohne Absender waere die Frage
-- "Weiterhin Zugriff geben?" nicht zu beantworten.
--
-- Die Statuslogik (invalid / accepted / declined / expired) ist Zeile fuer
-- Zeile aus PROJ-7 uebernommen. Sie entscheidet, was die Annahmeseite
-- ueberhaupt anzeigt; ein Fehler darin legt die Seite lahm.

CREATE OR REPLACE FUNCTION get_transfer_by_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer RECORD;
  v_vehicle RECORD;
  v_from_email TEXT;
BEGIN
  SELECT id, vehicle_id, status, expires_at, keep_as_viewer, to_email,
         from_user_id, offer_workshop_role
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

  -- PROJ-40: Nur geholt, wenn die Frage auch erscheint. Die Adresse des
  -- Absenders ist das Einzige, was das System ueber ihn weiss — einen
  -- Firmennamen fuehrt es nicht.
  IF COALESCE(v_transfer.offer_workshop_role, false) THEN
    SELECT email INTO v_from_email
    FROM auth.users WHERE id = v_transfer.from_user_id;
  END IF;

  RETURN json_build_object(
    'status', 'valid',
    'expiresAt', v_transfer.expires_at,
    'keepAsViewer', v_transfer.keep_as_viewer,
    'vehicleName', COALESCE(v_vehicle.make || ' ' || v_vehicle.model || ' (' || v_vehicle.year || ')', 'Fahrzeug'),
    -- PROJ-40
    'offerWorkshopRole', COALESCE(v_transfer.offer_workshop_role, false),
    'fromEmail', v_from_email
  );
END;
$$;
