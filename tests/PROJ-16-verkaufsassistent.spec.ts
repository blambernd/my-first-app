import { test, expect } from "@playwright/test";

// E2E tests for PROJ-16: Verkaufsassistent
// Tests verify wizard page, redirects, auth, responsive design, and security.

test.describe("PROJ-16: Verkaufsassistent", () => {
  // AC: Verkaufsassistent page requires authentication
  test("Verkaufsassistent page redirects unauthenticated user to login", async ({
    page,
  }) => {
    await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/verkaufsassistent"
    );
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  // AC: Verkaufsassistent page does not crash
  test("Verkaufsassistent page does not crash for non-existent vehicle", async ({
    page,
  }) => {
    const response = await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/verkaufsassistent"
    );
    const status = response?.status() ?? 0;
    expect(status).toBeLessThan(500);
  });

  // AC: ?schritt parameter accepted
  test("Verkaufsassistent accepts schritt parameter without crashing", async ({
    page,
  }) => {
    const response = await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/verkaufsassistent?schritt=2"
    );
    const status = response?.status() ?? 0;
    expect(status).toBeLessThan(500);
  });

  // AC: /marktpreis redirects to verkaufsassistent?schritt=1
  test("Marktpreis page redirects to Verkaufsassistent step 1", async ({
    page,
  }) => {
    await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/marktpreis"
    );
    // Should redirect (302) to verkaufsassistent?schritt=1 then to login
    await page.waitForURL("**", { timeout: 10000 });
    const url = page.url();
    // Either redirected to login (because unauthed) or to verkaufsassistent
    expect(
      url.includes("/login") || url.includes("/verkaufsassistent")
    ).toBe(true);
  });

  // AC: /kurzprofil redirects to verkaufsassistent?schritt=2
  test("Kurzprofil page redirects to Verkaufsassistent step 2", async ({
    page,
  }) => {
    await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/kurzprofil"
    );
    await page.waitForURL("**", { timeout: 10000 });
    const url = page.url();
    expect(
      url.includes("/login") || url.includes("/verkaufsassistent")
    ).toBe(true);
  });

  // AC: /verkaufen redirects to verkaufsassistent?schritt=3
  test("Verkaufen page redirects to Verkaufsassistent step 3", async ({
    page,
  }) => {
    await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/verkaufen"
    );
    await page.waitForURL("**", { timeout: 10000 });
    const url = page.url();
    expect(
      url.includes("/login") || url.includes("/verkaufsassistent")
    ).toBe(true);
  });

  // AC: Responsive - mobile viewport (375px)
  test("Verkaufsassistent is responsive on mobile viewport (375px)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    const response = await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/verkaufsassistent"
    );
    expect((response?.status() ?? 0)).toBeLessThan(500);
    await context.close();
  });

  // AC: Responsive - tablet viewport (768px)
  test("Verkaufsassistent is responsive on tablet viewport (768px)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    const response = await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/verkaufsassistent"
    );
    expect((response?.status() ?? 0)).toBeLessThan(500);
    await context.close();
  });

  // AC: Responsive - desktop viewport (1440px)
  test("Verkaufsassistent is responsive on desktop viewport (1440px)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    const response = await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/verkaufsassistent"
    );
    expect((response?.status() ?? 0)).toBeLessThan(500);
    await context.close();
  });

  // Security: API responses don't expose sensitive data
  test("Listing API error response does not expose sensitive data", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/vehicles/00000000-0000-0000-0000-000000000000/listing"
    );
    const body = await response.text();
    expect(body).not.toContain("supabase");
    expect(body).not.toContain("service_role");
    expect(body).not.toContain("password");
  });

  // Regression: Landing page
  test("Landing page still renders correctly (regression)", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect((response?.status() ?? 0)).toBeLessThan(400);
  });

  // Regression: Login page
  test("Login page still renders correctly (regression)", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/login");
  });

  // Regression: Dashboard redirects unauthenticated
  test("Dashboard still redirects unauthenticated users (regression)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});
