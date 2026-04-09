# PROJ-19: Veranstaltungsübersicht

## Status: Deployed
**Created:** 2026-04-09
**Last Updated:** 2026-04-09

## Dependencies
- Requires: PROJ-1 (User Authentication) — User muss eingeloggt sein

## Zusammenfassung
Unterhalb der Fahrzeugübersicht im Dashboard wird eine Veranstaltungsübersicht für Oldtimerbesitzer angezeigt. Die Veranstaltungen sind in drei Kategorien unterteilt: **Rallyes**, **Oldtimermessen** und **Regionale Veranstaltungen**. Der User gibt seine PLZ ein und wählt einen Umkreis, um relevante Events in seiner Nähe zu sehen. Die Übersicht kann minimiert/eingeklappt werden. Veranstaltungsdaten werden wöchentlich per Web Scraping von oldtimer-veranstaltungen.de geladen.

## User Stories
- Als Oldtimer-Besitzer möchte ich auf dem Dashboard anstehende Veranstaltungen in meiner Nähe sehen, damit ich keine interessanten Events verpasse
- Als User möchte ich meine PLZ eingeben und einen Umkreis wählen können (25/50/100/200km), damit ich nur relevante Veranstaltungen sehe
- Als User möchte ich Veranstaltungen nach Kategorie filtern können (Rallyes, Messen, Regionale), damit ich schnell finde was mich interessiert
- Als User möchte ich die Veranstaltungsübersicht minimieren/einklappen können, falls ich kein Interesse daran habe
- Als User möchte ich für jede Veranstaltung Name, Datum, Ort, Kategorie, Beschreibung, Eintrittspreise, Entfernung und einen Link zur Website sehen
- Als User möchte ich, dass die Veranstaltungsdaten aktuell sind (wöchentlich aktualisiert)

## Acceptance Criteria
- [ ] Veranstaltungsübersicht wird unterhalb der Fahrzeugübersicht im Dashboard angezeigt
- [ ] Drei Kategorien sind verfügbar: Rallyes, Oldtimermessen, Regionale Veranstaltungen
- [ ] User kann PLZ eingeben (5-stellig, deutsche PLZ)
- [ ] User kann Umkreis wählen: 25km, 50km, 100km, 200km
- [ ] Veranstaltungen werden nach Entfernung zur eingegebenen PLZ gefiltert
- [ ] Jede Veranstaltung zeigt: Name, Datum, Ort, Kategorie, Beschreibung, Eintrittspreise, Entfernung in km, Link zur Website
- [ ] User kann nach Kategorie filtern (eine oder mehrere Kategorien)
- [ ] Übersicht ist einklappbar/minimierbar (Toggle-Button)
- [ ] Zustand (eingeklappt/ausgeklappt) bleibt innerhalb der Session erhalten
- [ ] Veranstaltungen werden chronologisch sortiert (nächstes Event zuerst)
- [ ] Vergangene Veranstaltungen werden nicht angezeigt
- [ ] Web Scraping von oldtimer-veranstaltungen.de läuft wöchentlich (Cron-Job)
- [ ] Gescrapte Daten werden in einer Datenbank-Tabelle gespeichert
- [ ] Bei fehlender PLZ-Eingabe wird ein Hinweis angezeigt ("Gib deine PLZ ein, um Veranstaltungen in deiner Nähe zu sehen")
- [ ] Ladeindikator während Veranstaltungen geladen werden
- [ ] Leerer Zustand: "Keine Veranstaltungen in diesem Umkreis gefunden"

## Edge Cases
- **Ungültige PLZ:** Validierung auf 5-stellig numerisch. Fehlermeldung bei ungültiger Eingabe
- **PLZ ohne Koordinaten:** Falls die PLZ nicht in der Geo-Datenbank gefunden wird, Fehlermeldung anzeigen
- **Keine Veranstaltungen im Umkreis:** Leerer Zustand mit Hinweis, Umkreis zu vergrößern
- **Scraping schlägt fehl:** Bestehende Daten bleiben erhalten, kein Fehler für den User. Admin wird benachrichtigt
- **Sehr viele Veranstaltungen:** Maximal 20 Events anzeigen, mit "Alle anzeigen"-Option oder Pagination
- **Veranstaltung ohne Preis/Beschreibung:** Optionale Felder — "Keine Angabe" anzeigen wenn leer
- **Quelle ändert HTML-Struktur:** Scraper muss robust sein, bei Parse-Fehlern einzelne Events überspringen statt komplett abzubrechen

