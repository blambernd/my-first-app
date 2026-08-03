import { test, expect, type Page } from "@playwright/test";

/**
 * PROJ-31: Kosten-Überblicksseite
 *
 * Der Schwerpunkt liegt auf dem **Umzug**: Dass `/kosten` künftig den
 * Überblick zeigt und „Laufende Kosten" einen eigenen Pfad hat, ist die
 * Änderung, die am ehesten still etwas kaputtmacht — Verweise laufen dann ins
 * Falsche, ohne dass eine Fehlermeldung erscheint.
 *
 * Die Kennzahlen selbst hängen an den Daten des Wegwerf-Fahrzeugs und werden
 * hier nur auf Vorhandensein geprüft; ihre Rechnung ist in
 * src/lib/cost-overview.test.ts abgedeckt.
 */

const VEHICLE_ID = process.env.E2E_VEHICLE_ID ?? "";
const BASIS = `/vehicles/${VEHICLE_ID}`;
const UEBERBLICK = `${BASIS}/kosten`;
const LAUFENDE = `${BASIS}/kosten/laufende`;

/**
 * Der Navigationseintrag, nicht der gleichnamige Verweis im Seiteninhalt.
 *
 * Nötig, weil der Überblick selbst nach „Laufende Kosten" und „Einzelkosten"
 * verweist: Sobald Kosten erfasst sind, kommen diese Beschriftungen auf
 * `/kosten` **doppelt** vor. Ein Zugriff über die Beschriftung allein trifft
 * dann je nach Datenlage mal das eine, mal das andere.
 */
function navEintrag(page: Page, name: string) {
  return page
    .locator('[data-sidebar="menu-sub-button"]')
    .filter({ hasText: new RegExp(`^${name}$`) });
}

/** Die vier Gruppen der Aufteilung — dasselbe Vokabular muss der Hinweis nutzen */
const GRUPPEN = [
  "Kraftstoff",
  "Wartung & Reparatur",
  "Laufende Kosten",
  "Einzelkosten",
];

