import { test, expect } from "@playwright/test";

/**
 * Unangemeldete Tests für PROJ-38 (Händler-Bestandsübersicht).
 *
 * Prüft die Zugangsgrenze von außen. Alles Weitere braucht ein Konto mit
 * gesetztem Händlermodus — siehe PROJ-38-bestand-auth.spec.ts.
 */

test.describe("PROJ-38: Bestand (unangemeldet)", () => {
  test("AC: Ohne Sitzung führt der Aufruf zur Anmeldung", async ({ page }) => {
    await page.goto("/bestand");
    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  });

  test("Die Seite gibt ohne Sitzung keine Bestandsdaten aus", async ({
    page,
  }) => {
    const antwort = await page.goto("/bestand");
    const text = (await antwort?.text()) ?? "";

    expect(text).not.toContain("Im Bestand");
    expect(text).not.toContain("Rohspanne");
  });

  test("Sicherheit: Die Verkaufsmeldung weist Fremde ab", async ({ request }) => {
    // Ohne Sitzung darf nichts in einen fremden Bestand geschrieben werden.
    const antwort = await request.post("/api/dealer/sales", {
      data: {
        vehicle_id: "11111111-1111-4111-8111-111111111111",
        sold_on: "2026-08-01",
        sale_price_eur: 42000,
      },
    });

    expect(antwort.status()).toBe(401);
  });
});
