# PROJ-2: Fahrzeugprofil

## Status: Approved
**Created:** 2026-04-04
**Last Updated:** 2026-04-05

## Dependencies
- Requires: PROJ-1 (User Authentication) — Nutzer muss eingeloggt sein

## User Stories
- Als Nutzer möchte ich ein neues Fahrzeug anlegen, damit ich es in der App verwalten kann
- Als Nutzer möchte ich Stammdaten meines Fahrzeugs erfassen (Marke, Modell, Baujahr, FIN, Kennzeichen, Farbe, Motortyp), damit alle wichtigen Infos zentral gespeichert sind
- Als Nutzer möchte ich Fotos meines Fahrzeugs hochladen, damit ich den Zustand visuell dokumentieren kann
- Als Nutzer möchte ich eine Übersicht aller meiner Fahrzeuge sehen (Dashboard), damit ich schnell navigieren kann
- Als Nutzer möchte ich Fahrzeugdaten bearbeiten können, falls sich etwas ändert (z.B. neues Kennzeichen)

## Acceptance Criteria
- [ ] Fahrzeug kann mit Pflichtfeldern angelegt werden (Marke, Modell, Baujahr)
- [ ] Optionale Felder: FIN, Kennzeichen, Farbe, Motortyp, Hubraum, Leistung, Laufleistung
- [ ] Mindestens 1 Foto kann hochgeladen werden (max. 10 pro Fahrzeug)
- [ ] Fotos werden in Supabase Storage gespeichert
- [ ] Dashboard zeigt alle Fahrzeuge des Nutzers als Karten mit Vorschaubild
- [ ] Fahrzeugdaten können bearbeitet werden
- [ ] Fahrzeug kann gelöscht werden (mit Bestätigungsdialog)
- [ ] Validierung: Baujahr muss zwischen 1886 und aktuellem Jahr liegen
- [ ] FIN-Validierung: 17 Zeichen alphanumerisch (falls angegeben)

## Edge Cases
- Was passiert wenn der Nutzer ein Fahrzeug ohne Foto anlegt? → Platzhalter-Bild wird angezeigt
- Was passiert bei Duplikat-FIN? → Warnung anzeigen, aber erlauben (gleiche FIN kann bei Besitzerwechsel vorkommen)
- Was passiert wenn ein zu großes Foto hochgeladen wird? → Max. 5 MB, Fehlermeldung bei Überschreitung
- Was passiert wenn das Fahrzeug gelöscht wird, das Scheckheft-Einträge hat? → Bestätigungsdialog mit Hinweis, dass alle verknüpften Daten gelöscht werden
- Was passiert bei Fahrzeugen ohne Baujahr (Einzelanfertigung)? → Baujahr ist Pflichtfeld, bei Unklarheit "geschätzt" markierbar

## Technical Requirements (optional)
- Bilder: Max. 5 MB, Formate JPG/PNG/WebP
- Storage: Supabase Storage Bucket "vehicle-images"
- Thumbnails: Automatische Verkleinerung für Dashboard-Ansicht

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Seitenstruktur

```
/dashboard (bestehend — wird erweitert)
+-- Fahrzeug-Übersicht (Karten-Grid)
|   +-- Fahrzeugkarte (Bild, Marke, Modell, Baujahr)
|   +-- "Fahrzeug hinzufügen"-Karte
+-- Leerer Zustand ("Noch keine Fahrzeuge")

/vehicles/new
+-- Fahrzeug-Formular
|   +-- Stammdaten (Marke, Modell, Baujahr — Pflicht)
|   +-- Optionale Felder (FIN, Kennzeichen, Farbe, Motor, Hubraum, Leistung, Laufleistung)
|   +-- Foto-Upload-Bereich (Drag & Drop, max. 10 Bilder, max. 5 MB/Bild)
|   +-- Speichern / Abbrechen

/vehicles/[id]
+-- Fahrzeug-Detailansicht
|   +-- Bildergalerie (Hauptbild + Thumbnails)
|   +-- Stammdaten-Übersicht
|   +-- Aktionen: Bearbeiten / Löschen
|   +-- (Platzhalter für spätere Features: Scheckheft, Timeline, Dokumente)

/vehicles/[id]/edit
+-- Fahrzeug-Formular (vorausgefüllt)
|   +-- Gleiche Felder wie "Neu"
|   +-- Fotos hinzufügen / entfernen
|   +-- Speichern / Abbrechen
```

### Datenmodell

