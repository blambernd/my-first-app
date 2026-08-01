import { test, expect, type Page } from "@playwright/test";

/**
 * Angemeldete Tests für PROJ-27 (Kostenanalyse).
 *
 * Besonderheit gegenüber den anderen Features: Die Auswertung erfasst nichts
 * Eigenes. Deshalb legen diese Tests ihre Daten **durch die echten
 * Erfassungsmasken** von PROJ-24, PROJ-3, PROJ-25 und PROJ-26 an und prüfen
 * anschließend, ob die Auswertung daraus die von Hand nachgerechneten Zahlen
 * bildet. Genau an dieser Naht — vier Quellen, eine Summe — kann etwas
 * schiefgehen, das kein Unit-Test sieht.
 *
 * Läuft ausschließlich gegen das Wegwerf-Fahrzeug und räumt vor und nach dem
 * Lauf auf. Es gibt keine getrennte Testdatenbank.
 */

const VEHICLE_ID = process.env.E2E_VEHICLE_ID;
const AUSWERTUNG = `/vehicles/${VEHICLE_ID}/kosten/auswertung`;
const TANKBUCH = `/vehicles/${VEHICLE_ID}/tankbuch`;
const SCHECKHEFT = `/vehicles/${VEHICLE_ID}/scheckheft`;
const KOSTEN = `/vehicles/${VEHICLE_ID}/kosten`;
const EINZELKOSTEN = `${KOSTEN}/einzelkosten`;

const SERVICE_DESC = "E2E-27 Inspektion";
const LOOSE_PART = "E2E-27 Dichtsatz";
const LINKED_PART = "E2E-27 Vergaserteile";

/**
 * Die Handrechnung, gegen die geprüft wird:
 *
 *   Benzin       80,00 + 70,00                  = 150,00 €
 *   Wartung      Inspektion                     = 200,00 €
 *   Versicherung 1200 €/Jahr, 1 Monat im Zeitraum = 100,00 €
 *   Ersatzteile  50,00 € (der zweite Posten ist
 *                als im Scheckheft enthalten markiert
 *                und zählt nicht)              =  50,00 €
 *   ------------------------------------------------------
 *   Summe                                        500,00 €
 *   ausgeschlossen                               120,00 €
 *   Fahrleistung 10.000 → 11.000 km            = 1.000 km
 *   Kosten je km 50.000 ct / 1.000 km          =   0,50 €
 */
const ERWARTET = {
  gesamt: "500,00 €",
  benzin: "150,00 €",
  wartung: "200,00 €",
  versicherung: "100,00 €",
  ersatzteile: "50,00 €",
  ausgeschlossen: "120,00 €",
  proKm: "0,50 € / km",
  fahrleistung: "1.000 km",
  // Die aktuelle Standkosten-Belastung: 1.200 € Jahresbeitrag sind 100 € im
  // Monat. Nicht der Durchschnitt über den Zeitraum — siehe QA BUG-1.
  standProMonat: "100,00 €",
  // Die Jahresangabe ist die Summe des laufenden Kalenderjahres, nicht die
  // hochgerechnete Jahresrate (QA BUG-3). Der Vertrag beginnt am Ersten des
  // laufenden Monats, es fallen also nur die restlichen Monate des Jahres an.
  standProJahr: `${(
    (12 - new Date().getMonth()) * 100
  ).toLocaleString("de-DE")},00 € in ${new Date().getFullYear()}`,
};

async function waitForToastsGone(page: Page) {
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
    timeout: 20000,
  });
}

/** Bestätigungsdialoge: „Löschen" trifft auch die Schaltfläche in der Fahrzeug-Kopfzeile */
async function confirmDelete(page: Page) {
  await page.getByRole("button", { name: "Löschen", exact: true }).last().click();
}

async function removeAll(
  page: Page,
  url: string,
  deleteLabel: string,
  emptyText: string
) {
  await page.goto(url);
  const deleteButtons = page.getByRole("button", { name: deleteLabel });
  const emptyState = page.getByText(emptyText);

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
    await confirmDelete(page);
    await expect
      .poll(async () => deleteButtons.count(), { timeout: 20000 })
      .toBeLessThan(count);
    await waitForToastsGone(page);
  }
  throw new Error(`Aufräumen abgebrochen: ${url}`);
}

