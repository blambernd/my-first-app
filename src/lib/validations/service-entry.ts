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

export const OIL_CHANGE_CATEGORIES = [
  { value: "motor_oil", label: "Motoröl" },
  { value: "transmission_oil", label: "Getriebeöl" },
  { value: "rear_axle_oil", label: "Hinterachsöl" },
  { value: "other_oil", label: "Anderes" },
] as const;

export type OilChangeCategory = (typeof OIL_CHANGE_CATEGORIES)[number]["value"];

export interface OilChangeCategoryEntry {
  category: OilChangeCategory;
  next_due_date: string | null;
  custom_label?: string; // For "other_oil" category
}

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
  next_due_date: z.string().optional().or(z.literal("")),
  oil_change_categories: z
    .array(
      z.object({
        category: z.enum(["motor_oil", "transmission_oil", "rear_axle_oil", "other_oil"]),
        next_due_date: z.string().nullable().optional(),
        custom_label: z.string().max(100).optional(),
      })
    )
    .optional(),
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
  next_due_date?: string;
  oil_change_categories?: OilChangeCategoryEntry[];
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
  next_due_date: string | null;
  oil_change_categories: OilChangeCategoryEntry[] | null;
  created_by: string | null;
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

/** Get the next TÜV/HU due date from entries (last TÜV + 2 years, or manual next_due_date) */
export function getNextTuvDate(entries: ServiceEntry[]): string | null {
  const tuvEntries = entries
    .filter((e) => e.entry_type === "tuv_hu")
    .sort((a, b) => b.service_date.localeCompare(a.service_date));

  const latest = tuvEntries[0];
  if (!latest) return null;

  // Prefer manually set next_due_date
  if (latest.next_due_date) return latest.next_due_date;

  // Default: +2 years
  const date = new Date(latest.service_date);
  date.setFullYear(date.getFullYear() + 2);
  return date.toISOString().split("T")[0];
}

/** Get the next service due date from entries (last service/oil change, or manual next_due_date) */
export function getNextServiceDate(entries: ServiceEntry[]): string | null {
  const serviceEntries = entries
    .filter((e) => e.entry_type === "inspection" || e.entry_type === "oil_change")
    .sort((a, b) => b.service_date.localeCompare(a.service_date));

  const latest = serviceEntries[0];
  if (!latest) return null;

  if (latest.next_due_date) return latest.next_due_date;

  // Default: +1 year
  const date = new Date(latest.service_date);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
}

/** Get the label for an oil change category */
export function getOilCategoryLabel(category: OilChangeCategory): string {
  return OIL_CHANGE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

/** Get the next oil change due date across all entries and all oil subcategories */
export function getNextOilChangeDate(entries: ServiceEntry[]): { date: string; category: OilChangeCategory; label: string } | null {
  const oilEntries = entries.filter((e) => e.entry_type === "oil_change");
  if (oilEntries.length === 0) return null;

  let earliest: { date: string; category: OilChangeCategory; label: string } | null = null;
  const now = new Date().toISOString().split("T")[0];

  for (const entry of oilEntries) {
    const categories = entry.oil_change_categories;
    if (categories && categories.length > 0) {
      for (const cat of categories) {
        const dueDate = cat.next_due_date;
        if (dueDate) {
          if (!earliest || dueDate < earliest.date) {
            earliest = {
              date: dueDate,
              category: cat.category,
              label: cat.category === "other_oil" && cat.custom_label
                ? cat.custom_label
                : getOilCategoryLabel(cat.category),
            };
          }
        }
      }
    } else if (entry.next_due_date) {
      // Fallback for legacy entries without subcategories
      if (!earliest || entry.next_due_date < earliest.date) {
        earliest = {
          date: entry.next_due_date,
          category: "motor_oil",
          label: "Ölwechsel",
        };
      }
    }
  }

  return earliest;
}

/** Get all oil change subcategory due dates (latest per category across all entries) */
export function getAllOilChangeDueDates(entries: ServiceEntry[]): { category: OilChangeCategory; label: string; date: string }[] {
  const oilEntries = entries.filter((e) => e.entry_type === "oil_change");
  // Track the most recent due date per category
  const latestByCategory = new Map<OilChangeCategory, { label: string; date: string; serviceDate: string }>();

  for (const entry of oilEntries) {
    const categories = entry.oil_change_categories;
    if (categories && categories.length > 0) {
      for (const cat of categories) {
        if (cat.next_due_date) {
          const existing = latestByCategory.get(cat.category);
          // Keep the one from the most recent service entry
          if (!existing || entry.service_date > existing.serviceDate) {
            latestByCategory.set(cat.category, {
              label: cat.category === "other_oil" && cat.custom_label
                ? cat.custom_label
                : getOilCategoryLabel(cat.category),
              date: cat.next_due_date,
              serviceDate: entry.service_date,
            });
          }
        }
      }
    }
  }

  return Array.from(latestByCategory.entries())
    .map(([category, { label, date }]) => ({ category, label, date }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Check if a date is overdue or due within 30 days */
export function getDueStatus(dateStr: string): "overdue" | "soon" | "ok" {
  const due = new Date(dateStr);
  const now = new Date();
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 30) return "soon";
  return "ok";
}
