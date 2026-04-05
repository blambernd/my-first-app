# PROJ-5: Fahrzeug-Timeline

## Status: Architected
**Created:** 2026-04-04
**Last Updated:** 2026-04-05

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

## Tech Design v2 (Solution Architect)

> **v2 Redesign:** Timeline ist eine eigenständige Fahrzeug-Historie — keine Vermischung mit Scheckheft oder Dokumenten.

### Seitenstruktur

```
/vehicles/[id] (bestehend — "Timeline" Tab)
+-- Tabs
|   +-- "Scheckheft" Tab (PROJ-3, unverändert)
|   +-- "Timeline" Tab (ÜBERARBEITET)
|   |   +-- "Neuer Meilenstein" Button
|   |   +-- Kategorie-Filter (Chips: Alle, Erstzulassung, Kauf, Restauration, ...)
|   |   +-- Zeitraum-Filter (Von/Bis Datum)
|   |   +-- PDF-Export-Button
|   |   +-- Timeline-Leiste (vertikale Linie)
|   |   |   +-- Tages-Gruppe (Datum als Überschrift)
|   |   |   |   +-- Meilenstein-Karte
|   |   |   |   |   +-- Kategorie-Icon + Farbe
|   |   |   |   |   +-- Titel + Beschreibung
|   |   |   |   |   +-- Foto-Galerie (mehrere Bilder)
|   |   |   |   |   +-- Bearbeiten / Löschen
|   |   +-- Leerer Zustand ("Dokumentiere die Geschichte deines Fahrzeugs")
|   +-- "Dokumente" Tab (PROJ-4, unverändert)

Dialog (Neuer/Bearbeiten Meilenstein):
+-- Kategorie (Pflicht, Select)
+-- Datum (Pflicht, Calendar-Picker)
+-- Titel (Pflicht, max. 200 Zeichen)
+-- Beschreibung (Optional, max. 2000 Zeichen)
+-- Fotos (Optional, Multi-Upload, max. 10 Bilder à 5 MB)
+-- Speichern / Abbrechen
```

### Meilenstein-Kategorien

| Kategorie | Icon | Farbe |
|-----------|------|-------|
| Erstzulassung | FileCheck | Grün |
| Kauf / Besitzerwechsel | HandCoins | Blau |
| Restauration | Hammer | Orange |
| Unfall / Schaden | AlertTriangle | Rot |
| Trophäe / Auszeichnung | Trophy | Gold |
| Lackierung | Paintbrush | Violett |
| Umbau / Tuning | Wrench | Cyan |
| Sonstiges | Flag | Grau |

### Datenmodell

```
Meilenstein (vehicle_milestones — ANPASSEN):
- Eindeutige ID
- Verknüpfung zum Fahrzeug
- Kategorie (Pflicht: erstzulassung, kauf, restauration, unfall,
  trophaee, lackierung, umbau, sonstiges)
- Datum
- Titel (Pflicht, max. 200 Zeichen)
- Beschreibung (optional, max. 2000 Zeichen — erhöht von 1000)
- Erstellt am / Aktualisiert am

Meilenstein-Fotos (vehicle_milestone_images — NEU):
- Eindeutige ID
- Verknüpfung zum Meilenstein
- Storage-Pfad
- Position (Reihenfolge)
- Erstellt am

Gespeichert in: Supabase PostgreSQL
Foto-Storage: Bestehender Bucket "vehicle-images" (Unterordner milestones/)
Zugriffskontrolle: RLS über Fahrzeug-Ownership
```

### Was sich ändert vs. v1

| Bereich | Alt (v1) | Neu (v2) |
|---------|----------|----------|
| **Inhalt** | Scheckheft + Dokumente + Meilensteine gemischt | Nur Meilensteine (Fahrzeug-Historie) |
| **Kategorien** | Keine (nur Typ-Quelle) | 8 spezifische Kategorien mit Icons |
| **Fotos** | 1 Foto pro Meilenstein | Bis zu 10 Fotos (wichtig für Restaurationen) |
| **Beschreibung** | Max. 1000 Zeichen | Max. 2000 Zeichen |
| **Filter** | Typ-Filter (Scheckheft/Dokumente/Meilensteine) | Kategorie-Filter (Erstzulassung/Kauf/...) |
| **Summary Cards** | Aggregierte Zahlen aller Quellen | Entfernt (nicht nötig) |
| **PDF** | Alle 3 Quellen | Nur Meilensteine |
| **timeline.ts** | Aggregation von 3 Quellen | Wird entfernt |
| **photo_path** | Einzelnes Feld in milestones | Eigene Tabelle milestone_images |

### Tech-Entscheidungen

| Entscheidung | Warum? |
|---|---|
| **Separate Foto-Tabelle** | Multi-Upload braucht 1:n Beziehung — ein Feld reicht nicht mehr |
| **Kategorien als ENUM** | Feste Liste, validierbar, jede Kategorie hat eigenes Icon+Farbe |
| **2000 Zeichen Beschreibung** | Restaurations-Berichte brauchen mehr Platz |
| **timeline.ts entfernen** | Keine Aggregation mehr nötig — nur noch Meilensteine |
| **Bestehende Tabelle anpassen** | vehicle_milestones wird erweitert (Kategorie hinzufügen, photo_path entfernen) |

### Sicherheit

- **RLS Policy:** Meilensteine + Fotos nur über Fahrzeug-Ownership erreichbar
- **PDF API Route:** Authentifizierung prüfen, nur eigene Fahrzeuge
- **Foto-Upload:** Bestehende Storage-Policies greifen (Ordner-basiert)
- **Validierung:** Client-side (Zod) + Database CHECK constraints

### Keine neuen Abhängigkeiten

`@react-pdf/renderer` ist bereits installiert.

## Implementation Notes
_To be added by /frontend and /backend_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