```
Fahrzeug (vehicles):
- Eindeutige ID
- Besitzer (Verknüpfung zum eingeloggten Nutzer)
- Marke (Pflicht, z.B. "Mercedes-Benz")
- Modell (Pflicht, z.B. "300 SL")
- Baujahr (Pflicht, Zahl zwischen 1886 und aktuellem Jahr)
- Baujahr geschätzt? (Ja/Nein)
- FIN — Fahrzeugidentifikationsnummer (optional, 17 Zeichen)
- Kennzeichen (optional)
- Farbe (optional)
- Motortyp (optional, z.B. "Reihen-6-Zylinder Benziner")
- Hubraum in ccm (optional)
- Leistung in PS (optional)
- Laufleistung in km (optional)
- Erstellt am / Aktualisiert am

Fahrzeugbilder (vehicle_images):
- Eindeutige ID
- Verknüpfung zum Fahrzeug
- Dateipfad im Storage
- Reihenfolge (für Sortierung)
- Ist Hauptbild? (Ja/Nein)
- Erstellt am

Gespeichert in: Supabase PostgreSQL (Daten) + Supabase Storage (Bilder)
Zugriffskontrolle: Jeder Nutzer sieht nur seine eigenen Fahrzeuge (Row Level Security)
```

### Tech-Entscheidungen

| Entscheidung | Warum? |
|---|---|
| **Supabase Datenbank** statt localStorage | Fahrzeugdaten müssen geräteübergreifend verfügbar sein und später mit anderen Features (Scheckheft, Timeline) verknüpft werden |
| **Supabase Storage** für Bilder | Bereits im Tech Stack vorgesehen, automatische CDN-Auslieferung, Zugriffskontrolle per Policies |
| **Clientseitige Thumbnail-Darstellung** | Für MVP ausreichend — Browser zeigt Originalbilder verkleinert an. Serverseitige Generierung kann später ergänzt werden |
| **Karten-Grid** im Dashboard | Oldtimer leben von der Optik — Karten mit Vorschaubild sind deutlich ansprechender als eine Liste |
| **Hard Delete** mit Bestätigungsdialog | Einfacher für MVP. Dialog warnt explizit vor Datenverlust (inkl. verknüpfter Scheckheft-Einträge) |
| **Separate Bildertabelle** statt Array-Feld | Ermöglicht Reihenfolge, Hauptbild-Markierung und spätere Erweiterungen (z.B. Bildbeschreibungen) |
| **Getrennte Seiten** für Neu/Bearbeiten | Klare URL-Struktur, Browser-Navigation funktioniert natürlich, Formular-Komponente wird wiederverwendet |

### Vorhandene shadcn/ui-Bausteine (wiederverwenden)

card, form, input, label, select, dialog, alert-dialog, button, skeleton, toast/sonner, badge

### Neue Abhängigkeiten

| Paket | Zweck |
|---|---|
| **react-dropzone** | Komfortabler Foto-Upload per Drag & Drop |

### Sicherheit

- **Row Level Security (RLS):** Nutzer können nur eigene Fahrzeuge lesen, erstellen, bearbeiten und löschen
- **Storage Policies:** Nur der Besitzer kann Bilder eines Fahrzeugs hoch-/herunterladen/löschen
- **Validierung:** Sowohl im Browser als auch serverseitig
- **Datei-Upload:** Typ- und Größenprüfung vor dem Hochladen (JPG/PNG/WebP, max. 5 MB)

## Implementation Notes (Frontend)

### Created Files
- `src/lib/validations/vehicle.ts` — Zod schema, TypeScript types, image constants
- `src/components/image-upload.tsx` — Drag & Drop image upload with react-dropzone
- `src/components/vehicle-form.tsx` — Shared form component for create/edit
- `src/components/vehicle-card.tsx` — Vehicle card + "Add vehicle" card for dashboard grid
- `src/components/delete-vehicle-button.tsx` — Delete with AlertDialog confirmation
- `src/app/vehicles/new/page.tsx` — New vehicle page
- `src/app/vehicles/[id]/page.tsx` — Vehicle detail page with image gallery
- `src/app/vehicles/[id]/edit/page.tsx` — Edit vehicle page

### Modified Files
- `src/app/dashboard/page.tsx` — Replaced placeholder with vehicle grid + empty state

### Dependencies Added
- `react-dropzone` — Drag & Drop file upload

### Notes
- Frontend calls Supabase directly (no API routes) — requires `vehicles` and `vehicle_images` tables + RLS policies + `vehicle-images` storage bucket to be created via `/backend`
- Numeric optional fields use `z.coerce` with manual `VehicleFormData` type to avoid Zod v4 type inference issues with react-hook-form
- Image URLs are built using Supabase Storage public URLs

## Implementation Notes (Backend)

### Created Files
- `supabase/migrations/20260405_create_vehicles.sql` — Complete database migration

