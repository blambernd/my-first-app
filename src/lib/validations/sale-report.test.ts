import { describe, it, expect } from "vitest";
import {
  KM_OBERGRENZE,
  MAX_PREIS_EUR,
  MIN_PREIS_EUR,
  ablehnungsText,
  kmKlasse,
  kmKlasseLabel,
  pruefeFuerAuswertung,
  saleReportSchema,
  verkaufsmonat,
  type SaleReportInput,
} from "./sale-report";

function eingabe(teil: Partial<SaleReportInput> = {}): SaleReportInput {
  return {
    purchase_price_eur: 18500,
    condition_grade: 2,
    mileage_km: 52000,
    share_anonymously: true,
    ...teil,
  };
}

describe("kmKlasse", () => {
  it("ordnet einem 25.000er-Schritt zu und gibt die Untergrenze zurück", () => {
    expect(kmKlasse(0)).toBe(0);
    expect(kmKlasse(24_999)).toBe(0);
    expect(kmKlasse(25_000)).toBe(25_000);
    expect(kmKlasse(52_000)).toBe(50_000);
    expect(kmKlasse(54_000)).toBe(50_000);
  });

  it("legt 52.000 und 54.000 km in dieselbe Klasse", () => {
    // Genau der Zweck der Vergröberung: Die beiden sind praktisch
    // gleichwertig, und zusammen erreichen sie die Mindestzahl eher
    expect(kmKlasse(52_000)).toBe(kmKlasse(54_000));
  });

  it("fasst alles oberhalb der Obergrenze zusammen", () => {
    // Weitere Schritte blieben leer, und als Preismerkmal ist die
    // Laufleistung dort ohnehin stumpf
    expect(kmKlasse(250_000)).toBe(KM_OBERGRENZE);
    expect(kmKlasse(400_000)).toBe(KM_OBERGRENZE);
    expect(kmKlasse(1_000_000)).toBe(KM_OBERGRENZE);
  });

  it("gibt nie den Einzelwert zurück", () => {
    // Der Einzelwert wäre ein Wiedererkennungsmerkmal
    for (const km of [1, 12_345, 52_001, 99_999]) {
      expect(kmKlasse(km) % 25_000).toBe(0);
    }
  });
});

describe("kmKlasseLabel", () => {
  it("beschriftet eine Klasse als Spanne", () => {
    expect(kmKlasseLabel(50_000)).toBe("50.000–75.000 km");
  });

  it("beschriftet die oberste Klasse offen", () => {
    expect(kmKlasseLabel(250_000)).toBe("über 250.000 km");
  });
});

describe("verkaufsmonat", () => {
  it("gibt nur Monat und Jahr zurück, nie den Tag", () => {
    // Ein tagesgenauer Zeitpunkt neben einem tagesgenauen Transfer wäre eine
    // Zuordnung, auch ohne gemeinsame Kennung
    expect(verkaufsmonat(new Date("2026-08-04T13:45:00Z"))).toBe("2026-08");
  });

  it("füllt einstellige Monate auf", () => {
    expect(verkaufsmonat(new Date("2026-01-31T00:00:00Z"))).toBe("2026-01");
  });
});

