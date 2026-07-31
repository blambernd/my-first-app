import { describe, it, expect } from "vitest";
import {
  monthsInPeriod,
  prorate,
  periodsOverlap,
  findOverlapping,
  withProration,
  isActiveAt,
  currentMonthlyCents,
  yearlyTotalCents,
  groupByType,
} from "./recurring-costs";
import {
  normalizeRecurringCost,
  type RecurringCost,
} from "@/lib/validations/recurring-cost";

let seq = 0;

function cost(overrides: Partial<RecurringCost> = {}): RecurringCost {
  seq += 1;
  return {
    id: `rc-${seq}`,
    vehicle_id: "veh-1",
    cost_type: "insurance",
    amount_cents: 60000, // 600 €
    payment_interval: "yearly",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    provider: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by: "user-1",
    ...overrides,
  };
}

describe("monthsInPeriod", () => {
  it("zählt beide Randmonate mit", () => {
    expect(monthsInPeriod("2026-01-01", "2026-12-31")).toBe(12);
  });

  it("rechnet eine Saison von April bis Oktober als 7 Monate", () => {
    expect(monthsInPeriod("2026-04-01", "2026-10-31")).toBe(7);
  });

  it("zählt einen einzelnen Monat als 1", () => {
    expect(monthsInPeriod("2026-05-01", "2026-05-31")).toBe(1);
  });

  it("rechnet über Jahresgrenzen hinweg", () => {
    expect(monthsInPeriod("2025-11-01", "2026-02-28")).toBe(4);
  });

  it("liefert 0 bei umgekehrter Reihenfolge", () => {
    expect(monthsInPeriod("2026-12-01", "2026-01-31")).toBe(0);
  });
});

describe("prorate — alle Intervalle liefern dieselbe Monatsbelastung", () => {
  // Der Kern von Tech Design C2: Der Betrag gilt pro Intervall. Würde das
  // übersehen, wichen die Ergebnisse je nach Eingabeform um den Faktor 12 ab.
  const jahr = { valid_from: "2026-01-01", valid_to: "2026-12-31" };

  it("600 € jährlich über 12 Monate ergibt 50 €/Monat", () => {
    const r = prorate(cost({ ...jahr, amount_cents: 60000, payment_interval: "yearly" }));
    expect(r.monthlyCents).toBeCloseTo(5000, 5);
    expect(r.totalCents).toBe(60000);
    expect(r.payments).toBe(1);
  });

  it("300 € halbjährlich über 12 Monate ergibt ebenfalls 50 €/Monat", () => {
    const r = prorate(cost({ ...jahr, amount_cents: 30000, payment_interval: "half_yearly" }));
    expect(r.monthlyCents).toBeCloseTo(5000, 5);
    expect(r.totalCents).toBe(60000);
    expect(r.payments).toBe(2);
  });

  it("150 € vierteljährlich über 12 Monate ergibt ebenfalls 50 €/Monat", () => {
    const r = prorate(cost({ ...jahr, amount_cents: 15000, payment_interval: "quarterly" }));
    expect(r.monthlyCents).toBeCloseTo(5000, 5);
    expect(r.totalCents).toBe(60000);
    expect(r.payments).toBe(4);
  });

  it("50 € monatlich über 12 Monate ergibt ebenfalls 50 €/Monat", () => {
    const r = prorate(cost({ ...jahr, amount_cents: 5000, payment_interval: "monthly" }));
    expect(r.monthlyCents).toBeCloseTo(5000, 5);
    expect(r.totalCents).toBe(60000);
    expect(r.payments).toBe(12);
  });
});

