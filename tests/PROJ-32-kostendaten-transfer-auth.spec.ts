import { test, expect, type Page } from "@playwright/test";

/**
 * PROJ-32: Kostendaten beim Fahrzeug-Transfer
 *
 * Das Entfernen selbst lässt sich hier nicht prüfen — dafür müsste ein
 * Transfer tatsächlich angenommen werden, und danach gehört das Fahrzeug
 * jemand anderem. Diese Prüfung ist deshalb in zurückgerollten
 * Datenbank-Transaktionen erfolgt und im Feature-Spec dokumentiert.
 *
 * Was hier geprüft wird, ist der Teil, den der Vorbesitzer sieht und der bei
 * jeder Änderung still kaputtgehen kann: der Hinweis vor dem Absenden, der
 * Export und die Frage, wer an ihn herankommt.
 *
 * Die inhaltlichen Prüfungen sind bewusst **datenunabhängig** formuliert: Das
 * Wegwerf-Fahrzeug wird von anderen Specs geleert und gefüllt, eine feste
 * Erwartung an die Datenlage wäre reihenfolgeabhängig und damit unbrauchbar.
 */

const VEHICLE_ID = process.env.E2E_VEHICLE_ID ?? "";
const BASIS = `/vehicles/${VEHICLE_ID}`;
const TRANSFER = `${BASIS}/transfer`;
const EXPORT = `/api/vehicles/${VEHICLE_ID}/kosten-export`;

/** Ein Fahrzeug eines anderen Nutzers — der Testnutzer hat dort keine Rolle */
const FREMDES_FAHRZEUG = "280d8153-169c-4a09-adef-cfce03d34ecb";

async function hatKostenAbschnitt(page: Page): Promise<boolean> {
  return (
    (await page
      .getByText("Beim Annehmen wird aus dem Fahrzeug entfernt")
      .count()) > 0
  );
}

