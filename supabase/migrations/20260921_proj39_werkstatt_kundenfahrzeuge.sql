-- PROJ-39: Werkstatt-Konto & Kundenfahrzeuge
--
-- Zwei Dinge: eine Selbstauskunft am Konto und eine Ablage für
-- Kundenangaben zu selbst angelegten Fahrzeugen.
--
-- ## Die Selbstauskunft ist keine Berechtigung
--
-- `is_workshop` entscheidet allein darüber, ob jemand den Werkstattbereich
-- sieht und dort eigene Fahrzeuge anlegen kann — Fahrzeuge, bei denen er
-- ohnehin Besitzer ist. Sie darf an keiner Stelle darüber entscheiden, wer
-- **fremde** Fahrzeuge lesen darf. Dieser Zugriff hängt unverändert an
-- `vehicle_members` (PROJ-6).
--
-- Deshalb braucht die Angabe keine Prüfung: Wer sie wahrheitswidrig setzt,
-- gewinnt nichts. Wer sie in einer Zugriffsregel verwendet, macht daraus
-- einen Schlüssel zu fremden Fahrzeughistorien.

-- ---- 1. Selbstauskunft am Konto -----------------------------------------

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS is_workshop BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN subscriptions.is_workshop IS
  'Selbstauskunft "Ich bin eine Werkstatt" (PROJ-39). Schaltet nur die '
  'Ansicht frei, niemals Zugriff auf fremde Fahrzeuge.';

-- ---- 2. Kundenangaben zu eigenen Fahrzeugen -----------------------------
--
-- ## Warum eine eigene Tabelle und keine Spalten an `vehicles`
--
-- Alles, was an `vehicles` steht, können auch die Mitglieder des Fahrzeugs
-- lesen: Betrachter, eingeladene Werkstätten und nach einer Übergabe der
-- neue Besitzer. Der Name des Kunden darf das nicht — die Spezifikation
-- sagt zu, dass ihn ausschließlich die Werkstatt sieht.
--
-- Eine getrennte Tabelle mit der Regel "nur der Besitzer" ist die einzige
-- Bauweise, die diese Zusage einhält. Als Nebenwirkung lässt sich der
-- Eintrag bei der Übergabe in einer Zeile entfernen (PROJ-40).

CREATE TABLE IF NOT EXISTS vehicle_customers (
  vehicle_id UUID PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_name TEXT CHECK (customer_name IS NULL OR length(customer_name) <= 120),
  customer_phone TEXT CHECK (customer_phone IS NULL OR length(customer_phone) <= 40),
  customer_email TEXT CHECK (customer_email IS NULL OR length(customer_email) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vehicle_customers IS
  'Kundenangabe zu einem selbst angelegten Fahrzeug (PROJ-39). Sichtbar '
  'ausschliesslich fuer den Besitzer des Fahrzeugs, nicht fuer dessen '
  'Mitglieder. Wird bei der Uebergabe geloescht (PROJ-40).';

ALTER TABLE vehicle_customers ENABLE ROW LEVEL SECURITY;

-- Alle vier Regeln prüfen dasselbe: Gehört das Fahrzeug dem Anfragenden?
-- Bewusst nicht über `get_user_vehicle_role`, denn diese Funktion kennt
-- auch Mitglieder — und genau die sollen hier nichts sehen.

DROP POLICY IF EXISTS "Owner can view vehicle customer" ON vehicle_customers;
CREATE POLICY "Owner can view vehicle customer"
  ON vehicle_customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = vehicle_customers.vehicle_id
        AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner can insert vehicle customer" ON vehicle_customers;
CREATE POLICY "Owner can insert vehicle customer"
  ON vehicle_customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = vehicle_customers.vehicle_id
        AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner can update vehicle customer" ON vehicle_customers;
CREATE POLICY "Owner can update vehicle customer"
  ON vehicle_customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = vehicle_customers.vehicle_id
        AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = vehicle_customers.vehicle_id
        AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owner can delete vehicle customer" ON vehicle_customers;
CREATE POLICY "Owner can delete vehicle customer"
  ON vehicle_customers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = vehicle_customers.vehicle_id
        AND v.user_id = auth.uid()
    )
  );

-- Die Liste im Werkstattbereich holt die Angaben zu bis zu 200 Fahrzeugen
-- auf einmal. Der Primaerschluessel deckt das ab; ein zusaetzlicher Index
-- auf vehicle_id waere eine Verdopplung.

-- `updated_at` mitfuehren, damit spaeter nachvollziehbar bleibt, wann eine
-- Kundenangabe zuletzt angefasst wurde.
CREATE OR REPLACE FUNCTION public.touch_vehicle_customers()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vehicle_customers_touch ON vehicle_customers;
CREATE TRIGGER trg_vehicle_customers_touch
  BEFORE UPDATE ON vehicle_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_vehicle_customers();
