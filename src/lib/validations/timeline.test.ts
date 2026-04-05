import { describe, it, expect } from "vitest";
import {
  serviceEntryToTimeline,
  documentToTimeline,
  milestoneToTimeline,
  aggregateTimeline,
  groupByDate,
} from "./timeline";
import type { ServiceEntry } from "./service-entry";
import type { VehicleDocument } from "./vehicle-document";
import type { VehicleMilestone } from "./milestone";

const makeServiceEntry = (overrides: Partial<ServiceEntry> = {}): ServiceEntry => ({
  id: "se-1",
  vehicle_id: "v-1",
  entry_type: "maintenance",
  service_date: "2024-06-15",
  description: "Ölwechsel",
  mileage_km: 45000,
  cost_cents: 15000,
  workshop_name: "Meister KFZ",
  notes: "Castrol Edge 5W-30",
  is_odometer_correction: false,
  created_at: "2024-06-15T10:00:00Z",
  updated_at: "2024-06-15T10:00:00Z",
  ...overrides,
});

const makeDocument = (overrides: Partial<VehicleDocument> = {}): VehicleDocument => ({
  id: "doc-1",
  vehicle_id: "v-1",
  title: "TÜV Bericht",
  description: "Keine Mängel",
  category: "tuev_bericht",
  document_date: "2024-07-01",
  file_name: "tuev_2024.pdf",
  file_size: 524288,
  mime_type: "application/pdf",
  storage_path: "user1/v-1/tuev.pdf",
  service_entry_id: null,
  created_at: "2024-07-01T09:00:00Z",
  updated_at: "2024-07-01T09:00:00Z",
  ...overrides,
});

const makeMilestone = (overrides: Partial<VehicleMilestone> = {}): VehicleMilestone => ({
  id: "ms-1",
  vehicle_id: "v-1",
  milestone_date: "2024-01-10",
  title: "Kauf",
  description: "Beim Händler in Stuttgart",
  photo_path: null,
  created_at: "2024-01-10T08:00:00Z",
  updated_at: "2024-01-10T08:00:00Z",
  ...overrides,
});

describe("serviceEntryToTimeline", () => {
  it("converts service entry to timeline entry", () => {
    const entry = makeServiceEntry();
    const result = serviceEntryToTimeline(entry);

    expect(result.id).toBe("service-se-1");
    expect(result.sourceType).toBe("service");
    expect(result.date).toBe("2024-06-15");
    expect(result.title).toBe("Ölwechsel");
    expect(result.description).toBe("Castrol Edge 5W-30");
    expect(result.entryType).toBe("maintenance");
    expect(result.mileageKm).toBe(45000);
    expect(result.costCents).toBe(15000);
    expect(result.workshopName).toBe("Meister KFZ");
  });
});

describe("documentToTimeline", () => {
  it("converts document to timeline entry", () => {
    const doc = makeDocument();
    const result = documentToTimeline(doc);

    expect(result.id).toBe("document-doc-1");
    expect(result.sourceType).toBe("document");
    expect(result.date).toBe("2024-07-01");
    expect(result.title).toBe("TÜV Bericht");
    expect(result.documentCategory).toBe("tuev_bericht");
    expect(result.fileName).toBe("tuev_2024.pdf");
    expect(result.fileSize).toBe(524288);
  });
});

describe("milestoneToTimeline", () => {
  it("converts milestone to timeline entry", () => {
    const ms = makeMilestone();
    const result = milestoneToTimeline(ms);

    expect(result.id).toBe("milestone-ms-1");
    expect(result.sourceType).toBe("milestone");
    expect(result.date).toBe("2024-01-10");
    expect(result.title).toBe("Kauf");
    expect(result.description).toBe("Beim Händler in Stuttgart");
    expect(result.photoPath).toBeNull();
  });

  it("includes photo path when present", () => {
    const ms = makeMilestone({ photo_path: "user1/v-1/milestones/photo.jpg" });
    const result = milestoneToTimeline(ms);
    expect(result.photoPath).toBe("user1/v-1/milestones/photo.jpg");
  });
});

describe("aggregateTimeline", () => {
  it("merges all three sources and sorts by date descending", () => {
    const services = [makeServiceEntry({ service_date: "2024-06-15" })];
    const docs = [makeDocument({ document_date: "2024-07-01" })];
    const milestones = [makeMilestone({ milestone_date: "2024-01-10" })];

    const result = aggregateTimeline(services, docs, milestones);

    expect(result).toHaveLength(3);
    expect(result[0].sourceType).toBe("document"); // Jul
    expect(result[1].sourceType).toBe("service"); // Jun
    expect(result[2].sourceType).toBe("milestone"); // Jan
  });

  it("sorts by createdAt when dates are the same", () => {
    const services = [
      makeServiceEntry({
        id: "se-1",
        service_date: "2024-06-15",
        created_at: "2024-06-15T08:00:00Z",
      }),
    ];
    const docs = [
      makeDocument({
        id: "doc-1",
        document_date: "2024-06-15",
        created_at: "2024-06-15T14:00:00Z",
      }),
    ];

    const result = aggregateTimeline(services, docs, []);

    expect(result[0].sourceType).toBe("document"); // later createdAt
    expect(result[1].sourceType).toBe("service");
  });

  it("handles empty inputs", () => {
    const result = aggregateTimeline([], [], []);
    expect(result).toHaveLength(0);
  });

  it("handles single source", () => {
    const result = aggregateTimeline([makeServiceEntry()], [], []);
    expect(result).toHaveLength(1);
    expect(result[0].sourceType).toBe("service");
  });
});

describe("groupByDate", () => {
  it("groups entries by date preserving order", () => {
    const services = [
      makeServiceEntry({ id: "se-1", service_date: "2024-06-15", created_at: "2024-06-15T10:00:00Z" }),
      makeServiceEntry({ id: "se-2", service_date: "2024-06-15", created_at: "2024-06-15T08:00:00Z" }),
    ];
    const docs = [makeDocument({ document_date: "2024-07-01" })];

    const sorted = aggregateTimeline(services, docs, []);
    const groups = groupByDate(sorted);

    expect(groups.size).toBe(2);

    const julyGroup = groups.get("2024-07-01");
    expect(julyGroup).toHaveLength(1);

    const juneGroup = groups.get("2024-06-15");
    expect(juneGroup).toHaveLength(2);
  });

  it("returns empty map for empty input", () => {
    const result = groupByDate([]);
    expect(result.size).toBe(0);
  });

  it("preserves order within date groups", () => {
    const services = [
      makeServiceEntry({ id: "se-1", service_date: "2024-06-15", created_at: "2024-06-15T14:00:00Z" }),
      makeServiceEntry({ id: "se-2", service_date: "2024-06-15", created_at: "2024-06-15T08:00:00Z" }),
    ];
    const sorted = aggregateTimeline(services, [], []);
    const groups = groupByDate(sorted);
    const juneGroup = groups.get("2024-06-15")!;

    // se-1 has later createdAt, so it should come first (desc sort)
    expect(juneGroup[0].id).toBe("service-se-1");
    expect(juneGroup[1].id).toBe("service-se-2");
  });
});
