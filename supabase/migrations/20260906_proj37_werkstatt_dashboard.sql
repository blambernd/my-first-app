-- PROJ-37: Werkstatt-Dashboard
--
-- Drei Teile, in dieser Reihenfolge:
--   1. Leseregel für Fahrzeugtermine (TÜV/HU, Service) für Werkstatt-Mitglieder
--   2. Eine gebündelte Abfragefunktion für die Seite /werkstatt
--   3. Indizes für die beiden Zugriffswege dieser Funktion
--
-- Es entsteht KEINE neue Tabelle. Das Dashboard zeigt ausschließlich Daten,
-- die über bestehende Mitgliedschaften ohnehin zugänglich sind — mit einer
-- Ausnahme, siehe Teil 1.
--
-- Stand 2026-09-06: Diese Datei enthält die Behebung von QA BUG-2, BUG-3 und
-- BUG-4. Sie wurde zum Zeitpunkt der Korrektur noch nie angewendet, deshalb
-- wird sie geändert statt durch eine Folgemigration ergänzt.


-- ============================================================
-- 1. FAHRZEUGTERMINE FÜR DIE WERKSTATT LESBAR
-- ============================================================
--
-- Bisher galt für vehicle_due_dates nur "Users manage own due dates"
-- (auth.uid() = user_id) — die Termine waren damit ausschließlich für den
-- Besitzer sichtbar. Ohne diese Erweiterung bliebe die Terminübersicht der
-- Werkstatt halbblind: Die HU ist der häufigste Wiedervorlagegrund, wird aber
-- bislang nur vom Besitzer gepflegt.
--
-- Bewusst NUR lesend und NUR für die Rolle 'werkstatt'. Anlegen, Ändern und
-- Löschen bleiben beim Besitzer — die Werkstatt braucht die Information,
-- nicht die Hoheit darüber. Betrachter erhalten sie nicht: Sie sollen die
-- Historie einsehen, nicht die Terminplanung des Halters.
--
-- Policies sind ODER-verknüpft; die bestehende Regel bleibt unberührt.

DROP POLICY IF EXISTS "Werkstatt can view vehicle due dates" ON vehicle_due_dates;
CREATE POLICY "Werkstatt can view vehicle due dates"
  ON vehicle_due_dates FOR SELECT
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
  );


-- ============================================================
-- 2. GEBÜNDELTE ABFRAGE FÜR /werkstatt
-- ============================================================
--
-- Ersetzt drei Einzelabfragen samt einem Ladelimit von 2000 Einträgen in der
-- Seite. Verdichtet wird in der Datenbank: Zurück kommt je Fahrzeug eine
-- Zeile, nicht die Einträge selbst.
--
-- ## Warum SECURITY DEFINER
--
-- Die Funktion aggregiert über service_entries und vehicle_due_dates mehrerer
-- Fahrzeuge. Mit RLS je Zeile wäre das eine Abfrage je Fahrzeug. Die
-- Zugriffsprüfung passiert deshalb einmal und explizit im CTE `ws`: Es gibt
-- ausschließlich Fahrzeuge zurück, an denen der ANRUFENDE Nutzer die Rolle
-- 'werkstatt' hat. Ohne Sitzung kommt eine leere Antwort.
--
-- ## Warum Beträge hier gefiltert werden und nicht in der Anzeige
--
-- `own_cost_cents` und `own_entry_count` zählen nur Einträge mit
-- created_by = auth.uid(). Fremde Beträge verlassen die Datenbank nicht —
-- ein direkter Aufruf der Funktion liefert sie ebenso wenig wie die Seite.
-- Das ist die zusätzliche Beschränkung der Dashboard-Ansicht; auf der
-- Fahrzeugseite sieht die Werkstatt wie bisher alle Beträge.
--
-- ## Was NICHT zurückkommt
--
-- Keine Kontaktdaten des Besitzers, keine Kostendaten aus anderen Quellen
-- (Tankbuch, laufende Kosten, Einzelkosten, Kaufpreis), keine Dokumente.
-- Die Auswahl ist die Zugriffsgrenze — was hier nicht steht, ist über diesen
-- Weg nicht erreichbar.

