import { describe, it, expect } from "vitest";
import {
  classifyResultPage,
  isAggregatePage,
  extractVehicleAttributes,
  hasVehicleAttributes,
} from "./classification";

/**
 * Regressionstests aus echten Produktionsdaten (PROJ-29).
 *
 * Titel und URLs stammen wörtlich aus der Tabelle `market_analyses` — aus
 * Analysen, die dem Nutzer bereits angezeigt wurden. Genau diese Treffer sind
 * bisher als "Vergleichsfahrzeug" in Median und Preisspanne eingeflossen.
 */

/** Übersichtsseiten, die bisher als Fahrzeug gezählt wurden. */
const UEBERSICHTSSEITEN = [
  {
    titel: "264 Mercedes-Benz 220 Limousine Gebrauchtwagen",
    url: "https://suchen.mobile.de/auto/mercedes-benz-220-mannheim.html",
  },
  {
    titel: "10 gebrauchte Mercedes-Benz 220 aus dem Jahr 1960",
    url: "https://suchen.mobile.de/auto/mercedes-benz-220-cabrio-220se.html",
  },
  {
    titel: "BMW Z3 Hardtop gebraucht kaufen",
    url: "https://suchen.mobile.de/auto/bmw-z3-hardtop.html",
  },
  {
    titel: "Mercedes-Benz 220 Oldtimer gebraucht kaufen bei AutoScout24",
    url: "https://www.autoscout24.de/lst/mercedes-benz/220",
  },
  {
    titel: "Mercedes-Benz 220 kaufen — Classic Trader",
    url: "https://www.classic-trader.com/de/automobile/suche/mercedes-benz/220",
  },
  {
    titel: "Mercedes-Benz 220 for sale",
    url: "https://www.classic-trader.com/uk/cars/search/mercedes-benz/220",
  },
];

/** Echte Detailseiten, die erhalten bleiben müssen. */
const DETAILSEITEN = [
  {
    titel: "Mercedes-Benz 220 Cabriolet B (1951) angeboten für 75.000",
    url: "https://www.classic-trader.com/de/automobile/inserat/mercedes-benz/220/1951/123456",
  },
  {
    titel: "Zu Verkaufen: Mercedes-Benz 220 Cabriolet A (1952) ...",
    url: "https://www.classic-trader.com/de/automobile/inserat/mercedes-benz/220/1952/234567",
  },
  {
    titel: "Mercedes-Benz 220 Coupe (1954) angeboten für 218.000",
    url: "https://www.classic-trader.com/de/automobile/inserat/mercedes-benz/220/1954/345678",
  },
  {
    titel: "Mercedes Benz 220 S Ponton Cabriolet 1958",
    url: "https://www.ebay.de/itm/226012345678",
  },
];

describe("classifyResultPage — Übersichtsseiten (Hauptbefund PROJ-29)", () => {
  for (const { titel, url } of UEBERSICHTSSEITEN) {
    it(`erkennt „${titel}“ als Übersichtsseite`, () => {
      expect(classifyResultPage(url, titel)).toBe("uebersichtsseite");
    });
  }

  it("erkennt jede mobile.de-Suchseite, auch ohne verräterischen Titel", () => {
    // In den Produktionsdaten lagen ALLE 141 mobile.de-Treffer auf suchen.mobile.de
    expect(isAggregatePage("https://suchen.mobile.de/auto/bmw-z3.html", "BMW Z3")).toBe(true);
  });

  it("erkennt AutoScout24-Listenseiten", () => {
    // 52 von 60 AutoScout24-Treffern lagen unter /lst/, kein einziger auf einer Detailseite
    expect(isAggregatePage("https://www.autoscout24.de/lst/bmw/z3", "BMW Z3")).toBe(true);
  });
});

describe("classifyResultPage — Detailseiten bleiben erhalten", () => {
  for (const { titel, url } of DETAILSEITEN) {
    it(`erkennt „${titel}“ als Detailseite`, () => {
      expect(classifyResultPage(url, titel)).toBe("detailseite");
    });
  }

  it("lässt die URL über den Titel entscheiden", () => {
    // "Zu Verkaufen: ..." enthält das Wort "verkaufen" — die URL ist eindeutiger
    expect(
      classifyResultPage(
        "https://www.classic-trader.com/de/automobile/inserat/mercedes-benz/220/1952/1",
        "Zu Verkaufen: 3 Mercedes-Benz 220 Cabriolet"
      )
    ).toBe("detailseite");
  });
});