describe("prorate — abweichende Zeiträume", () => {
  it("verteilt einen Jahresbetrag über eine 7-Monats-Saison auf 7 Monate, nicht auf 12", () => {
    const r = prorate(
      cost({
        valid_from: "2026-04-01",
        valid_to: "2026-10-31",
        amount_cents: 60000,
        payment_interval: "yearly",
      })
    );
    expect(r.months).toBe(7);
    expect(r.payments).toBe(1);
    expect(r.totalCents).toBe(60000);
    expect(r.monthlyCents).toBeCloseTo(60000 / 7, 5);
  });

  it("rundet angebrochene Intervalle auf — sie werden voll bezahlt", () => {
    const r = prorate(
      cost({
        valid_from: "2026-01-01",
        valid_to: "2027-06-30", // 18 Monate
        amount_cents: 60000,
        payment_interval: "yearly",
      })
    );
    expect(r.months).toBe(18);
    expect(r.payments).toBe(2);
    expect(r.totalCents).toBe(120000);
  });

  it("beginnt bei unterjährigem Kauf ab dem Startmonat", () => {
    const r = prorate(
      cost({
        valid_from: "2026-07-01",
        valid_to: "2026-12-31",
        amount_cents: 30000,
        payment_interval: "half_yearly",
      })
    );
    expect(r.months).toBe(6);
    expect(r.payments).toBe(1);
    expect(r.monthlyCents).toBeCloseTo(5000, 5);
  });

  it("liefert 0 bei ungültigem Zeitraum statt einer Division durch null", () => {
    const r = prorate(cost({ valid_from: "2026-12-01", valid_to: "2026-01-31" }));
    expect(r.months).toBe(0);
    expect(r.monthlyCents).toBe(0);
    expect(Number.isFinite(r.monthlyCents)).toBe(true);
  });
});

describe("periodsOverlap", () => {
  it("erkennt überlappende Zeiträume", () => {
    expect(
      periodsOverlap(
        { valid_from: "2026-01-01", valid_to: "2026-06-30" },
        { valid_from: "2026-06-01", valid_to: "2026-12-31" }
      )
    ).toBe(true);
  });

  it("erkennt angrenzende Zeiträume nicht als Überlappung", () => {
    expect(
      periodsOverlap(
        { valid_from: "2026-01-01", valid_to: "2026-06-30" },
        { valid_from: "2026-07-01", valid_to: "2026-12-31" }
      )
    ).toBe(false);
  });

  it("erkennt eine Lücke nicht als Überlappung", () => {
    expect(
      periodsOverlap(
        { valid_from: "2026-01-01", valid_to: "2026-03-31" },
        { valid_from: "2026-07-01", valid_to: "2026-12-31" }
      )
    ).toBe(false);
  });
});

describe("findOverlapping", () => {
  it("meldet zwei Versicherungen im selben Monat", () => {
    const a = cost({ cost_type: "insurance", valid_from: "2026-01-01", valid_to: "2026-12-31" });
    const b = cost({ cost_type: "insurance", valid_from: "2026-06-01", valid_to: "2027-05-31" });
    const result = findOverlapping([a, b]);
    expect(result.has(a.id)).toBe(true);
    expect(result.has(b.id)).toBe(true);
  });

  it("meldet Winterlager und Versicherung NICHT — verschiedene Kostenarten dürfen sich überlappen", () => {
    const versicherung = cost({
      cost_type: "insurance",
      valid_from: "2026-04-01",
      valid_to: "2026-10-31",
    });
    const garage = cost({
      cost_type: "storage",
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
    });
    expect(findOverlapping([versicherung, garage]).size).toBe(0);
  });

  it("meldet einen Versicherungswechsel mit angrenzenden Zeiträumen nicht", () => {
    const alt = cost({ cost_type: "insurance", valid_from: "2026-01-01", valid_to: "2026-06-30" });
    const neu = cost({ cost_type: "insurance", valid_from: "2026-07-01", valid_to: "2026-12-31" });
    expect(findOverlapping([alt, neu]).size).toBe(0);
  });
});

