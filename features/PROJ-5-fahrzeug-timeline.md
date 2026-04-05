# PROJ-5: Fahrzeug-Timeline

## Status: Deployed
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

## Tech Design (Solution Architect)

### Seitenstruktur

```
/vehicles/[id] (bestehend — "Timeline" Tab wird aktiviert)
+-- Tabs
|   +-- "Scheckheft" Tab (PROJ-3, besteht)
|   +-- "Timeline" Tab (NEU — wird aktiviert)
|   |   +-- Zeitraum-Filter (von/bis Datum)
|   |   +-- Typ-Filter (Chips: Alle, Scheckheft, Dokumente, Meilensteine)
|   |   +-- PDF-Export-Button
|   |   +-- Timeline-Leiste (vertikale Linie mit Punkten)
|   |   |   +-- Tages-Gruppe (Datum als Überschrift)
|   |   |   |   +-- Timeline-Eintrag
|   |   |   |   |   +-- Icon + Farbe (je nach Quelle)
|   |   |   |   |   +-- Titel + Beschreibung
|   |   |   |   |   +-- Metadaten (km, Kosten, Kategorie)
|   |   |   |   |   +-- Link zum Originaleintrag (Scheckheft/Dokument)
|   |   +-- "Mehr laden"-Button (bei 100+ Einträgen)
|   |   +-- Leerer Zustand ("Füge deinen ersten Eintrag hinzu")
|   +-- "Dokumente" Tab (PROJ-4, besteht)

Dialog (Neuer Meilenstein):
+-- Datum (Pflicht, Calendar-Picker)
+-- Titel (Pflicht, max. 200 Zeichen)
+-- Beschreibung (Optional, max. 1000 Zeichen)
+-- Foto (Optional, Bild-Upload)
+-- Speichern / Abbrechen
```

### Datenquellen

Die Timeline aggregiert Einträge aus **drei Quellen**:

```
1. Scheckheft-Einträge (PROJ-3, bestehend)
   → Quelle: service_entries Tabelle
   → Icon: Schraubenschlüssel, farbig nach Typ
   → Zeigt: Datum, Typ-Badge, Beschreibung, km, Kosten

2. Dokumente (PROJ-4, bestehend)
   → Quelle: vehicle_documents Tabelle
   → Icon: Dokument/Bild-Icon
   → Zeigt: Datum, Kategorie-Badge, Titel, Dateigröße

3. Manuelle Meilensteine (NEU)
   → Quelle: Neue Tabelle vehicle_milestones
   → Icon: Stern/Flagge
   → Zeigt: Datum, Titel, Beschreibung, optionales Foto
```

### Datenmodell (nur neuer Teil)

```
Meilenstein (vehicle_milestones):
- Eindeutige ID
- Verknüpfung zum Fahrzeug
- Datum
- Titel (Pflicht, max. 200 Zeichen)
- Beschreibung (optional, max. 1000 Zeichen)
- Foto-Pfad im Storage (optional)
- Erstellt am / Aktualisiert am

Gespeichert in: Supabase PostgreSQL
Foto-Storage: Bestehender Bucket "vehicle-images" (Unterordner milestones/)
Zugriffskontrolle: RLS über Fahrzeug-Ownership (wie PROJ-3/4)
```

### PDF-Export

```
API Route: /api/vehicles/[id]/timeline-pdf
- Server-side PDF-Generierung
- Enthält: Fahrzeugdaten (Marke, Modell, Baujahr) + alle Timeline-Einträge
- Zeitraum-Filter wird als Parameter mitgegeben
- Ergebnis: PDF-Download mit Dateiname "{Marke}_{Modell}_Timeline.pdf"
```

### Tech-Entscheidungen

| Entscheidung | Warum? |
|---|---|
| **Bestehender "Timeline" Tab** | Kein Kontextwechsel, alles zum Fahrzeug an einem Ort |
| **Client-side Aggregation** | Alle drei Quellen werden server-side gefetcht, im Client zusammengeführt und sortiert |
| **Tages-Gruppierung** | Mehrere Einträge am selben Tag werden unter einer Datumsüberschrift zusammengefasst |
| **Pagination (50 pro Seite)** | Performance bei 200+ Einträgen — "Mehr laden" statt unendliches Scrollen |
| **Server-side PDF** via API Route | Zuverlässiger als Browser-PDF, funktioniert auf allen Geräten |
| **@react-pdf/renderer** für PDF | React-basiert, gut für strukturierte Dokumente, serverseitig nutzbar |
| **Bestehender Storage Bucket** | Meilenstein-Fotos in "vehicle-images" Bucket, Unterordner milestones/ |
| **Separate Meilensteine-Tabelle** | Saubere Trennung von Scheckheft und Dokumenten, eigene Felder |

### Vorhandene shadcn/ui-Bausteine (wiederverwenden)

