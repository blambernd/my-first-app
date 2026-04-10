import { test, expect } from "@playwright/test";

test.describe("PROJ-23: Push Notifications", () => {
  // AC: VAPID key endpoint returns public key or 503
  test("VAPID key API returns response", async ({ request }) => {
    const response = await request.get("/api/push/vapid-key");
    // Either 200 with key or 503 if not configured
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 200) {
      expect(body).toHaveProperty("publicKey");
    } else {
      expect(body).toHaveProperty("error");
    }
  });

  // AC: Subscribe endpoint requires authentication
  test("Subscribe API returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.post("/api/push/subscribe", {
      data: {
        endpoint: "https://push.example.com/sub",
        keys: { p256dh: "testkey", auth: "testauthkey" },
      },
    });
    expect(response.status()).toBe(401);
  });

  // AC: Unsubscribe endpoint requires authentication
  test("Unsubscribe API returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.delete("/api/push/subscribe", {
      data: { endpoint: "https://push.example.com/sub" },
    });
    expect(response.status()).toBe(401);
  });

  // AC: Preferences GET endpoint requires authentication
  test("Preferences GET returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.get("/api/push/preferences");
    expect(response.status()).toBe(401);
  });

  // AC: Preferences PUT endpoint requires authentication
  test("Preferences PUT returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.put("/api/push/preferences", {
      data: {
        reminder_days: 7,
        tuv_enabled: true,
        service_enabled: true,
        oil_enabled: true,
      },
    });
    expect(response.status()).toBe(401);
  });

  // AC: Cron endpoint requires authorization
  test("Check-reminders cron returns 401 without proper auth", async ({
    request,
  }) => {
    const response = await request.get("/api/cron/check-reminders");
    expect(response.status()).toBe(401);
  });

  // AC: Cron endpoint rejects invalid bearer token
  test("Check-reminders cron returns 401 with wrong bearer token", async ({
    request,
  }) => {
    const response = await request.get("/api/cron/check-reminders", {
      headers: { Authorization: "Bearer wrong-token" },
    });
    expect(response.status()).toBe(401);
  });

  // AC: Service Worker is registered and serves push handler
  test("Service Worker file is accessible", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('addEventListener("push"');
    expect(body).toContain('addEventListener("notificationclick"');
  });

  // AC: Dashboard page loads without errors (regression)
  test("Dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  // AC: Landing page still works (regression)
  test("Landing page still renders correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Oldtimer Docs/);
  });

  // AC: Login page still works (regression)
  test("Login page still renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Anmelden").first()).toBeVisible();
  });
});
