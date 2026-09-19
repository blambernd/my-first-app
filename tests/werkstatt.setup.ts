import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

/**
 * Meldet das **Werkstatt-Testkonto** an und legt dessen Sitzung ab (PROJ-37).
 *
 * Zweites Konto neben dem regulären Testnutzer: Es besitzt kein eigenes
 * Fahrzeug, hat aber am Fahrzeug des ersten Kontos die Rolle `werkstatt`.
 * Nur damit ist die Hauptansicht unter /werkstatt überhaupt erreichbar —
 * ohne Mitgliedschaft leitet die Seite ins Dashboard um.
 *
 * Zugangsdaten stehen nur in .env.local (gitignored):
 *   E2E_WERKSTATT_EMAIL, E2E_WERKSTATT_PASSWORD
 */

export const WERKSTATT_AUTH_FILE = path.join(
  process.cwd(),
  "playwright/.auth/werkstatt.json"
);

setup("Werkstatt-Testkonto anmelden", async ({ page }) => {
  const email = process.env.E2E_WERKSTATT_EMAIL;
  const password = process.env.E2E_WERKSTATT_PASSWORD;

  setup.skip(
    !email || !password,
    "E2E_WERKSTATT_EMAIL / E2E_WERKSTATT_PASSWORD nicht gesetzt"
  );

  await page.goto("/login");

  // Cookie-Zustimmung **vor** der Anmeldung setzen. Das reguläre Setup
  // schreibt sie nachträglich und lädt die Seite neu — hier brach genau
  // dieses Neuladen mit ERR_ABORTED ab, weil die Anmeldung per
  // window.location bereits selbst navigiert. Vorher gesetzt, entfällt das
  // Neuladen: Der Schlüssel gehört zur selben Herkunft und überlebt die
  // Weiterleitung.
  // Schlüssel und Form stammen aus src/components/cookie-consent-banner.tsx.
  await page.evaluate(() => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ necessary: true, analytics: false, comfort: false })
    );
  });

  await page.locator("#email").fill(email!);
  await page.locator("#password").fill(password!);
  await page.getByRole("button", { name: "Anmelden" }).click();

  await page.waitForURL("**/dashboard**", { timeout: 30000 });
  // Das Konto besitzt keine eigenen Fahrzeuge; die Überschrift steht
  // trotzdem, darunter der Leerzustand.
  await expect(
    page.getByRole("heading", { name: "Meine Fahrzeuge" })
  ).toBeVisible({ timeout: 15000 });

  await expect(
    page.getByRole("button", { name: "Alle akzeptieren" })
  ).toHaveCount(0, { timeout: 15000 });

  fs.mkdirSync(path.dirname(WERKSTATT_AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: WERKSTATT_AUTH_FILE });
});
