-- PROJ-39: Die Werkstatt-Angabe schon bei der Registrierung
--
-- Bisher ließ sich „Ich bin eine Werkstatt" erst nach der Anmeldung in den
-- Einstellungen setzen. Eine Werkstatt, die sich anmeldet, will das aber im
-- selben Zug erledigen — und landet sonst in einem Dashboard für private
-- Sammler, ohne zu wissen, dass es den Werkstattbereich gibt.
--
-- ## Der Weg: über die Anmeldeangaben
--
-- `supabase.auth.signUp({ options: { data: { … } } })` legt die Angaben in
-- `raw_user_meta_data` ab. Genau so wird seit PROJ-18 der Empfehlungscode
-- übergeben. Dieser Auslöser liest die Angabe beim Anlegen der Abo-Zeile.
--
-- ## Warum genau diese eine Angabe und keine andere
--
-- `raw_user_meta_data` wird vom **Browser** gefüllt. Wer sich registriert,
-- bestimmt den Inhalt vollständig — er kann dort hineinschreiben, was er
-- will. Aus diesem Feld darf deshalb **nichts** gelesen werden, das einen
-- Vorteil verschafft.
--
-- `is_workshop` ist die eine Angabe, bei der das unschädlich ist: Sie ist
-- ohnehin eine ungeprüfte Selbstauskunft, die jeder Nutzer jederzeit in den
-- Einstellungen umlegen kann, und sie verschafft keinen Zugriff auf fremde
-- Fahrzeuge (siehe PROJ-39). Wer sie wahrheitswidrig setzt, gewinnt nichts.
--
-- **Wer diesen Auslöser erweitert, prüfe zuerst:** Könnte sich jemand die
-- gelesene Angabe selbst geben und damit etwas gewinnen? Bei `plan` wäre die
-- Antwort ja — dort läge ein kostenloses Premium-Abo für jeden, der die
-- Anfrage manipuliert.
--
-- ## Vorsicht an dieser Stelle
--
-- Dieser Auslöser hat die Registrierung schon einmal lahmgelegt: Ohne
-- festen `search_path` schrieb GoTrue als `supabase_auth_admin` mit
-- `search_path=auth` und fand `subscriptions` nicht. Sechs Wochen lang
-- konnte sich niemand registrieren, ohne dass es auffiel (behoben am
-- 2026-09-19). Der `search_path` bleibt deshalb gesetzt.

CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status, trial_end, is_workshop)
  VALUES (
    NEW.id,
    'free',
    'active',
    NULL,
    -- Nur ein echtes true zählt; alles andere wird false.
    --
    -- Bewusst ein Textvergleich und **kein** `::boolean`: Ein Wert wie
    -- `"vielleicht"` ließe eine Umwandlung scheitern, und weil dieser
    -- Auslöser Teil der Registrierung ist, würde damit die gesamte
    -- Anmeldung abbrechen. `COALESCE` fängt nur NULL, keinen
    -- Umwandlungsfehler. Ein Vergleich kann nicht scheitern.
    --
    -- Die Registrierung darf an einer Nebenangabe nicht zerbrechen — schon
    -- gar nicht an einer, die der Browser frei befüllt.
    CASE
      WHEN lower(NEW.raw_user_meta_data ->> 'is_workshop') = 'true' THEN true
      ELSE false
    END
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_default_subscription() IS
  'Legt die Abo-Zeile beim Registrieren an (PROJ-8) und uebernimmt dabei die '
  'Selbstauskunft is_workshop aus den Anmeldeangaben (PROJ-39). Aus '
  'raw_user_meta_data darf nur gelesen werden, was der Nutzer sich ohnehin '
  'selbst geben koennte - das Feld ist browserseitig frei befuellbar.';
