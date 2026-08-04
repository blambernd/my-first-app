-- PROJ-33: Anonyme Verkaufspreise aus Fahrzeug-Übergaben.
--
-- Die Tabelle trägt **bewusst keinen Verweis** auf Nutzer, Fahrzeug, Transfer
-- oder Vorbesitzer — weder als Fremdschlüssel noch als versteckte Kennung.
--
-- Und sie hat **kein Anlagedatum**. Ein tagesgenauer Zeitstempel neben einem
-- tagesgenauen Transfer wäre eine Zuordnung, auch ohne gemeinsame Kennung.
-- Gespeichert wird nur der Verkaufsmonat. Das ist der Unterschied zwischen
-- anonym und pseudonym.

CREATE TABLE IF NOT EXISTS vehicle_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,

  -- Jahresgenau: bei Oldtimern das wichtigste Vergleichsmerkmal. Zwischen
  -- einem 1967er und einem 1972er Modell liegen oft Welten.
  build_year INT NOT NULL CHECK (build_year BETWEEN 1880 AND 2100),

  -- Untergrenze der 25.000er-Klasse, nie der Einzelwert — der wäre ein
  -- Wiedererkennungsmerkmal.
  mileage_bucket INT NOT NULL CHECK (mileage_bucket >= 0 AND mileage_bucket % 25000 = 0),

  condition_grade INT NOT NULL CHECK (condition_grade BETWEEN 1 AND 5),

  -- 500 € bis 2 Mio. €: weit genug für Scheunenfund wie Sammlerwagen, eng
  -- genug, um Vertipper um Zehnerpotenzen zu fangen.
  price_cents BIGINT NOT NULL CHECK (price_cents BETWEEN 50000 AND 200000000),

  sold_month TEXT NOT NULL CHECK (sold_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

CREATE INDEX IF NOT EXISTS idx_vehicle_sales_lookup
  ON vehicle_sales (lower(make), lower(model), build_year);

-- Keine Policy heißt für normale Nutzer: kein Lesen, kein Schreiben, kein
-- Ändern, kein Löschen — auch nicht für den, der den Eintrag ausgelöst hat.
-- Geschrieben wird nur durch accept_vehicle_transfer (SECURITY DEFINER).
ALTER TABLE vehicle_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_sales FORCE ROW LEVEL SECURITY;
REVOKE ALL ON vehicle_sales FROM anon, authenticated;
