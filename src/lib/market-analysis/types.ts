export interface MarketSearchParams {
  make: string;
  model: string;
  year: number;
  factoryCode?: string | null;
  mileageKm?: number | null;
}

export interface MarketListing {
  title: string;
  price: number | null;
  platform: string;
  url: string;
}

export interface MarketSearchResult {
  listings: MarketListing[];
  platformErrors: Array<{ platform: string; error: string }>;
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
}
