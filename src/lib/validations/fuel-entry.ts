import { z } from "zod";

export const FUEL_TYPES = [
  { value: "super_e5", label: "Super E5" },
  { value: "super_e10", label: "Super E10" },
  { value: "super_plus", label: "Super Plus" },
  { value: "diesel", label: "Diesel" },
  { value: "lpg", label: "Autogas (LPG)" },
  { value: "other", label: "Sonstiges" },
] as const;

export type FuelType = (typeof FUEL_TYPES)[number]["value"];

export const fuelEntrySchema = z.object({
  fueled_at: z.string().min(1, "Datum ist erforderlich"),
  liters: z.coerce
    .number()
    .positive("Literangabe muss größer als 0 sein")
    .max(999, "Literangabe darf maximal 999 sein"),
  // Eingabe erfolgt in Euro, gespeichert wird in Cent (siehe eurToCents)
  cost_eur: z.coerce
    .number()
    .min(0, "Kosten können nicht negativ sein")
    .max(99999, "Kosten dürfen maximal 99.999 € betragen"),
  mileage_km: z.coerce
    .number()
    .int("Kilometerstand muss eine ganze Zahl sein")
    .min(0, "Kilometerstand kann nicht negativ sein")
    .max(9999999, "Kilometerstand darf maximal 9.999.999 sein"),
  is_full_tank: z.boolean().default(true),
  is_odometer_correction: z.boolean().default(false),
  station: z
    .string()
    .max(200, "Tankstelle darf maximal 200 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  fuel_type: z
    .enum(["super_e5", "super_e10", "super_plus", "diesel", "lpg", "other"])
    .optional(),
  notes: z
    .string()
    .max(1000, "Notizen dürfen maximal 1000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
});

export interface FuelEntryFormData {
  fueled_at: string;
  liters: number;
  cost_eur: number;
  mileage_km: number;
  is_full_tank: boolean;
  is_odometer_correction: boolean;
  station?: string;
  fuel_type?: FuelType;
  notes?: string;
}

export interface FuelEntry {
  id: string;
  vehicle_id: string;
  fueled_at: string;
  liters: number;
  /**
   * Betrag in Cent, oder null.
   *
   * `null` heißt „kein Betrag bekannt" und entsteht beim Besitzerwechsel
   * (PROJ-32): Die Beträge des Vorbesitzers werden geleert, die Tankvorgänge
   * selbst bleiben. Eine 0 stünde dort für „war gratis" und wäre falsch.
   * Neue Einträge verlangen einen Betrag — das erzwingt das Formular.
   */
  cost_cents: number | null;
  mileage_km: number;
  is_full_tank: boolean;
  is_odometer_correction: boolean;
  station: string | null;
  fuel_type: FuelType | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

/**
 * Normalisiert eine Datenbankzeile auf echte Zahlen.
 *
 * `liters` ist in Postgres NUMERIC. Je nach Treiber kommt der Wert als String
 * zurück ("42.5" statt 42.5) — die Verbrauchsberechnung würde dann Strings
 * aneinanderhängen statt zu addieren und still falsche Werte liefern.
 * Die Umwandlung an dieser einen Stelle macht den Rest des Codes davon unabhängig.
 */
export function normalizeFuelEntry(row: FuelEntry): FuelEntry {
  return {
    ...row,
    liters: Number(row.liters),
    cost_cents: row.cost_cents === null ? null : Number(row.cost_cents),
    mileage_km: Number(row.mileage_km),
  };
}

/** Verbrauchswerte außerhalb dieser Grenzen gelten als vermutlich fehlerhaft (PROJ-24 Edge Case) */
export const IMPLAUSIBLE_CONSUMPTION_MIN = 1;
export const IMPLAUSIBLE_CONSUMPTION_MAX = 40;

/** Ab dieser Lücke wird der Verlauf unterbrochen statt durchgezogen (Winterpause) */
export const CHART_GAP_DAYS = 90;

export function getFuelTypeLabel(type: FuelType): string {
  return FUEL_TYPES.find((t) => t.value === type)?.label ?? type;
}

/** Preis pro Liter in Cent — null, wenn keine sinnvolle Berechnung möglich ist */
export function pricePerLiterCents(
  costCents: number | null,
  liters: number
): number | null {
  // Ohne Betrag gibt es keinen Literpreis. 0,00 € je Liter zu zeigen wäre
  // eine Aussage über den Tankvorgang, die niemand getroffen hat.
  if (costCents === null || liters <= 0) return null;
  return costCents / liters;
}

export function formatLiters(liters: number): string {
  return liters.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatConsumption(lPer100km: number): string {
  return lPer100km.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatKm(km: number): string {
  return km.toLocaleString("de-DE");
}