describe("isActiveAt", () => {
  it("erkennt einen laufenden Eintrag", () => {
    expect(isActiveAt(cost(), "2026-06-15")).toBe(true);
  });

  it("erkennt einen abgelaufenen Eintrag", () => {
    expect(isActiveAt(cost(), "2027-01-15")).toBe(false);
  });

  it("erkennt einen zukünftigen Eintrag", () => {
    expect(isActiveAt(cost(), "2025-06-15")).toBe(false);
  });
});

describe("currentMonthlyCents", () => {
  it("summiert nur die zum Stichtag laufenden Einträge", () => {
    const laufend = cost({ amount_cents: 60000, payment_interval: "yearly" }); // 50 €/Monat
    const abgelaufen = cost({
      cost_type: "tax",
      valid_from: "2024-01-01",
      valid_to: "2024-12-31",
      amount_cents: 24000,
    });
    expect(currentMonthlyCents([laufend, abgelaufen], "2026-06-15")).toBeCloseTo(5000, 5);
  });

  it("liefert 0 ohne laufende Einträge", () => {
    expect(currentMonthlyCents([], "2026-06-15")).toBe(0);
  });
});

describe("yearlyTotalCents", () => {
  it("summiert einen ganzjährigen Eintrag zum vollen Jahresbetrag", () => {
    expect(yearlyTotalCents([cost({ amount_cents: 60000 })], 2026)).toBeCloseTo(60000, 5);
  });

  it("rechnet einen Saisonvertrag NICHT auf zwölf Monate hoch", () => {
    // 600 € über 7 Monate: hohe Monatsbelastung, aber nur 600 € im Jahr
    const saison = cost({
      valid_from: "2026-04-01",
      valid_to: "2026-10-31",
      amount_cents: 60000,
    });
    expect(yearlyTotalCents([saison], 2026)).toBeCloseTo(60000, 5);
    // Zum Vergleich: Monatsbelastung mal zwölf wäre grob zu hoch
    expect((60000 / 7) * 12).toBeGreaterThan(100000);
  });

  it("teilt einen jahresübergreifenden Zeitraum auf beide Jahre auf", () => {
    const c = cost({
      valid_from: "2025-11-01",
      valid_to: "2026-02-28", // 4 Monate: 2 in 2025, 2 in 2026
      amount_cents: 40000,
      payment_interval: "yearly",
    });
    expect(yearlyTotalCents([c], 2025)).toBeCloseTo(20000, 5);
    expect(yearlyTotalCents([c], 2026)).toBeCloseTo(20000, 5);
  });

  it("liefert 0 für ein Jahr ohne Einträge", () => {
    expect(yearlyTotalCents([cost()], 2030)).toBe(0);
  });
});

describe("withProration und groupByType", () => {
  it("markiert überlappende Einträge", () => {
    const a = cost({ valid_from: "2026-01-01", valid_to: "2026-12-31" });
    const b = cost({ valid_from: "2026-06-01", valid_to: "2027-05-31" });
    const rows = withProration([a, b]);
    expect(rows.every((r) => r.hasOverlap)).toBe(true);
  });

  it("gruppiert nach Kostenart und sortiert neueste zuerst", () => {
    const alt = cost({ cost_type: "tax", valid_from: "2024-01-01", valid_to: "2024-12-31" });
    const neu = cost({ cost_type: "tax", valid_from: "2026-01-01", valid_to: "2026-12-31" });
    const groups = groupByType(withProration([alt, neu]));
    expect(groups.get("tax")?.map((r) => r.cost.id)).toEqual([neu.id, alt.id]);
  });
});

describe("normalizeRecurringCost", () => {
  it("wandelt einen String-Betrag aus der Datenbank in eine Zahl", () => {
    const raw = { ...cost(), amount_cents: "60000" as unknown as number };
    expect(normalizeRecurringCost(raw).amount_cents).toBe(60000);
    expect(typeof normalizeRecurringCost(raw).amount_cents).toBe("number");
  });
});
