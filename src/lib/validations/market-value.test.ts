import { describe, it, expect } from "vitest";
import {
  marketValueSchema,
  parseEuroToCents,
  MAX_MARKET_VALUE_CENTS,
} from "./market-value";

/**
 * Der selbst eingetragene Marktwert ist seit dem Aussetzen der Marktanalyse
 * die einzige Bezugsgröße der Wertentwicklung. Ein Tippfehler hier verschiebt
 * die gesamte Bilanz.
 */

describe("parseEuroToCents", () => {
  it("versteht die deutsche Schreibweise mit Tausenderpunkt", () => {
    expect(parseEuroToCents("18.500")).toBe(1_850_000);
  });

  it("versteht Nachkommastellen mit Komma", () => {
    expect(parseEuroToCents("18500,50")).toBe(1_850_050);
  });

  it("versteht die reine Zahl", () => {
    expect(parseEuroToCents("18500")).toBe(1_850_000);
  });

  it("rundet auf ganze Cent", () => {
    expect(parseEuroToCents("0,014")).toBe(1);
  });
});

describe("marketValueSchema", () => {
  const basis = { valued_on: "2026-08-02" };

  it("nimmt eine gültige Eingabe an", () => {
    const result = marketValueSchema.safeParse({
      ...basis,
      value_eur: "18.500",
      note: "Gutachten Classic Data",
    });
    expect(result.success).toBe(true);
  });

  it("erlaubt den Vermerk wegzulassen", () => {
    expect(
      marketValueSchema.safeParse({ ...basis, value_eur: "18500" }).success
    ).toBe(true);
    expect(
      marketValueSchema.safeParse({ ...basis, value_eur: "18500", note: "" })
        .success
    ).toBe(true);
  });

  it("weist null und negative Beträge ab", () => {
    expect(
      marketValueSchema.safeParse({ ...basis, value_eur: "0" }).success
    ).toBe(false);
    expect(
      marketValueSchema.safeParse({ ...basis, value_eur: "-500" }).success
    ).toBe(false);
  });

  it("weist einen leeren Betrag ab", () => {
    expect(
      marketValueSchema.safeParse({ ...basis, value_eur: "" }).success
    ).toBe(false);
  });

  it("weist Text ab", () => {
    expect(
      marketValueSchema.safeParse({ ...basis, value_eur: "teuer" }).success
    ).toBe(false);
  });

  it("weist unrealistisch hohe Beträge ab", () => {
    // Ein verrutschtes Komma darf die Bilanz nicht sprengen
    const zuHoch = String(MAX_MARKET_VALUE_CENTS / 100 + 1);
    expect(
      marketValueSchema.safeParse({ ...basis, value_eur: zuHoch }).success
    ).toBe(false);
  });

  it("verlangt ein Datum", () => {
    expect(
      marketValueSchema.safeParse({ value_eur: "18500", valued_on: "" }).success
    ).toBe(false);
  });

  it("begrenzt die Länge des Vermerks", () => {
    expect(
      marketValueSchema.safeParse({
        ...basis,
        value_eur: "18500",
        note: "A".repeat(501),
      }).success
    ).toBe(false);
  });
});
