import { z } from "zod";

/**
 * Selbst eingetragener Marktwert (Ersatz für die ausgesetzte Marktanalyse).
 *
 * Beträge werden im Produkt durchgängig in Cent gespeichert; die Eingabe
 * erfolgt in Euro und wird beim Speichern umgerechnet.
 */

/** Obergrenze: 1 Mrd. €, damit ein Tippfehler nicht die Bilanz sprengt */
export const MAX_MARKET_VALUE_CENTS = 100_000_000_000;

export const marketValueSchema = z.object({
  value_eur: z
    .string()
    .min(1, "Bitte gib einen Wert an")
    .refine((v) => {
      const n = Number(v.replace(/\./g, "").replace(",", "."));
      return Number.isFinite(n) && n > 0;
    }, "Bitte gib einen Betrag größer als 0 an")
    .refine((v) => {
      const n = Number(v.replace(/\./g, "").replace(",", "."));
      return Math.round(n * 100) <= MAX_MARKET_VALUE_CENTS;
    }, "Dieser Betrag ist unrealistisch hoch"),
  valued_on: z.string().min(1, "Bitte gib an, wann die Schätzung gilt"),
  note: z
    .string()
    .max(500, "Der Vermerk darf höchstens 500 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
});

export type MarketValueFormData = z.infer<typeof marketValueSchema>;

/** Zeile aus `vehicle_market_values` */
export interface VehicleMarketValue {
  id: string;
  vehicle_id: string;
  user_id: string;
  value_cents: number | string;
  valued_on: string;
  note: string | null;
  created_at: string;
}

/**
 * Wandelt eine deutsche Euro-Eingabe in Cent.
 * Akzeptiert "18.500", "18500,50" und "18500".
 */
export function parseEuroToCents(input: string): number {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  return Math.round(Number(normalized) * 100);
}
