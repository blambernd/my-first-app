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

  test("Hero has visual placeholder element", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("App-Vorschau")).toBeVisible();
  });

  // === Features Section ===

  test("Features section has 6 feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Digitales Scheckheft")).toBeVisible();
    await expect(page.getByText("Dokumenten-Archiv")).toBeVisible();
    await expect(page.getByText("Fahrzeug-Timeline")).toBeVisible();
    await expect(page.getByText("Kurzprofil teilen")).toBeVisible();
    await expect(page.getByText("Verkaufsinserat")).toBeVisible();
    await expect(page.getByText("Fahrzeug-Transfer")).toBeVisible();
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

  test("Premium plan has 'Empfohlen' badge", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Empfohlen")).toBeVisible();
  });

  test("Premium CTA says '14 Tage kostenlos testen'", async ({ page }) => {
    await page.goto("/");
    const trialBtn = page.getByRole("link", {
      name: "14 Tage kostenlos testen",
    });
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

  test("Social proof shows statistics", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("500+")).toBeVisible();
    await expect(page.getByText("10.000+")).toBeVisible();
    await expect(page.getByText("98%")).toBeVisible();
  });

  test("Social proof shows 3 testimonials", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Thomas M.")).toBeVisible();
    await expect(page.getByText("Sabine K.")).toBeVisible();
    await expect(page.getByText("Markus R.")).toBeVisible();
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