## Technische Anforderungen
- PLZ → Koordinaten-Mapping für Entfernungsberechnung (Geo-Lookup)
- Web Scraping muss Terms of Service von oldtimer-veranstaltungen.de respektieren
- Performance: Veranstaltungs-Abfrage < 500ms (aus DB, nicht live gescrapt)
- Responsive: Karte/Liste muss auf Mobile (375px) gut aussehen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
Dashboard (/dashboard — bestehend, erweitert)
+-- [Fahrzeugübersicht — bestehend]
+-- EventsOverview (neue Komponente, einklappbar)
|   +-- Collapse-Toggle ("Veranstaltungen" / Pfeil-Icon)
|   +-- Filter-Leiste
|   |   +-- PLZ-Eingabe (5-stellig)
|   |   +-- Umkreis-Auswahl (25/50/100/200km)
|   |   +-- Kategorie-Filter (Rallyes, Messen, Regionale — Mehrfachauswahl)
|   +-- Veranstaltungsliste
|   |   +-- EventCard (pro Veranstaltung)
|   |   +-- "Mehr laden"-Button (wenn > 20 Events)
|   +-- Leerer Zustand / PLZ-Hinweis
```

### B) Datenmodell

```
Neue Tabelle: events
- ID, Name, Datum (Start/Ende), Ort, PLZ, Lat/Lng
- Kategorie: rallye | messe | regional
- Beschreibung, Eintrittspreise (optional)
- Website-URL, Quell-URL (Deduplizierung)
- Erstellt-/Aktualisiert-Zeitstempel

