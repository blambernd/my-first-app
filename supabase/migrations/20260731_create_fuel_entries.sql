-- PROJ-24: Tankbuch & Verbrauch — Datenbankschema
-- Im Supabase SQL Editor ausführen (Dashboard > SQL Editor > New query)

-- ============================================================
-- FUEL_ENTRIES TABLE
-- ============================================================
CREATE TABLE fuel_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  fueled_at DATE NOT NULL,
  -- Eine Nachkommastelle, max. 999,9 Liter
  liters NUMERIC(4,1) NOT NULL CHECK (liters > 0),
  -- Geld immer als Ganzzahl in Cent, konsistent zu service_entries.cost_cents
  cost_cents INTEGER NOT NULL CHECK (cost_cents >= 0),
  mileage_km INTEGER NOT NULL CHECK (mileage_km >= 0 AND mileage_km <= 9999999),
  is_full_tank BOOLEAN NOT NULL DEFAULT TRUE,
  -- Unterbricht die Verbrauchsberechnung bei Tachowechsel/-rücksetzung
  is_odometer_correction BOOLEAN NOT NULL DEFAULT FALSE,
  station TEXT CHECK (station IS NULL OR length(station) <= 200),
  fuel_type TEXT CHECK (fuel_type IS NULL OR fuel_type IN ('super_e5', 'super_e10', 'super_plus', 'diesel', 'lpg', 'other')),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Hinweis: "Datum nicht in der Zukunft" lässt sich nicht als CHECK abbilden,
-- weil CURRENT_DATE nicht immutable ist. Die Prüfung erfolgt im Formular
-- (Kalender sperrt zukünftige Tage) und im Zod-Schema.

-- ============================================================
-- INDEXES
-- ============================================================
-- Deckt sowohl den Fremdschlüssel-Zugriff als auch die Sortierung der
-- Tankbuch-Seite ab (WHERE vehicle_id = ... ORDER BY fueled_at DESC, created_at DESC)
CREATE INDEX idx_fuel_entries_vehicle_date
  ON fuel_entries(vehicle_id, fueled_at DESC, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE fuel_entries ENABLE ROW LEVEL SECURITY;

-- Lesen: alle, die Zugriff auf das Fahrzeug haben (Besitzer, Werkstatt, Betrachter)
CREATE POLICY "Owner or member can view fuel entries"
  ON fuel_entries FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL);

-- Anlegen: Besitzer und Werkstatt. Betrachter haben nur Leserecht.
CREATE POLICY "Owner or werkstatt can create fuel entries"
  ON fuel_entries FOR INSERT
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  );

-- Bearbeiten: Besitzer und Werkstatt.
-- Anders als bei service_entries ist die Werkstatt hier nicht auf eigene Einträge
-- beschränkt: Ein Tankvorgang ist ein reiner Betriebsbeleg ohne die Haftungsfrage,
-- die bei Werkstatteinträgen im Scheckheft die engere Regel begründet.
CREATE POLICY "Owner or werkstatt can update fuel entries"
  ON fuel_entries FOR UPDATE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  )
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  );

-- Löschen: ausschließlich der Besitzer (PROJ-24 User Story)
CREATE POLICY "Only owner can delete fuel entries"
  ON fuel_entries FOR DELETE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

-- ============================================================
-- TRIGGER
-- ============================================================
-- Nutzt die bestehende Funktion aus PROJ-2
CREATE TRIGGER fuel_entries_updated_at
  BEFORE UPDATE ON fuel_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- KONTROLLE (erwartet: 4 Policies, RLS aktiv, 1 Index)
-- ============================================================
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'fuel_entries';
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'fuel_entries';
--   SELECT indexname FROM pg_indexes WHERE tablename = 'fuel_entries';
