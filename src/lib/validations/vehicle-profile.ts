import { z } from "zod";

export const profileSectionsSchema = z.object({
  stammdaten: z.boolean().default(true),
  fotos: z.boolean().default(true),
  scheckheft: z.boolean().default(true),
  meilensteine: z.boolean().default(true),
  dokumente: z.boolean().default(true),
});

export const profileConfigSchema = z.object({
  sections: profileSectionsSchema,
  selected_images: z.array(z.string()).default([]),
  selected_service_entries: z.array(z.string()).default([]),
  selected_milestones: z.array(z.string()).default([]),
  selected_documents: z.array(z.string()).default([]),
});

export type ProfileConfig = z.infer<typeof profileConfigSchema>;
export type ProfileSections = z.infer<typeof profileSectionsSchema>;

export interface VehicleProfile {
  id: string;
  vehicle_id: string;
  user_id: string;
  token: string;
  is_active: boolean;
  config: ProfileConfig;
  created_at: string;
  updated_at: string;
}

export const SECTION_LABELS: Record<keyof ProfileSections, string> = {
  stammdaten: "Stammdaten",
  fotos: "Fotos",
  scheckheft: "Scheckheft",
  meilensteine: "Meilensteine & Restaurierungen",
  dokumente: "Dokumente",
};
