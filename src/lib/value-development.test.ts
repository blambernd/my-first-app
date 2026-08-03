import { describe, it, expect } from "vitest";
import {
  pickManualMarketValue,
  splitUpkeep,
  pickMarketValue,
  calculateValueDevelopment,
  costsBeforePurchase,
  STALE_ANALYSIS_DAYS,
  type MarketAnalysisRow,
} from "@/lib/value-development";
import {
  totalAcquisitionCents,
  normalizePurchase,
  normalizeExtraCost,
  type PurchaseExtraCost,
  type VehiclePurchase,
} from "@/lib/validations/vehicle-purchase";

// Ausdrücklich als UTC-Zeitpunkt: `new Date(2026, 7, 1)` wäre lokale
// Mitternacht und die Altersberechnung damit von der Zeitzone des Testrechners
// abhängig — der Test wäre je nach Standort mal 29, mal 30 Tage.
const HEUTE = new Date("2026-08-01T00:00:00Z");

function kauf(partial: Partial<VehiclePurchase> = {}): VehiclePurchase {
  return {
    id: "p1",
    vehicle_id: "v1",
    price_cents: 2000000, // 20.000 €
    purchased_on: "2024-05-10",
    notes: null,
    created_at: "",
    updated_at: "",
    created_by: "u1",
    ...partial,
  };
}

function nebenkosten(
  eintraege: Array<[string, number]>
): PurchaseExtraCost[] {
  return eintraege.map(([label, amount_cents], i) => ({
    id: `c${i}`,
    purchase_id: "p1",
    vehicle_id: "v1",
    label,
    amount_cents,
    created_at: "",
  }));
}

/**
 * Unterhalt als Gesamtbetrag, wenn die Aufteilung für den Test keine Rolle
 * spielt — die Bilanzsummen hängen nur an der Summe beider Teile.
 */
function unterhalt(gesamtCents: number) {
  return { investmentCents: 0, runningCents: gesamtCents };
}

function analyse(partial: Partial<MarketAnalysisRow> = {}): MarketAnalysisRow {
  return {
    status: "completed",
    median_price: 24450,
    average_price: 27722,
    created_at: "2026-07-01T10:00:00Z",
    ...partial,
  };
}

// ============================================================
// MARKTWERT
// ============================================================

describe("pickMarketValue", () => {
  it("rechnet Euro-Preise in Cent um", () => {
    const wert = pickMarketValue([analyse()], HEUTE);
    expect(wert?.cents).toBe(2445000);
    expect(wert?.basis).toBe("median");
  });

  it("verarbeitet als String gelieferte NUMERIC-Werte", () => {
    // Der Treiber liefert NUMERIC je nach Fall als String. Ohne Umwandlung
    // entstünde aus einer Rechnung eine Zeichenverkettung — dieselbe Falle
    // wie bei den Litern in PROJ-24.
    const wert = pickMarketValue(
      [analyse({ median_price: "24450" as unknown as number })],
      HEUTE
    );
    expect(wert?.cents).toBe(2445000);
    expect(typeof wert?.cents).toBe("number");
  });

  it("nimmt die jüngste abgeschlossene Analyse", () => {
    const wert = pickMarketValue(
      [
        analyse({ median_price: 10000, created_at: "2025-01-01T00:00:00Z" }),
        analyse({ median_price: 30000, created_at: "2026-06-01T00:00:00Z" }),
        analyse({ median_price: 20000, created_at: "2026-02-01T00:00:00Z" }),
      ],
      HEUTE
    );
    expect(wert?.cents).toBe(3000000);
  });

  it("übergeht Analysen, die nicht abgeschlossen sind", () => {
    const wert = pickMarketValue(
      [
        analyse({ status: "pending", median_price: 99999, created_at: "2026-07-30T00:00:00Z" }),
        analyse({ status: "error", median_price: 88888, created_at: "2026-07-29T00:00:00Z" }),
        analyse({ median_price: 24450, created_at: "2026-07-01T00:00:00Z" }),
      ],
      HEUTE
    );
    expect(wert?.cents).toBe(2445000);
  });

  it("weicht auf den Durchschnitt aus, wenn der Median fehlt", () => {
    const wert = pickMarketValue(
      [analyse({ median_price: null, average_price: 27722 })],
      HEUTE
    );
    expect(wert?.cents).toBe(2772200);
    expect(wert?.basis).toBe("average");
  });

  it("gibt null zurück, wenn keine brauchbare Analyse vorliegt", () => {
    expect(pickMarketValue([], HEUTE)).toBeNull();
    expect(
      pickMarketValue([analyse({ median_price: null, average_price: null })], HEUTE)
    ).toBeNull();
    expect(pickMarketValue([analyse({ status: "pending" })], HEUTE)).toBeNull();
  });

  it("wertet 0 und negative Preise als unbrauchbar", () => {
    expect(
      pickMarketValue(
        [analyse({ median_price: 0, average_price: -5 })],
        HEUTE
      )
    ).toBeNull();
  });

  it("bestimmt das Alter der Analyse in Tagen", () => {
    const wert = pickMarketValue(
      [analyse({ created_at: "2026-07-02T00:00:00Z" })],
      HEUTE
    );
    expect(wert?.ageInDays).toBe(30);
  });

  it("erkennt eine merklich alte Analyse", () => {
    const wert = pickMarketValue(
      [analyse({ created_at: "2026-01-01T00:00:00Z" })],
      HEUTE
    );
    expect(wert!.ageInDays).toBeGreaterThan(STALE_ANALYSIS_DAYS);
  });
});