describe("classifyResultPage — unbekannte Muster", () => {
  it("stuft eine unbekannte URL nicht vorschnell ein", () => {
    expect(classifyResultPage("https://www.oldtimer-shop.de/fahrzeug/4711", "Mercedes 220")).toBe(
      "unbekannt"
    );
  });
});

describe("extractVehicleAttributes", () => {
  it("liest das Baujahr aus der Klammerschreibweise", () => {
    expect(extractVehicleAttributes("Mercedes-Benz 220 Coupe (1954)").baujahr).toBe(1954);
  });

  it("verwechselt die Modellbezeichnung nicht mit dem Baujahr", () => {
    // "220" darf nicht als Jahr durchgehen
    expect(extractVehicleAttributes("Mercedes-Benz 220 Cabriolet").baujahr).toBeNull();
  });

  it("liest die Laufleistung mit deutschem Tausenderpunkt", () => {
    expect(extractVehicleAttributes("Ponton, 87.500 km, gepflegt").laufleistungKm).toBe(87500);
  });

  it("liest die Leistung in PS und kW", () => {
    expect(extractVehicleAttributes("220 S, 106 PS").leistungPs).toBe(106);
    expect(extractVehicleAttributes("220 S, 78 kW").leistungPs).toBe(78);
  });

  it("liest den Hubraum", () => {
    expect(extractVehicleAttributes("Reihensechszylinder, 2195 ccm").hubraumCcm).toBe(2195);
  });

  it("weist ein unmögliches Baujahr ab", () => {
    expect(extractVehicleAttributes("Replika (1802)").baujahr).toBeNull();
  });
});

describe("hasVehicleAttributes", () => {
  it("akzeptiert ein Inserat, das nur das Baujahr nennt", () => {
    // Oldtimer-Inserate verschweigen die Laufleistung häufig
    expect(hasVehicleAttributes("Mercedes-Benz 220 Cabriolet A (1952)")).toBe(true);
  });

  it("verwirft einen Treffer ganz ohne Fahrzeugdaten", () => {
    expect(hasVehicleAttributes("Mercedes-Benz 220 — jetzt entdecken")).toBe(false);
  });

  it("erkennt Merkmale auch nur im Snippet", () => {
    expect(hasVehicleAttributes("Mercedes-Benz 220", "Erstzulassung 1956, 92.000 km")).toBe(true);
  });
});

/**
 * Nachträge aus dem Live-Suchlauf vom 2026-08-02 (QA-Runde 1).
 */
describe("Fundstücke aus dem Live-Lauf", () => {
  it("erkennt die AutoScout24-Modellseite als Übersichtsseite (BUG-3)", () => {
    // "Mercedes-Benz 220 - Infos, Preise, Alternativen" — redaktionelle Seite,
    // war als Vergleichsfahrzeug in der Auswertung gelandet
    expect(
      isAggregatePage(
        "https://www.autoscout24.de/auto/mercedes-benz/mercedes-benz-220/?srsltid=AfmBOop3",
        "Mercedes-Benz 220 - Infos, Preise, Alternativen - AutoScout24"
      )
    ).toBe(true);
  });

  it("erkennt die mobile.de-Trefferliste mit führender Zahl", () => {
    expect(
      isAggregatePage(
        "https://suchen.mobile.de/auto/mercedes-benz-220-cabrio.html",
        "3 Mercedes-Benz 220 Cabrio W 187 a mit Benzin-Antrieb"
      )
    ).toBe(true);
  });

  it("lässt eine echte Classic-Trader-Detailseite unangetastet", () => {
    expect(
      isAggregatePage(
        "https://www.classic-trader.com/de/automobile/inserat/mercedes-benz/220/220-cabriolet-a/1954/460064",
        "Mercedes-Benz 220 Cabriolet A (1954) angeboten für 81.900"
      )
    ).toBe(false);
  });
});
