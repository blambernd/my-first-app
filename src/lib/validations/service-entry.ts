import { z } from "zod";

export const SERVICE_ENTRY_TYPES = [
  { value: "inspection", label: "Inspektion" },
  { value: "oil_change", label: "Ölwechsel" },
  { value: "repair", label: "Reparatur" },
  { value: "tuv_hu", label: "TÜV/HU" },
  { value: "restoration", label: "Restaurierung" },
  { value: "other", label: "Sonstiges" },
] as const;

export type ServiceEntryType = (typeof SERVICE_ENTRY_TYPES)[number]["value"];

export const serviceEntrySchema = z.object({
  service_date: z.string().min(1, "Datum ist erforderlich"),
  entry_type: z.enum(
    ["inspection", "oil_change", "repair", "tuv_hu", "restoration", "other"],
    { error: "Bitte wähle einen Typ" }
  ),
  description: z
    .string()
    .min(1, "Beschreibung ist erforderlich")
    .max(2000, "Beschreibung darf maximal 2000 Zeichen lang sein"),
  mileage_km: z.coerce
    .number()
    .int("Kilometerstand muss eine ganze Zahl sein")
    .min(0, "Kilometerstand kann nicht negativ sein")
    .max(9999999, "Kilometerstand darf maximal 9.999.999 sein"),
  is_odometer_correction: z.boolean().default(false),
  cost_cents: z.coerce
    .number()
    .int()
    .min(0, "Kosten können nicht negativ sein")
    .optional()
    .or(z.literal("")),
  workshop_name: z
    .string()
    .max(200, "Werkstatt-Name darf maximal 200 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(2000, "Notizen dürfen maximal 2000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
});

export interface ServiceEntryFormData {
  service_date: string;
  entry_type: ServiceEntryType;
  description: string;
  mileage_km: number;
  is_odometer_correction: boolean;
  cost_cents?: number;
  workshop_name?: string;
  notes?: string;
}

export interface ServiceEntry {
  id: string;
  vehicle_id: string;
  service_date: string;
  entry_type: ServiceEntryType;
  description: string;
  mileage_km: number;
  is_odometer_correction: boolean;
  cost_cents: number | null;
  workshop_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function formatCentsToEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

export function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}

export function getEntryTypeLabel(type: ServiceEntryType): string {
  return SERVICE_ENTRY_TYPES.find((t) => t.value === type)?.label ?? type;
}
