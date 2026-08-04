import { describe, it, expect } from "vitest";
import {
  sortChronologically,
  calculateConsumption,
  calculateStats,
  buildConsumptionSeries,
} from "./fuel-consumption";
import {
  normalizeFuelEntry,
  type FuelEntry,
} from "@/lib/validations/fuel-entry";

let seq = 0;

function entry(overrides: Partial<FuelEntry> = {}): FuelEntry {
  seq += 1;
  return {
    id: `fe-${seq}`,
    vehicle_id: "veh-1",
    fueled_at: "2026-01-01",
    liters: 40,
    cost_cents: 8000,
    mileage_km: 10000,
    is_full_tank: true,
    is_odometer_correction: false,
    station: null,
    fuel_type: null,
    notes: null,
    created_at: `2026-01-01T00:00:${String(seq).padStart(2, "0")}Z`,
    updated_at: "2026-01-01T00:00:00Z",
    created_by: "user-1",
    ...overrides,
  };
}

describe("sortChronologically", () => {
  it("sortiert aufsteigend nach Datum", () => {
    const a = entry({ fueled_at: "2026-03-01" });
    const b = entry({ fueled_at: "2026-01-01" });
    const sorted = sortChronologically([a, b]);
    expect(sorted.map((e) => e.fueled_at)).toEqual(["2026-01-01", "2026-03-01"]);
  });

  it("nutzt den Erfassungszeitpunkt als Zweitkriterium bei gleichem Datum", () => {
    const first = entry({ fueled_at: "2026-01-01", created_at: "2026-01-01T08:00:00Z" });
    const second = entry({ fueled_at: "2026-01-01", created_at: "2026-01-01T18:00:00Z" });
    const sorted = sortChronologically([second, first]);
    expect(sorted.map((e) => e.id)).toEqual([first.id, second.id]);
  });

  it("verändert das Eingabe-Array nicht", () => {
    const input = [entry({ fueled_at: "2026-03-01" }), entry({ fueled_at: "2026-01-01" })];
    const snapshot = input.map((e) => e.id);
    sortChronologically(input);
    expect(input.map((e) => e.id)).toEqual(snapshot);
  });
});

describe("calculateConsumption — Voll-zu-Voll", () => {
  it("weist beim ersten Tankvorgang keinen Verbrauch aus", () => {
    const rows = calculateConsumption([entry({ mileage_km: 10000 })]);
    expect(rows[0].consumption).toBeNull();
    expect(rows[0].distanceKm).toBeNull();
  });

  it("berechnet den Verbrauch zwischen zwei Volltankungen", () => {
    const rows = calculateConsumption([
      entry({ fueled_at: "2026-01-01", mileage_km: 10000, liters: 40 }),
      entry({ fueled_at: "2026-02-01", mileage_km: 10500, liters: 50 }),
    ]);
    // 50 Liter auf 500 km = 10 L/100km
    expect(rows[1].consumption).toBeCloseTo(10, 5);
    expect(rows[1].distanceKm).toBe(500);
    expect(rows[1].fromMileageKm).toBe(10000);
  });

  it("zählt die Liter der Referenztankung nicht mit", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000, liters: 999 }),
      entry({ mileage_km: 10500, liters: 50 }),
    ]);
    expect(rows[1].consumption).toBeCloseTo(10, 5);
  });
});

describe("calculateConsumption — Teilbetankungen", () => {
  it("summiert Teilbetankungen bis zur nächsten Volltankung", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000, liters: 40, is_full_tank: true }),
      entry({ mileage_km: 10200, liters: 20, is_full_tank: false }),
      entry({ mileage_km: 10500, liters: 30, is_full_tank: true }),
    ]);
    expect(rows[1].consumption).toBeNull();
    // 20 + 30 = 50 Liter auf 500 km
    expect(rows[2].consumption).toBeCloseTo(10, 5);
    expect(rows[2].distanceKm).toBe(500);
  });

  it("liefert keinen Wert, wenn nie voll getankt wurde", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000, is_full_tank: false }),
      entry({ mileage_km: 10300, is_full_tank: false }),
    ]);
    expect(rows.every((r) => r.consumption === null)).toBe(true);
  });

  it("beginnt die Kette erst bei der ersten Volltankung", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000, is_full_tank: false }),
      entry({ mileage_km: 10100, liters: 40, is_full_tank: true }),
      entry({ mileage_km: 10600, liters: 50, is_full_tank: true }),
    ]);
    expect(rows[1].consumption).toBeNull();
    expect(rows[2].consumption).toBeCloseTo(10, 5);
    expect(rows[2].fromMileageKm).toBe(10100);
  });
});

