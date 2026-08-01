import { test, expect } from "@playwright/test";

// Vorläufige Rauchprobe des Backends; die vollständigen Tests folgen in /qa.
const VEHICLE_ID = process.env.E2E_VEHICLE_ID;

test.skip(!process.env.E2E_EMAIL || !process.env.E2E_VEHICLE_ID, "E2E-Zugang nicht gesetzt");

test("Auswertung lädt nach der Rechteumstellung weiterhin", async ({ page }) => {
  await page.goto(`/vehicles/${VEHICLE_ID}/kosten/auswertung`);
  await expect(
    page.getByText("Noch keine Kosten zum Auswerten").or(page.getByText("Gesamtkosten")).first()
  ).toBeVisible({ timeout: 30000 });
  // .first(): "Einzelkosten" trifft den Unterreiter und im leeren Zustand
  // zusätzlich die Schaltfläche, die zur Erfassung führt
  await expect(
    page.getByRole("link", { name: "Einzelkosten", exact: true }).first()
  ).toBeVisible();
});