test.describe("PROJ-31: Kosten-Überblick", () => {
  test.skip(!VEHICLE_ID, "E2E_VEHICLE_ID nicht gesetzt");

  test("AC: Der Kostenbereich zeigt den Überblick, nicht die Liste", async ({
    page,
  }) => {
    await page.goto(UEBERBLICK);
    await expect(
      page.getByRole("heading", { name: "Kosten", level: 2 })
    ).toBeVisible({ timeout: 30000 });

    // Die Erfassungsmaske der laufenden Kosten gehört hier nicht hin
    await expect(
      page.getByRole("button", { name: /Laufende Kosten erfassen/ })
    ).toHaveCount(0);
  });

  test("AC: „Laufende Kosten“ bleibt als eigener Unterbereich erhalten", async ({
    page,
  }) => {
    const antwort = await page.goto(LAUFENDE);
    expect(antwort?.status()).toBe(200);
    await expect(
      page
        .getByRole("button", { name: /Laufende Kosten erfassen/ })
        .or(page.getByText("Noch keine laufenden Kosten hinterlegt"))
        .first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("AC: Die Navigation führt Überblick und Liste getrennt", async ({
    page,
  }) => {
    await page.goto(UEBERBLICK);
    await expect(navEintrag(page, "Überblick")).toBeVisible({ timeout: 30000 });
    await expect(navEintrag(page, "Überblick")).toHaveAttribute(
      "href",
      UEBERBLICK
    );
    await expect(navEintrag(page, "Laufende Kosten")).toHaveAttribute(
      "href",
      LAUFENDE
    );
  });

  test("AC: Der aktive Unterbereich ist eindeutig — nie beide zugleich", async ({
    page,
  }) => {
    await page.goto(UEBERBLICK);
    await expect(navEintrag(page, "Überblick")).toHaveAttribute(
      "data-active",
      "true"
    );
    await expect(navEintrag(page, "Laufende Kosten")).toHaveAttribute(
      "data-active",
      "false"
    );

    await page.goto(LAUFENDE);
    await expect(navEintrag(page, "Laufende Kosten")).toHaveAttribute(
      "data-active",
      "true"
    );
    await expect(navEintrag(page, "Überblick")).toHaveAttribute(
      "data-active",
      "false"
    );
  });

  test("AC: Der Quellenverweis der Auswertung zeigt auf die Liste", async ({
    page,
  }) => {
    // Diese Stelle war im Entwurf als Gefahrenstelle benannt: Sie scheitert
    // still — der Nutzer landet nur woanders.
    //
    // Bewusst datenunabhängig formuliert: Die Quellenverweise der Auswertung
    // erscheinen je nach Datenlage an unterschiedlichen Stellen. Geprüft wird
    // deshalb, dass **kein** Verweis mit dieser Beschriftung noch auf den
    // alten Pfad zeigt — das ist die Aussage, auf die es ankommt.
    await page.goto(`${BASIS}/kosten/auswertung`);
    await expect(page.getByRole("link", { name: "Auswertung" })).toBeVisible({
      timeout: 30000,
    });

    const verweise = page.locator("main").getByRole("link", {
      name: /Laufende Kosten/,
    });
    const anzahl = await verweise.count();
    for (let i = 0; i < anzahl; i++) {
      await expect(verweise.nth(i)).toHaveAttribute("href", LAUFENDE);
    }
  });

  test("AC: Der Zeitraum ist benannt", async ({ page }) => {
    await page.goto(UEBERBLICK);
    await expect(
      page.getByText(/Letzte 12 Monate \(|Seit \w+ \d{4}/)
    ).toBeVisible({ timeout: 30000 });
  });

  test("AC: Es gibt entweder Kennzahlen oder einen erklärenden leeren Zustand", async ({
    page,
  }) => {
    // Drei mögliche Zustände seit der BUG-1-Korrektur: Kennzahlen, „nie
    // erfasst" oder „nur ältere Einträge".
    await page.goto(UEBERBLICK);
    await expect(
      page
        .getByText("Gesamtkosten")
        .or(page.getByText("Noch keine Kosten erfasst"))
        .or(page.getByText("In diesem Zeitraum keine Kosten"))
        .first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("AC: Der Kaufpreis wird ausdrücklich ausgenommen", async ({ page }) => {
    await page.goto(UEBERBLICK);
    // In beiden leeren Zuständen entfällt der Hinweis — dort gibt es nichts
    // abzugrenzen. Er gehört an die Kennzahlen.
    const kennzahlen = page.getByText("Gesamtkosten");
    await expect(
      kennzahlen
        .or(page.getByText("Noch keine Kosten erfasst"))
        .or(page.getByText("In diesem Zeitraum keine Kosten"))
        .first()
    ).toBeVisible({ timeout: 30000 });

    if ((await kennzahlen.count()) > 0) {
      await expect(
        page.getByText(/Der Kaufpreis zählt nicht zu den laufenden Kosten/)
      ).toBeVisible();
    }
  });

  test("AC: Der leere Zustand unterscheidet zwei Fälle (BUG-1)", async ({
    page,
  }) => {
    // Wer nie etwas erfasst hat, braucht einen Anfang. Wer früher erfasst und
    // seither nichts eingetragen hat, braucht die Auswertung — ihn zum
    // Anfangen aufzufordern wäre falsch. Welcher Fall vorliegt, hängt an den
    // Daten des Wegwerf-Fahrzeugs; geprüft wird, dass die beiden Zustände sich
    // nicht vermischen.
    await page.goto(UEBERBLICK);
    await expect(
      page.getByRole("heading", { name: "Kosten", level: 2 })
    ).toBeVisible({ timeout: 30000 });

    const nieErfasst = page.getByText("Noch keine Kosten erfasst");
    const nurAelter = page.getByText("In diesem Zeitraum keine Kosten");

    if ((await nurAelter.count()) > 0) {
      // Alte Einträge vorhanden: kein Aufruf zum Anfangen, sondern ein Weg
      // in die Auswertung, wo längere Zeiträume wählbar sind
      await expect(nieErfasst).toHaveCount(0);
      await expect(
        page.getByRole("link", { name: "Zur Auswertung" })
      ).toBeVisible();
      await expect(
        page.getByText(/die jüngsten Einträge stammen aus/)
      ).toBeVisible();
    } else if ((await nieErfasst.count()) > 0) {
      await expect(nurAelter).toHaveCount(0);
    }
  });

  test("AC: Der Hinweis widerspricht nicht der Aufteilung (BUG-2)", async ({
    page,
  }) => {
    // Bewusst als Invariante formuliert statt an einer Datenlage aufgehängt:
    // Eine Gruppe, die in der Aufteilung mit einem Betrag steht, darf nicht
    // zugleich als „bisher nichts erfasst" gemeldet werden. Das galt für jede
    // Datenlage — nur sichtbar wurde es bei erfasster Reparatur ohne Wartung.
    await page.goto(UEBERBLICK);
    await expect(
      page.getByRole("heading", { name: "Kosten", level: 2 })
    ).toBeVisible({ timeout: 30000 });

    const hinweis = page.getByText(/wurde bisher nichts erfasst/);
    if ((await hinweis.count()) === 0) return; // nichts zu widersprechen

    // Die genannten Posten stehen hervorgehoben im Hinweis
    const genannt = (await hinweis.first().locator("strong").innerText())
      .split(/,\s*|\s+und\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Geprüft wird das **Vokabular**, nicht nur die Überschneidung: Zuvor nannte
    // der Hinweis „Wartung" — das kollidiert mit keinem Gruppennamen und wäre
    // einer Überschneidungsprüfung entgangen, obwohl daneben „Wartung &
    // Reparatur 15.000 €" stand. Nur Gruppennamen sind zulässig.
    for (const posten of genannt) {
      expect(GRUPPEN, `„${posten}" ist kein Gruppenname`).toContain(posten);
    }

    // Und keiner der genannten Posten darf zugleich mit Betrag dastehen
    const aufteilung = page.locator('a[href*="/kosten/"], a[href*="/tankbuch"]');
    for (const posten of genannt) {
      await expect(
        aufteilung.filter({ hasText: new RegExp(`^${posten}\\s`) }),
        `„${posten}" steht mit Betrag in der Aufteilung`
      ).toHaveCount(0);
    }
  });

  test("SICHERHEIT: Der Überblick bleibt dem Besitzer vorbehalten", async ({
    page,
  }) => {
    // Ein fremdes Fahrzeug — der Testnutzer ist dort weder Besitzer noch Mitglied
    const antwort = await page.goto(
      "/vehicles/280d8153-169c-4a09-adef-cfce03d34ecb/kosten"
    );
    expect(antwort?.status()).toBe(404);
    const html = (await antwort?.text()) ?? "";
    // Kein Betrag im ausgelieferten HTML
    expect(html).not.toMatch(/\d{1,3}\.\d{3},\d{2}\s*€/);
  });

  test("AC: Die Seite ist auf allen drei Breiten nutzbar", async ({ page }) => {
    for (const [breite, hoehe, name] of [
      [375, 812, "Mobil"],
      [768, 1024, "Tablet"],
      [1440, 900, "Desktop"],
    ] as Array<[number, number, string]>) {
      await page.setViewportSize({ width: breite, height: hoehe });
      await page.goto(UEBERBLICK);
      await expect(
        page.getByRole("heading", { name: "Kosten", level: 2 }),
        name
      ).toBeVisible({ timeout: 30000 });

      const quer = await page.evaluate(
        () => document.body.scrollWidth > window.innerWidth + 1
      );
      expect(quer, `${name}: kein Querscrollen`).toBe(false);
    }
  });
});
