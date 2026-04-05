import { describe, it, expect } from "vitest";
import { milestoneSchema } from "./milestone";

describe("milestoneSchema", () => {
  it("accepts valid milestone data", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "2024-06-15",
      title: "Kauf des Fahrzeugs",
    });
    expect(result.success).toBe(true);
  });

  it("accepts milestone with description", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "2024-06-15",
      title: "Erstzulassung",
      description: "Beim Straßenverkehrsamt Musterstadt",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string description", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "2024-06-15",
      title: "Lackierung",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing date", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing title", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "2024-06-15",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 200 characters", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "2024-06-15",
      title: "A".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts title exactly 200 characters", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "2024-06-15",
      title: "A".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("rejects description longer than 1000 characters", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "2024-06-15",
      title: "Test",
      description: "B".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts description exactly 1000 characters", () => {
    const result = milestoneSchema.safeParse({
      milestone_date: "2024-06-15",
      title: "Test",
      description: "B".repeat(1000),
    });
    expect(result.success).toBe(true);
  });
});
