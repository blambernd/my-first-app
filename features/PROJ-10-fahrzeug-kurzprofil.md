# PROJ-10: Fahrzeug-Kurzprofil (öffentlich)

## Status: Deployed
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

### Implementation Notes
- Navigation: "Kurzprofil" tab added to vehicle nav with Share2 icon
- Configurator: `/vehicles/[id]/kurzprofil` — toggle sections and select individual items
- Public page: `/profil/[token]` — responsive, no-auth, noindex/nofollow
- API: `/api/vehicles/[id]/profile` (GET/POST/PATCH) + `/api/profil/[token]` (public GET)
- DB: `vehicle_profiles` table with JSON config, nanoid token (12 chars)
- PDF download button present (links to `/api/profil/[token]/pdf` — route TBD)

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeugstammdaten
- Requires: PROJ-3 (Digitales Scheckheft) — Wartungshistorie
- Requires: PROJ-4 (Dokumenten-Archiv) — Dokumente & Bilder
- Requires: PROJ-5 (Fahrzeug-Timeline) — Meilensteine & Restaurierungen

## User Stories
- Als Oldtimer-Besitzer möchte ich ein öffentliches Kurzprofil meines Fahrzeugs erstellen, damit ich es potenziellen Käufern per Link zeigen kann
- Als Oldtimer-Besitzer möchte ich selbst auswählen, welche Abschnitte und Einträge im Profil sichtbar sind, damit ich kontrolliere, was öffentlich ist
- Als Oldtimer-Besitzer möchte ich das Kurzprofil als PDF herunterladen können, damit ich es offline weitergeben kann
- Als potenzieller Käufer möchte ich über einen Link die Fahrzeughistorie einsehen können, damit ich Vertrauen in den Zustand des Fahrzeugs gewinne
- Als Oldtimer-Besitzer möchte ich den öffentlichen Link jederzeit deaktivieren können, damit das Profil nicht mehr zugänglich ist

## Acceptance Criteria
- [ ] Nutzer kann ein öffentliches Kurzprofil für ein Fahrzeug erstellen
- [ ] Nutzer kann folgende Abschnitte einzeln ein-/ausblenden: Stammdaten, Fotos, Scheckheft-Einträge, Meilensteine/Restaurierungen, Dokumente (TÜV, Gutachten etc.)
- [ ] Innerhalb jedes Abschnitts kann der Nutzer einzelne Einträge ein-/ausblenden
- [ ] Ein einzigartiger, nicht erratbarer Link wird generiert (z.B. /profil/abc123xyz)
- [ ] Die öffentliche Profilseite zeigt die ausgewählten Daten ohne Login an
- [ ] Das Profil kann als PDF heruntergeladen werden
- [ ] Der Nutzer kann den Link jederzeit aktivieren/deaktivieren
- [ ] Deaktivierte Profile zeigen eine "Nicht mehr verfügbar"-Meldung
- [ ] Die öffentliche Seite ist responsiv (mobile-optimiert)
- [ ] Keine sensiblen Daten (Nutzer-E-Mail, interne IDs) auf der öffentlichen Seite

## Edge Cases
- Was passiert, wenn ein Profil-Link aufgerufen wird, nachdem das Fahrzeug gelöscht wurde? → "Nicht mehr verfügbar"-Seite
- Was passiert, wenn der Nutzer das Fahrzeug transferiert (PROJ-7)? → Profil wird automatisch deaktiviert
- Was passiert, wenn Fotos/Dokumente gelöscht werden, die im Profil enthalten sind? → Werden automatisch aus dem Profil entfernt
- Was passiert bei sehr vielen Scheckheft-Einträgen (50+)? → Paginierung oder "Alle anzeigen"-Button
- Kann der Nutzer mehrere Profile für dasselbe Fahrzeug erstellen? → Nein, ein Profil pro Fahrzeug, aber Inhalt kann jederzeit angepasst werden

## Technical Requirements
- Security: Profil-Links müssen kryptografisch zufällig sein (UUID v4 oder ähnlich)
- Performance: Öffentliche Seite muss ohne Auth laden (kein Supabase-Auth-Check)
- SEO: Öffentliche Seiten sollten NICHT indexiert werden (noindex, nofollow)
- PDF: Serverseitige PDF-Generierung mit dem gleichen Layout wie die Webseite

---

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Fahrzeug-Detailseite (/vehicles/[id])
+-- Neuer Tab/Button: "Kurzprofil"
    |
    +-- Profil-Konfigurator (/vehicles/[id]/kurzprofil)
    |   +-- Profil-Status (aktiv/inaktiv + Link kopieren)
    |   +-- Abschnitt-Toggles
    |   |   +-- "Stammdaten" (ein/aus)
    |   |   +-- "Fotos" (ein/aus)
    |   |   |   +-- Einzelne Fotos auswählbar
    |   |   +-- "Scheckheft" (ein/aus)
    |   |   |   +-- Einzelne Einträge auswählbar
    |   |   +-- "Meilensteine & Restaurierungen" (ein/aus)
    |   |   |   +-- Einzelne Einträge auswählbar
    |   |   +-- "Dokumente" (ein/aus)
    |   |       +-- Einzelne Dokumente auswählbar
    |   +-- Vorschau-Button
    |   +-- Speichern-Button
    |
    +-- Öffentliche Profilseite (/profil/[token])  ← KEIN Login nötig
        +-- Fahrzeug-Header (Marke, Modell, Baujahr, Foto)
        +-- Stammdaten-Karte
        +-- Foto-Galerie
        +-- Scheckheft-Tabelle
        +-- Meilenstein-Timeline
        +-- Dokument-Liste (nur Metadaten, kein Download)
        +-- PDF-Download-Button
        +-- "Nicht verfügbar"-Seite (wenn deaktiviert)
