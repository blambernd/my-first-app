import { test, expect, type Page } from "@playwright/test";

/**
 * Angemeldete Tests für PROJ-26 (Einzelkosten).
 *
 * Läuft ausschließlich gegen das Wegwerf-Fahrzeug des Testnutzers und räumt vor
 * und nach jedem Lauf auf. Es gibt keine getrennte Testdatenbank.
 *
 * Reihenfolge ist bindend (`mode: "serial"`) — die Tests bauen aufeinander auf.
 *
 * Übernommen aus PROJ-24/25: Erfolgsmeldungen und Cookie-Banner liegen fixiert
 * am unteren Bildrand und fangen dort Klicks ab; `networkidle` läuft am
 * Dev-Server mit HMR-WebSocket grundsätzlich in den Timeout.
 */

const VEHICLE_ID = process.env.E2E_VEHICLE_ID;
const EINZELKOSTEN = `/vehicles/${VEHICLE_ID}/kosten/einzelkosten`;
const SCHECKHEFT = `/vehicles/${VEHICLE_ID}/scheckheft`;

/** Eindeutig, damit im Wegwerf-Fahrzeug nichts Fremdes getroffen wird */
const SERVICE_DESC = "E2E-26 Werkstattrechnung";
const LINKED_PART = "E2E-26 Zylinderkopfdichtung";
const LOOSE_PART = "E2E-26 Vergaserdichtsatz";

async function waitForToastsGone(page: Page) {
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
    timeout: 20000,
  });
}

async function waitForEinzelkosten(page: Page) {
  await expect(
    page
      .getByText("Noch keine Einzelkosten erfasst")
      .or(page.getByRole("heading", { name: "Einzelkosten", exact: true }))
      .first()
  ).toBeVisible({ timeout: 30000 });
}

/** Summe aus der Kennzahlen-Karte, in Cent */
async function readTotalCents(page: Page): Promise<number> {
  // Von der Überschrift "Summe" zwei Ebenen hoch zur Karte, die auch den Betrag
  // enthält (CardTitle → CardHeader → Card)
  const card = page
    .getByText("Summe", { exact: true })
    .locator("xpath=../..");
  const text = (await card.textContent()) ?? "";
  const match = text.match(/([\d.]+,\d{2})\s*€/);
  if (!match) throw new Error(`Keine Summe gefunden in: ${text}`);
  return Math.round(
    Number(match[1].replace(/\./g, "").replace(",", ".")) * 100
  );
}

async function removeAllCosts(page: Page) {
  await page.goto(EINZELKOSTEN);
  await waitForEinzelkosten(page);

  const deleteButtons = page.getByRole("button", {
    name: "Einzelkosten löschen",
  });
  const emptyState = page.getByText("Noch keine Einzelkosten erfasst");

  await expect
    .poll(
      async () =>
        (await emptyState.isVisible().catch(() => false)) ||
        (await deleteButtons.count()) > 0,
      { timeout: 30000 }
    )
    .toBe(true);

  for (let guard = 0; guard < 25; guard++) {
    const count = await deleteButtons.count();
    if (count === 0) return;

    await deleteButtons.first().click();
    await expect(page.getByText("Eintrag löschen?")).toBeVisible({
      timeout: 10000,
    });
    // .last(): "Löschen" trifft auch die Fahrzeug-Löschen-Schaltfläche in der
    // Kopfzeile; der Bestätigungsdialog hängt per Portal am Dokumentende
    await page
      .getByRole("button", { name: "Löschen", exact: true })
      .last()
      .click();
    await expect
      .poll(async () => deleteButtons.count(), { timeout: 20000 })
      .toBeLessThan(count);
    await waitForToastsGone(page);
  }
  throw new Error("Aufräumen abgebrochen — mehr als 25 Einträge vorhanden");
}

