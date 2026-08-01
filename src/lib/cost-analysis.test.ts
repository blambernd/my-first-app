import { describe, it, expect } from "vitest";
import {
  buildCategories,
  categoryForServiceEntry,
  categoryForOneOffCost,
  enumerateMonths,
  monthLabel,
  earliestMonth,
  buildPeriods,
  calculateMileage,
  analyzeCosts,
  type AnalysisInput,
  type Period,
  type ServiceEntryForAnalysis,
} from "@/lib/cost-analysis";
import type { FuelEntry } from "@/lib/validations/fuel-entry";
import type { RecurringCost } from "@/lib/validations/recurring-cost";
import type { OneOffCost } from "@/lib/validations/one-off-cost";

// ============================================================
// TESTDATEN
// ============================================================

function fuel(partial: Partial<FuelEntry> & { fueled_at: string }): FuelEntry {
  return {
    id: partial.id ?? crypto.randomUUID(),
    vehicle_id: "v1",
    fueled_at: partial.fueled_at,
    liters: partial.liters ?? 40,
    cost_cents: partial.cost_cents ?? 8000,
    mileage_km: partial.mileage_km ?? 10000,
    is_full_tank: partial.is_full_tank ?? true,
    is_odometer_correction: partial.is_odometer_correction ?? false,
    station: null,
    fuel_type: null,
    notes: null,
    created_at: "",
    updated_at: "",
    created_by: "u1",
  };
}

function service(
  partial: Partial<ServiceEntryForAnalysis> & { service_date: string }
): ServiceEntryForAnalysis {
  return {
    id: partial.id ?? crypto.randomUUID(),
    service_date: partial.service_date,
    entry_type: partial.entry_type ?? "inspection",
    cost_cents: partial.cost_cents === undefined ? 20000 : partial.cost_cents,
    mileage_km: partial.mileage_km ?? 10000,
    is_odometer_correction: partial.is_odometer_correction ?? false,
  };
}

function recurring(partial: Partial<RecurringCost> = {}): RecurringCost {
  return {
    id: partial.id ?? crypto.randomUUID(),
    vehicle_id: "v1",
    cost_type: partial.cost_type ?? "insurance",
    amount_cents: partial.amount_cents ?? 120000,
    payment_interval: partial.payment_interval ?? "yearly",
    valid_from: partial.valid_from ?? "2026-01-01",
    valid_to: partial.valid_to ?? "2026-12-31",
    provider: null,
    notes: null,
    created_at: "",
    updated_at: "",
    created_by: "u1",
  };
}

function oneOff(
  partial: Partial<OneOffCost> & { purchased_at: string }
): OneOffCost {
  return {
    id: partial.id ?? crypto.randomUUID(),
    vehicle_id: "v1",
    cost_type: partial.cost_type ?? "parts",
    description: partial.description ?? "Teil",
    amount_cents: partial.amount_cents ?? 5000,
    purchased_at: partial.purchased_at,
    quantity: 1,
    part_number: null,
    source: null,
    installed_at: null,
    service_entry_id: partial.service_entry_id ?? null,
    included_in_service_entry: partial.included_in_service_entry ?? false,
    notes: null,
    created_at: "",
    updated_at: "",
    created_by: "u1",
  };
}

function input(partial: Partial<AnalysisInput> = {}): AnalysisInput {
  return {
    fuelEntries: partial.fuelEntries ?? [],
    serviceEntries: partial.serviceEntries ?? [],
    recurringCosts: partial.recurringCosts ?? [],
    oneOffCosts: partial.oneOffCosts ?? [],
  };
}

const YEAR_2026: Period = {
  fromMonth: "2026-01",
  toMonth: "2026-12",
  label: "2026",
};
const END_OF_2026 = new Date(2026, 11, 31);

// ============================================================
// KOSTENARTEN-VERZEICHNIS
// ============================================================

