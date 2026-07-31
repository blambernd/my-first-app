import { test, expect, type Page } from "@playwright/test";

/**
 * Schreibende Tests für PROJ-24 (Tankbuch): Erfassen, Verbrauchsberechnung,
 * Bearbeiten, Löschen.
 *
 * Läuft ausschließlich gegen das **Wegwerf-Fahrzeug** des dedizierten
 * Testnutzers (E2E_VEHICLE_ID). Es gibt keine getrennte Testdatenbank, deshalb
 * ist der Datenbereich strikt eingegrenzt und jeder Lauf räumt hinter sich auf —
 * sowohl zu Beginn als auch am Ende.
 *
 * Reihenfolge ist bindend (`mode: "serial"`): Die Tests bauen aufeinander auf.
 */

const VEHICLE_ID = process.env.E2E_VEHICLE_ID;
const TANKBUCH = `/vehicles/${VEHICLE_ID}/tankbuch`;

/**
 * Wartet, bis das Tankbuch geladen ist.
 *
 * Bewusst kein `waitForLoadState("networkidle")`: Der Next.js-Dev-Server hält
 * über den HMR-WebSocket dauerhaft eine offene Verbindung, das Netzwerk wird nie
 * ruhig und der Aufruf läuft in den Timeout.
 */
/**
 * Wartet, bis keine Erfolgsmeldung mehr eingeblendet ist.
 *
 * Die Toasts liegen fixiert unten rechts und fangen dort Klicks ab — genau über
 * den Bearbeiten- und Löschen-Schaltflächen der Einträge. Ohne dieses Abwarten
 * scheitern Folgeklicks mit einem Timeout, obwohl das Element sichtbar und
 * aktiv ist.
 */
async function waitForToastsGone(page: Page) {
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
    timeout: 20000,
  });
}

async function waitForTankbuch(page: Page) {
  await expect(
    page
      .getByText("Noch keine Tankvorgänge erfasst")
      .or(page.getByRole("heading", { name: "Tankbuch" }))
      .first()
  ).toBeVisible({ timeout: 30000 });
}

/** Entfernt alle Tankvorgänge des Wegwerf-Fahrzeugs über die Oberfläche */
async function removeAllEntries(page: Page) {
  await page.goto(TANKBUCH);
  await waitForTankbuch(page);

  const deleteButtons = page.getByRole("button", {
    name: "Tankvorgang löschen",
  });
  const emptyState = page.getByText("Noch keine Tankvorgänge erfasst");

  // count() ist eine Momentaufnahme. Ohne diese Wartebedingung liefert sie 0,
  // bevor die Liste gerendert ist — das Aufräumen bricht dann ab, ohne etwas
  // gelöscht zu haben, und der nächste Lauf startet mit Altlasten.
  async function waitForListSettled() {
    await expect
      .poll(
        async () =>
          (await emptyState.isVisible().catch(() => false)) ||
          (await deleteButtons.count()) > 0,
        { timeout: 30000 }
      )
      .toBe(true);
  }

  await waitForListSettled();

  // Ein stilles "nichts gefunden, nichts getan" wäre der schlimmste Ausgang:
  // Der nächste Lauf startet dann mit Altlasten und scheitert an anderer Stelle.
  // Deshalb wird der Ausgangszustand ausdrücklich festgehalten.
  const initial = await deleteButtons.count();
  if (initial === 0) {
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    return;
  }

  for (let guard = 0; guard < 25; guard++) {
    const count = await deleteButtons.count();
    if (count === 0) return;

    await deleteButtons.first().click();

    // .last(): "Löschen" trifft auch die Fahrzeug-Löschen-Schaltfläche in der
    // Kopfzeile. Der Bestätigungsdialog wird per Portal ans Dokumentende
    // gehängt und ist damit der letzte Treffer. Ohne .last() bricht Playwrights
    // Strict Mode bei zwei Treffern ab.
    const confirmButton = page
      .getByRole("button", { name: "Löschen", exact: true })
      .last();
    await expect(confirmButton).toBeVisible({ timeout: 10000 });
    await confirmButton.click();

    // Auf eine kürzere Liste warten, nicht auf das Netzwerk. Bewusst
    // "kleiner als" statt exakt count-1: Während router.refresh() läuft, kann
    // die Liste kurzzeitig ganz leer sein.
    await expect
      .poll(async () => deleteButtons.count(), { timeout: 20000 })
      .toBeLessThan(count);

    // Erfolgsmeldung abwarten, sonst blockiert sie den nächsten Löschklick
    await waitForToastsGone(page);
  }
  throw new Error("Aufräumen abgebrochen — mehr als 25 Einträge vorhanden");
}

async function addEntry(
  page: Page,
  values: { liters: string; cost: string; km: string }
) {
  await page
    .getByRole("button", { name: /Tankvorgang erfassen/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });

  await dialog.getByLabel("Liter").fill(values.liters);
  await dialog.getByLabel("Gesamtpreis (€)").fill(values.cost);
  await dialog.getByLabel("Kilometerstand").fill(values.km);

  await dialog.getByRole("button", { name: "Erfassen" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 15000 });
  await waitForToastsGone(page);
}

