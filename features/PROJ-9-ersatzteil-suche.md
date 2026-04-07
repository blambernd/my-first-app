# PROJ-9: Ersatzteil-Suche & Preis-Alerts

## Status: In Progress
**Created:** 2026-04-07
**Last Updated:** 2026-04-07

### Implementation Notes (Frontend)
- Added "Ersatzteile" tab to VehicleProfileNav (Cog icon)
- Created `/vehicles/[id]/ersatzteile` page with PartsSearch component
- Search form with Freitext input, collapsible filters (Zustand, Preisspanne, Plattformen)
- Results displayed grouped by part with expandable listings
- Created `/vehicles/[id]/ersatzteile/alerts` page with PartsAlertList component
- CreateAlertDialog for creating alerts with prefilled search query
- Alert list with pause/activate toggle (Switch) and delete with confirmation
- All validation schemas in `src/lib/validations/parts.ts`
### Implementation Notes (Backend)
- Database migration: `supabase/migrations/20260407_proj9_ersatzteil_suche.sql`
  - `part_alerts` table with RLS (owner-only CRUD)
  - `part_alert_matches` table with RLS (read/update via alert ownership)
  - `notifications` table with RLS (user-only access)
  - Indexes on vehicle_id, user_id, status, unread matches
- SerpAPI adapter pattern: `src/lib/parts-search/`
  - 4 platform adapters: eBay (ebay engine), Mobile.de, Oldtimer-Markt, Classic-Trader (Google Shopping engine)
  - Parallel search with 10s timeout per adapter
  - Results grouped by title, sorted by price
- API routes:
  - `GET /api/vehicles/[id]/parts/search` — live search with Zod validation, auth + vehicle access check
  - `GET/POST/PATCH/DELETE /api/vehicles/[id]/parts/alerts` — full CRUD for alerts with duplicate detection, limit enforcement (5 active for free plan)
- Environment: `SERPAPI_API_KEY` added to `.env.example`
- Cron job for background alert checking not yet implemented (deferred to later iteration)

## Dependencies
- Requires: PROJ-1 (User Authentication) — Nutzer muss eingeloggt sein
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeugdaten (Marke, Modell, Baureihe, Baujahr) werden für die Suche übernommen
- Optional: PROJ-8 (Freemium-Modell) — Alert-Limits abhängig vom Nutzer-Plan

## User Stories

### Ersatzteil-Suche
- Als Oldtimer-Besitzer möchte ich nach Ersatzteilen für mein Fahrzeug suchen, damit ich passende Teile schnell finde, ohne jede Plattform einzeln durchsuchen zu müssen.
- Als Oldtimer-Besitzer möchte ich, dass meine Fahrzeugdaten (Marke, Modell, Baureihe, Baujahr) automatisch in die Suche übernommen werden, damit ich nicht alles manuell eingeben muss.
- Als Oldtimer-Besitzer möchte ich Suchergebnisse nach Preis, Zustand (Neu/Gebraucht) und Plattform filtern können, damit ich das beste Angebot finde.
- Als Oldtimer-Besitzer möchte ich Ergebnisse gruppiert nach Ersatzteil sehen (günstigstes zuerst), damit ich schnell die besten Angebote vergleichen kann.

### Preis-Alerts
- Als Oldtimer-Besitzer möchte ich einen Such-Alert für ein bestimmtes Ersatzteil aktivieren, damit ich benachrichtigt werde, sobald es verfügbar wird oder im Preis sinkt.
- Als Oldtimer-Besitzer möchte ich optional einen Maximalpreis für meinen Alert festlegen, damit ich nur bei passenden Angeboten benachrichtigt werde.
- Als Oldtimer-Besitzer möchte ich per E-Mail und In-App benachrichtigt werden, wenn ein Alert auslöst, damit ich kein Angebot verpasse.
- Als Oldtimer-Besitzer möchte ich meine aktiven Alerts verwalten (ansehen, bearbeiten, deaktivieren), damit ich die Kontrolle über meine Benachrichtigungen behalte.

## Acceptance Criteria

### Suche
- [ ] Nutzer kann von der Fahrzeug-Detailseite eine Ersatzteil-Suche starten
- [ ] Fahrzeugdaten (Marke, Modell, Baureihe, Baujahr) werden automatisch vorausgefüllt
- [ ] Nutzer kann ein Ersatzteil per Freitext-Suchfeld suchen (z.B. "Bremstrommel", "Zündkerze")
- [ ] Suche durchsucht mehrere Oldtimer-Plattformen (z.B. eBay Kleinanzeigen, Mobile.de Teile, Oldtimer-Markt.de, Classic-Trader)
- [ ] Ergebnisse werden gruppiert nach Ersatzteil angezeigt, günstigstes Angebot zuerst
- [ ] Jedes Ergebnis zeigt: Teilename, Preis, Zustand (Neu/Gebraucht), Plattform, Link zum Angebot
- [ ] Filter verfügbar: Zustand (Neu, Gebraucht, Beides), Preisspanne, Plattform
- [ ] Standardmäßig werden neue und gebrauchte Teile angezeigt
- [ ] Klick auf ein Ergebnis öffnet das Angebot auf der externen Plattform in einem neuen Tab

