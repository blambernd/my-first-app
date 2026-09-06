import { test, expect } from "@playwright/test";

/**
 * Angemeldete Tests für PROJ-37 (Werkstatt-Dashboard).
 *
 * ## Was diese Datei prüfen kann — und was nicht
 *
 * Das Testkonto ist **Besitzer** seiner Fahrzeuge, nicht Werkstatt. Prüfbar
 * ist damit die Kehrseite des Features: Wer keine Werkstatt-Rolle hat, sieht
 * weder den Navigationspunkt noch die Seite. Das ist keine Nebensache — es
 * ist die Zugangsgrenze, und sie deckt vier Akzeptanzkriterien ab.
 *
 * Die Hauptansicht (Fahrzeugliste, Terminübersicht, Schnellaktion) braucht
 * ein zweites Konto mit Werkstatt-Rolle an einem Fahrzeug des ersten. Solange
 * es das nicht gibt, bleibt sie ungetestet; die Lücke steht in den
 * QA-Ergebnissen und ist nicht durch grüne Tests verdeckt.
 */

test.describe("PROJ-37: Werkstatt-Dashboard (angemeldet, ohne Werkstatt-Rolle)", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL nicht gesetzt");

  test("AC: Ohne Werkstatt-Rolle führt der direkte Aufruf ins Dashboard", async ({
    page,
  }) => {
    await page.goto("/werkstatt");

    // Seit der Behebung von QA BUG-1 sind zwei Ausgänge möglich, und der
    // Unterschied ist der ganze Sinn jener Behebung:
    //
    //   * Datenbankfunktion vorhanden, keine Werkstatt-Rolle → Dashboard
    //   * Datenbankfunktion fehlt (Migration nicht angewendet) → Hinweis
    //
    // Vorher sahen beide Fälle gleich aus. Der Test darf sie deshalb nicht
    // wieder zusammenwerfen: Er stellt fest, welcher Zustand vorliegt, prüft
    // ihn und benennt den anderen ausdrücklich als nicht geprüft.
    const stoerung = page.getByText("Die Übersicht konnte nicht geladen werden");

    if (await stoerung.isVisible().catch(() => false)) {
      // Der Ausfall ist sichtbar statt stumm — genau das war BUG-1.
      await expect(page).toHaveURL(/\/werkstatt/);
      test.skip(
        true,
        "Migration nicht angewendet: get_workshop_dashboard() fehlt, deshalb ist der Leerfall nicht prüfbar"
      );
      return;
    }

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    // Und zwar ohne Zwischenblick auf fremde Daten.
    await expect(
      page.getByRole("heading", { name: "Meine Fahrzeuge" })
    ).toBeVisible({ timeout: 30000 });
  });

  test("QA BUG-1: Ein Ausfall der Abfrage wird gezeigt, nicht verschwiegen", async ({
    page,
  }) => {
    await page.goto("/werkstatt");

    const stoerung = page.getByText("Die Übersicht konnte nicht geladen werden");
    if (!(await stoerung.isVisible().catch(() => false))) {
      test.skip(true, "Kein Ausfall vorhanden — nichts zu prüfen");
      return;
    }

    // Der Hinweis muss dreierlei leisten: den Ausfall benennen, klarstellen,
    // dass die Daten nicht betroffen sind, und einen Weg zurück anbieten.
    await expect(stoerung).toBeVisible();
    await expect(
      page.getByText(/Kundenfahrzeuge sind davon nicht betroffen/)
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "das Dashboard" })).toBeVisible();
  });

  test("AC: Der Navigationspunkt bleibt ohne Werkstatt-Rolle verborgen", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Meine Fahrzeuge" })
    ).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("link", { name: "Werkstatt" })).toHaveCount(0);
  });

  test("Der Punkt fehlt schon im ausgelieferten HTML, nicht erst nach dem Laden", async ({
    page,
  }) => {
    // Seit der Behebung von QA BUG-7 entscheidet der Server über den
    // Navigationspunkt. Damit ist prüfbar, was vorher nicht prüfbar war: Es
    // gibt kein Zeitfenster, in dem der Punkt fälschlich sichtbar oder
    // fälschlich verborgen wäre — und Besitz allein begründet keinen Zugang.
    const antwort = await page.goto("/dashboard");
    const html = (await antwort?.text()) ?? "";

    expect(html).toContain("Meine Fahrzeuge");
    expect(html).not.toContain('href="/werkstatt"');
  });

  test("AC: Das Dashboard zeigt ohne Kundenfahrzeuge keine Verweiskachel", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Meine Fahrzeuge" })
    ).toBeVisible({ timeout: 30000 });

    await expect(
      page.getByText(/Kundenfahrzeuge? im Werkstattbereich/)
    ).toHaveCount(0);
  });

  test("Regression: Das persönliche Dashboard bleibt unverändert erreichbar", async ({
    page,
  }) => {
    // PROJ-37 greift in die Dashboard-Seite ein (Filterung der Mitgliedschaften,
    // neue Verweiskachel). Der Grundzustand muss davon unberührt bleiben.
    const antwort = await page.goto("/dashboard");
    expect(antwort?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Meine Fahrzeuge" })
    ).toBeVisible({ timeout: 30000 });
  });
});
