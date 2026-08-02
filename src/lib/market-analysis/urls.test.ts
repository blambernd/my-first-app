import { describe, it, expect } from "vitest";
import { canonicalListingKey, hostMatchesSite } from "./urls";

/**
 * Regressionstests zu BUG-1 und BUG-3 (PROJ-29, QA-Runde 1).
 * Alle URLs stammen wörtlich aus dem Live-Suchlauf vom 2026-08-02.
 */

describe("canonicalListingKey — BUG-1: Länderfassungen desselben Inserats", () => {
  // Im Live-Lauf waren dies alle drei bepreisten "Vergleichsfahrzeuge" —
  // in Wahrheit ein einziges Auto.
  const gleichesInserat = [
    "https://www.classic-trader.com/de/automobile/inserat/mercedes-benz/220/220-cabriolet-a/1954/460064",
    "https://www.classic-trader.com/at/automobile/inserat/mercedes-benz/220/220-cabriolet-a/1954/460064",
    "https://www.classic-trader.com/ch/automobile/inserat/mercedes-benz/220/220-cabriolet-a/1954/460064",
  ];

  it("bildet alle Länderfassungen auf denselben Schlüssel ab", () => {
    const schluessel = new Set(gleichesInserat.map(canonicalListingKey));
    expect(schluessel.size).toBe(1);
  });

  it("hält verschiedene Inserate auseinander", () => {
    const a = canonicalListingKey(gleichesInserat[0]);
    const b = canonicalListingKey(
      "https://www.classic-trader.com/de/automobile/inserat/mercedes-benz/220/220-cabriolet-a/1952/439064"
    );
    expect(a).not.toBe(b);
  });
});

describe("canonicalListingKey — eBay-Tracking-Parameter", () => {
  it("ignoriert die angehängten Tracking-Parameter", () => {
    // eBay hängt an jede URL seitenlange Parameter; ohne deren Entfernung
    // ist jede Wiederholung derselben Anzeige ein neues "Fahrzeug".
    const a =
      "https://www.ebay.de/itm/324380025779?fits=Year%3A1952&_skw=Mercedes&hash=item4b868e63b3";
    const b = "https://www.ebay.de/itm/324380025779?_skw=anders&itmmeta=XYZ";
    expect(canonicalListingKey(a)).toBe(canonicalListingKey(b));
    expect(canonicalListingKey(a)).toBe("ebay:324380025779");
  });
});

describe("canonicalListingKey — Robustheit", () => {
  it("stürzt bei einer unbrauchbaren URL nicht ab", () => {
    expect(canonicalListingKey("nicht-wirklich-eine-url")).toBe(
      "nicht-wirklich-eine-url"
    );
  });

  it("behandelt www und Suchsubdomain gleich", () => {
    expect(canonicalListingKey("https://suchen.mobile.de/auto/bmw-z3.html")).toBe(
      canonicalListingKey("https://www.mobile.de/auto/bmw-z3.html")
    );
  });
});

describe("hostMatchesSite — BUG-3: Google hält sich nicht an site:", () => {
  it("weist einen Wikipedia-Treffer aus einer AutoScout24-Suche ab", () => {
    // Genau so geschehen: der Treffer trug anschließend das Etikett "AutoScout24"
    expect(
      hostMatchesSite("https://de.wikipedia.org/wiki/Mercedes-Benz", "autoscout24.de")
    ).toBe(false);
  });

  it("akzeptiert die Seite selbst und ihre Subdomains", () => {
    expect(hostMatchesSite("https://www.autoscout24.de/lst/bmw", "autoscout24.de")).toBe(true);
    expect(hostMatchesSite("https://suchen.mobile.de/auto/x.html", "mobile.de")).toBe(true);
  });

  it("lässt sich nicht von einem angehängten Domainnamen täuschen", () => {
    expect(hostMatchesSite("https://autoscout24.de.beispiel.com/x", "autoscout24.de")).toBe(
      false
    );
  });
});
