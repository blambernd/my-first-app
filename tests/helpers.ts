import type { Page } from "@playwright/test";

/**
 * Gemeinsame Helfer für die E2E-Tests.
 */

/**
 * Den Cookie-Hinweis wegklicken, falls er steht.
 *
 * Der Banner liegt als `fixed bottom-0` mit `z-50` über dem unteren Rand der
 * Seite und fängt dort Klicks ab — auf der Anmeldeseite etwa den Verweis
 * „Registrieren", auf der Kontaktseite die Absenden-Schaltfläche. Playwright
 * meldet das als Zeitüberschreitung beim Klicken: Das Element ist sichtbar und
 * stabil, der Klick kommt trotzdem nicht an.
 *
 * Das ist **kein Fehler der Anwendung** — ein Nutzer klickt den Hinweis weg
 * und kommt weiter. Es war ein Fehler der Tests, die das nie taten.
 *
 * Der Aufruf ist unschädlich, wenn kein Banner da ist.
 */
export async function cookieHinweisWegklicken(page: Page): Promise<void> {
  const zustimmen = page.getByRole("button", { name: "Alle akzeptieren" });

  // **Auf das Erscheinen warten, nicht nur nachsehen.** Der Banner wird erst
  // nach der Hydration eingehängt. Eine sofortige Zählung direkt nach `goto`
  // findet ihn nicht, kehrt zurück — und der Banner taucht danach auf und
  // fängt den nächsten Klick ab. Genau dieser Wettlauf ließ die Tests auf dem
  // schmalen Bildschirm weiter scheitern, obwohl der Helfer schon lief.
  try {
    await zustimmen.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    return; // Kein Banner — etwa weil die Zustimmung schon gespeichert ist
  }

  await zustimmen.click();
  // Erst weiterarbeiten, wenn er tatsächlich verschwunden ist
  await zustimmen.waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
}
