-- PROJ-28: Kaufpreis & Wertentwicklung — Datenbankschema
--
-- WARUM EIGENE TABELLEN UND KEINE SPALTE AN `vehicles` (Tech Design C1):
--
-- Vier Stellen im Code lesen das Fahrzeug mit **allen** Spalten, darunter
-- `src/app/vehicles/[id]/layout.tsx`, das für eingeladene Mitglieder
-- ausdrücklich `vehicles(*, vehicle_images(*))` lädt. Eine Preisspalte an
-- `vehicles` ginge damit bei jedem Seitenaufruf an jede Werkstatt und jeden
-- Betrachter — auch wenn die Oberfläche sie nirgends anzeigt.
--
-- Row Level Security kann das nicht verhindern: Sie wirkt auf Zeilen, nicht
-- auf Spalten. Mit eigenen Tabellen ist der Kaufpreis strukturell
-- unerreichbar — keine bestehende Abfrage berührt sie, und die öffentlichen
-- Pfade (Kurzprofil, Inserat) fragen ohnehin nur einzelne Fahrzeugspalten ab.

-- ============================================================
-- ANSCHAFFUNG (höchstens eine je Fahrzeug)
-- ============================================================
CREATE TABLE vehicle_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  purchased_on DATE NOT NULL,
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ziel für den zusammengesetzten Fremdschlüssel der Nebenkosten
  CONSTRAINT vehicle_purchases_id_vehicle_key UNIQUE (id, vehicle_id)
);

-- ============================================================
-- KAUF-NEBENKOSTEN (beliebig viele je Anschaffung)
-- ============================================================
CREATE TABLE vehicle_purchase_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL,
  -- Bewusst mitgeführt: Die Zugriffsregel braucht das Fahrzeug direkt, sonst
  -- müsste jede Prüfung über eine Unterabfrage laufen.
  vehicle_id UUID NOT NULL,
  label TEXT NOT NULL CHECK (length(label) BETWEEN 1 AND 100),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Zusammengesetzter Fremdschlüssel statt einspaltigem: Er erzwingt, dass
  -- `vehicle_id` zur Anschaffung passt. Ohne ihn könnte eine Nebenkosten-Zeile
  -- ein anderes Fahrzeug nennen als ihre Anschaffung — genau der Fall, der in
  -- PROJ-26 als BUG-1 auffiel und dort nachträglich behoben werden musste.
  CONSTRAINT vehicle_purchase_costs_purchase_fkey
    FOREIGN KEY (purchase_id, vehicle_id)
    REFERENCES vehicle_purchases (id, vehicle_id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXE
-- ============================================================
-- vehicle_id ist auf vehicle_purchases bereits durch UNIQUE abgedeckt.
CREATE INDEX idx_vehicle_purchase_costs_purchase
  ON vehicle_purchase_costs (purchase_id, vehicle_id);

-- ============================================================
-- ROW LEVEL SECURITY — ausschließlich der Besitzer
-- ============================================================
-- Kein Freigabeschalter (Tech Design C10): Der Kaufpreis ist die sensibelste
-- Angabe im Produkt. Eine Ausnahme wäre eine weitere Stelle, an der etwas
-- versehentlich offenstehen kann.
ALTER TABLE vehicle_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_purchase_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only owner can view purchase"
  ON vehicle_purchases FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can create purchase"
  ON vehicle_purchases FOR INSERT
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can update purchase"
  ON vehicle_purchases FOR UPDATE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer')
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can delete purchase"
  ON vehicle_purchases FOR DELETE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can view purchase costs"
  ON vehicle_purchase_costs FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can create purchase costs"
  ON vehicle_purchase_costs FOR INSERT
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can update purchase costs"
  ON vehicle_purchase_costs FOR UPDATE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer')
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can delete purchase costs"
  ON vehicle_purchase_costs FOR DELETE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

-- ============================================================
-- TRIGGER
-- ============================================================
CREATE TRIGGER vehicle_purchases_updated_at
  BEFORE UPDATE ON vehicle_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- KONTROLLE
-- ============================================================
--   Besitzer sieht seine Zeile, Werkstatt und Betrachter sehen 0 Zeilen.
--   Gegenprobe nicht vergessen — ohne sie ist "0 Zeilen" auch bei leerer
--   Tabelle erfüllt.
