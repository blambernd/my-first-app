-- PROJ-26 BUG-1: Verknüpfung darf nur auf einen Scheckheft-Eintrag
-- DESSELBEN Fahrzeugs zeigen
--
-- Befund aus dem QA-Sicherheitsaudit: Der bisherige Fremdschlüssel prüfte nur,
-- ob die Ziel-ID in `service_entries` existiert — nicht, ob der Eintrag zum
-- selben Fahrzeug gehört. Ein Besitzer konnte per direktem API-Aufruf
-- `service_entry_id` auf einen Eintrag eines fremden Fahrzeugs setzen.
--
-- Keine Sicherheitslücke (es wurden keine fremden Daten gelesen oder verändert,
-- und über die Oberfläche war es nicht erreichbar), aber PROJ-27 rechnet auf der
-- Annahme, dass eine Verknüpfung innerhalb eines Fahrzeugs bleibt. Diese
-- Annahme wird hier von der Datenbank garantiert statt nur vorausgesetzt.

-- ============================================================
-- 1) ZIEL FÜR DEN ZUSAMMENGESETZTEN FREMDSCHLÜSSEL
-- ============================================================
-- (id, vehicle_id) ist durch den Primärschlüssel ohnehin eindeutig; der
-- Fremdschlüssel braucht aber eine passende Eindeutigkeits-Zusicherung.
ALTER TABLE service_entries
  ADD CONSTRAINT service_entries_id_vehicle_key UNIQUE (id, vehicle_id);

-- ============================================================
-- 2) ALTEN FREMDSCHLÜSSEL ERSETZEN
-- ============================================================
ALTER TABLE one_off_costs
  DROP CONSTRAINT one_off_costs_service_entry_id_fkey;

-- ON DELETE SET NULL (service_entry_id) — die Spaltenliste ist hier
-- entscheidend (PostgreSQL 15+). Ohne sie würde beim Löschen eines
-- Scheckheft-Eintrags auch `vehicle_id` auf NULL gesetzt, was an der
-- NOT-NULL-Regel scheitert und das Löschen erneut unmöglich machen würde —
-- genau der Fehler, der bei diesem Feature schon einmal auftrat.
ALTER TABLE one_off_costs
  ADD CONSTRAINT one_off_costs_service_entry_fkey
  FOREIGN KEY (service_entry_id, vehicle_id)
  REFERENCES service_entries (id, vehicle_id)
  ON DELETE SET NULL (service_entry_id);

-- MATCH SIMPLE (Voreinstellung) ist hier gewollt: Ist `service_entry_id` NULL,
-- greift der Fremdschlüssel gar nicht. Ausgaben ohne Zuordnung — der Normalfall
-- beim Selbstschrauben — bleiben also uneingeschränkt möglich.

-- ============================================================
-- 3) INDEX AN DIE NEUEN SPALTEN ANPASSEN
-- ============================================================
DROP INDEX IF EXISTS idx_one_off_costs_service_entry;

CREATE INDEX idx_one_off_costs_service_entry
  ON one_off_costs (service_entry_id, vehicle_id)
  WHERE service_entry_id IS NOT NULL;

-- ============================================================
-- KONTROLLE
-- ============================================================
--   Fremde Verknüpfung  -> 23503 foreign_key_violation
--   Eigene Verknüpfung  -> erlaubt
--   Scheckheft-Eintrag löschen -> service_entry_id wird NULL, Zeile bleibt
