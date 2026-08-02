import { describe, it, expect } from "vitest";
import {
  getVehicleAreas,
  isAreaActive,
  isSubAreaActive,
  switchTargetPath,
} from "./vehicle-areas";

/**
 * Tests zur Fahrzeugnavigation (PROJ-30).
 *
 * Der Fahrzeugwechsel ließe sich im Browser nur mit einem Nutzer prüfen, der
 * mindestens zwei Fahrzeuge besitzt — davon eines geteilt. Die Wegberechnung
 * ist deshalb als reine Funktion ausgelagert und hier abgedeckt.
 */

const A = "veh-a";
const B = "veh-b";

describe("getVehicleAreas", () => {
  it("zeigt dem Besitzer den Kostenbereich", () => {
    const labels = getVehicleAreas(true).map((a) => a.label);
    expect(labels).toContain("Kosten");
  });

  it("verbirgt den Kostenbereich vor Mitgliedern", () => {
    const labels = getVehicleAreas(false).map((a) => a.label);
    expect(labels).not.toContain("Kosten");
  });

  it("lässt Mitgliedern die allgemeinen Bereiche", () => {
    const labels = getVehicleAreas(false).map((a) => a.label);
    expect(labels).toEqual([
      "Übersicht",
      "Scheckheft",
      "Historie",
      "Dokumente",
      "Tankbuch",
    ]);
  });

  it("blendet abgeschaltete Bereiche aus", () => {
    // Der Verkaufsassistent ist seit 2026-08-02 ausgesetzt
    const labels = getVehicleAreas(true).map((a) => a.label);
    expect(labels).not.toContain("Verkaufsassistent");
  });

  it("hinterlegt dem Kostenbereich vier Unterbereiche", () => {
    const kosten = getVehicleAreas(true).find((a) => a.label === "Kosten");
    expect(kosten?.children?.map((c) => c.label)).toEqual([
      "Laufende Kosten",
      "Einzelkosten",
      "Auswertung",
      "Wertentwicklung",
    ]);
  });
});

describe("isAreaActive", () => {
  const basis = `/vehicles/${A}`;
  const kosten = { label: "Kosten", href: "/kosten", icon: null as never };
  const uebersicht = { label: "Übersicht", href: "", icon: null as never };

  it("hebt den Kostenbereich auch auf seinen Unterseiten hervor", () => {
    expect(isAreaActive(kosten, basis, `${basis}/kosten`)).toBe(true);
    expect(isAreaActive(kosten, basis, `${basis}/kosten/auswertung`)).toBe(true);
  });

  it("hebt die Übersicht nur auf der Übersicht hervor", () => {
    // Ohne exakten Vergleich wäre sie auf jeder Unterseite mit markiert
    expect(isAreaActive(uebersicht, basis, basis)).toBe(true);
    expect(isAreaActive(uebersicht, basis, `${basis}/scheckheft`)).toBe(false);
  });

  it("verwechselt ähnlich beginnende Pfade nicht", () => {
    expect(isAreaActive(kosten, basis, `${basis}/kostenlos`)).toBe(false);
  });
});

describe("isSubAreaActive", () => {
  const basis = `/vehicles/${A}`;
  const laufende = { label: "Laufende Kosten", href: "/kosten", icon: null as never };

  it("markiert „Laufende Kosten“ nur auf ihrer eigenen Seite", () => {
    // Sie teilt sich den Pfad mit dem Bereich "Kosten"
    expect(isSubAreaActive(laufende, basis, `${basis}/kosten`)).toBe(true);
    expect(isSubAreaActive(laufende, basis, `${basis}/kosten/einzelkosten`)).toBe(
      false
    );
  });
});

describe("switchTargetPath — Fahrzeugwechsel", () => {
  it("behält den Unterbereich bei einem eigenen Fahrzeug", () => {
    expect(
      switchTargetPath(`/vehicles/${A}/tankbuch`, A, { id: B, shared: false })
    ).toBe(`/vehicles/${B}/tankbuch`);
  });

  it("behält allgemeine Bereiche auch bei einem geteilten Fahrzeug", () => {
    expect(
      switchTargetPath(`/vehicles/${A}/scheckheft`, A, { id: B, shared: true })
    ).toBe(`/vehicles/${B}/scheckheft`);
  });

  it("verwirft den Kostenbereich beim Wechsel auf ein geteiltes Fahrzeug", () => {
    // Sonst landet der Nutzer auf einer Fehlerseite statt auf der Übersicht
    expect(
      switchTargetPath(`/vehicles/${A}/kosten`, A, { id: B, shared: true })
    ).toBe(`/vehicles/${B}`);
  });

  it("verwirft auch Unterseiten des Kostenbereichs", () => {
    expect(
      switchTargetPath(`/vehicles/${A}/kosten/wertentwicklung`, A, {
        id: B,
        shared: true,
      })
    ).toBe(`/vehicles/${B}`);
  });

  it("führt von der Übersicht auf die Übersicht", () => {
    expect(switchTargetPath(`/vehicles/${A}`, A, { id: B, shared: false })).toBe(
      `/vehicles/${B}`
    );
  });

  it("verwechselt ähnlich beginnende Pfade nicht mit dem Kostenbereich", () => {
    expect(
      switchTargetPath(`/vehicles/${A}/kostenlos`, A, { id: B, shared: true })
    ).toBe(`/vehicles/${B}/kostenlos`);
  });

  it("kommt mit einem unerwarteten Pfad zurecht", () => {
    expect(switchTargetPath("/dashboard", A, { id: B, shared: false })).toBe(
      `/vehicles/${B}`
    );
  });
});
