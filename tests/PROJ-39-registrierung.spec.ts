import { test, expect } from "@playwright/test";

/**
 * Die Werkstatt-Angabe bei der Registrierung (PROJ-39).
 *
 * Unangemeldet und ohne Registrierung — es wird kein Konto angelegt.
 * Geprüft wird, dass die Wahl da ist, erklärt wird und nicht vorbelegt
 * ist: Eine Selbstauskunft, die man versehentlich mitnimmt, ist keine.
 */

test.describe("PROJ-39: Werkstatt-Angabe bei der Registrierung", () => {
  test("Die Registrierung bietet die Werkstatt-Wahl an", async ({ page }) => {
    await page.goto("/register");

    const wahl = page.getByRole("checkbox", { name: /Ich bin eine Werkstatt/i });
    await expect(wahl).toBeVisible();
  });

  test("Die Wahl ist nicht vorbelegt", async ({ page }) => {
    await page.goto("/register");

    // Wer eine Werkstatt ist, sagt es bewusst. Vorbelegt wäre die Angabe
    // wertlos, weil jeder sie versehentlich mitnähme.
    const wahl = page.getByRole("checkbox", { name: /Ich bin eine Werkstatt/i });
    await expect(wahl).not.toBeChecked();
  });

  test("Die Wahl erklärt, was sie bewirkt", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByText(/Fahrzeuge deiner Kunden anlegen/i)
    ).toBeVisible();
    // Und dass sie nicht endgültig ist.
    await expect(
      page.getByText(/jederzeit in den Einstellungen ändern/i)
    ).toBeVisible();
  });

  test("Die Zustimmung zu den AGB bleibt davon unberührt", async ({ page }) => {
    await page.goto("/register");

    // Regression: Die neue Wahl darf die Pflichtzustimmung nicht verdrängen.
    const agb = page.getByRole("checkbox", { name: /AGB/i });
    await expect(agb).toBeVisible();
    await expect(agb).not.toBeChecked();
  });

  test("Bei 375 px bleibt die Registrierung bedienbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/register");

    await expect(
      page.getByRole("checkbox", { name: /Ich bin eine Werkstatt/i })
    ).toBeVisible();

    const ueberlauf = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(ueberlauf).toBe(false);
  });
});
