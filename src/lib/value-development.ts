import {
  totalAcquisitionCents,
  type PurchaseExtraCost,
  type VehiclePurchase,
} from "@/lib/validations/vehicle-purchase";

/**
 * Bilanz aus Anschaffung, Unterhalt und Marktwert (PROJ-28).
 *
 * Reine Rechnung — lädt nichts und stellt nichts dar. Der Kaufpreis wird hier
 * **neben** die Unterhaltskosten gestellt, nie hineingerechnet: Er ist Kapital,
 * kein laufender Aufwand. Flösse er in die Zeitreihe von PROJ-27 ein, wäre
 * jede monatliche Kostenkurve unbrauchbar.
 */

/** Rohzeile aus `market_analyses`, soweit hier gebraucht */
export interface MarketAnalysisRow {
  status: string;
  /** NUMERIC in Euro — kommt je nach Treiber als String zurück */
  median_price: number | string | null;
  average_price: number | string | null;
  created_at: string;
}

/** Selbst eingetragener Marktwert aus `vehicle_market_values` */
export interface ManualMarketValueRow {
  value_cents: number | string;
  valued_on: string;
  note: string | null;
}

export interface MarketValue {
  cents: number;
  /**
   * Woraus der Wert stammt — für die Beschriftung.
   * "manuell" ist eine Selbsteinschätzung des Besitzers und muss als solche
   * gekennzeichnet werden; sie darf nicht wie ein erhobener Marktwert wirken.
   */
  basis: "median" | "average" | "manuell";
  analysedOn: string;
  /** Tage seit der Analyse; ab einer gewissen Zahl weist die Oberfläche darauf hin */
  ageInDays: number;
  /** Nur bei manueller Eingabe: Vermerk des Besitzers */
  note?: string | null;
}

/**
 * Kategorien, die als **Investition in das Fahrzeug** gelten.
 *
 * Die Trennung beantwortet eine andere Frage als die Kostenanalyse: Dort geht
 * es darum, ob Kosten beim Fahren oder beim Stehen anfallen. Hier geht es
 * darum, ob Geld **im Fahrzeug steckt** oder für dessen Nutzung verbraucht
 * wurde. Benzin ist weg, ein eingebauter Vergaser nicht.
 *
 * Einordnung nach Festlegung vom 2026-08-03:
 * - **Investition:** Ersatzteile, Reparatur, Restaurierung
 * - **laufend:** Kraftstoff, Wartung (Inspektion, Ölwechsel, TÜV/HU),
 *   Versicherung, Kfz-Steuer, Garage, Clubbeitrag, Wertgutachten
 *
 * `misc` („Sonstiges") zählt zu den laufenden Kosten. Die Kategorie wird von
 * zwei Quellen gespeist — Einzelkosten und Scheckheft — und lässt sich hier
 * nicht auseinanderhalten. Sie den Investitionen zuzuschlagen hieße, nicht
 * eingeordneten Werkstattaufwand als Wertzuwachs auszuweisen.
 */
const INVESTITIONS_KATEGORIEN = new Set(["repair", "parts"]);

export function istInvestition(categoryKey: string): boolean {
  return INVESTITIONS_KATEGORIEN.has(categoryKey);
}

/**
 * Teilt die Kostenkategorien in Investition und laufenden Aufwand.
 *
 * Erwartet die Kategorieergebnisse aus `analyzeCosts`; die Summe beider Teile
 * ergibt wieder den Gesamtaufwand.
 */
export function splitUpkeep(
  categories: Array<{ key: string; totalCents: number }>
): { investmentCents: number; runningCents: number } {
  let investmentCents = 0;
  let runningCents = 0;
  for (const c of categories) {
    if (istInvestition(c.key)) investmentCents += c.totalCents;
    else runningCents += c.totalCents;
  }
  return { investmentCents, runningCents };
}

export interface ValueDevelopment {
  /** Kaufpreis ohne Nebenkosten */
  purchaseCents: number;
  /** Summe der Kauf-Nebenkosten */
  extraCents: number;
  /** Kaufpreis plus Nebenkosten */
  acquisitionCents: number;
  /** Aufgelaufene Unterhaltskosten aus PROJ-27 — Investition plus laufend */
  upkeepCents: number;
  /** Was ins Fahrzeug geflossen ist: Ersatzteile, Reparatur, Restaurierung */
  investmentCents: number;
  /** Was die Nutzung gekostet hat: Kraftstoff, Wartung, Versicherung, … */
  runningCents: number;
  /** Alles, was das Fahrzeug bisher gekostet hat */
  totalSpentCents: number;
  /** Geschätzter Marktwert, oder null wenn keine brauchbare Analyse vorliegt */
  market: MarketValue | null;
  /** Marktwert minus Kaufpreis; null ohne Marktwert */
  valueChangeCents: number | null;
  /** Marktwert minus alles Ausgegebene; null ohne Marktwert */
  balanceCents: number | null;
}

