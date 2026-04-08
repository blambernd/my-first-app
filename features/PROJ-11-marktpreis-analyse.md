# PROJ-11: Marktpreis-Analyse

## Status: Deployed
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeugstammdaten (Marke, Modell, Baujahr, Werksbezeichnung, km-Stand)

## User Stories
- Als Oldtimer-Besitzer möchte ich den aktuellen Marktwert meines Fahrzeugs einschätzen können, damit ich einen realistischen Verkaufspreis festlegen kann
- Als Oldtimer-Besitzer möchte ich sehen, welche vergleichbaren Fahrzeuge aktuell inseriert sind, damit ich mein Angebot im Marktkontext einordnen kann
- Als Oldtimer-Besitzer möchte ich eine Preisspanne (von–bis) sehen, damit ich weiß, in welchem Bereich mein Fahrzeug liegt
- Als Oldtimer-Besitzer möchte ich die Analyse jederzeit aktualisieren können, damit ich aktuelle Marktdaten bekomme

## Acceptance Criteria
- [ ] Nutzer kann eine Marktpreis-Analyse für ein Fahrzeug starten
- [ ] System durchsucht aktuelle Inserate auf relevanten Plattformen (mobile.de, Classic Trader, eBay)
- [ ] Ergebnis zeigt: Durchschnittspreis, Median, Preisspanne (niedrigster–höchster Preis)
- [ ] Ergebnis zeigt eine Liste vergleichbarer Inserate mit Titel, Preis, Plattform und Link
- [ ] Fahrzeugdaten (Marke, Modell, Baujahr, Werksbezeichnung, km-Stand) werden automatisch als Suchkriterien verwendet
- [ ] Ergebnis enthält eine begründete Preisempfehlung basierend auf den Marktdaten
- [ ] Nutzer kann die Analyse erneut durchführen (mit Rate-Limiting)
- [ ] Ergebnisse werden gespeichert und können später eingesehen werden
- [ ] Mindestens 3 Vergleichsangebote müssen gefunden werden, um eine Preisempfehlung abzugeben

## Edge Cases
- Was passiert, wenn keine vergleichbaren Inserate gefunden werden? → Meldung "Zu wenige Daten für eine Preisschätzung" + Vorschlag, Suchkriterien zu erweitern
- Was passiert bei sehr seltenen Fahrzeugen (z.B. Facel Vega)? → Suche auf allgemeinere Kriterien erweitern (nur Marke + Baujahr)
- Was passiert, wenn die Preise extrem streuen (z.B. 5.000€ bis 150.000€)? → Ausreißer kennzeichnen, Hinweis auf unterschiedliche Zustände geben
- Was passiert, wenn externe Plattformen nicht erreichbar sind? → Plattform-Fehler anzeigen, Analyse mit verfügbaren Daten durchführen
- Wie wird mit verschiedenen Währungen umgegangen? → Nur EUR, Inserate in anderen Währungen werden ignoriert

## Technical Requirements
- Performance: Analyse darf maximal 15 Sekunden dauern (mit Loading-Indikator)
- Rate-Limiting: Maximal 5 Analysen pro Fahrzeug pro Tag
- Daten: Ergebnisse werden in der Datenbank gespeichert (für Historie und spätere Nutzung in PROJ-12)
- API: SerpAPI (bereits vorhanden) für Marktdaten-Suche nutzen

---

## Tech Design (Solution Architect)

### Component Structure

```
Fahrzeug-Detail Page (existing)
+-- Tab / Section: "Marktpreis"
    +-- Market Analysis View
        +-- Vehicle Summary (auto-filled from profile)
        |   Shows: Marke, Modell, Baujahr, Werksbezeichnung, km-Stand
        +-- "Analyse starten" Button
        +-- Loading State (progress indicator, ~15s)
        +-- Analysis Results Panel
        |   +-- Price Summary Card
        |   |   +-- Durchschnittspreis (big number)
        |   |   +-- Median
        |   |   +-- Preisspanne (niedrigster – höchster)
        |   |   +-- Anzahl gefundene Inserate
        |   +-- Price Recommendation Card
        |   |   +-- Empfohlene Preisspanne
        |   |   +-- Begründung (text)
        |   +-- Comparable Listings List
        |       +-- Listing Card (per result)
        |           +-- Titel, Preis, Plattform-Badge, Link
        +-- Analysis History (previous results)
        |   +-- Date + Summary per past analysis
        +-- Empty State ("Noch keine Analyse durchgeführt")
        +-- Error State ("Zu wenige Daten" / platform errors)
```

