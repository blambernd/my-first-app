import { z } from "zod";

export const marketAnalysisListingSchema = z.object({
  title: z.string(),
  price: z.number().nullable(),
  platform: z.string(),
  url: z.string().url(),
  is_outlier: z.boolean().optional(),
});

export type MarketAnalysisListing = z.infer<typeof marketAnalysisListingSchema>;

export type MarketAnalysisStatus =
  | "pending"
  | "completed"
  | "insufficient_data"
  | "error";

export interface MarketAnalysis {
  id: string;
  vehicle_id: string;
  user_id: string;
  search_params: {
    make: string;
    model: string;
    year: number;
    factory_code: string | null;
    mileage_km: number | null;
  };
  status: MarketAnalysisStatus;
  average_price: number | null;
  median_price: number | null;
  lowest_price: number | null;
  highest_price: number | null;
  listing_count: number;
  recommended_price_low: number | null;
  recommended_price_high: number | null;
  recommendation_reasoning: string | null;
  listings: MarketAnalysisListing[];
  error_message: string | null;
  created_at: string;
}
