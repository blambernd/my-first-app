-- PROJ-25: Wiederkehrende Kosten — Datenbankschema
-- Im Supabase SQL Editor ausführen (Dashboard > SQL Editor > New query)

-- ============================================================
-- RECURRING_COSTS TABLE
-- ============================================================
CREATE TABLE recurring_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  -- Erweiterbare Liste: eine neue Kostenart ist eine einzeilige Änderung hier,
  -- die Auswertung bleibt unberührt, weil sie über die Kostenart hinweg arbeitet
  cost_type TEXT NOT NULL CHECK (cost_type IN ('insurance', 'tax', 'storage', 'club')),
  -- Betrag PRO ZAHLUNGSINTERVALL, nicht für den gesamten Zeitraum (Tech Design C2).
  -- Geld immer als Ganzzahl in Cent, konsistent zu service_entries.cost_cents
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  payment_interval TEXT NOT NULL CHECK (payment_interval IN ('yearly', 'half_yearly', 'quarterly', 'monthly')),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  provider TEXT CHECK (provider IS NULL OR length(provider) <= 200),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Anders als "Datum nicht in der Zukunft" lässt sich dies als CHECK abbilden,
  -- weil nur zwei Spalten verglichen werden und keine Funktion im Spiel ist
  CONSTRAINT recurring_costs_period_valid CHECK (valid_to > valid_from)
);

-- ============================================================
-- INDEXES
-- ============================================================
-- Deckt Fremdschlüssel-Zugriff und die Sortierung der Kosten-Seite ab
-- (WHERE vehicle_id = ... ORDER BY valid_from DESC)
CREATE INDEX idx_recurring_costs_vehicle_period
  ON recurring_costs(vehicle_id, valid_from DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE recurring_costs ENABLE ROW LEVEL SECURITY;

-- Lesen: alle mit Fahrzeugzugriff (Besitzer, Werkstatt, Betrachter)
CREATE POLICY "Owner or member can view recurring costs"
  ON recurring_costs FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL);

-- Anlegen: Besitzer und Werkstatt. Betrachter haben nur Leserecht.
CREATE POLICY "Owner or werkstatt can create recurring costs"
  ON recurring_costs FOR INSERT
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  );

-- Bearbeiten: Besitzer und Werkstatt, analog zum Tankbuch
CREATE POLICY "Owner or werkstatt can update recurring costs"
  ON recurring_costs FOR UPDATE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  )
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  );

-- Löschen: ausschließlich der Besitzer.
-- Laufende Kosten enthalten Vertrags- und Beitragsdaten des Halters — eine
-- eingeladene Werkstatt hat daran kein berechtigtes Interesse.
CREATE POLICY "Only owner can delete recurring costs"
  ON recurring_costs FOR DELETE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

-- ============================================================
-- TRIGGER
-- ============================================================
CREATE TRIGGER recurring_costs_updated_at
  BEFORE UPDATE ON recurring_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- KONTROLLE (erwartet: 4 Policies, RLS aktiv, 1 Index)
-- ============================================================
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'recurring_costs';
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'recurring_costs';
--   SELECT indexname FROM pg_indexes WHERE tablename = 'recurring_costs';
