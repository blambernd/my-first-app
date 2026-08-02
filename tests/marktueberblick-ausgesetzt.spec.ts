import { test, expect } from "@playwright/test";

/**
 * Sichert die Ausblendung von Marktüberblick, Verkaufsassistent und
 * Kurzprofil ab (2026-08-02).
 *
 * Der Grund steht in features/PROJ-29-belastbarer-marktueberblick.md: Die
 * Datenbeschaffung liefert keine belastbaren Preise. Diese Tests stellen
 * sicher, dass die Funktionen nicht versehentlich wieder erreichbar werden —
 * weder über die Navigation noch über gespeicherte Verweise.
 *
 * Beim Wiedereinschalten (VERKAUFSASSISTENT_AKTIV = true) gehört diese Datei
 * gelöscht und die Specs zu PROJ-10, PROJ-11 und PROJ-16 wieder aktiviert.
 */

const E2E_EMAIL = process.env.E2E_EMAIL ?? "e2e-testnutzer@oldtimer-docs.test";
const E2E_PASSWORT = process.env.E2E_PASSWORT ?? "";
const FAHRZEUG_ID = process.env.E2E_VEHICLE_ID ?? "";

test.describe("Ausgesetzte Verkaufsfunktionen", () => {
  test.skip(
    !E2E_PASSWORT || !FAHRZEUG_ID,
    "Erfordert E2E_PASSWORT und E2E_VEHICLE_ID"
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(E2E_EMAIL);
    await page.getByLabel("Passwort").fill(E2E_PASSWORT);
    await page.getByRole("button", { name: /Anmelden/ }).click();
    await page.waitForURL(/\/dashboard|\/vehicles/, { timeout: 30000 });
  });

  const routen = [
    ["Verkaufsassistent", "verkaufsassistent"],
    ["Marktpreis", "marktpreis"],
    ["Kurzprofil", "kurzprofil"],
    ["Verkaufen", "verkaufen"],
  ] as const;

  for (const [name, pfad] of routen) {
    test(`${name} leitet aufs Fahrzeugprofil zurück`, async ({ page }) => {
      await page.goto(`/vehicles/${FAHRZEUG_ID}/${pfad}`);
      // Kein 404 und keine Kaufaufforderung — schlicht zurück zum Fahrzeug
      await expect(page).toHaveURL(
        new RegExp(`/vehicles/${FAHRZEUG_ID}/?$`),
        { timeout: 30000 }
      );
    });
  }

  test("Der Verkaufsassistent steht nicht in der Fahrzeug-Navigation", async ({
    page,
  }) => {
    await page.goto(`/vehicles/${FAHRZEUG_ID}`);
    await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByRole("link", { name: "Verkaufsassistent" })
    ).toHaveCount(0);
  });
});
