import { z } from "zod";

export const TRANSFER_STATUSES = ["offen", "angenommen", "abgelehnt", "abgebrochen"] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  offen: "Ausstehend",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
  abgebrochen: "Abgebrochen",
};

export const transferSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail ist erforderlich")
    .email("Ungültige E-Mail-Adresse"),
  keepAsViewer: z.boolean().default(true),
});

export type TransferFormData = z.infer<typeof transferSchema>;

export interface VehicleTransfer {
  id: string;
  vehicle_id: string;
  from_user_id: string;
  to_email: string;
  token: string;
  keep_as_viewer: boolean;
  status: TransferStatus;
  expires_at: string;
  created_at: string;
}
