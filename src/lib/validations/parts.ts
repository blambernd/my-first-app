import { z } from "zod";

// --- Search types ---

export const PART_CONDITIONS = [
  { value: "all", label: "Alle" },
  { value: "new", label: "Neu" },
  { value: "used", label: "Gebraucht" },
] as const;

export type PartConditionFilter = (typeof PART_CONDITIONS)[number]["value"];

export const PLATFORMS = [
  { value: "ebay_kleinanzeigen", label: "eBay" },
  { value: "google_shopping", label: "Google Shopping" },
  { value: "specialist", label: "Spezialisten" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["value"];

export const partsSearchSchema = z.object({
  query: z
    .string()
    .min(2, "Suchbegriff muss mindestens 2 Zeichen lang sein")
    .max(200, "Suchbegriff darf maximal 200 Zeichen lang sein"),
  condition: z.enum(["all", "new", "used"]).default("all"),
  minPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  maxPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  platforms: z.array(z.string()).optional(),
});

export type PartsSearchFormData = z.infer<typeof partsSearchSchema>;

export interface PartListing {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  condition: "new" | "used" | "unknown";
  platform: PlatformId;
  platformLabel: string;
  url: string;
  imageUrl: string | null;
  seller: string | null;
  foundAt: string;
}

export interface PartGroup {
  title: string;
  listings: PartListing[];
  lowestPrice: number | null;
}

export interface PartsSearchResult {
  groups: PartGroup[];
  totalResults: number;
  platformErrors: { platform: string; error: string }[];
  page: number;
  totalPages: number;
}

// --- Alert types ---

export const ALERT_STATUSES = [
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pausiert" },
] as const;

export type AlertStatus = "active" | "paused";

export const createAlertSchema = z.object({
  searchQuery: z
    .string()
    .min(2, "Suchbegriff muss mindestens 2 Zeichen lang sein")
    .max(200, "Suchbegriff darf maximal 200 Zeichen lang sein"),
  maxPrice: z.coerce
    .number()
    .min(0, "Preis muss positiv sein")
    .optional()
    .or(z.literal("")),
  condition: z.enum(["all", "new", "used"]).default("all"),
});

export type CreateAlertFormData = z.infer<typeof createAlertSchema>;

export interface PartAlert {
  id: string;
  vehicle_id: string;
  user_id: string;
  search_query: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  max_price_cents: number | null;
  condition_filter: PartConditionFilter;
  status: AlertStatus;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartAlertMatch {
  id: string;
  alert_id: string;
  title: string;
  price_cents: number | null;
  condition: "new" | "used" | "unknown";
  platform: string;
  platform_label: string;
  url: string;
  image_url: string | null;
  found_at: string;
  is_read: boolean;
}

export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}
