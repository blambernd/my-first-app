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
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}
