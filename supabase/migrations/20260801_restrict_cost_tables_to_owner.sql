-- PROJ-27: Kostendaten sind ausschließlich für den Besitzer sichtbar
--
-- Entscheidung des Nutzers vom 2026-08-01 (Tech Design C10).
--
-- Anlass: Die Kostenanalyse zeigt nichts, was nicht schon in den Listen von
-- PROJ-25 und PROJ-26 stünde. Nur die Auswertung zu sperren wäre Fassade —
-- die Beträge stünden für Mitglieder eine Klickebene tiefer weiterhin offen.
-- Die Beschränkung muss deshalb an der Datenbank ansetzen, nicht nur an der
-- Seite.
--
-- Begründung der Abgrenzung: Kosten sind sensibler als die Wartungshistorie.
-- Eine eingeladene Werkstatt soll nicht sehen, was der Besitzer anderswo
-- bezahlt hat — Versicherungsbeiträge, Steuer, Teilepreise und Gutachten.
--
-- Das **Tankbuch bleibt bewusst unberührt**: Verbrauch ist Fahrzeugtechnik und
-- gehört zu den Daten, die eine Werkstatt sinnvollerweise sieht. Ebenso das
-- Scheckheft, das der eigentliche Zweck der Werkstatt-Rolle ist.
--
-- Zeitpunkt: Zum Zeitpunkt der Anwendung gibt es in der Produktion **keine
-- einzige Mitgliedschaft** (`vehicle_members` ist leer). Kein bestehender
-- Nutzer verliert also einen Zugriff, den er heute hat. Später wäre dieselbe
-- Änderung eine spürbare Einschränkung für laufende Freigaben.

-- ============================================================
-- LAUFENDE KOSTEN (PROJ-25)
-- ============================================================
DROP POLICY "Owner or member can view recurring costs"   ON recurring_costs;
DROP POLICY "Owner or werkstatt can create recurring costs" ON recurring_costs;
DROP POLICY "Owner or werkstatt can update recurring costs" ON recurring_costs;
-- Die Löschregel war bereits auf den Besitzer beschränkt und bleibt bestehen.

CREATE POLICY "Only owner can view recurring costs"
  ON recurring_costs FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can create recurring costs"
  ON recurring_costs FOR INSERT
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can update recurring costs"
  ON recurring_costs FOR UPDATE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer')
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

-- ============================================================
-- EINZELKOSTEN (PROJ-26)
-- ============================================================
DROP POLICY "Owner or member can view one-off costs"   ON one_off_costs;
DROP POLICY "Owner or werkstatt can create one-off costs" ON one_off_costs;
DROP POLICY "Owner or werkstatt can update one-off costs" ON one_off_costs;

CREATE POLICY "Only owner can view one-off costs"
  ON one_off_costs FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can create one-off costs"
  ON one_off_costs FOR INSERT
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Only owner can update one-off costs"
  ON one_off_costs FOR UPDATE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer')
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

-- ============================================================
-- KONTROLLE (erwartet: je Tabelle 4 Regeln, alle auf 'besitzer')
-- ============================================================
--   SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE tablename IN ('recurring_costs','one_off_costs');
--
-- Gegenprobe nicht vergessen: Ein Betrachter darf 0 Zeilen sehen, der
-- Besitzer muss im selben Lauf seine Zeile sehen. Ohne Gegenprobe ist
-- "0 Zeilen" auch bei einer leeren Tabelle erfüllt.
