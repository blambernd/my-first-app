-- PROJ-39 / PROJ-38: Die Kontoart bei der Registrierung
--
-- Die Anmeldung fragt jetzt nach der Kontoart — Privat, Werkstatt oder
-- Händler — statt nur nach einem Haken für Werkstätten. Dieser Auslöser
-- übernimmt beide gewerblichen Angaben.
--
-- ## Warum auch is_dealer aus den Anmeldeangaben gelesen werden darf
--
-- `raw_user_meta_data` füllt der **Browser**. Wer sich registriert,
-- bestimmt den Inhalt vollständig. Aus diesem Feld darf deshalb nur
-- gelesen werden, was sich der Nutzer ohnehin selbst geben könnte.
--
-- Auf `is_dealer` trifft dasselbe zu wie auf `is_workshop`: eine
-- ungeprüfte Selbstauskunft, die jeder in den Einstellungen umlegen kann
-- (PROJ-38). Sie schaltet eine Ansicht frei, verschafft keinen Zugriff auf
-- fremde Daten — und der Bestandsbereich dahinter verlangt ohnehin ein
-- Premium-Abo, das über diesen Weg nicht zu bekommen ist.
--
-- **Wer diesen Auslöser erweitert, prüfe zuerst:** Könnte sich jemand die
-- gelesene Angabe selbst geben und damit etwas gewinnen? Bei `plan` wäre
-- die Antwort ja — dort läge ein kostenloses Premium-Abo für jeden, der
-- die Anfrage manipuliert.
--
-- ## Vorsicht an dieser Stelle
--
-- Dieser Auslöser hat die Registrierung schon einmal sechs Wochen lang
-- lahmgelegt (fehlender `search_path`, behoben am 2026-09-19). Er bleibt
-- gesetzt. Und die Angaben werden per Textvergleich gelesen, nicht per
-- `::boolean`: Ein Wert wie `"vielleicht"` ließe eine Umwandlung
-- scheitern — und damit die gesamte Anmeldung.

CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status, trial_end, is_workshop, is_dealer)
  VALUES (
    NEW.id,
    'free',
    'active',
    NULL,
    CASE
      WHEN lower(NEW.raw_user_meta_data ->> 'is_workshop') = 'true' THEN true
      ELSE false
    END,
    CASE
      WHEN lower(NEW.raw_user_meta_data ->> 'is_dealer') = 'true' THEN true
      ELSE false
    END
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_default_subscription() IS
  'Legt die Abo-Zeile beim Registrieren an (PROJ-8) und uebernimmt dabei '
  'die Kontoart aus den Anmeldeangaben: is_workshop (PROJ-39) und '
  'is_dealer (PROJ-38). Aus raw_user_meta_data darf nur gelesen werden, '
  'was der Nutzer sich ohnehin selbst geben koennte - das Feld ist '
  'browserseitig frei befuellbar.';
