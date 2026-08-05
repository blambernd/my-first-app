-- PROJ-33 / QA BUG-1: Fluten der Preisdaten erschweren.
--
-- Der Angriff: zwei eigene Konten, beliebig viele Fahrzeuge, hin- und
-- herübertragen, bei jeder Annahme ein frei gewählter Preis.
--
-- Eine Grenze je Konto und Tag wäre das falsche Merkmal — sie träfe Händler,
-- die täglich mehrere Fahrzeuge übertragen. Stattdessen zwei Regeln:
--
--   1. `vehicles.sale_reported` — ein Fahrzeug trägt höchstens EINMAL bei.
--      Damit ist der Rundlauf wertlos. Händler sind unberührt: Jedes Fahrzeug
--      wird einmal verkauft.
--
--   2. Höchstens DREI Datenpunkte je Kontopaar, **ungerichtet** gezählt.
--      Ein Ring aus zwei Konten stößt sofort an die Grenze; wer weiter fluten
--      will, braucht für jeden Datenpunkt ein neues Konto mit bestätigter
--      E-Mail.
--
--      Händler-zu-Händler-Verkäufe fallen ab dem vierten heraus. Das ist
--      **erwünscht**: Einkaufspreise liegen systematisch unter dem, was ein
--      privater Käufer zahlt, und würden die Übersicht nach unten ziehen.
--
-- Beide Regeln wirken WEICH — sie lassen den Datenpunkt entfallen, nie die
-- Übergabe. Ein Fehlalarm kostet einen Datenpunkt, kein blockiertes Fahrzeug.
-- Nachgewiesen: Bei vier Verkäufen desselben Paares liefen alle vier
-- Übergaben durch, es entstanden drei Datenpunkte.
--
-- Keine Strukturregel ist dicht. Die eigentliche Absicherung ist eine robuste
-- Statistik in PROJ-34 (Median, gestutzte Spannen).
--
-- `sale_reported` ist bewusst ein Wahrheitswert ohne Zeitangabe: Ein genauer
-- Zeitpunkt am Fahrzeug ließe sich mit dem Verkaufsmonat der anonymen Zeile
-- abgleichen und wäre eine neue Spur genau der Art, die dieses Feature
-- vermeidet.
--
-- Nebenbei behoben: Die alte `accept_vehicle_transfer(uuid)` existierte noch
-- NEBEN der neuen fünfargumentigen — `CREATE OR REPLACE` ersetzt nur bei
-- gleicher Signatur, sonst entsteht eine Überladung. Ein Aufruf mit nur
-- `p_token` hätte die alte Fassung getroffen und die Angaben des Käufers still
-- verworfen. Sie ist entfernt; die neue deckt den Aufruf über Vorgabewerte ab.
--
-- Angewandt am 2026-08-04 über apply_migration mit der vollständigen
-- Funktionsdefinition.

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS sale_reported BOOLEAN NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.accept_vehicle_transfer(uuid);
