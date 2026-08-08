import { describe, it, expect } from "vitest";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  EXTERNAL_CURRENCY,
  formatMoney,
  formatMoneyUnits,
  getCurrencyLabel,
  getCurrencyName,
  getCurrencySymbol,
  toCurrency,
} from "./currency";

// Die Tests zu `formatCentsToEur` standen bis zum 2026-08-07 in
// validations/service-entry.test.ts und sind mit der Funktion hierher
// umgezogen (PROJ-36).

describe("formatMoney", () => {
  it("formatiert 14990 Cent als Euro", () => {
    const result = formatMoney(14990, "EUR");
    expect(result).toContain("149,90");
    expect(result).toContain("€");
  });

  it("formatiert 0", () => {
    expect(formatMoney(0, "EUR")).toContain("0,00");
  });

  it("formatiert 1 Cent", () => {
    expect(formatMoney(1, "EUR")).toContain("0,01");
  });

  it("formatiert negative Beträge", () => {
    // Die Wertentwicklung zeigt Verluste; ohne Vorzeichen läse sich ein
    // Minus als Gewinn.
    expect(formatMoney(-14990, "EUR")).toContain("149,90");
    expect(formatMoney(-14990, "EUR")).toMatch(/-|−/);
  });

  it("beschriftet denselben Betrag je nach Währung anders", () => {
    // Der Kern von PROJ-36: Die Zahl bleibt, die Aussage ändert sich.
    const eur = formatMoney(100000, "EUR");
    const chf = formatMoney(100000, "CHF");
    expect(eur).not.toBe(chf);
    expect(eur).toContain("1.000,00");
    expect(chf).toContain("1.000,00");
  });

  it("bleibt bei deutscher Zahlenformatierung, auch bei Fremdwährung", () => {
    // Punkt als Tausender-, Komma als Dezimaltrenner — die Anwendung gibt es
    // nur auf Deutsch, ein Franken-Betrag wird hier also deutsch geschrieben.
    const result = formatMoney(123456789, "CHF");
    expect(result).toContain("1.234.567,89");
  });

  it("kann jede der neun Währungen formatieren", () => {
    for (const { code } of CURRENCIES) {
      const result = formatMoney(150, code);
      expect(result).toContain("1,50");
      expect(result.length).toBeGreaterThan(4);
    }
  });
});

describe("formatMoneyUnits", () => {
  it("nimmt ganze Einheiten statt Kleinsteinheiten", () => {
    // Für die Marktanalyse (PROJ-11), die als einzige in Euro statt in Cent
    // rechnet.
    expect(formatMoneyUnits(1500, "EUR")).toContain("1.500");
  });
});

describe("toCurrency", () => {
  it("übernimmt bekannte Codes unverändert", () => {
    expect(toCurrency("CHF")).toBe("CHF");
    expect(toCurrency("GBP")).toBe("GBP");
  });

  it("macht aus null die Vorgabe", () => {
    // Zeilen von vor der Einführung haben keine Währung — sie waren faktisch
    // immer Euro.
    expect(toCurrency(null)).toBe("EUR");
    expect(toCurrency(undefined)).toBe("EUR");
    expect(toCurrency("")).toBe("EUR");
  });

  it("macht aus einem unbekannten Code die Vorgabe statt zu scheitern", () => {
    // Die Alternative wäre eine Seite, die gar nicht lädt.
    expect(toCurrency("XYZ")).toBe("EUR");
    expect(toCurrency("eur")).toBe("EUR"); // Groß-/Kleinschreibung zählt
  });
});

describe("Währungsliste", () => {
  it("enthält genau die neun festgelegten Währungen", () => {
    expect(CURRENCIES.map((c) => c.code)).toEqual([
      "EUR",
      "CHF",
      "GBP",
      "USD",
      "SEK",
      "DKK",
      "NOK",
      "PLN",
      "CZK",
    ]);
  });

  it("beginnt mit EUR — das ist zugleich die Vorgabe", () => {
    expect(CURRENCIES[0].code).toBe(DEFAULT_CURRENCY);
    expect(DEFAULT_CURRENCY).toBe("EUR");
  });

  it("hat für jede Währung einen deutschen Klartextnamen", () => {
    for (const { code, name } of CURRENCIES) {
      expect(name.length).toBeGreaterThan(3);
      expect(getCurrencyName(code)).toBe(name);
    }
  });

  it("baut Auswahl-Beschriftungen aus Code und Name", () => {
    // Nur das Symbol reicht nicht: „kr" steht für drei verschiedene Kronen.
    expect(getCurrencyLabel("CHF")).toBe("CHF — Schweizer Franken");
    expect(getCurrencyLabel("SEK")).toBe("SEK — Schwedische Krone");
  });

  it("hat keine doppelten Codes", () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("getCurrencySymbol", () => {
  it("liefert für jede Währung ein nicht-leeres Zeichen", () => {
    // Steht am Eingabefeld, bevor der Nutzer tippt. Wo es kein echtes Symbol
    // gibt, liefert der Browser den Code — beides ist brauchbar.
    for (const { code } of CURRENCIES) {
      expect(getCurrencySymbol(code).length).toBeGreaterThan(0);
    }
  });

  it("liefert € für Euro", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
  });

  it("enthält keine Ziffern", () => {
    for (const { code } of CURRENCIES) {
      expect(getCurrencySymbol(code)).not.toMatch(/\d/);
    }
  });
});

describe("EXTERNAL_CURRENCY", () => {
  it("ist Euro und bleibt es", () => {
    // Ersatzteil-Angebote (PROJ-9) und Marktpreis-Analyse (PROJ-11) stammen
    // aus dem deutschen Markt. Sie bei einem Franken-Fahrzeug als Franken zu
    // beschriften wäre eine falsche Behauptung über einen fremden Marktplatz.
    expect(EXTERNAL_CURRENCY).toBe("EUR");
  });
});

describe("formatMoneyUnits — runde Schwellenwerte", () => {
  it("lässt Nachkommastellen auf Wunsch weg", () => {
    // „Preise unter 500,00 €" liest sich wie ein exakter Betrag; gemeint ist
    // eine runde Grenze. Der PROJ-33-Test hing an genau dieser Schreibweise.
    // Bewusst mit \s: Intl setzt zwischen Zahl und Zeichen ein geschütztes
    // Leerzeichen (U+00A0), kein gewöhnliches. Ein Vergleich auf „500 €" mit
    // normalem Leerzeichen scheitert und sieht dabei aus wie ein Gleichstand.
    expect(formatMoneyUnits(500, "EUR", { ohneNachkomma: true })).toMatch(
      /^500\s€$/
    );
    expect(formatMoneyUnits(500, "EUR")).toContain("500,00");
  });

  it("gilt auch für große Grenzen", () => {
    expect(formatMoneyUnits(2_000_000, "EUR", { ohneNachkomma: true })).toContain(
      "2.000.000"
    );
    expect(
      formatMoneyUnits(2_000_000, "EUR", { ohneNachkomma: true })
    ).not.toContain(",00");
  });
});
