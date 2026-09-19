-- PROJ-38: Händler-Bestandsübersicht
--
-- Vier Teile:
--   1. Der gewerbliche Schalter am Konto
--   2. Tabelle der abgeschlossenen Verkaufsvorgänge
--   3. Zwischenablage für den Erlös eines laufenden Übergabevorgangs
--   4. Die Übergabe schreibt den Vorgang, BEVOR sie die Kaufdaten löscht
--
-- ## Warum Teil 3 eine eigene Tabelle braucht
--
-- Naheliegend wäre ein Feld an `vehicle_transfers` gewesen. Das geht nicht:
-- Die Policy „Invited user can view transfer" lässt den **Käufer** die
-- Transfer-Zeile vollständig lesen. Der Verkaufserlös des Verkäufers stünde
-- damit dem Käufer offen, bevor er seinen eigenen Preis nennt — genau das
-- soll die Spezifikation verhindern. RLS wirkt auf Zeilen, nicht auf
-- Spalten; eine eigene Tabelle mit eigener Leseregel ist die Antwort.


-- ============================================================
-- 1. GEWERBLICHER SCHALTER
-- ============================================================
--
-- Eine Selbstauskunft am Konto, keine Prüfung. Sie schaltet allein den
-- Bestandsbereich frei und hat keine Außenwirkung.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS is_dealer BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN subscriptions.is_dealer IS
  'PROJ-38: Selbstauskunft "Ich verkaufe Fahrzeuge gewerblich". Schaltet den Bestandsbereich frei.';


-- ============================================================
-- 2. ABGESCHLOSSENE VERKAUFSVORGÄNGE
-- ============================================================
--
-- Der Datensatz überlebt das Fahrzeug: Nach einer Übergabe liegt es beim
-- Käufer, nach einer Löschung ist es fort. Deshalb steht hier eine
-- **Abschrift** (Marke, Modell, Baujahr) und ausdrücklich KEINE
-- Fahrzeugkennung — eine Verknüpfung würde den Vorgang mitreißen.
--
-- Ebenso wenig steht hier etwas über den Käufer.

CREATE TABLE IF NOT EXISTS dealer_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Abschrift zum Verkaufszeitpunkt
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT,
  currency TEXT NOT NULL DEFAULT 'EUR',

  purchased_on DATE,
  purchase_price_cents BIGINT,

  sold_on DATE NOT NULL,
  sale_price_cents BIGINT,

  -- Über welchen Weg der Vorgang entstanden ist
  origin TEXT NOT NULL DEFAULT 'manual'
    CHECK (origin IN ('manual', 'transfer')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Eine negative Standzeit gibt es nicht.
  CONSTRAINT dealer_sales_dates CHECK (
    purchased_on IS NULL OR sold_on >= purchased_on
  )
);

ALTER TABLE dealer_sales ENABLE ROW LEVEL SECURITY;

-- Ein Bestandsvorgang gehört genau einem Konto. Es gibt keine Mitleser:
-- weder Werkstatt noch Betrachter noch der Käufer des Fahrzeugs.
DROP POLICY IF EXISTS "Dealers view own sales" ON dealer_sales;
CREATE POLICY "Dealers view own sales"
  ON dealer_sales FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Dealers create own sales" ON dealer_sales;
CREATE POLICY "Dealers create own sales"
  ON dealer_sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Nachtragen und Korrigieren des Erlöses (Kriterium der Spezifikation).
DROP POLICY IF EXISTS "Dealers update own sales" ON dealer_sales;
CREATE POLICY "Dealers update own sales"
  ON dealer_sales FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Dealers delete own sales" ON dealer_sales;
CREATE POLICY "Dealers delete own sales"
  ON dealer_sales FOR DELETE
  USING (auth.uid() = user_id);

-- Der Zugriffsweg der Seite: eigene Vorgänge, jüngster Verkauf zuerst.
CREATE INDEX IF NOT EXISTS idx_dealer_sales_user_sold
  ON dealer_sales(user_id, sold_on DESC);


-- ============================================================
-- 3. ERLÖS EINES LAUFENDEN ÜBERGABEVORGANGS
-- ============================================================
--
-- Zwischenablage zwischen Absenden und Annehmen. Sichtbar ausschließlich
-- für den Verkäufer — siehe Begründung im Kopf dieser Datei.

CREATE TABLE IF NOT EXISTS dealer_transfer_prices (
  transfer_id UUID PRIMARY KEY
    REFERENCES vehicle_transfers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_cents BIGINT NOT NULL CHECK (price_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dealer_transfer_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers manage own transfer prices" ON dealer_transfer_prices;
CREATE POLICY "Sellers manage own transfer prices"
  ON dealer_transfer_prices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 4. ÜBERGABE SCHREIBT DEN BESTANDSVORGANG
-- ============================================================
--
-- Unverändert übernommen bis auf **einen** Einschub vor dem Löschen der
-- Kaufdaten. Die Reihenfolge ist der Kern: PROJ-32 löscht beim Annehmen den
-- Kaufpreis des Vorbesitzers, damit der Käufer die Einkaufskonditionen nicht
-- sieht. Genau daraus errechnet sich aber die Händlerspanne — wird der
-- Vorgang danach geschrieben, ist die Grundlage fort.
--
-- Geschrieben wird nur für Verkäufer, die sich als gewerblich erklärt haben.
-- Für alle anderen entstünde ein Datensatz, den niemand ansieht.

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
  -- PROJ-38
  v_seller_is_dealer BOOLEAN;
  v_purchase vehicle_purchases%ROWTYPE;
  v_seller_price BIGINT;
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

  -- Die Zwischenablage wird in jedem Fall geräumt.
  DELETE FROM dealer_transfer_prices WHERE transfer_id = v_transfer.id;
  -- ---- Ende PROJ-38 ----------------------------------------------------

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
