import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * Die abgelegte Sitzung des Testnutzers.
 *
 * Bewusst hier definiert und **nicht** aus `auth.setup.ts` importiert: Jene
 * Datei enthält selbst einen `setup(...)`-Aufruf, der beim Import
 * ausgeführt würde und die ganze Spezifikation zerlegt.
 */
const AUTH_FILE = path.join(process.cwd(), "playwright/.auth/user.json");

/**
 * Angemeldete Tests für PROJ-38 (Händler-Bestandsübersicht).
 *
 * Läuft mit dem regulären Testnutzer, für den der Händlermodus gesetzt ist.
 * Er besitzt das Wegwerf-Fahrzeug aus E2E_VEHICLE_ID — damit ist die
 * Bestandsliste mit echten Daten prüfbar.
 *
 * Die Tests ändern **nichts**: Der Dialog zum Kennzeichnen wird geöffnet und
 * wieder abgebrochen. Ein tatsächliches Kennzeichnen wäre nicht rücknehmbar
 * (die Schaltfläche dafür fehlt noch) und würde den Bestand dauerhaft
 * verändern.
 */

/** Die Zeile des Testfahrzeugs in der Bestandsliste. */
function bestandsZeile(page: Page) {
  return page
    .locator("li")
    .filter({ hasText: "E2E-Testfahrzeug" })
    .filter({
      has: page.getByRole("button", { name: "Als verkauft kennzeichnen" }),
    });
}