### Preis-Alerts
- [ ] Nutzer kann aus den Suchergebnissen oder direkt einen Alert erstellen
- [ ] Alert-Formular enthält: Suchbegriff, Fahrzeug-Zuordnung, optionaler Maximalpreis, Zustand-Filter
- [ ] Alert läuft unbegrenzt bis der Nutzer ihn manuell deaktiviert oder löscht
- [ ] Anzahl aktiver Alerts abhängig vom Nutzer-Plan (Free: begrenzt, Premium: unbegrenzt)
- [ ] Benachrichtigung per E-Mail wenn ein neues passendes Angebot gefunden wird
- [ ] Benachrichtigung per In-App Notification (Badge/Glocke) bei neuem Treffer
- [ ] Alerts-Übersichtsseite zeigt alle aktiven Alerts mit letztem Treffer und Status
- [ ] Nutzer kann Alerts bearbeiten (Maximalpreis ändern, Filter anpassen)
- [ ] Nutzer kann Alerts pausieren und wieder aktivieren
- [ ] Nutzer kann Alerts löschen

### UI / Navigation
- [ ] Neuer Menüpunkt "Ersatzteile" in der Fahrzeug-Navigation
- [ ] Suchergebnisse sind responsiv und auf mobilen Geräten nutzbar
- [ ] Ladezustand (Skeleton/Spinner) während Plattformen durchsucht werden
- [ ] Leerer Zustand wenn keine Ergebnisse gefunden werden, mit Option einen Alert zu erstellen

## Edge Cases

### Suche
- **Keine Ergebnisse:** Hinweis anzeigen "Keine Ersatzteile gefunden" mit Vorschlag, einen Such-Alert zu erstellen
- **Plattform nicht erreichbar:** Suche läuft trotzdem weiter mit verfügbaren Plattformen; Hinweis welche Plattform nicht verfügbar war
- **Sehr viele Ergebnisse:** Pagination mit max. 20 Ergebnissen pro Seite
- **Ungültige/fehlende Fahrzeugdaten:** Suche trotzdem möglich mit manuellem Input; Hinweis dass Ergebnisse besser werden wenn Fahrzeugdaten vollständig sind
- **Rate-Limiting externer APIs:** Graceful handling mit Retry-Logik und Nutzer-Feedback

### Alerts
- **Alert-Limit erreicht (Free-Plan):** Hinweis mit Upgrade-Option anzeigen
- **Duplikat-Alert:** Warnung wenn ein sehr ähnlicher Alert bereits existiert
- **Massenhaft Treffer:** Max. 1 E-Mail-Benachrichtigung pro Alert pro Tag (Zusammenfassung), In-App kann häufiger sein
- **Externe Plattform entfernt Angebot:** Link als "nicht mehr verfügbar" markieren
- **Nutzer löscht Fahrzeug:** Zugehörige Alerts werden deaktiviert, Nutzer wird informiert

## Datenquellen (Plattformen)
Die folgenden Plattformen sollen initial unterstützt werden:
1. **eBay Kleinanzeigen** — Gebrauchtteile, Privatverkäufer
2. **Mobile.de Teile** — Neu- und Gebrauchtteile
3. **Oldtimer-Markt.de** — Spezialisiert auf Oldtimer-Teile
4. **Classic-Trader** — Premium Oldtimer-Teile und -Zubehör

Die Architektur soll erweiterbar sein, sodass neue Plattformen einfach hinzugefügt werden können (Adapter-Pattern).

## Technical Requirements (optional)
- Performance: Suchergebnisse innerhalb von 5 Sekunden (parallele API-Aufrufe)
- Security: Authentifizierung erforderlich für Suche und Alerts
- Alert-Check-Intervall: Plattformen werden regelmäßig geprüft (z.B. alle 1-4 Stunden)
- E-Mail: Max. 1 Zusammenfassungs-E-Mail pro Alert pro Tag
- Erweiterbarkeit: Neue Plattformen über Adapter-Interface hinzufügbar

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Fahrzeug-Detailseite (bestehendes Layout)
+-- VehicleProfileNav (bestehend, neuer Tab "Ersatzteile")
+-- Ersatzteile-Seite (/vehicles/[id]/ersatzteile)
    +-- Suchbereich
    |   +-- Fahrzeug-Info (vorausgefüllt: Marke, Modell, Baureihe, Baujahr)
    |   +-- Suchfeld (Freitext, z.B. "Bremstrommel")
    |   +-- Filter-Leiste (Zustand, Preisspanne, Plattform)
    |   +-- Such-Button
    +-- Ergebnis-Bereich
    |   +-- Lade-Zustand (Skeleton)
    |   +-- Ergebnis-Gruppen (gruppiert nach Teil)
    |   |   +-- Gruppen-Header (Teilename, Anzahl Angebote)
    |   |   +-- Angebots-Karten (Preis, Zustand, Plattform, Link)
    |   +-- Leerer Zustand ("Keine Ergebnisse" + Alert-Vorschlag)
    |   +-- Pagination
    +-- Alert-Erstellen Dialog
        +-- Suchbegriff (vorausgefüllt)
        +-- Maximalpreis (optional)
        +-- Zustand-Filter
        +-- Bestätigen

