import { z } from "zod";

export const RECURRING_COST_TYPES = [
  { value: "insurance", label: "Versicherung" },
  { value: "tax", label: "Kfz-Steuer" },
  { value: "storage", label: "Unterstellung / Garage" },
  { value: "club", label: "Club- / Verbandsbeitrag" },
] as const;

export type RecurringCostType = (typeof RECURRING_COST_TYPES)[number]["value"];

/**
 * Zahlungsintervalle mit ihrer Länge in Monaten.
 *
 * Die Monatszahl ist der eigentliche Rechenwert: Der erfasste Betrag gilt
 * **pro Intervall**, nicht für den gesamten Zeitraum (siehe Tech Design C2).
 */
export const PAYMENT_INTERVALS = [
  { value: "yearly", label: "jährlich", months: 12 },
  { value: "half_yearly", label: "halbjährlich", months: 6 },
  { value: "quarterly", label: "vierteljährlich", months: 3 },
  { value: "monthly", label: "monatlich", months: 1 },
] as const;

export type PaymentInterval = (typeof PAYMENT_INTERVALS)[number]["value"];

/**
 * Einordnung der Kostenart als Stand- oder Fahrtkosten.
 *
 * Bewusst hier und nicht als Feld am Datensatz (Tech Design C5): Eine
 * Versicherung ist immer Standkosten, unabhängig davon, wer sie wann erfasst.
 * Als Feld könnten zwei Einträge derselben Art widersprüchlich eingeordnet sein.
 */
export const COST_CLASSIFICATION: Record<
  RecurringCostType,
  "standing" | "driving"
> = {
  insurance: "standing",
  tax: "standing",
  storage: "standing",
  club: "standing",
};

export const recurringCostSchema = z
  .object({
    cost_type: z.enum(["insurance", "tax", "storage", "club"], {
      error: "Bitte wähle eine Kostenart",
    }),
    amount_eur: z.coerce
      .number()
      .min(0, "Betrag kann nicht negativ sein")
      .max(99999, "Betrag darf maximal 99.999 € betragen"),
    payment_interval: z.enum([
      "yearly",
      "half_yearly",
      "quarterly",
      "monthly",
    ]),
    valid_from: z.string().min(1, "Startdatum ist erforderlich"),
    valid_to: z.string().min(1, "Enddatum ist erforderlich"),
    provider: z
      .string()
      .max(200, "Anbieter darf maximal 200 Zeichen lang sein")
      .optional()
      .or(z.literal("")),
    notes: z
      .string()
      .max(1000, "Notizen dürfen maximal 1000 Zeichen lang sein")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.valid_to > data.valid_from, {
    message: "„Gültig bis“ muss nach „Gültig von“ liegen",
    path: ["valid_to"],
  });

export interface RecurringCostFormData {
  cost_type: RecurringCostType;
  amount_eur: number;
  payment_interval: PaymentInterval;
  valid_from: string;
  valid_to: string;
  provider?: string;
  notes?: string;
}

export interface RecurringCost {
  id: string;
  vehicle_id: string;
  cost_type: RecurringCostType;
  amount_cents: number;
  payment_interval: PaymentInterval;
  valid_from: string;
  valid_to: string;
  provider: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function getCostTypeLabel(type: RecurringCostType): string {
  return RECURRING_COST_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function getIntervalLabel(interval: PaymentInterval): string {
  return PAYMENT_INTERVALS.find((i) => i.value === interval)?.label ?? interval;
}

export function getIntervalMonths(interval: PaymentInterval): number {
  return PAYMENT_INTERVALS.find((i) => i.value === interval)?.months ?? 12;
}

/**
 * Normalisiert eine Datenbankzeile auf echte Zahlen.
 * Gleiche Vorsichtsmaßnahme wie bei den Tankvorgängen: Je nach Treiber können
 * Zahlenspalten als String zurückkommen und stille Rechenfehler verursachen.
 */
export function normalizeRecurringCost(row: RecurringCost): RecurringCost {
  return { ...row, amount_cents: Number(row.amount_cents) };
}
