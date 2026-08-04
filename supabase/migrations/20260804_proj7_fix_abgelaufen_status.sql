-- Vorbestehender Fehler aus PROJ-7, aufgedeckt beim Bau von PROJ-32.
--
-- accept_vehicle_transfer setzt bei abgelaufener Frist status='abgelaufen',
-- die CHECK-Bedingung erlaubte diesen Wert aber nicht. Der Aufruf endete
-- deshalb mit einer Ausnahme statt mit der vorgesehenen Meldung „Transfer ist
-- abgelaufen" — der Nutzer sah einen Serverfehler.
--
-- Aufgefallen ist es erst jetzt, weil dieser Pfad seit PROJ-32 mitentscheidet,
-- ob Kostendaten entfernt werden. Die Daten waren nie in Gefahr: Die Ausnahme
-- bricht die Transaktion ab, es wird nichts gelöscht. Aber Sicherheit aus
-- Versehen ist keine — der Pfad muss aus eigenem Recht funktionieren.
--
-- Die App kannte den Zustand ebenfalls nicht; TRANSFER_STATUSES und
-- TRANSFER_STATUS_LABELS sind mit dieser Änderung ergänzt worden.

ALTER TABLE vehicle_transfers
  DROP CONSTRAINT vehicle_transfers_status_check;

ALTER TABLE vehicle_transfers
  ADD CONSTRAINT vehicle_transfers_status_check
  CHECK (status = ANY (ARRAY['offen'::text, 'angenommen'::text, 'abgelehnt'::text, 'abgebrochen'::text, 'abgelaufen'::text]));
