-- PROJ-32: Kostendaten beim Fahrzeug-Transfer entfernen
--
-- Beim Besitzerwechsel gilt: Wartungs- und Verbrauchshistorie ist
-- Fahrzeugwissen und geht mit über, Beträge sind persönliche Finanzdaten und
-- bleiben beim bisherigen Besitzer. Ein Scheckheft-Eintrag „Vergaser überholt,
-- 82.000 km" wandert mit, die 1.240 € daneben nicht.
--
-- Das Entfernen gehört in DIESELBE Funktion wie der Besitzerwechsel. Eine
-- plpgsql-Funktion ist eine Transaktion: Ein halb entfernter Zustand —
-- Fahrzeug übertragen, Kosten noch da oder umgekehrt — kann gar nicht erst
-- entstehen. Das ist die schärfste Anforderung der Spec und hier geschenkt.
--
-- Die Funktion läuft als SECURITY DEFINER. Das ist hier nicht bequem, sondern
-- nötig: Angenommen wird vom NEUEN Besitzer, gelöscht werden Daten des ALTEN.
-- Über die normalen Zugriffsregeln ginge das nicht.

-- 1) Zeitpunkt am Fahrzeug ---------------------------------------------------
--
-- Der neue Besitzer soll erkennen, dass Beträge entfernt wurden und nicht etwa
-- nie gepflegt waren. Ein Vermerk am Fahrzeug genügt dafür; jeden einzelnen
-- Eintrag zu kennzeichnen wäre viel Aufwand für dieselbe Aussage.
--
-- Ein Datum, an dem der Besitzer gewechselt hat, ist keine schützenswerte
-- Angabe — der Wechsel steht ohnehin als Meilenstein in der Fahrzeug-Historie.
-- Es gelten deshalb die vorhandenen Regeln der Tabelle vehicles, ohne Zusatz.

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS costs_cleared_at TIMESTAMPTZ;

-- 1b) Tankbetrag muss leer sein können ---------------------------------------
--
-- Der Spec verlangt, den Betrag zu **leeren**. Bisher ist die Spalte NOT NULL,
-- es bliebe also nur die 0 — und die ist eine Aussage: „Dieser Tankvorgang war
-- gratis." Das wäre in jeder Zeile der Tankhistorie eine Unwahrheit, und der
-- Preis je Liter läge bei 0,00 €.
--
-- Beim Scheckheft ist die Spalte längst nullable; das Tankbuch zieht nach.
-- Für neue Einträge bleibt der Betrag Pflicht — das erzwingt das Formular.

ALTER TABLE fuel_entries
  ALTER COLUMN cost_cents DROP NOT NULL;

COMMENT ON COLUMN fuel_entries.cost_cents IS
  'Betrag in Cent. NULL bedeutet „kein Betrag bekannt" — entsteht beim '
  'Besitzerwechsel (PROJ-32). Neue Einträge verlangen einen Betrag.';

COMMENT ON COLUMN vehicles.costs_cleared_at IS
  'Zeitpunkt, zu dem die Kostenangaben wegen eines Besitzerwechsels entfernt '
  'wurden (PROJ-32). NULL, solange das nie geschehen ist. Unterscheidet für '
  'den neuen Besitzer „wurde entfernt" von „wurde nie erfasst".';

-- 2) Entfernen in der Übergabe ----------------------------------------------

