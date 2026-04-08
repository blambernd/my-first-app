# PROJ-11: Marktpreis-Analyse

## Status: Planned
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeugstammdaten (Marke, Modell, Baujahr, Werksbezeichnung, km-Stand)

## User Stories
- Als Oldtimer-Besitzer möchte ich den aktuellen Marktwert meines Fahrzeugs einschätzen können, damit ich einen realistischen Verkaufspreis festlegen kann
- Als Oldtimer-Besitzer möchte ich sehen, welche vergleichbaren Fahrzeuge aktuell inseriert sind, damit ich mein Angebot im Marktkontext einordnen kann
- Als Oldtimer-Besitzer möchte ich eine Preisspanne (von–bis) sehen, damit ich weiß, in welchem Bereich mein Fahrzeug liegt
- Als Oldtimer-Besitzer möchte ich die Analyse jederzeit aktualisieren können, damit ich aktuelle Marktdaten bekomme

## Acceptance Criteria
- [ ] Nutzer kann eine Marktpreis-Analyse für ein Fahrzeug starten
- [ ] System durchsucht aktuelle Inserate auf relevanten Plattformen (mobile.de, Classic Trader, eBay)
- [ ] Ergebnis zeigt: Durchschnittspreis, Median, Preisspanne (niedrigster–höchster Preis)
- [ ] Ergebnis zeigt eine Liste vergleichbarer Inserate mit Titel, Preis, Plattform und Link
- [ ] Fahrzeugdaten (Marke, Modell, Baujahr, Werksbezeichnung, km-Stand) werden automatisch als Suchkriterien verwendet
- [ ] Ergebnis enthält eine begründete Preisempfehlung basierend auf den Marktdaten
- [ ] Nutzer kann die Analyse erneut durchführen (mit Rate-Limiting)
- [ ] Ergebnisse werden gespeichert und können später eingesehen werden
- [ ] Mindestens 3 Vergleichsangebote müssen gefunden werden, um eine Preisempfehlung abzugeben

## Edge Cases
- Was passiert, wenn keine vergleichbaren Inserate gefunden werden? → Meldung "Zu wenige Daten für eine Preisschätzung" + Vorschlag, Suchkriterien zu erweitern
- Was passiert bei sehr seltenen Fahrzeugen (z.B. Facel Vega)? → Suche auf allgemeinere Kriterien erweitern (nur Marke + Baujahr)
- Was passiert, wenn die Preise extrem streuen (z.B. 5.000€ bis 150.000€)? → Ausreißer kennzeichnen, Hinweis auf unterschiedliche Zustände geben
- Was passiert, wenn externe Plattformen nicht erreichbar sind? → Plattform-Fehler anzeigen, Analyse mit verfügbaren Daten durchführen
- Wie wird mit verschiedenen Währungen umgegangen? → Nur EUR, Inserate in anderen Währungen werden ignoriert

## Technical Requirements
- Performance: Analyse darf maximal 15 Sekunden dauern (mit Loading-Indikator)
- Rate-Limiting: Maximal 5 Analysen pro Fahrzeug pro Tag
- Daten: Ergebnisse werden in der Datenbank gespeichert (für Historie und spätere Nutzung in PROJ-12)
- API: SerpAPI (bereits vorhanden) für Marktdaten-Suche nutzen

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
