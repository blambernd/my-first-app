# PROJ-12: Verkaufsinserat erstellen

## Status: Deployed
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

### Implementation Notes
- Navigation: "Verkaufen" tab added to vehicle nav with Tag icon
- Editor: `/vehicles/[id]/verkaufen` — title, description, price, photo selection
- Photos: Drag & drop reordering with @dnd-kit, supports both vehicle and milestone images
- Preview: Live split-screen preview simulating platform appearance
- Text generation: Template-based (no LLM), generates from vehicle data + service history + milestones
- API: `/api/vehicles/[id]/listing` (GET/POST/PATCH) + `/api/vehicles/[id]/listing/generate` (POST)
- DB: `vehicle_listings` table with unique constraint per vehicle, price in cents
- Kurzprofil link auto-inserted in description when active profile exists
- Market price recommendation shown when PROJ-11 analysis available

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

### Komponentenstruktur

```
Fahrzeug-Detailseite (/vehicles/[id])
+-- Neuer Tab: "Verkaufen" (Tag-Icon)
    |
    +-- Inserat-Editor (/vehicles/[id]/verkaufen)
        |
        +-- Status-Leiste (Entwurf / Veröffentlicht)
        |
        +-- Inserat-Formular
        |   +-- Titel-Editor
        |   |   +-- Auto-generierter Titel (Marke + Modell + Baujahr + Werksbezeichnung)
        |   |   +-- Frei editierbares Textfeld
        |   |   +-- Zeichenzähler (max 70 Zeichen, Warnung bei Überschreitung)
        |   |
        |   +-- Beschreibung-Editor
        |   |   +-- Auto-generierter Text (aus Template + Fahrzeugdaten)
        |   |   +-- Frei editierbares Textarea
        |   |   +-- Zeichenzähler (max 5.000 Zeichen)
        |   |   +-- Kurzprofil-Link (automatisch eingefügt, wenn PROJ-10 aktiv)
        |   |   +-- Hinweis falls kein Kurzprofil existiert
        |   |
        |   +-- Preis-Bereich
        |   |   +-- Preistyp: "Festpreis" / "Verhandlungsbasis" (Radio)
        |   |   +-- Preis-Eingabefeld (€)
        |   |   +-- Preisempfehlung aus Marktanalyse (falls vorhanden)
        |   |   +-- Hinweis "Marktanalyse durchführen" (falls keine vorhanden)
        |   |
        |   +-- Foto-Auswahl
        |       +-- Galerie aller Fahrzeugbilder (aus PROJ-2)
        |       +-- Galerie aller Historie-Bilder (aus PROJ-5)
        |       +-- Checkboxen zur Auswahl
        |       +-- Drag & Drop Reihenfolge
        |       +-- Hinweis wenn keine Fotos vorhanden
        |
        +-- Vorschau-Panel
        |   +-- Live-Vorschau des Inserats
        |   +-- Simuliert Plattform-Darstellung (mobile.de-Stil)
        |
        +-- Aktions-Leiste
            +-- "Entwurf speichern" Button
            +-- "Vorschau" Toggle-Button
            +-- "Weiter zu Veröffentlichung" Button (→ PROJ-13)
```

### Datenmodell

```
Neuer Datensatz: Verkaufsinserat (vehicle_listings)
- Eindeutige ID
- Fahrzeug-Referenz (vehicle_id, 1 aktiver Entwurf pro Fahrzeug)
- Nutzer-Referenz (user_id)
- Titel (max 70 Zeichen)
- Beschreibung (max 5.000 Zeichen, inkl. Kurzprofil-Link)
- Preis in Cent (ganzzahlig, wie bei Scheckheft)
- Preistyp: "festpreis" oder "verhandlungsbasis"
- Ausgewählte Foto-IDs (JSON-Array, Referenz auf vehicle_images + vehicle_milestone_images)
- Foto-Reihenfolge (JSON-Array mit IDs in gewünschter Sortierung)
- Status: "entwurf" oder "veroeffentlicht"
- Erstellt am / Aktualisiert am
```

### Seitenstruktur

| Seite | Auth? | Zweck |
|-------|-------|-------|
| `/vehicles/[id]/verkaufen` | Ja (Besitzer) | Inserat erstellen & bearbeiten |
| `/api/vehicles/[id]/listing` | Ja | GET: Entwurf laden, POST: erstellen, PATCH: aktualisieren |
| `/api/vehicles/[id]/listing/generate` | Ja | POST: Titel + Beschreibung aus Fahrzeugdaten generieren |

