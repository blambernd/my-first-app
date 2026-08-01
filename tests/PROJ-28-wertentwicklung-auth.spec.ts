import { test, expect, type Page } from "@playwright/test";

/**
 * Angemeldete Tests für PROJ-28 (Kaufpreis & Wertentwicklung).
 *
 * Die Anschaffung wird durch das echte Formular erfasst und die Bilanz gegen
 * eine Handrechnung geprüft. Der Kaufpreis ist die sensibelste Angabe im
 * Produkt — deshalb prüft ein eigener Test, dass er auch dann nicht im
 * ausgelieferten HTML steht, wo er nicht hingehört.
 *
 * Läuft ausschließlich gegen das Wegwerf-Fahrzeug und räumt vor und nach dem
 * Lauf auf.
 */

const VEHICLE_ID = process.env.E2E_VEHICLE_ID;
const PROFIL = `/vehicles/${VEHICLE_ID}`;
const KOSTEN = `${PROFIL}/kosten`;
const WERTENTWICKLUNG = `${KOSTEN}/wertentwicklung`;
const TANKBUCH = `${PROFIL}/tankbuch`;

/**
 * Die Handrechnung:
 *
 *   Kaufpreis                 18.500,00 €
 *   Nebenkosten Überführung      500,00 €
 *   ------------------------------------
 *   Anschaffung               19.000,00 €
 *   Investition (ein Tankvorgang)  80,00 €
 *   ------------------------------------
 *   Bisher aufgewendet        19.080,00 €
 *
 * Für das Wegwerf-Fahrzeug liegt keine Marktpreis-Analyse vor — die Bilanz
 * zeigt deshalb nur die Kostenseite. Genau der Fall, den ein neuer Nutzer
 * zuerst sieht.
 */
const ERWARTET = {
  kaufpreis: "18.500,00 €",
  nebenkosten: "500,00 €",
  anschaffung: "19.000,00 €",
  investition: "80,00 €",
  aufgewendet: "19.080,00 €",
};

async function waitForToastsGone(page: Page) {
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
    timeout: 20000,
  });
}

async function confirmDelete(page: Page) {
  await page.getByRole("button", { name: "Löschen", exact: true }).last().click();
}

/** Kennzahlen-Karte; `.first()`, weil Begriffe mehrfach auf der Seite stehen */
function karte(page: Page, titel: string) {
  return page.getByText(titel, { exact: true }).first().locator("xpath=../..");
}

async function anschaffungEntfernen(page: Page) {
  await page.goto(PROFIL);
  const entfernen = page.getByRole("button", { name: "Anschaffung entfernen" });
  await expect(
    entfernen.or(page.getByRole("button", { name: "Anschaffung erfassen" })).first()
  ).toBeVisible({ timeout: 30000 });

  if ((await entfernen.count()) > 0) {
    await entfernen.click();
    await expect(page.getByText("Anschaffung entfernen?")).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Entfernen", exact: true }).last().click();
    await expect(
      page.getByRole("button", { name: "Anschaffung erfassen" })
    ).toBeVisible({ timeout: 20000 });
    await waitForToastsGone(page);
  }
}

async function tankbuchLeeren(page: Page) {
  await page.goto(TANKBUCH);
  const loeschen = page.getByRole("button", { name: "Tankvorgang löschen" });
  const leer = page.getByText("Noch keine Tankvorgänge erfasst");
  await expect
    .poll(
      async () =>
        (await leer.isVisible().catch(() => false)) || (await loeschen.count()) > 0,
      { timeout: 30000 }
    )
    .toBe(true);

  for (let guard = 0; guard < 15; guard++) {
    const count = await loeschen.count();
    if (count === 0) return;
    await loeschen.first().click();
    await confirmDelete(page);
    await expect.poll(async () => loeschen.count(), { timeout: 20000 }).toBeLessThan(count);
    await waitForToastsGone(page);
  }
  throw new Error("Aufräumen Tankbuch abgebrochen");
}

test.describe.configure({ mode: "serial" });

