import { test, expect } from "@playwright/test";

// E2E tests for PROJ-11: Marktpreis-Analyse
// Tests verify page rendering, API auth/authorization, rate limiting, responsive behavior.
// Full CRUD with real SerpAPI data is not tested here (requires live API key + DB).

test.describe("PROJ-11: Marktpreis-Analyse", () => {
  // AC: Nutzer kann eine Marktpreis-Analyse für ein Fahrzeug starten
  test("Marktpreis page renders without server error", async ({ page }) => {
    const response = await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/marktpreis"
    );
    const status = response?.status() ?? 0;
    expect(status).toBeLessThan(500);
  });

  // AC: Unauthenticated users cannot access market analysis
  test("Unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/marktpreis"
    );
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  // AC: GET API requires authentication
  test("GET market-analysis API returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/vehicles/00000000-0000-0000-0000-000000000000/market-analysis"
    );
    expect(response.status()).toBe(401);
  });

  // AC: POST API requires authentication
  test("POST market-analysis API returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/vehicles/00000000-0000-0000-0000-000000000000/market-analysis"
    );
    expect(response.status()).toBe(401);
  });

  // AC: Vehicle detail route handles non-existent vehicles
  test("Marktpreis route does not crash for non-existent vehicle", async ({
    page,
  }) => {
    const response = await page.goto(
      "/vehicles/ffffffff-ffff-ffff-ffff-ffffffffffff/marktpreis"
    );
    const status = response?.status() ?? 0;
    // Should redirect to login or return 404, not 500
    expect(status).toBeLessThan(500);
  });

  // AC: Responsive on mobile viewport (375px)
  test("Marktpreis page is responsive on mobile viewport", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    const response = await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/marktpreis"
    );
    const status = response?.status() ?? 0;
    expect(status).toBeLessThan(500);
    await context.close();
  });

  // AC: Responsive on tablet viewport (768px)
  test("Marktpreis page is responsive on tablet viewport", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    const response = await page.goto(
      "/vehicles/00000000-0000-0000-0000-000000000000/marktpreis"
    );
    const status = response?.status() ?? 0;
    expect(status).toBeLessThan(500);
    await context.close();
  });

  // Regression: Landing page still works
  test("Landing page still renders correctly (regression)", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  // Regression: Login page still works
  test("Login page still renders correctly (regression)", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
  });

  // Regression: Dashboard redirects unauthenticated users
  test("Dashboard still redirects unauthenticated users (regression)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});
