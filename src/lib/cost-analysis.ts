import {
  RECURRING_COST_TYPES,
  COST_CLASSIFICATION,
  type RecurringCost,
  type RecurringCostType,
} from "@/lib/validations/recurring-cost";
import {
  ONE_OFF_COST_TYPES,
  ONE_OFF_COST_CLASSIFICATION,
  type OneOffCost,
  type OneOffCostType,
} from "@/lib/validations/one-off-cost";
import { type ServiceEntryType } from "@/lib/validations/service-entry";
import { type FuelEntry } from "@/lib/validations/fuel-entry";
import { prorate, findOverlapping } from "@/lib/recurring-costs";
import { countsTowardTotal } from "@/lib/one-off-costs";

/**
 * Auswertungslogik der Kostenanalyse (PROJ-27).
 *
 * Dieses Modul rechnet ausschließlich — es lädt nichts und stellt nichts dar.
 * Die schwierigen Regeln stammen unverändert aus den Erfassungs-Features:
 * die Umlage der Fixkosten aus PROJ-25 (`prorate`) und der
 * Doppelzählungsschutz aus PROJ-26 (`countsTowardTotal`). Sie werden hier
 * bewusst **nicht** nachgebaut — eine zweite Fassung derselben Regel würde
 * früher oder später von der ersten abweichen.
 */

// ============================================================
// KOSTENARTEN-VERZEICHNIS
// ============================================================

export type Classification = "standing" | "driving" | null;

/** Woher eine Kostenart gespeist wird — bestimmt den Verweis zur Quelle */
export type CostSource = "tankbuch" | "scheckheft" | "laufende" | "einzelkosten";

export const SOURCE_META: Record<
  CostSource,
  { label: string; path: string }
> = {
  tankbuch: { label: "Tankbuch", path: "/tankbuch" },
  scheckheft: { label: "Scheckheft", path: "/scheckheft" },
  laufende: { label: "Laufende Kosten", path: "/kosten" },
  einzelkosten: { label: "Einzelkosten", path: "/kosten/einzelkosten" },
};

export interface CostCategory {
  key: string;
  label: string;
  classification: Classification;
  sources: CostSource[];
}

/**
 * Scheckheft-Eintragstypen auf Kostenarten abbilden.
 *
 * Bewusst vollständig ausgeschrieben statt mit Rückfallwert: Kommt in PROJ-3
 * ein neuer Eintragstyp hinzu, meldet TypeScript hier einen Fehler, statt ihn
 * stillschweigend unter „Sonstiges" verschwinden zu lassen.
 */
const SERVICE_TO_CATEGORY: Record<ServiceEntryType, string> = {
  inspection: "maintenance",
  oil_change: "maintenance",
  tuv_hu: "maintenance",
  repair: "repair",
  restoration: "repair",
  other: "misc",
};

/** Einzelkosten-Arten, die in eine bestehende Kostenart einfließen statt eine eigene zu bilden */
const ONE_OFF_TO_CATEGORY: Partial<Record<OneOffCostType, string>> = {
  other: "misc",
};

/** Reihenfolge in Diagramm und Tabelle; unbekannte Arten werden hinten angehängt */
const CATEGORY_ORDER = [
  "fuel",
  "maintenance",
  "repair",
  "parts",
  "insurance",
  "tax",
  "storage",
  "club",
  "appraisal",
  "misc",
];

/**
 * Baut das Verzeichnis aller Kostenarten auf.
 *
 * Die Arten aus PROJ-25 und PROJ-26 werden aus deren eigenen Listen abgeleitet,
 * nicht hier wiederholt. Eine dort ergänzte Kostenart erscheint dadurch
 * automatisch in der Auswertung — genau das verlangt Tech Design C3.
 */
export function buildCategories(): CostCategory[] {
  const byKey = new Map<string, CostCategory>();

  const add = (
    key: string,
    label: string,
    classification: Classification,
    source: CostSource
  ) => {
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      return;
    }
    byKey.set(key, { key, label, classification, sources: [source] });
  };

  add("fuel", "Benzin", "driving", "tankbuch");
  add("maintenance", "Wartung", "driving", "scheckheft");
  add("repair", "Reparatur", "driving", "scheckheft");
  // „Sonstiges" wird von zwei Quellen gespeist und bleibt ohne Einordnung
  add("misc", "Sonstiges", null, "scheckheft");

  for (const type of RECURRING_COST_TYPES) {
    add(type.value, type.label, COST_CLASSIFICATION[type.value], "laufende");
  }

  for (const type of ONE_OFF_COST_TYPES) {
    const key = ONE_OFF_TO_CATEGORY[type.value] ?? type.value;
    const label = key === type.value ? type.label : "Sonstiges";
    add(key, label, ONE_OFF_COST_CLASSIFICATION[type.value], "einzelkosten");
  }

  const list = [...byKey.values()];
  list.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.key);
    const bi = CATEGORY_ORDER.indexOf(b.key);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });
  return list;
}

