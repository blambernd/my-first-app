import { test, expect, type Page } from "@playwright/test";

/**
 * Angemeldete Tests für PROJ-36 (Währung pro Fahrzeug).
 *
 * Der Kern der Funktion lässt sich nur im Zusammenspiel prüfen: Die Währung
 * wird am Fahrzeug gewählt und muss auf sechs anderen Seiten ankommen. Genau
 * dort ist beim Bauen der Fehler aufgetreten (die Übersichtsseite rendert als
 * einzige auf dem Server) — ein Test, der nur das Auswahlfeld anschaut, hätte
 * ihn nicht gefunden.
 *
 * Die zweite Kernaussage ist eine Nicht-Aussage: **Es wird nichts
 * umgerechnet.** Dafür wird derselbe Betrag vor und nach dem Wechsel
 * verglichen — die Zahl muss stehen bleiben, nur das Zeichen wechselt.
 *
 * Läuft ausschließlich gegen das Wegwerf-Fahrzeug und stellt am Ende Euro
 * wieder her. Bleibt das aus, sehen alle anderen angemeldeten Specs plötzlich
 * Franken-Beträge.
 */

const VEHICLE_ID = process.env.E2E_VEHICLE_ID;
const PROFIL = `/vehicles/${VEHICLE_ID}`;
const EDIT = `${PROFIL}/edit`;
const KOSTEN = `${PROFIL}/kosten`;
const EINZELKOSTEN = `${KOSTEN}/einzelkosten`;
const TANKBUCH = `${PROFIL}/tankbuch`;
const ERSATZTEILE = `${PROFIL}/ersatzteile`;

/** Ein Betrag, der sich in keiner Währung ändern darf */
const BETRAG = "1234";
const BETRAG_ANGEZEIGT = /1\.234,00/;

async function waitForToastsGone(page: Page) {
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
    timeout: 20000,
  });
}

/**
 * Das Währungsfeld im Fahrzeugformular.
 *
 * Bewusst über den sichtbaren Wert gesucht und **nicht** über die Beschriftung
 * — obwohl das seit der Behebung von QA BUG-1 ginge: Solange der Warnhinweis
 * offen ist, liegt das Feld hinter einem Modal, und jeder ARIA-gestützte
 * Zugriff (`getByLabel`, `getByRole`) findet es dann nicht mehr. Dass die
 * Beschriftung korrekt verbunden ist, prüft ein eigener Test.
 */
function waehrungsAuswahl(page: Page) {
  // Bewusst `locator` statt `getByRole`: Solange der Warnhinweis offen ist,
  // markiert Radix den Rest der Seite als `aria-hidden`. `getByRole` wertet
  // ARIA aus und findet das Feld dann **gar nicht mehr** — eine Prüfung, die
  // scheinbar auf den Wert wartet, wartet in Wirklichkeit auf ein Element,
  // das es aus ihrer Sicht nicht gibt. Ein CSS-Zugriff sieht es weiterhin.
  return page
    .locator('button[role="combobox"]')
    .filter({ hasText: /Euro|Franken|Pfund|Dollar|Krone|Złoty/ });
}

/** Aus demselben Grund per CSS und nicht über die Rolle */
function warnhinweis(page: Page) {
  return page.locator('[role="alertdialog"]');
}

/**
 * Setzt die Währung und speichert.
 *
 * Der Hinweis wird **bestätigt, wenn er kommt** — nicht anhand einer Annahme
 * über den Bestand. Eine frühere Fassung erwartete ihn nur dort, wo der Test
 * ihn vermutete; nach einem abgebrochenen Lauf lag am Fahrzeug noch ein
 * Betrag, der Hinweis erschien, und die Vorbereitung blieb hängen. Ob der
 * Hinweis überhaupt erscheint, prüfen die beiden eigenen Tests dafür.
 */