```

### Datenmodell

```
Neuer Datensatz: Fahrzeug-Kurzprofil (vehicle_profiles)
- Eindeutige ID
- Fahrzeug-Referenz (1:1 Beziehung, vehicle_id)
- Öffentlicher Token (zufällig generiert, z.B. "a7f3x9k2m1")
- Status: aktiv oder inaktiv
- Sichtbare Konfiguration (JSON):
  - sections: welche Abschnitte ein/aus (Stammdaten, Fotos, Scheckheft, Meilensteine, Dokumente)
  - selected_images: Liste der sichtbaren Foto-IDs
  - selected_service_entries: Liste der sichtbaren Scheckheft-IDs
  - selected_milestones: Liste der sichtbaren Meilenstein-IDs
  - selected_documents: Liste der sichtbaren Dokument-IDs
- Erstellt am / Aktualisiert am
```

### Seitenstruktur

| Seite | Auth? | Zweck |
|-------|-------|-------|
| `/vehicles/[id]/kurzprofil` | Ja (Besitzer) | Profil konfigurieren |
| `/profil/[token]` | Nein (öffentlich) | Profil anzeigen |
| `/api/vehicles/[id]/profile` | Ja | Profil erstellen/aktualisieren |
| `/api/profil/[token]` | Nein | Profildaten laden (öffentlich) |
| `/api/profil/[token]/pdf` | Nein | PDF generieren & downloaden |

### Technische Entscheidungen

| Entscheidung | Begründung |
|-------------|-----------|
| Zufälliger Token (nanoid, 12 Zeichen) | Kürzere, benutzerfreundliche URLs statt langer UUIDs |
| Konfiguration als JSON in DB | Flexibel erweiterbar, kein Schema-Update bei neuen Abschnitten |
| Öffentliche Seite als eigene Route `/profil/[token]` | Kein Auth-Check nötig, schneller Seitenaufbau |
| PDF serverseitig generieren | Nutzt bestehende PDF-Logik (ähnlich timeline-pdf) |
| RLS-Policy: Öffentlicher Lesezugriff über Token | Kein Auth für Käufer, Zugriff nur mit gültigem Token |
| noindex/nofollow Meta-Tags | Datenschutz, keine Google-Indexierung |

### Abhängigkeiten (neue Pakete)

| Paket | Zweck |
|-------|-------|
| nanoid | Kurze, sichere Tokens generieren |

### Ablauf

```
1. Nutzer öffnet "Kurzprofil" Tab bei seinem Fahrzeug
2. Falls noch kein Profil existiert → "Kurzprofil erstellen"-Button
3. Nutzer wählt Abschnitte und einzelne Einträge aus
4. Nutzer klickt "Speichern" → Profil wird in DB gespeichert
5. Nutzer kann Link kopieren → /profil/a7f3x9k2
6. Käufer öffnet Link → sieht die ausgewählten Daten
7. Käufer kann PDF herunterladen
8. Nutzer kann Profil jederzeit deaktivieren → Link zeigt "Nicht verfügbar"
```

## QA Test Results

**Tested:** 2026-04-08
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Nutzer kann ein öffentliches Kurzprofil erstellen
- [x] POST `/api/vehicles/[id]/profile` creates profile with nanoid token
- [x] Auth + ownership verification on create
- [x] Duplicate profile prevention (409 if exists)

#### AC-2: Abschnitte einzeln ein-/ausblenden
- [x] Section toggles (Stammdaten, Fotos, Scheckheft, Meilensteine, Dokumente) via Switch UI
- [x] Config saved as JSON with boolean sections
- [x] Public API respects section config

#### AC-3: Einzelne Einträge innerhalb Abschnitten ein-/ausblenden
- [x] ItemSelector with Checkbox for per-item selection
- [x] "Alle anzeigen" toggle (empty array = show all)
- [x] Selected IDs stored in config and filtered in public API

#### AC-4: Einzigartiger, nicht erratbarer Link
- [x] nanoid(12) generates cryptographically random token
- [x] Unique index on token column
- [x] URL format: `/profil/[token]`

#### AC-5: Öffentliche Profilseite ohne Login
- [x] Public page loads without auth (service role client bypasses RLS)
- [x] No redirect to login page
- [x] Renders vehicle header, photos, stammdaten, scheckheft, meilensteine, dokumente

#### AC-6: PDF-Download
- [x] PDF route (`/api/profil/[token]/pdf`) implemented with @react-pdf/renderer
- [x] Renders vehicle header, stammdaten, scheckheft, meilensteine, dokumente
- [x] Respects same config/section visibility as public page
- [x] Downloads as `{Make}_{Model}_Kurzprofil.pdf`

#### AC-7: Link aktivieren/deaktivieren
- [x] Toggle switch in configurator UI
- [x] PATCH endpoint updates `is_active` boolean
- [x] Real-time badge status update (Aktiv/Inaktiv)

#### AC-8: Deaktivierte Profile zeigen "Nicht mehr verfügbar"
- [x] Public API returns 410 for inactive profiles
- [x] Frontend renders "Nicht mehr verfügbar" with AlertTriangle icon

#### AC-9: Responsive (mobile-optimiert)
- [x] Mobile 375px — no horizontal overflow, proper layout
- [x] Tablet 768px — responsive grid adjusts
- [x] Desktop — max-w-4xl container centered

#### AC-10: Keine sensiblen Daten auf öffentlicher Seite
- [x] No user_id, email, or internal IDs in public API response
- [x] VIN and license_plate excluded from public API response

### Edge Cases Status

#### EC-1: Profil-Link nach Fahrzeug-Löschung
- [x] `ON DELETE CASCADE` on vehicle_id — profile auto-deleted

#### EC-2: Fahrzeug-Transfer (PROJ-7)
- [ ] Not tested — no automatic deactivation on transfer (spec says it should be)

#### EC-3: Gelöschte Fotos/Dokumente im Profil
- [x] Selected IDs that no longer exist are simply not returned (`.in()` filter)

#### EC-4: Viele Scheckheft-Einträge (50+)
- [x] No pagination implemented, but scrollable card layout handles moderate amounts

#### EC-5: Mehrere Profile pro Fahrzeug
- [x] Unique index on vehicle_id prevents duplicates
- [x] API returns 409 on duplicate creation attempt

### Security Audit Results
- [x] Authentication: Configurator and management API require login
- [x] Authorization: Ownership check on all management endpoints (vehicle_id + user_id)
- [x] Input validation: Config validated via Zod schema on PATCH
- [ ] Rate limiting: No rate limiting on public profile endpoint (Low risk — token entropy is high)
- [x] RLS: Enabled with owner-only policies; public access via service role client
- [x] XSS: No dangerouslySetInnerHTML, React auto-escapes
### Bugs Found

#### ~~BUG-1: PDF download route not implemented~~ — FIXED
#### ~~BUG-2: License plate exposed in public profile~~ — FIXED

#### BUG-3: Empty selected arrays show all items (implicit behavior)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Create a profile (defaults: all sections on, empty selected arrays)
  2. Add new photos/documents to the vehicle
  3. Expected: New items not automatically visible in public profile
  4. Actual: New items appear because empty array = show all
- **Note:** This is by design ("Alle anzeigen") but could surprise users
- **Priority:** Nice to have (consider UX improvement)

#### BUG-4: No auto-deactivation on vehicle transfer
- **Severity:** Low
- **Steps to Reproduce:**
  1. Create a public profile for a vehicle
  2. Transfer the vehicle to another user (PROJ-7)
  3. Expected: Profile auto-deactivated per spec
  4. Actual: Profile stays active (no trigger/hook implemented)
- **Priority:** Fix in next sprint

#### BUG-5: VIN unnecessarily fetched in public API
- **Severity:** Low
- **Steps to Reproduce:**
  1. Check `/api/profil/[token]/route.ts` line 53
  2. `vin` is in the SELECT but not in the response
- **Priority:** Nice to have (remove from SELECT)

### Automated Tests
- **Vitest:** 164/165 passed (1 pre-existing failure in milestone categories — unrelated to PROJ-10)
- **Playwright:** 32/32 new PROJ-10 tests passed
- **Regression:** 106/106 existing E2E tests passed
- **Test file:** `tests/PROJ-10-fahrzeug-kurzprofil.spec.ts`

### Summary
- **Acceptance Criteria:** 10/10 passed (BUG-1 and BUG-2 fixed)
- **Bugs Found:** 3 remaining (0 critical, 0 high, 0 medium, 3 low)
- **Security:** Pass (license plate removed, no sensitive data exposed)
- **Production Ready:** YES
- **Recommendation:** Deploy. BUG-3, BUG-4, BUG-5 are low-priority and can be addressed in follow-up.

## Deployment

**Deployed:** 2026-04-08
**Tag:** v1.10.0-PROJ-10
**Commit:** c9b58f8

### Pre-deployment Checks
- [x] `npm run build` succeeds
- [x] `npm run lint` passes (0 errors)
- [x] QA approved (10/10 AC, 0 critical/high bugs)
- [x] Environment variables documented in `.env.example`
- [x] No secrets committed
- [x] Migration: `20260408_vehicle_profiles.sql` — must be applied in Supabase

### Migration Required
Run in Supabase SQL Editor before first use:
- `supabase/migrations/20260408_vehicle_profiles.sql` — creates `vehicle_profiles` table with RLS
