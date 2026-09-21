import { test, expect } from "@playwright/test";

/**
 * Werkstatt-Konto: unangemeldeter Zugriff (PROJ-39).
 *
 * Läuft ohne Sitzung und schreibt nichts — dadurch auch gegen die
 * ausgelieferte Anwendung verwendbar:
 *
 *   npx playwright test --config playwright.prod.config.ts
 *
 * Geprüft wird die Zusage, die das ganze Feature trägt: Die Selbstauskunft
 * ist keine Berechtigung. Wer nicht angemeldet ist, kommt nirgendwo hin —
 * und nichts von dem, was eine Werkstatt über ihre Kunden hinterlegt, tritt
 * nach außen.
 */

test.describe("PROJ-39: Werkstatt-Konto (unangemeldet)", () => {
  test("Der Werkstattbereich ist ohne Anmeldung nicht erreichbar", async ({
    page,
  }) => {
    const antwort = await page.goto("/werkstatt");
    expect(antwort?.status()).toBeLessThan(400);

    // Die Anmeldung ist das Ziel — nicht eine Fehlerseite und schon gar
    // nicht die Übersicht selbst.
    await expect(page).toHaveURL(/\/login/);
  });

  test("Die Einstellungen sind ohne Anmeldung nicht erreichbar", async ({
    page,
  }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Das ausgelieferte Dokument verrät keine Kundendaten", async ({
    request,
  }) => {
    const antwort = await request.get("/werkstatt");
    const text = await antwort.text();

    // Die Kundenangaben einer Werkstatt sind der empfindlichste Teil dieses
    // Features: Namen und Rufnummern von Leuten, die die Plattform nicht
    // einmal kennen. Sie dürfen in keinem unangemeldeten Dokument stehen.
    expect(text).not.toContain("Meine Kundenfahrzeuge");
    expect(text).not.toContain("customer_name");
    expect(text).not.toContain("vehicle_customers");
  });

  test("Die Anmeldeseite selbst ist erreichbar", async ({ page }) => {
    // Gegenprobe: Die Weiterleitung führt irgendwohin, wo man weiterkommt.
    const antwort = await page.goto("/login");
    expect(antwort?.status()).toBe(200);
    await expect(page.getByRole("button", { name: /Anmelden/i }).first()).toBeVisible();
  });
});
