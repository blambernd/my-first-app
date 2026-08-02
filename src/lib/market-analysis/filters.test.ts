import { describe, it, expect } from "vitest";
import { hasForeignCurrency } from "./filters";

describe("hasForeignCurrency — BUG-2 (PROJ-29)", () => {
  it("erkennt den Schweizer-Franken-Fall aus dem Live-Lauf", () => {
    // Stand mit 76.200 EURO in der Auswertung
    expect(
      hasForeignCurrency("Mercedes-Benz 220 Cabriolet A (1954) angeboten für CHF 76.200")
    ).toBe(true);
  });

  it("erkennt weitere Fremdwährungen", () => {
    expect(hasForeignCurrency("offered for USD 120,000")).toBe(true);
    expect(hasForeignCurrency("Price £45,000")).toBe(true);
    expect(hasForeignCurrency("$89,500 OBO")).toBe(true);
  });

  it("lässt Euro-Angaben durch", () => {
    expect(hasForeignCurrency("angeboten für 81.900 €")).toBe(false);
    expect(hasForeignCurrency("Preis: EUR 81.900")).toBe(false);
  });

  it("verwirft auch gemischte Angaben", () => {
    // Welcher Betrag der Preis ist, lässt sich aus einem Suchtreffer nicht entscheiden
    expect(hasForeignCurrency("81.900 € / CHF 76.200")).toBe(true);
  });
});