async function waehrungSetzen(page: Page, code: string) {
  await page.goto(EDIT);
  await expect(waehrungsAuswahl(page)).toBeVisible({ timeout: 30000 });
  if ((await waehrungsAuswahl(page).textContent())?.includes(code)) {
    return;
  }
  await waehrungsAuswahl(page).click();
  await page.getByRole("option", { name: new RegExp(`^${code}`) }).click();

  // Nach der Auswahl tritt genau eines von beidem ein: Der Hinweis erscheint
  // (dann liegen Beträge vor), oder der Wert wechselt sofort. Auf eine feste
  // Wartezeit zu setzen wäre ein Ratespiel — die Zählabfrage geht über sieben
  // Tabellen und braucht mal länger, mal kürzer als jede Schranke, die man
  // hinschreibt. Deshalb wird auf „eines von beidem" gewartet.
  const warnung = warnhinweis(page);
  await expect
    .poll(
      async () =>
        (await warnung.count()) > 0 ||
        ((await waehrungsAuswahl(page).textContent()) ?? "").includes(code),
      { timeout: 30000 }
    )
    .toBe(true);

  if ((await warnung.count()) > 0) {
    await page.getByRole("button", { name: "Trotzdem ändern" }).click();
    await expect(warnung).toHaveCount(0, { timeout: 10000 });
  }

  await expect(waehrungsAuswahl(page)).toContainText(code, { timeout: 10000 });

  // Ohne Erstzulassung lässt sich das Formular gar nicht abschicken — auch
  // dann nicht, wenn man nur die Währung ändern will (QA BUG-3). Das
  // Wegwerf-Fahrzeug hat keine. Hier wird sie nachgetragen, damit die
  // übrigen Kriterien überhaupt prüfbar sind; der Fehler selbst ist in den
  // QA-Ergebnissen festgehalten und gehört nicht in diesen Test.
  const erstzulassung = page.getByLabel("Erstzulassung *");
  if ((await erstzulassung.inputValue()) === "") {
    await erstzulassung.fill("1970-01-01");
  }

  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await page.waitForURL(`**${PROFIL}`, { timeout: 30000 });
  await waitForToastsGone(page);
}

const POSTEN = "PROJ-36 Prüfposten";

/**
 * Die Beschriftungen stammen aus dem PROJ-26-Spec, nicht aus dem Gedächtnis.
 * Eine erfundene Beschriftung („Bezeichnung *") ließ die erste Fassung dieses
 * Helfers in eine Zeitüberschreitung laufen.
 */
async function einzelkostenAnlegen(page: Page, betrag: string) {
  await page.goto(EINZELKOSTEN);
  await page
    .getByRole("button", { name: /Einzelkosten erfassen|^Erfassen$/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 20000 });
  await dialog.getByLabel("Bezeichnung").fill(POSTEN);
  // Das Feld heißt in Euro „Betrag (€)" — genau das ist der Beleg dafür, dass
  // die Beschriftung der Währung folgt.
  await dialog.getByLabel("Betrag (€)").fill(betrag);
  await dialog.getByRole("button", { name: "Erfassen" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 20000 });
  await waitForToastsGone(page);
}

/** Entfernt nur den eigenen Prüfposten, nichts anderes */
async function pruefpostenEntfernen(page: Page) {
  await page.goto(EINZELKOSTEN);
  const loeschen = page.getByRole("button", { name: "Einzelkosten löschen" });
  const leer = page.getByText("Noch keine Einzelkosten erfasst");
  await expect
    .poll(
      async () =>
        (await leer.isVisible().catch(() => false)) ||
        (await loeschen.count()) > 0,
      { timeout: 30000 }
    )
    .toBe(true);

  for (let schutz = 0; schutz < 10; schutz++) {
    const zeile = page.locator("div").filter({ hasText: POSTEN });
    if ((await zeile.count()) === 0) return;
    const vorher = await loeschen.count();
    if (vorher === 0) return;

    await loeschen.first().click();
    await expect(page.getByText("Eintrag löschen?")).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Löschen", exact: true }).last().click();
    await expect
      .poll(async () => loeschen.count(), { timeout: 20000 })
      .toBeLessThan(vorher);
    await waitForToastsGone(page);
    await page.goto(EINZELKOSTEN);
  }
}

test.describe.configure({ mode: "serial" });

