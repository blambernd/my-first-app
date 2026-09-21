import { test, expect } from "@playwright/test";

/**
 * Werkstatt-Konto & Kundenfahrzeuge (PROJ-39) — angemeldet als Werkstatt.
 *
 * Läuft unter dem Werkstatt-Testkonto, weil die geprüften Ansichten sonst
 * gar nicht erreichbar sind. Der Schalter selbst wird hier **nicht**
 * umgelegt: Sein Zustand gilt kontoweit, und ein Test, der ihn verändert,
 * würde jeden parallel laufenden Test beeinflussen. Geprüft wird, dass die
 * Karte da ist und der Bereich erreichbar bleibt.
 *
 * Hinweis für spätere Erweiterungen: Die Kartenüberschriften stammen aus
 * `CardTitle` und sind `div`-Elemente, keine Überschriften im Sinne der
 * Rollen. `getByRole("heading")` findet sie nicht — nur `<h1>` auf der Seite
 * selbst ist eine echte Überschrift.
 */

test.describe("PROJ-39: Werkstatt-Konto", () => {
  test("Die Einstellungen führen eine Karte „Werkstatt“ mit Schalter", async ({
    page,
  }) => {
    await page.goto("/settings");

    const schalter = page.getByRole("switch", { name: /Ich bin eine Werkstatt/i });
    await expect(schalter).toBeVisible();
  });

  test("Die Karte erklärt, was der Schalter bewirkt", async ({ page }) => {
    await page.goto("/settings");

    // Ohne diese Erklärung ist nicht erkennbar, wozu die Angabe dient.
    await expect(
      page.getByText(/Fahrzeuge deiner\s+Kunden selbst anlegen/i)
    ).toBeVisible();
  });

  test("Der Schalter für den Bestandsbereich steht weiterhin daneben", async ({
    page,
  }) => {
    await page.goto("/settings");

    // Regression gegen PROJ-38: Die neue Karte darf die alte nicht verdrängen.
    await expect(
      page.getByRole("switch", { name: /gewerblich/i })
    ).toBeVisible();
  });

  test("Der Werkstattbereich ist über die Navigation erreichbar", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const punkt = page.getByRole("link", { name: "Werkstatt" }).first();
    await expect(punkt).toBeVisible();

    await punkt.click();
    await expect(page).toHaveURL(/\/werkstatt/);
    await expect(
      page.getByRole("heading", { name: "Werkstatt", level: 1 })
    ).toBeVisible({ timeout: 30000 });
  });

  test("Die Karte „Anstehende Arbeiten“ bleibt erhalten", async ({ page }) => {
    await page.goto("/werkstatt");

    // Regression gegen PROJ-37: Die Zweiteilung darf die Terminkarte nicht
    // verdrängt haben. Als Text geprüft, nicht als Überschrift — siehe
    // Hinweis am Kopf dieser Datei.
    await expect(page.getByText("Anstehende Arbeiten").first()).toBeVisible({
      timeout: 30000,
    });
  });

  test("Die Liste der betreuten Fahrzeuge bleibt erhalten", async ({ page }) => {
    await page.goto("/werkstatt");

    // Das Testkonto betreut ein fremdes Fahrzeug per Einladung (PROJ-37).
    await expect(
      page.getByText("E2E-Testfahrzeug Wegwerf").first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("Die Kopfzeile zählt die betreuten Fahrzeuge", async ({ page }) => {
    await page.goto("/werkstatt");

    await expect(page.getByText(/betreute[s]? Fahrzeug/i).first()).toBeVisible({
      timeout: 30000,
    });
  });

  test("Ohne Werkstatt-Schalter erscheint kein Bereich für eigene Fahrzeuge", async ({
    page,
  }) => {
    await page.goto("/werkstatt");
    await expect(
      page.getByRole("heading", { name: "Werkstatt", level: 1 })
    ).toBeVisible({ timeout: 30000 });

    // Das Testkonto kommt über die Einladung herein, nicht über die
    // Selbstauskunft. Der Abschnitt für eigene Kundenfahrzeuge — und damit
    // die Schaltfläche zum Anlegen — darf dann nicht erscheinen.
    await expect(
      page.getByRole("link", { name: /Kundenfahrzeug anlegen/i })
    ).toHaveCount(0);
  });

  test("Die Seite ist bei 375 px bedienbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/werkstatt");

    await expect(
      page.getByRole("heading", { name: "Werkstatt", level: 1 })
    ).toBeVisible({ timeout: 30000 });

    // Kein waagerechter Überlauf — der häufigste Mobilfehler.
    const ueberlauf = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(ueberlauf).toBe(false);
  });
});
