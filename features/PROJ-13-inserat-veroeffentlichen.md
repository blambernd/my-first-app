# PROJ-13: Inserat veröffentlichen

## Status: Architected
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
_To be added by /qa_

## Deployment
_To be added by /deploy_
