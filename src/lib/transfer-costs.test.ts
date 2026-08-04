import { describe, it, expect } from "vitest";
import {
  buildCostCsv,
  describeStock,
  exportFilename,
  hasAnything,
  LEERER_BESTAND,
  type CostStock,
} from "./transfer-costs";

function bestand(teil: Partial<CostStock>): CostStock {
  return { ...LEERER_BESTAND, ...teil };
}

describe("hasAnything", () => {
  it("meldet nichts zu verlieren bei leerem Bestand", () => {
    expect(hasAnything(LEERER_BESTAND)).toBe(false);
  });

  it("erkennt jeden einzelnen Bestand", () => {
    const felder: Array<Partial<CostStock>> = [
      { hasPurchase: true },
      { purchaseExtras: 1 },
      { recurring: 1 },
      { oneOff: 1 },
      { marketValues: 1 },
      { serviceWithCost: 1 },
      { fuelWithCost: 1 },
    ];
    for (const f of felder) {
      expect(hasAnything(bestand(f)), JSON.stringify(f)).toBe(true);
    }
  });
});

describe("describeStock", () => {
  it("nennt echte Anzahlen statt allgemeiner Rede", () => {
    const posten = describeStock(bestand({ recurring: 14, oneOff: 23 }));
    expect(posten.map((p) => p.label)).toEqual([
      "14 laufende Kostenpositionen",
      "23 Einzelkosten-Einträge",
    ]);
  });

  it("beugt die Einzahl richtig", () => {
    const posten = describeStock(
      bestand({ recurring: 1, oneOff: 1, marketValues: 1 })
    );
    expect(posten.map((p) => p.label)).toEqual([
      "1 eingetragener Marktwert",
      "1 laufende Kostenposition",
      "1 Einzelkosten-Eintrag",
    ]);
  });

  it("lässt leere Bestände weg", () => {
    // Wer nie getankt hat, braucht keine Zeile über Tankbelege
    const posten = describeStock(bestand({ recurring: 3 }));
    expect(posten).toHaveLength(1);
  });

  it("führt Kaufpreis und Nebenkosten zusammen", () => {
    const posten = describeStock(bestand({ hasPurchase: true, purchaseExtras: 3 }));
    expect(posten[0].label).toBe("Kaufpreis und 3 Nebenkosten-Posten");
  });

  it("nennt den Kaufpreis allein, wenn es keine Nebenkosten gibt", () => {
    const posten = describeStock(bestand({ hasPurchase: true }));
    expect(posten[0].label).toBe("Kaufpreis");
  });

  it("kennzeichnet Scheckheft und Tankbuch als Nur-Betrag", () => {
    const posten = describeStock(
      bestand({ recurring: 2, serviceWithCost: 5, fuelWithCost: 9 })
    );
    expect(posten.filter((p) => p.onlyAmount).map((p) => p.label)).toEqual([
      "Beträge aus 5 Scheckheft-Einträgen",
      "Beträge aus 9 Tankvorgängen",
    ]);
    // Die gelöschten Bereiche dürfen nicht als „nur Betrag" erscheinen
    expect(posten.find((p) => p.label.includes("laufende"))?.onlyAmount).toBe(false);
  });
});

describe("buildCostCsv", () => {
  const zeile = {
    bereich: "Einzelkosten",
    datum: "2024-03-07",
    bezeichnung: "Vergaser",
    amountCents: 124000,
  };

  it("beginnt mit dem BOM, sonst zerfallen die Umlaute in Excel", () => {
    expect(buildCostCsv([zeile]).charCodeAt(0)).toBe(0xfeff);
  });

  it("trennt mit Semikolon", () => {
    const csv = buildCostCsv([zeile]);
    expect(csv).toContain("Bereich;Datum;Bezeichnung;Betrag (EUR);Anmerkung");
  });

  it("schreibt den Betrag als deutsche Zahl ohne Währung", () => {
    // Mit Tausenderpunkt oder Eurozeichen wäre es Text und ließe sich nicht
    // summieren — genau das ist der Zweck des Exports
    expect(buildCostCsv([zeile])).toContain(";1240,00;");
  });

  it("füllt Cent auf zwei Stellen auf", () => {
    expect(buildCostCsv([{ ...zeile, amountCents: 705 }])).toContain(";7,05;");
    expect(buildCostCsv([{ ...zeile, amountCents: 700 }])).toContain(";7,00;");
    expect(buildCostCsv([{ ...zeile, amountCents: 7 }])).toContain(";0,07;");
  });

  it("behandelt negative Beträge mit dem Vorzeichen vorne", () => {
    expect(buildCostCsv([{ ...zeile, amountCents: -1250 }])).toContain(";-12,50;");
  });

  it("schreibt das Datum deutsch", () => {
    expect(buildCostCsv([zeile])).toContain(";07.03.2024;");
  });

  it("lässt ein fehlendes Datum leer statt einen Platzhalter zu erfinden", () => {
    const csv = buildCostCsv([{ ...zeile, datum: "" }]);
    expect(csv).toContain("Einzelkosten;;Vergaser");
  });

  it("maskiert Semikolons im Text — sonst verrutscht die ganze Tabelle", () => {
    const csv = buildCostCsv([
      { ...zeile, bezeichnung: "Bremse vorn; hinten" },
    ]);
    expect(csv).toContain('"Bremse vorn; hinten"');
  });

  it("verdoppelt Anführungszeichen nach RFC 4180", () => {
    const csv = buildCostCsv([
      { ...zeile, anmerkung: 'Werkstatt "Zum Kolben"' },
    ]);
    expect(csv).toContain('"Werkstatt ""Zum Kolben"""');
  });

  it("maskiert Zeilenumbrüche in Notizen", () => {
    const csv = buildCostCsv([{ ...zeile, anmerkung: "Zeile 1\nZeile 2" }]);
    expect(csv).toContain('"Zeile 1\nZeile 2"');
  });

  it("trennt Zeilen mit CRLF für Excel unter Windows", () => {
    const csv = buildCostCsv([zeile, zeile]);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(3); // Kopf + 2
  });

  it("liefert bei leerer Liste nur die Kopfzeile", () => {
    const csv = buildCostCsv([]);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(1);
  });

  it("schneidet nichts ab — auch bei sehr vielen Positionen", () => {
    // Bei einer Restaurierung sind mehrere hundert Positionen realistisch
    const viele = Array.from({ length: 750 }, (_, i) => ({
      ...zeile,
      bezeichnung: `Position ${i}`,
    }));
    expect(buildCostCsv(viele).split("\r\n").filter(Boolean)).toHaveLength(751);
  });
});

describe("exportFilename", () => {
  const tag = new Date("2026-08-04T10:00:00Z");

  it("enthält Fahrzeug und Datum", () => {
    expect(exportFilename("Mercedes-Benz SL 1970", tag)).toBe(
      "Kostendaten-Mercedes-Benz-SL-1970-2026-08-04.csv"
    );
  });

  it("entfernt Zeichen, die Dateisysteme stören", () => {
    const name = exportFilename('Auto/mit\\Zeichen: "x"', tag);
    expect(name).not.toMatch(/[/\\:"]/);
  });

  it("behält Umlaute — sie sind in Dateinamen unproblematisch", () => {
    expect(exportFilename("Käfer", tag)).toContain("Käfer");
  });

  it("fällt auf einen Ersatznamen zurück, wenn nichts übrig bleibt", () => {
    expect(exportFilename("///", tag)).toBe("Kostendaten-Fahrzeug-2026-08-04.csv");
  });
});
