-- PROJ-29: Belastbarer Marktüberblick
--
-- Ergänzt die Analysetabelle um die Angaben, die eine Aussage nachvollziehbar
-- machen: worauf sie sich stützt, wie belastbar sie ist und was aussortiert
-- wurde. Bestandsdaten bleiben gültig — alle Spalten sind nullable bzw. haben
-- einen Default.

ALTER TABLE market_analyses
  -- Zustandsnote des eigenen Fahrzeugs zum Zeitpunkt der Analyse. Wird
  -- mitgeschrieben, weil eine später geänderte Note die Aussage sonst
  -- rückwirkend verfälscht.
  ADD COLUMN condition_grade SMALLINT
    CHECK (condition_grade IS NULL OR condition_grade BETWEEN 1 AND 5),

  -- 'belastbar' ab 8 Vergleichsfahrzeugen, 'orientierend' bei 4-7.
  -- Ohne Wert (NULL) sind es die Altbestände vor PROJ-29.
  ADD COLUMN confidence TEXT
    CHECK (confidence IS NULL OR confidence IN ('belastbar', 'orientierend')),

  -- Verworfene Treffer mit Begründung, gedeckelt auf 50 Einträge.
  ADD COLUMN rejected_listings JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Vollständige Zählung je Ablehnungsgrund, auch über den Deckel hinaus.
  ADD COLUMN rejected_counts JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Version der Filterkette. Analysen aus verschiedenen Versionen sind nicht
  -- vergleichbar; ohne diese Spalte lässt sich das später nicht mehr trennen.
  ADD COLUMN pipeline_version SMALLINT NOT NULL DEFAULT 1;

COMMENT ON COLUMN market_analyses.pipeline_version IS
  '1 = vor PROJ-29 (enthält Übersichtsseiten als Vergleichsfahrzeuge), 2 = ab PROJ-29';

-- Bestandsdaten ausdrücklich als Version 1 kennzeichnen. Der Default gilt nur
-- für neue Zeilen; die vorhandenen sollen nicht fälschlich als geprüft gelten.
UPDATE market_analyses SET pipeline_version = 1 WHERE pipeline_version IS NULL;

-- Für die 24-Stunden-Wiederverwendung: Suche nach der jüngsten Analyse eines
-- Fahrzeugs. Deckt zugleich die bestehende Verlaufsabfrage ab.
CREATE INDEX IF NOT EXISTS idx_market_analyses_vehicle_created
  ON market_analyses (vehicle_id, created_at DESC);
