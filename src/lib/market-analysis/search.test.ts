import { describe, it, expect } from "vitest";

// We test the price parsing logic by importing the module and calling parsePrice indirectly.
// Since parsePrice is not exported, we test it through the public API behavior.
// However, we CAN test the exported searchMarketListings with mocked serpapi.

// For now, test the price parsing patterns directly (extracted for testability):
// We'll test via regex patterns matching the same logic used in search.ts

const PRICE_PATTERNS = [
  /(\d{1,3}(?:\.\d{3})+)\s*€/,
  /€\s*(\d{1,3}(?:\.\d{3})+)/,
  /EUR\s*(\d{1,3}(?:\.\d{3})+)/,
  /(\d{4,7})\s*€/,
  /€\s*(\d{4,7})/,
  /EUR\s*(\d{4,7})/,
  /Preis[:\s]*(\d{1,3}(?:\.\d{3})+)/i,
  /VB\s*(\d{1,3}(?:\.\d{3})+)/i,
];

function parsePrice(text: string): number | null {
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/\./g, "");
      const price = parseInt(priceStr, 10);
      if (!isNaN(price) && price >= 500 && price <= 5_000_000) {
        return price;
      }
    }
  }
  return null;
}

describe("parsePrice", () => {
  it("parses German format: 25.000 €", () => {
    expect(parsePrice("Mercedes W123 - 25.000 €")).toBe(25000);
  });

  it("parses German format: €25.000", () => {
    expect(parsePrice("€25.000 - Mercedes W123")).toBe(25000);
  });

  it("parses EUR prefix: EUR 25.000", () => {
    expect(parsePrice("EUR 25.000 VB")).toBe(25000);
  });

  it("parses plain number: 25000€", () => {
    expect(parsePrice("Preis: 25000€")).toBe(25000);
  });

  it("parses VB format", () => {
    expect(parsePrice("VB 25.000")).toBe(25000);
  });

  it("parses Preis format", () => {
    expect(parsePrice("Preis: 18.500")).toBe(18500);
  });

  it("parses large prices: 150.000 €", () => {
    expect(parsePrice("Ferrari 250 GTO - 150.000 €")).toBe(150000);
  });

  it("rejects prices below 500 (likely parts, not vehicles)", () => {
    expect(parsePrice("Türgriff 25 €")).toBeNull();
    expect(parsePrice("Spiegel 150€")).toBeNull();
  });

  it("rejects prices above 5,000,000", () => {
    expect(parsePrice("10.000.000 €")).toBeNull();
  });

  it("returns null when no price found", () => {
    expect(parsePrice("Mercedes W123 zu verkaufen")).toBeNull();
    expect(parsePrice("")).toBeNull();
  });

  it("picks first valid price in text", () => {
    expect(parsePrice("15.000 € - 20.000 €")).toBe(15000);
  });
});
