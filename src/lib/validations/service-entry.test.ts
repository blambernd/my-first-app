import { describe, it, expect } from "vitest";
import {
  serviceEntrySchema,
  formatCentsToEur,
  eurToCents,
  getEntryTypeLabel,
  SERVICE_ENTRY_TYPES,
} from "./service-entry";

const validEntry = {
  service_date: "2025-01-15",
  entry_type: "inspection",
  description: "Große Inspektion durchgeführt",
  mileage_km: 85000,
  is_odometer_correction: false,
};

describe("serviceEntrySchema — required fields", () => {
  it("accepts valid required fields", () => {
    const result = serviceEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("rejects missing service_date", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, service_date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing entry_type", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, entry_type: undefined });
    expect(result.success).toBe(false);
  });
});

describe("serviceEntrySchema — entry_type enum", () => {
  const validTypes = ["inspection", "oil_change", "repair", "tuv_hu", "restoration", "other"];

  it.each(validTypes)("accepts type '%s'", (type) => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, entry_type: type });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, entry_type: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("serviceEntrySchema — description", () => {
  it("accepts description at max length (2000)", () => {
    const result = serviceEntrySchema.safeParse({
      ...validEntry,
      description: "a".repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects description over 2000 characters", () => {
    const result = serviceEntrySchema.safeParse({
      ...validEntry,
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("serviceEntrySchema — mileage_km", () => {
  it("accepts mileage of 0", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, mileage_km: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts max mileage 9999999", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, mileage_km: 9999999 });
    expect(result.success).toBe(true);
  });

  it("rejects negative mileage", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, mileage_km: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects mileage over 9999999", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, mileage_km: 10000000 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer mileage", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, mileage_km: 85000.5 });
    expect(result.success).toBe(false);
  });

  it("coerces string mileage to number", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, mileage_km: "85000" });
    expect(result.success).toBe(true);
  });
});

describe("serviceEntrySchema — optional fields", () => {
  it("accepts all optional fields filled", () => {
    const result = serviceEntrySchema.safeParse({
      ...validEntry,
      cost_cents: 14990,
      workshop_name: "Klassik Werkstatt München",
      notes: "Alles in Ordnung",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for optional fields (form default)", () => {
    const result = serviceEntrySchema.safeParse({
      ...validEntry,
      cost_cents: "",
      workshop_name: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts undefined for optional fields", () => {
    const result = serviceEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("rejects negative cost", () => {
    const result = serviceEntrySchema.safeParse({ ...validEntry, cost_cents: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects workshop_name over 200 characters", () => {
    const result = serviceEntrySchema.safeParse({
      ...validEntry,
      workshop_name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes over 2000 characters", () => {
    const result = serviceEntrySchema.safeParse({
      ...validEntry,
      notes: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("serviceEntrySchema — is_odometer_correction", () => {
  it("defaults to false", () => {
    const { is_odometer_correction, ...withoutFlag } = validEntry;
    const result = serviceEntrySchema.safeParse(withoutFlag);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_odometer_correction).toBe(false);
    }
  });

  it("accepts true value", () => {
    const result = serviceEntrySchema.safeParse({
      ...validEntry,
      is_odometer_correction: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("formatCentsToEur", () => {
  it("formats 14990 cents as EUR currency string", () => {
    const result = formatCentsToEur(14990);
    expect(result).toContain("149,90");
    expect(result).toContain("€");
  });

  it("formats 0 cents", () => {
    const result = formatCentsToEur(0);
    expect(result).toContain("0,00");
  });

  it("formats 1 cent", () => {
    const result = formatCentsToEur(1);
    expect(result).toContain("0,01");
  });
});

describe("eurToCents", () => {
  it("converts 149.90 EUR to 14990 cents", () => {
    expect(eurToCents(149.9)).toBe(14990);
  });

  it("converts 0 EUR to 0 cents", () => {
    expect(eurToCents(0)).toBe(0);
  });

  it("rounds correctly for floating point issues", () => {
    // 19.99 * 100 = 1998.9999... without rounding
    expect(eurToCents(19.99)).toBe(1999);
  });
});

describe("getEntryTypeLabel", () => {
  it("returns correct label for each type", () => {
    expect(getEntryTypeLabel("inspection")).toBe("Inspektion");
    expect(getEntryTypeLabel("oil_change")).toBe("Ölwechsel");
    expect(getEntryTypeLabel("repair")).toBe("Reparatur");
    expect(getEntryTypeLabel("tuv_hu")).toBe("TÜV/HU");
    expect(getEntryTypeLabel("restoration")).toBe("Restaurierung");
    expect(getEntryTypeLabel("other")).toBe("Sonstiges");
  });

  it("returns raw type for unknown type", () => {
    expect(getEntryTypeLabel("unknown" as never)).toBe("unknown");
  });
});

describe("SERVICE_ENTRY_TYPES constant", () => {
  it("has 6 entry types", () => {
    expect(SERVICE_ENTRY_TYPES).toHaveLength(6);
  });

  it("each type has value and label", () => {
    SERVICE_ENTRY_TYPES.forEach((type) => {
      expect(type).toHaveProperty("value");
      expect(type).toHaveProperty("label");
      expect(type.value.length).toBeGreaterThan(0);
      expect(type.label.length).toBeGreaterThan(0);
    });
  });
});