tabs, card, badge, button, calendar, popover, dialog, form, input, textarea, separator, alert-dialog

### Neue Abhängigkeiten

| Paket | Zweck |
|---|---|
| **@react-pdf/renderer** | Server-side PDF-Generierung in der API Route |

### Sicherheit

- **RLS Policy:** Meilensteine nur über Fahrzeug-Ownership erreichbar
- **PDF API Route:** Authentifizierung prüfen, nur eigene Fahrzeuge
- **Foto-Upload:** Bestehende Storage-Policies greifen (Ordner-basiert)
- **Validierung:** Client-side (Zod) + Database CHECK constraints

## Implementation Notes (Frontend)

### Created Files
- `src/lib/validations/milestone.ts` — Zod schema, types for vehicle milestones
- `src/lib/validations/timeline.ts` — Timeline aggregation logic: converts service entries, documents, milestones into unified TimelineEntry type, sorts, groups by date
- `src/components/milestone-form.tsx` — Dialog-based form for create/edit milestones with optional photo upload
- `src/components/vehicle-timeline.tsx` — Full timeline: summary cards, type filter chips, date range filter, vertical timeline with day grouping, milestone CRUD, PDF export button, "Mehr laden" pagination (50 per page)

### Modified Files
- `src/app/vehicles/[id]/page.tsx` — Activated "Timeline" tab, added milestones fetch, integrated VehicleTimeline component

### Notes
- Timeline aggregates 3 data sources: service_entries (PROJ-3), vehicle_documents (PROJ-4), vehicle_milestones (new)
- Each source type has its own icon and color in the timeline
- Milestone photos stored in existing "vehicle-images" bucket under milestones/ subfolder
- PDF export calls `/api/vehicles/[id]/timeline-pdf` API route (to be built in /backend)
- Requires `vehicle_milestones` table + RLS policies via `/backend`
- Requires `/api/vehicles/[id]/timeline-pdf` API route via `/backend`

## Implementation Notes (Backend)

### Database Migration
- `supabase/migrations/20260405_create_vehicle_milestones.sql` — vehicle_milestones table with RLS policies (SELECT, INSERT, UPDATE, DELETE via vehicle ownership), indexes on vehicle_id and (vehicle_id, milestone_date DESC), updated_at trigger

### Created Files
- `src/app/api/vehicles/[id]/timeline-pdf/route.tsx` — Server-side PDF export API route using @react-pdf/renderer

