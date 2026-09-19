import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Gewerblicher Bestandsbereich: Zugang (PROJ-38).
 *
 * Der Schalter liegt als einzelne Angabe an den vorhandenen Abo-Daten und
 * nicht in einer eigenen Tabelle — es ist eine Ja/Nein-Auskunft am Konto.
 *
 * ## Solange die Spalte fehlt
 *
 * Bis der Backend-Schritt `subscriptions.is_dealer` anlegt, schlägt die
 * Abfrage fehl. Das wird als „nicht gewerblich" behandelt: Der Bereich
 * bleibt unsichtbar, der Rest der Anwendung läuft unverändert weiter. Ein
 * Fehler an dieser Stelle darf keine Seite zerlegen, denn er beantwortet
 * nur, ob ein zusätzlicher Navigationspunkt erscheint.
 */
export async function isDealer(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("is_dealer")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Dealer mode check failed:", error.message);
    return false;
  }

  return Boolean(data?.is_dealer);
}
