import type { MarketListing, PriceStatistics } from "./types";

/**
 * Mindestzahl bepreister Inserate für eine belastbare Aussage.
 *
 * Vorher lag die Grenze bei 2. Ein Quartilsabstand über zwei Datenpunkte ist
 * jedoch bedeutungslos, und die Produktionsdaten zeigten Empfehlungen, die aus
 * genau zwei Treffern entstanden. Acht ist keine statistische Wahrheit, aber
 * die Grenze, unterhalb derer eine einzelne Fehlparsung das Ergebnis kippt.
 */
export const MIN_PRICED_LISTINGS = 8;

/**
 * Untergrenze, unterhalb derer gar keine Preisspanne mehr ausgewiesen wird.
 *
 * Hintergrund (PROJ-29): Nach dem Aussortieren von Übersichtsseiten,
 * Ersatzteilen und merkmalslosen Treffern blieben in den echten
 * Produktionsdaten je Analyse nur 0–7 Vergleichsfahrzeuge übrig — keine
 * einzige der 20 gespeicherten Analysen erreichte 8. Eine harte Grenze bei 8
 * hieße: das Feature liefert nie wieder ein Ergebnis.
 *
 * Deshalb wird gestaffelt statt abgeschnitten. Zwischen 4 und 7 Fahrzeugen
 * gibt es eine Spanne, aber ausdrücklich als Orientierung gekennzeichnet.
 * Unter 4 gibt es keine Zahl — nur die gefundenen Inserate zum Selbstansehen.
 */
export const MIN_ORIENTATION_LISTINGS = 4;

/**
 * Wie belastbar das Ergebnis ist. Das Feature heißt "Belastbarer
 * Marktüberblick" — die Belastbarkeit gehört deshalb ins Ergebnis, nicht in
 * eine Fußnote.
 */
export type Belastbarkeit = "belastbar" | "orientierend";

/**
 * Preise unterhalb dieses Anteils des Medians gelten als Fremdkörper.
 *
 * Eine feste Untergrenze funktioniert nicht: 3.000 € sind bei einem Käfer ein
 * Auto und bei einem 300 SL ein Scheinwerfer. Der Median der Stichprobe liefert
 * den Maßstab, der zum jeweiligen Fahrzeug passt.
 */
const IMPLAUSIBLE_PRICE_RATIO = 0.25;

/**
 * Calculate price statistics and recommendation from a list of market listings.
 * Uses IQR method for outlier detection and median-based recommendation.
 *
 * Returns null if fewer than MIN_PRICED_LISTINGS listings with plausible
 * prices are found.
 */