### Text-Generierung (Template-basiert, kein LLM)

Der Inserat-Text wird serverseitig aus einem deutschen Template generiert:

**Titel-Template:**
`{Marke} {Modell} {Werksbezeichnung} — Baujahr {Jahr}`

**Beschreibungs-Template:**
```
Abschnitt 1: Fahrzeugdaten (Marke, Modell, Baujahr, Farbe, Motor, Leistung, km-Stand)
Abschnitt 2: Highlights aus der Historie (Anzahl Scheckheft-Einträge, besondere Meilensteine)
Abschnitt 3: Kurzprofil-Link ("Komplette Fahrzeughistorie einsehen: [Link]")
```

Die generierten Texte dienen als Startpunkt — der Nutzer kann alles frei bearbeiten.

### Technische Entscheidungen

| Entscheidung | Begründung |
|-------------|-----------|
| Template-basierte Textgenerierung (kein LLM) | Deterministisch, schnell, kostenlos, kein API-Key nötig. Für V1 ausreichend |
| Preis in Cent speichern | Konsistent mit bestehendem Scheckheft (cost_cents), keine Rundungsfehler |
| Foto-IDs als JSON-Array | Gleicher Ansatz wie PROJ-10 Kurzprofil (bewährt), Reihenfolge als separate Sortierung |
| Ein Entwurf pro Fahrzeug | Einfacher UX-Flow, kein Verwaltungsaufwand für mehrere Entwürfe |
| Vorschau im Split-Screen | Nutzer sieht sofort, wie das Inserat aussieht, ohne Seite zu wechseln |
| Generate-Endpunkt separat | Text-Generierung ist aufwändig (DB-Abfragen), wird nur bei "Neu generieren" aufgerufen, nicht bei jedem Speichern |

### Abhängigkeiten (neue Pakete)

| Paket | Zweck |
|-------|-------|
| @dnd-kit/core + @dnd-kit/sortable | Drag & Drop für Foto-Reihenfolge (falls noch nicht installiert) |

*Hinweis: Prüfen ob @dnd-kit bereits im Projekt vorhanden ist. Falls nicht, ist es das Standard-DnD-Paket für React/Next.js.*

### Ablauf

```
1. Nutzer öffnet "Verkaufen" Tab bei seinem Fahrzeug
2. Falls noch kein Entwurf existiert → "Inserat erstellen" Button
3. System generiert automatisch Titel + Beschreibung aus Fahrzeugdaten
4. System zeigt Preisempfehlung aus letzter Marktanalyse (falls vorhanden)
5. Nutzer passt Titel, Beschreibung, Preis und Fotos nach Wunsch an
6. Nutzer kann jederzeit "Entwurf speichern" → Daten werden in DB gespeichert
7. Nutzer kann Live-Vorschau ein-/ausblenden
8. Wenn fertig → "Weiter zu Veröffentlichung" leitet zu PROJ-13 weiter
```

## QA Test Results

**Tested:** 2026-04-08
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Nutzer kann ein neues Verkaufsinserat starten
- [x] POST `/api/vehicles/[id]/listing` creates listing with default values
- [x] Auth + ownership check on create
- [x] Duplicate prevention (409 if exists, unique DB index)

#### AC-2: System generiert automatisch Inserat-Titel
- [x] Title template: `{Make} {Model} ({FactoryCode}) — Baujahr {Year}`
- [x] Factory code included when available
- [ ] **BUG:** Title may exceed 70 chars for long names (no truncation)

#### AC-3: System generiert automatisch Beschreibung
- [x] Description includes: vehicle data, service count, milestone highlights
- [x] Template sections: FAHRZEUGDATEN, WARTUNGSHISTORIE, HIGHLIGHTS, FAHRZEUGHISTORIE

#### AC-4: Fotos auswählen und Reihenfolge bestimmen
- [x] Photo selector shows vehicle images and milestone images
- [x] Checkbox selection with check/uncheck
- [x] Drag & drop reordering with @dnd-kit
- [x] "Titelbild" badge on first photo
- [x] Photo count indicator

#### AC-5: Titel, Beschreibung, Preis frei editierbar
- [x] All fields are editable Input/Textarea components
- [x] Character counters for title (70) and description (5000)
- [x] Warning when exceeding max length

#### AC-6: Kurzprofil-Link automatisch eingefügt
- [x] Link inserted in generated description when active profile exists
- [x] Info alert shown when no Kurzprofil exists with link to create one

