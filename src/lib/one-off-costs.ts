import {
  ONE_OFF_COST_CLASSIFICATION,
  type OneOffCost,
  type OneOffCostType,
} from "@/lib/validations/one-off-cost";

/**
 * Zählt der Betrag in der Kostenauswertung mit?
 *
 * Das ist die zentrale Regel dieses Features (Tech Design C1). Sie ist bewusst
 * so formuliert, dass ein Betrag nur ausgeschlossen wird, wenn **beides**
 * zutrifft: Das Kennzeichen ist gesetzt UND die Verknüpfung zum
 * Scheckheft-Eintrag besteht noch.
 *
 * Damit ist der gefährliche Fall strukturell ausgeschlossen: Wird der
 * verknüpfte Scheckheft-Eintrag gelöscht, fällt die Verknüpfung weg und der
 * Betrag zählt automatisch wieder mit. Es gibt kein Kennzeichen nachzuziehen
 * und nichts, das dabei schiefgehen kann — ein Betrag kann nicht dauerhaft und
 * unbemerkt aus der Auswertung verschwinden.
 */
export function countsTowardTotal(cost: OneOffCost): boolean {
  return !(cost.included_in_service_entry && cost.service_entry_id !== null);
}

export interface OneOffCostSummary {
  /** Summe aller mitzählenden Beträge */
  totalCents: number;
  /** Summe je Kostenart, nur mitzählende Beträge */
  byType: Map<OneOffCostType, number>;
  /** Anzahl Einträge insgesamt */
  entryCount: number;
  /** Summe der ausgeschlossenen Beträge — für die Offenlegung in PROJ-27 */
  excludedCents: number;
  /** Anzahl ausgeschlossener Einträge */
  excludedCount: number;
}

export function summarize(costs: OneOffCost[]): OneOffCostSummary {
  const byType = new Map<OneOffCostType, number>();
  let totalCents = 0;
  let excludedCents = 0;
  let excludedCount = 0;

  for (const cost of costs) {
    if (!countsTowardTotal(cost)) {
      excludedCents += cost.amount_cents;
      excludedCount += 1;
      continue;
    }
    totalCents += cost.amount_cents;
    byType.set(
      cost.cost_type,
      (byType.get(cost.cost_type) ?? 0) + cost.amount_cents
    );
  }

  return {
    totalCents,
    byType,
    entryCount: costs.length,
    excludedCents,
    excludedCount,
  };
}

/** Summe je Stand-/Fahrtkosten. Nicht eingeordnete Arten bleiben außen vor. */
export function classifiedTotals(costs: OneOffCost[]): {
  standingCents: number;
  drivingCents: number;
  unclassifiedCents: number;
} {
  let standingCents = 0;
  let drivingCents = 0;
  let unclassifiedCents = 0;

  for (const cost of costs) {
    if (!countsTowardTotal(cost)) continue;
    const bucket = ONE_OFF_COST_CLASSIFICATION[cost.cost_type];
    if (bucket === "standing") standingCents += cost.amount_cents;
    else if (bucket === "driving") drivingCents += cost.amount_cents;
    else unclassifiedCents += cost.amount_cents;
  }

  return { standingCents, drivingCents, unclassifiedCents };
}

/**
 * Filtert nach Kostenart und Suchbegriff.
 * Gesucht wird in Bezeichnung und Teilenummer, ohne Rücksicht auf Groß-/Kleinschreibung.
 */
export function filterCosts(
  costs: OneOffCost[],
  options: { type?: OneOffCostType | "all"; search?: string }
): OneOffCost[] {
  const term = (options.search ?? "").trim().toLowerCase();
  return costs.filter((cost) => {
    if (options.type && options.type !== "all" && cost.cost_type !== options.type) {
      return false;
    }
    if (!term) return true;
    return (
      cost.description.toLowerCase().includes(term) ||
      (cost.part_number ?? "").toLowerCase().includes(term)
    );
  });
}

/** Chronologisch absteigend, neuester Kauf zuerst */
export function sortNewestFirst(costs: OneOffCost[]): OneOffCost[] {
  return [...costs].sort((a, b) => {
    if (a.purchased_at !== b.purchased_at) {
      return a.purchased_at < b.purchased_at ? 1 : -1;
    }
    return a.created_at < b.created_at ? 1 : -1;
  });
}
