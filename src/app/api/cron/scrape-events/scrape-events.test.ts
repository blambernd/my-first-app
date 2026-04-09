import { describe, it, expect } from "vitest";

// Re-implement pure helper functions for testing (not exported from route)

function classifyCategory(name: string): string {
  const RALLYE_KEYWORDS = ["rallye", "rally", "ausfahrt", "tour", "rundfahrt", "wertungsfahrt"];
  const MESSE_KEYWORDS = ["messe", "börse", "teilemarkt", "markt", "ausstellung", "museum", "salon"];
  const lower = name.toLowerCase();
  if (RALLYE_KEYWORDS.some((kw) => lower.includes(kw))) return "rallye";
  if (MESSE_KEYWORDS.some((kw) => lower.includes(kw))) return "messe";
  return "regional";
}

function parseLocation(text: string): { plz: string; location: string } | null {
  const match = text.match(/(\d{5})\s+(.+)/);
  if (!match) return null;
  return { plz: match[1], location: match[2].trim() };
}

describe("classifyCategory", () => {
  it("classifies rallye events", () => {
    expect(classifyCategory("Oldtimer-Rallye München")).toBe("rallye");
    expect(classifyCategory("ADAC Ausfahrt ins Blaue")).toBe("rallye");
    expect(classifyCategory("Große Rundfahrt 2026")).toBe("rallye");
    expect(classifyCategory("Rally Classic")).toBe("rallye");
  });

  it("classifies messe events", () => {
    expect(classifyCategory("Oldtimer-Messe Stuttgart")).toBe("messe");
    expect(classifyCategory("Teilemarkt & Börse")).toBe("messe");
    expect(classifyCategory("Sonderausstellung im Museum")).toBe("messe");
    expect(classifyCategory("Retro Salon Düsseldorf")).toBe("messe");
  });

  it("classifies regional events as fallback", () => {
    expect(classifyCategory("Oldtimer-Treffen Heidelberg")).toBe("regional");
    expect(classifyCategory("Stammtisch der Käferfreunde")).toBe("regional");
    expect(classifyCategory("Seminar Blechbearbeitung")).toBe("regional");
  });

  it("is case insensitive", () => {
    expect(classifyCategory("RALLYE DER KLASSIKER")).toBe("rallye");
    expect(classifyCategory("GROSSE MESSE")).toBe("messe");
  });
});

describe("parseLocation", () => {
  it("parses standard PLZ + city", () => {
    expect(parseLocation("74889 Sinsheim - Museumsplatz")).toEqual({
      plz: "74889",
      location: "Sinsheim - Museumsplatz",
    });
  });

  it("parses PLZ + city without address", () => {
    expect(parseLocation("80331 München")).toEqual({
      plz: "80331",
      location: "München",
    });
  });

  it("parses PLZ + city with street", () => {
    expect(parseLocation("97421 Schweinfurt - Georg-Schäfer-Straße 71")).toEqual({
      plz: "97421",
      location: "Schweinfurt - Georg-Schäfer-Straße 71",
    });
  });

  it("returns null for missing PLZ", () => {
    expect(parseLocation("München")).toBeNull();
    expect(parseLocation("")).toBeNull();
  });

  it("returns null for short number", () => {
    expect(parseLocation("1234 Ort")).toBeNull();
  });
});
