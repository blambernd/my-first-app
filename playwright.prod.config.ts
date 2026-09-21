import { defineConfig, devices } from "@playwright/test";

/**
 * Post-Deployment-Prüfung gegen die Produktion.
 *
 * Kein webServer: Geprüft wird die ausgelieferte Anwendung, nicht der
 * Entwicklungsserver. Nur unangemeldete Specs — sie schreiben nichts.
 *
 *   npx playwright test --config playwright.prod.config.ts
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: /PROJ-(3[789])-(werkstatt|bestand|registrierung)\.spec\.ts/,
  fullyParallel: true,
  reporter: "line",
  use: {
    baseURL: "https://www.oldtimer-docs.com",
    trace: "off",
  },
  projects: [{ name: "produktion", use: { ...devices["Desktop Chrome"] } }],
});
