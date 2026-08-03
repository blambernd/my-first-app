import { test, expect } from "@playwright/test";

// E2E-Tests für PROJ-25 (Wiederkehrende Kosten) — unangemeldeter Teil.
// Prüft Routing und Zugriffsschutz, analog zu den übrigen Specs im Projekt.

const SAMPLE_VEHICLE = "/vehicles/00000000-0000-0000-0000-000000000000";

test.describe("PROJ-25: Kosten-Bereich", () => {
  test("Kosten-Route stürzt nicht ab", async ({ page }) => {
    const response = await page.goto(`${SAMPLE_VEHICLE}/kosten/laufende`);
    expect(response?.status() ?? 0).toBeLessThan(500);
  });

  test("Nicht angemeldete Nutzer werden zur Anmeldung geleitet", async ({
    page,
  }) => {
    await page.goto(`${SAMPLE_VEHICLE}/kosten/laufende`);
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("Kosten eines fremden Fahrzeugs gelangen nicht ins HTML", async ({
    page,
  }) => {
    const response = await page.goto(`${SAMPLE_VEHICLE}/kosten/laufende`);
    const body = (await response?.text()) ?? "";
    expect(body).not.toContain("Aktuell pro Monat");
    expect(body).not.toContain("Laufende Kosten erfassen");
  });

  test("Kosten-Route ist auf Mobilgröße erreichbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(`${SAMPLE_VEHICLE}/kosten/laufende`);
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});
