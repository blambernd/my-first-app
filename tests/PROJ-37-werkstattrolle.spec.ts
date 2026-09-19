import { test, expect, type Page } from "@playwright/test";

/**
 * Abnahme der Hauptansicht des Werkstatt-Dashboards (PROJ-37).
 *
 * Läuft als **Werkstatt-Konto**: ein zweites Konto ohne eigene Fahrzeuge,
 * das am Fahrzeug des regulären Testnutzers die Rolle `werkstatt` hat. Bis
 * es dieses Konto gab, war die Hauptansicht gar nicht erreichbar — fünf
 * Akzeptanzkriterien blieben deshalb in zwei QA-Durchläufen ungeprüft.
 *
 * Die Tests laufen nacheinander: Der Eintrag, den die Schnellaktion anlegt,
 * ist Voraussetzung für die Prüfung der Listenspalten und wird am Ende
 * wieder entfernt.
 */

const BESCHREIBUNG = "PROJ-37 Abnahme-Eintrag";
const KM = "123456";

/**
 * Die Zeile des Fahrzeugs in der **Fahrzeugliste**.
 *
 * Der Fahrzeugname steht auf der Seite zweimal: einmal in der Terminliste,
 * einmal in der Fahrzeugliste — beides gewollt, beides ein Link zum
 * Fahrzeug. Unterschieden wird über die Schnellaktion, die es nur in der
 * Fahrzeugliste gibt.
 */
function fahrzeugZeile(page: Page) {
  return page
    .locator("li")
    .filter({ hasText: "E2E-Testfahrzeug" })
    .filter({ has: page.getByRole("link", { name: "Eintrag anlegen" }) });
}

async function toastsWeg(page: Page) {
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
    timeout: 20000,
  });
}

test.describe.configure({ mode: "serial" });

