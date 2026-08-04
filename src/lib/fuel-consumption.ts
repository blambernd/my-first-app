import {
  CHART_GAP_DAYS,
  IMPLAUSIBLE_CONSUMPTION_MAX,
  IMPLAUSIBLE_CONSUMPTION_MIN,
  pricePerLiterCents,
  type FuelEntry,
} from "@/lib/validations/fuel-entry";

export interface FuelEntryWithConsumption {
  entry: FuelEntry;
  /** L/100km für den Abschnitt, der mit diesem Eintrag endet — null, wenn nicht berechenbar */
  consumption: number | null;
  /** Gefahrene Strecke des Abschnitts in km */
  distanceKm: number | null;
  /** km-Stand des Abschnittsbeginns (die vorherige Volltankung) */
  fromMileageKm: number | null;
  /** Verbrauch liegt außerhalb der Plausibilitätsgrenzen */
  isImplausible: boolean;
  pricePerLiterCents: number | null;
}

export interface FuelStats {
  /** Streckengewichteter Durchschnitt über alle plausiblen Abschnitte */
  averageConsumption: number | null;
  totalCostCents: number;
  totalLiters: number;
  averagePricePerLiterCents: number | null;
  entryCount: number;
  implausibleCount: number;
  /** Anzahl auswertbarer Abschnitte — steuert den Hinweistext in der Oberfläche */
  segmentCount: number;
}

/**
 * Sortiert Tankvorgänge chronologisch aufsteigend.
 * Zweitkriterium ist der Erfassungszeitpunkt, damit zwei Tankstopps am selben Tag
 * in der Reihenfolge bleiben, in der sie eingetragen wurden (PROJ-24 Edge Case).
 */
export function sortChronologically(entries: FuelEntry[]): FuelEntry[] {
  return [...entries].sort((a, b) => {
    if (a.fueled_at !== b.fueled_at) {
      return a.fueled_at < b.fueled_at ? -1 : 1;
    }
    return a.created_at < b.created_at ? -1 : 1;
  });
}

/**
 * Berechnet den Verbrauch nach der Voll-zu-Voll-Methode.
 *
 * Ein Verbrauchswert entsteht nur zwischen zwei Volltankungen: Die zwischenzeitlich
 * getankten Liter sind genau die Menge, die auf der Strecke seit der letzten
 * Volltankung verbraucht wurde. Teilbetankungen liefern deshalb keinen eigenen Wert,
 * ihre Liter fließen in den nächsten vollständigen Abschnitt ein.
 *
 * Die Kette bricht an drei Stellen ab: beim ersten Eintrag, bei einer Tacho-Korrektur
 * und wenn der Kilometerstand nicht gestiegen ist. In allen drei Fällen wird bewusst
 * kein Wert ausgewiesen, statt einen unsinnigen zu berechnen.
 *
 * Erwartet chronologisch aufsteigend sortierte Einträge.
 */
export function calculateConsumption(
  sortedEntries: FuelEntry[]
): FuelEntryWithConsumption[] {
  const results: FuelEntryWithConsumption[] = [];

  // Letzte Volltankung, die als Abschnittsbeginn dient
  let reference: FuelEntry | null = null;
  let litersSinceReference = 0;

  for (const entry of sortedEntries) {
    const base = {
      entry,
      consumption: null as number | null,
      distanceKm: null as number | null,
      fromMileageKm: null as number | null,
      isImplausible: false,
      pricePerLiterCents: pricePerLiterCents(entry.cost_cents, entry.liters),
    };

    if (entry.is_odometer_correction) {
      // Über einen Tachowechsel hinweg ist keine Strecke ableitbar — Kette neu beginnen
      reference = entry.is_full_tank ? entry : null;
      litersSinceReference = 0;
      results.push(base);
      continue;
    }

    if (reference === null) {
      // Noch kein Abschnittsbeginn vorhanden
      if (entry.is_full_tank) {
        reference = entry;
        litersSinceReference = 0;
      }
      results.push(base);
      continue;
    }

    litersSinceReference += entry.liters;

    if (!entry.is_full_tank) {
      // Teilbetankung schließt keinen Abschnitt ab
      results.push(base);
      continue;
    }

    const distanceKm = entry.mileage_km - reference.mileage_km;

    if (distanceKm <= 0) {
      // Kilometerstand nicht gestiegen — Abschnitt verwerfen und neu aufsetzen
      reference = entry;
      litersSinceReference = 0;
      results.push(base);
      continue;
    }

    const consumption = (litersSinceReference / distanceKm) * 100;

    results.push({
      ...base,
      consumption,
      distanceKm,
      fromMileageKm: reference.mileage_km,
      isImplausible:
        consumption < IMPLAUSIBLE_CONSUMPTION_MIN ||
        consumption > IMPLAUSIBLE_CONSUMPTION_MAX,
    });

    reference = entry;
    litersSinceReference = 0;
  }

  return results;
}

