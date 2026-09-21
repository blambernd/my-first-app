-- BUG-6: Keine Fahrzeugübergabe ließ sich mehr anlegen
--
-- ## Der Fehler
--
-- Jeder Lesezugriff auf `vehicle_transfers` scheiterte:
--
--     42501 — permission denied for table users
--
-- Ursache ist eine Leseregel aus PROJ-7, die die Adresse des Empfängers in
-- `auth.users` nachschlägt:
--
--     to_email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())
--
-- Die Rolle `authenticated` hat auf `auth.users` **kein** Leserecht — in
-- Supabase grundsätzlich nicht, nachgewiesen mit `has_table_privilege`. Die
-- Regel konnte damit nie funktionieren.
--
-- ## Warum es trotzdem ein halbes Jahr lief
--
-- Die Anwendung liest Übergaben über `get_vehicle_transfers()`, eine
-- Funktion mit erhöhten Rechten, welche die Regeln umgeht. Der Fehler blieb
-- deshalb unsichtbar.
--
-- Sichtbar wurde er mit PROJ-38 (Commit eaa3683): Dort bekam das
-- Übergabeformular ein `.select("id")`, um den Händler-Erlös zuordnen zu
-- können. Ein `RETURNING` verlangt Leserecht — und damit lief das Anlegen
-- jeder Übergabe in genau diese Regel. **Seit der Auslieferung am
-- 2026-09-21 konnte niemand mehr ein Fahrzeug übertragen.**
--
-- Der Abnahme von PROJ-38 entging das, weil der zugehörige Test eine
-- Übergabe nur anlegt, wenn keine offen ist — und aus früheren Läufen lag
-- immer eine bereit.
--
-- ## Die Behebung
--
-- `auth.email()` liest die Adresse aus dem Sitzungstoken statt aus der
-- Tabelle. Kein Zugriff auf `auth.users`, keine Sonderrechte nötig.
--
-- Verglichen wird in Kleinschreibung: Die Anwendung legt `to_email` klein
-- ab, die Adresse im Token steht so da, wie sie registriert wurde. Ohne
-- diese Angleichung sähe ein Empfänger mit Großbuchstaben in der Adresse
-- seine eigene Übergabe nicht. `accept_vehicle_transfer` vergleicht an
-- derselben Stelle ebenso.

DROP POLICY IF EXISTS "Invited user can view transfer" ON vehicle_transfers;

CREATE POLICY "Invited user can view transfer"
  ON vehicle_transfers FOR SELECT
  USING (lower(to_email) = lower(auth.email()));

COMMENT ON POLICY "Invited user can view transfer" ON vehicle_transfers IS
  'Der eingeladene Empfaenger darf seine Uebergabe sehen (PROJ-7). Adresse '
  'aus dem Sitzungstoken via auth.email(), nicht aus auth.users — darauf '
  'hat authenticated kein Leserecht (BUG-6).';