// ============================================================
// ANSCHAFFUNG
// ============================================================

describe("totalAcquisitionCents", () => {
  it("addiert Kaufpreis und Nebenkosten", () => {
    expect(
      totalAcquisitionCents(
        kauf(),
        nebenkosten([
          ["Überführung", 50000],
          ["Zulassung", 12000],
        ])
      )
    ).toBe(2062000);
  });

  it("kommt ohne Nebenkosten aus", () => {
    expect(totalAcquisitionCents(kauf(), [])).toBe(2000000);
  });
});

describe("Normalisierung", () => {
  it("wandelt String-Beträge in Zahlen", () => {
    const p = normalizePurchase(
      kauf({ price_cents: "2000000" as unknown as number })
    );
    expect(p.price_cents).toBe(2000000);
    const c = normalizeExtraCost({
      ...nebenkosten([["x", 0]])[0],
      amount_cents: "5000" as unknown as number,
    });
    expect(c.amount_cents).toBe(5000);
  });
});

// ============================================================
// BILANZ
// ============================================================

describe("calculateValueDevelopment", () => {
  const markt = pickMarketValue([analyse()], HEUTE); // 24.450 €

  it("stellt Anschaffung, Unterhalt und Marktwert gegenüber", () => {
    const r = calculateValueDevelopment(
      kauf(),
      nebenkosten([["Überführung", 50000]]),
      unterhalt(300000), // 3.000 € Unterhalt
      markt
    );
    expect(r.purchaseCents).toBe(2000000);
    expect(r.extraCents).toBe(50000);
    expect(r.acquisitionCents).toBe(2050000);
    expect(r.upkeepCents).toBe(300000);
    expect(r.totalSpentCents).toBe(2350000);
  });

  it("misst die Wertveränderung am Kaufpreis, nicht an der Anschaffung", () => {
    // Laut Acceptance Criteria ausdrücklich gegen den Kaufpreis: Die Frage
    // lautet, wie sich das Fahrzeug selbst entwickelt hat
    const r = calculateValueDevelopment(
      kauf(),
      nebenkosten([["Überführung", 50000]]),
      unterhalt(300000),
      markt
    );
    expect(r.valueChangeCents).toBe(2445000 - 2000000);
  });

  it("zieht für die Gesamtbilanz alles Ausgegebene ab", () => {
    const r = calculateValueDevelopment(
      kauf(),
      nebenkosten([["Überführung", 50000]]),
      unterhalt(300000),
      markt
    );
    expect(r.balanceCents).toBe(2445000 - 2350000);
  });

  it("weist einen Wertverlust ohne Sonderbehandlung aus", () => {
    // Marktwert unter Kaufpreis ist in den ersten Jahren der Normalfall
    const r = calculateValueDevelopment(
      kauf({ price_cents: 3000000 }),
      [],
      unterhalt(0),
      markt
    );
    expect(r.valueChangeCents).toBe(2445000 - 3000000);
    expect(r.valueChangeCents).toBeLessThan(0);
  });

  it("lässt Wertveränderung und Bilanz ohne Marktwert offen", () => {
    const r = calculateValueDevelopment(kauf(), [], unterhalt(300000), null);
    expect(r.valueChangeCents).toBeNull();
    expect(r.balanceCents).toBeNull();
    // Die Kostenseite bleibt trotzdem aussagekräftig
    expect(r.totalSpentCents).toBe(2300000);
  });

  it("trennt Anschaffung und Investition auch beim Restaurierungsobjekt", () => {
    // 3.000 € Kaufpreis, 40.000 € Aufwand: Saldiert wäre das nur eine große
    // Negativzahl. Beide Größen müssen einzeln ablesbar bleiben.
    const r = calculateValueDevelopment(
      kauf({ price_cents: 300000 }),
      [],
      unterhalt(4000000),
      markt
    );
    expect(r.acquisitionCents).toBe(300000);
    expect(r.upkeepCents).toBe(4000000);
    expect(r.balanceCents).toBe(2445000 - 4300000);
  });

  it("kommt ohne Unterhaltskosten aus", () => {
    const r = calculateValueDevelopment(kauf(), [], unterhalt(0), markt);
    expect(r.totalSpentCents).toBe(2000000);
    expect(r.balanceCents).toBe(445000);
  });
});

