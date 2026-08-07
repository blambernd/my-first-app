-- Kein Testzeitraum mehr (Entscheidung des Nutzers, 2026-08-07).
--
-- Bisher legte der Auslöser jeden neuen Nutzer als `plan='trial'` mit
-- `trial_end = NOW() + 14 Tage` an. Neue Nutzer starten jetzt unmittelbar im
-- kostenlosen Tarif.
--
-- **Niemand verliert dadurch etwas.** Vor der Änderung geprüft: Kein einziger
-- der vier vorhandenen Abo-Datensätze stand auf `trial`, keiner hatte eine
-- laufende Testfrist.
--
-- Die Tarifstufe `trial` bleibt im CHECK und in `PLANS` bestehen. Sie wird
-- nicht mehr vergeben, aber `getEffectivePlan` muss weiterhin damit umgehen
-- können, falls je ein alter Datensatz auftaucht. Etwas zu entfernen, das noch
-- gelesen werden könnte, wäre die riskantere Änderung.
--
-- Ebenfalls angepasst: Landing Page und Meta-Description dürfen den
-- Testzeitraum nicht mehr bewerben — er stand dort seit dem 2026-08-05.

CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status, trial_end)
  VALUES (NEW.id, 'free', 'active', NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
