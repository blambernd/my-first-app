-- BUG-1 / BUG-2 / BUG-3: Die Selbstauskünfte ließen sich nicht speichern
--
-- ## Der Fehler
--
-- Beide Schalter — „Ich bin eine Werkstatt" (PROJ-39) und „Ich verkaufe
-- Fahrzeuge gewerblich" (PROJ-38) — schrieben direkt aus dem Browser:
--
--     supabase.from("subscriptions").update({ is_dealer: next })
--
-- Auf `subscriptions` gibt es aber nur eine Leseregel. Das ist Absicht und
-- steht so in der Migration von PROJ-8:
--
--     -- Only server (service role) can insert/update/delete subscriptions
--     -- No INSERT/UPDATE/DELETE policies for anon role
--
-- Der Schreibversuch traf deshalb **keine Zeile**. PostgREST antwortet
-- darauf mit HTTP 200 und leerem Ergebnis — kein Fehler. Beide Komponenten
-- prüften nur auf `error`, meldeten Erfolg und luden die Seite neu, wonach
-- der Schalter wieder aus war.
--
-- **Folge:** Der Händlerschalter aus PROJ-38 funktionierte seit seiner
-- Auslieferung nicht. Bei dessen Abnahme fiel es nicht auf, weil das
-- Merkmal per SQL gesetzt wurde statt über die Oberfläche.
--
-- ## Warum keine UPDATE-Regel
--
-- Eine Zeilenregel gilt für die **ganze Zeile**; einzelne Spalten lassen
-- sich damit nicht ausnehmen. In derselben Zeile steht `plan`. Jeder Nutzer
-- könnte sich dann selbst `premium` eintragen — der Schutz aus PROJ-8 wäre
-- aufgehoben, um zwei Ja/Nein-Angaben zu speichern.
--
-- ## Die Lösung
--
-- Eine Funktion mit erhöhten Rechten, die **ausschließlich** diese beiden
-- Spalten der **eigenen** Zeile setzt. Die Tabelle bleibt für den Browser
-- schreibgeschützt; `plan` bleibt unerreichbar.

CREATE OR REPLACE FUNCTION public.set_business_flags(
  -- NULL heißt „nicht anfassen". Damit setzt jeder Schalter nur sich selbst
  -- und kann den anderen nicht versehentlich zurücksetzen.
  p_is_workshop BOOLEAN DEFAULT NULL,
  p_is_dealer BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id UUID;
  v_zeile subscriptions%ROWTYPE;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Nicht angemeldet');
  END IF;

  IF p_is_workshop IS NULL AND p_is_dealer IS NULL THEN
    RETURN json_build_object('error', 'Keine Angabe übergeben');
  END IF;

  UPDATE subscriptions
  SET is_workshop = COALESCE(p_is_workshop, is_workshop),
      is_dealer   = COALESCE(p_is_dealer, is_dealer),
      updated_at  = NOW()
  WHERE user_id = v_user_id
  RETURNING * INTO v_zeile;

  -- Ohne Abo-Zeile gibt es nichts zu setzen. Sie entsteht bei der
  -- Registrierung; fehlt sie, ist das ein Datenfehler und keine Kleinigkeit,
  -- die stillschweigend übergangen werden darf.
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Kein Konto gefunden');
  END IF;

  -- Die gespeicherten Werte kommen zurück, damit der Aufrufer **prüfen**
  -- kann, statt zu glauben. Genau diese Prüfung fehlte und hielt den Fehler
  -- monatelang verborgen.
  RETURN json_build_object(
    'success', true,
    'isWorkshop', v_zeile.is_workshop,
    'isDealer', v_zeile.is_dealer
  );
END;
$function$;

COMMENT ON FUNCTION public.set_business_flags(BOOLEAN, BOOLEAN) IS
  'Setzt die Selbstauskuenfte is_workshop und is_dealer der eigenen '
  'Abo-Zeile (BUG-1). Einziger Schreibweg fuer den Browser — subscriptions '
  'bleibt sonst schreibgeschuetzt, damit plan unerreichbar bleibt.';
