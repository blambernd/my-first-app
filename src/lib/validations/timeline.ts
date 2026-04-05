import type { ServiceEntry, ServiceEntryType } from "./service-entry";
import type { VehicleDocument, DocumentCategory } from "./vehicle-document";
import type { VehicleMilestone } from "./milestone";

export type TimelineSourceType = "service" | "document" | "milestone";

export interface TimelineEntry {
  id: string;
  date: string;
  sourceType: TimelineSourceType;
  title: string;
  description: string | null;
  // Service-specific
  entryType?: ServiceEntryType;
  mileageKm?: number;
  costCents?: number | null;
  workshopName?: string | null;
  isOdometerCorrection?: boolean;
  // Document-specific
  documentCategory?: DocumentCategory;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  storagePath?: string;
  // Milestone-specific
  photoPath?: string | null;
  // Timestamps
  createdAt: string;
}

export function serviceEntryToTimeline(entry: ServiceEntry): TimelineEntry {
  return {
    id: `service-${entry.id}`,
    date: entry.service_date,
    sourceType: "service",
    title: entry.description,
    description: entry.notes,
    entryType: entry.entry_type,
    mileageKm: entry.mileage_km,
    costCents: entry.cost_cents,
    workshopName: entry.workshop_name,
    isOdometerCorrection: entry.is_odometer_correction,
    createdAt: entry.created_at,
  };
}

export function documentToTimeline(doc: VehicleDocument): TimelineEntry {
  return {
    id: `document-${doc.id}`,
    date: doc.document_date,
    sourceType: "document",
    title: doc.title,
    description: doc.description,
    documentCategory: doc.category,
    fileName: doc.file_name,
    fileSize: doc.file_size,
    mimeType: doc.mime_type,
    storagePath: doc.storage_path,
    createdAt: doc.created_at,
  };
}

export function milestoneToTimeline(ms: VehicleMilestone): TimelineEntry {
  return {
    id: `milestone-${ms.id}`,
    date: ms.milestone_date,
    sourceType: "milestone",
    title: ms.title,
    description: ms.description,
    photoPath: ms.photo_path,
    createdAt: ms.created_at,
  };
}

export function aggregateTimeline(
  serviceEntries: ServiceEntry[],
  documents: VehicleDocument[],
  milestones: VehicleMilestone[]
): TimelineEntry[] {
  const all: TimelineEntry[] = [
    ...serviceEntries.map(serviceEntryToTimeline),
    ...documents.map(documentToTimeline),
    ...milestones.map(milestoneToTimeline),
  ];

  // Sort by date descending, then by createdAt descending
  return all.sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function groupByDate(
  entries: TimelineEntry[]
): Map<string, TimelineEntry[]> {
  const groups = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    const existing = groups.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(entry.date, [entry]);
    }
  }
  return groups;
}