describe("calculateConsumption — Kettenabbrüche", () => {
  it("unterbricht die Berechnung an einer Tacho-Korrektur", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 90000, liters: 40 }),
      entry({ mileage_km: 500, liters: 50, is_odometer_correction: true }),
      entry({ mileage_km: 1000, liters: 45 }),
    ]);
    expect(rows[1].consumption).toBeNull();
    // Nach der Korrektur läuft die Kette normal weiter
    expect(rows[2].consumption).toBeCloseTo((45 / 500) * 100, 5);
    expect(rows[2].fromMileageKm).toBe(500);
  });

  it("weist keinen Verbrauch aus, wenn der km-Stand nicht gestiegen ist", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000 }),
      entry({ mileage_km: 9000 }),
    ]);
    expect(rows[1].consumption).toBeNull();
  });

  it("setzt nach einem ungültigen km-Stand neu auf", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000 }),
      entry({ mileage_km: 9000, liters: 40 }),
      entry({ mileage_km: 9400, liters: 40 }),
    ]);
    expect(rows[1].consumption).toBeNull();
    expect(rows[2].consumption).toBeCloseTo(10, 5);
    expect(rows[2].fromMileageKm).toBe(9000);
  });

  it("behandelt einen gleichbleibenden km-Stand als ungültig", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000 }),
      entry({ mileage_km: 10000 }),
    ]);
    expect(rows[1].consumption).toBeNull();
  });
});

describe("calculateConsumption — Plausibilität", () => {
  it("markiert einen zu hohen Verbrauch", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000 }),
      entry({ mileage_km: 10100, liters: 50 }), // 50 L/100km
    ]);
    expect(rows[1].isImplausible).toBe(true);
    expect(rows[1].consumption).toBeCloseTo(50, 5);
  });

  it("markiert einen zu niedrigen Verbrauch", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000 }),
      entry({ mileage_km: 20000, liters: 50 }), // 0,5 L/100km
    ]);
    expect(rows[1].isImplausible).toBe(true);
  });

  it("markiert einen normalen Verbrauch nicht", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000 }),
      entry({ mileage_km: 10500, liters: 50 }),
    ]);
    expect(rows[1].isImplausible).toBe(false);
  });
});

describe("calculateConsumption — Preis pro Liter", () => {
  it("berechnet den Preis pro Liter", () => {
    const rows = calculateConsumption([entry({ cost_cents: 8000, liters: 40 })]);
    expect(rows[0].pricePerLiterCents).toBeCloseTo(200, 5);
  });
});