test.describe("PROJ-38: Bestand (angemeldet, Händlermodus)", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL nicht gesetzt");

  /**
   * Aufräumen, was auch immer vorher geschah (BEFUND-T).
   *
   * ## Warum das hier stehen muss
   *
   * Der Test weiter unten kennzeichnet das Fahrzeug als verkauft und nimmt
   * das am Ende zurück. Bricht er dazwischen ab — aus welchem Grund auch
   * immer —, bleibt ein Bestandsvorgang stehen. Das Fahrzeug verschwindet
   * dann aus der Bestandsliste, und **jeder folgende Lauf scheitert**: Am
   * 2026-09-21 fielen dadurch sieben Tests reproduzierbar aus, bis der
   * Vorgang von Hand entfernt wurde.
   *
   * Schlimmer noch: Ausgerechnet der Test, der zurücknehmen würde, sucht
   * das Fahrzeug zuerst im Bestand — wo es nicht mehr steht. Die Suite kam
   * aus diesem Zustand nicht mehr heraus.
   *
   * Dieser Abschluss läuft unabhängig vom Ausgang der Tests und setzt
   * nichts voraus: Findet er keinen Vorgang, tut er nichts.
   */
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();

    try {
      await page.goto("/bestand", { timeout: 30000 });

      // Die Verkauft-Liste, nicht der Bestand — dort steht ein
      // liegengebliebener Vorgang.
      const aktionen = page
        .getByRole("button", { name: /Aktionen für .*E2E-Testfahrzeug/i })
        .first();

      if (!(await aktionen.isVisible({ timeout: 8000 }).catch(() => false))) {
        return; // Nichts liegengeblieben — der Normalfall.
      }

      await aktionen.click();

      const eintrag = page.getByRole("menuitem", {
        name: /zurücknehmen|löschen/i,
      });
      if (!(await eintrag.isVisible({ timeout: 5000 }).catch(() => false))) {
        return;
      }
      await eintrag.click();

      const bestaetigen = page.getByRole("button", {
        name: /^(Zurücknehmen|Endgültig löschen)$/,
      });
      if (await bestaetigen.isVisible({ timeout: 5000 }).catch(() => false)) {
        await bestaetigen.click();
        await page.waitForTimeout(2000);
      }
    } catch {
      // Ein gescheitertes Aufräumen darf den Lauf nicht zusätzlich rot
      // färben — die Testergebnisse stehen bereits fest.
    } finally {
      await context.close();
    }
  });

  test("AC: Der Navigationspunkt erscheint für gewerbliche Nutzer", async ({
    page,
  }) => {
    // Serverseitig entschieden — deshalb schon im ausgelieferten HTML.
    const antwort = await page.goto("/dashboard");
    const html = (await antwort?.text()) ?? "";
    expect(html).toContain('href="/bestand"');

    await expect(
      page.getByRole("link", { name: "Bestand" }).first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("AC: Der Schalter steht in den Einstellungen und ist gesetzt", async ({
    page,
  }) => {
    await page.goto("/settings");
    const schalter = page.getByRole("switch", {
      name: "Ich verkaufe Fahrzeuge gewerblich",
    });
    await expect(schalter).toBeVisible({ timeout: 30000 });
    await expect(schalter).toBeChecked();
  });

  test("AC: Die Bestandsliste zeigt das eigene Fahrzeug mit Standzeit", async ({
    page,
  }) => {
    await page.goto("/bestand");
    await expect(page.getByRole("heading", { name: "Bestand" })).toBeVisible({
      timeout: 30000,
    });

    const zeile = bestandsZeile(page);
    await expect(zeile).toHaveCount(1);
    await expect(zeile).toContainText("E2E-Testfahrzeug Wegwerf (1970)");
    // Die Standzeit steht als Text da, nicht nur als Farbe.
    // „Tage?n" deckt auch den Singular ab: Bei genau einem Tag Standzeit
    // schreibt die Seite „seit 1 Tag im Bestand". Der Ausdruck kannte nur
    // den Plural und schlug deshalb an genau einem Tag im Jahr fehl.
    await expect(zeile).toContainText(/seit \d+ Tage?n? im Bestand|heute zugegangen/);
  });

  test("AC: Der Einkaufspreis stammt aus dem Kaufpreisfeld", async ({ page }) => {
    // Das Testfahrzeug traegt einen Kaufpreis (PROJ-28). Er muss in der
    // Bestandszeile stehen - in Fahrzeugwaehrung, ohne Umrechnung.
    await page.goto("/bestand");
    const zeile = bestandsZeile(page);
    await expect(zeile).toHaveCount(1, { timeout: 30000 });
    await expect(zeile).toContainText("18.500,00");
  });

  test("AC: Die Suche filtert den Bestand", async ({ page }) => {
    await page.goto("/bestand");
    const suche = page.getByLabel("Bestand durchsuchen");
    await expect(suche).toBeVisible({ timeout: 30000 });

    await suche.fill("Wegwerf");
    await expect(bestandsZeile(page)).toHaveCount(1);

    await suche.fill("Bugatti");
    await expect(page.getByText(/Kein Fahrzeug passt zu/)).toBeVisible();
    await expect(bestandsZeile(page)).toHaveCount(0);

    await suche.fill("");
    await expect(bestandsZeile(page)).toHaveCount(1);
  });

  test("AC: Drei Sortierungen, Standzeit als Voreinstellung", async ({
    page,
  }) => {
    await page.goto("/bestand");
    const sortierung = page.getByLabel("Sortierung");
    await expect(sortierung).toBeVisible({ timeout: 30000 });
    await expect(sortierung).toContainText("Standzeit");

    await sortierung.click();
    for (const name of ["Standzeit", "Kaufdatum", "Fahrzeugname"]) {
      await expect(page.getByRole("option", { name })).toBeVisible();
    }
    await page.getByRole("option", { name: "Kaufdatum" }).click();
    await expect(sortierung).toContainText("Kaufdatum");
  });

  test("AC: Die Ansicht Verkauft erklaert ihren Leerzustand", async ({
    page,
  }) => {
    await page.goto("/bestand");
    await expect(page.getByText("Verkauft").first()).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByText(/Noch kein abgeschlossener Verkauf/)
    ).toBeVisible();
  });

  test("AC: Der Dialog nennt Datum, Erlös und weist auf die Übergabe hin", async ({
    page,
  }) => {
    await page.goto("/bestand");
    await page
      .getByRole("button", { name: "Als verkauft kennzeichnen" })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByLabel("Verkaufsdatum *")).toBeVisible();
    await expect(dialog.getByLabel(/Verkaufserlös/)).toBeVisible();
    // Der Erlös ist freiwillig — das muss dastehen.
    await expect(dialog.getByText(/Ohne Erlös bleibt der Vorgang/)).toBeVisible();
    // Hinweis auf die Übergabe, ohne sie zur Bedingung zu machen.
    await expect(dialog.getByRole("link", { name: "Fahrzeugübergabe" })).toBeVisible();
    await expect(dialog.getByText(/Akte bleibt hier in beiden Fällen/)).toBeVisible();

    // Bewusst abbrechen: Ein Kennzeichnen wäre derzeit nicht rücknehmbar.
    await dialog.getByRole("button", { name: "Abbrechen" }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("AC: Die Seite ist bei 375 px bedienbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/bestand");

    await expect(page.getByRole("heading", { name: "Bestand" })).toBeVisible({
      timeout: 30000,
    });
    await expect(bestandsZeile(page)).toHaveCount(1);
    await expect(page.getByLabel("Bestand durchsuchen")).toBeVisible();

    const ueberlauf = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(ueberlauf, "Seite läuft bei 375 px waagerecht über").toBe(false);
  });

  test("Behobene Fehler: kennzeichnen, pruefen, zuruecknehmen", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // Deckt drei behobene Fehler in einem Durchlauf ab:
    //   BUG-1 — das Fahrzeug verlaesst den Bestand
    //   BUG-3 — der Erloes laesst sich nachtraeglich korrigieren
    //   BUG-4 — der Vorgang laesst sich zuruecknehmen
    //
    // Der Test raeumt am Ende auf: Ohne die Ruecknahme (BUG-4) waere er nicht
    // wiederholbar — genau deshalb war er vorher ausgesetzt.
    await page.goto("/bestand");
    await expect(bestandsZeile(page)).toHaveCount(1, { timeout: 30000 });

    // 1. Kennzeichnen
    await page
      .getByRole("button", { name: "Als verkauft kennzeichnen" })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await dialog.getByLabel(/Verkaufserlös/).fill("21000");
    await dialog.getByRole("button", { name: "Kennzeichnen" }).click();
    await expect(dialog).toHaveCount(0, { timeout: 20000 });

    // 2. BUG-1: nicht mehr im Bestand, dafuer unter "Verkauft"
    await expect(bestandsZeile(page)).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByText("0 Fahrzeuge im Bestand")).toBeVisible();
    const verkauftZeile = page
      .locator("li")
      .filter({ hasText: "E2E-Testfahrzeug" });
    await expect(verkauftZeile).toHaveCount(1);
    // Rohspanne aus 18.500 Einkauf und 21.000 Erloes
    await expect(verkauftZeile).toContainText("2.500,00");

    // 3. BUG-3: Erloes korrigieren
    await page.getByRole("button", { name: /Aktionen für/ }).first().click();
    await page.getByRole("menuitem", { name: /Erlös korrigieren/ }).click();
    const erloesDialog = page.getByRole("dialog");
    await expect(erloesDialog).toBeVisible({ timeout: 20000 });
    await erloesDialog.getByLabel(/Verkaufserlös/).fill("22000");
    await erloesDialog.getByRole("button", { name: "Speichern" }).click();
    await expect(erloesDialog).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByText("3.500,00").first()).toBeVisible({
      timeout: 20000,
    });

    // 4. BUG-4: zuruecknehmen — das Fahrzeug kehrt in den Bestand zurueck
    await page.getByRole("button", { name: /Aktionen für/ }).first().click();
    await page.getByRole("menuitem", { name: /zurücknehmen/ }).click();
    await expect(
      page.getByRole("alertdialog").getByText(/Das Fahrzeug selbst bleibt unberührt/)
    ).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "Zurücknehmen" }).click();

    await expect(bestandsZeile(page)).toHaveCount(1, { timeout: 20000 });
    await expect(
      page.getByText(/Noch kein abgeschlossener Verkauf/)
    ).toBeVisible();
  });

  test("BUG-2: Die Bestandsseite zeigt ihren eigenen Navigationspunkt", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/bestand");
    const leiste = page
      .locator("nav")
      .filter({ has: page.getByRole("link", { name: "Dashboard" }) });
    await expect(leiste.getByRole("link", { name: "Bestand" })).toBeVisible({
      timeout: 30000,
    });
  });
});