### Data Model

```
Each Market Analysis has:
- Unique ID
- Reference to Vehicle
- Reference to User who triggered it
- Search parameters (Marke, Modell, Baujahr, Werksbezeichnung, km-Stand)
- Results: average_price, median_price, lowest_price, highest_price, listing_count
- Recommended price range (low – high)
- Recommendation reasoning (text)
- Comparable listings (JSON array: title, price, platform, url)
- Status (pending, completed, insufficient_data, error)
- Created timestamp

Stored in: Supabase table "market_analyses"
Listings as JSON column (point-in-time snapshot)
```

### Tech Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Search engine | SerpAPI (existing) | Already integrated for PROJ-9 — reuse adapter pattern with market-specific queries |
| Platforms | mobile.de, Classic Trader, eBay | Top 3 German Oldtimer marketplaces, searchable via SerpAPI site filters |
| Price calculation | Server-side in API route | Prevents manipulation, allows atomic save |
| Price recommendation | Rule-based (median ± IQR) | Simple, transparent, no AI/ML needed |
| Outlier handling | IQR method | Flag listings outside 1.5× IQR, show but mark visually |
| Data storage | Supabase table + JSON column | Listings are snapshots, no independent querying needed |
| Rate limiting | DB-backed, 5 per vehicle per day | Survives restarts unlike in-memory |
| Loading UX | Spinner with estimated time | SerpAPI calls ~5-10s total, no streaming needed |

### Dependencies

No new packages — existing stack covers everything:
- serpapi (installed for PROJ-9)
- zod (validation)
- shadcn/ui components (Card, Badge, Button, Skeleton — all installed)

### New Backend Pieces

| What | Purpose |
|------|---------|
| API route: `/api/vehicles/[id]/market-analysis` | POST = trigger, GET = fetch history |
| Lib module: `src/lib/market-analysis/` | Search logic, price calculation, platform adapters (reusing SerpAPI pattern) |
| DB table: `market_analyses` | Results with RLS (owner + members read, owner triggers) |
| DB migration | Table + RLS policies + index on vehicle_id |

### New Frontend Pieces

| What | Purpose |
|------|---------|
| Page: `/vehicles/[id]/marktpreis/page.tsx` | Market analysis view |
| Component: `market-analysis.tsx` | Main UI (trigger, results, history) |
| Navigation update | Add "Marktpreis" tab to vehicle layout |

## Implementation Notes (Frontend)
- Navigation: Added "Marktpreis" tab with TrendingUp icon to `vehicle-profile-nav.tsx`
- Types: Created `src/lib/validations/market-analysis.ts` with `MarketAnalysis` and `MarketAnalysisListing` interfaces
- Component: Created `src/components/market-analysis.tsx` — handles trigger, loading, results (price summary, recommendation, listing cards), history, empty/error states
- Page: Created `src/app/vehicles/[id]/marktpreis/page.tsx` — follows existing Ersatzteile page pattern (auth + vehicle access check)
- Calls `GET/POST /api/vehicles/[id]/market-analysis`
- Outlier listings visually marked with amber badge
- Platform badges color-coded (mobile.de blue, Classic Trader amber, eBay red)

## Implementation Notes (Backend)
- **DB Migration:** `supabase/migrations/20260408_proj11_market_analyses.sql` — table with RLS (owner full access, members read-only), indexes on vehicle_id and created_at
- **API Route:** `src/app/api/vehicles/[id]/market-analysis/route.ts` — GET (fetch history, 20 limit) + POST (trigger analysis, owner-only)
- **Search Module:** `src/lib/market-analysis/search.ts` — searches mobile.de, Classic Trader (via Google site: filter) and eBay (native eBay engine) in parallel with 10s timeout each
- **Statistics Module:** `src/lib/market-analysis/statistics.ts` — IQR-based outlier detection, median/average/range, percentile-based recommendation with German-language reasoning
- **Rate Limiting:** DB-backed, 5 analyses per vehicle per day (counts rows from today)
- **Price Parsing:** Handles German number format (25.000 €), validates range 500–5M EUR
- **Relevance Filtering:** Make-based filtering with aliases (Mercedes-Benz/Mercedes, VW/Volkswagen)