describe("calculateStats", () => {
  it("summiert Kosten und Liter über alle Einträge", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000, liters: 40, cost_cents: 8000 }),
      entry({ mileage_km: 10500, liters: 50, cost_cents: 10000 }),
    ]);
    const stats = calculateStats(rows);
    expect(stats.totalLiters).toBe(90);
    expect(stats.totalCostCents).toBe(18000);
    expect(stats.entryCount).toBe(2);
  });

  it("gewichtet den Durchschnitt nach Strecke, nicht nach Anzahl", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 0, liters: 10 }),
      // kurzer Abschnitt, hoher Verbrauch: 20 L auf 100 km = 20 L/100km
      entry({ mileage_km: 100, liters: 20 }),
      // langer Abschnitt, niedriger Verbrauch: 45 L auf 900 km = 5 L/100km
      entry({ mileage_km: 1000, liters: 45 }),
    ]);
    const stats = calculateStats(rows);
    // Streckengewichtet: 65 L auf 1000 km = 6,5 — nicht (20+5)/2 = 12,5
    expect(stats.averageConsumption).toBeCloseTo(6.5, 5);
  });

  it("lässt unplausible Abschnitte aus dem Durchschnitt heraus", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000, liters: 40 }),
      entry({ mileage_km: 10500, liters: 50 }), // 10 L/100km, plausibel
      entry({ mileage_km: 10600, liters: 50 }), // 50 L/100km, unplausibel
    ]);
    const stats = calculateStats(rows);
    expect(stats.implausibleCount).toBe(1);
    expect(stats.averageConsumption).toBeCloseTo(10, 5);
  });

  it("liefert null als Durchschnitt, wenn kein Abschnitt auswertbar ist", () => {
    const stats = calculateStats(calculateConsumption([entry()]));
    expect(stats.averageConsumption).toBeNull();
    expect(stats.segmentCount).toBe(0);
  });

  it("kommt mit einer leeren Liste zurecht", () => {
    const stats = calculateStats([]);
    expect(stats.totalLiters).toBe(0);
    expect(stats.totalCostCents).toBe(0);
    expect(stats.averageConsumption).toBeNull();
    expect(stats.averagePricePerLiterCents).toBeNull();
    expect(stats.entryCount).toBe(0);
  });

  it("berechnet den durchschnittlichen Literpreis über alle Einträge", () => {
    const rows = calculateConsumption([
      entry({ liters: 40, cost_cents: 8000 }),
      entry({ mileage_km: 10500, liters: 10, cost_cents: 2500 }),
    ]);
    const stats = calculateStats(rows);
    // 10500 Cent auf 50 Liter = 210 Cent/Liter
    expect(stats.averagePricePerLiterCents).toBeCloseTo(210, 5);
  });
});

describe("normalizeFuelEntry — NUMERIC kommt als String zurück", () => {
  it("wandelt String-Werte aus der Datenbank in Zahlen um", () => {
    // So liefert der Postgres-Treiber eine NUMERIC-Spalte aus
    const raw = { ...entry(), liters: "42.5" as unknown as number };
    const normalized = normalizeFuelEntry(raw);
    expect(normalized.liters).toBe(42.5);
    expect(typeof normalized.liters).toBe("number");
  });

  it("liefert ohne Normalisierung einen falschen Verbrauch — mit Normalisierung den richtigen", () => {
    // Teilbetankung dazwischen: Erst wenn zwei Literwerte aufsummiert werden,
    // zeigt sich der Fehler. Bei nur einem Wert rettet die implizite Umwandlung
    // in der Division das Ergebnis zufällig — deshalb fällt so ein Bug im
    // einfachen Fall nicht auf.
    const rawRows = [
      { ...entry({ mileage_km: 10000 }), liters: "40" as unknown as number },
      {
        ...entry({ mileage_km: 10200, is_full_tank: false }),
        liters: "20" as unknown as number,
      },
      { ...entry({ mileage_km: 10500 }), liters: "30" as unknown as number },
    ];

    // Ohne Normalisierung hängt JavaScript die Strings aneinander ("020" + "30")
    const broken = calculateConsumption(rawRows);
    expect(broken[2].consumption).not.toBeCloseTo(10, 5);

    // 20 + 30 = 50 Liter auf 500 km = 10 L/100km
    const fixed = calculateConsumption(rawRows.map(normalizeFuelEntry));
    expect(fixed[2].consumption).toBeCloseTo(10, 5);
  });
});