export function calculatePriceStatistics(
  listings: MarketListing[]
): PriceStatistics | null {
  // Filter to listings with valid prices
  const priced = listings.filter(
    (l): l is MarketListing & { price: number } => l.price !== null
  );

  if (priced.length < MIN_ORIENTATION_LISTINGS) return null;

  // Grobe Vorsortierung gegen Ersatzteile und Fehlparsungen, bevor der Median
  // berechnet wird, der die Empfehlung trägt.
  const preliminaryMedian = calculateMedian(
    priced.map((l) => l.price).sort((a, b) => a - b)
  );
  const priceFloor = preliminaryMedian * IMPLAUSIBLE_PRICE_RATIO;
  const plausible = priced.filter((l) => l.price >= priceFloor);

  if (plausible.length < MIN_ORIENTATION_LISTINGS) return null;

  const confidence: Belastbarkeit =
    plausible.length >= MIN_PRICED_LISTINGS ? "belastbar" : "orientierend";

  // Sort by price
  const sorted = [...plausible].sort((a, b) => a.price - b.price);
  const prices = sorted.map((l) => l.price);

  // Basic statistics
  const sum = prices.reduce((a, b) => a + b, 0);
  const average = Math.round(sum / prices.length);
  const median = calculateMedian(prices);
  const lowest = prices[0];
  const highest = prices[prices.length - 1];

  // IQR for outlier detection
  const q1 = calculatePercentile(prices, 25);
  const q3 = calculatePercentile(prices, 75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  // Mark outliers. Unter die Untergrenze gefallene Treffer werden ebenfalls
  // markiert — sie bleiben sichtbar, damit erkennbar ist, was aussortiert wurde.
  const listingsWithOutliers = listings.map((listing) => ({
    ...listing,
    is_outlier:
      listing.price !== null &&
      (listing.price < priceFloor ||
        listing.price < lowerFence ||
        listing.price > upperFence),
  }));

  // Recommendation: based on non-outlier prices
  const nonOutlierPrices = prices.filter(
    (p) => p >= lowerFence && p <= upperFence
  );

  let recommendedLow: number;
  let recommendedHigh: number;

  if (nonOutlierPrices.length >= 3) {
    const nonOutlierMedian = calculateMedian(nonOutlierPrices);
    const nonOutlierQ1 = calculatePercentile(nonOutlierPrices, 25);
    const nonOutlierQ3 = calculatePercentile(nonOutlierPrices, 75);
    recommendedLow = Math.round(nonOutlierQ1);
    recommendedHigh = Math.round(nonOutlierQ3);

    // Ensure some spread if Q1 and Q3 are very close
    if (recommendedHigh - recommendedLow < nonOutlierMedian * 0.05) {
      recommendedLow = Math.round(nonOutlierMedian * 0.95);
      recommendedHigh = Math.round(nonOutlierMedian * 1.05);
    }
  } else {
    // Fallback to all prices
    recommendedLow = Math.round(q1);
    recommendedHigh = Math.round(q3);
  }

  // Generate reasoning
  const outlierCount = listingsWithOutliers.filter((l) => l.is_outlier).length;
  const reasoning = buildReasoning(
    prices.length,
    average,
    median,
    recommendedLow,
    recommendedHigh,
    outlierCount,
    lowest,
    highest,
    confidence
  );

  return {
    average,
    median,
    lowest,
    highest,
    count: prices.length,
    recommendedLow,
    recommendedHigh,
    reasoning,
    listingsWithOutliers,
    confidence,
  };
}

function calculateMedian(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

function calculatePercentile(sorted: number[], percentile: number): number {
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const fraction = index - lower;
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

function buildReasoning(
  count: number,
  average: number,
  median: number,
  low: number,
  high: number,
  outlierCount: number,
  lowest: number,
  highest: number,
  confidence: Belastbarkeit
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const parts: string[] = [];

  // Steht bewusst zuerst: wer nur den ersten Satz liest, muss die Einschränkung
  // mitbekommen — nicht erst nach der Preisspanne.
  if (confidence === "orientierend") {
    parts.push(
      `Achtung: Diese Auswertung stützt sich auf nur ${count} Vergleichsfahrzeuge und ist daher eine grobe Orientierung, keine belastbare Bewertung. Ab ${MIN_PRICED_LISTINGS} Fahrzeugen gilt das Ergebnis als belastbar.`
    );
  }

  parts.push(
    `Basierend auf ${count} vergleichbaren Inseraten liegt der Medianpreis bei ${fmt(median)}.`
  );

  if (Math.abs(average - median) > median * 0.15) {
    parts.push(
      `Der Durchschnitt (${fmt(average)}) weicht deutlich vom Median ab, was auf eine ungleichmäßige Preisverteilung hindeutet.`
    );
  }

  if (outlierCount > 0) {
    parts.push(
      `${outlierCount} Inserat${outlierCount > 1 ? "e wurden" : " wurde"} als Ausreißer identifiziert und bei der Empfehlung nicht berücksichtigt.`
    );
  }

  parts.push(
    `Die empfohlene Preisspanne von ${fmt(low)} bis ${fmt(high)} spiegelt den Bereich wider, in dem die meisten vergleichbaren Fahrzeuge angeboten werden.`
  );

  parts.push(
    "Grundlage sind Angebotspreise, keine erzielten Verkaufspreise — letztere liegen erfahrungsgemäß darunter."
  );

  if (highest - lowest > median * 2) {
    parts.push(
      "Die große Preisspanne deutet auf unterschiedliche Fahrzeugzustände hin — Zustand, Laufleistung und Ausstattung können den Wert erheblich beeinflussen."
    );
  }

  return parts.join(" ");
}
