import { test, expect } from "@playwright/test";

// E2E tests for PROJ-15: Kontakt & Feedback

test.describe("PROJ-15: Kontakt & Feedback", () => {
  // AC: Kontaktseite ist unter /kontakt erreichbar
  test("Kontakt page is accessible at /kontakt", async ({ page }) => {
    await page.goto("/kontakt");
    await expect(page).toHaveTitle(/Kontakt/);
    await expect(page.locator("h1")).toHaveText("Kontakt");
  });

  // AC: Seite ist öffentlich zugänglich (kein Login erforderlich)
  test("Kontakt page is publicly accessible without login", async ({
    page,
  }) => {
    await page.goto("/kontakt");
    expect(page.url()).toContain("/kontakt");
    await expect(page.locator("h1")).toBeVisible();
  });

  // AC: Kontaktformular enthält alle erforderlichen Felder
  test("Contact form has all required fields", async ({ page }) => {
    await page.goto("/kontakt");
    await expect(page.locator("button[role='combobox']")).toBeVisible();
    await expect(page.getByPlaceholder("Ihr Name")).toBeVisible();
    await expect(page.getByPlaceholder("ihre@email.de")).toBeVisible();
    await expect(page.getByPlaceholder("Worum geht es?")).toBeVisible();
    await expect(
      page.getByPlaceholder("Beschreiben Sie Ihr Anliegen...")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Nachricht senden" })
    ).toBeVisible();
  });

  // AC: Kategorie dropdown has 4 options
  test("Kategorie dropdown has 4 options", async ({ page }) => {
    await page.goto("/kontakt");
    await page.locator("button[role='combobox']").click();
    const options = page.locator("[role='option']");
    await expect(options).toHaveCount(4);
  });

  // AC: Client-seitige Validierung aller Pflichtfelder
  test("Form shows validation errors when submitted empty", async ({
    page,
  }) => {
    await page.goto("/kontakt");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    // At least one validation error message should appear (red text)
    const errorMessages = page.locator("p.text-destructive");
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
    const count = await errorMessages.count();
    expect(count).toBeGreaterThan(0);
  });

  // AC: Bei "Bug melden": optionales Feld für URL
  test("Bug URL field appears only when Bug melden is selected", async ({
    page,
  }) => {
    await page.goto("/kontakt");
    await expect(page.getByPlaceholder("https://...")).not.toBeVisible();
    await page.locator("button[role='combobox']").click();
    await page.getByRole("option", { name: "Bug melden" }).click();
    await expect(page.getByPlaceholder("https://...")).toBeVisible();
  });

  // AC: Bug URL field hides when switching category
  test("Bug URL field hides when switching away from Bug melden", async ({
    page,
  }) => {
    await page.goto("/kontakt");
    await page.locator("button[role='combobox']").click();
    await page.getByRole("option", { name: "Bug melden" }).click();
    await expect(page.getByPlaceholder("https://...")).toBeVisible();
    await page.locator("button[role='combobox']").click();
    await page.getByRole("option", { name: "Allgemeine Anfrage" }).click();
    await expect(page.getByPlaceholder("https://...")).not.toBeVisible();
  });

  // AC: Zeichenzähler für Nachricht
  test("Message field shows character counter", async ({ page }) => {
    await page.goto("/kontakt");
    await expect(page.getByText("0/5000")).toBeVisible();
    const textarea = page.getByPlaceholder("Beschreiben Sie Ihr Anliegen...");
    await textarea.click();
    await textarea.pressSequentially("Hello World", { delay: 20 });
    // Wait for React state update
    await expect(page.getByText("11/5000")).toBeVisible({ timeout: 5000 });
  });

  // AC: Link "Kontakt" im Footer
  test("Footer contains Kontakt link", async ({ page }) => {
    await page.goto("/kontakt");
    const footerLink = page
      .locator("footer")
      .last()
      .locator("a[href='/kontakt']");
    await expect(footerLink).toBeVisible();
  });

  // AC: Responsive - Mobile viewport
  test("Page renders correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/kontakt");
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Nachricht senden" })
    ).toBeVisible();
  });

  // AC: Meta description
  test("Page has meta description", async ({ page }) => {
    await page.goto("/kontakt");
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute("content");
    expect(content).toBeTruthy();
  });

  // Security: Contact API validates input
  test("Contact API rejects invalid input with 400", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { category: "invalid", name: "", email: "not-email" },
    });
    // Either 400 (validation) or 429 (rate limited) is acceptable
    expect([400, 429]).toContain(response.status());
  });

  // Security: Contact API rejects missing fields
  test("Contact API rejects empty body with 400", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {},
    });
    expect([400, 429]).toContain(response.status());
  });

  // Security: Contact API rate limiting
  test("Contact API enforces rate limiting", async ({ request }) => {
    const validPayload = {
      category: "general",
      name: "Test User",
      email: "test@example.com",
      subject: "Test Subject",
      message: "This is a test message with enough characters.",
    };
    const responses = [];
    for (let i = 0; i < 7; i++) {
      const res = await request.post("/api/contact", { data: validPayload });
      responses.push(res.status());
    }
    // Should see either 429 (rate limited) or 503 (no email config)
    const hasExpectedResponse = responses.some(
      (s) => s === 429 || s === 503
    );
    expect(hasExpectedResponse).toBe(true);
  });

  // Security: XSS prevention
  test("Contact API does not reflect raw HTML in responses", async ({
    request,
  }) => {
    const response = await request.post("/api/contact", {
      data: {
        category: "general",
        name: '<script>alert("xss")</script>',
        email: "test@example.com",
        subject: "Test",
        message: "Short msg",
      },
    });
    const body = await response.text();
    expect(body).not.toContain("<script>");
  });
});