async function removeTestServiceEntries(page: Page) {
  await page.goto(SCHECKHEFT);
  await expect(page.getByRole("button", { name: "Neuer Eintrag" })).toBeVisible({
    timeout: 30000,
  });

  for (let guard = 0; guard < 10; guard++) {
    const row = page.locator("div.py-4").filter({ hasText: SERVICE_DESC });
    const vorher = await row.count();
    if (vorher === 0) return;

    await row.first().locator("button.text-destructive").first().click();
    // Absicherung: Es wird nur bestätigt, wenn der Dialog nachweislich zum
    // Scheckheft-Eintrag gehört — nicht etwa zum Fahrzeug selbst
    await expect(
      page.getByText("Dieser Scheckheft-Eintrag wird unwiderruflich gelöscht.")
    ).toBeVisible({ timeout: 10000 });
    await confirmDelete(page);
    await expect.poll(async () => row.count(), { timeout: 20000 }).toBeLessThan(vorher);
    await waitForToastsGone(page);
  }
  throw new Error("Aufräumen Scheckheft abgebrochen");
}

async function leeren(page: Page) {
  await removeAll(page, TANKBUCH, "Tankvorgang löschen", "Noch keine Tankvorgänge erfasst");
  await removeAll(page, EINZELKOSTEN, "Einzelkosten löschen", "Noch keine Einzelkosten erfasst");
  await removeAll(page, KOSTEN, "Laufende Kosten löschen", "Noch keine laufenden Kosten hinterlegt");
  await removeTestServiceEntries(page);
}

/**
 * Kennzahlen-Karte mit der gegebenen Überschrift.
 *
 * `.first()` ist nötig, weil „Standkosten" zugleich der Name eines Reiters ist.
 * Die Kennzahlen stehen im Markup vor den Reitern, der erste Treffer ist also
 * die Karte. Von der Überschrift zwei Ebenen hoch liegt die Karte samt Betrag.
 */
function kennzahl(page: Page, titel: string) {
  return page.getByText(titel, { exact: true }).first().locator("xpath=../..");
}

/** Betrag aus der Detailtabelle zu einer Kostenart */
function tabellenBetrag(page: Page, kostenart: string) {
  return page
    .getByRole("row")
    .filter({ hasText: new RegExp(`^\\s*${kostenart}`) })
    .first();
}

test.describe.configure({ mode: "serial" });