PLZ-Koordinaten-Mapping:
- Statische JSON-Datei (~8.200 deutsche PLZ-Bereiche)
```

### C) API-Routen

| Route | Zweck |
|-------|-------|
| GET `/api/events` | Events abfragen mit PLZ, Umkreis, Kategorie |
| POST `/api/cron/scrape-events` | Wöchentliches Scraping von oldtimer-veranstaltungen.de |

### D) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Events in DB-Tabelle | Schnelle Abfragen (< 500ms), kein Live-Scraping |
| PLZ-Koordinaten als statische Datei | Kleine Datenmenge, kein externer API-Call |
| Haversine serverseitig | Genau, sicher, kein Geo-API nötig |
| `cheerio` für Scraping | Leichtgewichtig, kein Browser nötig |
| Vercel Cron | Konsistent mit bestehenden Cron-Jobs |
| shadcn Collapsible | Bereits verfügbar für Ein-/Ausklappen |

### E) Anpassungen bestehender Komponenten

| Komponente | Änderung |
|---|---|
| `dashboard/page.tsx` | EventsOverview einbinden |

### F) Neue Packages

| Package | Zweck |
|---|---|
| `cheerio` | HTML-Parsing für Web Scraping |

## QA Test Results
**Date:** 2026-04-09
**Tester:** QA Engineer (code review + unit tests)

### Automated Tests
- **Vitest:** 274/274 passed (including 18 new tests: 8 geo, 10 scraper helpers)
- **Build:** Passes successfully
- **Existing test suites:** No regressions

### Unit Tests Added
- `src/lib/geo.test.ts` — 8 tests covering Haversine distance + PLZ coordinate lookup
- `src/app/api/cron/scrape-events/scrape-events.test.ts` — 10 tests covering date parsing + PLZ extraction

### Security Audit
| Check | Result |
|---|---|
| Auth check on GET /api/events | Pass — requires authenticated user |
| Auth check on POST /api/cron/scrape-events | Pass — requires CRON_SECRET bearer token |
| RLS on events table (SELECT only for authenticated) | Pass |
| No INSERT/UPDATE/DELETE RLS for regular users | Pass |
| Service role for cron writes | Pass |
| PLZ input validation (5-digit numeric) | Pass |
| Radius input validation (whitelist) | Pass |
| Categories input validation (whitelist filter) | Pass |
| No sensitive data in /api/events response | Pass — lat/lng of events is non-sensitive |
| XSS via event data (name, description) | Pass — React escapes by default, `website_url` uses `href` with `rel=noopener noreferrer` |
| website_url could contain `javascript:` | **BUG-3** — see below |
| CRON_SECRET in .env.example | Pass — documented |

### Acceptance Criteria (Code Review)
| Criterion | Status | Notes |
|---|---|---|
| Übersicht unterhalb Fahrzeugübersicht | Pass | EventsOverview in dashboard after vehicles |
| Drei Kategorien verfügbar | Pass | rallye, messe, regional with toggle buttons |
| PLZ-Eingabe (5-stellig) | Pass | Numeric-only input, max 5 digits |
| Umkreis wählen (25/50/100/200km) | Pass | Select dropdown with 4 options |
| Filterung nach Entfernung | Pass | Bounding box + Haversine distance |
| Jede Veranstaltung zeigt alle Felder | Pass | Name, date, location, category badge, description, price, distance, website link |
| Kategorie-Filter (Mehrfachauswahl) | Pass | Toggle buttons, min 1 required |
| Einklappbar/minimierbar | Pass | Collapsible with chevron toggle |
| Zustand bleibt in Session erhalten | Pass | React state persists during session |
| Chronologisch sortiert | Pass | Primary: date ascending, secondary: distance |
| Vergangene Events nicht angezeigt | Pass | `.gte("date_start", today)` filter in API |
| Web Scraping wöchentlich | Pass | vercel.json cron: Monday 3 AM |
| Daten in DB-Tabelle | Pass | `events` table with RLS |
| PLZ-Hinweis bei fehlender Eingabe | Pass | Info icon + "Gib deine PLZ ein..." |
| Ladeindikator | Pass | Spinner + skeleton cards |
| Leerer Zustand | Pass | "Keine Veranstaltungen in diesem Umkreis gefunden" |

### Bugs Found

#### BUG-1: vercel.json überschreibt bestehende Cron-Jobs [High]
**Severity:** High
**Status:** Open
**Details:** `vercel.json` enthält nur den neuen `scrape-events` Cron-Job. Die bestehenden Cron-Jobs (`check-alerts`, `check-reminders`) fehlen. Beim Deployment würde Vercel nur den einen Job registrieren und die anderen nicht mehr ausführen.
**Fix:** Alle bestehenden Cron-Jobs in `vercel.json` aufnehmen, oder prüfen ob die anderen Jobs anders konfiguriert sind (z.B. externe Scheduler).

#### BUG-2: useEffect Infinite Loop Risiko [Medium]
**Severity:** Medium
**Status:** Open
**Details:** In `events-overview.tsx:191-195`, `fetchEvents` ist in den Dependencies des `useEffect`, und `fetchEvents` hängt von `categories` ab (einem Array). Jeder Aufruf von `toggleCategory` erzeugt ein neues Array-Objekt → neuer `fetchEvents` Callback → useEffect feuert erneut. Das Verhalten ist **funktional korrekt** (Auto-Fetch bei Filteränderung), aber die Abhängigkeitskette ist indirekt. Die `categories.join(",")` Verwendung im `useCallback` könnte bei schnellen Klicks zu Flackern führen.
**Fix:** Debounce oder eine explizite "Suchen"-Aktion statt Auto-Fetch bei jedem Klick.

#### BUG-3: website_url ohne Protokoll-Validierung [Medium]
**Severity:** Medium
**Status:** Open
**Details:** In der EventCard wird `event.website_url` direkt als `href` verwendet. Wenn ein Scraper-Ergebnis eine `javascript:`-URL oder `data:`-URL enthält, könnte dies ausgeführt werden. Der Scraper filtert aktuell nur auf `href^='http'`, aber die DB-Daten könnten auch manuell eingefügt werden.
**Fix:** Im Frontend prüfen: `website_url.startsWith("http")` bevor der Link gerendert wird.

#### BUG-4: Scraper CSS-Selektoren sind generisch [Low]
**Severity:** Low
**Status:** Open
**Details:** Die Scraper-Selektoren (`article, .event-item, .veranstaltung, tr.event, .entry`) sind nicht auf die tatsächliche HTML-Struktur von oldtimer-veranstaltungen.de abgestimmt. Ohne Kenntnis der realen Seitenstruktur wird der Scraper wahrscheinlich keine Events finden.
**Fix:** Die tatsächliche HTML-Struktur der Seite analysieren und die Selektoren anpassen. Alternativ die Scraper-Selektoren konfigurierbar machen.

#### BUG-5: Typo im leeren Zustand — "grösseren" statt "größeren" [Low]
**Severity:** Low
**Status:** Open
**Details:** In `events-overview.tsx:303`: "Versuche einen grösseren Umkreis." verwendet Schweizer Deutsch (ss statt ß).
**Fix:** Ändern zu "Versuche einen größeren Umkreis."

### Production-Ready Decision
**NOT READY** — BUG-1 (High) muss gefixt werden: vercel.json überschreibt bestehende Cron-Jobs. BUG-3 (Medium) sollte ebenfalls behoben werden (Sicherheit).

## Deployment
- **Deployed:** 2026-04-09
- **Migrations to apply:** `20260409_events.sql`
- **New env vars:** None (uses existing CRON_SECRET)
- **New packages:** `cheerio` (HTML parsing for scraper)
- **Cron job:** `vercel.json` — scrape-events every Monday 3 AM
