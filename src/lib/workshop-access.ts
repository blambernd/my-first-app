import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Werkstattzugang für die Navigation (PROJ-37).
 *
 * ## Warum serverseitig und nicht als Hook
 *
 * Bis zur Behebung von QA BUG-7 fragte ein Client-Hook das bei **jedem**
 * Seitenaufruf mit Kopfzeile über eine eigene Schnittstelle ab — für die
 * weitaus meisten Konten ein dauerhafter zusätzlicher Roundtrip mit dem
 * Ergebnis „nein", dazu ein kurz aufblitzender Navigationspunkt.
 *
 * Alle vier Seiten mit Kopfzeile rendern ohnehin auf dem Server und haben
 * dort bereits eine Datenbankverbindung und die Sitzung. Die Zählung kostet
 * dort keinen zusätzlichen Netzweg.
 */
export async function getWorkshopVehicleCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("vehicle_members")
    .select("vehicle_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "werkstatt");

  if (error) {
    // Ein Fehler blendet den Navigationspunkt aus, statt die Seite scheitern
    // zu lassen: Die Zählung ist Beiwerk der Navigation, nicht ihr Inhalt.
    console.error("Workshop access check failed:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Selbstauskunft „Ich bin eine Werkstatt" (PROJ-39).
 *
 * ## Was diese Angabe NICHT ist
 *
 * Sie ist **keine Berechtigung**. Sie entscheidet allein darüber, ob jemand
 * den Werkstattbereich sieht und dort eigene Kundenfahrzeuge anlegen kann —
 * Fahrzeuge, bei denen er ohnehin Besitzer ist. Der Zugriff auf **fremde**
 * Fahrzeuge bleibt ausschließlich an die Einladung des Besitzers gebunden
 * (PROJ-6).
 *
 * Genau deshalb darf die Angabe ungeprüft bleiben: Wer sie wahrheitswidrig
 * setzt, gewinnt nichts. Wer sie an anderer Stelle als Zugriffsprüfung
 * verwendet, macht aus einer Selbstauskunft einen Schlüssel zu fremden
 * Fahrzeughistorien — das wäre ein Sicherheitsfehler, kein Feature.
 *
 * ## Solange die Spalte fehlt
 *
 * Bis der Backend-Schritt `subscriptions.is_workshop` anlegt, schlägt die
 * Abfrage fehl. Das wird als „keine Werkstatt" behandelt: Der Bereich bleibt
 * unsichtbar, alles andere läuft unverändert weiter. Dasselbe Vorgehen wie
 * bei `isDealer` (PROJ-38).
 */
export async function isWorkshop(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("is_workshop")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Workshop mode check failed:", error.message);
    return false;
  }

  return Boolean(data?.is_workshop);
}
