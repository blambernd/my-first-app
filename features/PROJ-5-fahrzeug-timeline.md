# PROJ-5: Fahrzeug-Timeline

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeug muss existieren
- Requires: PROJ-3 (Digitales Scheckheft) — Scheckheft-Einträge werden in Timeline angezeigt
- Requires: PROJ-4 (Dokumenten-Archiv) — Dokumente werden in Timeline angezeigt

## User Stories
- Als Nutzer möchte ich eine chronologische Timeline aller Ereignisse meines Fahrzeugs sehen, damit ich die komplette Historie auf einen Blick habe
- Als Nutzer möchte ich verschiedene Ereignistypen visuell unterscheiden können (Icons/Farben), damit die Timeline übersichtlich ist
- Als Nutzer möchte ich manuelle Meilensteine hinzufügen können (z.B. "Kauf", "Erstzulassung", "Lackierung"), die nicht in andere Kategorien passen
- Als Nutzer möchte ich die Timeline nach Zeitraum filtern können, damit ich bestimmte Phasen nachschauen kann
- Als Nutzer möchte ich die Timeline als PDF exportieren können, damit ich sie bei Verkauf oder Versicherung vorlegen kann

## Acceptance Criteria
- [ ] Timeline zeigt alle Ereignisse chronologisch (neueste oben)
- [ ] Ereignisquellen: Scheckheft-Einträge (PROJ-3), Dokumente (PROJ-4), manuelle Meilensteine
- [ ] Jeder Ereignistyp hat ein eigenes Icon und Farbkodierung
- [ ] Manuelle Meilensteine können erstellt werden mit: Datum, Titel, Beschreibung, optionales Foto
- [ ] Timeline kann nach Zeitraum gefiltert werden (von-bis Datum)
- [ ] Timeline kann nach Ereignistyp gefiltert werden
- [ ] PDF-Export der Timeline (Fahrzeugdaten + alle Ereignisse)
- [ ] Leere Timeline zeigt hilfreichen Hinweis ("Füge deinen ersten Eintrag hinzu")

## Edge Cases
- Was passiert wenn Scheckheft-Einträge und Dokumente am selben Tag existieren? → Beide werden angezeigt, gruppiert nach Tag
- Was passiert wenn ein Eintrag aus PROJ-3/PROJ-4 gelöscht wird? → Verschwindet automatisch aus der Timeline
- Was passiert wenn die Timeline sehr lang ist (100+ Einträge)? → Pagination oder "Mehr laden"-Button
- Was passiert wenn der PDF-Export bei vielen Einträgen zu groß wird? → Zeitraum-Filter auf Export anwenden
- Was passiert wenn ein manueller Meilenstein bearbeitet wird? → Änderungen sofort in Timeline sichtbar

## Technical Requirements (optional)
- PDF-Generierung: Server-side (API Route)
- Performance: Timeline muss auch mit 200+ Einträgen flüssig scrollen
- Lazy Loading für Bilder in der Timeline

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
