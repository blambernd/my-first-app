import { z } from "zod";

/** Eine Position der Kauf-Nebenkosten, z. B. Überführung oder Zulassung */
export const purchaseCostSchema = z.object({
  label: z
    .string()
    .min(1, "Bezeichnung ist erforderlich")
    .max(100, "Bezeichnung darf maximal 100 Zeichen lang sein"),
  amount_eur: z.coerce
    .number()
    .min(0, "Betrag kann nicht negativ sein")
    .max(999999, "Betrag darf maximal 999.999 € betragen"),
});

export const vehiclePurchaseSchema = z.object({
  price_eur: z.coerce
    .number()
    .min(0, "Kaufpreis kann nicht negativ sein")
    .max(9999999, "Kaufpreis darf maximal 9.999.999 € betragen"),
  purchased_on: z.string().min(1, "Kaufdatum ist erforderlich"),
  notes: z
    .string()
    .max(1000, "Notiz darf maximal 1.000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  extraCosts: z.array(purchaseCostSchema).max(20, "Höchstens 20 Nebenkosten"),
});

export type VehiclePurchaseFormData = z.infer<typeof vehiclePurchaseSchema>;

export interface PurchaseExtraCost {
  id: string;
  purchase_id: string;
  vehicle_id: string;
  label: string;
  amount_cents: number;
  created_at: string;
}

export interface VehiclePurchase {
  id: string;
  vehicle_id: string;
  price_cents: number;
  purchased_on: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface VehiclePurchaseWithCosts extends VehiclePurchase {
  extraCosts: PurchaseExtraCost[];
}

/**
 * Normalisiert Datenbankzeilen auf echte Zahlen.
 *
 * Gleiche Vorsichtsmaßnahme wie bei Tankbuch und laufenden Kosten: Je nach
 * Treiber können Zahlenspalten als String zurückkommen und stille Rechenfehler
 * verursachen — aus einer Addition würde eine Zeichenverkettung.
 */
export function normalizePurchase(row: VehiclePurchase): VehiclePurchase {
  return { ...row, price_cents: Number(row.price_cents) };
}

export function normalizeExtraCost(row: PurchaseExtraCost): PurchaseExtraCost {
  return { ...row, amount_cents: Number(row.amount_cents) };
}

/** Anschaffung insgesamt: Kaufpreis plus alle Nebenkosten */
export function totalAcquisitionCents(
  purchase: VehiclePurchase,
  extraCosts: PurchaseExtraCost[]
): number {
  return (
    purchase.price_cents +
    extraCosts.reduce((sum, cost) => sum + cost.amount_cents, 0)
  );
}