export function categoryForServiceEntry(type: ServiceEntryType): string {
  return SERVICE_TO_CATEGORY[type] ?? "misc";
}

export function categoryForOneOffCost(type: OneOffCostType): string {
  return ONE_OFF_TO_CATEGORY[type] ?? type;
}

// ============================================================
// EINGABEDATEN
// ============================================================

export interface ServiceEntryForAnalysis {
  id: string;
  service_date: string;
  entry_type: ServiceEntryType;
  cost_cents: number | null;
  mileage_km: number;
  is_odometer_correction: boolean;
}

export interface AnalysisInput {
  fuelEntries: FuelEntry[];
  serviceEntries: ServiceEntryForAnalysis[];
  recurringCosts: RecurringCost[];
  oneOffCosts: OneOffCost[];
}

export interface Period {
  /** Erster Monat, Format YYYY-MM */
  fromMonth: string;
  /** Letzter Monat, Format YYYY-MM */
  toMonth: string;
  label: string;
}

// ============================================================
// ERGEBNIS
// ============================================================

export interface CategoryResult extends CostCategory {
  totalCents: number;
  entryCount: number;
  /**
   * Ob für diese Kostenart überhaupt jemals etwas erfasst wurde.
   *
   * Bewusst über **alle** Daten bestimmt, nicht nur über den gewählten
   * Zeitraum: Wer Tankbelege hat, aber keinen im gewählten Jahr, hat die Art
   * sehr wohl erfasst — sie ist in diesem Zeitraum nur bei 0 €. Das ist etwas
   * anderes als „nie erfasst" und darf nicht gleich dargestellt werden.
   */
  tracked: boolean;
}

export interface MonthlyPoint {
  /** YYYY-MM */
  month: string;
  label: string;
  totalCents: number;
  hasData: boolean;
  byCategory: Record<string, number>;
}

export interface MileageResult {
  /** Gefahrene Kilometer im Zeitraum, oder null wenn nicht ermittelbar */
  km: number | null;
  readings: number;
  /** Abschnitte, die wegen Tacho-Korrektur oder sinkendem Stand übersprungen wurden */
  skippedSegments: number;
}

export interface DataQuality {
  untracked: string[];
  excludedCount: number;
  excludedCents: number;
  serviceEntriesWithoutCost: number;
  overlappingRecurring: number;
}

export interface CostAnalysis {
  period: Period;
  categories: CategoryResult[];
  months: MonthlyPoint[];
  totalCents: number;
  standingCents: number;
  drivingCents: number;
  unclassifiedCents: number;
  /** Durchschnittliche Standkosten je Monat des Zeitraums */
  standingPerMonthCents: number | null;
  /** Auf zwölf Monate hochgerechnet */
  standingPerYearCents: number | null;
  mileage: MileageResult;
  centsPerKm: number | null;
  quality: DataQuality;
  hasAnyData: boolean;
}

// ============================================================
// MONATSHILFEN
// ============================================================

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function monthNumber(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return year * 12 + (m - 1);
}

function monthFromNumber(n: number): string {
  const year = Math.floor(n / 12);
  const m = (n % 12) + 1;
  return `${year}-${String(m).padStart(2, "0")}`;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

export function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  return `${MONTH_LABELS[Number(m) - 1]} ${year.slice(2)}`;
}

export function enumerateMonths(fromMonth: string, toMonth: string): string[] {
  const start = monthNumber(fromMonth);
  const end = monthNumber(toMonth);
  if (end < start) return [];
  const months: string[] = [];
  for (let n = start; n <= end; n++) months.push(monthFromNumber(n));
  return months;
}

/** Liegt der Monat im Zeitraum? */
function inPeriod(month: string, period: Period): boolean {
  return month >= period.fromMonth && month <= period.toMonth;
}

// ============================================================
// ZEITRÄUME
// ============================================================

/** Frühester Monat, für den überhaupt Daten vorliegen */
export function earliestMonth(input: AnalysisInput): string | null {
  const candidates: string[] = [
    ...input.fuelEntries.map((e) => monthOf(e.fueled_at)),
    ...input.serviceEntries.map((e) => monthOf(e.service_date)),
    ...input.oneOffCosts.map((e) => monthOf(e.purchased_at)),
    ...input.recurringCosts.map((e) => monthOf(e.valid_from)),
  ];
  if (candidates.length === 0) return null;
  return candidates.reduce((min, m) => (m < min ? m : min));
}

