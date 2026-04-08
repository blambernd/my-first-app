// @vitest-environment node
import { describe, it, expect } from "vitest";
import { isSparePartListing, parsePrice, isPricePlausible, matchesFactoryCode } from "./filters";

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

  it("rejects prices below 1.000 (likely parts, not vehicles)", () => {
    expect(parsePrice("Türgriff 25 €")).toBeNull();
    expect(parsePrice("Spiegel 150€")).toBeNull();
    expect(parsePrice("Bremse 500€")).toBeNull();
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

describe("isSparePartListing", () => {
  it("detects obvious spare parts listings", () => {
    expect(isSparePartListing("Mercedes W123 Motorhaube")).toBe(true);
    expect(isSparePartListing("BMW E30 Stoßstange vorne")).toBe(true);
    expect(isSparePartListing("Porsche 911 Scheinwerfer links")).toBe(true);
    expect(isSparePartListing("VW Käfer Kotflügel")).toBe(true);
    expect(isSparePartListing("Ersatzteile Mercedes W123")).toBe(true);
  });

  it("detects parts via snippet when title is clean", () => {
    expect(isSparePartListing("Mercedes W123", "Ersatzteil für W123")).toBe(true);
  });

  it("detects model cars and collectibles", () => {
    expect(isSparePartListing("Mercedes 300SL Modell 1:18")).toBe(true);
    expect(isSparePartListing("BMW 2002 Modellauto Minichamps")).toBe(true);
  });

  it("detects 'für [Make]' pattern (parts listings)", () => {
    expect(isSparePartListing("Bremsscheibe für Mercedes W123")).toBe(true);
    expect(isSparePartListing("Ölfilter passend für BMW E30")).toBe(true);
  });

  it("allows actual vehicle listings", () => {
    expect(isSparePartListing("Mercedes-Benz 280 SL W113 Pagode")).toBe(false);
    expect(isSparePartListing("BMW 2002 tii Baujahr 1973")).toBe(false);
    expect(isSparePartListing("Porsche 911 Carrera Coupé 1985")).toBe(false);
    expect(isSparePartListing("VW Käfer 1303 Cabriolet")).toBe(false);
  });

  it("detects workshop manuals and literature", () => {
    expect(isSparePartListing("Werkstatthandbuch Mercedes W123")).toBe(true);
    expect(isSparePartListing("Reparaturanleitung BMW E30")).toBe(true);
  });
});

describe("isPricePlausible", () => {
  it("accepts normal vehicle prices", () => {
    expect(isPricePlausible(25000, "Mercedes W123 280CE")).toBe(true);
    expect(isPricePlausible(150000, "Porsche 911 Carrera")).toBe(true);
  });

  it("rejects prices that look like years", () => {
    expect(isPricePlausible(1973, "Mercedes W123 1973")).toBe(false);
    expect(isPricePlausible(2002, "BMW 2002 tii")).toBe(false);
    expect(isPricePlausible(1955, "Mercedes 300 SL Baujahr 1955")).toBe(false);
  });

  it("rejects prices that match mileage in text", () => {
    expect(isPricePlausible(85000, "Mercedes W123, 85.000 km")).toBe(false);
    expect(isPricePlausible(123000, "BMW E30, 123.000 km gelaufen")).toBe(false);
  });

  it("rejects round numbers without € context (likely mileage)", () => {
    expect(isPricePlausible(50000, "Mercedes W123 mit 50.000")).toBe(false);
    expect(isPricePlausible(100000, "BMW E30 100.000")).toBe(false);
  });

  it("accepts round numbers when € sign is present", () => {
    expect(isPricePlausible(50000, "Mercedes W123 50.000 €")).toBe(true);
    expect(isPricePlausible(100000, "BMW E30 EUR 100.000")).toBe(true);
  });
});

describe("matchesFactoryCode", () => {
  it("accepts listings that contain the factory code", () => {
    expect(matchesFactoryCode("Mercedes W123 280CE", "", "W123")).toBe(true);
    expect(matchesFactoryCode("BMW E30 325i", "", "E30")).toBe(true);
    expect(matchesFactoryCode("Porsche 911", "Baureihe R107", "R107")).toBe(true);
  });

  it("rejects listings with a different code from the same series", () => {
    expect(matchesFactoryCode("Mercedes W124 300E", "", "W123")).toBe(false);
    expect(matchesFactoryCode("Mercedes W126 500 SEL", "", "W123")).toBe(false);
    expect(matchesFactoryCode("BMW E36 Coupé", "", "E30")).toBe(false);
  });

  it("accepts listings when factory code appears in snippet", () => {
    expect(matchesFactoryCode("Mercedes 280CE", "Baureihe W123, BJ 1975", "W123")).toBe(true);
  });

  it("rejects when wrong code in snippet", () => {
    expect(matchesFactoryCode("Mercedes 300E", "W124 Limousine", "W123")).toBe(false);
  });

  it("accepts listings with no factory code mentions (neutral)", () => {
    expect(matchesFactoryCode("Mercedes 280 CE Coupé 1975", "", "W123")).toBe(true);
  });

  it("handles case insensitivity", () => {
    expect(matchesFactoryCode("mercedes w123 coupé", "", "W123")).toBe(true);
    expect(matchesFactoryCode("MERCEDES W124", "", "W123")).toBe(false);
  });

  it("handles codes with hyphen like C-107", () => {
    expect(matchesFactoryCode("Mercedes SLC C107", "", "C107")).toBe(true);
    expect(matchesFactoryCode("Mercedes SL R107", "", "C107")).toBe(false);
  });
});
