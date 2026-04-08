import { test, expect } from "@playwright/test";

// E2E tests for PROJ-14: FAQ-Seite

test.describe("PROJ-14: FAQ-Seite", () => {
  // AC: FAQ-Seite ist unter /faq erreichbar
  test("FAQ page is accessible at /faq", async ({ page }) => {
    await page.goto("/faq");
    await expect(page).toHaveTitle(/FAQ/);
    await expect(page.locator("h1")).toBeVisible();
  });

  // AC: Seite ist öffentlich zugänglich (kein Login erforderlich)
  test("FAQ page is publicly accessible without login", async ({ page }) => {
    await page.goto("/faq");
    expect(page.url()).toContain("/faq");
    await expect(page.locator("h1")).toBeVisible();
  });

  // AC: FAQs werden als aufklappbare Akkordeon-Elemente dargestellt
  test("FAQ items are displayed as accordion elements", async ({ page }) => {
    await page.goto("/faq");
    const accordionButtons = page.locator("button[data-state]");
    const count = await accordionButtons.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  // AC: Mindestens 8-10 sinnvolle FAQ-Einträge
  test("FAQ has at least 10 entries", async ({ page }) => {
    await page.goto("/faq");
    const items = page.locator("button[data-state]");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  // AC: Accordion items can be expanded and collapsed
  test("Accordion items expand and collapse on click", async ({ page }) => {
    await page.goto("/faq");
    const firstTrigger = page.locator("button[data-state]").first();
    // Initially closed
    await expect(firstTrigger).toHaveAttribute("data-state", "closed");
    // Click to expand
    await firstTrigger.click();
    await expect(firstTrigger).toHaveAttribute("data-state", "open");
    // Click to collapse
    await firstTrigger.click();
    await expect(firstTrigger).toHaveAttribute("data-state", "closed");
  });

  // AC: Link "FAQ" im Footer
  test("Footer contains FAQ link", async ({ page }) => {
    await page.goto("/faq");
    const footerFaqLink = page.locator("footer").last().locator("a[href='/faq']");
    await expect(footerFaqLink).toBeVisible();
    await expect(footerFaqLink).toHaveText("FAQ");
  });

  // AC: Footer contains Kontakt link
  test("Footer contains Kontakt link", async ({ page }) => {
    await page.goto("/faq");
    const footerLink = page.locator("footer").last().locator("a[href='/kontakt']");
    await expect(footerLink).toBeVisible();
    await expect(footerLink).toHaveText("Kontakt");
  });

  // AC: Seite hat Meta-Description
  test("Page has meta description", async ({ page }) => {
    await page.goto("/faq");
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(10);
  });

  // AC: Kontaktseite link in intro text
  test("Intro text links to Kontaktseite", async ({ page }) => {
    await page.goto("/faq");
    const kontaktLink = page.locator("main a[href='/kontakt']");
    await expect(kontaktLink).toBeVisible();
  });

  // AC: Responsive - Mobile viewport
  test("Page renders correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/faq");
    await expect(page.locator("h1")).toBeVisible();
    const firstTrigger = page.locator("button[data-state]").first();
    await expect(firstTrigger).toBeVisible();
  });
});
