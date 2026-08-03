import { describe, it, expect } from "vitest";
import { buildCostOverview, DOMINANT_SHARE } from "./cost-overview";
import type { CostAnalysis, CategoryResult } from "@/lib/cost-analysis";

/**
 * Tests zum Kostenüberblick (PROJ-31).
 *
 * Der Überblick rechnet nichts neu — er fasst zusammen. Geprüft wird deshalb
 * vor allem, wann eine Zahl **entfällt**, statt geraten zu werden.
 */

function kategorie(key: string, totalCents: number): CategoryResult {
  return {
    key,
    label: key,
    classification: null,
    sources: [],
    totalCents,
    entryCount: 1,
    tracked: true,
  } as unknown as CategoryResult;
}

function analyse(
  kategorien: Array<[string, number]>,
  mileage: { km: number | null; readings: number; skippedSegments: number } = {
    km: 1000,
    readings: 5,
    skippedSegments: 0,
  }
): CostAnalysis {
  return {
    categories: kategorien.map(([k, c]) => kategorie(k, c)),
    mileage,
  } as unknown as CostAnalysis;
}

describe("buildCostOverview — Gruppierung", () => {
  it("fasst die Kostenarten zu vier Gruppen zusammen", () => {
    const o = buildCostOverview(
      analyse([
        ["fuel", 90000],
        ["maintenance", 30000],
        ["repair", 20000],
        ["insurance", 60000],
        ["parts", 40000],
      ]),
      12
    );
    expect(o.groups.map((g) => g.label)).toEqual([
      "Kraftstoff",
      "Wartung & Reparatur",
      "Laufende Kosten",
      "Einzelkosten",
    ]);
    // Wartung und Reparatur liegen in einer Gruppe
    expect(o.groups[1].totalCents).toBe(50000);
    expect(o.totalCents).toBe(240000);
  });

  it("lässt Gruppen ohne Betrag weg", () => {
    const o = buildCostOverview(analyse([["fuel", 90000]]), 12);
    expect(o.groups).toHaveLength(1);
    expect(o.groups[0].label).toBe("Kraftstoff");
  });

  it("führt jede Gruppe in ihren Detailbereich", () => {
    const o = buildCostOverview(
      analyse([
        ["fuel", 1],
        ["repair", 1],
        ["tax", 1],
        ["parts", 1],
      ]),
      12
    );
    expect(o.groups.map((g) => g.path)).toEqual([
      "/tankbuch",
      "/scheckheft",
      "/kosten/laufende",
      "/kosten/einzelkosten",
    ]);
  });

  it("die Anteile ergeben zusammen 100 Prozent", () => {
    const o = buildCostOverview(
      analyse([
        ["fuel", 25000],
        ["repair", 25000],
        ["insurance", 25000],
        ["parts", 25000],
      ]),
      12
    );
    const summe = o.groups.reduce((s, g) => s + g.share, 0);
    expect(summe).toBeCloseTo(1, 10);
  });
});

describe("buildCostOverview — Monatsdurchschnitt", () => {
  it("teilt durch die abgedeckten Monate, nicht durch zwölf", () => {
    // Ein im Mai gekauftes Fahrzeug: vier Monate, 800 € — das sind 200 €
    // je Monat und nicht 66,67 €
    const o = buildCostOverview(analyse([["fuel", 80000]]), 4);
    expect(o.perMonthCents).toBe(20000);
  });

  it("kommt mit null Monaten zurecht", () => {
    const o = buildCostOverview(analyse([["fuel", 80000]]), 0);
    expect(o.perMonthCents).toBe(0);
  });
});

describe("buildCostOverview — Kosten je Kilometer", () => {
  it("rechnet aus Gesamtkosten und Fahrleistung", () => {
    const o = buildCostOverview(analyse([["fuel", 100000]]), 12);
    expect(o.perKmCents).toBe(100);
    expect(o.perKmMissingReason).toBeNull();
  });

  it("entfällt ohne zwei Messpunkte", () => {
    const o = buildCostOverview(
      analyse([["fuel", 100000]], { km: null, readings: 1, skippedSegments: 0 }),
      12
    );
    expect(o.perKmCents).toBeNull();
    expect(o.perKmMissingReason).toBe("keine-messpunkte");
  });

  it("entfällt bei widersprüchlichen Ständen statt negativ zu werden", () => {
    // Tachotausch oder Tippfehler: mehrere Ablesungen, aber keine
    // verwertbare Strecke
    const o = buildCostOverview(
      analyse([["fuel", 100000]], { km: null, readings: 4, skippedSegments: 3 }),
      12
    );
    expect(o.perKmCents).toBeNull();
    expect(o.perKmMissingReason).toBe("widerspruechliche-staende");
  });

  it("entfällt bei null gefahrenen Kilometern", () => {
    const o = buildCostOverview(
      analyse([["fuel", 100000]], { km: 0, readings: 3, skippedSegments: 0 }),
      12
    );
    expect(o.perKmCents).toBeNull();
  });
});

describe("buildCostOverview — Datenlage", () => {
  it("erkennt den leeren Zustand", () => {
    const o = buildCostOverview(analyse([]), 12);
    expect(o.isEmpty).toBe(true);
    expect(o.groups).toHaveLength(0);
  });

  it("erkennt eine einzige Quelle", () => {
    const o = buildCostOverview(analyse([["fuel", 90000]]), 12);
    expect(o.singleSource).toBe(true);
    // Bei einer Quelle ist der Anteil trivialerweise 100 % — das als
    // beherrschenden Posten zu melden wäre Rauschen
    expect(o.dominantGroup).toBeNull();
  });

  it("meldet einen beherrschenden Posten", () => {
    // Eine Restaurierung über 15.000 € neben 1.000 € Benzin
    const o = buildCostOverview(
      analyse([
        ["fuel", 100000],
        ["repair", 1500000],
      ]),
      12
    );
    expect(o.dominantGroup?.label).toBe("Wartung & Reparatur");
    expect(o.dominantGroup!.share).toBeGreaterThan(DOMINANT_SHARE);
    expect(o.singleSource).toBe(false);
  });

  it("meldet keinen beherrschenden Posten bei gleichmäßiger Verteilung", () => {
    const o = buildCostOverview(
      analyse([
        ["fuel", 50000],
        ["repair", 50000],
      ]),
      12
    );
    expect(o.dominantGroup).toBeNull();
  });

  it("meldet genau 50 Prozent noch nicht als beherrschend", () => {
    const o = buildCostOverview(
      analyse([
        ["fuel", 50000],
        ["repair", 50000],
      ]),
      12
    );
    expect(o.groups[0].share).toBe(0.5);
    expect(o.dominantGroup).toBeNull();
  });
});
