import { describe, it, expect } from "vitest";
import {
  milestoneSchema,
  MILESTONE_CATEGORIES,
  CATEGORY_CONFIG,
  getCategoryLabel,
} from "./milestone";

describe("milestoneSchema", () => {
  it("accepts valid milestone data with category", () => {
    const result = milestoneSchema.safeParse({
      category: "kauf",
      milestone_date: "2024-06-15",
      title: "Kauf des Fahrzeugs",
    });
    expect(result.success).toBe(true);
  });

  it("accepts milestone with description", () => {
    const result = milestoneSchema.safeParse({
      category: "erstzulassung",
      milestone_date: "2024-06-15",
      title: "Erstzulassung",
      description: "Beim Straßenverkehrsamt Musterstadt",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string description", () => {
    const result = milestoneSchema.safeParse({
      category: "lackierung",
      milestone_date: "2024-06-15",
      title: "Lackierung",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing category", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "2024-06-15",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = milestoneSchema.safeParse({
      category: "tuev",
      milestone_date: "2024-06-15",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    for (const cat of MILESTONE_CATEGORIES) {
      const result = milestoneSchema.safeParse({
        category: cat,
        milestone_date: "2024-06-15",
        title: "Test",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing date", () => {
    const result = milestoneSchema.safeParse({
      category: "sonstiges",
      milestone_date: "",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing title", () => {
    const result = milestoneSchema.safeParse({
      category: "sonstiges",
      milestone_date: "2024-06-15",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 200 characters", () => {
    const result = milestoneSchema.safeParse({
      category: "sonstiges",
      milestone_date: "2024-06-15",
      title: "A".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts title exactly 200 characters", () => {
    const result = milestoneSchema.safeParse({
      category: "sonstiges",
      milestone_date: "2024-06-15",
      title: "A".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("rejects description longer than 2000 characters", () => {
    const result = milestoneSchema.safeParse({
      category: "restauration",
      milestone_date: "2024-06-15",
      title: "Test",
      description: "B".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts description exactly 2000 characters", () => {
    const result = milestoneSchema.safeParse({
      category: "restauration",
      milestone_date: "2024-06-15",
      title: "Test",
      description: "B".repeat(2000),
    });
    expect(result.success).toBe(true);
  });
});

describe("MILESTONE_CATEGORIES", () => {
  it("has 9 categories", () => {
    expect(MILESTONE_CATEGORIES).toHaveLength(9);
  });

  it("every category has a config entry", () => {
    for (const cat of MILESTONE_CATEGORIES) {
      expect(CATEGORY_CONFIG[cat]).toBeDefined();
      expect(CATEGORY_CONFIG[cat].label).toBeTruthy();
      expect(CATEGORY_CONFIG[cat].color).toBeTruthy();
    }
  });
});

describe("getCategoryLabel", () => {
  it("returns label for valid category", () => {
    expect(getCategoryLabel("erstzulassung")).toBe("Erstzulassung");
    expect(getCategoryLabel("kauf")).toBe("Kauf / Besitzerwechsel");
    expect(getCategoryLabel("restauration")).toBe("Restauration");
    expect(getCategoryLabel("unfall")).toBe("Unfall / Schaden");
    expect(getCategoryLabel("trophaee")).toBe("Trophäe / Auszeichnung");
    expect(getCategoryLabel("lackierung")).toBe("Lackierung");
    expect(getCategoryLabel("umbau")).toBe("Umbau / Tuning");
    expect(getCategoryLabel("sonstiges")).toBe("Sonstiges");
  });

  it("returns raw string for unknown category", () => {
    expect(getCategoryLabel("unknown")).toBe("unknown");
  });
});
