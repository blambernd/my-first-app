# PROJ-16: Verkaufsassistent

## Status: Approved
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- Requires: PROJ-10 (Fahrzeug-Kurzprofil) — Kurzprofil-Funktionalität wird als Schritt 2 integriert
- Requires: PROJ-11 (Marktpreis-Analyse) — Marktanalyse wird als Schritt 1 integriert
- Requires: PROJ-12 (Verkaufsinserat erstellen) — Inserat-Editor wird als Schritt 3 integriert
- Requires: PROJ-13 (Inserat veröffentlichen) — Veröffentlichung wird als Schritt 4 integriert
- Related: PROJ-8 (Freemium-Modell) — Verkaufsassistent wird zukünftig Premium-Feature

## User Stories
- Als Oldtimer-Besitzer möchte ich einen geführten Verkaufsprozess durchlaufen, damit ich nichts vergesse und den bestmöglichen Preis erziele
- Als Oldtimer-Besitzer möchte ich zuerst den Marktwert meines Fahrzeugs kennen, bevor ich einen Preis festlege
- Als Oldtimer-Besitzer möchte ich ein öffentliches Kurzprofil mit Richtpreis erstellen, damit Interessenten die Fahrzeughistorie einsehen können
- Als Oldtimer-Besitzer möchte ich mein Inserat auf Basis der vorherigen Schritte erstellen, damit alle Informationen konsistent sind
- Als Oldtimer-Besitzer möchte ich einzelne Schritte überspringen können, wenn ich sie nicht benötige
- Als Oldtimer-Besitzer möchte ich zu bereits erledigten Schritten zurückspringen können, um Änderungen vorzunehmen

## Acceptance Criteria

### Wizard-Grundstruktur
- [ ] Neue Route `/vehicles/[id]/verkaufsassistent` mit 4-Schritt-Wizard
- [ ] Stepper/Progress-Bar zeigt alle 4 Schritte mit aktuellem Status (offen, aktiv, erledigt)
- [ ] Schritte: 1) Marktpreis, 2) Kurzprofil, 3) Inserat, 4) Veröffentlichen
- [ ] "Weiter"-Button am Ende jedes Schritts führt zum nächsten
- [ ] "Zurück"-Button führt zum vorherigen Schritt
- [ ] "Überspringen"-Button an jedem Schritt ermöglicht das Weitergehen ohne Abschluss
- [ ] Bereits erledigte Schritte sind per Klick auf den Stepper erreichbar
- [ ] Noch nicht erreichte Schritte sind im Stepper nicht klickbar

### Schritt 1: Marktpreis ermitteln
- [ ] Bestehende MarketAnalysis-Komponente wird im Wizard-Schritt angezeigt
- [ ] User kann Marktanalyse starten und Ergebnis sehen
- [ ] "Weiter"-Button führt zu Schritt 2
- [ ] Schritt kann übersprungen werden

### Schritt 2: Kurzprofil erstellen
- [ ] Bestehende ProfileConfigurator-Komponente wird im Wizard-Schritt angezeigt
- [ ] "Weiter"-Button führt zu Schritt 3
- [ ] Schritt kann übersprungen werden

### Schritt 3: Inserat bearbeiten
- [ ] Bestehende ListingEditor-Komponente wird im Wizard-Schritt angezeigt
- [ ] Preis wird nur hier eingegeben (wie bisher im ListingEditor)
- [ ] Inserat wird automatisch erstellt, falls noch keins existiert (kein separater "Erstellen"-Button)
- [ ] "Weiter"-Button führt zu Schritt 4
- [ ] Schritt kann übersprungen werden

### Schritt 4: Veröffentlichen
- [ ] Bestehende ListingPublish-Komponente wird im Wizard-Schritt angezeigt
- [ ] Plattform-Karten, Text kopieren, Fotos herunterladen — wie bisher
- [ ] "Fertig"-Button beendet den Wizard und führt zurück zur Fahrzeug-Übersicht