### API Route: GET /api/vehicles/[id]/timeline-pdf
- Authenticates user via Supabase session
- Fetches vehicle data (authorization via user_id check)
- Fetches all 3 data sources: service_entries, vehicle_documents, vehicle_milestones (limit 500 each)
- Supports optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` date range filters
- Generates PDF with German formatting (date, currency, labels)
- Returns PDF as attachment download: `{Make}_{Model}_Timeline.pdf`

### Dependencies Added
- `@react-pdf/renderer` — Server-side PDF generation

### Notes
- Milestone CRUD handled directly via Supabase client in frontend (RLS secures access)
- No separate API routes needed for milestones — same pattern as PROJ-3/PROJ-4
- User must run `20260405_create_vehicle_milestones.sql` in Supabase SQL Editor before using this feature

## QA Test Results

**Tested:** 2026-04-05
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Timeline zeigt alle Ereignisse chronologisch (neueste oben)
- [x] Timeline aggregates all 3 sources and sorts by date descending
- [x] Secondary sort by createdAt when dates match (unit tested)

#### AC-2: Ereignisquellen: Scheckheft-Einträge, Dokumente, manuelle Meilensteine
- [x] Service entries converted correctly with all fields
- [x] Documents converted correctly with category, file info
- [x] Milestones converted correctly with photo path

#### AC-3: Jeder Ereignistyp hat ein eigenes Icon und Farbkodierung
- [x] Service: blue wrench icon
- [x] Document: violet file icon
- [x] Milestone: amber flag icon

#### AC-4: Manuelle Meilensteine CRUD (Datum, Titel, Beschreibung, Foto)
- [x] Create milestone with calendar picker, title, description, optional photo
- [x] Edit milestone via hover action
- [x] Delete milestone with confirmation dialog
- [x] Photo upload with 5MB limit, JPG/PNG/WebP validation
- [ ] BUG: Edit/delete actions only visible on hover — not accessible on mobile/touch (BUG-1)

#### AC-5: Timeline kann nach Zeitraum gefiltert werden (von-bis Datum)
- [x] Calendar-based date range filter (Von/Bis)
- [x] "Zurücksetzen" button clears filters
- [x] Date filtering works correctly in aggregation logic

#### AC-6: Timeline kann nach Ereignistyp gefiltert werden
- [x] Filter chips: Alle, Scheckheft, Dokumente, Meilensteine
- [x] Filter resets pagination when changed

#### AC-7: PDF-Export der Timeline
- [x] API route authenticates user (401 for unauthenticated — E2E tested)
- [x] API route checks vehicle ownership (user_id filter)
- [x] PDF includes vehicle data, all timeline entries grouped by date
- [x] Date range filters passed as query params
- [x] Download triggered via blob URL in browser

#### AC-8: Leere Timeline zeigt hilfreichen Hinweis
- [x] Empty state: "Noch keine Einträge. Füge deinen ersten Eintrag hinzu."
- [x] Filtered empty state: "Keine Einträge für den gewählten Filter."

### Edge Cases Status

#### EC-1: Einträge am selben Tag → gruppiert
- [x] Handled correctly — grouped under shared date heading

#### EC-2: Gelöschter Eintrag aus PROJ-3/PROJ-4 → verschwindet aus Timeline
- [x] Timeline reads live data from props/state — deletion reflected on refresh

#### EC-3: 100+ Einträge → Pagination
- [x] "Mehr laden" button with ITEMS_PER_PAGE = 50

#### EC-4: PDF-Export bei vielen Einträgen → Zeitraum-Filter anwendbar
- [x] Date range params passed to PDF API route

#### EC-5: Meilenstein bearbeiten → sofort sichtbar
- [x] router.refresh() called after edit — SSR re-fetches data

#### EC-6: Existing milestone photo preview during edit
- [ ] BUG: Existing photo not shown in edit dialog — only new uploads previewed (BUG-2)

### Security Audit Results
- [x] Authentication: PDF API route returns 401 for unauthenticated requests
- [x] Authorization: Vehicle query filters by user_id — RLS as second line of defense
- [x] Input validation: Milestone schema validates with Zod (title max 200, description max 1000)
- [x] RLS policies: Full CRUD coverage on vehicle_milestones (EXISTS subquery pattern)
- [x] Storage: Photo uploads use existing vehicle-images bucket policies
- [x] No secrets exposed in client code

### Bugs Found

#### BUG-1: Milestone edit/delete not accessible on mobile (touch devices)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Open vehicle timeline on a mobile device (375px)
  2. View a milestone entry in the timeline
  3. Expected: Edit/delete buttons visible or accessible via tap
  4. Actual: Buttons only appear on hover (`opacity-0 group-hover:opacity-100`) — not accessible on touch
- **Priority:** Fix before deployment
- **Note:** Same pattern was fixed in PROJ-4 (document-archive.tsx) — apply identical fix: add inline `sm:hidden` buttons + `hidden sm:flex` on hover overlay

#### BUG-2: Existing milestone photo not shown in edit dialog
- **Severity:** Low
- **Steps to Reproduce:**
  1. Create a milestone with a photo
  2. Click edit on that milestone
  3. Expected: Existing photo shown as preview in the dialog
  4. Actual: Photo dropzone shown instead (existing photo_path not converted to viewable URL)
- **Priority:** Fix in next sprint
- **Note:** `photoPreview` is null on edit open; the condition `isEditing && milestone?.photo_path` triggers the preview block but `photoPreview ?? ""` produces empty src. Need to resolve storage URL from `photo_path`.

### Automated Tests

#### Unit Tests (Vitest) — 20 new tests
- `src/lib/validations/milestone.test.ts` — 9 tests: schema validation, boundary checks
- `src/lib/validations/timeline.test.ts` — 11 tests: conversion, aggregation, sorting, grouping

#### E2E Tests (Playwright) — 22 tests (11 × 2 browsers)
- `tests/PROJ-5-fahrzeug-timeline.spec.ts` — Timeline tab rendering, PDF API auth (401), responsive viewports, regression checks

### Summary
- **Acceptance Criteria:** 7/8 passed (1 with medium bug)
- **Bugs Found:** 2 total (0 critical, 0 high, 1 medium, 1 low)
- **Security:** Pass — authentication, authorization, input validation all correct
- **Production Ready:** YES (with note to fix BUG-1 before deployment)
- **Recommendation:** Fix BUG-1 (mobile milestone actions) before deploying. BUG-2 is low priority and can be fixed later.

## Deployment

**Deployed:** 2026-04-05
**Production URL:** https://my-first-app-sigma-rosy.vercel.app
**Git Tag:** v1.4.0-PROJ-5
**Commit:** a5c3912

### Pre-Deployment
- [x] Build succeeds locally
- [x] Lint passes (0 errors)
- [x] QA approved (BUG-1 fixed, BUG-2 deferred as low priority)
- [x] All tests pass (135 Vitest + 106 Playwright)

### Database Migration Required
Run `supabase/migrations/20260405_create_vehicle_milestones.sql` in Supabase SQL Editor before using the timeline feature.

### New Dependency
- `@react-pdf/renderer` — server-side PDF generation for timeline export
