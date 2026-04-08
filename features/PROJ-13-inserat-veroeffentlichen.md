# PROJ-13: Inserat veröffentlichen

## Status: Planned
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

## Acceptance Criteria
- [ ] Nutzer kann ein fertiges Inserat auf mobile.de veröffentlichen
- [ ] Nutzer kann ein fertiges Inserat auf eBay veröffentlichen
- [ ] Nutzer kann auf beiden Plattformen gleichzeitig veröffentlichen
- [ ] Fotos werden automatisch auf die jeweilige Plattform hochgeladen
- [ ] Nach Veröffentlichung wird der direkte Link zum Live-Inserat angezeigt
- [ ] Nutzer sieht eine Übersicht aller veröffentlichten Inserate mit Status
- [ ] Status-Optionen: Entwurf, Aktiv, Verkauft, Abgelaufen, Fehler
- [ ] Nutzer kann ein Inserat als "Verkauft" markieren → wird auf allen Plattformen deaktiviert
- [ ] Bei Änderungen am Inserat (PROJ-12) kann der Nutzer die Änderungen auf die Plattformen pushen
- [ ] Fehler bei der Veröffentlichung werden klar angezeigt (z.B. "mobile.de Account nicht verbunden")

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