test.describe("PROJ-36: Währung pro Fahrzeug", () => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_VEHICLE_ID,
    "E2E_EMAIL / E2E_VEHICLE_ID nicht gesetzt"
  );

  test("Vorbereitung: Fahrzeug auf Euro, ohne Einzelkosten", async ({ page }) => {
    test.setTimeout(120_000);
    await pruefpostenEntfernen(page);
    await page.goto(EDIT);
    await expect(waehrungsAuswahl(page)).toBeVisible({ timeout: 30000 });
    if (!(await waehrungsAuswahl(page).textContent())?.includes("EUR")) {
      await waehrungSetzen(page, "EUR");
    }
  });

  test("AC: Beim Anlegen ist Euro vorausgewählt", async ({ page }) => {
    // Der häufigste Fall soll ein Klick weniger sein.
    await page.goto("/vehicles/new");
    await expect(waehrungsAuswahl(page)).toBeVisible({ timeout: 30000 });
    await expect(waehrungsAuswahl(page)).toContainText("EUR");
  });

  test("AC: Das Feld ist mit seiner Beschriftung verbunden (QA BUG-1)", async ({
    page,
  }) => {
    // Bis zum 2026-08-09 fand `getByLabel` das Feld nicht: `FormControl` reicht
    // `id` und `aria-describedby` per Radix-Slot an sein Kind weiter, und
    // `CurrencySelect` nahm sie nicht entgegen. Sichtbar stand „Währung *"
    // daneben — ein Screenreader meldete ein unbeschriftetes Auswahlfeld bei
    // einer Pflichtangabe.
    await page.goto("/vehicles/new");
    const feld = page.getByLabel("Währung *");
    await expect(feld).toBeVisible({ timeout: 30000 });
    await expect(feld).toContainText("EUR");

    // Und die Erläuterung darunter gehört ebenfalls zum Feld.
    const beschreibung = await feld.getAttribute("aria-describedby");
    expect(beschreibung, "aria-describedby fehlt").toBeTruthy();
    await expect(page.locator(`#${beschreibung!.split(" ")[0]}`)).toContainText(
      "nie umgerechnet"
    );
  });

  test("AC: Neun Währungen, jede mit Code und Klartext", async ({ page }) => {
    // Nur das Symbol reicht nicht — „kr" steht für drei verschiedene Kronen.
    await page.goto("/vehicles/new");
    await waehrungsAuswahl(page).click();

    const erwartet: [string, string][] = [
      ["EUR", "Euro"],
      ["CHF", "Schweizer Franken"],
      ["GBP", "Britisches Pfund"],
      ["USD", "US-Dollar"],
      ["SEK", "Schwedische Krone"],
      ["DKK", "Dänische Krone"],
      ["NOK", "Norwegische Krone"],
      ["PLN", "Polnischer Złoty"],
      ["CZK", "Tschechische Krone"],
    ];
    for (const [code, name] of erwartet) {
      await expect(
        page.getByRole("option", { name: new RegExp(`^${code}`) }),
        `Währung ${code}`
      ).toContainText(name);
    }
    expect(await page.getByRole("option").count()).toBe(9);
  });

  test("AC: Ohne erfasste Beträge wird der Wechsel nicht kommentiert", async ({
    page,
  }) => {
    // Eine Warnung über einen Verlust, den es nicht gibt, ist Lärm.
    //
    // Bewusst auf dem Anlegen-Formular und nicht am Wegwerf-Fahrzeug: Dort
    // liegen aus anderen Specs Beträge, die Vorbedingung „leeres Fahrzeug"
    // wäre also gar nicht hergestellt. Genau daran ist die erste Fassung
    // dieses Tests gescheitert — sie prüfte auf die Abwesenheit des Hinweises
    // und war deshalb grün, solange der Hinweis nur langsam genug erschien.
    // Ein neues Fahrzeug hat noch keine Kennung und damit nichts zu zählen;
    // das ist derselbe Programmzweig.
    await page.goto("/vehicles/new");
    await expect(waehrungsAuswahl(page)).toBeVisible({ timeout: 30000 });
    await waehrungsAuswahl(page).click();
    await page.getByRole("option", { name: /^GBP/ }).click();

    // Positives Signal zuerst: Der Wechsel ist durchgegangen — also kann kein
    // Hinweis dazwischengestanden haben.
    await expect(waehrungsAuswahl(page)).toContainText("GBP", { timeout: 10000 });
    await expect(warnhinweis(page)).toHaveCount(0);
  });

  test("Vorbereitung: Ein Betrag, an dem sich die Umrechnung zeigen müsste", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await einzelkostenAnlegen(page, BETRAG);
    await page.goto(EINZELKOSTEN);
    await expect(page.getByText(BETRAG_ANGEZEIGT).first()).toBeVisible({
      timeout: 30000,
    });
  });

  test("AC: Die Warnung nennt die Zahl der betroffenen Einträge", async ({
    page,
  }) => {
    await page.goto(EDIT);
    await expect(waehrungsAuswahl(page)).toBeVisible({ timeout: 30000 });
    await waehrungsAuswahl(page).click();
    await page.getByRole("option", { name: /^CHF/ }).click();

    const warnung = warnhinweis(page);
    await expect(warnung).toBeVisible({ timeout: 20000 });
    // „Einige Einträge" liest niemand zu Ende — eine Zahl schon.
    await expect(warnung).toContainText(/\d+ erfasste Beträge|1 erfasster Betrag/);
    // Und sie muss zeigen, was der Wechsel bedeutet.
    await expect(warnung).toContainText(/1\.000,00/);
  });

  test("AC: Abbrechen ändert nichts", async ({ page }) => {
    await page.goto(EDIT);
    await expect(waehrungsAuswahl(page)).toBeVisible({ timeout: 30000 });
    await waehrungsAuswahl(page).click();
    await page.getByRole("option", { name: /^CHF/ }).click();
    await expect(warnhinweis(page)).toBeVisible({ timeout: 20000 });

    await page.getByRole("button", { name: "Abbrechen" }).click();

    await expect(warnhinweis(page)).toHaveCount(0);
    // Die bisherige Währung steht unverändert — der Abbruch hat nichts gesetzt.
    await expect(waehrungsAuswahl(page)).toContainText("EUR");
  });

  test("KERN: Der Wechsel ändert die Beschriftung, nicht die Zahl", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await waehrungSetzen(page, "CHF");

    await page.goto(EINZELKOSTEN);
    await expect(page.getByText(POSTEN).first()).toBeVisible({ timeout: 30000 });

    // Zahl und Währung zusammen in **einem** Ausdruck: Getrennt geprüft könnte
    // die Zahl von einem Eintrag und das Kürzel von einem anderen stammen.
    // `\s` statt eines festen Leerzeichens, weil Intl ein geschütztes setzt.
    await expect(
      page.getByText(/1\.234,00\s*CHF/).first(),
      "Betrag unverändert, nur die Währung wechselt"
    ).toBeVisible({ timeout: 20000 });

    // Und der Gegenbeweis: Nirgends steht mehr ein Euro-Betrag.
    await expect(page.getByText(/\d,\d\d\s*€/)).toHaveCount(0);
  });

  test("AC: Der Kostenüberblick zeigt die Fahrzeugwährung", async ({ page }) => {
    // Diese Seite rendert als einzige auf dem Server — hier ist der Fehler
    // beim Bauen aufgetreten.
    await page.goto(KOSTEN);
    const antwort = await page.goto(KOSTEN);
    expect(antwort?.status()).toBe(200);
    await expect(page.getByText(/CHF/).first()).toBeVisible({ timeout: 30000 });
  });

  test("AC: Eingabefelder tragen die Währung, bevor getippt wird", async ({
    page,
  }) => {
    // Sonst tippt der Nutzer 1.000 und erfährt erst hinterher, worin.
    await page.goto(TANKBUCH);
    await page.getByRole("button", { name: /Tankvorgang erfassen/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByText(/Gesamtpreis \(CHF\)/)).toBeVisible();
  });

  test("AC: Externe Preise bleiben Euro und sagen das auch", async ({ page }) => {
    // BEKANNTER FEHLER (QA BUG-2): Der Hinweis steht im Filterbereich, und der
    // ist zugeklappt, bis der Nutzer ihn aufklappt. Auf der Ersatzteil-Seite
    // eines Franken-Fahrzeugs stehen die Angebotspreise damit unkommentiert in
    // Euro. `test.fail()` hält den Fehler fest, statt ihn wegzulassen — und
    // schlägt von selbst an, sobald er behoben ist.
    test.fixme();

    // Ersatzteil-Angebote stammen aus dem deutschen Markt. Sie als Franken zu
    // beschriften wäre eine falsche Behauptung über einen fremden Marktplatz —
    // unkommentiert Euro zu lassen aber liest sich wie ein Fehler.
    await page.goto(ERSATZTEILE);
    await expect(
      page.getByText(/stehen in Euro, nicht in Schweizer Franken/).first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("AC: Die Fahrzeugübersicht kennzeichnet gemischte Bestände", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Meine Fahrzeuge" })
    ).toBeVisible({ timeout: 30000 });
    // `/vehicles/new` ist die Kachel „Fahrzeug hinzufügen" und zählt nicht mit
    // — daran ist die erste Fassung dieses Tests gescheitert: Sie hielt ein
    // Konto mit einem Fahrzeug für einen gemischten Bestand.
    const kacheln = page.locator(
      "a[href^='/vehicles/']:not([href='/vehicles/new'])"
    );
    const anzahl = await kacheln.count();
    const kennzeichen = page.getByText("CHF", { exact: true });

    if (anzahl > 1) {
      // Gemischter Bestand: Das Wegwerf-Fahrzeug steht auf CHF, also muss das
      // Kennzeichen erscheinen.
      await expect(kennzeichen.first()).toBeVisible();
    } else {
      // Ein einziges Fahrzeug ist nie ein gemischter Bestand. „CHF" neben dem
      // einzigen Eintrag unterschiede nichts und wäre nur Rauschen — genau
      // deshalb erscheint das Kennzeichen bedingt.
      await expect(kennzeichen).toHaveCount(0);
    }
  });

  test("Nachbereitung: Zurück auf Euro, Prüfposten entfernen", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await waehrungSetzen(page, "EUR");
    await pruefpostenEntfernen(page);

    await page.goto(EDIT);
    await expect(waehrungsAuswahl(page)).toContainText("EUR", { timeout: 30000 });
  });
});