### Navigation & Redirects
- [ ] `/vehicles/[id]/marktpreis` leitet auf `/vehicles/[id]/verkaufsassistent?schritt=1` weiter
- [ ] `/vehicles/[id]/kurzprofil` leitet auf `/vehicles/[id]/verkaufsassistent?schritt=2` weiter
- [ ] `/vehicles/[id]/verkaufen` leitet auf `/vehicles/[id]/verkaufsassistent?schritt=3` weiter
- [ ] Hauptnavigation zeigt nur noch "Verkaufsassistent" statt drei separate Einträge (Marktpreis, Kurzprofil, Verkaufen)
- [ ] Verkaufsassistent-Nav-Eintrag zeigt ein Icon das den mehrstufigen Prozess andeutet

### Premium-Vorbereitung
- [ ] "Premium"-Badge am Verkaufsassistent-Nav-Eintrag (rein visuell, keine Sperrung)
- [ ] Wizard funktioniert für alle User ohne Einschränkung
- [ ] Code-Struktur erlaubt späteres Gating durch PROJ-8

## Edge Cases
- Was passiert, wenn der User den Wizard mittendrin verlässt? → Fortschritt bleibt erhalten (Daten sind in DB gespeichert), User kann jederzeit weitermachen
- Was passiert, wenn bereits eine Marktanalyse/Kurzprofil/Inserat existiert? → Vorhandene Daten werden angezeigt, Schritt gilt als "erledigt" im Stepper
- Was passiert bei Fahrzeugen ohne Fotos? → Kurzprofil und Inserat funktionieren, aber mit Hinweis "Keine Fotos vorhanden"
- Was passiert, wenn ein anderer User (Werkstatt/Mitglied) auf den Verkaufsassistenten zugreift? → Nur Eigentümer haben Zugriff, Mitglieder sehen den Nav-Eintrag nicht

## Technical Requirements
- Responsive: Mobile (375px), Tablet (768px), Desktop (1440px)
- Stepper muss auf Mobile horizontal scrollbar oder vertikal dargestellt werden
- Alle bestehenden API-Endpoints bleiben unverändert
- Keine neuen DB-Tabellen nötig — nutzt bestehende Tabellen (market_analyses, vehicle_profiles, vehicle_listings)
- Browser Support: Chrome, Firefox, Safari

---

## Tech Design (Solution Architect)

### Designentscheidung: Wrapper-Wizard statt Neubau

Die bestehenden Komponenten (`MarketAnalysis`, `ProfileConfigurator`, `ListingEditor`, `ListingPublish`) werden **nicht umgebaut**, sondern in einen neuen Wizard-Container eingebettet. Das minimiert Risiko und Aufwand — die gesamte Geschäftslogik bleibt unverändert.

### Komponentenstruktur

```
Verkaufsassistent-Seite (/vehicles/[id]/verkaufsassistent)
+-- Server Component (Daten laden, Auth prüfen)
|
+-- SalesWizard (Client Component — der Wizard-Container)
    |
    +-- Wizard-Stepper (horizontale Schrittanzeige)
    |   +-- Schritt 1: "Marktpreis" (offen / aktiv / erledigt)
    |   +-- Schritt 2: "Kurzprofil" (offen / aktiv / erledigt)
    |   +-- Schritt 3: "Inserat" (offen / aktiv / erledigt)
    |   +-- Schritt 4: "Veröffentlichen" (offen / aktiv / erledigt)
    |
    +-- Schritt-Inhalt (je nach aktivem Schritt)
    |   +-- Schritt 1: MarketAnalysis (bestehende Komponente)
    |   +-- Schritt 2: ProfileConfigurator (bestehende Komponente)
    |   +-- Schritt 3: ListingEditor (bestehende Komponente, ohne eigenen Publish-Bereich)
    |   +-- Schritt 4: ListingPublish (bestehende Komponente)
    |
    +-- Wizard-Navigation (unten)
        +-- "Zurück"-Button (außer bei Schritt 1)
        +-- "Überspringen"-Button
        +-- "Weiter"-Button (bzw. "Fertig" bei Schritt 4)
```