test.describe("PROJ-32: Kostendaten beim Transfer", () => {
  test.skip(!VEHICLE_ID, "E2E_VEHICLE_ID nicht gesetzt");

  test("AC: Die Transfer-Seite bleibt erreichbar und zeigt das Formular", async ({
    page,
  }) => {
    const antwort = await page.goto(TRANSFER);
    expect(antwort?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Fahrzeug übertragen" })
    ).toBeVisible({ timeout: 30000 });
  });

  test("AC: Der Hinweis erscheint genau dann, wenn es etwas zu verlieren gibt", async ({
    page,
  }) => {
    // F2: Bei einem Fahrzeug ohne Kostenerfassung darf der Abschnitt nicht
    // erscheinen — er würde einen Verlust ankündigen, den es nicht gibt.
    await page.goto(TRANSFER);
    await expect(
      page.getByRole("heading", { name: "Fahrzeug übertragen" })
    ).toBeVisible({ timeout: 30000 });

    const sichtbar = await hatKostenAbschnitt(page);
    const sicherungsknopf = page.getByRole("link", {
      name: /Kostendaten als Tabelle sichern/,
    });

    if (sichtbar) {
      // Hinweis und Sicherungsweg gehören zusammen — eines ohne das andere
      // wäre entweder eine Drohung ohne Ausweg oder ein Ausweg ohne Anlass
      await expect(sicherungsknopf).toBeVisible();
    } else {
      await expect(sicherungsknopf).toHaveCount(0);
    }
  });

  test("AC: Der Hinweis nennt Mengen, nicht nur Allgemeines", async ({
    page,
  }) => {
    await page.goto(TRANSFER);
    await expect(
      page.getByRole("heading", { name: "Fahrzeug übertragen" })
    ).toBeVisible({ timeout: 30000 });
    if (!(await hatKostenAbschnitt(page))) {
      test.skip(true, "Keine Kostendaten auf dem Wegwerf-Fahrzeug");
    }

    const abschnitt = await page
      .locator("main")
      .getByText("Beim Annehmen wird aus dem Fahrzeug entfernt")
      .locator("xpath=../..")
      .innerText();

    // „14 laufende Kostenpositionen" statt „deine Kostendaten"
    expect(abschnitt).toMatch(/\d+ \w|Kaufpreis/);
  });

  test("AC: Es wird gesagt, dass die Historie bleibt und die Beträge gelöscht werden", async ({
    page,
  }) => {
    await page.goto(TRANSFER);
    await expect(
      page.getByRole("heading", { name: "Fahrzeug übertragen" })
    ).toBeVisible({ timeout: 30000 });
    if (!(await hatKostenAbschnitt(page))) {
      test.skip(true, "Keine Kostendaten auf dem Wegwerf-Fahrzeug");
    }

    // Der Vorbesitzer muss wissen, dass er die Beträge auch als Betrachter
    // nicht mehr sieht — sonst rechnet er damit, sie weiter einsehen zu können
    await expect(
      page.getByText(/als Betrachter im Fahrzeug bleibst/)
    ).toBeVisible();
    await expect(page.getByText(/gelöscht.*nicht nur ausgeblendet/)).toBeVisible();
  });

  test("AC: Der Export liefert eine Tabelle, die deutsches Excel lesen kann", async ({
    page,
  }) => {
    const antwort = await page.request.get(EXPORT);
    expect(antwort.status()).toBe(200);
    expect(antwort.headers()["content-type"]).toContain("text/csv");
    expect(antwort.headers()["content-disposition"]).toContain("attachment");

    const roh = await antwort.body();
    // BOM — ohne diese drei Bytes zerfallen die Umlaute in Excel
    expect([roh[0], roh[1], roh[2]]).toEqual([0xef, 0xbb, 0xbf]);

    const text = roh.toString("utf8");
    expect(text).toContain("Bereich;Datum;Bezeichnung;Betrag (EUR);Anmerkung");
    // Kein ISO-Datum und kein rohes Enum in einer deutschen Tabelle
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(text).not.toMatch(/\byearly\b|\bmonthly\b/);
    // Beträge ohne Währungszeichen und ohne Tausenderpunkt, sonst liest Excel
    // Text statt einer Zahl und die Spalte lässt sich nicht summieren
    expect(text).not.toContain("€");
  });

  test("AC: Der Export bleibt verfügbar, während ein Transfer offen ist", async ({
    page,
  }) => {
    // Nach dem Annehmen ist es zu spät — deshalb muss der Weg offen bleiben,
    // solange der Transfer läuft. Geprüft wird der Zugang, nicht der Inhalt.
    await page.goto(TRANSFER);
    await expect(
      page.getByRole("heading", { name: "Fahrzeug übertragen" })
    ).toBeVisible({ timeout: 30000 });

    const antwort = await page.request.get(EXPORT);
    expect(antwort.status()).toBe(200);
  });

  test("SICHERHEIT: Der Export gehört allein dem aktuellen Besitzer", async ({
    page,
  }) => {
    const antwort = await page.request.get(
      `/api/vehicles/${FREMDES_FAHRZEUG}/kosten-export`
    );
    // 404 statt 403: Wer nicht Besitzer ist, soll nicht einmal erfahren,
    // dass es das Fahrzeug gibt
    expect(antwort.status()).toBe(404);
    const text = await antwort.text();
    expect(text).not.toMatch(/\d+,\d{2}/);
    expect(text).not.toContain("Bereich;Datum");
  });

  test("SICHERHEIT: Ohne Anmeldung liefert der Export nichts", async ({
    browser,
  }) => {
    const anonym = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const antwort = await anonym.request.get(
      `http://localhost:3000${EXPORT}`
    );
    expect(antwort.status()).toBe(401);
    expect(await antwort.text()).not.toContain("Bereich;Datum");
    await anonym.close();
  });

  test("AC: Die Transfer-Seite ist auf allen drei Breiten nutzbar", async ({
    page,
  }) => {
    for (const [breite, hoehe, name] of [
      [375, 812, "Mobil"],
      [768, 1024, "Tablet"],
      [1440, 900, "Desktop"],
    ] as Array<[number, number, string]>) {
      await page.setViewportSize({ width: breite, height: hoehe });
      await page.goto(TRANSFER);
      await expect(
        page.getByRole("heading", { name: "Fahrzeug übertragen" }),
        name
      ).toBeVisible({ timeout: 30000 });
      const quer = await page.evaluate(
        () => document.body.scrollWidth > window.innerWidth + 1
      );
      expect(quer, `${name}: kein Querscrollen`).toBe(false);
    }
  });
});
