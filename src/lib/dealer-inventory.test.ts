import { describe, it, expect } from "vitest";
import {
  LONG_STANDING_DAYS,
  filterInventory,
  formatHoldingDays,
  formatStandingDays,
  grossMarginCents,
  isLongStanding,
  soldStandingDays,
  saleRemovalWording,
  sortInventory,
  standingDays,
  summarizeSales,
  type InventoryVehicle,
  type SoldRecord,
} from "./dealer-inventory";

const HEUTE = new Date("2026-09-19T14:30:00Z");

function fahrzeug(overrides: Partial<InventoryVehicle> = {}): InventoryVehicle {
  return {
    id: "v1",
    make: "Mercedes-Benz",
    model: "SL380",
    year: 1980,
    licensePlate: "S-MB 380H",
    currency: "EUR",
    purchasedOn: "2026-03-01",
    purchaseDateEstimated: false,
    purchasePriceCents: 4500000,
    ...overrides,
  };
}

function verkauf(overrides: Partial<SoldRecord> = {}): SoldRecord {
  return {
    id: "s1",
    make: "Mercedes-Benz",
    model: "SL380",
    year: 1980,
    currency: "EUR",
    purchasedOn: "2026-01-10",
    purchasePriceCents: 4000000,
    soldOn: "2026-06-10",
    salePriceCents: 4800000,
    origin: "manual",
    ...overrides,
  };
}

describe("standingDays", () => {
  it("zählt Kalendertage seit dem Kauf", () => {
    expect(standingDays("2026-09-19", HEUTE)).toBe(0);
    expect(standingDays("2026-09-18", HEUTE)).toBe(1);
    expect(standingDays("2026-03-01", HEUTE)).toBe(202);
  });

  it("liefert ohne Datum nichts statt einer Null", () => {
    expect(standingDays(null, HEUTE)).toBeNull();
    expect(standingDays("unsinn", HEUTE)).toBeNull();
  });

  it("macht aus einem künftigen Kaufdatum keine negative Standzeit", () => {
    expect(standingDays("2026-12-01", HEUTE)).toBe(0);
  });
});

describe("isLongStanding", () => {
  it("greift genau ab der Schwelle", () => {
    expect(isLongStanding(LONG_STANDING_DAYS - 1)).toBe(false);
    expect(isLongStanding(LONG_STANDING_DAYS)).toBe(true);
  });

  it("gilt ohne Datum nicht als Langsteher", () => {
    expect(isLongStanding(null)).toBe(false);
  });
});

describe("soldStandingDays", () => {
  it("friert die Standzeit auf Kauf bis Verkauf ein", () => {
    // Läuft ausdrücklich NICHT bis heute weiter.
    expect(
      soldStandingDays(verkauf({ purchasedOn: "2026-01-10", soldOn: "2026-06-10" }))
    ).toBe(151);
  });

  it("kommt ohne Kaufdatum ohne Absturz aus", () => {
    expect(soldStandingDays(verkauf({ purchasedOn: null }))).toBeNull();
  });
});

describe("grossMarginCents", () => {
  it("rechnet Erlös minus Einkauf", () => {
    expect(
      grossMarginCents(
        verkauf({ purchasePriceCents: 4000000, salePriceCents: 4800000 })
      )
    ).toBe(800000);
  });

  it("weist auch Verluste aus", () => {
    expect(
      grossMarginCents(
        verkauf({ purchasePriceCents: 4000000, salePriceCents: 3500000 })
      )
    ).toBe(-500000);
  });

  it("schätzt nichts, wenn ein Wert fehlt", () => {
    expect(grossMarginCents(verkauf({ salePriceCents: null }))).toBeNull();
    expect(grossMarginCents(verkauf({ purchasePriceCents: null }))).toBeNull();
  });
});

describe("filterInventory", () => {
  const bestand = [
    fahrzeug({ id: "a", make: "Mercedes-Benz", model: "SL380", licensePlate: "S-MB 380H" }),
    fahrzeug({ id: "b", make: "Porsche", model: "911", licensePlate: "S-PO 911H" }),
    fahrzeug({ id: "c", make: "VW", model: "Käfer", licensePlate: null }),
  ];

  it("findet unabhängig von Schreibweise und Rand-Leerzeichen", () => {
    expect(filterInventory(bestand, "porsche").map((v) => v.id)).toEqual(["b"]);
    expect(filterInventory(bestand, "  SL380 ").map((v) => v.id)).toEqual(["a"]);
  });

  it("sucht auch im Kennzeichen und kommt ohne eines aus", () => {
    expect(filterInventory(bestand, "S-PO").map((v) => v.id)).toEqual(["b"]);
    expect(filterInventory(bestand, "käfer").map((v) => v.id)).toEqual(["c"]);
  });

  it("gibt bei leerer Suche alles zurück", () => {
    expect(filterInventory(bestand, "   ")).toHaveLength(3);
  });
});

