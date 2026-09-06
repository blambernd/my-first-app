import { test, expect } from "@playwright/test";

/**
 * Unangemeldete Tests für PROJ-37 (Werkstatt-Dashboard).
 *
 * Prüft die Zugangsgrenze von außen: Ohne Sitzung darf weder die Seite noch
 * die Zugangsabfrage etwas preisgeben. Alles Weitere braucht ein Konto mit
 * Werkstatt-Rolle — siehe PROJ-37-werkstatt-auth.spec.ts und die Lücke, die
 * in den QA-Ergebnissen festgehalten ist.
 */

test.describe("PROJ-37: Werkstatt-Dashboard (unangemeldet)", () => {
  test("AC: Ein nicht angemeldeter Nutzer wird zur Anmeldung geleitet", async ({
    page,
  }) => {
    await page.goto("/werkstatt");
    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  });

  test("Die Seite gibt ohne Sitzung keine Fahrzeugdaten aus", async ({ page }) => {
    const antwort = await page.goto("/werkstatt");
    const text = (await antwort?.text()) ?? "";

    // Kein Fahrzeugbezug im ausgelieferten Dokument — weder Überschrift der
    // Seite noch Listenbeschriftungen.
    expect(text).not.toContain("Kundenfahrzeuge");
    expect(text).not.toContain("Anstehende Arbeiten");
  });

  test("Es gibt keine offene Schnittstelle zum Werkstattzugang", async ({
    request,
  }) => {
    // Bis zur Behebung von QA BUG-7 beantwortete `/api/workshop/access` diese
    // Frage über eine eigene Schnittstelle. Sie wird nicht mehr gebraucht —
    // ermittelt wird serverseitig beim Rendern. Der Test hält fest, dass der
    // Endpunkt auch wirklich verschwunden ist und nicht bloß ungenutzt
    // weiterläuft.
    const antwort = await request.get("/api/workshop/access");
    expect(antwort.status()).toBe(404);
  });
});