/**
 * Kennzahlen über alle Einträge.
 *
 * Der Durchschnittsverbrauch wird streckengewichtet gebildet (Summe der Liter geteilt
 * durch Summe der Strecke), nicht als Mittel der Einzelwerte — sonst zählt ein kurzer
 * Stadtabschnitt genauso stark wie eine lange Überlandfahrt. Unplausible Abschnitte
 * bleiben außen vor, damit ein Tippfehler den Durchschnitt nicht dauerhaft verzerrt.
 */
export function calculateStats(rows: FuelEntryWithConsumption[]): FuelStats {
  let totalCostCents = 0;
  let totalLiters = 0;
  let weightedLiters = 0;
  let weightedDistanceKm = 0;
  let implausibleCount = 0;
  let segmentCount = 0;

  for (const row of rows) {
    // Geleerte Beträge (Besitzerwechsel, PROJ-32) zählen nicht mit. Sie als 0
    // zu addieren wäre stillschweigend die Behauptung, das Tanken habe nichts
    // gekostet — die Summe wäre dann zu niedrig, ohne dass es auffiele.
    totalCostCents += row.entry.cost_cents ?? 0;
    totalLiters += row.entry.liters;

    if (row.consumption === null || row.distanceKm === null) continue;

    segmentCount += 1;

    if (row.isImplausible) {
      implausibleCount += 1;
      continue;
    }

    weightedDistanceKm += row.distanceKm;
    weightedLiters += (row.consumption * row.distanceKm) / 100;
  }

  return {
    averageConsumption:
      weightedDistanceKm > 0
        ? (weightedLiters / weightedDistanceKm) * 100
        : null,
    totalCostCents,
    totalLiters,
    averagePricePerLiterCents:
      totalLiters > 0 ? totalCostCents / totalLiters : null,
    entryCount: rows.length,
    implausibleCount,
    segmentCount,
  };
}

export interface ConsumptionPoint {
  /** ISO-Datum, dient zugleich als Schlüssel im Diagramm */
  date: string;
  /** null erzeugt eine Lücke im Verlauf statt einer durchgezogenen Linie */
  consumption: number | null;
}

/** Mittleres Datum zwischen zwei Zeitpunkten, als ISO-Datum ohne Uhrzeit */
function midpointDate(a: Date, b: Date): string {
  return new Date((a.getTime() + b.getTime()) / 2)
    .toISOString()
    .split("T")[0];
}

/**
 * Datenreihe für den Verlauf.
 *
 * Liegen zwischen zwei Messpunkten mehr als CHART_GAP_DAYS (Winterpause), wird ein
 * leerer Punkt eingeschoben. Sonst zöge das Diagramm eine Linie über einen Zeitraum,
 * für den es keine Messwerte gibt, und suggerierte eine Entwicklung, die niemand
 * beobachtet hat.
 *
 * Der Lückenpunkt trägt bewusst ein **echtes** Datum (die Mitte der Lücke) und keinen
 * synthetischen Schlüssel: Achsen- und Tooltip-Formatierung im Diagramm bekommen so
 * nie einen Wert, den sie nicht als Datum lesen können. Weil die Lücke definitionsgemäß
 * größer als CHART_GAP_DAYS ist, liegt die Mitte immer echt zwischen beiden Messpunkten
 * und kollidiert mit keinem von ihnen.
 */
export function buildConsumptionSeries(
  rows: FuelEntryWithConsumption[]
): ConsumptionPoint[] {
  const points: ConsumptionPoint[] = [];
  let previousDate: Date | null = null;

  for (const row of rows) {
    if (row.consumption === null || row.isImplausible) continue;

    const currentDate = new Date(row.entry.fueled_at);

    if (previousDate) {
      const gapDays =
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
      if (gapDays > CHART_GAP_DAYS) {
        points.push({
          date: midpointDate(previousDate, currentDate),
          consumption: null,
        });
      }
    }

    points.push({
      date: row.entry.fueled_at,
      consumption: Math.round(row.consumption * 10) / 10,
    });
    previousDate = currentDate;
  }

  return points;
}
