import type { Ablehnungsgrund } from "./classification";
import type { Belastbarkeit } from "./statistics";

export interface MarketSearchParams {
  make: string;
  model: string;
  year: number;
  factoryCode?: string | null;
  bodyType?: string | null;
  mileageKm?: number | null;
}

export interface MarketListing {
  title: string;
  price: number | null;
  platform: string;
  url: string;
}

/**
 * Ein verworfener Treffer (PROJ-29). Wird gespeichert, damit die Analyse
 * nachvollziehbar bleibt — der Nutzer sieht, was aussortiert wurde und warum,
 * statt nur eine geschrumpfte Trefferzahl.
 */
export interface RejectedListing {
  title: string;
  url: string;
  platform: string;
  reason: Ablehnungsgrund;
}

export interface MarketSearchResult {
  listings: MarketListing[];
  platformErrors: Array<{ platform: string; error: string }>;
  /** Verworfene Treffer, gedeckelt — siehe MAX_REJECTED_STORED. */
  rejected: RejectedListing[];
  /** Vollständige Zählung je Grund, auch über das Speicherlimit hinaus. */
  rejectedCounts: Partial<Record<Ablehnungsgrund, number>>;
}

export interface PriceStatistics {
  average: number;
  median: number;
  lowest: number;
  highest: number;
  count: number;
  recommendedLow: number;
  recommendedHigh: number;
  reasoning: string;
  listingsWithOutliers: Array<MarketListing & { is_outlier: boolean }>;
  /**
   * Wie belastbar das Ergebnis ist (PROJ-29). "orientierend" bedeutet: die
   * Spanne beruht auf weniger als MIN_PRICED_LISTINGS Fahrzeugen und muss in
   * der Oberfläche als solche gekennzeichnet werden.
   */
  confidence: Belastbarkeit;
}