describe("buildCategories", () => {
  it("enthält alle in der Spec geforderten Kostenarten", () => {
    const labels = buildCategories().map((c) => c.label);
    for (const expected of [
      "Benzin",
      "Wartung",
      "Reparatur",
      "Ersatzteile",
      "Versicherung",
      "Kfz-Steuer",
      "Unterstellung / Garage",
      "Club- / Verbandsbeitrag",
      "Wertgutachten",
      "Sonstiges",
    ]) {
      expect(labels, `${expected} fehlt`).toContain(expected);
    }
  });

  it("führt jeden Schlüssel nur einmal", () => {
    const keys = buildCategories().map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("speist Sonstiges aus Scheckheft und Einzelkosten", () => {
    const misc = buildCategories().find((c) => c.key === "misc");
    expect(misc?.sources).toEqual(
      expect.arrayContaining(["scheckheft", "einzelkosten"])
    );
  });

  it("ordnet Standkosten und Fahrtkosten richtig ein", () => {
    const byKey = new Map(buildCategories().map((c) => [c.key, c]));
    expect(byKey.get("insurance")?.classification).toBe("standing");
    expect(byKey.get("storage")?.classification).toBe("standing");
    expect(byKey.get("appraisal")?.classification).toBe("standing");
    expect(byKey.get("fuel")?.classification).toBe("driving");
    expect(byKey.get("parts")?.classification).toBe("driving");
    // Sonstiges bleibt bewusst ohne Zuordnung
    expect(byKey.get("misc")?.classification).toBeNull();
  });

  it("hält die Anzeigereihenfolge ein", () => {
    const keys = buildCategories().map((c) => c.key);
    expect(keys.indexOf("fuel")).toBeLessThan(keys.indexOf("insurance"));
    expect(keys.indexOf("misc")).toBe(keys.length - 1);
  });
});

describe("Zuordnung der Quelltypen", () => {
  it("bildet Scheckheft-Typen nach Spec ab", () => {
    expect(categoryForServiceEntry("inspection")).toBe("maintenance");
    expect(categoryForServiceEntry("oil_change")).toBe("maintenance");
    expect(categoryForServiceEntry("tuv_hu")).toBe("maintenance");
    expect(categoryForServiceEntry("repair")).toBe("repair");
    expect(categoryForServiceEntry("restoration")).toBe("repair");
    expect(categoryForServiceEntry("other")).toBe("misc");
  });

  it("führt Einzelkosten-Sonstiges mit dem Scheckheft-Sonstiges zusammen", () => {
    expect(categoryForOneOffCost("parts")).toBe("parts");
    expect(categoryForOneOffCost("appraisal")).toBe("appraisal");
    expect(categoryForOneOffCost("other")).toBe("misc");
  });
});

// ============================================================
// MONATSHILFEN
// ============================================================

describe("Monatshilfen", () => {
  it("zählt Monate über Jahresgrenzen hinweg auf", () => {
    expect(enumerateMonths("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("gibt einen einzelnen Monat zurück", () => {
    expect(enumerateMonths("2026-05", "2026-05")).toEqual(["2026-05"]);
  });

  it("gibt für einen rückwärts laufenden Zeitraum nichts zurück", () => {
    expect(enumerateMonths("2026-05", "2026-04")).toEqual([]);
  });

  it("beschriftet Monate deutsch und kurz", () => {
    expect(monthLabel("2026-03")).toBe("Mär 26");
  });
});

describe("earliestMonth", () => {
  it("findet den frühesten Monat über alle Quellen", () => {
    expect(
      earliestMonth(
        input({
          fuelEntries: [fuel({ fueled_at: "2024-06-01" })],
          serviceEntries: [service({ service_date: "2023-02-15" })],
          recurringCosts: [recurring({ valid_from: "2025-01-01" })],
        })
      )
    ).toBe("2023-02");
  });

  it("gibt null zurück, wenn es keine Daten gibt", () => {
    expect(earliestMonth(input())).toBeNull();
  });
});

describe("buildPeriods", () => {
  it("endet nie in der Zukunft", () => {
    const periods = buildPeriods(input(), new Date(2026, 6, 15));
    expect(periods[0].toMonth).toBe("2026-07");
    expect(periods[2].toMonth).toBe("2026-07");
  });

  it("lässt den gesamten Zeitraum bis zum frühesten Datensatz zurückreichen", () => {
    const periods = buildPeriods(
      input({ serviceEntries: [service({ service_date: "2019-04-01" })] }),
      new Date(2026, 6, 15)
    );
    expect(periods[2].fromMonth).toBe("2019-04");
  });
});

// ============================================================
// FAHRLEISTUNG
// ============================================================

describe("calculateMileage", () => {
  it("summiert Zuwächse aus beiden Quellen", () => {
    const result = calculateMileage(
      input({
        fuelEntries: [
          fuel({ fueled_at: "2026-01-10", mileage_km: 10000 }),
          fuel({ fueled_at: "2026-03-10", mileage_km: 10500 }),
        ],
        serviceEntries: [service({ service_date: "2026-06-01", mileage_km: 11000 })],
      }),
      YEAR_2026
    );
    expect(result.km).toBe(1000);
    expect(result.readings).toBe(3);
  });

  it("gibt bei weniger als zwei Ablesungen nicht berechenbar zurück", () => {
    const result = calculateMileage(
      input({ fuelEntries: [fuel({ fueled_at: "2026-01-10" })] }),
      YEAR_2026
    );
    expect(result.km).toBeNull();
  });

  it("überspringt den Abschnitt, der auf einer Tacho-Korrektur endet", () => {
    // Tacho getauscht: neuer Stand liegt höher, ohne dass gefahren wurde
    const result = calculateMileage(
      input({
        fuelEntries: [
          fuel({ fueled_at: "2026-01-10", mileage_km: 10000 }),
          fuel({
            fueled_at: "2026-02-10",
            mileage_km: 90000,
            is_odometer_correction: true,
          }),
          fuel({ fueled_at: "2026-03-10", mileage_km: 90300 }),
        ],
      }),
      YEAR_2026
    );
    // Nur der Abschnitt nach der Korrektur zählt
    expect(result.km).toBe(300);
    expect(result.skippedSegments).toBe(1);
  });

  it("überspringt sinkende Kilometerstände", () => {
    const result = calculateMileage(
      input({
        fuelEntries: [
          fuel({ fueled_at: "2026-01-10", mileage_km: 10000 }),
          fuel({ fueled_at: "2026-02-10", mileage_km: 9000 }),
          fuel({ fueled_at: "2026-03-10", mileage_km: 9400 }),
        ],
      }),
      YEAR_2026
    );
    expect(result.km).toBe(400);
    expect(result.skippedSegments).toBe(1);
  });

  it("berücksichtigt nur Ablesungen im gewählten Zeitraum", () => {
    const result = calculateMileage(
      input({
        fuelEntries: [
          fuel({ fueled_at: "2025-01-10", mileage_km: 1000 }),
          fuel({ fueled_at: "2026-01-10", mileage_km: 10000 }),
          fuel({ fueled_at: "2026-06-10", mileage_km: 10200 }),
        ],
      }),
      YEAR_2026
    );
    expect(result.km).toBe(200);
  });
});

// ============================================================
// HAUPTAUSWERTUNG
// ============================================================

describe("analyzeCosts — Grundfälle", () => {
  it("meldet leere Datenlage", () => {
    const result = analyzeCosts(input(), YEAR_2026, END_OF_2026);
    expect(result.hasAnyData).toBe(false);
    expect(result.totalCents).toBe(0);
    expect(result.quality.untracked.length).toBeGreaterThan(0);
  });

  it("summiert Tankkosten in die Kostenart Benzin", () => {
    const result = analyzeCosts(
      input({
        fuelEntries: [
          fuel({ fueled_at: "2026-02-01", cost_cents: 8000 }),
          fuel({ fueled_at: "2026-03-01", cost_cents: 7500 }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    const benzin = result.categories.find((c) => c.key === "fuel");
    expect(benzin?.totalCents).toBe(15500);
    expect(benzin?.entryCount).toBe(2);
    expect(result.totalCents).toBe(15500);
  });

  it("ordnet Scheckheft-Einträge den richtigen Kostenarten zu", () => {
    const result = analyzeCosts(
      input({
        serviceEntries: [
          service({ service_date: "2026-02-01", entry_type: "oil_change", cost_cents: 10000 }),
          service({ service_date: "2026-03-01", entry_type: "repair", cost_cents: 50000 }),
          service({ service_date: "2026-04-01", entry_type: "other", cost_cents: 2000 }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    const byKey = new Map(result.categories.map((c) => [c.key, c]));
    expect(byKey.get("maintenance")?.totalCents).toBe(10000);
    expect(byKey.get("repair")?.totalCents).toBe(50000);
    expect(byKey.get("misc")?.totalCents).toBe(2000);
  });

  it("zählt Scheckheft-Einträge ohne Kostenangabe gesondert statt als 0 €", () => {
    const result = analyzeCosts(
      input({
        serviceEntries: [
          service({ service_date: "2026-02-01", cost_cents: null }),
          service({ service_date: "2026-03-01", cost_cents: 10000 }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.quality.serviceEntriesWithoutCost).toBe(1);
    const wartung = result.categories.find((c) => c.key === "maintenance");
    expect(wartung?.entryCount).toBe(1);
    expect(wartung?.totalCents).toBe(10000);
  });
});

describe("analyzeCosts — Umlage der Fixkosten", () => {
  it("verteilt einen Jahresbeitrag gleichmäßig auf die Monate", () => {
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({
            amount_cents: 120000,
            payment_interval: "yearly",
            valid_from: "2026-01-01",
            valid_to: "2026-12-31",
          }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    const versicherung = result.categories.find((c) => c.key === "insurance");
    expect(versicherung?.totalCents).toBe(120000);
    // keine Spitze im Zahlungsmonat, sondern zwölfmal derselbe Betrag
    for (const month of result.months) {
      expect(month.byCategory.insurance).toBe(10000);
    }
  });

  it("liefert für gleichwertige Intervalle denselben Monatswert", () => {
    const perInterval = (
      amount: number,
      interval: RecurringCost["payment_interval"]
    ) =>
      analyzeCosts(
        input({
          recurringCosts: [
            recurring({
              amount_cents: amount,
              payment_interval: interval,
              valid_from: "2026-01-01",
              valid_to: "2026-12-31",
            }),
          ],
        }),
        YEAR_2026,
        END_OF_2026
      ).months[0].byCategory.insurance;

    expect(perInterval(120000, "yearly")).toBe(10000);
    expect(perInterval(60000, "half_yearly")).toBe(10000);
    expect(perInterval(30000, "quarterly")).toBe(10000);
    expect(perInterval(10000, "monthly")).toBe(10000);
  });

  it("zählt keine Monate, die noch nicht angebrochen sind", () => {
    // Vertrag läuft das ganze Jahr, heute ist der 15. Juli
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({
            amount_cents: 120000,
            payment_interval: "yearly",
            valid_from: "2026-01-01",
            valid_to: "2026-12-31",
          }),
        ],
      }),
      YEAR_2026,
      new Date(2026, 6, 15)
    );
    const versicherung = result.categories.find((c) => c.key === "insurance");
    // Januar bis Juli = 7 Monate; August bis Dezember zählen nicht
    expect(versicherung?.totalCents).toBe(70000);
    expect(result.months.find((m) => m.month === "2026-08")?.byCategory.insurance).toBe(0);
  });

  it("legt einen Saisonvertrag nur auf seine eigenen Monate um", () => {
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({
            cost_type: "storage",
            amount_cents: 60000,
            payment_interval: "yearly",
            valid_from: "2026-10-01",
            valid_to: "2027-03-31",
          }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    // 6 Monate Laufzeit, davon fallen Okt–Dez in den Auswertungszeitraum
    const garage = result.categories.find((c) => c.key === "storage");
    expect(garage?.totalCents).toBe(30000);
    expect(result.months.find((m) => m.month === "2026-09")?.byCategory.storage).toBe(0);
    expect(result.months.find((m) => m.month === "2026-10")?.byCategory.storage).toBe(10000);
  });

  it("meldet überlappende Zeiträume derselben Kostenart", () => {
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({ id: "a", valid_from: "2026-01-01", valid_to: "2026-12-31" }),
          recurring({ id: "b", valid_from: "2026-06-01", valid_to: "2027-05-31" }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.quality.overlappingRecurring).toBe(2);
  });
});

describe("analyzeCosts — Doppelzählungsschutz", () => {
  it("zählt einen als enthalten markierten und verknüpften Betrag nicht mit", () => {
    const result = analyzeCosts(
      input({
        oneOffCosts: [
          oneOff({ purchased_at: "2026-02-01", amount_cents: 5000 }),
          oneOff({
            purchased_at: "2026-03-01",
            amount_cents: 12000,
            service_entry_id: "s1",
            included_in_service_entry: true,
          }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.totalCents).toBe(5000);
    expect(result.quality.excludedCount).toBe(1);
    expect(result.quality.excludedCents).toBe(12000);
  });

  it("zählt den Betrag wieder mit, sobald die Verknüpfung weg ist", () => {
    // Der Fall aus PROJ-26: Scheckheft-Eintrag gelöscht, Kennzeichen blieb stehen
    const result = analyzeCosts(
      input({
        oneOffCosts: [
          oneOff({
            purchased_at: "2026-03-01",
            amount_cents: 12000,
            service_entry_id: null,
            included_in_service_entry: true,
          }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.totalCents).toBe(12000);
    expect(result.quality.excludedCount).toBe(0);
  });
});

describe("analyzeCosts — erfasst oder nicht erfasst", () => {
  it("kennzeichnet nie erfasste Kostenarten als nicht erfasst", () => {
    const result = analyzeCosts(
      input({ fuelEntries: [fuel({ fueled_at: "2026-02-01" })] }),
      YEAR_2026,
      END_OF_2026
    );
    const byKey = new Map(result.categories.map((c) => [c.key, c]));
    expect(byKey.get("fuel")?.tracked).toBe(true);
    expect(byKey.get("insurance")?.tracked).toBe(false);
    expect(result.quality.untracked).toContain("Versicherung");
    expect(result.quality.untracked).not.toContain("Benzin");
  });

  it("gilt eine Kostenart als erfasst, auch wenn im Zeitraum nichts anfiel", () => {
    // Der Unterschied, auf den es ankommt: erfasst mit 0 € im Zeitraum ist
    // etwas anderes als nie erfasst
    const result = analyzeCosts(
      input({ fuelEntries: [fuel({ fueled_at: "2024-02-01" })] }),
      YEAR_2026,
      END_OF_2026
    );
    const benzin = result.categories.find((c) => c.key === "fuel");
    expect(benzin?.tracked).toBe(true);
    expect(benzin?.totalCents).toBe(0);
    expect(result.quality.untracked).not.toContain("Benzin");
  });
});

describe("analyzeCosts — Stand- und Fahrtkosten", () => {
  it("teilt die Summe auf und führt Unzugeordnetes gesondert", () => {
    const result = analyzeCosts(
      input({
        fuelEntries: [fuel({ fueled_at: "2026-02-01", cost_cents: 8000 })],
        recurringCosts: [
          recurring({
            amount_cents: 120000,
            valid_from: "2026-01-01",
            valid_to: "2026-12-31",
          }),
        ],
        oneOffCosts: [
          oneOff({
            purchased_at: "2026-04-01",
            cost_type: "other",
            amount_cents: 3000,
          }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.drivingCents).toBe(8000);
    expect(result.standingCents).toBe(120000);
    expect(result.unclassifiedCents).toBe(3000);
    // Unzugeordnetes fällt nicht aus der Gesamtsumme heraus
    expect(result.totalCents).toBe(131000);
    expect(result.standingCents + result.drivingCents + result.unclassifiedCents).toBe(
      result.totalCents
    );
  });

  it("weist Standkosten je Monat und je Jahr aus", () => {
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({
            amount_cents: 120000,
            valid_from: "2026-01-01",
            valid_to: "2026-12-31",
          }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.standingMonthlyNowCents).toBe(10000);
    expect(result.standingYearlyNowCents).toBe(120000);
  });

  it("nennt die aktuelle Belastung, nicht den Durchschnitt über den Zeitraum", () => {
    // Regressionstest für QA BUG-1. Ein am 1. August abgeschlossener
    // Jahresbeitrag von 1.200 € kostet 100 € im Monat. Über Januar bis August
    // gemittelt ergäbe derselbe Betrag 12,50 € — eine plausibel aussehende,
    // achtfach zu niedrige Antwort auf die Frage, was das Fahrzeug im Stand
    // kostet. PROJ-25 zeigt für dieselben Daten 100 €; beide Seiten müssen
    // übereinstimmen.
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({
            amount_cents: 120000,
            payment_interval: "yearly",
            valid_from: "2026-08-01",
            valid_to: "2027-07-31",
          }),
        ],
      }),
      { fromMonth: "2026-01", toMonth: "2026-08", label: "2026" },
      new Date(2026, 7, 15)
    );
    expect(result.standingMonthlyNowCents).toBe(10000);
    // Die Jahresangabe zählt die Monate, die ins Kalenderjahr 2026 fallen:
    // August bis Dezember sind fünf Monate zu 100 €. Bewusst nicht 1.200 € —
    // das wäre die hochgerechnete Jahresrate, die bei unterjährigen Verträgen
    // falsch ist (QA BUG-3).
    expect(result.standingYearlyNowCents).toBe(50000);
    // Die Summe im Zeitraum bleibt davon unberührt: ein Monat Laufzeit
    expect(result.standingCents).toBe(10000);
  });

  it("rechnet die Jahresangabe nicht als Monatsbelastung mal zwölf", () => {
    // Regressionstest für QA BUG-3. Ein Winterlager über sechs Monate kostet
    // 600 € im Jahr, nicht 1.200 €. Die Monatsbelastung ist mit 100 € richtig,
    // hochgerechnet ergäbe sie aber den doppelten Jahreswert. PROJ-25 nennt
    // für dieselben Daten 600 € — beide Seiten müssen übereinstimmen.
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({
            cost_type: "storage",
            amount_cents: 60000,
            payment_interval: "yearly",
            valid_from: "2026-06-01",
            valid_to: "2026-11-30",
          }),
        ],
      }),
      { fromMonth: "2026-01", toMonth: "2026-08", label: "2026" },
      new Date(2026, 7, 15)
    );
    expect(result.standingMonthlyNowCents).toBe(10000);
    expect(result.standingYearlyNowCents).toBe(60000);
    expect(result.currentYear).toBe(2026);
  });

  it("zählt für die Jahresangabe nur die Monate, die ins Jahr fallen", () => {
    // Vertrag läuft über den Jahreswechsel: Oktober bis März, 1.200 € gesamt.
    // Auf zwölf Monate verteilt sind das 200 €/Monat; in 2026 fallen nur
    // Oktober bis Dezember, also drei Monate zu 200 € = 600 €.
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({
            cost_type: "storage",
            amount_cents: 120000,
            payment_interval: "yearly",
            valid_from: "2026-10-01",
            valid_to: "2027-03-31",
          }),
        ],
      }),
      YEAR_2026,
      new Date(2026, 10, 15)
    );
    expect(result.standingYearlyNowCents).toBe(60000);
  });

  it("meldet keine Standkosten, wenn zum Stichtag keine laufen", () => {
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({
            amount_cents: 120000,
            valid_from: "2025-01-01",
            valid_to: "2025-12-31",
          }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.standingMonthlyNowCents).toBeNull();
    // Im laufenden Kalenderjahr fielen keine Standkosten an
    expect(result.standingYearlyNowCents).toBe(0);
  });

  it("lässt Fahrtkosten aus der Standkosten-Kennzahl heraus", () => {
    const result = analyzeCosts(
      input({
        fuelEntries: [fuel({ fueled_at: "2026-02-01", cost_cents: 99999 })],
        recurringCosts: [
          recurring({
            amount_cents: 120000,
            valid_from: "2026-01-01",
            valid_to: "2026-12-31",
          }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.standingMonthlyNowCents).toBe(10000);
  });
});

describe("analyzeCosts — Einträge in der Zukunft", () => {
  it("zählt künftige Einträge und meldet sie", () => {
    // Regressionstest für QA BUG-2. Solche Beträge zählen zu Recht nicht als
    // angefallen, dürfen aber nicht wortlos verschwinden.
    //
    // Der Zeitraum reicht hier bewusst bis Dezember, obwohl heute August ist:
    // Die Regel „nichts aus der Zukunft zählt" muss unabhängig vom übergebenen
    // Zeitraum greifen, nicht nur weil `buildPeriods` ihn zufällig beschneidet.
    const result = analyzeCosts(
      input({
        serviceEntries: [
          service({ service_date: "2026-11-01", cost_cents: 99900 }),
        ],
        oneOffCosts: [oneOff({ purchased_at: "2026-12-01", amount_cents: 5000 })],
      }),
      YEAR_2026,
      new Date(2026, 7, 15)
    );
    expect(result.quality.futureDated).toBe(2);
    expect(result.totalCents).toBe(0);
  });

  it("meldet nichts, wenn alle Einträge in der Vergangenheit liegen", () => {
    const result = analyzeCosts(
      input({
        serviceEntries: [
          service({ service_date: "2026-03-01", cost_cents: 10000 }),
        ],
      }),
      YEAR_2026,
      new Date(2026, 7, 15)
    );
    expect(result.quality.futureDated).toBe(0);
  });

  it("zählt künftige Scheckheft-Einträge ohne Kostenangabe nicht mit", () => {
    // Ein geplanter Termin ohne Betrag fehlt in keiner Summe — ihn zu melden
    // wäre ein Fehlalarm
    const result = analyzeCosts(
      input({
        serviceEntries: [
          service({ service_date: "2026-11-01", cost_cents: null }),
        ],
      }),
      YEAR_2026,
      new Date(2026, 7, 15)
    );
    expect(result.quality.futureDated).toBe(0);
  });
});

describe("analyzeCosts — Kosten pro Kilometer", () => {
  it("berechnet den Wert bei ermittelbarer Fahrleistung", () => {
    const result = analyzeCosts(
      input({
        fuelEntries: [
          fuel({ fueled_at: "2026-01-10", mileage_km: 10000, cost_cents: 5000 }),
          fuel({ fueled_at: "2026-06-10", mileage_km: 11000, cost_cents: 5000 }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.mileage.km).toBe(1000);
    expect(result.centsPerKm).toBe(10);
  });

  it("gibt ohne Fahrleistung nicht berechenbar zurück statt 0 oder unendlich", () => {
    const result = analyzeCosts(
      input({
        fuelEntries: [
          fuel({ fueled_at: "2026-01-10", mileage_km: 10000, cost_cents: 5000 }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.mileage.km).toBeNull();
    expect(result.centsPerKm).toBeNull();
    expect(Number.isFinite(result.centsPerKm as number)).toBe(false);
  });

  it("liefert auch bei sehr geringer Fahrleistung einen endlichen Wert", () => {
    const result = analyzeCosts(
      input({
        fuelEntries: [
          fuel({ fueled_at: "2026-01-10", mileage_km: 10000, cost_cents: 50000 }),
          fuel({ fueled_at: "2026-06-10", mileage_km: 10050, cost_cents: 0 }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.mileage.km).toBe(50);
    expect(result.centsPerKm).toBe(1000);
  });
});

describe("analyzeCosts — Zeitachse", () => {
  it("kennzeichnet Monate ohne Daten als leer", () => {
    const result = analyzeCosts(
      input({ fuelEntries: [fuel({ fueled_at: "2026-03-01", cost_cents: 8000 })] }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.months).toHaveLength(12);
    expect(result.months.find((m) => m.month === "2026-03")?.hasData).toBe(true);
    expect(result.months.find((m) => m.month === "2026-04")?.hasData).toBe(false);
  });

  it("markiert Monate mit Standkosten ohne Fahrtkosten nicht als leer", () => {
    // Winterlager bei abgemeldetem Fahrzeug — korrekt, kein Datenfehler
    const result = analyzeCosts(
      input({
        recurringCosts: [
          recurring({
            cost_type: "storage",
            amount_cents: 30000,
            valid_from: "2026-01-01",
            valid_to: "2026-03-31",
          }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.months.find((m) => m.month === "2026-01")?.hasData).toBe(true);
    expect(result.months.find((m) => m.month === "2026-01")?.byCategory.fuel).toBe(0);
  });

  it("lässt Beträge außerhalb des Zeitraums unberücksichtigt", () => {
    const result = analyzeCosts(
      input({
        fuelEntries: [
          fuel({ fueled_at: "2025-12-31", cost_cents: 9999 }),
          fuel({ fueled_at: "2026-01-01", cost_cents: 8000 }),
          fuel({ fueled_at: "2027-01-01", cost_cents: 7777 }),
        ],
      }),
      YEAR_2026,
      END_OF_2026
    );
    expect(result.totalCents).toBe(8000);
  });
});
