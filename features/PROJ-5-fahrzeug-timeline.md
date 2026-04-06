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

## Implementation Notes (Frontend v2)

### Rewritten Files
- `src/lib/validations/milestone.ts` — Added 8 milestone categories with CATEGORY_CONFIG (labels, colors), getCategoryLabel helper, VehicleMilestoneImage and VehicleMilestoneWithImages types, increased description max to 2000
- `src/components/vehicle-timeline.tsx` — Milestone-only timeline with category icons/colors, category filter chips, date range filter, photo gallery per milestone, PDF export with category param
- `src/components/milestone-form.tsx` — Category select, multi-photo upload (max 10 × 5MB), existing photo management on edit, photo deletion support

### Modified Files
- `src/app/vehicles/[id]/page.tsx` — Fetches milestones with images join, passes supabaseUrl to timeline, removed service/document props from VehicleTimeline
- `src/app/api/vehicles/[id]/timeline-pdf/route.tsx` — Milestone-only PDF with category labels, category filter param

### Removed Files
- `src/lib/validations/timeline.ts` — Aggregation logic no longer needed
- `src/lib/validations/timeline.test.ts` — Tests for removed aggregation

### Notes
- Timeline is now a standalone vehicle history — no mixing with Scheckheft or Documents
- Each category has a unique icon (lucide-react) and color
- Multi-photo stored in new `vehicle_milestone_images` table (to be created by /backend)
- Existing `vehicle_milestones` table needs `category` column + `photo_path` removal (to be done by /backend)

## Implementation Notes (Backend v2)

### Database Migration
- `supabase/migrations/20260406_v2_milestones_categories_images.sql` — Run AFTER the v1 migration
  - Adds `category` column to `vehicle_milestones` (CHECK constraint, 8 values, default 'sonstiges')
  - Increases description limit from 1000 to 2000 characters
  - Drops `photo_path` column (replaced by images table)
  - Creates `vehicle_milestone_images` table (milestone_id FK with CASCADE, storage_path, position)
  - Full RLS on `vehicle_milestone_images` via milestone → vehicle ownership (2-level JOIN)
  - Index on (vehicle_id, category) for category filtering

### API Route Changes
- `GET /api/vehicles/[id]/timeline-pdf` — Now milestone-only, supports `?category=` filter param

### Migration Order
1. First run `20260405_create_vehicle_milestones.sql` (creates base table)
2. Then run `20260406_v2_milestones_categories_images.sql` (adds categories + images)

## QA Test Results (v2)

**Tested:** 2026-04-06
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Timeline zeigt nur Meilensteine (keine Scheckheft/Dokumente)
- [x] Timeline component only receives and displays milestones
- [x] No service entries or documents in the timeline
- [x] timeline.ts aggregation logic removed

#### AC-2: 8 Meilenstein-Kategorien mit Icons und Farben
- [x] All 8 categories defined: erstzulassung, kauf, restauration, unfall, trophaee, lackierung, umbau, sonstiges
- [x] Each category has unique icon (lucide-react) and color (Tailwind)
- [x] CATEGORY_CONFIG provides labels and colors for all categories
- [x] getCategoryLabel returns correct German labels (unit tested)

#### AC-3: Meilenstein CRUD mit Kategorie-Select
- [x] Create dialog has category Select dropdown (all 8 categories)
- [x] Edit preserves existing category
- [x] Delete with confirmation dialog
- [x] Mobile: inline edit/delete buttons (sm:hidden pattern)
- [x] Desktop: hover overlay (hidden sm:flex pattern)

#### AC-4: Multi-Photo Upload (max 10 × 5MB)
- [x] Dropzone accepts multiple images (JPG, PNG, WebP)
- [x] Photo grid preview in form (3-4 columns)
- [x] Individual photo removal with X button
- [x] Existing photos loaded on edit with storage URL
- [x] Counter shows current/max photos
- [x] Disabled when max reached

#### AC-5: Beschreibung bis 2000 Zeichen
- [x] Schema validates max 2000 characters (unit tested)
- [x] Character counter shows 0/2000
- [x] Textarea has increased min-height for longer text

#### AC-6: Kategorie-Filter
- [x] Filter chips for all 8 categories + "Alle"
- [x] Filter resets pagination when changed
- [x] Empty state shows "Keine Meilensteine für den gewählten Filter"

#### AC-7: Zeitraum-Filter (Von/Bis)
- [x] Calendar-based date pickers
- [x] "Zurücksetzen" button clears filters
- [x] Filters work correctly on milestone dates

#### AC-8: PDF-Export (nur Meilensteine)
- [x] API route authenticates user (401 for unauthenticated — E2E tested)
- [x] API route checks vehicle ownership (user_id filter)
- [x] PDF contains only milestones with category labels
- [x] Supports `?category=` filter param (E2E tested)
- [x] Supports `?from=&to=` date range params
- [x] Filename: `{Make}_{Model}_Historie.pdf`

#### AC-9: Leere Timeline
- [x] Empty state: "Dokumentiere die Geschichte deines Fahrzeugs."
- [x] "Ersten Meilenstein hinzufügen" button in empty state

#### AC-10: Foto-Galerie in Timeline
- [x] Milestone cards show horizontal thumbnail gallery
- [x] Images loaded from Supabase storage via public URL

### Edge Cases Status

#### EC-1: Meilensteine am selben Tag → gruppiert
- [x] Grouped under shared date heading

#### EC-2: 100+ Meilensteine → Pagination
- [x] "Mehr laden" button (ITEMS_PER_PAGE = 50)

#### EC-3: PDF-Export mit Kategorie-Filter
- [x] Category param passed to API route

#### EC-4: Foto-Löschung bei Bearbeitung
- [x] Removed photos deleted from storage + DB
- [x] Only deleted photos are affected, remaining photos preserved

### Security Audit Results
- [x] Authentication: PDF API route returns 401 for unauthenticated requests
- [x] Authorization: Vehicle query filters by user_id — RLS as second line of defense
- [x] Input validation: Zod schema validates category (enum), title (max 200), description (max 2000)
- [x] DB validation: CHECK constraints on category + description length
- [x] RLS policies: Full CRUD on vehicle_milestones (EXISTS subquery via vehicle ownership)
- [x] RLS policies: Full CRUD on vehicle_milestone_images (2-level JOIN: image → milestone → vehicle → user)
- [x] Storage: Photo uploads use existing vehicle-images bucket policies
- [x] No secrets exposed in client code

### Bugs Found

No bugs found.

### Automated Tests

#### Unit Tests (Vitest) — 17 new tests
- `src/lib/validations/milestone.test.ts` — 17 tests: schema with categories, boundary checks, getCategoryLabel, CATEGORY_CONFIG coverage

#### E2E Tests (Playwright) — 22 tests (11 × 2 browsers)
- `tests/PROJ-5-fahrzeug-timeline.spec.ts` — Timeline tab, PDF API auth (401), category filter param, responsive viewports, regression checks

### Summary
- **Acceptance Criteria:** 10/10 passed
- **Bugs Found:** 0
- **Security:** Pass — authentication, authorization, input validation, RLS all correct
- **Production Ready:** YES
- **Recommendation:** Deploy

## Deployment
_To be added by /deploy_