describe("sortInventory", () => {
  const bestand = [
    fahrzeug({ id: "neu", purchasedOn: "2026-08-01" }),
    fahrzeug({ id: "ohne", purchasedOn: null }),
    fahrzeug({ id: "alt", purchasedOn: "2025-02-01" }),
  ];

  it("zeigt bei Standzeit den ältesten Zugang zuerst", () => {
    expect(sortInventory(bestand, "standing").map((v) => v.id)).toEqual([
      "alt",
      "neu",
      "ohne",
    ]);
  });

  it("zeigt bei Kaufdatum den jüngsten Zugang zuerst", () => {
    expect(sortInventory(bestand, "purchase").map((v) => v.id)).toEqual([
      "neu",
      "alt",
      "ohne",
    ]);
  });

  it("stellt Fahrzeuge ohne Kaufdatum in beiden Ordnungen ans Ende", () => {
    expect(sortInventory(bestand, "standing").at(-1)?.id).toBe("ohne");
    expect(sortInventory(bestand, "purchase").at(-1)?.id).toBe("ohne");
  });

  it("sortiert Namen mit deutscher Reihenfolge", () => {
    const list = sortInventory(
      [
        fahrzeug({ id: "c", make: "VW", model: "Käfer" }),
        fahrzeug({ id: "a", make: "Audi", model: "80" }),
        fahrzeug({ id: "b", make: "Öldtimer", model: "X" }),
      ],
      "name"
    );
    expect(list.map((v) => v.id)).toEqual(["a", "b", "c"]);
  });

  it("verändert die übergebene Liste nicht", () => {
    const original = [
      fahrzeug({ id: "b", purchasedOn: "2026-08-01" }),
      fahrzeug({ id: "a", purchasedOn: "2025-01-01" }),
    ];
    sortInventory(original, "standing");
    expect(original.map((v) => v.id)).toEqual(["b", "a"]);
  });
});

describe("summarizeSales", () => {
  it("trennt Währungen, statt sie zu summieren", () => {
    const summen = summarizeSales([
      verkauf({ currency: "EUR", purchasePriceCents: 1000, salePriceCents: 1500 }),
      verkauf({ currency: "CHF", purchasePriceCents: 2000, salePriceCents: 2200 }),
      verkauf({ currency: "EUR", purchasePriceCents: 500, salePriceCents: 900 }),
    ]);

    expect(summen).toHaveLength(2);
    const eur = summen.find((s) => s.currency === "EUR")!;
    const chf = summen.find((s) => s.currency === "CHF")!;
    expect(eur.marginCents).toBe(900);
    expect(eur.counted).toBe(2);
    expect(chf.marginCents).toBe(200);
  });

  it("zählt unvollständige Vorgänge getrennt, statt sie als Null zu werten", () => {
    const [summe] = summarizeSales([
      verkauf({ purchasePriceCents: 1000, salePriceCents: 1500 }),
      verkauf({ salePriceCents: null }),
      verkauf({ purchasePriceCents: null }),
    ]);

    expect(summe.counted).toBe(1);
    expect(summe.incomplete).toBe(2);
    expect(summe.marginCents).toBe(500);
  });

  it("liefert für eine leere Liste keine Zeilen", () => {
    expect(summarizeSales([])).toEqual([]);
  });
});

describe("Anzeigehilfen", () => {
  it("benennt die Standzeit als Text", () => {
    expect(formatStandingDays(null)).toBe("—");
    expect(formatStandingDays(0)).toBe("heute zugegangen");
    expect(formatStandingDays(1)).toBe("seit 1 Tag im Bestand");
    expect(formatStandingDays(214)).toBe("seit 214 Tagen im Bestand");
  });

  it("formatiert abgeschlossene Standzeiten knapp", () => {
    expect(formatHoldingDays(null)).toBe("—");
    expect(formatHoldingDays(1)).toBe("1 Tag");
    expect(formatHoldingDays(151)).toBe("151 Tage");
  });
});

describe("saleRemovalWording (QA BUG-5)", () => {
  it("nennt das Entfernen eines selbst gekennzeichneten Verkaufs eine Rücknahme", () => {
    const w = saleRemovalWording("manual");
    expect(w.menuLabel).toBe("Verkauf zurücknehmen");
    expect(w.actionLabel).toBe("Zurücknehmen");
    expect(w.irreversible).toBe(false);
    expect(w.successMessage).toMatch(/wieder im Bestand/);
  });

  it("nennt das Entfernen eines Übergabe-Vorgangs eine Löschung", () => {
    // Hier gibt es nichts zurückzunehmen: Das Fahrzeug gehört dem Käufer,
    // und der Einkaufspreis wurde beim Annehmen gelöscht.
    const w = saleRemovalWording("transfer");
    expect(w.menuLabel).toBe("Vorgang löschen");
    expect(w.actionLabel).toBe("Endgültig löschen");
    expect(w.irreversible).toBe(true);
    expect(w.successMessage).not.toMatch(/Bestand/);
  });

  it("verspricht nur dort eine Rückkehr in den Bestand, wo sie eintritt", () => {
    // Der Kern des Befunds: Die Zusage darf nicht für beide Fälle gelten.
    expect(saleRemovalWording("manual").successMessage).toMatch(/Bestand/);
    expect(saleRemovalWording("transfer").successMessage).not.toMatch(/Bestand/);
  });
});