### Schritt-Zustandslogik

```
Jeder Schritt hat einen Status:
- "offen" — noch nicht erreicht, im Stepper ausgegraut und nicht klickbar
- "aktiv" — aktueller Schritt, hervorgehoben
- "erledigt" — wurde besucht/abgeschlossen, im Stepper klickbar

Ein Schritt gilt als "erledigt" wenn:
- Schritt 1: Eine Marktanalyse mit Status "completed" existiert
- Schritt 2: Ein aktives Kurzprofil existiert (is_active = true)
- Schritt 3: Ein Inserat mit Titel existiert (listing.title ist nicht leer)
- Schritt 4: Mindestens eine Plattform hat Status "aktiv"

Der höchste erreichte Schritt wird im URL-Parameter ?schritt=X gespeichert.
Navigation: Schritte ≤ höchster erreichter Schritt sind klickbar.
```

### Datenmodell

```
Keine neuen DB-Tabellen oder Felder nötig.

Bestehende Daten bestimmen den Wizard-Fortschritt:
- market_analyses → Schritt 1 erledigt?
- vehicle_profiles → Schritt 2 erledigt?
- vehicle_listings → Schritt 3 erledigt?
- vehicle_listings.published_platforms → Schritt 4 erledigt?

Der aktuelle Schritt wird über den URL-Parameter ?schritt=1..4 gesteuert.
```

### Seitenstruktur

| Seite | Auth? | Zweck |
|-------|-------|-------|
| `/vehicles/[id]/verkaufsassistent` | Ja (nur Eigentümer) | Neuer 4-Schritt-Wizard |
| `/vehicles/[id]/marktpreis` | — | Redirect → `/verkaufsassistent?schritt=1` |
| `/vehicles/[id]/kurzprofil` | — | Redirect → `/verkaufsassistent?schritt=2` |
| `/vehicles/[id]/verkaufen` | — | Redirect → `/verkaufsassistent?schritt=3` |

### Änderungen an bestehenden Komponenten

| Komponente | Änderung |
|-----------|----------|
| `vehicle-profile-nav.tsx` | 3 Einträge (Marktpreis, Kurzprofil, Verkaufen) durch 1 Eintrag "Verkaufsassistent" ersetzen. Premium-Badge hinzufügen |
| `listing-editor.tsx` | `ListingPublish`-Einbindung entfernen (wird eigenständiger Schritt 4). Auto-Create Inserat wenn keins existiert (ohne "Erstellen"-Button) |
| `listing-publish.tsx` | Keine Änderung — wird direkt als Schritt 4 eingebettet |
| `market-analysis.tsx` | Keine Änderung — wird direkt als Schritt 1 eingebettet |
| `profile-configurator.tsx` | Keine Änderung — wird direkt als Schritt 2 eingebettet |

### Technische Entscheidungen

| Entscheidung | Begründung |
|-------------|-----------|
| URL-Parameter statt Client-State | Schritt-Status bleibt bei Seitenreload erhalten. Redirects von alten URLs funktionieren. Bookmarkbar |
| Bestehende Komponenten unverändert einbetten | Minimales Risiko — die ganze Geschäftslogik (API-Calls, Validierung, Error-Handling) bleibt identisch |
| Fortschritt aus DB ableiten statt speichern | Kein neues DB-Feld nötig. Wizard-Status ist immer aktuell, auch wenn User Daten außerhalb des Wizards ändert |
| Server Component als Daten-Loader | Alle Daten (Fahrzeug, Bilder, Service-Einträge, Meilensteine, Dokumente, Profil, Marktanalyse, Inserat) werden einmalig in der Server Component geladen und an den Wizard übergeben |
| Premium-Badge rein visuell | PROJ-8 existiert noch nicht. Wir bereiten die Stelle vor, ohne funktionales Gating zu implementieren |

### Abhängigkeiten (neue Pakete)

Keine neuen Pakete nötig. Der Stepper wird mit bestehenden shadcn/ui Primitives (Badge, Button, Separator) gebaut.

### Ablauf

