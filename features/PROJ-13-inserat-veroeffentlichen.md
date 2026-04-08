# PROJ-13: Inserat veröffentlichen

## Status: In Review
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- Requires: PROJ-12 (Verkaufsinserat erstellen) — fertig editiertes Inserat als Basis

## User Stories
- Als Oldtimer-Besitzer möchte ich mein Inserat direkt auf mobile.de veröffentlichen können, damit ich nicht manuell kopieren muss
- Als Oldtimer-Besitzer möchte ich mein Inserat direkt auf eBay veröffentlichen können, damit ich mehr potenzielle Käufer erreiche
- Als Oldtimer-Besitzer möchte ich auf mehreren Plattformen gleichzeitig veröffentlichen können, damit ich maximale Reichweite erziele
- Als Oldtimer-Besitzer möchte ich den Status meiner Inserate sehen (aktiv/verkauft/abgelaufen), damit ich den Überblick behalte
- Als Oldtimer-Besitzer möchte ich ein Inserat als "verkauft" markieren können, damit es auf allen Plattformen deaktiviert wird

## Acceptance Criteria (V1: Manuell kopieren)
- [ ] Nutzer sieht Plattform-Karten (mobile.de, eBay, Kleinanzeigen, Classic Trader) im Veröffentlichungs-Bereich
- [ ] "Text kopieren" kopiert Titel + Beschreibung in die Zwischenablage
- [ ] "Fotos herunterladen" lädt alle ausgewählten Fotos als ZIP herunter
- [ ] "Zu [Plattform]" öffnet die Inserat-Erstellen-Seite der jeweiligen Plattform
- [ ] Nutzer kann den Live-Inserat-Link pro Plattform eingeben und speichern
- [ ] Nach Link-Eingabe wird Status der Plattform auf "Aktiv" gesetzt
- [ ] Nutzer kann ein Inserat als "Verkauft" markieren → alle Plattformen auf "Verkauft"
- [ ] Status-Badges pro Plattform: Nicht veröffentlicht, Aktiv, Verkauft
- [ ] Plattform-spezifische Tipps werden angezeigt (Bildlimits, Textlänge etc.)
- [ ] Veröffentlichungs-Bereich wird nur angezeigt, wenn Inserat gespeichert ist

## Edge Cases
- Was passiert, wenn der Nutzer keinen Account bei der Zielplattform hat? → Hinweis mit Anleitung zur Account-Erstellung + Link
- Was passiert, wenn die Plattform-API nicht erreichbar ist? → Retry-Mechanismus + Fehleranzeige + Möglichkeit, manuell zu kopieren
- Was passiert, wenn Fotos zu groß für die Plattform sind? → Automatische Komprimierung auf Plattform-Limits
- Was passiert, wenn das Inserat gegen Plattform-Richtlinien verstößt? → Fehlermeldung der Plattform anzeigen + Hinweis auf problematische Stelle
- Was passiert bei Ablauf des Inserats auf einer Plattform? → Status wird auf "Abgelaufen" gesetzt + Option zur Verlängerung
- Wie wird die Authentifizierung bei Plattformen gelöst? → OAuth-Anbindung, Tokens sicher in Supabase gespeichert

## Technical Requirements
- API-Integration: mobile.de Händler-API + eBay Trading/Inventory API
- Authentifizierung: OAuth2 für Plattform-Anbindung, Tokens verschlüsselt in DB
- Bilder: Automatische Komprimierung auf Plattform-Limits (mobile.de: max 30 Bilder, eBay: max 24)
- Fehlerbehandlung: Retry mit exponentiellem Backoff bei API-Fehlern
- Webhook/Polling: Regelmäßige Status-Synchronisation mit Plattformen (z.B. stündlich)
- Security: Plattform-API-Keys und OAuth-Tokens dürfen nie im Frontend exponiert werden

---

## Tech Design (Solution Architect)

### Designentscheidung: Manuell kopieren statt API-Integration

Die ursprüngliche Spec sieht direkte API-Anbindung an mobile.de und eBay vor. Für V1 wurde entschieden, stattdessen einen **"Manuell kopieren"-Workflow** zu implementieren:
- mobile.de bietet nur eine Händler-API (kein Privat-Inserieren via API)
- eBay erfordert aufwändiges API-Onboarding pro Nutzer
- Der manuelle Ansatz funktioniert sofort mit allen Plattformen (auch Classic Trader, AutoScout24 etc.)

### Komponentenstruktur