/** Entfernt die im Test angelegten Scheckheft-Einträge, sonst nichts */
async function removeTestServiceEntries(page: Page) {
  await page.goto(SCHECKHEFT);
  await expect(
    page.getByRole("button", { name: "Neuer Eintrag" })
  ).toBeVisible({ timeout: 30000 });

  for (let guard = 0; guard < 10; guard++) {
    const row = page.locator("div.py-4").filter({ hasText: SERVICE_DESC });
    const vorher = await row.count();
    if (vorher === 0) return;

    await row.first().locator("button.text-destructive").first().click();
    // Harte Absicherung: Es wird nur geklickt, wenn der Dialog nachweislich zum
    // Scheckheft-Eintrag gehört — nicht etwa zum Fahrzeug selbst.
    await expect(
      page.getByText("Dieser Scheckheft-Eintrag wird unwiderruflich gelöscht.")
    ).toBeVisible({ timeout: 10000 });
    await page
      .getByRole("button", { name: "Löschen", exact: true })
      .last()
      .click();
    await expect
      .poll(async () => row.count(), { timeout: 20000 })
      .toBeLessThan(vorher);
    await waitForToastsGone(page);
  }
  throw new Error("Aufräumen Scheckheft abgebrochen");
}

/** Öffnet den Erfassungsdialog der Einzelkosten */
async function openCostForm(page: Page) {
  await page
    .getByRole("button", { name: /Einzelkosten erfassen|^Erfassen$/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  return dialog;
}

test.describe.configure({ mode: "serial" });

test.describe("PROJ-26: Einzelkosten — Erfassen, Verknüpfen, Doppelzählungsschutz", () => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_VEHICLE_ID,
    "E2E_EMAIL / E2E_VEHICLE_ID nicht gesetzt"
  );

  test("Vorbereitung: Wegwerf-Fahrzeug leeren", async ({ page }) => {
    test.setTimeout(240_000);
    await removeAllCosts(page);
    await removeTestServiceEntries(page);
    await expect(
      page.getByRole("button", { name: "Neuer Eintrag" })
    ).toBeVisible({ timeout: 15000 });
  });

  test("AC: Einzelkosten sind über die Kosten-Unternavigation erreichbar", async ({
    page,
  }) => {
    await page.goto(`/vehicles/${VEHICLE_ID}/kosten`);
    const tab = page.getByRole("link", { name: "Einzelkosten" });
    await expect(tab).toBeVisible({ timeout: 20000 });
    await expect(tab).toHaveAttribute("href", EINZELKOSTEN);
    await tab.click();
    await waitForEinzelkosten(page);
  });

  test("AC: Leerer Zustand nennt den Hinweis und bietet das Erfassen an", async ({
    page,
  }) => {
    await page.goto(EINZELKOSTEN);
    await expect(
      page.getByText("Noch keine Einzelkosten erfasst")
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByRole("button", { name: "Einzelkosten erfassen" })
    ).toBeVisible();
  });

  test("AC: Validierung — leere Bezeichnung und fehlender Betrag werden abgelehnt", async ({
    page,
  }) => {
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);
    const dialog = await openCostForm(page);

    await dialog.getByRole("button", { name: "Erfassen" }).click();
    // Dialog bleibt offen, es wird nichts gespeichert
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/erforderlich|mindestens|Pflicht|ungültig/i).first()).toBeVisible({
      timeout: 10000,
    });
    await dialog.getByRole("button", { name: "Abbrechen" }).click();
  });

  test("AC: Teilefelder erscheinen nur bei der Kostenart Ersatzteile", async ({
    page,
  }) => {
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);
    const dialog = await openCostForm(page);

    // Standard ist "Ersatzteile" — Teilenummer, Menge und Einbaudatum sind da
    await expect(dialog.getByText("Teilenummer (optional)")).toBeVisible();
    await expect(dialog.getByText("Menge", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Einbaudatum (optional)")).toBeVisible();

    // Auf "Wertgutachten" umschalten — die Felder verschwinden
    await dialog.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Wertgutachten" }).click();
    await expect(dialog.getByText("Teilenummer (optional)")).not.toBeVisible();
    await expect(dialog.getByText("Menge", { exact: true })).not.toBeVisible();
    await expect(dialog.getByText("Einbaudatum (optional)")).not.toBeVisible();

    await dialog.getByRole("button", { name: "Abbrechen" }).click();
  });

  test("AC: Eintrag ohne Scheckheft-Zuordnung wird erfasst und zählt zur Summe", async ({
    page,
  }) => {
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);

    const dialog = await openCostForm(page);
    await dialog.getByLabel("Bezeichnung").fill(LOOSE_PART);
    await dialog.getByLabel("Betrag (€)").fill("49.90");
    await dialog.getByLabel("Teilenummer (optional)").fill("E2E-111-222");
    await dialog.getByLabel("Bezugsquelle (optional)").fill("E2E-Teilemarkt");
    // Ohne Zuordnung darf kein Doppelzählungs-Hinweis erscheinen
    await expect(
      dialog.getByText("Betrag ist dort bereits enthalten")
    ).not.toBeVisible();
    await dialog.getByRole("button", { name: "Erfassen" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    await waitForToastsGone(page);

    await expect(page.getByText(LOOSE_PART)).toBeVisible({ timeout: 20000 });
    expect(await readTotalCents(page)).toBe(4990);
  });

  test("Vorbereitung: Scheckheft-Eintrag für die Verknüpfung anlegen", async ({
    page,
  }) => {
    await page.goto(SCHECKHEFT);
    await page.getByRole("button", { name: "Neuer Eintrag" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.getByLabel("Beschreibung *").fill(SERVICE_DESC);
    await dialog.getByLabel("Kilometerstand *").fill("99000");
    await dialog.getByLabel("Kosten (EUR)").fill("800");
    await dialog.getByRole("button", { name: "Eintrag erstellen" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });
    await waitForToastsGone(page);

    await expect(page.getByText(SERVICE_DESC).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("AC: Zuordnung zum Scheckheft weist auf mögliche Doppelerfassung hin", async ({
    page,
  }) => {
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);
    const dialog = await openCostForm(page);

    await dialog
      .getByRole("combobox")
      .filter({ hasText: /Keine Zuordnung/ })
      .click();
    await page.getByRole("option", { name: new RegExp(SERVICE_DESC) }).click();

    await expect(
      dialog.getByText(/sonst zählt er in der Auswertung ein zweites Mal/)
    ).toBeVisible({ timeout: 10000 });
    await expect(
      dialog.getByText("Betrag ist dort bereits enthalten")
    ).toBeVisible();

    await dialog.getByRole("button", { name: "Abbrechen" }).click();
  });

  test("KERN: Als „enthalten“ markierter Betrag zählt nicht zur Summe", async ({
    page,
  }) => {
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);
    const vorher = await readTotalCents(page);

    const dialog = await openCostForm(page);
    await dialog.getByLabel("Bezeichnung").fill(LINKED_PART);
    await dialog.getByLabel("Betrag (€)").fill("120");
    await dialog
      .getByRole("combobox")
      .filter({ hasText: /Keine Zuordnung/ })
      .click();
    await page.getByRole("option", { name: new RegExp(SERVICE_DESC) }).click();
    await dialog.getByRole("switch").click();
    await dialog.getByRole("button", { name: "Erfassen" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    await waitForToastsGone(page);

    // Eintrag ist sichtbar und als enthalten gekennzeichnet …
    await expect(page.getByText(LINKED_PART)).toBeVisible({ timeout: 20000 });
    // exact: true — sonst trifft der Text auch den Hinweis über der Liste
    await expect(
      page.getByText("im Scheckheft enthalten", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(/Ein Eintrag ist als im Scheckheft enthalten markiert/)
    ).toBeVisible();

    // … aber die Summe ist unverändert
    expect(await readTotalCents(page)).toBe(vorher);
  });

  test("KERN: Nach Löschen des Scheckheft-Eintrags zählt der Betrag wieder mit", async ({
    page,
  }) => {
    // Der eigentliche Grund für ON DELETE SET NULL statt CASCADE (Tech Design
    // C1). Ohne diese Kette verschwände ein einmal markierter Betrag dauerhaft
    // und unbemerkt aus der Auswertung. Eine erste Fassung des Schemas hatte
    // hier zusätzlich eine CHECK-Regel, die genau dieses Löschen unmöglich
    // machte — deshalb wird die Kette hier durch die echte Oberfläche geprüft.
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);
    const vorher = await readTotalCents(page);

    await removeTestServiceEntries(page);

    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);

    // Der Einzelkosten-Eintrag lebt weiter …
    await expect(page.getByText(LINKED_PART)).toBeVisible({ timeout: 20000 });
    // … die Kennzeichnung ist wirkungslos geworden …
    await expect(
      page.getByText("im Scheckheft enthalten", { exact: true })
    ).not.toBeVisible();
    await expect(
      page.getByText(/als im Scheckheft enthalten markiert/)
    ).not.toBeVisible();
    // … und der Betrag zählt wieder mit
    expect(await readTotalCents(page)).toBe(vorher + 12000);
  });

  test("AC: Liste ist nach Bezeichnung durchsuchbar und nach Kostenart filterbar", async ({
    page,
  }) => {
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);

    const search = page.getByLabel("Einzelkosten durchsuchen");
    await search.fill("Vergaser");
    await expect(page.getByText(LOOSE_PART)).toBeVisible();
    await expect(page.getByText(LINKED_PART)).not.toBeVisible();

    // Suche über die Teilenummer
    await search.fill("E2E-111");
    await expect(page.getByText(LOOSE_PART)).toBeVisible();

    await search.fill("gibtesnicht");
    await expect(
      page.getByText("Keine Einträge passen zu Suche und Filter.")
    ).toBeVisible();
    await search.fill("");

    // Filter auf eine Kostenart ohne Einträge
    await page.getByLabel("Nach Kostenart filtern").click();
    await page.getByRole("option", { name: "Wertgutachten" }).click();
    await expect(
      page.getByText("Keine Einträge passen zu Suche und Filter.")
    ).toBeVisible();

    await page.getByLabel("Nach Kostenart filtern").click();
    await page.getByRole("option", { name: "Alle Kostenarten" }).click();
    await expect(page.getByText(LOOSE_PART)).toBeVisible();
  });

  test("AC: Summe je Kostenart wird ausgewiesen", async ({ page }) => {
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);
    await expect(page.getByText("Nach Kostenart")).toBeVisible();
    // Beide Einträge sind Ersatzteile: 49,90 + 120,00
    await expect(page.getByText("169,90 €").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("AC: Bearbeiten ändert den Betrag", async ({ page }) => {
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);
    await waitForToastsGone(page);

    // Von der Bezeichnung drei Ebenen hoch zur Zeile, die auch die
    // Schaltflächen enthält — sonst würde die erste Karte der Liste getroffen
    const row = page.getByText(LOOSE_PART).locator("xpath=../../..");
    await row
      .getByRole("button", { name: "Einzelkosten bearbeiten" })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByLabel("Bezeichnung")).toHaveValue(LOOSE_PART);
    await dialog.getByLabel("Betrag (€)").fill("59.90");
    await dialog.getByRole("button", { name: "Speichern" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    await waitForToastsGone(page);

    await expect(page.getByText("59,90 €").first()).toBeVisible({
      timeout: 20000,
    });
    expect(await readTotalCents(page)).toBe(17990);
  });

  test("AC: Löschen entfernt den Eintrag nach Bestätigung", async ({ page }) => {
    await page.goto(EINZELKOSTEN);
    await waitForEinzelkosten(page);
    await waitForToastsGone(page);

    const deleteButtons = page.getByRole("button", {
      name: "Einzelkosten löschen",
    });
    const vorher = await deleteButtons.count();
    await deleteButtons.first().click();

    await expect(page.getByText("Eintrag löschen?")).toBeVisible({
      timeout: 10000,
    });
    await page
      .getByRole("button", { name: "Löschen", exact: true })
      .last()
      .click();

    await expect
      .poll(async () => deleteButtons.count(), { timeout: 20000 })
      .toBe(vorher - 1);
  });

  test("Nachbereitung: Wegwerf-Fahrzeug wieder leeren", async ({ page }) => {
    test.setTimeout(240_000);
    await removeAllCosts(page);
    await removeTestServiceEntries(page);
    await page.goto(EINZELKOSTEN);
    await expect(
      page.getByText("Noch keine Einzelkosten erfasst")
    ).toBeVisible({ timeout: 20000 });
  });
});
