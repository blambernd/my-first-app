import { test, expect } from "@playwright/test";

// E2E-Tests für PROJ-28 (Kaufpreis & Wertentwicklung) — unangemeldeter Teil.

const SAMPLE_VEHICLE = "/vehicles/00000000-0000-0000-0000-000000000000";
const WERTENTWICKLUNG = `${SAMPLE_VEHICLE}/kosten/wertentwicklung`;

test.describe("PROJ-28: Wertentwicklung", () => {
  test("Route stürzt nicht ab", async ({ page }) => {
    const response = await page.goto(WERTENTWICKLUNG);
    expect(response?.status() ?? 0).toBeLessThan(500);
  });

  test("Nicht angemeldete Nutzer werden zur Anmeldung geleitet", async ({
    page,
  }) => {
    await page.goto(WERTENTWICKLUNG);
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("Kaufpreis-Angaben gelangen nicht ins HTML", async ({ page }) => {
    const response = await page.goto(WERTENTWICKLUNG);
    const body = (await response?.text()) ?? "";
    for (const begriff of [
      "Kaufpreis",
      "Anschaffung",
      "Geschätzter Marktwert",
      "Gesamtbilanz",
    ]) {
      expect(body, `${begriff} darf nicht im HTML stehen`).not.toContain(begriff);
    }
  });

  test("Auch das Fahrzeugprofil gibt nichts preis", async ({ page }) => {
    const response = await page.goto(SAMPLE_VEHICLE);
    const body = (await response?.text()) ?? "";
    expect(body).not.toContain("Anschaffung");
  });

  test("Route ist auf Mobilgröße erreichbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(WERTENTWICKLUNG);
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});
