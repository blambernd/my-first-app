import { test, expect } from "@playwright/test";

/**
 * Die Kontoart bei der Registrierung (PROJ-39, PROJ-38).
 *
 * Unangemeldet und ohne Registrierung — es wird kein Konto angelegt.
 * Geprüft wird, dass alle drei Kontoarten angeboten werden, dass „Privat"
 * vorbelegt ist und dass beim Händler der Premium-Hinweis dabeisteht.
 *
 * Läuft auch gegen die ausgelieferte Anwendung:
 *   npx playwright test --config playwright.prod.config.ts
 */

test.describe("PROJ-39: Kontoart bei der Registrierung", () => {
  test("Die Registrierung fragt nach der Kontoart", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByText("Wie nutzt du Oldtimer Docs?")).toBeVisible();
  });

  test("Alle drei Kontoarten stehen zur Wahl", async ({ page }) => {
    await page.goto("/register");

    for (const art of ["Privat", "Werkstatt", "Händler"]) {
      await expect(
        page.getByRole("radio", { name: new RegExp(art) })
      ).toBeVisible();
    }
  });

  test("Privat ist vorbelegt", async ({ page }) => {
    await page.goto("/register");

    // Die weitaus meisten Konten sind privat, und niemand soll eine
    // gewerbliche Angabe versehentlich mitnehmen.
    await expect(page.getByRole("radio", { name: /Privat/ })).toBeChecked();
    await expect(
      page.getByRole("radio", { name: /Werkstatt/ })
    ).not.toBeChecked();
    await expect(page.getByRole("radio", { name: /Händler/ })).not.toBeChecked();
  });

  test("Die Auswahl lässt sich umstellen", async ({ page }) => {
    await page.goto("/register");

    await page.getByRole("radio", { name: /Werkstatt/ }).click();
    await expect(page.getByRole("radio", { name: /Werkstatt/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: /Privat/ })).not.toBeChecked();

    // Einfachauswahl: Die zweite Wahl nimmt die erste zurück.
    await page.getByRole("radio", { name: /Händler/ }).click();
    await expect(page.getByRole("radio", { name: /Händler/ })).toBeChecked();
    await expect(
      page.getByRole("radio", { name: /Werkstatt/ })
    ).not.toBeChecked();
  });

  test("Jede Kontoart erklärt, was sie freischaltet", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByText(/eigenen Fahrzeuge/i)).toBeVisible();
    await expect(page.getByText(/Kundenfahrzeuge anlegen/i)).toBeVisible();
    await expect(page.getByText(/Standzeit, Einkauf, Verkauf/i)).toBeVisible();
  });

  test("Beim Händler steht der Premium-Hinweis dabei", async ({ page }) => {
    await page.goto("/register");

    // Ihn zu verschweigen wäre die unangenehmere Überraschung: Ein Betrieb,
    // der sich anmeldet und danach vor einer Bezahlschranke steht, fühlt
    // sich hereingelegt.
    const haendler = page
      .locator("label")
      .filter({ hasText: "Händler" })
      .first();
    await expect(haendler).toContainText("Premium");
  });

  test("Die Wahl ist als nachträglich änderbar ausgewiesen", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(
      page.getByText(/jederzeit in den Einstellungen ändern/i)
    ).toBeVisible();
  });

  test("Die Zustimmung zu den AGB bleibt davon unberührt", async ({ page }) => {
    await page.goto("/register");

    // Regression: Die Auswahl darf die Pflichtzustimmung nicht verdrängen.
    const agb = page.getByRole("checkbox", { name: /AGB/i });
    await expect(agb).toBeVisible();
    await expect(agb).not.toBeChecked();
  });

  test("Bei 375 px bleibt die Registrierung bedienbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/register");

    await expect(page.getByRole("radio", { name: /Werkstatt/ })).toBeVisible();

    const ueberlauf = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(ueberlauf).toBe(false);
  });
});
