import { describe, it, expect } from "vitest";
import {
  partsSearchSchema,
  createAlertSchema,
  formatPriceCents,
  formatPrice,
} from "./parts";

describe("partsSearchSchema", () => {
  it("validates a valid search query", () => {
    const result = partsSearchSchema.safeParse({
      query: "Bremstrommel",
      condition: "all",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("Bremstrommel");
      expect(result.data.condition).toBe("all");
    }
  });

  it("rejects query shorter than 2 characters", () => {
    const result = partsSearchSchema.safeParse({ query: "B" });
    expect(result.success).toBe(false);
  });

  it("rejects query longer than 200 characters", () => {
    const result = partsSearchSchema.safeParse({ query: "A".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("defaults condition to 'all' when not provided", () => {
    const result = partsSearchSchema.safeParse({ query: "Zündkerze" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.condition).toBe("all");
    }
  });

  it("accepts valid condition values", () => {
    for (const condition of ["all", "new", "used"] as const) {
      const result = partsSearchSchema.safeParse({
        query: "Test",
        condition,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid condition values", () => {
    const result = partsSearchSchema.safeParse({
      query: "Test",
      condition: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional price filters", () => {
    const result = partsSearchSchema.safeParse({
      query: "Bremse",
      minPrice: 10,
      maxPrice: 500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minPrice).toBe(10);
      expect(result.data.maxPrice).toBe(500);
    }
  });

  it("rejects negative price values", () => {
    const result = partsSearchSchema.safeParse({
      query: "Bremse",
      minPrice: -5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for price (form empty field)", () => {
    const result = partsSearchSchema.safeParse({
      query: "Bremse",
      minPrice: "",
      maxPrice: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional platforms array", () => {
    const result = partsSearchSchema.safeParse({
      query: "Motor",
      platforms: ["ebay_kleinanzeigen", "mobile_de"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platforms).toEqual(["ebay_kleinanzeigen", "mobile_de"]);
    }
  });
});

describe("createAlertSchema", () => {
  it("validates a valid alert", () => {
    const result = createAlertSchema.safeParse({
      searchQuery: "Bremstrommel",
      condition: "all",
    });
    expect(result.success).toBe(true);
  });

  it("rejects searchQuery shorter than 2 characters", () => {
    const result = createAlertSchema.safeParse({
      searchQuery: "B",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional maxPrice", () => {
    const result = createAlertSchema.safeParse({
      searchQuery: "Zündkerze",
      maxPrice: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxPrice).toBe(50);
    }
  });

  it("accepts empty string for maxPrice", () => {
    const result = createAlertSchema.safeParse({
      searchQuery: "Zündkerze",
      maxPrice: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative maxPrice", () => {
    const result = createAlertSchema.safeParse({
      searchQuery: "Zündkerze",
      maxPrice: -10,
    });
    expect(result.success).toBe(false);
  });

  it("defaults condition to 'all'", () => {
    const result = createAlertSchema.safeParse({
      searchQuery: "Motor",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.condition).toBe("all");
    }
  });
});

describe("formatPriceCents", () => {
  it("formats cents to EUR currency string", () => {
    const result = formatPriceCents(12500);
    expect(result).toContain("125");
    expect(result).toContain("€");
  });

  it("formats zero cents", () => {
    const result = formatPriceCents(0);
    expect(result).toContain("0");
    expect(result).toContain("€");
  });

  it("formats small amounts correctly", () => {
    const result = formatPriceCents(99);
    expect(result).toContain("0,99");
  });
});

describe("formatPrice", () => {
  it("formats a price to EUR currency string", () => {
    const result = formatPrice(125);
    expect(result).toContain("125");
    expect(result).toContain("€");
  });

  it("formats decimal prices", () => {
    const result = formatPrice(49.99);
    expect(result).toContain("49,99");
  });

  it("formats zero", () => {
    const result = formatPrice(0);
    expect(result).toContain("0");
    expect(result).toContain("€");
  });
});
