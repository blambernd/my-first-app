import { test, expect } from "@playwright/test";

/**
 * Angemeldete Tests für PROJ-24 (Tankbuch).
 *
 * ⚠️ Diese Tests laufen gegen die **Produktionsdatenbank** — das Projekt hat
 * keine getrennte Testumgebung. Sie sind deshalb bewusst **ausschließlich
 * lesend**: navigieren, prüfen, nichts anlegen, nichts ändern, nichts löschen.
 *
 * Schreibende Tests (Tankvorgang erfassen, bearbeiten, löschen) fehlen absichtlich.
 * Sie brauchen entweder eine getrennte Datenbank oder einen dedizierten
 * Testnutzer mit eigenem Fahrzeug — siehe QA-Bericht in der Feature-Spec.
 *
 * Voraussetzung: E2E_EMAIL und E2E_PASSWORD in .env.local (siehe .env.local.example).
 */

test.describe("PROJ-24: Tankbuch (angemeldet, nur lesend)", () => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
    "E2E_EMAIL / E2E_PASSWORD nicht gesetzt"
  );

  // Navigiert vom Dashboard zum ersten Fahrzeug — unabhängig von konkreten IDs
  async function openFirstVehicle(page: import("@playwright/test").Page) {
    await page.goto("/dashboard");
    const firstVehicle = page.locator('a[href^="/vehicles/"]').first();
    await expect(firstVehicle).toBeVisible({ timeout: 15000 });
    const href = await firstVehicle.getAttribute("href");
    expect(href).toBeTruthy();
    return href!;
  }

  test("Tankbuch ist in der Fahrzeug-Navigation verlinkt", async ({ page }) => {
    const vehicleHref = await openFirstVehicle(page);
    await page.goto(vehicleHref);

    const tankbuchLink = page.getByRole("link", { name: "Tankbuch" });
    await expect(tankbuchLink).toBeVisible({ timeout: 15000 });
    await expect(tankbuchLink).toHaveAttribute(
      "href",
      `${vehicleHref}/tankbuch`
    );
  });

  test("Tankbuch-Seite lädt ohne Fehler", async ({ page }) => {
    const vehicleHref = await openFirstVehicle(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(`${vehicleHref}/tankbuch`);
    expect(response?.status() ?? 0).toBeLessThan(400);

    // Entweder der leere Zustand oder die Kennzahlen — eines von beidem muss da sein
    const emptyState = page.getByText("Noch keine Tankvorgänge erfasst");
    const stats = page.getByText("Durchschnittsverbrauch");
    await expect(emptyState.or(stats).first()).toBeVisible({ timeout: 15000 });

    expect(errors, `JavaScript-Fehler auf der Seite: ${errors.join("; ")}`).toHaveLength(0);
  });

  test("Leerer Zustand bietet das Erfassen an", async ({ page }) => {
    const vehicleHref = await openFirstVehicle(page);
    await page.goto(`${vehicleHref}/tankbuch`);

    const emptyState = page.getByText("Noch keine Tankvorgänge erfasst");
    if (await emptyState.isVisible().catch(() => false)) {
      await expect(
        page.getByRole("button", { name: /Tankvorgang erfassen/ })
      ).toBeVisible();
    } else {
      test.skip(true, "Fahrzeug hat bereits Tankvorgänge — leerer Zustand nicht prüfbar");
    }
  });

  test("Erfassungsdialog öffnet und zeigt alle Pflichtfelder", async ({
    page,
  }) => {
    const vehicleHref = await openFirstVehicle(page);
    await page.goto(`${vehicleHref}/tankbuch`);

    await page
      .getByRole("button", { name: /Tankvorgang erfassen/ })
      .first()
      .click();

    // Nur öffnen und prüfen — es wird nichts abgeschickt
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("Liter")).toBeVisible();
    await expect(page.getByLabel("Gesamtpreis (€)")).toBeVisible();
    await expect(page.getByLabel("Kilometerstand")).toBeVisible();
    // Über die Rolle statt über den Text: "Volltankung" kommt auch im
    // Beschreibungstext und im leeren Zustand vor
    await expect(page.getByRole("switch", { name: "Volltankung" })).toBeVisible();
    await expect(
      page.getByRole("switch", { name: "Tacho-Korrektur" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Abbrechen" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("Tankbuch ist auf Mobilgröße bedienbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const vehicleHref = await openFirstVehicle(page);
    await page.goto(`${vehicleHref}/tankbuch`);

    const emptyState = page.getByText("Noch keine Tankvorgänge erfasst");
    const stats = page.getByText("Durchschnittsverbrauch");
    await expect(emptyState.or(stats).first()).toBeVisible({ timeout: 15000 });

    // Geprüft wird der Inhalt des Tankbuchs, nicht das Dokument insgesamt:
    // Die Anwendung hat einen globalen, vorbestehenden Überlauf von 57px, der
    // auf jeder Seite auftritt — auch auf /login ohne Anmeldung (gemessen
    // 2026-07-31, siehe QA-Bericht). Ein Test auf Dokumentbreite würde diesen
    // Fremdfehler messen statt der Mobiltauglichkeit dieses Features.
    const contentOverflow = await page.evaluate(() => {
      const vw = window.innerWidth;
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>("main [class*='rounded'], main button")
      );
      return cards
        .filter((el) => el.getBoundingClientRect().right > vw + 1)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          right: Math.round(el.getBoundingClientRect().right),
        }));
    });

    expect(
      contentOverflow,
      `Tankbuch-Inhalte ragen über 375px hinaus: ${JSON.stringify(contentOverflow)}`
    ).toEqual([]);
  });
});
