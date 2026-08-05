import { test, expect } from "@playwright/test";

// E2E tests for PROJ-17: Landing Page

test.describe("PROJ-17: Landing Page", () => {
  // === Hero Section ===

  test("Landing page loads at / with title and hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Jede");
  });

  test("Hero has primary CTA 'Kostenlos starten' linking to /register", async ({
    page,
  }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Kostenlos starten" }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/register");
  });

  test("Hero has secondary CTA 'Anmelden' linking to /login", async ({
    page,
  }) => {
    await page.goto("/");
    const loginBtn = page
      .locator("section")
      .first()
      .getByRole("link", { name: "Anmelden" });
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toHaveAttribute("href", "/login");
  });

  test("Hero zeigt eine echte Abbildung der Anwendung", async ({ page }) => {
    // Bis 1f35ac2 stand hier ein Kasten mit der Aufschrift „App-Vorschau";
    // seither ist es ein Bildschirmfoto. Der Test suchte weiter nach dem Text.
    await page.goto("/");
    await expect(
      page.getByRole("img", { name: /Oldtimer Docs Dashboard/i })
    ).toBeVisible();
  });

  // === Features Section ===

  test("Die sechs Funktionskarten nennen, was es tatsächlich gibt", async ({
    page,
  }) => {
    await page.goto("/");
    for (const titel of [
      "Digitales Scheckheft",
      "Dokumenten-Archiv",
      "Fahrzeug-Timeline",
      "Kosten im Blick",
      "Wertentwicklung",
      "Fahrzeug-Transfer",
    ]) {
      await expect(page.getByText(titel, { exact: true }).first(), titel).toBeVisible();
    }
  });

  test("Abgeschaltete Funktionen werden nicht beworben", async ({ page }) => {
    // Der wichtigste Test dieses Specs: Die Seite hatte Kurzprofil,
    // Verkaufsinserat und Verkaufsassistent angepriesen, während alle drei
    // über feature-flags.ts abgeschaltet sind. Ein neu registrierter Nutzer
    // hätte sie gesucht und nicht gefunden.
    await page.goto("/");
    const text = await page.locator("body").innerText();
    for (const begriff of [
      "Kurzprofil",
      "Verkaufsinserat",
      "Verkaufsassistent",
      "Marktüberblick",
    ]) {
      expect(text, `„${begriff}" darf nicht beworben werden`).not.toContain(
        begriff
      );
    }
  });

  // === Pricing Section ===

  test("Pricing section shows Free and Premium plans", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Free").first()).toBeVisible();
    await expect(page.getByText("Premium").first()).toBeVisible();
  });

  test("Free plan shows 0 EUR", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=0 \u20ac")).toBeVisible();
  });

  test("Premium plan shows 4,99 EUR monthly by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("4,99")).toBeVisible();
  });

  test("Billing toggle switches to yearly pricing", async ({ page }) => {
    await page.goto("/");
    // Click yearly toggle
    const yearlyBtn = page.getByRole("button", { name: /hrlich/i });
    await yearlyBtn.click();
    // Should show yearly price
    await expect(page.getByText("4,17")).toBeVisible();
    await expect(page.getByText("49,99")).toBeVisible();
  });

  test("Der Premium-Tarif ist hervorgehoben", async ({ page }) => {
    // Die Beschriftung wechselt mit NEXT_PUBLIC_MVP_MODE: „Coming Soon"
    // solange nicht verkauft wird, sonst „Beliebt". Der frühere Test suchte
    // „Empfohlen" — das stand dort nie.
    await page.goto("/");
    await expect(page.getByText(/Coming Soon|Beliebt/)).toBeVisible();
  });

  test("Der Unterschied der Tarife ist die Fahrzeuganzahl", async ({ page }) => {
    // Das ist das eigentliche Kaufargument und muss an erster Stelle beider
    // Listen stehen — nicht zwischen Speicherplatz und Nebensächlichkeiten.
    await page.goto("/");
    await expect(page.getByText("1 Fahrzeug", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Unbegrenzt Fahrzeuge", { exact: true })
    ).toBeVisible();
  });

  test("Die Tarifliste nennt nur Funktionen, die es gibt", async ({ page }) => {
    await page.goto("/");
    // Frei: Erfassung und Überblick. Kostenpflichtig: Auswertung und
    // Wertentwicklung — so steht es auch in den Seitenprüfungen.
    await expect(
      page.getByText("Kostenerfassung und Überblick").first()
    ).toBeVisible();
    await expect(page.getByText("Kostenauswertung").first()).toBeVisible();
    await expect(page.getByText("Wertentwicklung").first()).toBeVisible();
  });

  test("Premium CTA führt zur Registrierung", async ({ page }) => {
    await page.goto("/");
    // Früher „14 Tage kostenlos testen"; die Schaltfläche heißt inzwischen
    // wie im Hero und führt ebenfalls zur Registrierung.
    const trialBtn = page
      .getByRole("link", { name: "Kostenlos starten", exact: true })
      .last();
    await expect(trialBtn).toBeVisible();
    await expect(trialBtn).toHaveAttribute("href", "/register");
  });

  test("Free plan CTA links to /register", async ({ page }) => {
    await page.goto("/");
    // The free plan's "Kostenlos starten" button (in the pricing card, not hero)
    const freeCtaButtons = page.getByRole("link", {
      name: "Kostenlos starten",
    });
    // At least one should link to /register
    const count = await freeCtaButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(freeCtaButtons.nth(i)).toHaveAttribute("href", "/register");
    }
  });

  // === Social Proof ===

  test("Es werden keine erfundenen Zahlen als Tatsachen ausgegeben", async ({
    page,
  }) => {
    // Der Abschnitt nannte „500+ Fahrzeuge", „10.000+ Scheckheft-Einträge" und
    // „98 % zufriedene Nutzer". Tatsächlich waren es am 2026-08-05 6 Fahrzeuge,
    // 5 Einträge und 7 Nutzer. Öffentlich war das nie — der Abschnitt hängt an
    // NEXT_PUBLIC_MVP_MODE, und in der Produktion steht es auf „true".
    //
    // Dieser Test hält die Lücke zu: Wer den Abschnitt einschaltet, soll
    // gezwungen sein, echte Zahlen einzutragen.
    await page.goto("/");
    const text = await page.locator("body").innerText();
    for (const behauptung of ["500+", "10.000+", "98%", "98 %"]) {
      expect(text, `„${behauptung}" ist nicht belegt`).not.toContain(
        behauptung
      );
    }
  });

  test("Die Kennzahlen sind erkennbar Platzhalter", async ({ page }) => {
    await page.goto("/");
    const abschnitt = page.getByText(/Zahl eintragen/);
    // Entweder ausgeblendet (Produktionsmodus) oder unmissverständlich offen
    const sichtbar = await abschnitt.count();
    if (sichtbar > 0) {
      expect(sichtbar).toBeGreaterThanOrEqual(3);
    }
  });

  // === FAQ Teaser ===

  test("FAQ teaser shows 4 accordion items", async ({ page }) => {
    await page.goto("/");
    const faqSection = page.locator("#faq");
    const accordionButtons = faqSection.locator("button[data-state]");
    await expect(accordionButtons).toHaveCount(4);
  });

  test("FAQ teaser has link to /faq", async ({ page }) => {
    await page.goto("/");
    const allFaqLink = page.getByRole("link", { name: "Alle FAQs ansehen" });
    await expect(allFaqLink).toBeVisible();
    await expect(allFaqLink).toHaveAttribute("href", "/faq");
  });

  // === Final CTA ===

  test("Final CTA section has 'Jetzt kostenlos starten' button", async ({
    page,
  }) => {
    await page.goto("/");
    const finalCta = page.getByRole("link", {
      name: "Jetzt kostenlos starten",
    });
    await expect(finalCta).toBeVisible();
    await expect(finalCta).toHaveAttribute("href", "/register");
  });

  // === Header ===

  test("Header has logo and login/register buttons", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "Anmelden" })).toBeVisible();
    await expect(
      header.getByRole("link", { name: "Registrieren" })
    ).toBeVisible();
  });

  // === Responsive ===

  test("Page renders correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Kostenlos starten" }).first()
    ).toBeVisible();
  });

  // === Footer ===

  test("Footer is present (from root layout, not duplicated)", async ({
    page,
  }) => {
    await page.goto("/");
    const footers = page.locator("footer");
    await expect(footers).toHaveCount(1);
  });

  // === Regression: /faq still works with shared data ===

  test("FAQ page still works after data extraction", async ({ page }) => {
    await page.goto("/faq");
    const items = page.locator("button[data-state]");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });
});

