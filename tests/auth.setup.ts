import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

/**
 * Meldet einen Testnutzer einmalig an und legt die Sitzung als Datei ab.
 * Alle Specs mit der Endung `-auth.spec.ts` starten damit bereits angemeldet,
 * statt sich einzeln durch das Anmeldeformular zu klicken.
 *
 * Zugangsdaten kommen aus der Umgebung und stehen nirgends im Code:
 *   E2E_EMAIL, E2E_PASSWORD  (siehe .env.local.example)
 *
 * Ohne gesetzte Zugangsdaten wird übersprungen — die unangemeldeten Specs
 * laufen dann weiterhin normal durch.
 */

export const AUTH_FILE = path.join(
  process.cwd(),
  "playwright/.auth/user.json"
);

setup("Testnutzer anmelden", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  setup.skip(
    !email || !password,
    "E2E_EMAIL / E2E_PASSWORD nicht gesetzt — angemeldete Tests werden übersprungen"
  );

  await page.goto("/login");
  await page.locator("#email").fill(email!);
  await page.locator("#password").fill(password!);
  await page.getByRole("button", { name: "Anmelden" }).click();

  // Die Anmeldung leitet per window.location auf das Dashboard weiter
  await page.waitForURL("**/dashboard**", { timeout: 30000 });
  // Ausdrücklich "Meine Fahrzeuge": Sobald der Testnutzer ein geteiltes
  // Fahrzeug hat, steht auf dem Dashboard zusätzlich "Geteilte Fahrzeuge" —
  // ein Muster auf /Fahrzeuge/i trifft dann zwei Überschriften und die
  // Anmeldung scheitert, womit alle angemeldeten Tests ausfallen.
  await expect(
    page.getByRole("heading", { name: "Meine Fahrzeuge" })
  ).toBeVisible({ timeout: 15000 });

  // Cookie-Zustimmung direkt in den localStorage schreiben statt sie
  // wegzuklicken. Das Banner liegt fixiert am unteren Rand und fängt dort alle
  // Klicks ab — Schaltflächen sind im DOM auffindbar, aber nicht erreichbar,
  // was sich als unerklärlicher Klick-Timeout äußert. Ein Klick-Ansatz hängt
  // davon ab, dass das Banner zum Zeitpunkt der Prüfung schon gerendert ist;
  // der Schreibzugriff ist unabhängig davon und wandert in den gespeicherten
  // Sitzungszustand, gilt also für alle angemeldeten Tests.
  // Schlüssel und Form stammen aus src/components/cookie-consent-banner.tsx.
  await page.evaluate(() => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ necessary: true, analytics: false, comfort: false })
    );
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Alle akzeptieren" })
  ).toHaveCount(0, { timeout: 15000 });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
