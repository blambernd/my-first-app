import { describe, it, expect } from "vitest";
import {
  buildDueList,
  daysUntil,
  dueLabel,
  filterVehicles,
  formatDate,
  formatDueDistance,
  formatMileage,
  isOverdue,
  sortVehicles,
  vehicleLabel,
  type WorkshopDue,
  type WorkshopVehicle,
} from "./workshop-dashboard";

const TODAY = new Date("2026-09-06T14:30:00Z");

function due(overrides: Partial<WorkshopDue> = {}): WorkshopDue {
  return {
    vehicleId: "v1",
    vehicleLabel: "Porsche 911 (1973)",
    label: "TÜV/HU",
    dueDate: "2026-10-01",
    source: "vehicle_due_date",
    ...overrides,
  };
}

function vehicle(overrides: Partial<WorkshopVehicle> = {}): WorkshopVehicle {
  return {
    id: "v1",
    make: "Porsche",
    model: "911",
    year: 1973,
    licensePlate: "S-PO 911H",
    currency: "EUR",
    lastMileageKm: 87450,
    lastEntryDate: "2026-04-12",
    ownEntryCount: 2,
    ownCostCents: 45000,
    nextDue: null,
    ...overrides,
  };
}

describe("daysUntil", () => {
  it("zählt Kalendertage, nicht Zeitspannen", () => {
    expect(daysUntil("2026-09-06", TODAY)).toBe(0);
    expect(daysUntil("2026-09-07", TODAY)).toBe(1);
    expect(daysUntil("2026-09-05", TODAY)).toBe(-1);
  });

  it("liefert für unbrauchbare Daten keinen Treffer statt eines Absturzes", () => {
    expect(daysUntil("keinDatum", TODAY)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("isOverdue", () => {
  it("ist am Fälligkeitstag noch nicht überfällig", () => {
    expect(isOverdue("2026-09-06", TODAY)).toBe(false);
    expect(isOverdue("2026-09-05", TODAY)).toBe(true);
  });
});

describe("buildDueList", () => {
  it("sortiert aufsteigend, überfällige stehen dadurch oben", () => {
    const list = buildDueList(
      [
        due({ dueDate: "2026-10-01", label: "Inspektion" }),
        due({ dueDate: "2026-07-01", label: "TÜV/HU" }),
        due({ dueDate: "2026-09-20", label: "Ölwechsel" }),
      ],
      TODAY
    );

    expect(list.map((d) => d.label)).toEqual([
      "TÜV/HU",
      "Ölwechsel",
      "Inspektion",
    ]);
  });

  it("blendet Termine jenseits der Vorausschau aus", () => {
    const list = buildDueList(
      [due({ dueDate: "2026-11-30" }), due({ dueDate: "2027-06-01" })],
      TODAY
    );

    expect(list).toHaveLength(1);
    expect(list[0].dueDate).toBe("2026-11-30");
  });

  it("behält weit zurückliegende Termine — sie sind der Grund für die Liste", () => {
    const list = buildDueList([due({ dueDate: "2023-02-14" })], TODAY);
    expect(list).toHaveLength(1);
  });

  it("fasst denselben Termin aus beiden Quellen zusammen (QA BUG-5)", () => {
    // Die HU steht oft doppelt: als Folgetermin am Scheckheft-Eintrag und als
    // Fahrzeugtermin. Zwei identische Zeilen lesen sich wie zwei Termine.
    const list = buildDueList(
      [
        due({ dueDate: "2027-03-12", label: "TÜV/HU", source: "service_entry" }),
        due({
          dueDate: "2027-03-12",
          label: "TÜV/HU",
          source: "vehicle_due_date",
        }),
      ],
      TODAY,
      400
    );

    expect(list).toHaveLength(1);
  });

  it("behält gleiche Termine verschiedener Fahrzeuge", () => {
    const list = buildDueList(
      [
        due({ vehicleId: "a", dueDate: "2026-10-01", label: "TÜV/HU" }),
        due({ vehicleId: "b", dueDate: "2026-10-01", label: "TÜV/HU" }),
      ],
      TODAY
    );

    expect(list).toHaveLength(2);
  });

  it("behält verschiedene Arbeiten am selben Tag", () => {
    const list = buildDueList(
      [
        due({ dueDate: "2026-10-01", label: "TÜV/HU" }),
        due({ dueDate: "2026-10-01", label: "Ölwechsel" }),
      ],
      TODAY
    );

    expect(list).toHaveLength(2);
  });

  it("sortiert gleiche Daten stabil nach Fahrzeugnamen", () => {
    // Die Kennungen müssen sich unterscheiden, weil sich auch die Fahrzeuge
    // unterscheiden: Der Name wird aus der Kennung abgeleitet, zwei Namen
    // unter einer Kennung gibt es nicht. Ohne diese Trennung sah die
    // Zusammenfassung aus QA BUG-5 hier zwei Einträge desselben Termins.
    const list = buildDueList(
      [
        due({
          vehicleId: "vw",
          dueDate: "2026-09-10",
          vehicleLabel: "VW Käfer (1968)",
        }),
        due({
          vehicleId: "audi",
          dueDate: "2026-09-10",
          vehicleLabel: "Audi 80 (1979)",
        }),
      ],
      TODAY
    );

    expect(list.map((d) => d.vehicleLabel)).toEqual([
      "Audi 80 (1979)",
      "VW Käfer (1968)",
    ]);
  });
});

describe("filterVehicles", () => {
  const vehicles = [
    vehicle({ id: "a", make: "Porsche", model: "911", licensePlate: "S-PO 911H" }),
    vehicle({ id: "b", make: "Mercedes", model: "W123", licensePlate: "M-BZ 123H" }),
    vehicle({ id: "c", make: "VW", model: "Käfer", licensePlate: null }),
  ];

  it("findet unabhängig von Groß- und Kleinschreibung", () => {
    expect(filterVehicles(vehicles, "porsche").map((v) => v.id)).toEqual(["a"]);
    expect(filterVehicles(vehicles, "W123").map((v) => v.id)).toEqual(["b"]);
  });

  it("ignoriert Leerzeichen an den Rändern", () => {
    expect(filterVehicles(vehicles, "  w123 ").map((v) => v.id)).toEqual(["b"]);
  });

  it("sucht auch im Kennzeichen und kommt ohne eines aus", () => {
    expect(filterVehicles(vehicles, "M-BZ").map((v) => v.id)).toEqual(["b"]);
    expect(filterVehicles(vehicles, "käfer").map((v) => v.id)).toEqual(["c"]);
  });

  it("gibt bei leerer Suche alles zurück", () => {
    expect(filterVehicles(vehicles, "   ")).toHaveLength(3);
  });
});

describe("sortVehicles", () => {
  it("sortiert nach Fälligkeit und stellt Fahrzeuge ohne Termin ans Ende", () => {
    const list = sortVehicles(
      [
        vehicle({ id: "ohne", nextDue: null }),
        vehicle({ id: "spaet", nextDue: due({ dueDate: "2026-12-01" }) }),
        vehicle({ id: "frueh", nextDue: due({ dueDate: "2026-07-01" }) }),
      ],
      "due"
    );

    expect(list.map((v) => v.id)).toEqual(["frueh", "spaet", "ohne"]);
  });

  it("sortiert nach letztem Eintrag absteigend, Fahrzeuge ohne Eintrag ans Ende", () => {
    const list = sortVehicles(
      [
        vehicle({ id: "alt", lastEntryDate: "2024-01-01" }),
        vehicle({ id: "ohne", lastEntryDate: null }),
        vehicle({ id: "neu", lastEntryDate: "2026-08-01" }),
      ],
      "recent"
    );

    expect(list.map((v) => v.id)).toEqual(["neu", "alt", "ohne"]);
  });

  it("sortiert nach Namen mit deutscher Sortierreihenfolge", () => {
    const list = sortVehicles(
      [
        vehicle({ id: "c", make: "VW", model: "Käfer" }),
        vehicle({ id: "a", make: "Audi", model: "80" }),
        vehicle({ id: "b", make: "Öldtimer", model: "X" }),
      ],
      "name"
    );

    expect(list.map((v) => v.id)).toEqual(["a", "b", "c"]);
  });

  it("verändert die übergebene Liste nicht", () => {
    const original = [
      vehicle({ id: "b", make: "VW" }),
      vehicle({ id: "a", make: "Audi" }),
    ];
    sortVehicles(original, "name");
    expect(original.map((v) => v.id)).toEqual(["b", "a"]);
  });
});

describe("Anzeigehilfen", () => {
  it("formatiert Datum deutsch und fängt Leerwerte ab", () => {
    expect(formatDate("2026-03-12")).toBe("12.3.2026");
    expect(formatDate(null)).toBe("—");
    expect(formatDate("unsinn")).toBe("—");
  });

  it("formatiert Kilometerstände mit Tausenderpunkt", () => {
    expect(formatMileage(87450)).toBe("87.450 km");
    expect(formatMileage(null)).toBe("—");
  });

  it("benennt Überfälligkeit als Text, nicht nur als Farbe", () => {
    expect(formatDueDistance("2026-09-06", TODAY)).toBe("heute fällig");
    expect(formatDueDistance("2026-09-05", TODAY)).toBe("seit 1 Tag überfällig");
    expect(formatDueDistance("2026-08-25", TODAY)).toBe("seit 12 Tagen überfällig");
    expect(formatDueDistance("2026-09-07", TODAY)).toBe("in 1 Tag");
    expect(formatDueDistance("2026-10-10", TODAY)).toBe("in 34 Tagen");
  });
});

describe("dueLabel", () => {
  it("übersetzt Fahrzeugtermine", () => {
    expect(dueLabel("vehicle_due_date", "tuv_hu")).toBe("TÜV/HU");
    expect(dueLabel("vehicle_due_date", "service")).toBe("Service");
  });

  it("übersetzt Scheckheft-Typen über die bestehende Zuordnung", () => {
    expect(dueLabel("service_entry", "inspection")).toBe("Inspektion");
    expect(dueLabel("service_entry", "oil_change")).toBe("Ölwechsel");
    expect(dueLabel("service_entry", "tuv_hu")).toBe("TÜV/HU");
  });

  it("reicht unbekannte Schlüssel durch, statt sie zu verschlucken", () => {
    expect(dueLabel("vehicle_due_date", "hauptbremse")).toBe("hauptbremse");
    expect(dueLabel("service_entry", "unbekannt")).toBe("unbekannt");
  });
});

describe("vehicleLabel", () => {
  it("nennt das Baujahr, wenn es erfasst ist", () => {
    expect(vehicleLabel({ make: "Porsche", model: "911", year: 1973 })).toBe(
      "Porsche 911 (1973)"
    );
    expect(vehicleLabel({ make: "VW", model: "Käfer", year: null })).toBe(
      "VW Käfer"
    );
  });
});
