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
 *   Investition                    0,00 €
 *   Laufende Kosten (ein Tankvorgang) 80,00 €
 *   ------------------------------------
 *   Bisher aufgewendet        19.080,00 €
 *
 * Seit dem 2026-08-03 wird der Unterhalt getrennt ausgewiesen: Investition
 * (Ersatzteile, Reparatur, Restaurierung) gegen laufende Kosten der Nutzung.
 * Kraftstoff ist verbraucht und zählt deshalb zu Letzteren — ohne die
 * Trennung stand er zuvor unter „Investition".
 *
 * Für das Wegwerf-Fahrzeug liegt keine Marktpreis-Analyse vor — die Bilanz
 * zeigt deshalb nur die Kostenseite. Genau der Fall, den ein neuer Nutzer
 * zuerst sieht.
 */
const ERWARTET = {
  kaufpreis: "18.500,00 €",
  nebenkosten: "500,00 €",
  anschaffung: "19.000,00 €",
  investition: "0,00 €",
  laufend: "80,00 €",
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

/**
 * Kennzahlen-Karte **innerhalb der Bilanz**.
 *
 * Seit dem 2026-08-03 stehen Erfassungsbereich und Bilanz auf einer Seite, und
 * die Navigation liegt dauerhaft daneben. Begriffe wie „Anschaffung" und
 * „Laufende Kosten" kommen dadurch dreifach vor — als Abschnittsüberschrift,
 * als Menüeintrag und als Kennzahl. Ein `.first()` über die ganze Seite trifft
 * dann das Falsche, ohne dass es beim Lesen auffällt.
 *
 * Verankert an der Überschrift „Wertentwicklung"; deren Elternelement ist die
 * Bilanz.
 */
function bilanzKarte(page: Page, titel: string) {
  const bilanz = page
    .getByRole("heading", { name: "Wertentwicklung", level: 2 })
    .locator("xpath=..");
  return bilanz.getByText(titel, { exact: true }).first().locator("xpath=../..");
}

async function anschaffungEntfernen(page: Page) {
  await page.goto(WERTENTWICKLUNG);
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
    await expect(bilanzKarte(page, "Bisher aufgewendet")).toHaveCount(0);
    // Seit dem 2026-08-03 steht der Erfassungsbereich auf derselben Seite;
    // ein Verweis aufs Fahrzeugprofil führte ins Leere.
    await expect(
      page.getByRole("button", { name: "Anschaffung erfassen" })
    ).toBeVisible();
  });

  test("AC: Das Fahrzeugprofil funktioniert ohne Kaufpreis vollständig", async ({
    page,
  }) => {
    await page.goto(PROFIL);
    await expect(
      page.getByRole("link", { name: "Scheckheft", exact: true })
    ).toBeVisible({ timeout: 30000 });
    // Die Anschaffung ist seit dem 2026-08-03 unter Kosten → Wertentwicklung
    // zu Hause. Auf dem Profil hat sie nichts mehr verloren — damit gerät der
    // Kaufpreis auch nicht mehr in die Antwort dieser Seite.
    await expect(
      page.getByRole("button", { name: /Anschaffung (erfassen|bearbeiten)/ })
    ).toHaveCount(0);
  });

  test("AC: Anschaffung mit Nebenkosten wird über das Formular erfasst", async ({
    page,
  }) => {
    // Stellt den leeren Zustand selbst her, statt ihn von der Vorbereitung zu
    // erben. Dieser Test setzt zwingend voraus, dass noch keine Anschaffung
    // erfasst ist — sonst heißt die Schaltfläche „bearbeiten" und der Test
    // läuft in einen Zeitüberlauf, dessen Ursache mehrere Tests entfernt liegt.
    await anschaffungEntfernen(page);

    await page.goto(WERTENTWICKLUNG);
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

    // Seit dem 2026-08-03 stehen Erfassungsbereich und Bilanz auf **einer**
    // Seite. Beträge erscheinen dadurch doppelt — einmal im Abschnitt
    // „Anschaffung", einmal in der Kennzahlenkarte. Die Prüfung zielt
    // deshalb auf den Erfassungsbereich statt auf die ganze Seite.
    const abschnitt = page
      .getByRole("heading", { name: "Anschaffung", level: 3 })
      .locator("xpath=../../..");

    await expect(abschnitt.getByText(ERWARTET.kaufpreis, { exact: true })).toBeVisible({
      timeout: 20000,
    });
    await expect(abschnitt.getByText("Überführung")).toBeVisible();
    // exact: true — „500,00 €" steckt als Teilzeichenkette auch in
    // „18.500,00 €" und träfe sonst zwei Elemente
    await expect(
      abschnitt.getByText(ERWARTET.nebenkosten, { exact: true })
    ).toBeVisible();
    await expect(
      abschnitt.getByText(ERWARTET.anschaffung, { exact: true })
    ).toBeVisible();
  });

  test("SICHERHEIT: Bezeichnung und Notiz werden als Text dargestellt", async ({
    page,
  }) => {
    // Anders als die Kostenanalyse rendert dieses Feature Nutzereingaben —
    // Bezeichnung der Nebenkosten und Notiz. Damit gibt es hier eine
    // Angriffsfläche, die es in PROJ-27 nicht gab.
    const payload = '<img src=x onerror="window.__xss=1">Teil';

    await page.goto(WERTENTWICKLUNG);
    await page.getByRole("button", { name: "Anschaffung bearbeiten" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.getByPlaceholder("Überführung").fill(payload);
    await dialog.getByRole("textbox").last().fill(payload);
    await dialog.getByRole("button", { name: "Speichern" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });
    await waitForToastsGone(page);

    // Der Text erscheint unverändert, das Bild-Element entsteht nicht
    await expect(page.getByText(payload).first()).toBeVisible({ timeout: 20000 });
    expect(await page.locator('img[src="x"]').count()).toBe(0);
    expect(
      await page.evaluate(
        () => (window as unknown as Record<string, unknown>).__xss
      )
    ).toBeUndefined();

    // Wieder auf den Ausgangswert zurücksetzen
    await page.getByRole("button", { name: "Anschaffung bearbeiten" }).click();
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.getByPlaceholder("Überführung").fill("Überführung");
    await dialog.getByRole("textbox").last().fill("");
    await dialog.getByRole("button", { name: "Speichern" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });
    await waitForToastsGone(page);
  });

  test("AC: Ein Kaufdatum in der Zukunft ist nicht wählbar", async ({ page }) => {
    await page.goto(WERTENTWICKLUNG);
    await page.getByRole("button", { name: "Anschaffung bearbeiten" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });

    // Der barrierefreie Name der Schaltfläche ist „Kaufdatum" — er stammt aus
    // der Feldbeschriftung, nicht aus dem angezeigten Datum
    await dialog.getByRole("button", { name: "Kaufdatum" }).click();
    const gesperrt = page.locator('[data-disabled="true"], button[disabled]');
    await expect
      .poll(async () => gesperrt.count(), { timeout: 10000 })
      .toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "Abbrechen" }).click();
  });

  test("AC: Der Abschnitt ist als privat gekennzeichnet", async ({ page }) => {
    await page.goto(WERTENTWICKLUNG);
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
    await expect(bilanzKarte(page, "Anschaffung")).toContainText(ERWARTET.anschaffung, {
      timeout: 30000,
    });
    // Anschaffung, Investition und laufende Kosten bleiben getrennt ablesbar
    await expect(bilanzKarte(page, "Anschaffung")).toContainText(ERWARTET.kaufpreis);
    // Kraftstoff ist verbraucht — er gehört zu den laufenden Kosten, nicht
    // zur Investition ins Fahrzeug
    await expect(bilanzKarte(page, "Investition")).toContainText(ERWARTET.investition);
    await expect(bilanzKarte(page, "Laufende Kosten")).toContainText(ERWARTET.laufend);
    await expect(bilanzKarte(page, "Bisher aufgewendet")).toContainText(
      ERWARTET.aufgewendet
    );
  });

  test("AC: Ohne Marktwert wird nur die Kostenseite gezeigt", async ({
    page,
  }) => {
    await page.goto(WERTENTWICKLUNG);
    await expect(bilanzKarte(page, "Anschaffung")).toBeVisible({ timeout: 30000 });
    // Keine erfundene Bilanz
    await expect(page.getByText("Gesamtbilanz")).not.toBeVisible();
    await expect(page.getByText("Wertveränderung")).not.toBeVisible();
    await expect(
      page.getByText(/Für den Vergleich fehlt der Marktwert/)
    ).toBeVisible();
    // Seit dem Aussetzen der Marktanalyse (2026-08-02) trägt der Besitzer den
    // Wert selbst ein — es ist eine Schaltfläche, kein Verweis mehr.
    await expect(
      page.getByRole("button", { name: /Marktwert eintragen/ })
    ).toBeVisible();
  });

  test("AC: Der Marktwert lässt sich selbst eintragen", async ({ page }) => {
    await page.goto(WERTENTWICKLUNG);
    await expect(bilanzKarte(page, "Anschaffung")).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /Marktwert eintragen/ }).click();
    await expect(
      page.getByRole("dialog").getByText("Marktwert schätzen")
    ).toBeVisible();

    // Pflichtfeld: ohne Betrag wird nicht gespeichert
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.getByText("Bitte gib einen Wert an")).toBeVisible();
  });

  test("AC: Keine Warnung, wenn alle Kosten nach dem Kaufdatum liegen", async ({
    page,
  }) => {
    await page.goto(WERTENTWICKLUNG);
    await expect(bilanzKarte(page, "Anschaffung")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/vor dem Kaufdatum/)).not.toBeVisible();
  });

  test("SICHERHEIT: Der Kaufpreis steht in keiner fremden Seitenantwort", async ({
    page,
  }) => {
    // Sieben Seitenaufrufe in einem Test — die Voreinstellung von 30 s reicht
    // dafür nicht, obwohl jeder einzelne Aufruf schnell ist.
    test.setTimeout(180_000);

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
    await expect(karte(page, "Gesamtkosten")).toContainText(ERWARTET.laufend, {
      timeout: 30000,
    });
  });

  test("AC: Bearbeiten ändert Kaufpreis und Nebenkosten", async ({ page }) => {
    await page.goto(WERTENTWICKLUNG);
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

    // Der Betrag steht seit dem 2026-08-03 zweimal auf der Seite — im
    // Erfassungsbereich und in der Bilanzkarte. Beide müssen ihn zeigen.
    await expect(
      bilanzKarte(page, "Anschaffung")
    ).toContainText("19.500,00 €", { timeout: 20000 });
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
      await expect(bilanzKarte(page, "Anschaffung"), `${name}`).toContainText(
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
