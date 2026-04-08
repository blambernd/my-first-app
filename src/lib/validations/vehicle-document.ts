import { z } from "zod";

export const DOCUMENT_CATEGORIES = [
  { value: "rechnung", label: "Rechnung" },
  { value: "gutachten", label: "Gutachten" },
  { value: "tuev_bericht", label: "TÜV-Bericht" },
  { value: "kaufvertrag", label: "Kaufvertrag" },
  { value: "versicherung", label: "Versicherung" },
  { value: "zulassung", label: "Zulassung" },
  { value: "sonstiges", label: "Sonstiges" },
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]["value"];

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_EXTENSIONS = ".pdf, .jpg, .jpeg, .png, .webp";
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DOCUMENT_SIZE_MB = 10;

export const vehicleDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(200, "Titel darf maximal 200 Zeichen lang sein"),
  category: z.enum(
    ["rechnung", "gutachten", "tuev_bericht", "kaufvertrag", "versicherung", "zulassung", "sonstiges"],
    { error: "Bitte wähle eine Kategorie" }
  ),
  document_date: z.string().min(1, "Datum ist erforderlich"),
  description: z
    .string()
    .max(1000, "Beschreibung darf maximal 1000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  service_entry_id: z.string().optional().or(z.literal("")),
});

export interface VehicleDocumentFormData {
  title: string;
  category: DocumentCategory;
  document_date: string;
  description?: string;
  service_entry_id?: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  title: string;
  category: DocumentCategory;
  document_date: string;
  description: string | null;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  service_entry_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function getCategoryLabel(category: DocumentCategory): string {
  return DOCUMENT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}
