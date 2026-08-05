import { test, expect } from "@playwright/test";

/**
 * PROJ-33: Verkaufspreis-Erhebung beim Transfer
 *
 * Ein **erfolgreiches** Annehmen lässt sich hier nicht prüfen: Dafür bräuchte
 * es ein zweites Konto, und danach gehörte das Fahrzeug jemand anderem. Die
 * Wirkung der Datenbankfunktion ist in zurückgerollten Transaktionen belegt
 * und im Feature-Spec dokumentiert.
 *
 * Geprüft wird, was darüber liegt und bei jeder Änderung still kaputtgehen
 * kann: dass das Formular freiwillig bleibt, dass die Einwilligung nie
 * vorbelegt ist, und dass die Route unsinnige Angaben abweist.
 *
 * **Das Spec legt seinen Transfer selbst an.** Die erste Fassung hatte einen
 * fest eingetragenen Token, den ich beim Prüfen von Hand in die Datenbank
 * gelegt hatte; sechs Tests schlugen fehl, sobald er weg war. Ein Test, dessen
 * Ergebnis an einem handgemachten Datensatz hängt, beweist nichts.
 */

const VEHICLE_ID = process.env.E2E_VEHICLE_ID ?? "";
const TRANSFER_SEITE = `/vehicles/${VEHICLE_ID}/transfer`;

/**
 * Empfänger ist bewusst eine fremde Adresse: So bleibt der Transfer offen und
 * kann nicht versehentlich angenommen werden — das Fahrzeug gehörte danach
 * jemand anderem.
 */
const FREMDE_ADRESSE = "niemand@oldtimer-docs.test";

let token = "";
const seite = () => `/transfer/${token}`;
const acceptPfad = () => `/api/transfers/${token}/accept`;

// Serienbetrieb: Die Tests teilen sich den einen angelegten Transfer.
test.describe.configure({ mode: "serial" });