CREATE OR REPLACE FUNCTION get_workshop_dashboard()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_total INT;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'vehicles', '[]'::json,
      'dues', '[]'::json,
      'total_vehicle_count', 0
    );
  END IF;

  -- QA BUG-3: Die Gesamtzahl wird ohne Begrenzung ermittelt. Die Anzeige darf
  -- nicht „100 betreute Fahrzeuge" behaupten, wenn es 130 sind — sie soll die
  -- Kürzung benennen können.
  SELECT COUNT(*)
  INTO v_total
  FROM vehicle_members vm
  WHERE vm.user_id = v_user_id
    AND vm.role = 'werkstatt';

  WITH ws AS (
    -- Die Zugriffsgrenze. Alles Weitere hängt an diesem CTE.
    --
    -- QA BUG-3: Mit ORDER BY ist die Auswahl bei mehr als 100 Fahrzeugen
    -- bestimmt und wiederholbar — ohne wäre es dieselbe Willkür wie beim
    -- Terminlimit.
    SELECT vm.vehicle_id
    FROM vehicle_members vm
    JOIN vehicles v ON v.id = vm.vehicle_id
    WHERE vm.user_id = v_user_id
      AND vm.role = 'werkstatt'
    ORDER BY v.make, v.model, v.id
    LIMIT 100
  ),
  corr AS (
    -- QA BUG-4: Zeitpunkt der jüngsten Tacho-Korrektur je Fahrzeug.
    --
    -- Nach einem Tachotausch beginnt die Zählung von vorn. Ein blindes MAX()
    -- über alle Einträge zeigte danach dauerhaft den höheren Stand von VOR
    -- dem Tausch — bei Oldtimern kein Sonderfall. Dieselbe Vorsicht wenden
    -- Tankbuch und Kostenanalyse bereits an.
    SELECT se.vehicle_id, MAX(se.service_date) AS corrected_at
    FROM service_entries se
    JOIN ws ON ws.vehicle_id = se.vehicle_id
    WHERE se.is_odometer_correction
    GROUP BY se.vehicle_id
  ),
  agg AS (
    SELECT
      se.vehicle_id,
      MAX(se.mileage_km) FILTER (
        WHERE se.service_date >= COALESCE(corr.corrected_at, '-infinity'::date)
      ) AS last_mileage_km,
      MAX(se.service_date) AS last_entry_date,
      COUNT(*) FILTER (WHERE se.created_by = v_user_id) AS own_entry_count,
      SUM(se.cost_cents) FILTER (WHERE se.created_by = v_user_id) AS own_cost_cents
    FROM service_entries se
    JOIN ws ON ws.vehicle_id = se.vehicle_id
    LEFT JOIN corr ON corr.vehicle_id = se.vehicle_id
    GROUP BY se.vehicle_id
  ),
  all_dues AS (
    -- Zwei getrennt gewachsene Terminquellen, für die Werkstatt eine Liste.
    SELECT
      se.vehicle_id,
      se.entry_type::text AS label_key,
      se.next_due_date AS due_date,
      'service_entry'::text AS source
    FROM service_entries se
    JOIN ws ON ws.vehicle_id = se.vehicle_id
    WHERE se.next_due_date IS NOT NULL

    UNION ALL

    SELECT
      dd.vehicle_id,
      dd.due_type::text AS label_key,
      dd.due_date,
      'vehicle_due_date'::text AS source
    FROM vehicle_due_dates dd
    JOIN ws ON ws.vehicle_id = dd.vehicle_id
  ),
  next_due AS (
    SELECT DISTINCT ON (d.vehicle_id)
      d.vehicle_id, d.label_key, d.due_date, d.source
    FROM all_dues d
    ORDER BY d.vehicle_id, d.due_date ASC
  )
  SELECT json_build_object(
    'vehicles', COALESCE((
      SELECT json_agg(row_to_json(v) ORDER BY v.make, v.model)
      FROM (
        SELECT
          veh.id,
          veh.make,
          veh.model,
          veh.year,
          veh.license_plate,
          veh.currency,
          agg.last_mileage_km,
          agg.last_entry_date,
          COALESCE(agg.own_entry_count, 0) AS own_entry_count,
          agg.own_cost_cents,
          nd.label_key AS next_due_label_key,
          nd.due_date AS next_due_date,
          nd.source AS next_due_source
        FROM vehicles veh
        JOIN ws ON ws.vehicle_id = veh.id
        LEFT JOIN agg ON agg.vehicle_id = veh.id
        LEFT JOIN next_due nd ON nd.vehicle_id = veh.id
      ) v
    ), '[]'::json),
    'dues', COALESCE((
      SELECT json_agg(row_to_json(d) ORDER BY d.due_date ASC)
      FROM (
        SELECT vehicle_id, label_key, due_date, source
        FROM all_dues
        -- Überfällige ohne Untergrenze: Ein drei Jahre alter Termin ist kein
        -- Altdatensatz, sondern genau die Information, für die es die Liste
        -- gibt. Nach oben begrenzt auf ein Jahr — die Anzeige zeigt 90 Tage,
        -- der Puffer erlaubt spätere Änderungen ohne neue Migration.
        WHERE due_date <= CURRENT_DATE + INTERVAL '365 days'
        -- QA BUG-2: Das Limit MUSS auf einer sortierten Menge greifen. Ohne
        -- ORDER BY entschied die Datenbank, welche 500 Termine zurückkommen —
        -- ausgerechnet die überfälligen konnten dabei entfallen.
        ORDER BY due_date ASC
        LIMIT 500
      ) d
    ), '[]'::json),
    'total_vehicle_count', v_total
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Anonyme Aufrufer haben hier nichts zu suchen; ohne Sitzung liefert die
-- Funktion ohnehin eine leere Antwort.
REVOKE ALL ON FUNCTION get_workshop_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_workshop_dashboard() TO authenticated;


-- ============================================================
-- 3. INDIZES
-- ============================================================

-- Der Einstiegspunkt jeder Abfrage dieser Seite: „welche Fahrzeuge betreue
-- ich als Werkstatt?"
CREATE INDEX IF NOT EXISTS idx_vehicle_members_user_role
  ON vehicle_members(user_id, role);

-- Für die Terminquelle an den Scheckheft-Einträgen. Der Teilindex bleibt
-- klein: Nur ein Bruchteil der Einträge trägt überhaupt einen Folgetermin.
CREATE INDEX IF NOT EXISTS idx_service_entries_next_due
  ON service_entries(vehicle_id, next_due_date)
  WHERE next_due_date IS NOT NULL;

-- Für die Aggregation je Fahrzeug (Kilometerstand, letzter Eintrag) und für
-- die Suche nach der jüngsten Tacho-Korrektur.
CREATE INDEX IF NOT EXISTS idx_service_entries_vehicle_date
  ON service_entries(vehicle_id, service_date DESC);
