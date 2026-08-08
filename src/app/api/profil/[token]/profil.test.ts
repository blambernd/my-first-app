import { describe, it, expect } from "vitest";
import { toCurrency, formatMoney } from "@/lib/currency";

/**
 * Die Währung im öffentlichen Kurzprofil (PROJ-36 / PROJ-10).
 *
 * Das Kurzprofil ist die Stelle, an der eine falsche Währungsangabe am
 * weitesten reicht: Es ist **öffentlich**, teilbar und wird typischerweise
 * einem Kaufinteressenten vorgelegt. Bis zum 2026-08-08 stand dort ein festes
 * Euro-Zeichen an den Scheckheft-Kosten — bei einem Franken-Fahrzeug war jeder
 * dieser Beträge für jeden Betrachter falsch beschriftet.
 *
 * Die Route liest die Währung mit `toCurrency` aus der Fahrzeugzeile. Geprüft
 * wird hier dieselbe Umwandlung mit den Werten, die aus der Datenbank kommen
 * können — die Route selbst braucht einen Dienstschlüssel und ist damit im
 * Einheitentest nicht sinnvoll aufrufbar; die Seite deckt der E2E-Test ab.
 */

describe("Kurzprofil — Währung der Scheckheft-Kosten", () => {
  it("übernimmt die Währung des Fahrzeugs", () => {
    expect(toCurrency("CHF")).toBe("CHF");
    expect(formatMoney(124000, toCurrency("CHF"))).toContain("1.240,00");
    expect(formatMoney(124000, toCurrency("CHF"))).not.toContain("€");
  });

  it("zeigt Euro, wenn die Zeile keine Währung hat", () => {
    // Fahrzeuge von vor der Einführung — sie waren faktisch immer Euro.
    expect(formatMoney(124000, toCurrency(null))).toContain("€");
  });

  it("zeigt Euro statt zu scheitern, wenn ein unbekannter Code ankommt", () => {
    // Eine öffentliche Seite darf an einer Nebenangabe nicht zerbrechen. Der
    // CHECK in der Datenbank lässt so einen Wert ohnehin nicht zu; das hier
    // ist die zweite Linie.
    expect(formatMoney(124000, toCurrency("XYZ"))).toContain("€");
  });

  it("rechnet nichts um — dieselbe Zahl, andere Beschriftung", () => {
    const zahl = /1\.240,00/;
    expect(formatMoney(124000, "EUR")).toMatch(zahl);
    expect(formatMoney(124000, "CHF")).toMatch(zahl);
    expect(formatMoney(124000, "GBP")).toMatch(zahl);
  });
});
