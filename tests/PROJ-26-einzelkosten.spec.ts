import { test, expect } from "@playwright/test";

// E2E-Tests für PROJ-26 (Einzelkosten) — unangemeldeter Teil.

const SAMPLE_VEHICLE = "/vehicles/00000000-0000-0000-0000-000000000000";

test.describe("PROJ-26: Einzelkosten", () => {
  test("Einzelkosten-Route stürzt nicht ab", async ({ page }) => {
    const response = await page.goto(`${SAMPLE_VEHICLE}/kosten/einzelkosten`);
    expect(response?.status() ?? 0).toBeLessThan(500);
  });

  test("Nicht angemeldete Nutzer werden zur Anmeldung geleitet", async ({
    page,
  }) => {
    await page.goto(`${SAMPLE_VEHICLE}/kosten/einzelkosten`);
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("Einzelkosten eines fremden Fahrzeugs gelangen nicht ins HTML", async ({
    page,
  }) => {
    const response = await page.goto(`${SAMPLE_VEHICLE}/kosten/einzelkosten`);
    const body = (await response?.text()) ?? "";
    expect(body).not.toContain("Einzelkosten erfassen");
    expect(body).not.toContain("Nach Kostenart");
  });

  test("Route ist auf Mobilgröße erreichbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(`${SAMPLE_VEHICLE}/kosten/einzelkosten`);
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});