describe("buildConsumptionSeries", () => {
  it("liefert nur Punkte mit auswertbarem Verbrauch", () => {
    const rows = calculateConsumption([
      entry({ fueled_at: "2026-01-01", mileage_km: 10000 }),
      entry({ fueled_at: "2026-01-20", mileage_km: 10500, liters: 50 }),
    ]);
    const series = buildConsumptionSeries(rows);
    expect(series).toHaveLength(1);
    expect(series[0].consumption).toBeCloseTo(10, 5);
  });

  it("fügt bei langer Standzeit eine Lücke ein", () => {
    const rows = calculateConsumption([
      entry({ fueled_at: "2026-01-01", mileage_km: 10000 }),
      entry({ fueled_at: "2026-01-20", mileage_km: 10500, liters: 50 }),
      // über 90 Tage später — Winterpause
      entry({ fueled_at: "2026-09-01", mileage_km: 11000, liters: 50 }),
    ]);
    const series = buildConsumptionSeries(rows);
    expect(series).toHaveLength(3);
    expect(series[1].consumption).toBeNull();
  });

  it("gibt dem Lückenpunkt ein echtes, lesbares Datum (RISIKO-1)", () => {
    const rows = calculateConsumption([
      entry({ fueled_at: "2026-01-01", mileage_km: 10000 }),
      entry({ fueled_at: "2026-01-20", mileage_km: 10500, liters: 50 }),
      entry({ fueled_at: "2026-09-01", mileage_km: 11000, liters: 50 }),
    ]);
    const gapPoint = buildConsumptionSeries(rows)[1];

    // Jeder Punkt muss als Datum lesbar sein — sonst wirft die Formatierung
    // im Diagramm einen RangeError, sobald ein Tooltip darauf trifft.
    expect(gapPoint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(new Date(gapPoint.date).getTime())).toBe(false);
  });

  it("legt den Lückenpunkt echt zwischen die beiden Messpunkte", () => {
    const rows = calculateConsumption([
      entry({ fueled_at: "2026-01-01", mileage_km: 10000 }),
      entry({ fueled_at: "2026-01-20", mileage_km: 10500, liters: 50 }),
      entry({ fueled_at: "2026-09-01", mileage_km: 11000, liters: 50 }),
    ]);
    const [before, gap, after] = buildConsumptionSeries(rows);
    expect(gap.date > before.date).toBe(true);
    expect(gap.date < after.date).toBe(true);
  });

  it("liefert für jeden Punkt ein parsebares Datum, auch mit mehreren Lücken", () => {
    const rows = calculateConsumption([
      entry({ fueled_at: "2025-01-01", mileage_km: 10000 }),
      entry({ fueled_at: "2025-01-20", mileage_km: 10500, liters: 50 }),
      entry({ fueled_at: "2025-09-01", mileage_km: 11000, liters: 50 }),
      entry({ fueled_at: "2026-06-01", mileage_km: 11500, liters: 50 }),
    ]);
    const series = buildConsumptionSeries(rows);
    expect(series.length).toBeGreaterThan(3);
    for (const point of series) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("fügt bei kurzem Abstand keine Lücke ein", () => {
    const rows = calculateConsumption([
      entry({ fueled_at: "2026-01-01", mileage_km: 10000 }),
      entry({ fueled_at: "2026-01-20", mileage_km: 10500, liters: 50 }),
      entry({ fueled_at: "2026-02-10", mileage_km: 11000, liters: 50 }),
    ]);
    const series = buildConsumptionSeries(rows);
    expect(series).toHaveLength(2);
    expect(series.every((p) => p.consumption !== null)).toBe(true);
  });

  it("nimmt unplausible Werte nicht in den Verlauf auf", () => {
    const rows = calculateConsumption([
      entry({ fueled_at: "2026-01-01", mileage_km: 10000 }),
      entry({ fueled_at: "2026-01-20", mileage_km: 10100, liters: 50 }),
    ]);
    expect(buildConsumptionSeries(rows)).toHaveLength(0);
  });
});

describe("Tankvorgänge ohne Betrag (PROJ-32)", () => {
  it("zeigt keinen Literpreis, wenn der Betrag fehlt", () => {
    // 0,00 €/L wäre eine Aussage über den Tankvorgang, die niemand getroffen hat
    const rows = calculateConsumption([entry({ cost_cents: null, liters: 40 })]);
    expect(rows[0].pricePerLiterCents).toBeNull();
  });

  it("lässt fehlende Beträge aus der Gesamtsumme heraus", () => {
    const rows = calculateConsumption([
      entry({ mileage_km: 10000, liters: 40, cost_cents: null }),
      entry({ mileage_km: 10500, liters: 50, cost_cents: 10000 }),
    ]);
    expect(calculateStats(rows).totalCostCents).toBe(10000);
  });

  it("berechnet den Verbrauch unverändert weiter", () => {
    // Der Kern der Entscheidung, nur die Beträge zu leeren: Die
    // Verbrauchsrechnung kommt ohne Geld aus, sie rechnet mit Litern und
    // Kilometern. Nach einem Besitzerwechsel bleibt sie vollständig.
    const rows = calculateConsumption([
      entry({ mileage_km: 10000, liters: 40, cost_cents: null }),
      entry({ mileage_km: 10500, liters: 50, cost_cents: null }),
    ]);
    expect(rows[1].consumption).not.toBeNull();
    expect(rows[1].distanceKm).toBe(500);
  });
});