Alerts-Übersicht (/vehicles/[id]/ersatzteile/alerts)
+-- Alert-Liste
    +-- Alert-Karte (Suchbegriff, Status, letzter Treffer, Maximalpreis)
    |   +-- Bearbeiten-Button → Alert-Edit Dialog
    |   +-- Pausieren/Aktivieren Toggle
    |   +-- Löschen-Button
    +-- Leerer Zustand ("Noch keine Alerts")

Notification-Bereich (Header, global)
+-- Glocken-Icon mit Badge (Anzahl ungelesener Treffer)
+-- Notification-Dropdown
    +-- Treffer-Einträge (Teil, Preis, Plattform, Link)
```

### Datenmodell

**part_alerts** (Ersatzteil-Alerts):
- Eindeutige ID
- Gehört zu: einem Fahrzeug (FK vehicles)
- Erstellt von: Nutzer (FK auth.users)
- Suchbegriff (z.B. "Bremstrommel hinten")
- Fahrzeug-Kontext: Marke, Modell, Baureihe, Baujahr (eingefroren)
- Maximalpreis (optional, Euro)
- Zustand-Filter: Neu, Gebraucht, oder Beides
- Status: Aktiv, Pausiert
- Erstellt am, Zuletzt geprüft am

**part_alert_matches** (Alert-Treffer):
- Eindeutige ID
- Gehört zu: einem Alert (FK part_alerts)
- Titel des Angebots
- Preis (Euro), Zustand (Neu/Gebraucht)
- Plattform-Name, Externer Link, Bild-URL (optional)
- Gefunden am, Gelesen (Boolean)

**notifications** (In-App Benachrichtigungen):
- Eindeutige ID
- Nutzer (FK auth.users)
- Typ: "part_alert_match"
- Referenz-ID, Nachricht
- Gelesen (Boolean), Erstellt am

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| SerpAPI als Aggregator | Google Shopping + eBay über eine API. Free Tier (100 Suchen/Monat) für MVP. Kein eigenes Scraping. |
| Adapter-Pattern für Plattformen | Jede Plattform über eigenen Adapter. Neue Quellen hinzufügbar ohne Code-Änderung. |
| Server-seitige Suche (API Route) | API-Keys bleiben auf dem Server. Ergebnisse werden aufbereitet an Frontend geliefert. |
| Supabase pg_cron für Alerts | Alle 2 Stunden Prüfung aktiver Alerts. Kein extra Server nötig. |
| Supabase Edge Function für E-Mail | Tägliche Zusammenfassungs-E-Mail. Nutzt Resend-Integration. |
| Supabase Realtime für Notifications | Neue Treffer erscheinen sofort als Badge ohne Seiten-Reload. |
| Ergebnisse nicht in DB | Suchergebnisse sind live/temporär. Nur Alert-Treffer werden persistiert. |

### Ablauf

**Live-Suche:**
1. Nutzer öffnet "Ersatzteile"-Tab → Fahrzeugdaten vorausgefüllt
2. Suchbegriff eingeben, Filter wählen, "Suchen" klicken
3. Frontend → API Route → SerpAPI (parallel für verschiedene Quellen)
4. Ergebnisse gruppiert, sortiert, ans Frontend zurück
5. Nutzer klickt auf externe Links oder erstellt Alert

**Preis-Alert (Hintergrund):**
1. Alert wird erstellt und in DB gespeichert
2. pg_cron prüft alle 2h aktive Alerts via SerpAPI
3. Neuer Treffer → Treffer gespeichert + In-App Notification
4. Täglich: Zusammenfassungs-E-Mail für neue Treffer

### Abhängigkeiten

| Paket | Zweck |
|---|---|
| serpapi | SerpAPI Client für Ersatzteil-Suche |
| resend | E-Mail-Versand für Alert-Benachrichtigungen |

### Sicherheit & RLS

- part_alerts: Nutzer sieht/bearbeitet nur eigene Alerts (über Fahrzeug-Ownership)
- part_alert_matches: Nur lesbar für den Alert-Besitzer
- notifications: Nur eigene Notifications sichtbar
- API Route: Auth-Check vor SerpAPI-Aufruf
- Rate Limiting: Max 10 Suchen pro Nutzer pro Stunde

### Neue Seiten / Routen

- `/vehicles/[id]/ersatzteile` — Ersatzteil-Suche Seite
- `/vehicles/[id]/ersatzteile/alerts` — Alert-Übersicht
- `/api/vehicles/[id]/parts/search` — API: Suche ausführen
- `/api/vehicles/[id]/parts/alerts` — API: Alerts CRUD
- `/api/cron/check-alerts` — API: Cron-Endpoint für Alert-Prüfung

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
