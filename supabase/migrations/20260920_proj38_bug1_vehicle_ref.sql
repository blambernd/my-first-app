-- PROJ-38 / QA BUG-1: Verkaufte Fahrzeuge aus dem Bestand filtern
--
-- ## Der Fehler
--
-- Nach „Als verkauft kennzeichnen" stand dasselbe Fahrzeug in beiden Listen:
-- im Bestand und unter „Verkauft". Die Bestandsliste lädt alle Fahrzeuge des
-- Kontos und konnte die verkauften nicht ausschließen.
--
-- ## Warum sie es nicht konnte
--
-- `dealer_sales` trug bewusst **keine** Fahrzeugkennung, damit der Vorgang
-- das Fahrzeug überlebt — nach einer Übergabe liegt es beim Käufer, nach
-- einer Löschung ist es fort. Damit fehlte aber jeder Anhaltspunkt, welches
-- Fahrzeug verkauft wurde. Die beiden Anforderungen „überlebt das Fahrzeug"
-- und „verlässt den Bestand" wurden im Entwurf nicht zusammen gedacht.
--
-- ## Die Auflösung
--
-- Eine **optionale** Kennung mit `ON DELETE SET NULL`. Sie erlaubt den
-- Filter, solange das Fahrzeug existiert, und wird beim Löschen von selbst
-- leer — der Vorgang bleibt vollständig, weil Marke, Modell, Baujahr und
-- alle Beträge als Abschrift daneben stehen. Genau diese Abschrift war der
-- eigentliche Grund für die ursprüngliche Entscheidung; sie bleibt.
--
-- Gesetzt wird die Kennung nur beim Kennzeichnen von Hand. Bei einer
-- Übergabe bleibt sie leer: Dort wechselt der Besitzer, und das Fahrzeug
-- verschwindet ohnehin aus dem Bestand des Verkäufers. Eine Kennung, die auf
-- das Fahrzeug eines anderen zeigt, hätte dort keinen Zweck.

ALTER TABLE dealer_sales
  ADD COLUMN IF NOT EXISTS vehicle_id UUID
  REFERENCES vehicles(id) ON DELETE SET NULL;

COMMENT ON COLUMN dealer_sales.vehicle_id IS
  'PROJ-38: Optionale Kennung des verkauften Fahrzeugs. Nur beim Kennzeichnen von Hand gesetzt, damit die Bestandsliste filtern kann. ON DELETE SET NULL — der Vorgang ueberlebt das Fahrzeug.';

-- Der Zugriffsweg der Bestandsliste: „welche meiner Fahrzeuge sind verkauft?"
CREATE INDEX IF NOT EXISTS idx_dealer_sales_user_vehicle
  ON dealer_sales(user_id, vehicle_id)
  WHERE vehicle_id IS NOT NULL;
