/**
 * Zentrale Schalter für Funktionen, die bewusst ausgesetzt sind.
 */

/**
 * Marktüberblick / Marktpreis-Analyse.
 *
 * Ausgesetzt am 2026-08-02. Die QA zu PROJ-29 hat belegt, dass die
 * zugrundeliegende Datenbeschaffung keine belastbaren Ergebnisse liefern kann:
 *
 * - 61 % der gezählten "Vergleichsfahrzeuge" waren Suchergebnisseiten
 * - dieselbe Anzeige wurde über ihre Länderfassungen mehrfach gezählt
 * - Beträge in Schweizer Franken flossen als Euro ein
 *
 * Die Korrekturen dafür liegen auf dem Zweig
 * `proj-29-belastbarer-marktueberblick`. Sie beheben die Rechenfehler, ändern
 * aber nichts daran, dass Google von mobile.de und AutoScout24 keine
 * Fahrzeug-Detailseiten indexiert — ein Gegentest mit einem BMW Z3 ergab null
 * Vergleichsfahrzeuge.
 *
 * Wieder auf `true` setzen, sobald eine Quelle mit echten Inseraten angebunden
 * ist (eBay Browse API oder eine direkte Schnittstelle). Siehe
 * features/PROJ-29-belastbarer-marktueberblick.md.
 */
export const MARKTUEBERBLICK_AKTIV = false;

/**
 * Verkaufsassistent samt seiner vier Schritte: Marktüberblick, Kurzprofil,
 * Inserat und Veröffentlichen.
 *
 * Ausgesetzt am 2026-08-02 gemeinsam mit dem Marktüberblick. Der Assistent
 * beginnt mit der Preisermittlung; ohne belastbare Preise führt er in die
 * Irre, und die folgenden Schritte bauen darauf auf.
 *
 * Betrifft die Routen `/verkaufsassistent`, `/marktpreis`, `/kurzprofil` und
 * `/verkaufen` — Letztere sind Kurzverweise auf einzelne Schritte.
 *
 * **Nicht betroffen:** bereits veröffentlichte Kurzprofile unter
 * `/profil/<token>`. Diese Verweise haben Besitzer an Kaufinteressenten
 * weitergegeben; sie bleiben erreichbar. Neue lassen sich vorerst nicht
 * anlegen.
 */
export const VERKAUFSASSISTENT_AKTIV = false;