// ============================================================
// KOSTEN VOR DEM KAUF
// ============================================================

describe("costsBeforePurchase", () => {
  it("meldet Kosten aus der Zeit vor dem Kauf", () => {
    const r = costsBeforePurchase("2023-01", "2024-05-10");
    expect(r.affected).toBe(true);
    expect(r.earliestMonth).toBe("2023-01");
  });

  it("meldet nichts, wenn alle Kosten nach dem Kauf liegen", () => {
    expect(costsBeforePurchase("2024-06", "2024-05-10").affected).toBe(false);
  });

  it("wertet den Kaufmonat selbst nicht als davor", () => {
    expect(costsBeforePurchase("2024-05", "2024-05-10").affected).toBe(false);
  });

  it("meldet nichts, wenn gar keine Kosten erfasst sind", () => {
    const r = costsBeforePurchase(null, "2024-05-10");
    expect(r.affected).toBe(false);
    expect(r.earliestMonth).toBeNull();
  });
});

describe("pickManualMarketValue (Ersatz für die Marktanalyse)", () => {
  const heute = new Date("2026-08-02T00:00:00Z");

  it("nimmt den jüngsten Eintrag", () => {
    const result = pickManualMarketValue(
      [
        { value_cents: 1_500_000, valued_on: "2026-01-15", note: null },
        { value_cents: 1_850_000, valued_on: "2026-07-01", note: "Gutachten" },
        { value_cents: 1_600_000, valued_on: "2026-03-10", note: null },
      ],
      heute
    );
    expect(result?.cents).toBe(1_850_000);
    expect(result?.basis).toBe("manuell");
    expect(result?.note).toBe("Gutachten");
  });

  it("rechnet das Alter in Tagen aus", () => {
    const result = pickManualMarketValue(
      [{ value_cents: 1_000_000, valued_on: "2026-07-03", note: null }],
      heute
    );
    expect(result?.ageInDays).toBe(30);
  });

  it("verkraftet NUMERIC als Zeichenkette", () => {
    // Der Postgres-Treiber liefert BIGINT je nach Fall als String
    const result = pickManualMarketValue(
      [{ value_cents: "1850000", valued_on: "2026-07-01", note: null }],
      heute
    );
    expect(result?.cents).toBe(1_850_000);
  });

  it("überspringt unbrauchbare Einträge statt sie zu übernehmen", () => {
    const result = pickManualMarketValue(
      [
        { value_cents: 0, valued_on: "2026-07-02", note: null },
        { value_cents: 1_200_000, valued_on: "2026-07-01", note: null },
      ],
      heute
    );
    expect(result?.cents).toBe(1_200_000);
  });

  it("liefert null ohne Einträge", () => {
    expect(pickManualMarketValue([], heute)).toBeNull();
  });
});

