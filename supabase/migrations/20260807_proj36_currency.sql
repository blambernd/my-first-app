-- PROJ-36: Währung pro Fahrzeug
--
-- Zwei Spalten, beide additiv mit Vorgabe 'EUR'. Damit werden alle heute
-- vorhandenen Zeilen automatisch zu Euro-Zeilen — was sie faktisch immer
-- waren. Es wird kein gespeicherter Betrag angefasst: Die Währung ist eine
-- reine Beschriftung, weil an keiner Stelle umgerechnet wird.

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR'
    CHECK (currency IN ('EUR','CHF','GBP','USD','SEK','DKK','NOK','PLN','CZK'));

COMMENT ON COLUMN vehicles.currency IS
  'Währung des Fahrzeugs (PROJ-36). Gilt für alle selbst erfassten Beträge: Kaufpreis, Tankbuch, laufende Kosten, Einzelkosten, Scheckheft-Kosten, Marktwerte. NICHT für Ersatzteil-Angebote und Marktpreis-Analyse — die stammen aus dem deutschen Markt und bleiben Euro.';

-- Die anonyme Verkaufssammlung ist für niemanden lesbar (keine Policy,
-- entzogene Rechte). Ein Fremdwährungs-Verkauf, der ohne Währungsangabe
-- hier landet, ist danach von niemandem mehr auffindbar und von niemandem
-- mehr richtigzustellen — weder vom Nutzer noch vom Betreiber. Deshalb muss
-- diese Spalte existieren, BEVOR das erste Nicht-Euro-Fahrzeug übertragen
-- werden kann.
ALTER TABLE vehicle_sales
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR'
    CHECK (currency IN ('EUR','CHF','GBP','USD','SEK','DKK','NOK','PLN','CZK'));

COMMENT ON COLUMN vehicle_sales.currency IS
  'Währung des Verkaufspreises (PROJ-36). PROJ-34 vergleicht ausschließlich innerhalb derselben Währung, und die Mindestanzahl für die Anonymität gilt je Währung — es wird nie über Währungsgrenzen hinweg gemittelt, auch nicht, um eine Mindestzahl zu erreichen.';

-- Der Suchindex für PROJ-34 bekommt die Währung mit: Ohne sie müsste die
-- Preisübersicht erst alle Währungen laden und danach verwerfen.
DROP INDEX IF EXISTS idx_vehicle_sales_lookup;
CREATE INDEX idx_vehicle_sales_lookup
  ON vehicle_sales (lower(make), lower(model), build_year, currency);
