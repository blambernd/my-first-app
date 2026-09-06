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
