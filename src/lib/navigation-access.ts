import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkshopVehicleCount, isWorkshop } from "@/lib/workshop-access";
import { isDealer } from "@/lib/dealer-access";

export interface NavigationFlags {
  /** Punkt „Werkstatt" (PROJ-37) — per Einladung oder Selbstauskunft */
  hasWorkshopAccess: boolean;
  /** Selbstauskunft „Ich bin eine Werkstatt" (PROJ-39) */
  isWorkshop: boolean;
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
  const [workshopCount, workshopMode, dealer] = await Promise.all([
    getWorkshopVehicleCount(supabase, userId),
    isWorkshop(supabase, userId),
    isDealer(supabase, userId),
  ]);

  // Zwei Wege führen in den Werkstattbereich, und sie sind unabhängig
  // voneinander (PROJ-39): die Einladung eines Besitzers — der Weg aus
  // PROJ-37 — oder die eigene Selbstauskunft. Eine Werkstatt, die ihre
  // ersten Kundenfahrzeuge selbst anlegt, hat noch keine einzige Einladung;
  // ohne den zweiten Weg käme sie nie an die Seite, auf der sie sie anlegen
  // könnte.
  return {
    hasWorkshopAccess: workshopCount > 0 || workshopMode,
    isWorkshop: workshopMode,
    isDealer: dealer,
  };
}
