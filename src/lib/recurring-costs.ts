import {
  getIntervalMonths,
  type RecurringCost,
  type RecurringCostType,
} from "@/lib/validations/recurring-cost";

export interface RecurringCostWithProration {
  cost: RecurringCost;
  /** Anzahl Monate im Gültigkeitszeitraum, beide Randmonate eingeschlossen */
  months: number;
  /** Wie oft der Betrag im Zeitraum fällig wird */
  payments: number;
  /** Gesamtbetrag über den Zeitraum in Cent */
  totalCents: number;
  /** Monatliche Belastung in Cent */
  monthlyCents: number;
  /** Überschneidet sich mit einem anderen Eintrag derselben Kostenart */
  hasOverlap: boolean;
}

/** Monat eines ISO-Datums als fortlaufende Zahl, für Vergleiche und Differenzen */
function monthIndex(isoDate: string): number {
  const [year, month] = isoDate.split("-").map(Number);
  return year * 12 + (month - 1);
}

/**
 * Anzahl Monate zwischen zwei Daten, beide Randmonate eingeschlossen.
 * Januar bis Dezember ergibt 12, April bis Oktober ergibt 7.
 */
export function monthsInPeriod(validFrom: string, validTo: string): number {
  const diff = monthIndex(validTo) - monthIndex(validFrom) + 1;
  return diff > 0 ? diff : 0;
}

/**
 * Rechnet einen Eintrag auf seine monatliche Belastung um.
 *
 * Der erfasste Betrag gilt **pro Zahlungsintervall**, nicht für den gesamten
 * Zeitraum. Daraus folgt die Rechnung in zwei Schritten:
 *
 *   1. Wie oft wird der Betrag im Zeitraum fällig?  → aufgerundet, denn ein
 *      angebrochenes Intervall wird trotzdem voll bezahlt
 *   2. Gesamtbetrag durch die Monate des Zeitraums  → monatliche Belastung
 *
 * Das ist die Stelle, an der sich ein Fehler um den Faktor 12 auswirken würde:
 * „600 € jährlich über 12 Monate" und „50 € monatlich über 12 Monate" müssen
 * dieselbe Monatsbelastung ergeben. Gleichzeitig verlangt die Spec, dass ein
 * Betrag über 7 Monate auch auf 7 Monate verteilt wird und nicht auf 12 —
 * beides erfüllt diese Rechnung.
 */
export function prorate(cost: RecurringCost): {
  months: number;
  payments: number;
  totalCents: number;
  monthlyCents: number;
} {
  const months = monthsInPeriod(cost.valid_from, cost.valid_to);
  if (months === 0) {
    return { months: 0, payments: 0, totalCents: 0, monthlyCents: 0 };
  }
  const intervalMonths = getIntervalMonths(cost.payment_interval);
  const payments = Math.ceil(months / intervalMonths);
  const totalCents = cost.amount_cents * payments;
  return {
    months,
    payments,
    totalCents,
    monthlyCents: totalCents / months,
  };
}

/** Zwei Zeiträume überschneiden sich, wenn keiner vollständig vor dem anderen liegt */
export function periodsOverlap(
  a: { valid_from: string; valid_to: string },
  b: { valid_from: string; valid_to: string }
): boolean {
  return a.valid_from <= b.valid_to && b.valid_from <= a.valid_to;
}

/**
 * Findet Einträge, die sich mit einem anderen **derselben Kostenart** überschneiden.
 *
 * Verschiedene Kostenarten dürfen sich frei überlappen — Winterlager und
 * Saisonkennzeichen laufen sogar typischerweise gegenläufig. Nur eine doppelte
 * Versicherung im selben Monat ist verdächtig.
 */
export function findOverlapping(costs: RecurringCost[]): Set<string> {
  const overlapping = new Set<string>();
  for (let i = 0; i < costs.length; i++) {
    for (let j = i + 1; j < costs.length; j++) {
      if (costs[i].cost_type !== costs[j].cost_type) continue;
      if (periodsOverlap(costs[i], costs[j])) {
        overlapping.add(costs[i].id);
        overlapping.add(costs[j].id);
      }
    }
  }
  return overlapping;
}

export function withProration(
  costs: RecurringCost[]
): RecurringCostWithProration[] {
  const overlapping = findOverlapping(costs);
  return costs.map((cost) => ({
    cost,
    ...prorate(cost),
    hasOverlap: overlapping.has(cost.id),
  }));
}

/** Ist der Eintrag zum Stichtag aktiv? */
export function isActiveAt(cost: RecurringCost, reference: string): boolean {
  return cost.valid_from <= reference && reference <= cost.valid_to;
}

/**
 * Aktuelle Monatsbelastung: Summe aller zum Stichtag laufenden Einträge.
 */
export function currentMonthlyCents(
  costs: RecurringCost[],
  reference: string
): number {
  return costs
    .filter((cost) => isActiveAt(cost, reference))
    .reduce((sum, cost) => sum + prorate(cost).monthlyCents, 0);
}

/**
 * Kosten eines Kalenderjahres.
 *
 * Bewusst nicht „Monatsbelastung mal zwölf": Ein Saisonvertrag über sieben
 * Monate hat eine hohe Monatsbelastung, fällt aber nur sieben Monate an.
 * Hochgerechnet ergäbe das einen deutlich zu hohen Jahreswert. Stattdessen wird
 * für jeden Eintrag gezählt, wie viele seiner Monate in das Jahr fallen.
 */
export function yearlyTotalCents(costs: RecurringCost[], year: number): number {
  const yearStart = year * 12;
  const yearEnd = yearStart + 11;

  return costs.reduce((sum, cost) => {
    const from = monthIndex(cost.valid_from);
    const to = monthIndex(cost.valid_to);
    const overlapStart = Math.max(from, yearStart);
    const overlapEnd = Math.min(to, yearEnd);
    if (overlapEnd < overlapStart) return sum;
    const monthsInYear = overlapEnd - overlapStart + 1;
    return sum + prorate(cost).monthlyCents * monthsInYear;
  }, 0);
}

/** Einträge nach Kostenart gruppiert, jede Gruppe chronologisch absteigend */
export function groupByType(
  rows: RecurringCostWithProration[]
): Map<RecurringCostType, RecurringCostWithProration[]> {
  const groups = new Map<RecurringCostType, RecurringCostWithProration[]>();
  for (const row of rows) {
    const list = groups.get(row.cost.cost_type) ?? [];
    list.push(row);
    groups.set(row.cost.cost_type, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => (a.cost.valid_from < b.cost.valid_from ? 1 : -1));
  }
  return groups;
}