// ============================================================
// INVESTITION GEGEN LAUFENDE KOSTEN (2026-08-03)
// ============================================================

describe("splitUpkeep", () => {
  it("zählt Ersatzteile und Reparaturen zur Investition", () => {
    const r = splitUpkeep([
      { key: "parts", totalCents: 120000 },
      { key: "repair", totalCents: 380000 },
    ]);
    expect(r.investmentCents).toBe(500000);
    expect(r.runningCents).toBe(0);
  });

  it("zählt Nutzungskosten zu den laufenden Kosten", () => {
    const r = splitUpkeep([
      { key: "fuel", totalCents: 90000 },
      { key: "insurance", totalCents: 60000 },
      { key: "tax", totalCents: 20000 },
      { key: "storage", totalCents: 100000 },
      { key: "club", totalCents: 5000 },
    ]);
    expect(r.runningCents).toBe(275000);
    expect(r.investmentCents).toBe(0);
  });

  it("zählt Wartung zu den laufenden Kosten", () => {
    // Festlegung vom 2026-08-03: Inspektion, Ölwechsel und TÜV erhalten den
    // Zustand, steigern ihn aber nicht
    const r = splitUpkeep([{ key: "maintenance", totalCents: 45000 }]);
    expect(r.runningCents).toBe(45000);
    expect(r.investmentCents).toBe(0);
  });

  it("zählt „Sonstiges“ zu den laufenden Kosten", () => {
    // Die Kategorie wird von Einzelkosten UND Scheckheft gespeist und lässt
    // sich hier nicht trennen — als Investition auszuweisen hieße, nicht
    // eingeordneten Aufwand als Wertzuwachs zu zeigen
    const r = splitUpkeep([{ key: "misc", totalCents: 30000 }]);
    expect(r.runningCents).toBe(30000);
  });

  it("verliert nichts: beide Teile ergeben zusammen die Summe", () => {
    const kategorien = [
      { key: "fuel", totalCents: 90000 },
      { key: "parts", totalCents: 120000 },
      { key: "maintenance", totalCents: 45000 },
      { key: "repair", totalCents: 380000 },
      { key: "insurance", totalCents: 60000 },
      { key: "appraisal", totalCents: 25000 },
      { key: "misc", totalCents: 30000 },
    ];
    const r = splitUpkeep(kategorien);
    const summe = kategorien.reduce((s, k) => s + k.totalCents, 0);
    expect(r.investmentCents + r.runningCents).toBe(summe);
    expect(r.investmentCents).toBe(500000);
  });

  it("kommt mit einer unbekannten Kategorie zurecht", () => {
    // Neue Kostenarten landen im laufenden Aufwand, nicht in der Investition
    const r = splitUpkeep([{ key: "voellig-neu", totalCents: 1000 }]);
    expect(r.runningCents).toBe(1000);
    expect(r.investmentCents).toBe(0);
  });
});

describe("calculateValueDevelopment — Aufteilung", () => {
  it("führt Investition und laufende Kosten getrennt und zusammen", () => {
    const r = calculateValueDevelopment(
      kauf(),
      [],
      { investmentCents: 500000, runningCents: 275000 },
      null
    );
    expect(r.investmentCents).toBe(500000);
    expect(r.runningCents).toBe(275000);
    expect(r.upkeepCents).toBe(775000);
    expect(r.totalSpentCents).toBe(2000000 + 775000);
  });
});
