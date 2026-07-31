-- PROJ-26: Einzelkosten — Datenbankschema
-- Im Supabase SQL Editor ausführen (Dashboard > SQL Editor > New query)

-- ============================================================
-- ONE_OFF_COSTS TABLE
-- ============================================================
CREATE TABLE one_off_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  -- Erweiterbare Liste; eine neue Kostenart ist eine einzeilige Änderung hier
  cost_type TEXT NOT NULL CHECK (cost_type IN ('parts', 'appraisal', 'other')),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 200),
  -- Gesamtpreis für die erfasste Menge, nicht Stückpreis (Tech Design C6)
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  purchased_at DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 9999),
  part_number TEXT CHECK (part_number IS NULL OR length(part_number) <= 100),
  source TEXT CHECK (source IS NULL OR length(source) <= 200),
  installed_at DATE,
  -- ON DELETE SET NULL statt CASCADE: Wird ein Scheckheft-Eintrag gelöscht, soll
  -- die Ausgabe erhalten bleiben und nur die Verknüpfung wegfallen. Zusammen mit
  -- der Auswertungsregel (Ausschluss nur bei gesetztem Kennzeichen UND
  -- bestehender Verknüpfung) zählt der Betrag dann automatisch wieder mit —
  -- er kann nicht dauerhaft und unbemerkt aus der Auswertung verschwinden.
  -- NACHTRAG: Dieser Fremdschlüssel wurde durch einen zusammengesetzten ersetzt,
  -- der zusätzlich die Gleichheit des Fahrzeugs erzwingt — siehe
  -- 20260731_fix_one_off_costs_vehicle_match.sql (QA-Befund BUG-1).
  service_entry_id UUID REFERENCES service_entries(id) ON DELETE SET NULL,
  included_in_service_entry BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- BEWUSST KEINE Regel "Kennzeichen nur mit Verknüpfung".
--
-- Ein erster Entwurf enthielt genau das — und hätte das Löschen eines
-- verknüpften Scheckheft-Eintrags vollständig blockiert: ON DELETE SET NULL
-- erzeugt absichtlich den Zustand "Kennzeichen gesetzt, Verknüpfung weg", den
-- eine solche Regel verbietet. Der Löschversuch scheiterte im Test mit
-- `23514 check constraint violation`.
--
-- Dieser Zustand ist kein Fehler, sondern der Kern des Doppelzählungsschutzes:
-- Fällt die Verknüpfung weg, zählt der Betrag wieder mit. Die Konsistenz wird
-- deshalb dort hergestellt, wo sie hingehört:
--   - Das Formular setzt das Kennzeichen zurück, sobald die Zuordnung entfällt
--   - Die Auswertung schließt nur aus, wenn Kennzeichen UND Verknüpfung vorliegen

-- ============================================================
-- INDEXES
-- ============================================================
-- Deckt Fremdschlüssel-Zugriff und die Sortierung der Seite ab
CREATE INDEX idx_one_off_costs_vehicle_date
  ON one_off_costs(vehicle_id, purchased_at DESC);

-- Für das Auflösen der Scheckheft-Verknüpfung beim Löschen eines Eintrags
CREATE INDEX idx_one_off_costs_service_entry
  ON one_off_costs(service_entry_id)
  WHERE service_entry_id IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE one_off_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or member can view one-off costs"
  ON one_off_costs FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL);

CREATE POLICY "Owner or werkstatt can create one-off costs"
  ON one_off_costs FOR INSERT
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  );

CREATE POLICY "Owner or werkstatt can update one-off costs"
  ON one_off_costs FOR UPDATE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  )
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  );

-- Löschen: ausschließlich der Besitzer, einheitlich zu Tankbuch und laufenden Kosten
CREATE POLICY "Only owner can delete one-off costs"
  ON one_off_costs FOR DELETE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

-- ============================================================
-- TRIGGER
-- ============================================================
CREATE TRIGGER one_off_costs_updated_at
  BEFORE UPDATE ON one_off_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- KONTROLLE (erwartet: 4 Policies, RLS aktiv, 2 Indexe zzgl. Primärschlüssel)
-- ============================================================
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'one_off_costs';
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'one_off_costs';
--   SELECT indexname FROM pg_indexes WHERE tablename = 'one_off_costs';
