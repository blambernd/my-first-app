"use client";

import { useSyncExternalStore } from "react";

/** Die Herkunft ändert sich innerhalb einer Seitensitzung nicht. */
function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): string {
  return window.location.origin;
}

function getServerSnapshot(): string {
  return "";
}

/**
 * Die Basis-URL der laufenden Seite — hydration-sicher.
 *
 * Der naheliegende Weg
 *
 *     const origin = typeof window !== "undefined" ? window.location.origin : "";
 *
 * liest den Wert **während des Renderings**. Auf dem Server ergibt das einen
 * leeren Text, im Browser die echte Adresse. Steht der Wert im Markup — etwa
 * als angezeigter Einladungslink —, weicht das erste Client-Rendering vom
 * Server-HTML ab: React bricht die Hydration ab (Fehler #418) und rendert den
 * Teilbaum neu.
 *
 * `useSyncExternalStore` trennt beides sauber: React nimmt für Serverausgabe
 * und Hydration den Server-Schnappschuss und wechselt erst danach auf den
 * Client-Wert.
 */
export function useOrigin(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
