import { describe, it, expect } from "vitest";
import {
  countsTowardTotal,
  summarize,
  classifiedTotals,
  filterCosts,
  sortNewestFirst,
} from "./one-off-costs";
import {
  normalizeOneOffCost,
  supportsPartFields,
  type OneOffCost,
} from "@/lib/validations/one-off-cost";

let seq = 0;

function cost(overrides: Partial<OneOffCost> = {}): OneOffCost {
  seq += 1;
  return {
    id: `oc-${seq}`,
    vehicle_id: "veh-1",
    cost_type: "parts",
    description: "Vergaserdichtsatz",
    amount_cents: 5000,
    purchased_at: "2026-05-01",
    quantity: 1,
    part_number: null,
    source: null,
    installed_at: null,
    service_entry_id: null,
    included_in_service_entry: false,
    notes: null,
    created_at: `2026-05-01T00:00:${String(seq).padStart(2, "0")}Z`,
    updated_at: "2026-05-01T00:00:00Z",
    created_by: "user-1",
    ...overrides,
  };
}

describe("countsTowardTotal — der Doppelzählungsschutz", () => {
  it("zählt einen gewöhnlichen Eintrag mit", () => {
    expect(countsTowardTotal(cost())).toBe(true);
  });

  it("schließt einen Eintrag aus, der als im Scheckheft enthalten markiert und verknüpft ist", () => {
    expect(
      countsTowardTotal(
        cost({ service_entry_id: "se-1", included_in_service_entry: true })
      )
    ).toBe(false);
  });

  it("zählt mit, wenn die Verknüpfung besteht, das Kennzeichen aber nicht gesetzt ist", () => {
    expect(
      countsTowardTotal(
        cost({ service_entry_id: "se-1", included_in_service_entry: false })
      )
    ).toBe(true);
  });

  it("zählt wieder mit, sobald der verknüpfte Scheckheft-Eintrag weggefallen ist", () => {
    // Der Kernfall: Ohne diese Regel würde der Betrag dauerhaft und unbemerkt
    // aus der Auswertung verschwinden, weil das Kennzeichen gesetzt bleibt.
    expect(
      countsTowardTotal(
        cost({ service_entry_id: null, included_in_service_entry: true })
      )
    ).toBe(true);
  });
});

describe("summarize", () => {
  it("summiert nur mitzählende Beträge", () => {
    const s = summarize([
      cost({ amount_cents: 5000 }),
      cost({ amount_cents: 3000 }),
      cost({
        amount_cents: 9900,
        service_entry_id: "se-1",
        included_in_service_entry: true,
      }),
    ]);
    expect(s.totalCents).toBe(8000);
    expect(s.entryCount).toBe(3);
  });

  it("weist ausgeschlossene Beträge gesondert aus", () => {
    const s = summarize([
      cost({ amount_cents: 5000 }),
      cost({
        amount_cents: 9900,
        service_entry_id: "se-1",
        included_in_service_entry: true,
      }),
    ]);
    expect(s.excludedCents).toBe(9900);
    expect(s.excludedCount).toBe(1);
  });

  it("summiert je Kostenart", () => {
    const s = summarize([
      cost({ cost_type: "parts", amount_cents: 5000 }),
      cost({ cost_type: "parts", amount_cents: 2000 }),
      cost({ cost_type: "appraisal", amount_cents: 15000 }),
    ]);
    expect(s.byType.get("parts")).toBe(7000);
    expect(s.byType.get("appraisal")).toBe(15000);
  });

  it("kommt mit einer leeren Liste zurecht", () => {
    const s = summarize([]);
    expect(s.totalCents).toBe(0);
    expect(s.entryCount).toBe(0);
    expect(s.excludedCents).toBe(0);
    expect(s.byType.size).toBe(0);
  });
});

