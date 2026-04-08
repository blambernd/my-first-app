# PROJ-15: Kontakt & Feedback

## Status: Deployed
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- None

## Overview
Eine öffentlich zugängliche Kontaktseite mit Formular, über die Nutzer und Besucher Kontakt aufnehmen, Verbesserungsvorschläge einreichen und Bugs melden können. Das Formular sendet eine E-Mail an eine definierte Adresse (z.B. via Resend). Die Seite wird im Footer verlinkt.

## User Stories
- Als Besucher möchte ich eine allgemeine Anfrage an das Team senden können, ohne mich einloggen zu müssen.
- Als Nutzer möchte ich einen Verbesserungsvorschlag für die Plattform einreichen können, damit die Plattform weiterentwickelt wird.
- Als Nutzer möchte ich einen Bug melden können, damit Fehler behoben werden.
- Als Nutzer möchte ich eine Anfrage zu meinem Account oder Datenschutz stellen können.
- Als Absender möchte ich eine Bestätigung sehen, dass meine Nachricht erfolgreich gesendet wurde.

## Acceptance Criteria
- [ ] Kontaktseite ist unter `/kontakt` erreichbar
- [ ] Seite ist öffentlich zugänglich (kein Login erforderlich)
- [ ] Kontaktformular enthält folgende Felder:
  - Kategorie (Dropdown/Select): Allgemeine Anfrage, Verbesserungsvorschlag, Bug melden, Account/Datenschutz
  - Name (Pflichtfeld)
  - E-Mail-Adresse (Pflichtfeld, validiert)
  - Betreff (Pflichtfeld)
  - Nachricht (Pflichtfeld, Textarea, min. 10 Zeichen)
- [ ] Client-seitige Validierung aller Pflichtfelder mit Fehlermeldungen
- [ ] Bei "Bug melden": optionales Feld für Screenshot-Upload oder URL der betroffenen Seite
- [ ] Formular sendet E-Mail an konfigurierte Adresse (via API-Route + E-Mail-Service)
- [ ] Erfolgsbestätigung nach dem Absenden (Toast oder Inline-Meldung)
- [ ] Rate-Limiting / Spam-Schutz auf der API-Route (z.B. max. 5 Anfragen pro Minute pro IP)
- [ ] Link "Kontakt" im Footer auf gleicher Höhe wie Impressum, Datenschutz, Haftung
- [ ] Seite ist responsive (Mobile, Tablet, Desktop)
- [ ] Loading-State während des Absendens (Button disabled + Spinner)

## Edge Cases
- Was passiert bei ungültiger E-Mail-Adresse? → Client-seitige Validierung zeigt Fehlermeldung
- Was passiert, wenn der E-Mail-Service nicht erreichbar ist? → Benutzerfreundliche Fehlermeldung ("Bitte versuchen Sie es später erneut")
- Was passiert bei sehr langer Nachricht? → Maximale Zeichenzahl (z.B. 5000 Zeichen) mit Zähler
- Was passiert bei Spam/Missbrauch? → Rate-Limiting auf API-Route
- Was passiert bei Doppelklick auf Absenden? → Button wird nach erstem Klick disabled
- Was passiert, wenn JavaScript deaktiviert ist? → Grundlegende HTML-Validierung greift

## Offene Fragen
- Welcher E-Mail-Service soll verwendet werden? (Resend, SendGrid, etc.) → Im Architecture-Schritt klären
- An welche E-Mail-Adresse sollen Anfragen gesendet werden? → Konfigurierbar via Umgebungsvariable

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur
```
/kontakt (Seite)
+-- Header (BrandLogo + Link, wie Impressum)
+-- Seitenüberschrift + Einleitungstext
+-- Kontaktformular (Card)
|   +-- Select: Kategorie (4 Optionen)
|   +-- Input: Name
|   +-- Input: E-Mail
|   +-- Input: Betreff
|   +-- Textarea: Nachricht (max 5000, Zeichenzähler)
|   +-- Input: Bug-URL (nur bei Kategorie "Bug melden")
|   +-- Button: Absenden (Loading-Spinner)
+-- Erfolgs-Toast (Sonner)
+-- SiteFooter
```