test.describe("PROJ-33: Verkaufspreis-Erhebung", () => {
  test.skip(!VEHICLE_ID, "E2E_VEHICLE_ID nicht gesetzt");

  test("Vorbereitung: Einen offenen Transfer über die Maske anlegen", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto(TRANSFER_SEITE);
    await expect(
      page.getByRole("heading", { name: "Fahrzeug übertragen" })
    ).toBeVisible({ timeout: 30000 });

    // Aus einem früheren Lauf könnte noch einer offen sein
    const vorhandenerLink = page.locator("code").filter({ hasText: "/transfer/" });
    if ((await vorhandenerLink.count()) === 0) {
      await page.getByLabel(/E-Mail des neuen Besitzers/).fill(FREMDE_ADRESSE);
      await page.getByRole("button", { name: "Transfer starten" }).click();
      // Zwischen Formular und Anlegen liegt eine Rückfrage — richtig so bei
      // einem Vorgang, der die Besitzerrechte abgibt.
      await page
        .getByRole("button", { name: "Ja, Transfer starten" })
        .click();
    }

    await expect(vorhandenerLink.first()).toBeVisible({ timeout: 30000 });
    token = (await vorhandenerLink.first().innerText())
      .split("/transfer/")[1]
      .trim();
    expect(token, "Token aus dem angezeigten Link").toMatch(
      /^[0-9a-f-]{36}$/
    );
  });

  test("AC: Die Einwilligung ist nie vorbelegt", async ({ page }) => {
    // Eine vorausgewählte Einwilligung wäre nach DSGVO angreifbar — gültig ist
    // sie nur durch eine aktive Handlung.
    await page.goto(seite());
    await expect(page.locator("#weitergabe")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#weitergabe")).not.toBeChecked();
  });

  test("AC: Die Übergabe ist ohne jede Angabe möglich", async ({ page }) => {
    // Die Frage darf kein Hindernis für die Übergabe sein
    await page.goto(seite());
    await expect(page.locator("#kaufpreis")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#kaufpreis")).toHaveValue("");
    await expect(
      page.getByRole("button", { name: /Transfer annehmen/ })
    ).toBeEnabled();
  });

  test("AC: Der Hinweis erklärt, was gespeichert wird und dass es bleibt", async ({
    page,
  }) => {
    await page.goto(seite());
    await page.getByText("Was genau gespeichert wird").click();

    const text = await page.locator("body").innerText();
    expect(text).toMatch(/Gespeichert wird/);
    expect(text).toMatch(/Nicht gespeichert wird/);
    // Der unbequeme Teil muss vor der Zustimmung dastehen, nicht auf Nachfrage
    expect(text).toMatch(/nicht widerrufen/);
    expect(text).toMatch(/einzelner Preis wird nie angezeigt/i);
  });

  test("AC: Ohne Einwilligung erscheint kein Plausibilitätshinweis", async ({
    page,
  }) => {
    // Wer die Weitergabe nicht will, soll keine Belehrung über Preisgrenzen
    // lesen, die ihn nichts angeht
    await page.goto(seite());
    await page.locator("#kaufpreis").fill("1");
    await expect(
      page.getByText(/fließen nicht in die Preisübersicht/)
    ).toHaveCount(0);
  });

  test("AC: Mit Einwilligung wird ein unplausibler Preis begründet abgewiesen", async ({
    page,
  }) => {
    await page.goto(seite());
    await page.locator("#weitergabe").click();
    await page.locator("#kaufpreis").fill("1");

    await expect(page.getByText(/unter 500 € fließen nicht/)).toBeVisible();
    // Ohne diesen Zusatz befürchtet der Nutzer, seine Eingabe sei verworfen
    await expect(page.getByText(/trotzdem gespeichert/)).toBeVisible();
  });

  test("AC: Der Browser sendet genau die eingegebenen Angaben", async ({
    page,
  }) => {
    // Die Stelle, an der die Kette am ehesten still reißt: Was das Formular
    // anzeigt, muss auch beim Server ankommen.
    await page.goto(seite());
    await page.locator("#kaufpreis").fill("18500");
    await page.locator("#kmstand").fill("52000");
    await page.locator("#weitergabe").click();

    const anfrage = page.waitForRequest(
      (r) => r.url().includes("/accept") && r.method() === "POST"
    );
    await page.getByRole("button", { name: /Transfer annehmen/ }).click();
    const rumpf = JSON.parse((await anfrage).postData() ?? "{}");

    expect(rumpf.purchase_price_eur).toBe(18500);
    expect(rumpf.mileage_km).toBe(52000);
    expect(rumpf.share_anonymously).toBe(true);
  });

  test("SICHERHEIT: Ohne Anmeldung nimmt niemand einen Transfer an", async ({
    browser,
  }) => {
    const anonym = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const r = await anonym.request.post(
      `http://localhost:3000${acceptPfad()}`,
      { data: { share_anonymously: true }, failOnStatusCode: false }
    );
    expect(r.status()).toBe(401);
    await anonym.close();
  });

  test("SICHERHEIT: Unsinnige Angaben werden abgewiesen, nicht durchgereicht", async ({
    page,
  }) => {
    // Die Prüfung im Formular ist Bequemlichkeit — maßgeblich ist der Server.
    const faelle: Array<[string, Record<string, unknown>]> = [
      ["Zustandsnote 9", { share_anonymously: true, condition_grade: 9 }],
      ["Zustandsnote 0", { share_anonymously: true, condition_grade: 0 }],
      ["negativer Preis", { share_anonymously: true, purchase_price_eur: -5 }],
      ["negativer km-Stand", { share_anonymously: true, mileage_km: -1 }],
      [
        "SQL im Preisfeld",
        {
          share_anonymously: true,
          purchase_price_eur: "'; DROP TABLE vehicle_sales;--",
        },
      ],
    ];

    for (const [name, rumpf] of faelle) {
      const r = await page.request.post(acceptPfad(), {
        data: rumpf,
        failOnStatusCode: false,
      });
      expect(r.status(), name).toBe(400);
    }
  });

  test("SICHERHEIT: Die Verkaufsdaten sind für Nutzer nicht abfragbar", async ({
    page,
  }) => {
    // Kein Nutzer darf Einzelsätze lesen — auch nicht den eigenen. Der Zugriff
    // ist schon auf Tabellenebene entzogen, nicht erst je Zeile.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    test.skip(!url || !key, "Supabase-Zugangsdaten nicht gesetzt");

    const r = await page.request.get(`${url}/rest/v1/vehicle_sales?select=*`, {
      headers: { apikey: key!, Authorization: `Bearer ${key!}` },
      failOnStatusCode: false,
    });
    expect(r.status()).toBeGreaterThanOrEqual(400);
    expect(await r.text()).not.toMatch(/price_cents/);
  });

  test("Aufräumen: Den Transfer wieder abbrechen", async ({ page }) => {
    // Ein offener Transfer würde andere Specs stören — und ein Fahrzeug mit
    // laufender Übergabe ist kein sauberer Ausgangszustand.
    const r = await page.request.post(`/api/transfers/${token}/cancel`, {
      failOnStatusCode: false,
    });
    expect([200, 400]).toContain(r.status());

    await page.goto(TRANSFER_SEITE);
    await expect(
      page.getByRole("heading", { name: "Fahrzeug übertragen" })
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.locator("code").filter({ hasText: "/transfer/" })
    ).toHaveCount(0);
  });
});