// === Ergänzt bei der QA am 2026-08-05 ===

test.describe("PROJ-17: Landing Page — Metadaten und Sicherheit", () => {
  test("Die Seitenbeschreibung bewirbt keine abgeschalteten Funktionen", async ({
    page,
  }) => {
    // Die Beschreibung ist das, was Suchmaschinen anzeigen — sie erreicht
    // Menschen, bevor die Seite selbst es tut. Beim Überarbeiten des
    // Seiteninhalts blieb sie zurück und nannte weiter „Verkaufsinserate".
    await page.goto("/");
    const beschreibung = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(beschreibung).toBeTruthy();
    for (const begriff of ["Verkaufsinserat", "Kurzprofil", "Marktüberblick"]) {
      expect(beschreibung, `„${begriff}" ist abgeschaltet`).not.toContain(
        begriff
      );
    }
  });

  test("Der Testzeitraum wird genannt, weil es ihn gibt", async ({ page }) => {
    // Jeder neue Nutzer bekommt 14 Tage vollen Zugang — der Auslöser in
    // 20260408_subscriptions.sql setzt trial_end auf NOW() + 14 Tage, und
    // getEffectivePlan gibt währenddessen „trial" mit unbegrenzten Fahrzeugen
    // zurück. Das nicht zu erwähnen verschenkt das stärkste Argument für den
    // Premium-Tarif.
    await page.goto("/");
    await expect(page.getByText(/14 Tage/)).toBeVisible();
  });

  test("SICHERHEIT: Der registered-Parameter wird nicht als HTML ausgeführt", async ({
    page,
  }) => {
    let dialog = false;
    page.on("dialog", async (d) => {
      dialog = true;
      await d.dismiss();
    });
    await page.goto(
      "/?registered=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E"
    );
    // Auf das Element prüfen, nicht auf die Zeichenfolge im Quelltext: Der
    // kodierte Wert steht im Router-Zustand und ergibt bei reiner Textsuche
    // einen Fehlalarm.
    await expect(page.locator("img[onerror]")).toHaveCount(0);
    expect(dialog).toBe(false);
  });

  test("Angemeldete Besucher landen auf dem Dashboard", async ({ browser }) => {
    const angemeldet = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const seite = await angemeldet.newPage();
    await seite.goto("/");
    await seite.waitForURL("**/dashboard", { timeout: 30000 });
    expect(new URL(seite.url()).pathname).toBe("/dashboard");
    await angemeldet.close();
  });
});
