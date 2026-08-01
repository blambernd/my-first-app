import { test, expect } from "@playwright/test";

// E2E-Tests für PROJ-27 (Kostenanalyse) — unangemeldeter Teil.

const SAMPLE_VEHICLE = "/vehicles/00000000-0000-0000-0000-000000000000";
const AUSWERTUNG = `${SAMPLE_VEHICLE}/kosten/auswertung`;

test.describe("PROJ-27: Kostenanalyse", () => {
  test("Auswertungs-Route stürzt nicht ab", async ({ page }) => {
    const response = await page.goto(AUSWERTUNG);
    expect(response?.status() ?? 0).toBeLessThan(500);
  });

  test("Nicht angemeldete Nutzer werden zur Anmeldung geleitet", async ({
    page,
  }) => {
    await page.goto(AUSWERTUNG);
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("Kostendaten eines fremden Fahrzeugs gelangen nicht ins HTML", async ({
    page,
  }) => {
    const response = await page.goto(AUSWERTUNG);
    const body = (await response?.text()) ?? "";
    expect(body).not.toContain("Gesamtkosten");
    expect(body).not.toContain("Verteilung nach Kostenart");
    expect(body).not.toContain("Kosten pro Kilometer");
  });

  test("Route ist auf Mobilgröße erreichbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(AUSWERTUNG);
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});
