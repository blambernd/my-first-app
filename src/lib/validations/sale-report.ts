import { z } from "zod";

/**
 * Die Angaben, die der Käufer beim Annehmen einer Übergabe machen kann
 * (PROJ-33).
 *
 * Zwei Dinge, die auseinandergehalten werden müssen:
 *
 * - Der **Kaufpreis** ist die Anschaffung des neuen Besitzers und wird
 *   gespeichert, sobald er ihn einträgt — damit seine Wertentwicklung von
 *   Anfang an stimmt
 * - Die **Einwilligung** betrifft nur die Weitergabe an die anonyme
 *   Preisübersicht. Ohne sie entsteht kein Datenpunkt, der Kaufpreis bleibt
 *   trotzdem erhalten
 *
 * Beides zu vermengen hieße, dem Nutzer entweder seine Wertentwicklung
 * vorzuenthalten oder ihn zur Datenspende zu drängen.
 */

/**
 * Plausibler Preisbereich (F1).
 *
 * Weit genug für einen Scheunenfund wie für einen Sammlerwagen, eng genug,
 * um Tippfehler um Zehnerpotenzen zu fangen. Ein einzelner falscher Wert
 * wiegt bei kleiner Datenmenge schwer.
 */
export const MIN_PREIS_EUR = 500;
export const MAX_PREIS_EUR = 2_000_000;

/** Breite der Kilometer-Klassen (C3) */
export const KM_KLASSENBREITE = 25_000;

/**
 * Oberhalb dieser Grenze gibt es nur noch eine offene Klasse (F2).
 *
 * Weitere Schritte blieben leer, und als Preismerkmal wird die Laufleistung
 * dort ohnehin stumpf.
 */
export const KM_OBERGRENZE = 250_000;

/**
 * Ordnet einen Kilometerstand seiner Klasse zu.
 *
 * Gespeichert wird die **Untergrenze** der Klasse, nicht der Einzelwert:
 * 52.000 und 54.000 km sind praktisch gleichwertig, und die Vergröberung
 * sorgt dafür, dass Vergleichsgruppen die Mindestzahl häufiger erreichen.
 */
export function kmKlasse(km: number): number {
  if (km >= KM_OBERGRENZE) return KM_OBERGRENZE;
  return Math.floor(km / KM_KLASSENBREITE) * KM_KLASSENBREITE;
}

/** Beschriftung einer Klasse, z. B. „50.000–75.000 km" oder „über 250.000 km" */
export function kmKlasseLabel(untergrenze: number): string {
  if (untergrenze >= KM_OBERGRENZE) {
    return `über ${KM_OBERGRENZE.toLocaleString("de-DE")} km`;
  }
  const oben = untergrenze + KM_KLASSENBREITE;
  return `${untergrenze.toLocaleString("de-DE")}–${oben.toLocaleString("de-DE")} km`;
}

/** „2026-08" — der Verkaufszeitpunkt wird nur monatsgenau abgelegt (C2) */
export function verkaufsmonat(datum: Date): string {
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, "0")}`;
}

export const saleReportSchema = z.object({
  /** Leer lassen ist erlaubt — die Übergabe hängt nicht daran */
  purchase_price_eur: z.coerce
    .number({ message: "Bitte gib einen Betrag ein" })
    .positive("Der Kaufpreis muss größer als 0 sein")
    .optional(),
  condition_grade: z.coerce.number().int().min(1).max(5).optional(),
  mileage_km: z.coerce
    .number()
    .int()
    .min(0, "Der Kilometerstand kann nicht negativ sein")
    .max(2_000_000, "Bitte prüfe den Kilometerstand")
    .optional(),
  /** Muss aktiv gesetzt werden — nie vorbelegt */
  share_anonymously: z.boolean(),
});

export type SaleReportInput = z.infer<typeof saleReportSchema>;

/** Warum eine Angabe nicht in die Preisübersicht einfließen kann */
export type AblehnungsGrund =
  | "kein-preis"
  | "preis-zu-niedrig"
  | "preis-zu-hoch"
  | "keine-zustandsnote"
  | "kein-kilometerstand";

/**
 * Taugt die Eingabe für die anonyme Auswertung?
 *
 * Bewusst getrennt von der Formularprüfung: Eine Angabe kann für die eigene
 * Anschaffung völlig in Ordnung sein und trotzdem nicht in die Auswertung
 * gehören. Eine Schenkung etwa ist ein richtiger Kaufpreis von 0 € — aber
 * kein Marktpreis, und sie würde die Übersicht verziehen.
 */
export function pruefeFuerAuswertung(
  eingabe: SaleReportInput
): AblehnungsGrund | null {
  const preis = eingabe.purchase_price_eur;
  if (preis === undefined || preis <= 0) return "kein-preis";
  if (preis < MIN_PREIS_EUR) return "preis-zu-niedrig";
  if (preis > MAX_PREIS_EUR) return "preis-zu-hoch";
  if (eingabe.condition_grade === undefined) return "keine-zustandsnote";
  if (eingabe.mileage_km === undefined) return "kein-kilometerstand";
  return null;
}

/** Verständliche Begründung statt stiller Ablehnung */
export function ablehnungsText(grund: AblehnungsGrund): string {
  switch (grund) {
    case "kein-preis":
      return "Ohne Kaufpreis kann nichts in die Preisübersicht einfließen.";
    case "preis-zu-niedrig":
      return `Preise unter ${MIN_PREIS_EUR.toLocaleString("de-DE")} € fließen nicht in die Preisübersicht ein — sie sind meist Schenkungen oder Vertipper. Dein Kaufpreis wird trotzdem gespeichert.`;
    case "preis-zu-hoch":
      return `Preise über ${MAX_PREIS_EUR.toLocaleString("de-DE")} € fließen nicht in die Preisübersicht ein. Bitte prüfe die Angabe.`;
    case "keine-zustandsnote":
      return "Ohne Zustandsnote lässt sich der Verkauf nicht vergleichen — ein Concours-Fahrzeug und ein Restaurierungsobjekt sind nicht dasselbe.";
    case "kein-kilometerstand":
      return "Ohne Kilometerstand lässt sich der Verkauf nicht einordnen.";
  }
}
