import { test, expect } from "@playwright/test";

// E2E-Tests für PROJ-24: Tankbuch & Verbrauch
//
// Umfang bewusst begrenzt, analog zu den übrigen Specs im Projekt: Es gibt kein
// Auth-Setup (kein storageState), deshalb prüfen diese Tests ausschließlich
// Routing und Zugriffsschutz. Die Verbrauchslogik ist über 29 Unit-Tests in
// src/lib/fuel-consumption.test.ts abgedeckt, die Berechtigungen über die
// RLS-Policies (im QA-Bericht der Feature-Spec dokumentiert).
//
// NICHT abgedeckt: Erfassen, Bearbeiten und Löschen im eingeloggten Zustand,
// Darstellung des Diagramms, Responsive-Verhalten.

const SAMPLE_VEHICLE = "/vehicles/00000000-0000-0000-0000-000000000000";

test.describe("PROJ-24: Tankbuch", () => {
  test("Tankbuch-Route stürzt nicht ab", async ({ page }) => {
    const response = await page.goto(`${SAMPLE_VEHICLE}/tankbuch`);
    const status = response?.status() ?? 0;
    expect(status).toBeLessThan(500);
  });

  test("Nicht angemeldete Nutzer werden zur Anmeldung geleitet", async ({
    page,
  }) => {
    await page.goto(`${SAMPLE_VEHICLE}/tankbuch`);
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("Tankbuch eines fremden Fahrzeugs gibt keine Daten preis", async ({
    page,
  }) => {
    const response = await page.goto(`${SAMPLE_VEHICLE}/tankbuch`);
    const body = await response?.text();
    // Weder Kennzahlen noch Einträge dürfen ohne Anmeldung im HTML auftauchen
    expect(body ?? "").not.toContain("Durchschnittsverbrauch");
    expect(body ?? "").not.toContain("L/100km");
  });

  test("Tankbuch-Route ist auf Mobilgröße erreichbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(`${SAMPLE_VEHICLE}/tankbuch`);
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});