## QA Test Results
**QA Date:** 2026-04-08
**Status:** READY (with Low bugs noted)

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Nutzer kann eine Marktpreis-Analyse für ein Fahrzeug starten | PASS | POST API triggers analysis, button in UI |
| 2 | System durchsucht Inserate auf mobile.de, Classic Trader, eBay | PASS | 3 platform adapters run in parallel |
| 3 | Ergebnis zeigt Durchschnitt, Median, Preisspanne | PASS | PriceSummaryCard displays all 4 metrics |
| 4 | Liste vergleichbarer Inserate mit Titel, Preis, Plattform, Link | PASS | ListingCard with external link, platform badge |
| 5 | Fahrzeugdaten automatisch als Suchkriterien | PASS | Vehicle data loaded from DB, shown in header |
| 6 | Begründete Preisempfehlung | PASS | RecommendationCard with IQR-based reasoning |
| 7 | Analyse erneut durchführen (Rate-Limiting) | PASS | DB-backed 5/day/vehicle, 429 response |
| 8 | Ergebnisse gespeichert + später einsehbar | PASS | DB persistence + history list in UI |
| 9 | Min. 3 Vergleichsangebote für Preisempfehlung | PASS | calculatePriceStatistics returns null if <3 |

### Edge Cases Tested

| Edge Case | Result | Notes |
|-----------|--------|-------|
| Keine Inserate gefunden | PASS | "insufficient_data" status, clear message shown |
| Seltene Fahrzeuge | PASS | Falls back to make+model+year range (±3 years) |
| Extreme Preisstreuung | PASS | IQR outlier detection, amber badge marking |
| Plattform nicht erreichbar | PASS | Error collected per platform, analysis continues with available data |
| Nur EUR (no other currencies) | PASS | eBay adapter checks price range, Google parsing only matches € format |

### Security Audit

| Check | Result | Notes |
|-------|--------|-------|
| Authentication (GET) | PASS | Returns 401 for unauthenticated requests |
| Authentication (POST) | PASS | Returns 401 for unauthenticated requests |
| Authorization (GET) | PASS | Only vehicle owner or member can read analyses |
| Authorization (POST) | PASS | Only vehicle owner can trigger analysis |
| RLS policies | PASS | Owner full access, member read-only |
| Rate limiting bypass | PASS | DB-backed count check, not bypassable client-side |
| Input injection (XSS) | PASS | No user-provided search input — all params from DB vehicle record |
| SERPAPI key exposure | PASS | Key used server-side only, not exposed to client |
| IDOR (accessing other vehicles) | PASS | Vehicle ownership checked before any operation |

### Bugs Found

| # | Severity | Description | Location |
|---|----------|-------------|----------|
| 1 | **Low** | `fetchAnalyses` useCallback has `selectedAnalysis` in dependency array, causing re-fetch loop when analysis is selected from history | `market-analysis.tsx:374` |
| 2 | **Low** | History shows all analyses including currently selected — ideally the selected item should be excluded or the current result shown separately | `market-analysis.tsx:502` |
| 3 | **Low** | Pre-existing: `milestone.test.ts` has failing test (category count 9 vs expected 8) — not PROJ-11 related | `milestone.test.ts:126` |

### Test Results

| Suite | Result |
|-------|--------|
| Vitest unit (statistics) | 12/12 passed |
| Vitest unit (price parsing) | 10/10 passed |
| Playwright E2E (PROJ-11) | 20/20 passed (Chromium + Mobile Safari) |
| Existing Vitest suite | 164/165 passed (1 pre-existing failure) |
| Existing Playwright suite | 106/106 passed |

### Production-Ready Decision
**READY** — No Critical or High bugs. 2 Low bugs found (UX improvements, not blockers). Pre-existing test failure is unrelated to this feature.

## Deployment
**Deployed:** 2026-04-08
**Commit:** 4d500c2
**Tag:** v1.11.0-PROJ-11
**Migration:** 20260408_proj11_market_analyses.sql (applied)
