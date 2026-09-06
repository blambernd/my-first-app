import { describe, it, expect } from "vitest";
import {
  findMileageConflicts,
  getMissingFields,
  isDraftComplete,
  type ImportDraftEntry,
} from "./scheckheft-import";

function draft(overrides: Partial<ImportDraftEntry> = {}): ImportDraftEntry {
  return {
    id: overrides.id ?? "draft-1",
    job_id: "job-1",
    service_date: "2020-01-01",
    entry_type: "inspection",
    description: null,
    mileage_km: 10000,
    workshop_name: null,
    cost_cents: null,
    next_due_date: null,
    field_origins: {},
    source_page: 1,
    status: "open",
    ...overrides,
  };
}

describe("getMissingFields", () => {
  it("meldet nichts, wenn Datum, Typ und Kilometerstand gesetzt sind", () => {
    expect(getMissingFields(draft())).toEqual([]);
    expect(isDraftComplete(draft())).toBe(true);
  });

  it("behandelt die Beschreibung NICHT als Pflichtfeld", () => {
    // Kern der PROJ-35-Entscheidung: Ein Scheckheft-Raster hat keinen Fließtext
    const entry = draft({ description: null });
    expect(getMissingFields(entry)).toEqual([]);
  });

  it("meldet fehlendes Datum, fehlenden Typ und fehlenden Kilometerstand", () => {
    const entry = draft({ service_date: null, entry_type: null, mileage_km: null });
    expect(getMissingFields(entry)).toEqual([
      "service_date",
      "entry_type",
      "mileage_km",
    ]);
    expect(isDraftComplete(entry)).toBe(false);
  });

  it("wertet den Kilometerstand 0 als vorhanden, nicht als fehlend", () => {
    expect(getMissingFields(draft({ mileage_km: 0 }))).toEqual([]);
  });
});

describe("findMileageConflicts", () => {
  it("meldet nichts bei aufsteigender Kette", () => {
    const drafts = [
      draft({ id: "a", service_date: "2020-01-01", mileage_km: 10000 }),
      draft({ id: "b", service_date: "2021-01-01", mileage_km: 20000 }),
      draft({ id: "c", service_date: "2022-01-01", mileage_km: 30000 }),
    ];
    expect(findMileageConflicts(drafts, []).size).toBe(0);
  });

  it("meldet einen Entwurf, der unter dem vorherigen Stand liegt", () => {
    const drafts = [
      draft({ id: "a", service_date: "2020-01-01", mileage_km: 10000 }),
      draft({ id: "b", service_date: "2021-01-01", mileage_km: 5000 }),
    ];
    const conflicts = findMileageConflicts(drafts, []);
    expect(conflicts.get("b")).toBe(10000);
    expect(conflicts.has("a")).toBe(false);
  });

  it("lässt einen Ausreisser NICHT die Folgekette umwerfen", () => {
    // Der wichtigste Fall: Wird 45.000 als 4.500 gelesen, darf das nicht
    // sämtliche späteren Einträge ebenfalls als Konflikt markieren.
    const drafts = [
      draft({ id: "a", service_date: "2020-01-01", mileage_km: 10000 }),
      draft({ id: "b", service_date: "2021-01-01", mileage_km: 4500 }),
      draft({ id: "c", service_date: "2022-01-01", mileage_km: 20000 }),
      draft({ id: "d", service_date: "2023-01-01", mileage_km: 30000 }),
    ];
    const conflicts = findMileageConflicts(drafts, []);
    expect(conflicts.has("b")).toBe(true);
    expect(conflicts.has("c")).toBe(false);
    expect(conflicts.has("d")).toBe(false);
    expect(conflicts.size).toBe(1);
  });

  it("prüft gegen bereits bestehende Scheckheft-Einträge", () => {
    const existing = [
      { service_date: "2019-01-01", mileage_km: 50000, is_odometer_correction: false },
    ];
    const drafts = [draft({ id: "a", service_date: "2020-01-01", mileage_km: 40000 })];
    const conflicts = findMileageConflicts(drafts, existing);
    expect(conflicts.get("a")).toBe(50000);
  });

  it("übergeht bestehende Einträge, die als Tacho-Korrektur markiert sind", () => {
    const existing = [
      { service_date: "2019-01-01", mileage_km: 50000, is_odometer_correction: true },
    ];
    const drafts = [draft({ id: "a", service_date: "2020-01-01", mileage_km: 1000 })];
    expect(findMileageConflicts(drafts, existing).size).toBe(0);
  });

  it("sortiert chronologisch, nicht nach Eingangsreihenfolge", () => {
    const drafts = [
      draft({ id: "spaet", service_date: "2022-01-01", mileage_km: 30000 }),
      draft({ id: "frueh", service_date: "2020-01-01", mileage_km: 10000 }),
    ];
    expect(findMileageConflicts(drafts, []).size).toBe(0);
  });

  it("übergeht Entwürfe ohne Datum oder ohne Kilometerstand", () => {
    const drafts = [
      draft({ id: "a", service_date: "2020-01-01", mileage_km: 10000 }),
      draft({ id: "ohne-datum", service_date: null, mileage_km: 1 }),
      draft({ id: "ohne-km", service_date: "2021-01-01", mileage_km: null }),
    ];
    expect(findMileageConflicts(drafts, []).size).toBe(0);
  });
});