describe("pruefeFuerAuswertung", () => {
  it("lässt eine vollständige, plausible Angabe durch", () => {
    expect(pruefeFuerAuswertung(eingabe())).toBeNull();
  });

  it("weist eine Schenkung ab, ohne den Kaufpreis infrage zu stellen", () => {
    // 0 € ist ein richtiger Kaufpreis für die eigene Wertentwicklung — aber
    // kein Marktpreis, und er würde die Übersicht verziehen
    expect(pruefeFuerAuswertung(eingabe({ purchase_price_eur: 0 }))).toBe(
      "kein-preis"
    );
    expect(
      pruefeFuerAuswertung(eingabe({ purchase_price_eur: undefined }))
    ).toBe("kein-preis");
  });

  it("fängt Vertipper um Zehnerpotenzen an beiden Enden", () => {
    expect(
      pruefeFuerAuswertung(eingabe({ purchase_price_eur: MIN_PREIS_EUR - 1 }))
    ).toBe("preis-zu-niedrig");
    expect(
      pruefeFuerAuswertung(eingabe({ purchase_price_eur: MAX_PREIS_EUR + 1 }))
    ).toBe("preis-zu-hoch");
  });

  it("lässt die Grenzwerte selbst zu", () => {
    expect(
      pruefeFuerAuswertung(eingabe({ purchase_price_eur: MIN_PREIS_EUR }))
    ).toBeNull();
    expect(
      pruefeFuerAuswertung(eingabe({ purchase_price_eur: MAX_PREIS_EUR }))
    ).toBeNull();
  });

  it("verlangt eine Zustandsnote", () => {
    // Ein Concours-Fahrzeug und ein Restaurierungsobjekt sind nicht dasselbe
    expect(pruefeFuerAuswertung(eingabe({ condition_grade: undefined }))).toBe(
      "keine-zustandsnote"
    );
  });

  it("verlangt einen Kilometerstand", () => {
    expect(pruefeFuerAuswertung(eingabe({ mileage_km: undefined }))).toBe(
      "kein-kilometerstand"
    );
  });

  it("nennt zuerst den Preis, wenn mehreres fehlt", () => {
    // Die Reihenfolge bestimmt, was der Nutzer als Erstes liest — der Preis
    // ist die Angabe, ohne die alles andere sinnlos ist
    expect(
      pruefeFuerAuswertung({
        share_anonymously: true,
      })
    ).toBe("kein-preis");
  });
});

describe("ablehnungsText", () => {
  it("erklärt jeden Grund verständlich statt still abzulehnen", () => {
    for (const grund of [
      "kein-preis",
      "preis-zu-niedrig",
      "preis-zu-hoch",
      "keine-zustandsnote",
      "kein-kilometerstand",
    ] as const) {
      const text = ablehnungsText(grund);
      expect(text.length).toBeGreaterThan(20);
      expect(text).toMatch(/\.$/);
    }
  });

  it("stellt bei zu niedrigem Preis klar, dass der Kaufpreis erhalten bleibt", () => {
    // Sonst befürchtet der Nutzer, seine Eingabe sei ganz verworfen worden
    expect(ablehnungsText("preis-zu-niedrig")).toMatch(
      /trotzdem gespeichert/
    );
  });
});

describe("ablehnungsText — Währung (PROJ-36)", () => {
  it("nennt die Grenze in der Währung des Fahrzeugs", () => {
    // Ein festes „€" wäre bei einem Franken-Fahrzeug schlicht falsch.
    const chf = ablehnungsText("preis-zu-niedrig", "CHF");
    expect(chf).toContain("CHF");
    expect(chf).not.toContain("€");
  });

  it("bleibt ohne Angabe bei Euro", () => {
    expect(ablehnungsText("preis-zu-hoch")).toContain("€");
  });

  it("rechnet die Grenze NICHT um", () => {
    // Die Grenzen fangen Zehnerpotenz-Vertipper, sie bilden keine Kaufkraft
    // ab. 500 bleibt 500, egal in welcher Währung.
    for (const w of ["EUR", "CHF", "GBP"] as const) {
      expect(ablehnungsText("preis-zu-niedrig", w)).toContain("500");
    }
  });

  it("lässt Gründe ohne Betrag unverändert", () => {
    const a = ablehnungsText("keine-zustandsnote", "EUR");
    const b = ablehnungsText("keine-zustandsnote", "CHF");
    expect(a).toBe(b);
  });
});

describe("saleReportSchema — Währung (PROJ-36)", () => {
  it("nimmt eine bekannte Währung an", () => {
    const r = saleReportSchema.safeParse({
      share_anonymously: false,
      currency: "CHF",
    });
    expect(r.success).toBe(true);
  });

  it("weist einen unbekannten Code ab", () => {
    const r = saleReportSchema.safeParse({
      share_anonymously: false,
      currency: "XYZ",
    });
    expect(r.success).toBe(false);
  });

  it("ist optional — die Übergabe darf an einer Nebenangabe nicht scheitern", () => {
    const r = saleReportSchema.safeParse({ share_anonymously: false });
    expect(r.success).toBe(true);
  });
});