test.describe("PROJ-37: Werkstatt-Dashboard (mit Werkstatt-Rolle)", () => {
  test.skip(
    !process.env.E2E_WERKSTATT_EMAIL,
    "E2E_WERKSTATT_EMAIL nicht gesetzt"
  );

  test("AC: Der Navigationspunkt erscheint für Nutzer mit Werkstatt-Rolle", async ({
    page,
  }) => {
    // Die Kehrseite ist längst geprüft (ohne Rolle kein Punkt) — hier die
    // positive Richtung, und zwar im ausgelieferten HTML: Seit der Behebung
    // von QA BUG-7 entscheidet der Server, nicht eine Abfrage im Browser.
    const antwort = await page.goto("/dashboard");
    const html = (await antwort?.text()) ?? "";
    expect(html).toContain('href="/werkstatt"');

    await expect(
      page.getByRole("link", { name: "Werkstatt" }).first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("AC: Das Dashboard verweist auf den Werkstattbereich statt die Fahrzeuge doppelt zu zeigen", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Die Verweiskachel nennt die Zahl der betreuten Fahrzeuge …
    await expect(
      page.getByText(/Kundenfahrzeugs? im Werkstattbereich|Kundenfahrzeuge im Werkstattbereich/)
    ).toBeVisible({ timeout: 30000 });

    // … und das Kundenfahrzeug steht NICHT zusätzlich unter „Geteilte
    // Fahrzeuge". Genau das war die Absicht hinter der Umstellung.
    await expect(
      page.getByRole("heading", { name: "Geteilte Fahrzeuge" })
    ).toHaveCount(0);
  });

  test("AC: Die Seite listet das betreute Kundenfahrzeug", async ({ page }) => {
    await page.goto("/werkstatt");

    await expect(page.getByRole("heading", { name: "Werkstatt" })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText(/betreute?s? Kundenfahrzeuge?/)).toBeVisible();

    // Marke, Modell und Baujahr in einer Zeile — so, wie das Kriterium es
    // verlangt.
    const zeile = fahrzeugZeile(page);
    await expect(zeile).toHaveCount(1, { timeout: 20000 });
    await expect(zeile).toContainText("E2E-Testfahrzeug Wegwerf (1970)");
  });

  test("AC: Die Terminübersicht zeigt den Termin des Besitzers", async ({
    page,
  }) => {
    // Der eigentliche Beleg für die neue Leseregel: Der TÜV-Termin wurde vom
    // Fahrzeughalter gepflegt, nicht von der Werkstatt. Ohne die Policy-
    // Erweiterung wäre er hier unsichtbar.
    await page.goto("/werkstatt");

    await expect(
      page.getByText("Anstehende Arbeiten").first()
    ).toBeVisible({ timeout: 30000 });

    // Der Termin steht in einer eigenen Zeile, die kein „Eintrag anlegen"
    // trägt — das unterscheidet sie von der Fahrzeugliste.
    const terminZeile = page
      .locator("li")
      .filter({ hasText: "TÜV/HU" })
      .filter({ hasNot: page.getByRole("link", { name: "Eintrag anlegen" }) });

    await expect(terminZeile.first()).toBeVisible({ timeout: 20000 });
    await expect(terminZeile.first()).toContainText("E2E-Testfahrzeug");
    // Die Restlaufzeit steht als Text da, nicht nur als Farbe.
    await expect(terminZeile.first()).toContainText(/in \d+ Tagen|heute fällig/);
  });

  test("AC: Die Suche filtert die Fahrzeugliste", async ({ page }) => {
    await page.goto("/werkstatt");
    const suche = page.getByLabel("Kundenfahrzeuge durchsuchen");
    await expect(suche).toBeVisible({ timeout: 30000 });

    // Treffer
    await suche.fill("Wegwerf");
    await expect(fahrzeugZeile(page)).toHaveCount(1);

    // Kein Treffer — und ein erklärender Leerzustand statt einer leeren Liste
    await suche.fill("Bugatti");
    await expect(page.getByText(/Kein Fahrzeug passt zu/)).toBeVisible();
    await expect(fahrzeugZeile(page)).toHaveCount(0);

    await suche.fill("");
    await expect(fahrzeugZeile(page)).toHaveCount(1);
  });

  test("AC: Die Sortierung bietet die drei vorgesehenen Ordnungen", async ({
    page,
  }) => {
    await page.goto("/werkstatt");
    const sortierung = page.getByLabel("Sortierung");
    await expect(sortierung).toBeVisible({ timeout: 30000 });
    // Voreinstellung laut Spezifikation
    await expect(sortierung).toContainText("Nächste Fälligkeit");

    await sortierung.click();
    for (const name of [
      "Nächste Fälligkeit",
      "Fahrzeugname",
      "Letzter Eintrag",
    ]) {
      await expect(page.getByRole("option", { name })).toBeVisible();
    }
    await page.getByRole("option", { name: "Fahrzeugname" }).click();
    await expect(sortierung).toContainText("Fahrzeugname");
  });

  test("AC: Die Schnellaktion legt einen Eintrag an und kehrt zurück", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/werkstatt");

    await page.getByRole("link", { name: "Eintrag anlegen" }).first().click();

    // Das Formular steht sofort offen — ohne Zwischenklick im Scheckheft.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 30000 });
    await expect(
      dialog.getByText("Neuer Scheckheft-Eintrag")
    ).toBeVisible();

    await dialog.getByLabel("Beschreibung *").fill(BESCHREIBUNG);
    await dialog.getByLabel("Kilometerstand *").fill(KM);
    await dialog.getByRole("button", { name: "Eintrag erstellen" }).click();

    // Nach dem Speichern zurück im Werkstattbereich — nicht im Scheckheft
    // des fremden Fahrzeugs.
    await page.waitForURL("**/werkstatt", { timeout: 30000 });
    await toastsWeg(page);

    // Und der Eintrag wirkt sich auf die Liste aus: Kilometerstand und
    // „letzter Eintrag" stammen jetzt aus ihm.
    await expect(page.getByText("123.456 km")).toBeVisible({ timeout: 20000 });
  });

  test("AC: Beträge und Zählung beziehen sich auf eigene Einträge", async ({
    page,
  }) => {
    await page.goto("/werkstatt");
    // Der eben angelegte Eintrag ist der einzige dieses Kontos.
    await expect(page.getByText(/1 eigener Eintrag/)).toBeVisible({
      timeout: 30000,
    });
  });

  test("AC: Die Seite ist bei 375 px bedienbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/werkstatt");

    await expect(page.getByRole("heading", { name: "Werkstatt" })).toBeVisible({
      timeout: 30000,
    });
    await expect(fahrzeugZeile(page)).toHaveCount(1);
    await expect(page.getByLabel("Kundenfahrzeuge durchsuchen")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Eintrag anlegen" }).first()
    ).toBeVisible();

    // Kein waagerechtes Überlaufen: Der Inhalt passt in die Breite, statt
    // seitliches Schieben zu erzwingen.
    const ueberlauf = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(ueberlauf, "Seite läuft bei 375 px waagerecht über").toBe(false);

    // Die untere Leiste trägt den Werkstattpunkt — und höchstens fünf
    // Einträge, damit die Beschriftungen lesbar bleiben (QA BUG-8).
    // Adressiert über ihren Inhalt: „nav" gibt es auf der Seite mehrfach.
    const leiste = page
      .locator("nav")
      .filter({ has: page.getByRole("link", { name: "Dashboard" }) });

    await expect(leiste).toHaveCount(1);
    await expect(leiste.getByRole("link", { name: "Werkstatt" })).toBeVisible();
    expect(
      await leiste.locator("> div > a, > div > button").count(),
      "untere Leiste mit mehr als fünf Einträgen"
    ).toBeLessThanOrEqual(5);
  });

  test("Aufräumen: Abnahme-Eintrag entfernen", async ({ page }) => {
    test.setTimeout(120_000);
    // Über die Fahrzeugseite, weil das Löschen dort sitzt. Die Werkstatt darf
    // eigene Einträge entfernen — auch das ist damit belegt.
    await page.goto(`/vehicles/${process.env.E2E_VEHICLE_ID}/scheckheft`);
    await expect(page.getByText(BESCHREIBUNG).first()).toBeVisible({
      timeout: 30000,
    });

    // Der Löschknopf ist ein reiner Icon-Knopf ohne zugänglichen Namen
    // (siehe Befund BEFUND-C in den QA-Ergebnissen) — deshalb hier über die
    // Gestaltungsklasse statt über die Rolle. Sobald er beschriftet ist,
    // gehört das auf getByRole umgestellt.
    await page.locator("button.text-destructive").first().click();
    await expect(page.getByText("Eintrag löschen?")).toBeVisible({
      timeout: 10000,
    });
    await page
      .getByRole("button", { name: "Löschen", exact: true })
      .last()
      .click();

    await expect(page.getByText(BESCHREIBUNG)).toHaveCount(0, {
      timeout: 20000,
    });
  });
});
