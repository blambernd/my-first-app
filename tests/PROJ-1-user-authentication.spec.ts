import { test, expect } from "@playwright/test";

// These E2E tests verify the auth UI flows without a real Supabase backend.
// They test page rendering, navigation, client-side validation, and form behavior.

test.describe("PROJ-1: User Authentication", () => {
  // AC: Landing page has login and register links
  test("Landing page shows login and register buttons", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Anmelden" })
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Registrieren" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Kostenlos starten" })
    ).toBeVisible();
  });

  // AC: Login page renders correctly with all elements
  test("Login page renders email, password fields and submit button", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Anmelden" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Magic Link senden" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Passwort vergessen?" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Registrieren" })
    ).toBeVisible();
  });

  // AC: Registrierung mit E-Mail + Passwort — form renders
  test("Register page renders email, password, confirm password fields", async ({
    page,
  }) => {
    await page.goto("/register");
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Passwort bestätigen")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Registrieren" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Anmelden" })
    ).toBeVisible();
  });

  // AC: Passwort muss mindestens 8 Zeichen lang sein (client validation)
  test("Register page shows validation error for short password", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.getByLabel("E-Mail").fill("test@example.com");
    await page.getByLabel("Passwort", { exact: true }).fill("short");
    await page.getByLabel("Passwort bestätigen").fill("short");
    await page.getByRole("button", { name: "Registrieren" }).click();
    await expect(
      page.getByText("Passwort muss mindestens 8 Zeichen lang sein")
    ).toBeVisible();
  });

  // EC: Mismatched passwords show validation error
  test("Register page shows error for mismatched passwords", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.getByLabel("E-Mail").fill("test@example.com");
    await page.getByLabel("Passwort", { exact: true }).fill("password123");
    await page.getByLabel("Passwort bestätigen").fill("different456");
    await page.getByRole("button", { name: "Registrieren" }).click();
    await expect(
      page.getByText("Passwörter stimmen nicht überein")
    ).toBeVisible();
  });

  // EC: Invalid email format — login schema rejects empty email
  test("Login page shows validation error for empty email", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Passwort").fill("password123");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByText("E-Mail ist erforderlich")).toBeVisible();
  });

  // AC: Login with empty fields shows validation errors
  test("Login page shows validation errors for empty fields", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByText("E-Mail ist erforderlich")).toBeVisible();
    await expect(page.getByText("Passwort ist erforderlich")).toBeVisible();
  });

  // AC: Magic Link mode toggle works
  test("Login page toggles to Magic Link mode", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Magic Link senden" }).click();
    // In magic link mode, password field should be gone
    await expect(page.getByLabel("Passwort")).not.toBeVisible();
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    // Can go back
    await page
      .getByRole("button", { name: "Zurück zum Passwort-Login" })
      .click();
    await expect(page.getByLabel("Passwort")).toBeVisible();
  });

  // AC: Forgot password page renders
  test("Forgot password page renders with email field", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.getByText("Passwort vergessen", { exact: false })
    ).toBeVisible();
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reset-Link senden" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Zurück zum Login" })
    ).toBeVisible();
  });

  // AC: Reset password page renders
  test("Reset password page renders with password fields", async ({
    page,
  }) => {
    await page.goto("/reset-password");
    await expect(
      page.getByLabel("Neues Passwort", { exact: true })
    ).toBeVisible();
    await expect(page.getByLabel("Passwort bestätigen")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Passwort ändern" })
    ).toBeVisible();
  });

  // AC: Nicht-authentifizierte Nutzer werden auf Login-Seite umgeleitet
  test("Unauthenticated users are redirected from dashboard to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  // Navigation: Login page links to register
  test("Login page links to register page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Registrieren" }).click();
    await page.waitForURL("**/register");
    expect(page.url()).toContain("/register");
  });

  // Navigation: Register page links to login
  test("Register page links to login page", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Anmelden" }).click();
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  // Navigation: Login page links to forgot-password
  test("Login page links to forgot password page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Passwort vergessen?" }).click();
    await page.waitForURL("**/forgot-password");
    expect(page.url()).toContain("/forgot-password");
  });

  // Responsive: Auth pages render on mobile viewport
  test("Login page is responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Anmelden" })
    ).toBeVisible();
  });
});
