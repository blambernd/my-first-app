import type { ServiceEntry, ServiceEntryType } from "./service-entry";

/** Zustand eines Import-Auftrags */
export type ImportJobStatus =
  | "queued"
  | "running"
  | "ready"
  | "completed"
  | "failed";

/** Woher der Wert eines Feldes stammt */
export type FieldOrigin = "extracted" | "empty" | "edited";

/** Zustand eines erkannten Eintrags */
export type DraftStatus = "open" | "confirmed" | "discarded";

/** Felder eines Entwurfs, die der Nutzer bearbeiten kann */
export const DRAFT_FIELDS = [
  "service_date",
  "entry_type",
  "description",
  "mileage_km",
  "workshop_name",
  "cost_cents",
  "next_due_date",
] as const;

export type DraftField = (typeof DRAFT_FIELDS)[number];

/**
 * Ein erkannter, noch nicht bestätigter Eintrag.
 *
 * Entwürfe sind ausdrücklich KEINE Scheckheft-Einträge: Sie liegen getrennt,
 * erscheinen nicht in der Historie und fliessen in keine Auswertung ein.
 */
export interface ImportDraftEntry {
  id: string;
  job_id: string;
  service_date: string | null;
  entry_type: ServiceEntryType | null;
  description: string | null;
  mileage_km: number | null;
  workshop_name: string | null;
  cost_cents: number | null;
  next_due_date: string | null;
  /** Herkunft je Feld — steuert die Kennzeichnung in der Prüfansicht */
  field_origins: Partial<Record<DraftField, FieldOrigin>>;
  /** Auf welcher hochgeladenen Seite die Angabe steht (1-basiert) */
  source_page: number | null;
  status: DraftStatus;
}

export interface ImportJobDocument {
  id: string;
  file_name: string;
  storage_path: string;
  page_number: number;
}

export interface ImportJob {
  id: string;
  vehicle_id: string;
  status: ImportJobStatus;
  page_count: number;
  /** Verständlicher Grund bei status === "failed" */
  error_reason: string | null;
  created_at: string;
  completed_at: string | null;
  documents: ImportJobDocument[];
  drafts: ImportDraftEntry[];
}

/** Kontingent je Fahrzeug */
export interface ImportQuota {
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Vorläufige Obergrenze je Fahrzeug.
 *
 * ACHTUNG: Die Höhe des Kontingents ist laut Spec eine offene Entscheidung.
 * Dieser Wert ist ein Platzhalter, damit die Oberfläche etwas anzeigen kann —
 * er ist KEINE getroffene Festlegung und gehört vor der Auslieferung ersetzt.
 */
export const PROVISIONAL_IMPORT_LIMIT_PER_VEHICLE = 30;

/** Pflichtfelder, ohne die ein Entwurf nicht übernommen werden kann. */
export const REQUIRED_DRAFT_FIELDS = [
  "service_date",
  "entry_type",
  "mileage_km",
] as const satisfies readonly DraftField[];

/** Welche Pflichtfelder eines Entwurfs noch leer sind. */
export function getMissingFields(draft: ImportDraftEntry): DraftField[] {
  return REQUIRED_DRAFT_FIELDS.filter((field) => {
    const value = draft[field];
    return value === null || value === undefined || value === "";
  });
}

export function isDraftComplete(draft: ImportDraftEntry): boolean {
  return getMissingFields(draft).length === 0;
}

interface ChainItem {
  /** Entwurfs-ID; null für bereits bestehende Scheckheft-Einträge */
  draftId: string | null;
  service_date: string;
  mileage_km: number;
}

/**
 * Prüft die Kilometer-Kette über bestehende Einträge UND ausgewählte Entwürfe
 * hinweg (PROJ-3: der Stand muss mindestens dem des vorherigen Eintrags
 * entsprechen).
 *
 * Gibt die IDs der Entwürfe zurück, die die Kette brechen — samt dem
 * Kilometerstand, der davor liegt.
 */
export function findMileageConflicts(
  drafts: ImportDraftEntry[],
  existingEntries: Pick<ServiceEntry, "service_date" | "mileage_km" | "is_odometer_correction">[]
): Map<string, number> {
  const items: ChainItem[] = [];

  for (const entry of existingEntries) {
    // Als Tacho-Korrektur markierte Einträge unterbrechen die Kette bewusst
    if (entry.is_odometer_correction) continue;
    items.push({
      draftId: null,
      service_date: entry.service_date,
      mileage_km: entry.mileage_km,
    });
  }

  for (const draft of drafts) {
    if (!draft.service_date || draft.mileage_km === null) continue;
    items.push({
      draftId: draft.id,
      service_date: draft.service_date,
      mileage_km: draft.mileage_km,
    });
  }

  items.sort((a, b) => a.service_date.localeCompare(b.service_date));

  const conflicts = new Map<string, number>();
  let highest: number | null = null;

  for (const item of items) {
    if (highest !== null && item.mileage_km < highest) {
      if (item.draftId) conflicts.set(item.draftId, highest);
      // Der Ausreisser wird nicht zur neuen Messlatte — sonst kippt die
      // gesamte Folgekette wegen eines einzigen Lesefehlers.
      continue;
    }
    highest = item.mileage_km;
  }

  return conflicts;
}

/** Anzeigetext für einen fehlgeschlagenen Auftrag, falls der Server keinen liefert. */
export const IMPORT_FALLBACK_ERROR =
  "Die Auswertung ist fehlgeschlagen. Bitte versuche es mit einer schärferen Aufnahme noch einmal.";