test.describe("PROJ-27: Kostenanalyse — vier Quellen, eine Summe", () => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_VEHICLE_ID,
    "E2E_EMAIL / E2E_VEHICLE_ID nicht gesetzt"
  );

  test("Vorbereitung: Wegwerf-Fahrzeug leeren", async ({ page }) => {
    test.setTimeout(300_000);
    await leeren(page);
    await page.goto(AUSWERTUNG);
    await expect(page.getByText("Noch keine Kosten zum Auswerten")).toBeVisible({
      timeout: 30000,
    });
  });

  test("AC: Auswertung ist über die Kosten-Unternavigation erreichbar", async ({
    page,
  }) => {
    await page.goto(KOSTEN);
    const tab = page.getByRole("link", { name: "Auswertung" });
    await expect(tab).toBeVisible({ timeout: 20000 });
    await expect(tab).toHaveAttribute("href", AUSWERTUNG);
    await tab.click();
    await expect(page).toHaveURL(/\/kosten\/auswertung$/);
  });

  test("AC: Leerer Zustand verweist auf alle vier Erfassungen", async ({
    page,
  }) => {
    await page.goto(AUSWERTUNG);
    await expect(page.getByText("Noch keine Kosten zum Auswerten")).toBeVisible({
      timeout: 30000,
    });
    for (const ziel of ["Tankbuch", "Scheckheft", "Laufende Kosten", "Einzelkosten"]) {
      await expect(
        page.getByRole("link", { name: new RegExp(ziel) }).first()
      ).toBeVisible();
    }
    // Keine leeren Diagramme im leeren Zustand
    await expect(page.getByText("Verteilung nach Kostenart")).not.toBeVisible();
  });

  test("Vorbereitung: Daten über die echten Erfassungsmasken anlegen", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    // --- Tankbuch: zwei Vorgänge, 1.000 km auseinander ---
    await page.goto(TANKBUCH);
    for (const eintrag of [
      { liters: "40", cost: "80", km: "10000" },
      { liters: "38", cost: "70", km: "11000" },
    ]) {
      await page.getByRole("button", { name: /Tankvorgang erfassen/ }).first().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 15000 });
      await dialog.getByLabel("Liter").fill(eintrag.liters);
      await dialog.getByLabel("Gesamtpreis (€)").fill(eintrag.cost);
      await dialog.getByLabel("Kilometerstand").fill(eintrag.km);
      await dialog.getByRole("button", { name: "Erfassen" }).click();
      await expect(dialog).not.toBeVisible({ timeout: 20000 });
      await waitForToastsGone(page);
    }

    // --- Scheckheft: Inspektion mit Kosten (wird zu "Wartung") ---
    await page.goto(SCHECKHEFT);
    await page.getByRole("button", { name: "Neuer Eintrag" }).click();
    let dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.getByLabel("Beschreibung *").fill(SERVICE_DESC);
    await dialog.getByLabel("Kilometerstand *").fill("10500");
    await dialog.getByLabel("Kosten (EUR)").fill("200");
    await dialog.getByRole("button", { name: "Eintrag erstellen" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 25000 });
    await waitForToastsGone(page);

    // --- Laufende Kosten: Versicherung 1200 € jährlich ---
    await page.goto(KOSTEN);
    await page
      .getByRole("button", { name: /Laufende Kosten erfassen|^Erfassen$/ })
      .first()
      .click();
    dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.getByLabel("Betrag (€)").fill("1200");
    await dialog.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "jährlich", exact: true }).click();
    await dialog.getByRole("button", { name: "Erfassen" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });
    await waitForToastsGone(page);

    // --- Einzelkosten: einer zählt, einer ist im Scheckheft enthalten ---
    await page.goto(EINZELKOSTEN);
    for (const eintrag of [
      { name: LOOSE_PART, betrag: "50", verknuepfen: false },
      { name: LINKED_PART, betrag: "120", verknuepfen: true },
    ]) {
      await page
        .getByRole("button", { name: /Einzelkosten erfassen|^Erfassen$/ })
        .first()
        .click();
      dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 15000 });
      await dialog.getByLabel("Bezeichnung").fill(eintrag.name);
      await dialog.getByLabel("Betrag (€)").fill(eintrag.betrag);
      if (eintrag.verknuepfen) {
        await dialog
          .getByRole("combobox")
          .filter({ hasText: /Keine Zuordnung/ })
          .click();
        await page.getByRole("option", { name: new RegExp(SERVICE_DESC) }).click();
        await dialog.getByRole("switch").click();
      }
      await dialog.getByRole("button", { name: "Erfassen" }).click();
      await expect(dialog).not.toBeVisible({ timeout: 20000 });
      await waitForToastsGone(page);
    }

    await expect(page.getByText(LOOSE_PART)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(LINKED_PART)).toBeVisible();
  });

  test("KERN: Die Gesamtsumme entspricht der Handrechnung über alle vier Quellen", async ({
    page,
  }) => {
    await page.goto(AUSWERTUNG);
    await expect(kennzahl(page, "Gesamtkosten")).toContainText(ERWARTET.gesamt, {
      timeout: 30000,
    });
  });

  test("KERN: Als im Scheckheft enthalten markierter Betrag zählt nicht mit", async ({
    page,
  }) => {
    await page.goto(AUSWERTUNG);
    const hinweis = page.getByText(/als im Scheckheft enthalten markiert/);
    await expect(hinweis).toBeVisible({ timeout: 30000 });
    // toContainText statt getByText(RegExp): Die deutsche Währungsformatierung
    // setzt ein geschütztes Leerzeichen vor das €-Zeichen. Ein Regex vergleicht
    // roh und trifft es nicht, toContainText normalisiert Leerraum.
    await expect(hinweis).toContainText(ERWARTET.ausgeschlossen);
    // 120 € tauchen nicht in der Kostenart Ersatzteile auf
    await expect(tabellenBetrag(page, "Ersatzteile")).toContainText(
      ERWARTET.ersatzteile
    );
    await expect(tabellenBetrag(page, "Ersatzteile")).not.toContainText("170,00 €");
  });

  test("AC: Jede Quelle landet in ihrer Kostenart", async ({ page }) => {
    await page.goto(AUSWERTUNG);
    await expect(tabellenBetrag(page, "Benzin")).toContainText(ERWARTET.benzin, {
      timeout: 30000,
    });
    // Inspektion muss als Wartung erscheinen, nicht als Reparatur
    await expect(tabellenBetrag(page, "Wartung")).toContainText(ERWARTET.wartung);
    await expect(tabellenBetrag(page, "Versicherung")).toContainText(
      ERWARTET.versicherung
    );
    await expect(tabellenBetrag(page, "Ersatzteile")).toContainText(
      ERWARTET.ersatzteile
    );
  });

  test("AC: Fixkosten gehen monatlich umgelegt ein, nicht als Einmalbetrag", async ({
    page,
  }) => {
    // 1.200 € jährlich dürfen nicht als 1.200 € im Zahlungsmonat erscheinen
    await page.goto(AUSWERTUNG);
    await expect(tabellenBetrag(page, "Versicherung")).toContainText(
      ERWARTET.versicherung,
      { timeout: 30000 }
    );
    await expect(tabellenBetrag(page, "Versicherung")).not.toContainText(
      "1.200,00 €"
    );
  });

  test("AC: Nicht erfasste Kostenarten werden benannt, nicht als 0 € gezeigt", async ({
    page,
  }) => {
    await page.goto(AUSWERTUNG);
    await expect(
      page.getByText(/Diese Kostenarten sind noch/)
    ).toBeVisible({ timeout: 30000 });
    for (const fehlend of ["Kfz-Steuer", "Unterstellung / Garage", "Wertgutachten"]) {
      await expect(page.getByText(fehlend, { exact: true })).toBeVisible();
    }
    // Nicht erfasste Arten erscheinen nicht als Nullzeile in der Tabelle
    await expect(tabellenBetrag(page, "Kfz-Steuer")).toHaveCount(0);
  });

  test("AC: Kosten pro Kilometer werden mit ihrer Grundlage ausgewiesen", async ({
    page,
  }) => {
    await page.goto(AUSWERTUNG);
    const karte = kennzahl(page, "Kosten pro Kilometer");
    await expect(karte).toContainText(ERWARTET.proKm, { timeout: 30000 });
    await expect(karte).toContainText(ERWARTET.fahrleistung);
  });

  test("AC: Standkosten nennen die aktuelle Belastung je Monat und je Jahr", async ({
    page,
  }) => {
    // Regressionstest für QA BUG-1: Die Versicherung kostet 1.200 € im Jahr,
    // also 100 € im Monat. Zuvor wurde über alle Monate des Zeitraums
    // gemittelt und dadurch 12,50 € angezeigt — achtfach zu wenig und im
    // Widerspruch zu PROJ-25, das für dieselben Daten 100,00 € nennt.
    await page.goto(AUSWERTUNG);
    const karte = kennzahl(page, "Standkosten aktuell");
    await expect(karte).toContainText(ERWARTET.standProMonat, { timeout: 30000 });
    await expect(karte).toContainText(ERWARTET.standProJahr);
  });

  test("KERN: Standkosten stimmen mit der Anzeige in PROJ-25 überein", async ({
    page,
  }) => {
    // Dieselben Daten dürfen auf zwei Seiten nicht widersprechen
    await page.goto(KOSTEN);
    await expect(page.getByText("Aktuell pro Monat")).toBeVisible({
      timeout: 30000,
    });
    const laufendeSeite = page
      .getByText("Aktuell pro Monat")
      .locator("xpath=../..");
    await expect(laufendeSeite).toContainText(ERWARTET.standProMonat);

    await page.goto(AUSWERTUNG);
    await expect(kennzahl(page, "Standkosten aktuell")).toContainText(
      ERWARTET.standProMonat,
      { timeout: 30000 }
    );
  });

  test("AC: Ohne künftig datierte Einträge erscheint kein entsprechender Hinweis", async ({
    page,
  }) => {
    // Gegenprobe zu QA BUG-2. Der Hinweis selbst wird auf Unit-Ebene geprüft
    // (drei Tests in cost-analysis.test.ts); ihn hier zu erzeugen verlangte,
    // einen Datumswähler zwei Monate vorzublättern — viel Aufwand und
    // Flackerrisiko für eine Zeile, die strukturgleich zu drei bereits
    // abgedeckten Hinweisen ist. Geprüft wird deshalb der negative Zweig:
    // Bei ausschließlich vergangenen Daten darf der Hinweis nicht erscheinen.
    await page.goto(AUSWERTUNG);
    await expect(kennzahl(page, "Gesamtkosten")).toContainText(ERWARTET.gesamt, {
      timeout: 30000,
    });
    await expect(page.getByText(/in der Zukunft und/)).not.toBeVisible();
  });

  test("AC: Aufteilung nach Stand- und Fahrtkosten", async ({ page }) => {
    await page.goto(AUSWERTUNG);
    await expect(kennzahl(page, "Gesamtkosten")).toBeVisible({ timeout: 30000 });

    await page.getByRole("tab", { name: "Standkosten" }).click();
    await expect(tabellenBetrag(page, "Versicherung")).toBeVisible();
    await expect(tabellenBetrag(page, "Benzin")).toHaveCount(0);

    await page.getByRole("tab", { name: "Fahrtkosten" }).click();
    await expect(tabellenBetrag(page, "Benzin")).toBeVisible();
    await expect(tabellenBetrag(page, "Versicherung")).toHaveCount(0);

    await page.getByRole("tab", { name: "Alle Kostenarten" }).click();
    await expect(tabellenBetrag(page, "Benzin")).toBeVisible();
    await expect(tabellenBetrag(page, "Versicherung")).toBeVisible();
  });

  test("AC: Beide Diagramme werden gezeichnet", async ({ page }) => {
    await page.goto(AUSWERTUNG);
    await expect(page.getByText("Verteilung nach Kostenart")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("Entwicklung über die Zeit")).toBeVisible();

    // Nicht nur die Überschriften: Es müssen tatsächlich Flächen entstehen
    await expect
      .poll(
        async () =>
          page.locator(".recharts-pie-sector path").count(),
        { timeout: 30000 }
      )
      .toBeGreaterThan(0);
    await expect
      .poll(
        async () => page.locator(".recharts-bar-rectangle path").count(),
        { timeout: 30000 }
      )
      .toBeGreaterThan(0);
  });

  test("AC: Kostenarten sind nicht allein über Farbe erkennbar", async ({
    page,
  }) => {
    await page.goto(AUSWERTUNG);
    await expect(page.getByText("Verteilung nach Kostenart")).toBeVisible({
      timeout: 30000,
    });
    // Jede sichtbare Kostenart steht als Text in Legende und Tabelle
    for (const art of ["Benzin", "Wartung", "Versicherung", "Ersatzteile"]) {
      await expect(page.getByText(art, { exact: true })).not.toHaveCount(0);
    }
  });

  test("AC: Zeitraum ist wählbar und ändert die Auswertung", async ({ page }) => {
    await page.goto(AUSWERTUNG);
    await expect(kennzahl(page, "Gesamtkosten")).toContainText(ERWARTET.gesamt, {
      timeout: 30000,
    });

    const jahr = new Date().getFullYear();
    await page.getByLabel("Zeitraum wählen").click();
    await expect(page.getByRole("option", { name: String(jahr) })).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Gesamter Zeitraum" })
    ).toBeVisible();

    // Im Vorjahr liegen keine Daten — die Summe muss auf 0 fallen
    await page.getByRole("option", { name: String(jahr - 1) }).click();
    await expect(kennzahl(page, "Gesamtkosten")).toContainText("0,00 €");
  });

  test("AC: Jede Kostenart verweist auf ihre Quelle", async ({ page }) => {
    await page.goto(AUSWERTUNG);
    await expect(tabellenBetrag(page, "Benzin")).toBeVisible({ timeout: 30000 });
    await expect(
      tabellenBetrag(page, "Benzin").getByRole("link", { name: "Tankbuch" })
    ).toHaveAttribute("href", TANKBUCH);
    await expect(
      tabellenBetrag(page, "Wartung").getByRole("link", { name: "Scheckheft" })
    ).toHaveAttribute("href", SCHECKHEFT);
  });

  test("AC: Auswertung ist auf allen drei Bildschirmbreiten bedienbar", async ({
    page,
  }) => {
    for (const [breite, hoehe, name] of [
      [375, 812, "Mobil"],
      [768, 1024, "Tablet"],
      [1440, 900, "Desktop"],
    ] as Array<[number, number, string]>) {
      await page.setViewportSize({ width: breite, height: hoehe });
      await page.goto(AUSWERTUNG);
      await expect(
        kennzahl(page, "Gesamtkosten"),
        `${name}: Gesamtsumme`
      ).toContainText(ERWARTET.gesamt, { timeout: 30000 });
      await expect(
        page.getByRole("tab", { name: "Standkosten" }),
        `${name}: Umschalter`
      ).toBeVisible();
      await expect(
        page.getByText("Verteilung nach Kostenart"),
        `${name}: Diagramm`
      ).toBeVisible();

      // Die Seite darf auf keiner Breite waagerecht scrollen
      const ueberbreite = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(ueberbreite, `${name}: waagerechter Überlauf`).toBeLessThanOrEqual(1);
    }
  });

  test("Nachbereitung: Wegwerf-Fahrzeug wieder leeren", async ({ page }) => {
    test.setTimeout(300_000);
    await leeren(page);
    await page.goto(AUSWERTUNG);
    await expect(page.getByText("Noch keine Kosten zum Auswerten")).toBeVisible({
      timeout: 30000,
    });
  });
});