test.describe("PROJ-28: Kaufpreis & Wertentwicklung", () => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_VEHICLE_ID,
    "E2E_EMAIL / E2E_VEHICLE_ID nicht gesetzt"
  );

  test("Vorbereitung: Wegwerf-Fahrzeug leeren", async ({ page }) => {
    test.setTimeout(240_000);
    await anschaffungEntfernen(page);
    await tankbuchLeeren(page);
  });

  test("AC: Wertentwicklung ist über die Kosten-Unternavigation erreichbar", async ({
    page,
  }) => {
    await page.goto(KOSTEN);
    const tab = page.getByRole("link", { name: "Wertentwicklung" });
    await expect(tab).toBeVisible({ timeout: 20000 });
    await expect(tab).toHaveAttribute("href", WERTENTWICKLUNG);
  });

  test("AC: Ohne Kaufpreis erscheint ein Hinweis statt einer Bilanz", async ({
    page,
  }) => {
    await page.goto(WERTENTWICKLUNG);
    await expect(page.getByText("Noch kein Kaufpreis hinterlegt")).toBeVisible({
      timeout: 30000,
    });
    // Keine Bilanz mit angenommenem Kaufpreis 0 €
    await expect(page.getByText("Gesamtbilanz")).not.toBeVisible();
    await expect(karte(page, "Anschaffung")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /Anschaffung im Fahrzeugprofil erfassen/ })
    ).toBeVisible();
  });

  test("AC: Das Fahrzeugprofil funktioniert ohne Kaufpreis vollständig", async ({
    page,
  }) => {
    await page.goto(PROFIL);
    await expect(page.getByText("Anschaffung", { exact: true })).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByRole("button", { name: "Anschaffung erfassen" })
    ).toBeVisible();
    // Die übrigen Profilinhalte sind unberührt
    await expect(page.getByRole("link", { name: "Scheckheft" })).toBeVisible();
  });

  test("AC: Anschaffung mit Nebenkosten wird über das Formular erfasst", async ({
    page,
  }) => {
    await page.goto(PROFIL);
    await page.getByRole("button", { name: "Anschaffung erfassen" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    // Der Vertraulichkeitshinweis muss im Formular stehen
    await expect(
      dialog.getByText(/ausschließlich für dich sichtbar/)
    ).toBeVisible();

    await dialog.getByLabel("Kaufpreis (€)").fill("18500");
    await dialog.getByRole("button", { name: "Position" }).click();
    await dialog.getByPlaceholder("Überführung").fill("Überführung");
    await dialog.getByPlaceholder("€", { exact: true }).fill("500");
    await dialog.getByRole("button", { name: "Erfassen" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });
    await waitForToastsGone(page);

    await expect(page.getByText(ERWARTET.kaufpreis)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Überführung")).toBeVisible();
    await expect(page.getByText(ERWARTET.nebenkosten)).toBeVisible();
    await expect(page.getByText(ERWARTET.anschaffung)).toBeVisible();
  });

  test("AC: Der Abschnitt ist als privat gekennzeichnet", async ({ page }) => {
    await page.goto(PROFIL);
    await expect(page.getByText("privat")).toBeVisible({ timeout: 30000 });
  });

  test("Vorbereitung: Unterhaltskosten erzeugen", async ({ page }) => {
    await page.goto(TANKBUCH);
    await page.getByRole("button", { name: /Tankvorgang erfassen/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.getByLabel("Liter").fill("40");
    await dialog.getByLabel("Gesamtpreis (€)").fill("80");
    await dialog.getByLabel("Kilometerstand").fill("10000");
    await dialog.getByRole("button", { name: "Erfassen" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });
    await waitForToastsGone(page);
  });

  test("KERN: Die Bilanz entspricht der Handrechnung", async ({ page }) => {
    await page.goto(WERTENTWICKLUNG);
    await expect(karte(page, "Anschaffung")).toContainText(ERWARTET.anschaffung, {
      timeout: 30000,
    });
    // Anschaffung und Investition bleiben getrennt ablesbar
    await expect(karte(page, "Anschaffung")).toContainText(ERWARTET.kaufpreis);
    await expect(karte(page, "Investition")).toContainText(ERWARTET.investition);
    await expect(karte(page, "Bisher aufgewendet")).toContainText(
      ERWARTET.aufgewendet
    );
  });

  test("AC: Ohne Marktpreis-Analyse wird nur die Kostenseite gezeigt", async ({
    page,
  }) => {
    await page.goto(WERTENTWICKLUNG);
    await expect(karte(page, "Anschaffung")).toBeVisible({ timeout: 30000 });
    // Keine erfundene Bilanz
    await expect(page.getByText("Gesamtbilanz")).not.toBeVisible();
    await expect(page.getByText("Wertveränderung")).not.toBeVisible();
    await expect(
      page.getByText(/Für den Vergleich mit dem Marktwert/)
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Marktpreis ermitteln/ })
    ).toBeVisible();
  });

  test("AC: Keine Warnung, wenn alle Kosten nach dem Kaufdatum liegen", async ({
    page,
  }) => {
    await page.goto(WERTENTWICKLUNG);
    await expect(karte(page, "Anschaffung")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/vor dem Kaufdatum/)).not.toBeVisible();
  });

  test("SICHERHEIT: Der Kaufpreis steht in keiner fremden Seitenantwort", async ({
    page,
  }) => {
    // Der Kaufpreis liegt erfasst vor. Er darf ausschließlich auf dem
    // Fahrzeugprofil und in der Wertentwicklung auftauchen — nirgends sonst.
    for (const pfad of [
      `${PROFIL}/scheckheft`,
      `${PROFIL}/dokumente`,
      `${PROFIL}/tankbuch`,
      `${KOSTEN}`,
      `${KOSTEN}/einzelkosten`,
      `${KOSTEN}/auswertung`,
      "/dashboard",
    ]) {
      const response = await page.goto(pfad);
      const body = (await response?.text()) ?? "";
      expect(body, `18.500 darf nicht in ${pfad} stehen`).not.toContain("18.500");
      expect(body, `1850000 darf nicht in ${pfad} stehen`).not.toContain("1850000");
    }
  });

  test("AC: Der Kaufpreis fließt nicht in die Kostenanalyse ein", async ({
    page,
  }) => {
    // Anschaffung ist Kapital, kein laufender Aufwand — sonst wäre jede
    // Zeitreihe unbrauchbar
    await page.goto(`${KOSTEN}/auswertung`);
    await expect(karte(page, "Gesamtkosten")).toContainText(ERWARTET.investition, {
      timeout: 30000,
    });
  });

  test("AC: Bearbeiten ändert Kaufpreis und Nebenkosten", async ({ page }) => {
    await page.goto(PROFIL);
    await page.getByRole("button", { name: "Anschaffung bearbeiten" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByLabel("Kaufpreis (€)")).toHaveValue("18500");
    await dialog.getByLabel("Kaufpreis (€)").fill("19500");
    // Vorhandene Nebenkosten-Position entfernen
    await dialog.getByRole("button", { name: /Position 1 entfernen/ }).click();
    await dialog.getByRole("button", { name: "Speichern" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });
    await waitForToastsGone(page);

    await expect(page.getByText("19.500,00 €")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Überführung")).not.toBeVisible();
  });

  test("AC: Darstellung auf allen drei Bildschirmbreiten", async ({ page }) => {
    for (const [breite, hoehe, name] of [
      [375, 812, "Mobil"],
      [768, 1024, "Tablet"],
      [1440, 900, "Desktop"],
    ] as Array<[number, number, string]>) {
      await page.setViewportSize({ width: breite, height: hoehe });
      await page.goto(WERTENTWICKLUNG);
      await expect(karte(page, "Anschaffung"), `${name}`).toContainText(
        "19.500,00 €",
        { timeout: 30000 }
      );
      const ueberbreite = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(ueberbreite, `${name}: waagerechter Überlauf`).toBeLessThanOrEqual(1);
    }
  });

  test("AC: Anschaffung kann entfernt werden", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await anschaffungEntfernen(page);
    await page.goto(WERTENTWICKLUNG);
    await expect(page.getByText("Noch kein Kaufpreis hinterlegt")).toBeVisible({
      timeout: 30000,
    });
  });

  test("Nachbereitung: Wegwerf-Fahrzeug wieder leeren", async ({ page }) => {
    test.setTimeout(240_000);
    await anschaffungEntfernen(page);
    await tankbuchLeeren(page);
  });
});