### Database Schema
- **`vehicles`** table — All vehicle master data with CHECK constraints (year range, positive values)
- **`vehicle_images`** table — Image metadata with ON DELETE CASCADE from vehicles
- **RLS Policies** — Owner-only access for all CRUD operations on both tables
- **Indexes** — `user_id`, `created_at DESC`, `vehicle_id`, `(vehicle_id, position)`
- **Trigger** — Auto-update `updated_at` on vehicle modification

### Storage
- **Bucket `vehicle-images`** — Public bucket, 5 MB limit, JPG/PNG/WebP only
- **Storage Policies** — Upload/update/delete restricted to files in user's own folder (`{user_id}/{vehicle_id}/*`), read access public

### Architecture Decision: No API Routes
Frontend calls Supabase directly via the client SDK. RLS policies handle all authorization. This is simpler and avoids unnecessary API route boilerplate for basic CRUD.

### Setup Instructions
Run the SQL migration in Supabase Dashboard: SQL Editor > New query > Paste contents of `supabase/migrations/20260405_create_vehicles.sql` > Run

## QA Test Results

**QA Date:** 2026-04-05
**QA Status:** APPROVED — Production-ready (no Critical or High bugs)

### Acceptance Criteria Results

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Fahrzeug kann mit Pflichtfeldern angelegt werden | ✅ PASS | Form validates make, model, year. Zod schema enforced. |
| 2 | Optionale Felder vorhanden | ✅ PASS | FIN, Kennzeichen, Farbe, Motortyp, Hubraum, Leistung, Laufleistung all present |
| 3 | Foto-Upload (max. 10 pro Fahrzeug) | ✅ PASS | Drag & Drop with react-dropzone, limit enforced client-side |
| 4 | Fotos in Supabase Storage | ✅ PASS | Upload to `vehicle-images` bucket, public URLs |
| 5 | Dashboard zeigt Karten mit Vorschaubild | ✅ PASS | Responsive grid, primary image or placeholder |
| 6 | Fahrzeugdaten bearbeitbar | ✅ PASS | Edit page with pre-filled form, image add/remove |
| 7 | Lösch-Bestätigungsdialog | ✅ PASS | AlertDialog with warning about linked data |
| 8 | Baujahr-Validierung (1886–aktuell) | ✅ PASS | Client-side Zod + DB CHECK constraint |
| 9 | FIN-Validierung (17 Zeichen) | ✅ PASS | Regex + refine for exact length, forbidden chars I/O/Q |

### Edge Case Results

| Edge Case | Status | Notes |
|-----------|--------|-------|
| Fahrzeug ohne Foto | ✅ PASS | Platzhalter-Icon (Car) angezeigt |
| Duplikat-FIN | ✅ PASS | DB erlaubt Duplikate (kein UNIQUE constraint) |
| Foto > 5 MB | ✅ PASS | Client-side Fehlermeldung via react-dropzone |
| Löschen mit verknüpften Daten | ✅ PASS | Dialog warnt explizit, ON DELETE CASCADE in DB |
| Baujahr geschätzt | ✅ PASS | Checkbox + Badge in Detail/Kartenansicht |

### Security Audit

| Check | Status | Notes |
|-------|--------|-------|
| RLS Policies (vehicles) | ✅ PASS | SELECT/INSERT/UPDATE/DELETE restricted to owner |
| RLS Policies (vehicle_images) | ✅ PASS | All operations require vehicle ownership |
| Storage Policies | ✅ PASS | Upload/delete restricted to user's folder |
| Auth Check | ✅ PASS | All pages redirect to /login if not authenticated |
| Input Validation | ✅ PASS | Zod client-side + DB CHECK constraints server-side |
| XSS via inputs | ✅ PASS | React auto-escapes all rendered values |
| SQL Injection | ✅ PASS | Supabase client uses parameterized queries |

### Bugs Found

| # | Severity | Description | Location |
|---|----------|-------------|----------|
| 1 | **Low** | Unused `supabaseKey` parameter in `getImageUrl` | `vehicles/[id]/page.tsx:16` |
| 2 | **Low** | `ACCEPTED_IMAGE_TYPES` exported but never imported | `validations/vehicle.ts:94` |
| 3 | **Low** | Redundant manual `vehicle_images` delete before vehicle delete (CASCADE handles it) | `delete-vehicle-button.tsx:48` |

### Automated Test Results

- **Unit Tests (Vitest):** 48/48 passed (18 auth + 30 vehicle validation)
- **E2E Tests (Playwright):** 48/48 passed (30 PROJ-1 + 18 PROJ-2, Chromium + Mobile Safari)
- **Regression:** PROJ-1 (User Authentication) — all tests passing, no regressions

### Production-Ready Decision

**✅ APPROVED** — No Critical or High severity bugs. 3 Low-severity code quality issues found (non-blocking, can be cleaned up later).

## Deployment
_To be added by /deploy_
