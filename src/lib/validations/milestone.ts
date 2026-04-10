import { z } from "zod";

// Milestone categories
export const MILESTONE_CATEGORIES = [
  "erstzulassung",
  "kauf",
  "restauration",
  "unfall",
  "trophaee",
  "lackierung",
  "umbau",
  "sonstiges",
] as const;

export type MilestoneCategory = (typeof MILESTONE_CATEGORIES)[number];

export const CATEGORY_CONFIG: Record<
  MilestoneCategory,
  { label: string; color: string }
> = {
  erstzulassung: { label: "Erstzulassung", color: "text-green-600 bg-green-100" },
  kauf: { label: "Kauf / Besitzerwechsel", color: "text-blue-600 bg-blue-100" },
  restauration: { label: "Restauration", color: "text-orange-600 bg-orange-100" },
  unfall: { label: "Unfall / Schaden", color: "text-red-600 bg-red-100" },
  trophaee: { label: "Trophäe / Auszeichnung", color: "text-yellow-600 bg-yellow-100" },
  lackierung: { label: "Lackierung", color: "text-violet-600 bg-violet-100" },
  umbau: { label: "Umbau / Tuning", color: "text-cyan-600 bg-cyan-100" },
  sonstiges: { label: "Sonstiges", color: "text-gray-600 bg-gray-100" },
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_CONFIG[category as MilestoneCategory]?.label ?? category;
}

export const milestoneSchema = z.object({
  category: z.enum(MILESTONE_CATEGORIES, {
    message: "Kategorie ist erforderlich",
  }),
  milestone_date: z.string().min(1, "Datum ist erforderlich"),
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(200, "Titel darf maximal 200 Zeichen lang sein"),
  description: z
    .string()
    .max(2000, "Beschreibung darf maximal 2000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
});

export interface MilestoneFormData {
  category: MilestoneCategory;
  milestone_date: string;
  title: string;
  description?: string;
}

export interface VehicleMilestone {
  id: string;
  vehicle_id: string;
  category: MilestoneCategory;
  milestone_date: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleMilestoneImage {
  id: string;
  milestone_id: string;
  storage_path: string;
  position: number;
  caption: string | null;
  created_at: string;
}

export interface VehicleMilestoneWithImages extends VehicleMilestone {
  vehicle_milestone_images: VehicleMilestoneImage[];
}
