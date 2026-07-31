import { z } from "zod";

export const ONE_OFF_COST_TYPES = [
  { value: "parts", label: "Ersatzteile" },
  { value: "appraisal", label: "Wertgutachten" },
  { value: "other", label: "Sonstiges" },
] as const;

export type OneOffCostType = (typeof ONE_OFF_COST_TYPES)[number]["value"];

/**
 * Einordnung als Stand- oder Fahrtkosten.
 *
 * Wie bei den laufenden Kosten eine Eigenschaft der Kostenart und nicht des
 * einzelnen Datensatzes — sonst könnten zwei Einträge derselben Art
 * widersprüchlich eingeordnet sein.
 *
 * „Sonstiges" bleibt bewusst **ohne** Zuordnung: Darunter fallen Pflegemittel
 * ebenso wie Additive, die einmal beim Stehen und einmal beim Fahren anfallen.
 * Eine erzwungene Einordnung wäre geraten. PROJ-27 muss solche Beträge in der
 * Gesamtsumme führen, sie aber aus der Stand-/Fahrt-Aufteilung heraushalten —
 * dieser Fall ist dort bereits als Edge Case vorgesehen.
 */
export const ONE_OFF_COST_CLASSIFICATION: Record<
  OneOffCostType,
  "standing" | "driving" | null
> = {
  parts: "driving",
  appraisal: "standing",
  other: null,
};

export const oneOffCostSchema = z.object({
  cost_type: z.enum(["parts", "appraisal", "other"], {
    error: "Bitte wähle eine Kostenart",
  }),
  description: z
    .string()
    .min(1, "Bezeichnung ist erforderlich")
    .max(200, "Bezeichnung darf maximal 200 Zeichen lang sein"),
  amount_eur: z.coerce
    .number()
    .min(0, "Betrag kann nicht negativ sein")
    .max(99999, "Betrag darf maximal 99.999 € betragen"),
  purchased_at: z.string().min(1, "Datum ist erforderlich"),
  quantity: z.coerce
    .number()
    .int("Menge muss eine ganze Zahl sein")
    .min(1, "Menge muss mindestens 1 sein")
    .max(9999, "Menge darf maximal 9.999 sein")
    .default(1),
  part_number: z
    .string()
    .max(100, "Teilenummer darf maximal 100 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  source: z
    .string()
    .max(200, "Bezugsquelle darf maximal 200 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  installed_at: z.string().optional().or(z.literal("")),
  service_entry_id: z.string().optional().or(z.literal("")),
  included_in_service_entry: z.boolean().default(false),
  notes: z
    .string()
    .max(1000, "Notizen dürfen maximal 1000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
});

export interface OneOffCostFormData {
  cost_type: OneOffCostType;
  description: string;
  amount_eur: number;
  purchased_at: string;
  quantity: number;
  part_number?: string;
  source?: string;
  installed_at?: string;
  service_entry_id?: string;
  included_in_service_entry: boolean;
  notes?: string;
}

export interface OneOffCost {
  id: string;
  vehicle_id: string;
  cost_type: OneOffCostType;
  description: string;
  amount_cents: number;
  purchased_at: string;
  quantity: number;
  part_number: string | null;
  source: string | null;
  installed_at: string | null;
  service_entry_id: string | null;
  included_in_service_entry: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function getOneOffCostTypeLabel(type: OneOffCostType): string {
  return ONE_OFF_COST_TYPES.find((t) => t.value === type)?.label ?? type;
}

/** Nur bei Ersatzteilen sind Teilenummer, Menge und Einbaudatum sinnvoll */
export function supportsPartFields(type: OneOffCostType): boolean {
  return type === "parts";
}

export function normalizeOneOffCost(row: OneOffCost): OneOffCost {
  return {
    ...row,
    amount_cents: Number(row.amount_cents),
    quantity: Number(row.quantity),
  };
}
