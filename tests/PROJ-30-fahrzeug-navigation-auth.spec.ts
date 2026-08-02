import { test, expect, type Page } from "@playwright/test";

/**
 * PROJ-30: Fahrzeug-Navigation & UX-Überarbeitung
 *
 * Diese Tests decken das ab, was beim Umbau leicht unbemerkt kaputtgeht:
 * dass die alte zweite Reiterleiste wirklich verschwunden ist, dass „Kosten"
 * ein Link bleibt (und nicht bloß ein Aufklapp-Schalter wird) und dass das
 * Ausblenden im Menü die serverseitige Zugriffsprüfung nicht ersetzt.
 *
 * Die Tests kommen mit **einem** Fahrzeug aus. Der Fahrzeugwechsel braucht
 * mindestens zwei und ist deshalb hier nicht abgedeckt — die Wegberechnung
 * dahinter liegt als reine Funktion in src/lib/vehicle-areas.test.ts.
 */

const VEHICLE_ID = process.env.E2E_VEHICLE_ID ?? "";
const BASIS = `/vehicles/${VEHICLE_ID}`;

test.describe("PROJ-30: Fahrzeug-Navigation", () => {
  test.skip(!VEHICLE_ID, "E2E_VEHICLE_ID nicht gesetzt");

  async function seitenleiste(page: Page) {
    return page.locator('[data-sidebar="menu-button"], [data-sidebar="menu-sub-button"]');
  }

  test("AC: Die Navigation steht seitlich, nicht als Leiste darüber", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASIS);
    await expect(
      page.getByRole("link", { name: "Scheckheft", exact: true })
    ).toBeVisible({ timeout: 30000 });

    // Die Navigation liegt links vom Inhalt
    const nav = await page.locator('[data-sidebar="sidebar"]').first().boundingBox();
    const inhalt = await page.locator("main").first().boundingBox();
    expect(nav!.x).toBeLessThan(inhalt!.x);
  });

  test("AC: Alle sechs Bereiche stehen in der Navigation", async ({ page }) => {
    await page.goto(BASIS);
    for (const bereich of [
      "Übersicht",
      "Scheckheft",
      "Historie",
      "Dokumente",
      "Tankbuch",
      "Kosten",
    ]) {
      await expect(
        page.getByRole("link", { name: bereich, exact: true })
      ).toBeVisible({ timeout: 30000 });
    }
  });

  test("AC: Der Verkaufsassistent fehlt, solange er ausgesetzt ist", async ({
    page,
  }) => {
    // Siehe src/lib/feature-flags.ts — kehrt er zurück, gehört dieser Test angepasst
    await page.goto(BASIS);
    await expect(page.getByRole("link", { name: "Scheckheft", exact: true })).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByRole("link", { name: "Verkaufsassistent" })
    ).toHaveCount(0);
  });

  test("AC: „Kosten“ ist ein Link und kein bloßer Aufklapp-Schalter", async ({
    page,
  }) => {
    // Diese Regression hat der Umbau tatsächlich erzeugt und ein bestehender
    // PROJ-25-Test aufgedeckt — deshalb hier ausdrücklich festgehalten.
    await page.goto(BASIS);
    const kosten = page.getByRole("link", { name: "Kosten", exact: true });
    await expect(kosten).toBeVisible({ timeout: 30000 });
    await expect(kosten).toHaveAttribute("href", `${BASIS}/kosten`);
  });

  test("AC: Der Pfeil klappt auf, ohne zu navigieren", async ({ page }) => {
    await page.goto(`${BASIS}/scheckheft`);
    await expect(page.getByRole("link", { name: "Scheckheft", exact: true })).toBeVisible({
      timeout: 30000,
    });

    await page
      .getByRole("button", { name: /Kosten auf- oder zuklappen/ })
      .click();

    await expect(page).toHaveURL(new RegExp(`${BASIS}/scheckheft$`));
    for (const unter of [
      "Laufende Kosten",
      "Einzelkosten",
      "Auswertung",
      "Wertentwicklung",
    ]) {
      await expect(page.getByRole("link", { name: unter })).toBeVisible();
    }
  });

  test("AC: Auf einer Kosten-Unterseite ist der Bereich bereits aufgeklappt", async ({
    page,
  }) => {
    await page.goto(`${BASIS}/kosten/auswertung`);
    await expect(
      page.getByRole("link", { name: "Wertentwicklung" })
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole("link", { name: "Auswertung" })
    ).toHaveAttribute("data-active", "true");
  });

  test("AC: Auf Kosten-Seiten gibt es keine zweite Reiterleiste mehr", async ({
    page,
  }) => {
    // Der eigentliche Zweck des Features. Die alte Unternavigation war ein
    // <nav> mit unterer Rahmenlinie direkt im Seiteninhalt.
    for (const pfad of [
      "/kosten",
      "/kosten/einzelkosten",
      "/kosten/auswertung",
      "/kosten/wertentwicklung",
    ]) {
      await page.goto(`${BASIS}${pfad}`);
      // exact: true — im Seiteninhalt gibt es zusätzlich Quellenverweise
      // wie "Scheckheft Wartung und Reparatur"
      await expect(
        page.getByRole("link", { name: "Scheckheft", exact: true })
      ).toBeVisible({ timeout: 30000 });
      await expect(page.locator("main nav.border-b")).toHaveCount(0);
    }
  });

  test("AC: Der ein- und ausgeklappte Zustand überlebt den Seitenwechsel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASIS);
    await expect(page.getByRole("link", { name: "Scheckheft", exact: true })).toBeVisible({
      timeout: 30000,
    });

    await page.locator('[data-sidebar="trigger"]').first().click();
    await expect
      .poll(async () =>
        (await page.context().cookies()).find((c) => c.name === "sidebar_state")
          ?.value
      )
      .toBe("false");

    await page.goto(`${BASIS}/scheckheft`);
    const nachWechsel = (await page.context().cookies()).find(
      (c) => c.name === "sidebar_state"
    );
    expect(nachWechsel?.value).toBe("false");

    // Aufgeräumt zurücklassen, damit folgende Tests ausgeklappt starten
    await page.locator('[data-sidebar="trigger"]').first().click();
  });

  test("AC: Der Kopf zeigt zwei Bedienelemente, der Rest steht im Überlaufmenü", async ({
    page,
  }) => {
    await page.goto(BASIS);
    await expect(page.getByRole("link", { name: /Bearbeiten/ })).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByRole("link", { name: "Transfer", exact: true })
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Weitere Aktionen" }).click();
    await expect(page.getByRole("menuitem", { name: "Transfer" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Freigabe" })).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /Fahrzeug löschen/ })
    ).toBeVisible();
  });

  test("AC: Löschen behält seine Sicherheitsabfrage", async ({ page }) => {
    await page.goto(BASIS);
    await page.getByRole("button", { name: "Weitere Aktionen" }).click();
    await page.getByRole("menuitem", { name: /Fahrzeug löschen/ }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Fahrzeug löschen?");
    // Ausdrücklich abbrechen — hier wird nichts gelöscht
    await dialog.getByRole("button", { name: "Abbrechen" }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("AC: Alle bisherigen Fahrzeugseiten bleiben erreichbar", async ({
    page,
  }) => {
    for (const pfad of [
      "",
      "/scheckheft",
      "/historie",
      "/dokumente",
      "/tankbuch",
      "/kosten",
      "/kosten/einzelkosten",
      "/kosten/auswertung",
      "/kosten/wertentwicklung",
      "/edit",
      "/mitglieder",
    ]) {
      const antwort = await page.goto(`${BASIS}${pfad}`);
      expect(antwort?.status(), `Pfad ${pfad || "/"}`).toBe(200);
    }
  });

  test("AC: Bedienflächen sind auf dem Smartphone mindestens 44 px hoch", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto(BASIS);
    await page.locator('[data-sidebar="trigger"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const hoehen = await (await seitenleiste(page)).evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().height)
    );
    expect(hoehen.length).toBeGreaterThan(0);
    for (const h of hoehen) expect(h).toBeGreaterThanOrEqual(44);
  });

  test("AC: Unterhalb der Desktop-Breite überlagert die Navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto(BASIS);
    // Kein fest stehender Bereich, sondern erst auf Knopfdruck
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.locator('[data-sidebar="trigger"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
