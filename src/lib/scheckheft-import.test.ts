import { describe, it, expect } from "vitest";
import {
  buildFieldOrigins,
  sanitizeCents,
  sanitizeDate,
  sanitizeMileage,
  sanitizeText,
  type ExtractedEntry,
} from "./scheckheft-import";

function extracted(overrides: Partial<ExtractedEntry> = {}): ExtractedEntry {
  return {
    service_date: null,
    entry_type: null,
    description: null,
    mileage_km: null,
    workshop_name: null,
    cost_cents: null,
    next_due_date: null,
    ...overrides,
  };
}

describe("sanitizeDate", () => {
  it("übernimmt ein gültiges Datum unverändert", () => {
    expect(sanitizeDate("2020-03-12")).toBe("2020-03-12");
  });

  it("verwirft deutsches Format statt es umzurechnen", () => {
    expect(sanitizeDate("12.03.2020")).toBeNull();
  });

  it("verwirft unmögliche Daten", () => {
    expect(sanitizeDate("2020-13-45")).toBeNull();
  });

  it("verwirft ein Datum ohne Jahr", () => {
    // Kommt bei Stempeln vor ("12.03.") — ergänzen wäre Raten
    expect(sanitizeDate("03-12")).toBeNull();
  });

  it("gibt null für null zurück", () => {
    expect(sanitizeDate(null)).toBeNull();
  });
});

describe("sanitizeMileage", () => {
  it("rundet Kommastellen", () => {
    expect(sanitizeMileage(82499.6)).toBe(82500);
  });

  it("verwirft negative Werte", () => {
    expect(sanitizeMileage(-5)).toBeNull();
  });

  it("verwirft Werte über der Datenbankgrenze", () => {
    expect(sanitizeMileage(10000000)).toBeNull();
  });

  it("lässt 0 zu", () => {
    expect(sanitizeMileage(0)).toBe(0);
  });
});

describe("sanitizeCents", () => {
  it("verwirft negative Beträge", () => {
    expect(sanitizeCents(-1)).toBeNull();
  });

  it("rundet auf ganze Cent", () => {
    expect(sanitizeCents(1234.7)).toBe(1235);
  });
});

describe("sanitizeText", () => {
  it("entfernt umgebende Leerzeichen", () => {
    expect(sanitizeText("  Müller AG  ", 200)).toBe("Müller AG");
  });

  it("macht aus reinem Leerraum null", () => {
    expect(sanitizeText("   ", 200)).toBeNull();
  });

  it("kürzt statt die Datenbankprüfung auflaufen zu lassen", () => {
    expect(sanitizeText("x".repeat(300), 200)).toHaveLength(200);
  });
});

describe("buildFieldOrigins", () => {
  it("kennzeichnet gelesene Werte als extracted", () => {
    const origins = buildFieldOrigins(
      extracted({ service_date: "2020-01-01", mileage_km: 12000 })
    );
    expect(origins.service_date).toBe("extracted");
    expect(origins.mileage_km).toBe("extracted");
  });

  it("kennzeichnet fehlende Werte als empty", () => {
    const origins = buildFieldOrigins(extracted());
    expect(origins.description).toBe("empty");
    expect(origins.workshop_name).toBe("empty");
    expect(origins.cost_cents).toBe("empty");
  });

  it("deckt alle sieben Felder ab", () => {
    expect(Object.keys(buildFieldOrigins(extracted()))).toHaveLength(7);
  });
});
