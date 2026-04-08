import { z } from "zod";

export const PRICE_TYPES = ["festpreis", "verhandlungsbasis"] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  festpreis: "Festpreis",
  verhandlungsbasis: "Verhandlungsbasis",
};

export const LISTING_STATUSES = ["entwurf", "veroeffentlicht"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const TITLE_MAX_LENGTH = 70;
export const DESCRIPTION_MAX_LENGTH = 5000;

export const listingSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").max(TITLE_MAX_LENGTH),
  description: z.string().max(DESCRIPTION_MAX_LENGTH),
  price_cents: z.number().int().min(0).nullable(),
  price_type: z.enum(PRICE_TYPES),
  selected_photo_ids: z.array(z.string()).default([]),
  photo_order: z.array(z.string()).default([]),
});

export type ListingFormData = z.infer<typeof listingSchema>;

// Platform publishing
export const PLATFORM_IDS = [
  "mobile_de",
  "kleinanzeigen",
  "ebay",
  "classic_trader",
] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

export const PLATFORM_STATUSES = [
  "nicht_veroeffentlicht",
  "aktiv",
  "verkauft",
] as const;
export type PlatformStatus = (typeof PLATFORM_STATUSES)[number];

export interface PlatformEntry {
  platform: PlatformId;
  status: PlatformStatus;
  external_url: string;
  published_at: string | null;
  updated_at: string | null;
}

export const PLATFORM_INFO: Record<
  PlatformId,
  { name: string; createUrl: string; maxPhotos: number; maxDescLength: number }
> = {
  mobile_de: {
    name: "mobile.de",
    createUrl: "https://www.mobile.de/verkaufen/",
    maxPhotos: 30,
    maxDescLength: 5000,
  },
  kleinanzeigen: {
    name: "Kleinanzeigen",
    createUrl: "https://www.kleinanzeigen.de/p-anzeige-aufgeben.html",
    maxPhotos: 20,
    maxDescLength: 4000,
  },
  ebay: {
    name: "eBay",
    createUrl: "https://www.ebay.de/sl/sell",
    maxPhotos: 24,
    maxDescLength: 4000,
  },
  classic_trader: {
    name: "Classic Trader",
    createUrl: "https://www.classic-trader.com/de/inserieren",
    maxPhotos: 50,
    maxDescLength: 10000,
  },
};

export const publishedPlatformSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  status: z.enum(PLATFORM_STATUSES),
  external_url: z.string(),
  published_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export interface VehicleListing {
  id: string;
  vehicle_id: string;
  user_id: string;
  title: string;
  description: string;
  price_cents: number | null;
  price_type: PriceType;
  selected_photo_ids: string[];
  photo_order: string[];
  published_platforms: PlatformEntry[];
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}
