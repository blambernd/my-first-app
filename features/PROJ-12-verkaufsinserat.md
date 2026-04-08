# PROJ-12: Verkaufsinserat erstellen

## Status: Planned
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeugstammdaten & Fotos
- Requires: PROJ-10 (Fahrzeug-Kurzprofil) — Link zum öffentlichen Profil wird ins Inserat eingebettet
- Requires: PROJ-11 (Marktpreis-Analyse) — Preisempfehlung als Vorschlag

## User Stories
- Als Oldtimer-Besitzer möchte ich automatisch einen Inserat-Text generieren lassen, damit ich nicht alles selbst schreiben muss
- Als Oldtimer-Besitzer möchte ich Fotos aus meinem Fahrzeugprofil für das Inserat auswählen können, damit ich keine Bilder erneut hochladen muss
- Als Oldtimer-Besitzer möchte ich den generierten Text vollständig bearbeiten können, damit das Inserat meinen Vorstellungen entspricht
- Als Oldtimer-Besitzer möchte ich den empfohlenen Preis aus der Marktanalyse als Vorschlag sehen, damit ich einen realistischen Preis setze
- Als Oldtimer-Besitzer möchte ich, dass der Link zum Kurzprofil automatisch im Inserat erscheint, damit Käufer die verifizierte Historie einsehen können

## Acceptance Criteria
- [ ] Nutzer kann ein neues Verkaufsinserat für ein Fahrzeug starten
- [ ] System generiert automatisch einen Inserat-Titel aus Marke, Modell, Baujahr und Werksbezeichnung
- [ ] System generiert automatisch eine Beschreibung basierend auf: Fahrzeugdaten, Zustand, Kilometerstand, Highlights aus der Historie
- [ ] Nutzer kann Fotos aus dem Fahrzeugprofil (Profilbilder + Historie-Bilder) auswählen und die Reihenfolge bestimmen
- [ ] Titel, Beschreibung und Preis sind im Editor frei editierbar
- [ ] Link zum öffentlichen Kurzprofil (PROJ-10) wird automatisch in die Beschreibung eingefügt
- [ ] Vorschau zeigt das Inserat so, wie es auf der Zielplattform aussehen würde
- [ ] Inserat kann als Entwurf gespeichert und später weiterbearbeitet werden
- [ ] Preisempfehlung aus PROJ-11 wird als Vorschlagswert angezeigt (falls vorhanden)
- [ ] Nutzer kann zwischen "Festpreis" und "Verhandlungsbasis" wählen

## Edge Cases
- Was passiert, wenn kein Kurzprofil (PROJ-10) existiert? → Hinweis "Erstelle ein Kurzprofil, um deine Fahrzeughistorie im Inserat zu verlinken" + trotzdem fortfahren möglich
- Was passiert, wenn keine Marktanalyse (PROJ-11) vorhanden ist? → Preisfeld bleibt leer, Nutzer gibt manuell ein
- Was passiert, wenn keine Fotos vorhanden sind? → Warnung "Inserate mit Fotos erzielen deutlich höhere Aufmerksamkeit" + trotzdem fortfahren möglich
- Was passiert, wenn der generierte Text zu lang für eine Plattform ist? → Zeichenzähler mit Limit-Warnung pro Plattform
- Was passiert mit mehreren Entwürfen für dasselbe Fahrzeug? → Nur ein aktiver Entwurf pro Fahrzeug, alter wird überschrieben (mit Bestätigung)

## Technical Requirements
- Text-Generierung: Serverseitig, basierend auf Templates + Fahrzeugdaten (kein LLM in V1 — deterministisches Template)
- Speicherung: Entwürfe werden in der Datenbank gespeichert (Titel, Beschreibung, Preis, ausgewählte Fotos, Status)
- Bilder: Keine Kopie der Bilder — Referenz auf vorhandene Fahrzeugbilder
- Zeichenlimits: mobile.de Titel max 70 Zeichen, Beschreibung max 5.000 Zeichen; eBay ähnlich

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
