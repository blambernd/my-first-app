import { z } from "zod";

export const milestoneSchema = z.object({
  milestone_date: z.string().min(1, "Datum ist erforderlich"),
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(200, "Titel darf maximal 200 Zeichen lang sein"),
  description: z
    .string()
    .max(1000, "Beschreibung darf maximal 1000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
});

export interface MilestoneFormData {
  milestone_date: string;
  title: string;
  description?: string;
}

export interface VehicleMilestone {
  id: string;
  vehicle_id: string;
  milestone_date: string;
  title: string;
  description: string | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}