```
Inserat-Editor (/vehicles/[id]/verkaufen)
+-- Bestehender Editor (PROJ-12)
|
+-- Veröffentlichungs-Bereich (neuer Abschnitt unterhalb)
    |
    +-- Plattform-Karten
    |   +-- mobile.de Karte
    |   |   +-- Logo + "Auf mobile.de inserieren"
    |   |   +-- "Text kopieren" Button → kopiert Titel + Beschreibung
    |   |   +-- "Fotos herunterladen" Button → ZIP-Download aller ausgewählten Fotos
    |   |   +-- "Zu mobile.de" Link → öffnet mobile.de Inserieren-Seite
    |   |   +-- Status-Badge (Nicht veröffentlicht / Aktiv / Verkauft)
    |   |   +-- Link-Eingabefeld (Nutzer fügt Live-Inserat-URL ein)
    |   |
    |   +-- eBay Kleinanzeigen Karte
    |   |   +-- [Gleicher Aufbau wie mobile.de]
    |   |
    |   +-- eBay Karte
    |   |   +-- [Gleicher Aufbau]
    |   |
    |   +-- Classic Trader Karte (optional)
    |       +-- [Gleicher Aufbau]
    |
    +-- Status-Übersicht
    |   +-- "Verkauft" Button → markiert auf allen Plattformen als verkauft
    |   +-- Gesamtstatus-Anzeige
    |
    +-- Veröffentlichungs-Tipps
        +-- Plattform-spezifische Hinweise (Bildlimits, Textlimits, Tipps)
```

### Datenmodell

```
Erweiterung des bestehenden Datensatzes: Verkaufsinserat (vehicle_listings)
- Neues Feld: published_platforms (JSON-Array)
  - Jeder Eintrag enthält:
    - Plattform-Name (z.B. "mobile_de", "ebay", "kleinanzeigen")
    - Status: "nicht_veroeffentlicht", "aktiv", "verkauft", "abgelaufen"
    - Externer Link (vom Nutzer eingefügt, z.B. "https://www.mobile.de/inserat/123")
    - Veröffentlicht am (Datum)
    - Aktualisiert am (Datum)

Kein neuer Datensatz nötig — wir erweitern die bestehende vehicle_listings Tabelle um ein JSON-Feld.
```

### Seitenstruktur

| Seite | Auth? | Zweck |
|-------|-------|-------|
| `/vehicles/[id]/verkaufen` | Ja | Bestehende Seite erweitert um Veröffentlichungs-Bereich |
| `/api/vehicles/[id]/listing` | Ja | PATCH erweitert um published_platforms |
| `/api/vehicles/[id]/listing/photos-zip` | Ja | GET: ZIP-Download aller ausgewählten Fotos |

### Technische Entscheidungen

| Entscheidung | Begründung |
|-------------|-----------|
| Manuell kopieren statt API | mobile.de hat keine Privat-API, eBay zu aufwändig für V1. Funktioniert mit jeder Plattform |
| ZIP-Download für Fotos | Nutzer muss Fotos nicht einzeln herunterladen. Alle ausgewählten Fotos in einem Download |
| published_platforms als JSON | Flexibel erweiterbar — neue Plattformen ohne Schema-Änderung |
| Kein neuer Datensatz | Veröffentlichungs-Status gehört logisch zum Inserat, keine separate Tabelle nötig |
| Link-Eingabefeld | Nutzer kann den Live-Inserat-Link speichern → dient als Referenz und Nachweis |
| Plattform-Tipps im UI | Hilft dem Nutzer beim manuellen Inserieren (Bildlimits, Textlimits etc.) |

### Abhängigkeiten (neue Pakete)

| Paket | Zweck |
|-------|-------|
| jszip | ZIP-Datei mit Fotos generieren (serverseitig) |

### Ablauf

```
1. Nutzer hat Inserat in PROJ-12 fertig bearbeitet
2. Nutzer scrollt zum Veröffentlichungs-Bereich
3. Nutzer wählt Plattform (z.B. mobile.de)
4. Nutzer klickt "Text kopieren" → Titel + Beschreibung in Zwischenablage
5. Nutzer klickt "Fotos herunterladen" → ZIP mit allen ausgewählten Fotos
6. Nutzer klickt "Zu mobile.de" → Plattform öffnet sich
7. Nutzer erstellt Inserat manuell auf der Plattform
8. Nutzer fügt Live-Link im Eingabefeld ein → Status wird "Aktiv"
9. Wenn verkauft → "Verkauft markieren" setzt alle Plattformen auf "Verkauft"
```

## QA Test Results

**Tested:** 2026-04-08
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Plattform-Karten sichtbar
- [x] Nutzer sieht Plattform-Karten (mobile.de, eBay, Kleinanzeigen, Classic Trader) im Veröffentlichungs-Bereich (code review: 4 platform cards rendered from `PLATFORM_IDS`)

#### AC-2: Text kopieren
- [x] "Text kopieren" kopiert Titel + Beschreibung + Preis in die Zwischenablage

#### AC-3: Fotos herunterladen
- [x] "Fotos herunterladen" endpoint exists at `/api/vehicles/[id]/listing/photos-zip`
- [x] ZIP download respects photo order
- [x] Auth + ownership check on ZIP endpoint
- [x] Empty ZIP guard (returns 500 if no photos could be loaded)