test.describe.configure({ mode: "serial" });

test.describe("PROJ-24: Tankbuch — Erfassen, Rechnen, Ändern, Löschen", () => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_VEHICLE_ID,
    "E2E_EMAIL / E2E_VEHICLE_ID nicht gesetzt"
  );

  // Aufräumen bewusst als eigene Tests statt als Hooks: Ein in beforeAll/afterAll
  // selbst erzeugter Browser-Kontext verhielt sich hier nicht wie die page-Fixture
  // und löschte still nichts. Als Test mit der regulären Fixture ist das Verhalten
  // identisch zu allen anderen Schritten — und ein Fehlschlag wird sichtbar,
  // statt lautlos Altlasten für den nächsten Lauf zu hinterlassen.
  test("Vorbereitung: Wegwerf-Fahrzeug leeren", async ({ page }) => {
    test.setTimeout(180_000);
    await removeAllEntries(page);
    await expect(page.getByText("Noch keine Tankvorgänge erfasst")).toBeVisible({
      timeout: 15000,
    });
  });

  test("AC-1: Tankvorgang wird erfasst und erscheint in der Liste", async ({
    page,
  }) => {
    await page.goto(TANKBUCH);
    await expect(page.getByText("Noch keine Tankvorgänge erfasst")).toBeVisible({
      timeout: 15000,
    });

    await addEntry(page, { liters: "40", cost: "80", km: "50000" });

    await expect(page.getByText("Noch keine Tankvorgänge erfasst")).not.toBeVisible();
    // .first(): Werte erscheinen sowohl im Eintrag als auch in den Kennzahlen
    await expect(page.getByText("40,0 L").first()).toBeVisible();
    await expect(page.getByText("50.000 km").first()).toBeVisible();
  });

  test("AC-5: Preis pro Liter wird ausgewiesen", async ({ page }) => {
    await page.goto(TANKBUCH);
    // 80,00 € auf 40 L = 2,00 €/L
    await expect(page.getByText("2,00 €/L").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("AC-8: Beim ersten Tankvorgang wird kein Verbrauch ausgewiesen", async ({
    page,
  }) => {
    await page.goto(TANKBUCH);
    await expect(page.getByText("kein Verbrauch berechenbar")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByText("Verfügbar ab der zweiten Volltankung")
    ).toBeVisible();
  });

  test("AC-6: Nach der zweiten Volltankung wird der Verbrauch berechnet", async ({
    page,
  }) => {
    await page.goto(TANKBUCH);
    // 50 L auf 500 km = 10,0 L/100km
    await addEntry(page, { liters: "50", cost: "100", km: "50500" });

    await expect(page.getByText("10,0").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("50.000 – 50.500 km")).toBeVisible();
  });

  test("AC-9: Durchschnittsverbrauch erscheint in den Kennzahlen", async ({
    page,
  }) => {
    await page.goto(TANKBUCH);
    await expect(
      page.getByText("Verfügbar ab der zweiten Volltankung")
    ).not.toBeVisible();
    await expect(page.getByText("L/100km").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("AC-12: Bearbeiten passt den Verbrauch neu an", async ({ page }) => {
    await page.goto(TANKBUCH);
    await waitForTankbuch(page);

    // Neuester Eintrag zuerst — das ist der mit 50.500 km
    await waitForToastsGone(page);
    const editButton = page
      .getByRole("button", { name: "Tankvorgang bearbeiten" })
      .first();
    await expect(editButton).toBeVisible({ timeout: 20000 });
    await editButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // 50 L auf 1000 km = 5,0 L/100km statt 10,0
    await dialog.getByLabel("Kilometerstand").fill("51000");
    await dialog.getByRole("button", { name: "Speichern" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });

    await expect(page.getByText("5,0").first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("50.000 – 51.000 km")).toBeVisible();
  });

  test("AC-13: Löschen entfernt den Eintrag nach Bestätigung", async ({
    page,
  }) => {
    await page.goto(TANKBUCH);
    await waitForTankbuch(page);

    const deleteButton = page
      .getByRole("button", { name: "Tankvorgang löschen" })
      .first();
    await expect(deleteButton).toBeVisible({ timeout: 20000 });
    await deleteButton.click();

    // Bestätigungsdialog erscheint mit Rückfrage
    await expect(page.getByText("Tankvorgang löschen?")).toBeVisible({
      timeout: 10000,
    });
    const confirmButton = page.getByRole("button", {
      name: "Löschen",
      exact: true,
    });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Nur noch ein Eintrag — und der kann keinen Verbrauch mehr ausweisen
    await expect(
      page.getByRole("button", { name: "Tankvorgang löschen" })
    ).toHaveCount(1, { timeout: 20000 });
    await expect(page.getByText("kein Verbrauch berechenbar")).toBeVisible({
      timeout: 15000,
    });
  });

  test("Nachbereitung: Wegwerf-Fahrzeug wieder leeren", async ({ page }) => {
    test.setTimeout(180_000);
    await removeAllEntries(page);
    await expect(page.getByText("Noch keine Tankvorgänge erfasst")).toBeVisible({
      timeout: 15000,
    });
  });
});