describe("classifiedTotals", () => {
  it("ordnet Ersatzteile den Fahrtkosten und Gutachten den Standkosten zu", () => {
    const t = classifiedTotals([
      cost({ cost_type: "parts", amount_cents: 5000 }),
      cost({ cost_type: "appraisal", amount_cents: 15000 }),
    ]);
    expect(t.drivingCents).toBe(5000);
    expect(t.standingCents).toBe(15000);
    expect(t.unclassifiedCents).toBe(0);
  });

  it("führt „Sonstiges“ getrennt, statt es zu raten", () => {
    const t = classifiedTotals([cost({ cost_type: "other", amount_cents: 1200 })]);
    expect(t.unclassifiedCents).toBe(1200);
    expect(t.standingCents).toBe(0);
    expect(t.drivingCents).toBe(0);
  });

  it("lässt ausgeschlossene Beträge auch hier außen vor", () => {
    const t = classifiedTotals([
      cost({
        cost_type: "parts",
        amount_cents: 9900,
        service_entry_id: "se-1",
        included_in_service_entry: true,
      }),
    ]);
    expect(t.drivingCents).toBe(0);
  });
});

describe("filterCosts", () => {
  const daten = [
    cost({ cost_type: "parts", description: "Vergaserdichtsatz", part_number: "111-222" }),
    cost({ cost_type: "parts", description: "Zündkerzen", part_number: "W8AC" }),
    cost({ cost_type: "appraisal", description: "Wertgutachten 2026" }),
  ];

  it("filtert nach Kostenart", () => {
    expect(filterCosts(daten, { type: "appraisal" })).toHaveLength(1);
  });

  it("liefert bei „alle“ alles zurück", () => {
    expect(filterCosts(daten, { type: "all" })).toHaveLength(3);
  });

  it("sucht in der Bezeichnung, unabhängig von Groß-/Kleinschreibung", () => {
    expect(filterCosts(daten, { search: "zünd" })).toHaveLength(1);
  });

  it("sucht auch in der Teilenummer", () => {
    expect(filterCosts(daten, { search: "W8AC" })).toHaveLength(1);
  });

  it("kombiniert Kostenart und Suchbegriff", () => {
    expect(filterCosts(daten, { type: "parts", search: "gutachten" })).toHaveLength(0);
  });

  it("ignoriert einen leeren Suchbegriff", () => {
    expect(filterCosts(daten, { search: "   " })).toHaveLength(3);
  });
});

describe("sortNewestFirst", () => {
  it("sortiert nach Kaufdatum absteigend", () => {
    const alt = cost({ purchased_at: "2025-01-01" });
    const neu = cost({ purchased_at: "2026-05-01" });
    expect(sortNewestFirst([alt, neu]).map((c) => c.id)).toEqual([neu.id, alt.id]);
  });

  it("nutzt bei gleichem Datum den Erfassungszeitpunkt", () => {
    const erst = cost({ purchased_at: "2026-05-01", created_at: "2026-05-01T08:00:00Z" });
    const dann = cost({ purchased_at: "2026-05-01", created_at: "2026-05-01T18:00:00Z" });
    expect(sortNewestFirst([erst, dann]).map((c) => c.id)).toEqual([dann.id, erst.id]);
  });

  it("verändert das Eingabe-Array nicht", () => {
    const input = [cost({ purchased_at: "2025-01-01" }), cost({ purchased_at: "2026-05-01" })];
    const vorher = input.map((c) => c.id);
    sortNewestFirst(input);
    expect(input.map((c) => c.id)).toEqual(vorher);
  });
});

describe("supportsPartFields", () => {
  it("bietet Teilefelder nur bei Ersatzteilen an", () => {
    expect(supportsPartFields("parts")).toBe(true);
    expect(supportsPartFields("appraisal")).toBe(false);
    expect(supportsPartFields("other")).toBe(false);
  });
});

describe("normalizeOneOffCost", () => {
  it("wandelt String-Werte aus der Datenbank in Zahlen", () => {
    const raw = {
      ...cost(),
      amount_cents: "5000" as unknown as number,
      quantity: "3" as unknown as number,
    };
    const n = normalizeOneOffCost(raw);
    expect(n.amount_cents).toBe(5000);
    expect(n.quantity).toBe(3);
  });
});