/**
 * Die wählbaren Zeiträume.
 *
 * Der Endmonat ist nie in der Zukunft: Ein Fixkostenvertrag darf bis 2030
 * laufen, angefallen sind seine Kosten trotzdem nur bis heute.
 */
export function buildPeriods(input: AnalysisInput, today: Date): Period[] {
  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
  const year = today.getFullYear();
  const earliest = earliestMonth(input);

  const periods: Period[] = [
    {
      fromMonth: `${year}-01`,
      toMonth: currentMonth,
      label: `${year}`,
    },
    {
      fromMonth: `${year - 1}-01`,
      toMonth: `${year - 1}-12`,
      label: `${year - 1}`,
    },
  ];

  periods.push({
    fromMonth: earliest && earliest < periods[1].fromMonth ? earliest : periods[1].fromMonth,
    toMonth: currentMonth,
    label: "Gesamter Zeitraum",
  });

  return periods;
}

// ============================================================
// FAHRLEISTUNG
// ============================================================

interface Reading {
  date: string;
  km: number;
  isCorrection: boolean;
}

/**
 * Fahrleistung aus Tankbuch- und Scheckheft-Ständen.
 *
 * Beide Quellen führen denselben Tacho, also werden sie zusammengeführt und
 * chronologisch gelesen. Aufsummiert werden nur die Zuwächse zwischen
 * aufeinanderfolgenden Ablesungen.
 *
 * Übersprungen wird ein Abschnitt, wenn er auf einer Tacho-Korrektur endet
 * oder der Stand nicht steigt — dieselbe Vorsicht, die im Tankbuch bereits die
 * Verbrauchsberechnung schützt. Ohne sie würde ein ausgetauschter Tacho eine
 * Fahrleistung erfinden oder vernichten.
 */
export function calculateMileage(
  input: AnalysisInput,
  period: Period
): MileageResult {
  const readings: Reading[] = [
    ...input.fuelEntries.map((e) => ({
      date: e.fueled_at,
      km: e.mileage_km,
      isCorrection: e.is_odometer_correction,
    })),
    ...input.serviceEntries.map((e) => ({
      date: e.service_date,
      km: e.mileage_km,
      isCorrection: e.is_odometer_correction,
    })),
  ]
    .filter((r) => inPeriod(monthOf(r.date), period))
    .sort((a, b) => (a.date === b.date ? a.km - b.km : a.date < b.date ? -1 : 1));

  if (readings.length < 2) {
    return { km: null, readings: readings.length, skippedSegments: 0 };
  }

  let km = 0;
  let skipped = 0;
  for (let i = 1; i < readings.length; i++) {
    const previous = readings[i - 1];
    const current = readings[i];
    if (current.isCorrection || current.km <= previous.km) {
      skipped++;
      continue;
    }
    km += current.km - previous.km;
  }

  return {
    km: km > 0 ? km : null,
    readings: readings.length,
    skippedSegments: skipped,
  };
}

// ============================================================
// HAUPTAUSWERTUNG
// ============================================================

function emptyBuckets(categories: CostCategory[]): Record<string, number> {
  const buckets: Record<string, number> = {};
  for (const category of categories) buckets[category.key] = 0;
  return buckets;
}

/**
 * Führt alle Kostenquellen zu einer Auswertung zusammen.
 *
 * `today` wird übergeben statt intern ermittelt, damit die Rechnung testbar
 * bleibt und nicht vom Tag des Testlaufs abhängt.
 */
