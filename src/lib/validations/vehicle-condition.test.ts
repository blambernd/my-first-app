import { describe, it, expect } from "vitest";
import {
  CONDITION_GRADES,
  getConditionGradeLabel,
  getConditionGradeShort,
  vehicleSchema,
} from "@/lib/validations/vehicle";

/**
 * Tests zur Zustandsnote (PROJ-29).
 *
 * Die Note ist die Bezugsgröße des Marktüberblicks. Fällt sie still auf einen
 * ungültigen Wert oder verschwindet sie beim Speichern, vergleicht das System
 * wieder gepflegte Fahrzeuge mit Scheunenfunden — ohne dass es auffällt.
 */

describe("CONDITION_GRADES", () => {
  it("deckt die übliche Skala 1 bis 5 vollständig ab", () => {
    expect(CONDITION_GRADES.map((g) => g.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it("hinterlegt zu jeder Note eine Erläuterung", () => {
    for (const grade of CONDITION_GRADES) {
      expect(grade.description.length, `Note ${grade.value}`).toBeGreaterThan(10);
    }
  });
});

describe("getConditionGradeLabel", () => {
  it("liefert die volle Bezeichnung", () => {
    expect(getConditionGradeLabel(1)).toContain("makellos");
    expect(getConditionGradeLabel(5)).toContain("restaurierungsbedürftig");
  });

  it("liefert null ohne Note", () => {
    expect(getConditionGradeLabel(null)).toBeNull();
  });

  it("liefert null bei einem Wert außerhalb der Skala", () => {
    // Ein unbekannter Wert darf nicht als Zahl durchrutschen und irgendwo
    // roh angezeigt werden
    expect(getConditionGradeLabel(0)).toBeNull();
    expect(getConditionGradeLabel(6)).toBeNull();
  });
});

describe("getConditionGradeShort", () => {
  it("kürzt für die Fahrzeugübersicht", () => {
    expect(getConditionGradeShort(3)).toBe("Zustand 3");
  });

  it("liefert null ohne Note, damit keine leere Kachel entsteht", () => {
    expect(getConditionGradeShort(null)).toBeNull();
  });
});

describe("vehicleSchema — condition_grade", () => {
  const basis = {
    make: "Mercedes-Benz",
    model: "220",
    first_registration_date: "1952-06-15",
  };

  it("nimmt alle Noten von 1 bis 5 an", () => {
    for (const grade of [1, 2, 3, 4, 5]) {
      const result = vehicleSchema.safeParse({ ...basis, condition_grade: grade });
      expect(result.success, `Note ${grade}`).toBe(true);
    }
  });

  it("ist optional — bestehende Fahrzeuge bleiben gültig", () => {
    expect(vehicleSchema.safeParse(basis).success).toBe(true);
    expect(
      vehicleSchema.safeParse({ ...basis, condition_grade: "" }).success
    ).toBe(true);
  });

  it("weist Werte außerhalb der Skala ab", () => {
    expect(
      vehicleSchema.safeParse({ ...basis, condition_grade: 0 }).success
    ).toBe(false);
    expect(
      vehicleSchema.safeParse({ ...basis, condition_grade: 6 }).success
    ).toBe(false);
    expect(
      vehicleSchema.safeParse({ ...basis, condition_grade: -1 }).success
    ).toBe(false);
  });

  it("weist Nachkommastellen ab", () => {
    expect(
      vehicleSchema.safeParse({ ...basis, condition_grade: 2.5 }).success
    ).toBe(false);
  });

  it("nimmt die Note als Zeichenkette an — Auswahlfelder liefern Text", () => {
    const result = vehicleSchema.safeParse({ ...basis, condition_grade: "2" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.condition_grade).toBe(2);
  });
});