/** Ab hier gilt eine Marktpreis-Analyse als merklich alt */
export const STALE_ANALYSIS_DAYS = 90;

function toCents(value: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return null;
  // Die Preise stehen in Euro, gerechnet wird durchgängig in Cent
  return Math.round(asNumber * 100);
}

function daysBetween(from: string, to: Date): number {
  const start = new Date(from).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((to.getTime() - start) / 86_400_000));
}

/**
 * Ermittelt den Marktwert aus der jüngsten brauchbaren Analyse.
 *
 * Der **Median** wird dem Durchschnitt vorgezogen: Bei kleinen Stichproben —
 * und Oldtimer-Inserate sind immer eine kleine Stichprobe — verschiebt ein
 * einzelnes überteuertes Angebot den Durchschnitt spürbar, den Median kaum.
 * Fehlt der Median, dient der Durchschnitt als Rückfall; welcher Wert
 * verwendet wurde, wird mitgeführt und angezeigt.
 */
/**
 * Nimmt den zuletzt vom Besitzer eingetragenen Marktwert.
 *
 * Er hat Vorrang vor jeder automatischen Analyse: Wer den Wert selbst
 * einträgt, kennt Zustand, Ausstattung und Historie seines Fahrzeugs — die
 * Suche kennt davon nichts.
 */
export function pickManualMarketValue(
  values: ManualMarketValueRow[],
  today: Date
): MarketValue | null {
  const sorted = [...values].sort((a, b) =>
    a.valued_on < b.valued_on ? 1 : a.valued_on > b.valued_on ? -1 : 0
  );

  for (const entry of sorted) {
    const cents = Number(entry.value_cents);
    if (!Number.isFinite(cents) || cents <= 0) continue;
    return {
      cents: Math.round(cents),
      basis: "manuell",
      analysedOn: entry.valued_on,
      ageInDays: daysBetween(entry.valued_on, today),
      note: entry.note,
    };
  }
  return null;
}

export function pickMarketValue(
  analyses: MarketAnalysisRow[],
  today: Date
): MarketValue | null {
  const usable = analyses
    .filter((a) => a.status === "completed")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  for (const analysis of usable) {
    const median = toCents(analysis.median_price);
    if (median !== null) {
      return {
        cents: median,
        basis: "median",
        analysedOn: analysis.created_at,
        ageInDays: daysBetween(analysis.created_at, today),
      };
    }
    const average = toCents(analysis.average_price);
    if (average !== null) {
      return {
        cents: average,
        basis: "average",
        analysedOn: analysis.created_at,
        ageInDays: daysBetween(analysis.created_at, today),
      };
    }
  }
  return null;
}

/**
 * Stellt Anschaffung, Unterhalt und Marktwert gegenüber.
 *
 * Ohne Marktwert bleiben `valueChangeCents` und `balanceCents` bewusst `null`
 * statt 0 — die Kostenseite ist trotzdem aussagekräftig und wird angezeigt.
 * Eine Bilanz mit angenommenem Marktwert 0 wäre grob irreführend.
 */
export function calculateValueDevelopment(
  purchase: VehiclePurchase,
  extraCosts: PurchaseExtraCost[],
  upkeep: { investmentCents: number; runningCents: number },
  market: MarketValue | null
): ValueDevelopment {
  const acquisitionCents = totalAcquisitionCents(purchase, extraCosts);
  const extraCents = acquisitionCents - purchase.price_cents;
  const upkeepCents = upkeep.investmentCents + upkeep.runningCents;
  const totalSpentCents = acquisitionCents + upkeepCents;

  return {
    purchaseCents: purchase.price_cents,
    extraCents,
    acquisitionCents,
    upkeepCents,
    investmentCents: upkeep.investmentCents,
    runningCents: upkeep.runningCents,
    totalSpentCents,
    market,
    // Laut Acceptance Criteria ausdrücklich gegen den **Kaufpreis**, nicht
    // gegen die gesamte Anschaffung: Die Frage lautet, wie sich das Fahrzeug
    // selbst entwickelt hat.
    valueChangeCents: market ? market.cents - purchase.price_cents : null,
    balanceCents: market ? market.cents - totalSpentCents : null,
  };
}

/**
 * Kosten, die vor dem Kaufdatum liegen.
 *
 * Deutet auf einen Tippfehler hin oder auf Aufwand aus der Zeit vor dem Kauf.
 * Gemeldet wird beides, damit der Nutzer entscheidet — stillschweigend
 * mitzurechnen wäre die schlechtere Antwort.
 */
export function costsBeforePurchase(
  earliestCostMonth: string | null,
  purchasedOn: string
): { affected: boolean; earliestMonth: string | null } {
  if (!earliestCostMonth) return { affected: false, earliestMonth: null };
  const purchaseMonth = purchasedOn.slice(0, 7);
  return {
    affected: earliestCostMonth < purchaseMonth,
    earliestMonth: earliestCostMonth,
  };
}