export function analyzeCosts(
  input: AnalysisInput,
  period: Period,
  today: Date
): CostAnalysis {
  const categories = buildCategories();
  const months = enumerateMonths(period.fromMonth, period.toMonth);
  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const totals = emptyBuckets(categories);
  const counts = emptyBuckets(categories);
  const perMonth = new Map<string, Record<string, number>>();
  for (const month of months) perMonth.set(month, emptyBuckets(categories));

  const addAmount = (categoryKey: string, month: string, cents: number) => {
    if (!(categoryKey in totals)) return;
    totals[categoryKey] += cents;
    counts[categoryKey] += 1;
    const bucket = perMonth.get(month);
    if (bucket) bucket[categoryKey] += cents;
  };

  // --- Tankbuch ---------------------------------------------------------
  for (const entry of input.fuelEntries) {
    const month = monthOf(entry.fueled_at);
    if (!inPeriod(month, period)) continue;
    addAmount("fuel", month, entry.cost_cents);
  }

  // --- Scheckheft -------------------------------------------------------
  let serviceEntriesWithoutCost = 0;
  for (const entry of input.serviceEntries) {
    const month = monthOf(entry.service_date);
    if (!inPeriod(month, period)) continue;
    if (entry.cost_cents === null) {
      serviceEntriesWithoutCost++;
      continue;
    }
    addAmount(categoryForServiceEntry(entry.entry_type), month, entry.cost_cents);
  }

  // --- Einzelkosten -----------------------------------------------------
  let excludedCount = 0;
  let excludedCents = 0;
  for (const cost of input.oneOffCosts) {
    const month = monthOf(cost.purchased_at);
    if (!inPeriod(month, period)) continue;
    // Regel aus PROJ-26: ausgeschlossen nur bei Kennzeichen UND bestehender
    // Verknüpfung. Fällt der Scheckheft-Eintrag weg, zählt der Betrag wieder.
    if (!countsTowardTotal(cost)) {
      excludedCount++;
      excludedCents += cost.amount_cents;
      continue;
    }
    addAmount(categoryForOneOffCost(cost.cost_type), month, cost.amount_cents);
  }

  // --- Laufende Kosten --------------------------------------------------
  // Monatlich umgelegt statt als Spitze im Zahlungsmonat (Tech Design C5).
  // Der laufende Monat zählt mit: Er hat begonnen, die Kosten fallen an.
  // Ausgeschlossen sind nur Monate, die noch gar nicht angebrochen sind.
  const overlapping = findOverlapping(input.recurringCosts);
  for (const cost of input.recurringCosts) {
    const { monthlyCents } = prorate(cost);
    if (monthlyCents === 0) continue;
    const from = monthOf(cost.valid_from);
    const to = monthOf(cost.valid_to);
    for (const month of enumerateMonths(from, to)) {
      if (!inPeriod(month, period)) continue;
      if (month > currentMonth) continue;
      addAmount(cost.cost_type, month, monthlyCents);
    }
  }

  // --- Wurde die Kostenart überhaupt jemals erfasst? --------------------
  const trackedKeys = new Set<string>();
  if (input.fuelEntries.length > 0) trackedKeys.add("fuel");
  for (const entry of input.serviceEntries) {
    trackedKeys.add(categoryForServiceEntry(entry.entry_type));
  }
  for (const cost of input.oneOffCosts) {
    trackedKeys.add(categoryForOneOffCost(cost.cost_type));
  }
  for (const cost of input.recurringCosts) trackedKeys.add(cost.cost_type);

  const results: CategoryResult[] = categories.map((category) => ({
    ...category,
    totalCents: Math.round(totals[category.key]),
    entryCount: counts[category.key],
    tracked: trackedKeys.has(category.key),
  }));

  const totalCents = results.reduce((sum, c) => sum + c.totalCents, 0);
  const sumWhere = (test: (c: CategoryResult) => boolean) =>
    results.filter(test).reduce((sum, c) => sum + c.totalCents, 0);

  const standingCents = sumWhere((c) => c.classification === "standing");
  const drivingCents = sumWhere((c) => c.classification === "driving");
  const unclassifiedCents = sumWhere((c) => c.classification === null);

  const monthPoints: MonthlyPoint[] = months.map((month) => {
    const bucket = perMonth.get(month) ?? {};
    const rounded: Record<string, number> = {};
    let monthTotal = 0;
    for (const [key, value] of Object.entries(bucket)) {
      const cents = Math.round(value);
      rounded[key] = cents;
      monthTotal += cents;
    }
    return {
      month,
      label: monthLabel(month),
      byCategory: rounded,
      totalCents: monthTotal,
      hasData: monthTotal !== 0,
    };
  });

  const mileage = calculateMileage(input, period);
  const monthCount = months.length;

  const hasAnyData =
    input.fuelEntries.length > 0 ||
    input.serviceEntries.length > 0 ||
    input.recurringCosts.length > 0 ||
    input.oneOffCosts.length > 0;

  return {
    period,
    categories: results,
    months: monthPoints,
    totalCents,
    standingCents,
    drivingCents,
    unclassifiedCents,
    standingPerMonthCents:
      monthCount > 0 ? Math.round(standingCents / monthCount) : null,
    standingPerYearCents:
      monthCount > 0 ? Math.round((standingCents / monthCount) * 12) : null,
    mileage,
    // Nur berechnen, wenn eine Fahrleistung ermittelbar war — sonst entstünde
    // je nach Datenlage eine Division durch null oder ein Unendlich-Wert.
    centsPerKm:
      mileage.km && mileage.km > 0 ? totalCents / mileage.km : null,
    quality: {
      untracked: results.filter((c) => !c.tracked).map((c) => c.label),
      excludedCount,
      excludedCents,
      serviceEntriesWithoutCost,
      overlappingRecurring: overlapping.size,
    },
    hasAnyData,
  };
}