### API-Route
```
POST /api/contact
+-- Zod-Validierung aller Pflichtfelder
+-- Rate-Limiting: max 5/min pro IP (in-memory Map)
+-- E-Mail senden via Resend
+-- Antwort: Erfolg oder Fehler
```

### Datenmodell
- Keine Datenbank — Anfragen werden als E-Mail gesendet
- Zod-Schema: Kategorie (4 Optionen), Name (2-100), E-Mail (gültig), Betreff (3-200), Nachricht (10-5000), Bug-URL (optional)

### Tech-Entscheidungen
- Resend: bereits installiert, einfache API
- Rate-Limiting in-memory: ausreichend für Vercel Serverless
- Zod + react-hook-form: bereits im Stack
- Konditionelles Feld: Bug-URL nur bei Kategorie "Bug melden"

### Umgebungsvariablen
- `CONTACT_EMAIL_TO` — Ziel-E-Mail für Kontaktanfragen
- `RESEND_API_KEY` — bereits vorhanden

### Dependencies
- Keine neuen Packages

### Footer-Update (gemeinsam mit PROJ-14)
- Links "FAQ" und "Kontakt" im SiteFooter ergänzen

## QA Test Results

**Tested:** 2026-04-08
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: Kontaktseite unter /kontakt erreichbar
- [x] Seite ist erreichbar und rendert korrekt

#### AC-2: Seite ist öffentlich zugänglich
- [x] Kein Login erforderlich, keine Weiterleitung

#### AC-3: Formularfelder vorhanden
- [x] Kategorie (Select mit 4 Optionen)
- [x] Name, E-Mail, Betreff, Nachricht

#### AC-4: Client-seitige Validierung
- [x] Validierungsfehler werden bei leerem Submit angezeigt

#### AC-5: Bug-URL-Feld bei "Bug melden"
- [x] Feld erscheint nur bei Kategorie "Bug melden"
- [x] Feld verschwindet beim Kategorie-Wechsel

#### AC-6: E-Mail-Versand via API-Route
- [x] API-Route `/api/contact` vorhanden mit Zod-Validierung
- [x] Resend-Integration implementiert

#### AC-7: Erfolgsbestätigung
- [x] Inline-Erfolgsanzeige + Toast nach Absenden

#### AC-8: Rate-Limiting
- [x] Max 5 Anfragen pro Minute pro IP (429 nach Überschreitung)

#### AC-9: Footer-Link "Kontakt"
- [x] Link ist im Footer sichtbar und funktioniert

#### AC-10: Responsive Design
- [x] Mobile (375px) und Desktop getestet

#### AC-11: Loading-State
- [x] Button disabled + Loader2-Spinner während Absenden

### Edge Cases Status
- [x] Zeichenzähler zeigt aktuelle/max Zeichen (0/5000 → n/5000)
- [x] Button wird nach Klick disabled (Doppelklick-Schutz)
- [x] Fehlermeldung bei E-Mail-Service-Ausfall (503)

### Security Audit Results
- [x] Input-Validierung: Zod-Schema auf Server-Seite
- [x] XSS: Kein unsanitized HTML in API-Responses
- [x] Rate-Limiting: 5 Anfragen/Minute pro IP
- [x] Keine SQL-Injection möglich (keine Datenbank)
- [x] replyTo statt from für User-E-Mail (kein Spoofing)

**Hinweise (Low):**
- Rate-Limiting ist in-memory und wird bei Serverless-Cold-Starts zurückgesetzt. Für Produktionseinsatz ggf. auf Redis upgraden.
- `x-forwarded-for` Header kann theoretisch manipuliert werden. Vercel setzt diesen Header zuverlässig, aber bei anderen Hosting-Providern prüfen.

### Bugs Found
Keine kritischen oder hohen Bugs gefunden.

### Summary
- **Acceptance Criteria:** 11/11 passed
- **Bugs Found:** 0 (2 Low-Hinweise zur Rate-Limiting-Architektur)
- **Security:** Pass
- **Production Ready:** YES
- **E2E Tests:** 15 tests in `tests/PROJ-15-kontakt-feedback.spec.ts` (alle bestanden)

## Deployment
- **Deployed:** 2026-04-08
- **Commit:** 9381e1a
- **Trigger:** git push to main → Vercel auto-deploy
- **Env-Var:** `CONTACT_EMAIL_TO` muss in Vercel gesetzt sein