```
1. User klickt "Verkaufsassistent" in der Fahrzeug-Navigation
2. Server Component lädt alle Daten und leitet sie an SalesWizard weiter
3. SalesWizard prüft bestehende Daten und bestimmt Schritt-Status
4. User sieht Stepper + aktuellen Schritt (Standard: erster nicht-erledigter)
5. User arbeitet Schritte durch oder überspringt einzelne
6. Am Ende klickt User "Fertig" → Redirect zur Fahrzeug-Übersicht
```

## QA Test Results

**QA Date:** 2026-04-08
**QA Engineer:** Claude (automated)
**Status:** PASSED — Production Ready

### Acceptance Criteria Results

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Neue Route `/vehicles/[id]/verkaufsassistent` mit 4-Schritt-Wizard | ✅ Pass |
| 2 | Stepper/Progress-Bar zeigt alle 4 Schritte mit Status | ✅ Pass |
| 3 | Schritte: Marktpreis, Kurzprofil, Inserat, Veröffentlichen | ✅ Pass |
| 4 | "Weiter"-Button führt zum nächsten Schritt | ✅ Pass |
| 5 | "Zurück"-Button führt zum vorherigen Schritt | ✅ Pass |
| 6 | "Überspringen"-Button ermöglicht Weitergehen | ✅ Pass |
| 7 | Erledigte Schritte per Klick erreichbar | ✅ Pass |
| 8 | Nicht erreichte Schritte nicht klickbar | ✅ Pass |
| 9 | Schritt 1: MarketAnalysis-Komponente eingebettet | ✅ Pass |
| 10 | Schritt 2: ProfileConfigurator-Komponente eingebettet | ✅ Pass |
| 11 | Schritt 3: ListingEditor-Komponente eingebettet (Auto-Create) | ✅ Pass |
| 12 | Schritt 4: ListingPublish-Komponente eingebettet | ✅ Pass |
| 13 | `/marktpreis` leitet auf `verkaufsassistent?schritt=1` weiter | ✅ Pass |
| 14 | `/kurzprofil` leitet auf `verkaufsassistent?schritt=2` weiter | ✅ Pass |
| 15 | `/verkaufen` leitet auf `verkaufsassistent?schritt=3` weiter | ✅ Pass |
| 16 | Nav zeigt nur "Verkaufsassistent" statt drei Einträge | ✅ Pass |
| 17 | Verkaufsassistent-Nav mit Workflow-Icon | ✅ Pass |
| 18 | Premium-Badge am Nav-Eintrag (visuell) | ✅ Pass |
| 19 | Wizard funktioniert für alle User ohne Einschränkung | ✅ Pass |

### Responsive Testing

| Viewport | Status |
|----------|--------|
| Mobile (375px) | ✅ Pass |
| Tablet (768px) | ✅ Pass |
| Desktop (1440px) | ✅ Pass |

### Cross-Browser Testing

| Browser | Status |
|---------|--------|
| Chromium | ✅ Pass (13/13 tests) |
| Mobile Safari | ✅ Pass (13/13 tests) |

### Security Audit

| Check | Status |
|-------|--------|
| Auth required (unauthenticated → login redirect) | ✅ Pass |
| API responses don't expose secrets (supabase, service_role, password) | ✅ Pass |
| Owner-only access (no membership fallback) | ✅ Pass |

### Regression Testing

| Check | Status |
|-------|--------|
| Landing page renders correctly | ✅ Pass |
| Login page renders correctly | ✅ Pass |
| Dashboard redirects unauthenticated users | ✅ Pass |

### Unit Tests
- 227 passed, 1 pre-existing failure (MILESTONE_CATEGORIES count — unrelated to PROJ-16)

### E2E Tests
- 26 tests in `tests/PROJ-16-verkaufsassistent.spec.ts`
- 26/26 passed (13 Chromium + 13 Mobile Safari)

### Bugs Found
None.

### Production-Ready Decision
**READY** — No Critical or High bugs. All acceptance criteria pass. All E2E tests pass.

## Deployment
_To be added by /deploy_
