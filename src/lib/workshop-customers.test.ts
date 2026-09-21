import { describe, it, expect } from "vitest";
import {
  customerLabel,
  filterCustomerVehicles,
  uebergabeText,
  type CustomerVehicle,
} from "./workshop-customers";

/**
 * Die reine Logik rund um Kundenfahrzeuge (PROJ-39).
 *
 * Das Laden selbst ist hier nicht geprüft — es ist eine Abfrage ohne eigene
 * Entscheidungen. Geprüft wird, was danach passiert: Wie ein Kunde
 * beschriftet wird und was die Suche findet. Beides bestimmt, ob eine
 * Werkstatt ihr Fahrzeug unter sechzig anderen wiederfindet.
 */

function fahrzeug(teil: Partial<CustomerVehicle> = {}): CustomerVehicle {
  return {
    id: "v1",
    make: "Porsche",
    model: "911",
    year: 1973,
    licensePlate: "M-XY 123",
    mileageKm: 87450,
    createdAt: "2026-09-01T10:00:00Z",
    customer: null,
    uebergabe: null,
    ...teil,
  };
}

describe("customerLabel", () => {
  it("nimmt den Namen, wenn es einen gibt", () => {
    expect(
      customerLabel({ name: "Anna Bauer", phone: "0170 1234", email: "a@b.de" })
    ).toBe("Anna Bauer");
  });

  it("fällt auf die Telefonnummer zurück", () => {
    // Wer nur die Nummer notiert hat, hat sie als Merkhilfe notiert.
    expect(customerLabel({ name: null, phone: "0170 1234", email: null })).toBe(
      "0170 1234"
    );
  });

  it("fällt zuletzt auf die E-Mail zurück", () => {
    expect(customerLabel({ name: null, phone: null, email: "a@b.de" })).toBe(
      "a@b.de"
    );
  });

  it("gibt null zurück, wenn gar nichts hinterlegt ist", () => {
    expect(customerLabel({ name: null, phone: null, email: null })).toBeNull();
    expect(customerLabel(null)).toBeNull();
  });

  it("behandelt leere Zeichenketten wie fehlende Angaben", () => {
    // Sonst stünde in der Liste eine leere Stelle mit Kundensymbol davor.
    expect(customerLabel({ name: "", phone: "0170 1234", email: "" })).toBe(
      "0170 1234"
    );
  });
});

describe("filterCustomerVehicles", () => {
  const bestand = [
    fahrzeug({ id: "a", make: "Porsche", model: "911", licensePlate: "M-XY 123" }),
    fahrzeug({
      id: "b",
      make: "Mercedes",
      model: "280 SL",
      licensePlate: "S-AB 456",
      customer: { name: "Anna Bauer", phone: "0170 1234", email: "anna@example.de" },
    }),
    fahrzeug({
      id: "c",
      make: "BMW",
      model: "2002",
      licensePlate: null,
      customer: { name: null, phone: "0160 9999", email: null },
    }),
  ];

  it("gibt ohne Suchbegriff alles zurück", () => {
    expect(filterCustomerVehicles(bestand, "")).toHaveLength(3);
    expect(filterCustomerVehicles(bestand, "   ")).toHaveLength(3);
  });

  it("findet über die Marke", () => {
    const treffer = filterCustomerVehicles(bestand, "porsche");
    expect(treffer.map((v) => v.id)).toEqual(["a"]);
  });

  it("findet über das Kennzeichen", () => {
    expect(filterCustomerVehicles(bestand, "S-AB").map((v) => v.id)).toEqual(["b"]);
  });

  it("findet über den Kundennamen", () => {
    // Der eigentliche Zweck: Der Kunde ruft an und nennt seinen Namen, nicht
    // das Kennzeichen.
    expect(filterCustomerVehicles(bestand, "bauer").map((v) => v.id)).toEqual(["b"]);
  });

  it("findet über die Telefonnummer, auch ohne Namen", () => {
    expect(filterCustomerVehicles(bestand, "0160").map((v) => v.id)).toEqual(["c"]);
  });

  it("findet über die Kunden-E-Mail", () => {
    expect(filterCustomerVehicles(bestand, "anna@").map((v) => v.id)).toEqual(["b"]);
  });

  it("achtet nicht auf Groß- und Kleinschreibung", () => {
    expect(filterCustomerVehicles(bestand, "MERCEDES")).toHaveLength(1);
    expect(filterCustomerVehicles(bestand, "mercedes")).toHaveLength(1);
  });

  it("findet über das Baujahr, weil es zum Anzeigenamen gehört", () => {
    expect(filterCustomerVehicles(bestand, "1973")).toHaveLength(3);
  });

  it("gibt bei fehlendem Treffer eine leere Liste zurück", () => {
    expect(filterCustomerVehicles(bestand, "Ferrari")).toEqual([]);
  });

  it("stolpert nicht über fehlende Angaben", () => {
    // Ein Fahrzeug ohne Kennzeichen und ohne Kunde darf die Suche nicht
    // scheitern lassen.
    const karg = [fahrzeug({ licensePlate: null, customer: null, year: null })];
    expect(() => filterCustomerVehicles(karg, "irgendwas")).not.toThrow();
    expect(filterCustomerVehicles(karg, "porsche")).toHaveLength(1);
  });
});

describe("uebergabeText (PROJ-40)", () => {
  it("beschreibt eine laufende Übergabe mit Empfänger und Frist", () => {
    const t = uebergabeText({
      toEmail: "kunde@example.de",
      expiresAt: "2026-10-05T12:00:00Z",
      abgelaufen: false,
    });

    expect(t.kennzeichen).toBe("Übergabe offen");
    expect(t.erklaerung).toContain("kunde@example.de");
    expect(t.erklaerung).toContain("5.10.2026");
  });

  it("beschreibt eine abgelaufene Übergabe und beruhigt über den Besitz", () => {
    const t = uebergabeText({
      toEmail: "kunde@example.de",
      expiresAt: "2026-09-01T12:00:00Z",
      abgelaufen: true,
    });

    expect(t.kennzeichen).toBe("Übergabe abgelaufen");
    // Die Werkstatt muss wissen, dass nichts verloren ist.
    expect(t.erklaerung).toContain("gehört weiterhin dir");
  });

  it("nennt in beiden Fällen die Empfängeradresse", () => {
    // Ohne sie weiß die Werkstatt nicht, bei wem sie nachfassen soll.
    for (const abgelaufen of [true, false]) {
      const t = uebergabeText({
        toEmail: "wer@example.de",
        expiresAt: "2026-10-05T12:00:00Z",
        abgelaufen,
      });
      expect(t.erklaerung).toContain("wer@example.de");
    }
  });

  it("rechnet die Frist nicht nach, sondern zeigt das gespeicherte Datum", () => {
    // Die Spezifikation nannte sieben Tage, das Formular setzt vierzehn.
    // Ein nachgerechnetes Datum wäre früher oder später falsch.
    const t = uebergabeText({
      toEmail: "k@example.de",
      expiresAt: "2027-01-31T00:00:00Z",
      abgelaufen: false,
    });
    expect(t.erklaerung).toContain("31.1.2027");
  });
});
