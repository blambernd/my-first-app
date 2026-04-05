# PROJ-3: Digitales Scheckheft

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeug muss existieren

## User Stories
- Als Nutzer möchte ich einen Wartungseintrag erstellen (Datum, Typ, Beschreibung, Kilometerstand, Kosten), damit ich die Wartungshistorie dokumentieren kann
- Als Nutzer möchte ich verschiedene Eintragstypen unterscheiden (Inspektion, Ölwechsel, Reparatur, TÜV/HU, Restaurierung), damit ich gezielt filtern kann
- Als Nutzer möchte ich alle Scheckheft-Einträge chronologisch sortiert sehen, damit ich die Wartungshistorie nachvollziehen kann
- Als Nutzer möchte ich Einträge bearbeiten und löschen können, falls ich Fehler korrigieren muss
- Als Nutzer möchte ich zu einem Eintrag die ausführende Werkstatt angeben können, damit nachvollziehbar ist, wer die Arbeit gemacht hat

## Acceptance Criteria
- [ ] Neuer Eintrag kann erstellt werden mit: Datum, Typ, Beschreibung, Kilometerstand
- [ ] Optionale Felder: Kosten, Werkstatt-Name, Notizen
- [ ] Eintragstypen: Inspektion, Ölwechsel, Reparatur, TÜV/HU, Restaurierung, Sonstiges
- [ ] Einträge werden chronologisch sortiert angezeigt (neueste zuerst)
- [ ] Einträge können nach Typ gefiltert werden
- [ ] Einträge können bearbeitet und gelöscht werden
- [ ] Kilometerstand wird validiert (muss >= letztem Eintrag sein, außer bei Tacho-Korrektur)
- [ ] Zusammenfassung oben: Anzahl Einträge, Gesamtkosten, letzter Service

## Edge Cases
- Was passiert wenn der Kilometerstand niedriger ist als beim vorherigen Eintrag? → Warnung anzeigen mit Option "Tacho-Korrektur" zu markieren
- Was passiert wenn zwei Einträge am selben Tag erstellt werden? → Erlaubt, Sortierung nach Erstellungszeitpunkt
- Was passiert wenn Kosten in verschiedenen Währungen anfallen? → V1: nur EUR, Freitext-Feld für Notizen zu anderem
- Was passiert wenn ein Eintrag nachträglich für ein vergangenes Datum erstellt wird? → Erlaubt, wird chronologisch einsortiert
- Was passiert wenn die Beschreibung sehr lang ist? → Max. 2000 Zeichen, in der Liste wird gekürzt mit "mehr anzeigen"

## Technical Requirements (optional)
- Datumsformat: DD.MM.YYYY (deutsches Format)
- Währung: EUR mit 2 Dezimalstellen
- Kilometerstand: Ganzzahl, max. 9.999.999

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
