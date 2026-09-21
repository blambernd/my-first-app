import { z } from "zod";

/**
 * Zustaende eines Fahrzeug-Transfers.
 *
 * `abgelaufen` setzt die Datenbank selbst, sobald jemand einen Transfer nach
 * Fristende anzunehmen versucht. Der Wert fehlte hier bis zum 2026-08-04 —
 * siehe die Migration 20260804_proj7_fix_abgelaufen_status.
 */
export const TRANSFER_STATUSES = [
  "offen",
  "angenommen",
  "abgelehnt",
  "abgebrochen",
  "abgelaufen",
] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  offen: "Ausstehend",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
  abgebrochen: "Abgebrochen",
  abgelaufen: "Abgelaufen",
};

export const transferSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail ist erforderlich")
    .email("Ungültige E-Mail-Adresse"),
  keepAsViewer: z.boolean().default(true),
  /**
   * Wunsch, nach der Übergabe als Werkstatt verbunden zu bleiben (PROJ-40).
   *
   * Nur ein Angebot: Wirksam wird es erst, wenn der Empfänger bei der
   * Annahme zustimmt. Deshalb heißt das Feld „offer" und nicht „keep".
   */
  offerWorkshopRole: z.boolean().default(false),
});

export type TransferFormData = z.infer<typeof transferSchema>;

export interface VehicleTransfer {
  id: string;
  vehicle_id: string;
  from_user_id: string;
  to_email: string;
  token: string;
  keep_as_viewer: boolean;
  /** PROJ-40 */
  offer_workshop_role?: boolean;
  status: TransferStatus;
  expires_at: string;
  created_at: string;
}