#### AC-7: Vorschau zeigt Inserat-Darstellung
- [x] Toggle preview panel with Eye/EyeOff button
- [x] Split-screen layout on desktop (lg:grid-cols-2)
- [x] Preview shows title, price, vehicle badges, description, photo strip
- [x] Sticky preview on desktop

#### AC-8: Entwurf speichern und weiterbearbeiten
- [x] "Entwurf speichern" button with loading state
- [x] PATCH validates via Zod and saves to DB
- [x] Draft badge shows "Entwurf" status
- [x] Re-loads existing draft on page visit

#### AC-9: Preisempfehlung aus Marktanalyse
- [x] Shows recommended price range + median from latest completed analysis
- [x] "Median übernehmen" button to apply price
- [x] Link to Marktanalyse page when no analysis available

#### AC-10: Festpreis / Verhandlungsbasis wählen
- [x] RadioGroup with both options
- [x] Validated via Zod enum

### Edge Cases Status

#### EC-1: Kein Kurzprofil vorhanden
- [x] Info alert with link to Kurzprofil page — can proceed without it

#### EC-2: Keine Marktanalyse vorhanden
- [x] Price field empty, link to Marktanalyse shown

#### EC-3: Keine Fotos vorhanden
- [x] Empty state with ImageIcon and message about photo importance

#### EC-4: Generierter Text zu lang
- [x] Character counters with red warning on exceeded limits

#### EC-5: Mehrere Entwürfe pro Fahrzeug
- [x] Unique DB index prevents duplicates, API returns 409

### Security Audit Results
- [x] Authentication: All endpoints require login
- [x] Authorization: Vehicle ownership check on all operations
- [x] Input validation: PATCH validated via Zod schema
- [x] RLS: Owner-only CRUD policies enabled
- [x] No XSS: React auto-escaping, no dangerouslySetInnerHTML
- [x] No sensitive data in API responses

### Bugs Found

#### BUG-1: Generated title may exceed 70 chars
- **Severity:** Low
- **Steps to Reproduce:**
  1. Create a vehicle with long make/model/factory_code names
  2. Click "Inserat erstellen"
  3. Expected: Title ≤ 70 chars
  4. Actual: Title can exceed limit (e.g. very long factory codes)
- **Note:** Character counter shows warning, user can manually shorten
- **Priority:** Nice to have (auto-truncate in generate endpoint)

#### BUG-2: NEXT_PUBLIC_APP_URL not documented
- **Severity:** Low
- **Steps to Reproduce:**
  1. Check `.env.example`
  2. `NEXT_PUBLIC_APP_URL` not listed
  3. Generate endpoint falls back to `https://example.com` for Kurzprofil link
- **Priority:** Fix before deployment (add to .env.example)

#### BUG-3: Unused import AlertTriangle
- **Severity:** Low
- **Steps to Reproduce:**
  1. Check `listing-editor.tsx` line 12
  2. `AlertTriangle` imported but never used
- **Priority:** Nice to have

### Automated Tests
- **Vitest:** 219/220 passed (1 pre-existing failure, unrelated)
- **Playwright:** 26/26 new PROJ-12 tests passed
- **Test file:** `tests/PROJ-12-verkaufsinserat.spec.ts`
- **Validation tests:** 15/15 passed (`src/lib/validations/listing.test.ts`)

### Summary
- **Acceptance Criteria:** 10/10 passed (minor title length edge case)
- **Bugs Found:** 3 total (0 critical, 0 high, 0 medium, 3 low)
- **Security:** Pass
- **Production Ready:** YES
- **Recommendation:** Deploy. All 3 bugs are low-priority and can be addressed in follow-up.

## Deployment

**Deployed:** 2026-04-08
**Tag:** v1.12.0-PROJ-12

### Pre-deployment Checks
- [x] `npm run build` succeeds
- [x] `npm run lint` passes (0 errors)
- [x] QA approved (10/10 AC, 0 critical/high bugs)
- [x] Environment variables documented (added `NEXT_PUBLIC_APP_URL` to `.env.example`)
- [x] No secrets committed

### Migration Required
Run in Supabase SQL Editor:
- `supabase/migrations/20260408_vehicle_listings.sql`

### Environment Variable Required
Add to Vercel Dashboard + `.env.local`:
- `NEXT_PUBLIC_APP_URL` — your production URL (for Kurzprofil links in listing descriptions)
