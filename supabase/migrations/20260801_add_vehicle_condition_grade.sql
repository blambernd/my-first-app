-- PROJ-29: Zustandsnote am Fahrzeug
--
-- Die Notenskala 1–5 ist im Oldtimer-Markt der übliche Bezugsrahmen. Ohne sie
-- vergleicht der Marktüberblick gepflegte Fahrzeuge mit Scheunenfunden — die
-- Ursache dafür, dass derselbe Wagen am selben Tag mit 700 € und mit 128.716 €
-- bewertet wurde.
--
-- Bewusst eine Spalte an `vehicles` und keine eigene Tabelle (Tech Design C3):
-- Die Note ist ein Stammdatum wie Laufleistung oder Motor. Anders als der
-- Kaufpreis aus PROJ-28 ist sie nicht schützenswert — sie gehört sogar in ein
-- Verkaufsinserat. Die Überlegung, die dort zu eigenen Tabellen führte, greift
-- hier also nicht.

ALTER TABLE vehicles
  ADD COLUMN condition_grade SMALLINT
    CHECK (condition_grade IS NULL OR condition_grade BETWEEN 1 AND 5);

COMMENT ON COLUMN vehicles.condition_grade IS
  'Zustandsnote 1-5 nach üblicher Oldtimer-Skala; 1 = makellos, 5 = restaurierungsbedürftig. Optional.';

-- Kein Index: Es wird nie nach der Note gefiltert oder sortiert, sie wird
-- ausschließlich zusammen mit dem Fahrzeug gelesen.

-- ============================================================
-- KONTROLLE
-- ============================================================
--   Bestehende Fahrzeuge behalten NULL und bleiben uneingeschränkt nutzbar.
--   Werte außerhalb 1-5 werden abgewiesen (23514).