#### AC-4: "Zu [Plattform]" Link
- [x] Each platform card has "Auf [Platform] inserieren" link with correct external URL
- [x] Links open in new tab (`target="_blank"`, `rel="noopener noreferrer"`)

#### AC-5: Live-Inserat-Link eingeben und speichern
- [x] URL input field per platform with save button
- [x] PATCH API accepts `published_platforms` array
- [x] Zod validation via `publishedPlatformSchema`
- [ ] BUG-1: Save can fail if listing title is empty (see below)

#### AC-6: Status auf "Aktiv" nach Link-Eingabe
- [x] Non-empty URL sets status to "aktiv", empty URL sets back to "nicht_veroeffentlicht"
- [x] `published_at` timestamp set on first activation

#### AC-7: "Verkauft" markieren
- [x] "Als verkauft markieren" button visible when any platform is "aktiv"
- [x] Sets all active platforms to "verkauft" with updated timestamp

#### AC-8: Status-Badges
- [x] Three status badges: Nicht veröffentlicht (secondary), Aktiv (default), Verkauft (outline)

#### AC-9: Plattform-spezifische Tipps
- [x] Max photos and max description length shown per platform card

#### AC-10: Veröffentlichungs-Bereich nur bei gespeichertem Inserat
- [x] `ListingPublish` component only renders when `listing` is not null

### Edge Cases Status

#### EC-1: Kein Account bei Zielplattform
- [x] "Auf [Platform] inserieren" links to platform sign-up/create pages (N/A for V1 manual approach)

#### EC-2: Fotos zu groß
- [x] N/A for V1 — photos downloaded as-is, user handles platform limits manually

#### EC-3: Empty photo selection
- [x] "Fotos herunterladen" button disabled when 0 photos selected
- [x] ZIP API returns 404 when no photos selected

#### EC-4: All photo downloads fail
- [x] ZIP API returns 500 "Keine Fotos konnten geladen werden" when all downloads fail

### Security Audit Results
- [x] Authentication: Photos ZIP API returns 401 without auth
- [x] Authentication: Listing PATCH returns 401 without auth
- [x] Authorization: Vehicle ownership check on all endpoints (user_id match)
- [x] Authorization: RLS policies on vehicle_listings (owner-only CRUD from PROJ-12)
- [x] Input validation: `published_platforms` validated via Zod schema, rejects invalid platform IDs and statuses
- [x] Data exposure: Error responses do not leak Supabase URLs, service role keys, or storage paths
- [x] External links: `rel="noopener noreferrer"` on all platform links
- [ ] BUG-2: No URL format validation on `external_url` (accepts any non-empty string)

### Bugs Found

#### BUG-1: Platform URL save fails if listing has unsaved generated title
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Go to `/vehicles/[id]/verkaufen`
  2. Click "Inserat erstellen" (creates listing + auto-generates title)
  3. Without clicking "Speichern", scroll to publish section
  4. Enter a URL in a platform card and click save
  5. Expected: URL saves, platform set to "aktiv"
  6. Actual: PATCH fails with 400 "Ungültige Daten" because `listing.title` is empty (auto-generated title is in form state, not yet saved to `listing` state)
- **Root cause:** `handleSaveUrl` in listing-publish.tsx sends `listing.title` (last-saved value, empty on creation) rather than the current form value. The `patchSchema` requires `title.min(1)`.
- **Priority:** Fix before deployment

#### BUG-2: No URL format validation on platform external_url
- **Severity:** Low
- **Steps to Reproduce:**
  1. Enter "hello" (non-URL string) in a platform URL field
  2. Click save
  3. Expected: Validation error or URL format hint
  4. Actual: Saves successfully, platform status set to "aktiv", "Inserat ansehen" link points to invalid URL
- **Priority:** Nice to have

#### BUG-3: Shared saving state causes all platform save buttons to show spinner
- **Severity:** Low
- **Steps to Reproduce:**
  1. Have multiple platform cards visible
  2. Click save on one platform URL
  3. Expected: Only that platform's save button shows spinner
  4. Actual: All platform save buttons show spinner simultaneously
- **Priority:** Nice to have

### Automated Tests
- **Unit tests:** 5 new tests for `publishedPlatformSchema` and platform constants — all pass
- **E2E tests:** 26 tests (13 Chromium + 13 Mobile Safari) — all pass
  - API auth tests (401 for unauthenticated)
  - Security data exposure tests
  - Responsive viewport tests (375px, 768px, 1440px)
  - Regression tests (landing page, login, dashboard)

### Summary
- **Acceptance Criteria:** 9/10 passed (1 has medium bug)
- **Bugs Found:** 3 total (0 critical, 0 high, 1 medium, 2 low)
- **Security:** Pass (auth, authz, input validation, data exposure all clean)
- **Production Ready:** NO — BUG-1 (medium) should be fixed before deployment
- **Recommendation:** Fix BUG-1 (platform URL save fails on unsaved listing), then deploy. BUG-2 and BUG-3 can be fixed in a later sprint.

## Deployment
_To be added by /deploy_
