import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkshopVehicleCount } from "@/lib/workshop-access";
import { isDealer } from "@/lib/dealer-access";

export interface NavigationFlags {
  /** Punkt „Werkstatt" (PROJ-37) */
  hasWorkshopAccess: boolean;
  /** Punkt „Bestand" (PROJ-38) */
  isDealer: boolean;
}

/**
 * Welche zusätzlichen Navigationspunkte dieser Nutzer sieht.
 *
 * Zusammengefasst, weil beide Bereiche dieselbe Frage an dieselben vier
 * Seiten stellen. Ohne diese Klammer stünden dort zwei Abfragen
 * nebeneinander — und bei jedem weiteren Bereich käme eine dritte dazu.
 *
 * Beide laufen nebenläufig; sie hängen nicht voneinander ab. Schlägt eine
 * fehl, fällt sie auf „kein Zugang" zurück: Der Navigationspunkt
 * verschwindet, statt die Seite scheitern zu lassen.
 */
export async function getNavigationFlags(
  supabase: SupabaseClient,
  userId: string
): Promise<NavigationFlags> {
  const [workshopCount, dealer] = await Promise.all([
    getWorkshopVehicleCount(supabase, userId),
    isDealer(supabase, userId),
  ]);

  return {
    hasWorkshopAccess: workshopCount > 0,
    isDealer: dealer,
  };
}