CREATE OR REPLACE FUNCTION public.accept_vehicle_transfer(p_token uuid)
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
BEGIN
  v_new_user_id := auth.uid();
  IF v_new_user_id IS NULL THEN
    RETURN json_build_object('error', 'Nicht angemeldet');
  END IF;

  SELECT email INTO v_new_user_email
  FROM auth.users WHERE id = v_new_user_id;

  SELECT * INTO v_transfer
  FROM vehicle_transfers
  WHERE token = p_token
  FOR UPDATE;

  IF v_transfer IS NULL THEN
    RETURN json_build_object('error', 'Transfer nicht gefunden');
  END IF;

  IF v_transfer.status != 'offen' THEN
    RETURN json_build_object('error', 'Transfer ist nicht mehr aktiv');
  END IF;

  IF v_transfer.expires_at < NOW() THEN
    UPDATE vehicle_transfers SET status = 'abgelaufen'
    WHERE id = v_transfer.id;
    RETURN json_build_object('error', 'Transfer ist abgelaufen');
  END IF;

  IF lower(v_new_user_email) != lower(v_transfer.to_email) THEN
    RETURN json_build_object('error', 'Deine E-Mail-Adresse stimmt nicht mit der Einladung überein');
  END IF;

  IF v_new_user_id = v_transfer.from_user_id THEN
    RETURN json_build_object('error', 'Du kannst das Fahrzeug nicht an dich selbst übertragen');
  END IF;

  SELECT * INTO v_vehicle
  FROM vehicles WHERE id = v_transfer.vehicle_id;
  v_old_owner_id := v_vehicle.user_id;

  -- Jede vorzeitige Rückkehr oberhalb dieser Zeile lässt die Kostendaten
  -- unberührt: Ein abgelehnter, stornierter oder abgelaufener Transfer darf
  -- nichts entfernen. Genau deshalb steht das Entfernen hier und nicht beim
  -- Absenden der Einladung.

  -- === PROJ-32: Beträge des Vorbesitzers entfernen ===
  --
  -- Vollständig gelöscht: Diese Einträge SIND die Ausgabe. Ohne Betrag bliebe
  -- eine leere Hülle.
  --
  -- vehicle_purchase_costs wird nicht eigens gelöscht — der Fremdschlüssel auf
  -- vehicle_purchases steht auf ON DELETE CASCADE, die Nebenkosten gehen mit
  -- dem Kaufpreis.
  DELETE FROM vehicle_purchases WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM recurring_costs   WHERE vehicle_id = v_transfer.vehicle_id;
  DELETE FROM one_off_costs     WHERE vehicle_id = v_transfer.vehicle_id;

  -- Der selbst eingetragene Marktwert ist die Einschätzung des Vorbesitzers
  -- und Grundlage seiner Wertentwicklung. Bliebe er stehen, stünde die
  -- Wertentwicklung des neuen Besitzers halb gefüllt da: fremder Marktwert,
  -- kein eigener Kaufpreis.
  DELETE FROM vehicle_market_values WHERE vehicle_id = v_transfer.vehicle_id;

  -- Nur der Betrag, die Zeile bleibt: Ein Scheckheft-Eintrag ist ein Ereignis
  -- am Fahrzeug, das zufällig Geld gekostet hat. Datum, Typ, Beschreibung,
  -- Kilometerstand, Werkstatt, Notizen und verknüpfte Dokumente sind
  -- Fahrzeugwissen und bleiben unverändert.
  UPDATE service_entries
  SET cost_cents = NULL
  WHERE vehicle_id = v_transfer.vehicle_id
    AND cost_cents IS NOT NULL;

  -- Beim Tankbuch ebenso. Liter, Kilometerstand, Volltank-Kennzeichen und
  -- Kraftstoffart bleiben — deshalb rechnet die Verbrauchsanzeige nach dem
  -- Transfer unverändert weiter. Sie kommt ohne Geld aus.
  UPDATE fuel_entries
  SET cost_cents = NULL
  WHERE vehicle_id = v_transfer.vehicle_id
    AND cost_cents IS NOT NULL;
  -- === Ende PROJ-32 ===

  UPDATE vehicles
  SET user_id = v_new_user_id,
      costs_cleared_at = NOW(),
      updated_at = NOW()
  WHERE id = v_transfer.vehicle_id;

  IF v_transfer.keep_as_viewer THEN
    INSERT INTO vehicle_members (vehicle_id, user_id, role, user_email)
    VALUES (v_transfer.vehicle_id, v_old_owner_id, 'betrachter',
            (SELECT email FROM auth.users WHERE id = v_old_owner_id))
    ON CONFLICT (vehicle_id, user_id) DO UPDATE SET role = 'betrachter';
  END IF;

  DELETE FROM vehicle_members
  WHERE vehicle_id = v_transfer.vehicle_id
  AND user_id = v_new_user_id;

  INSERT INTO vehicle_milestones (vehicle_id, category, milestone_date, title, description, created_by)
  VALUES (
    v_transfer.vehicle_id,
    'besitzerwechsel',
    NOW()::DATE,
    'Besitzerwechsel',
    'Fahrzeug wurde an einen neuen Besitzer übertragen.',
    v_new_user_id
  );

  UPDATE vehicle_transfers
  SET status = 'angenommen'
  WHERE id = v_transfer.id;

  RETURN json_build_object('success', true, 'vehicleId', v_transfer.vehicle_id);
END;
$function$;
