# PROJ-14: FAQ-Seite

## Status: Approved
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- None

## Overview
Eine statische FAQ-Seite mit den häufigsten Fragen zur Plattform. Die Inhalte werden direkt im Code gepflegt. Die Seite wird im Footer neben Impressum, Datenschutz und Haftung verlinkt.

## User Stories
- Als Besucher möchte ich häufig gestellte Fragen zur Plattform einsehen können, damit ich schnell Antworten auf meine Fragen finde, ohne den Support kontaktieren zu müssen.
- Als potenzieller Nutzer möchte ich vor der Registrierung verstehen, was die Plattform bietet und wie sie funktioniert.
- Als eingeloggter Nutzer möchte ich bei Unklarheiten zur Bedienung eine Hilfeseite finden können.

## Acceptance Criteria
- [ ] FAQ-Seite ist unter `/faq` erreichbar
- [ ] Seite ist öffentlich zugänglich (kein Login erforderlich)
- [ ] FAQs werden als aufklappbare Akkordeon-Elemente dargestellt (shadcn/ui Accordion)
- [ ] Mindestens 8-10 sinnvolle FAQ-Einträge zu folgenden Themen:
  - Was ist Oldtimer Docs?
  - Wie erstelle ich ein Fahrzeugprofil?
  - Welche Dokumente kann ich hochladen?
  - Ist meine Fahrzeughistorie öffentlich sichtbar?
  - Wie funktioniert das digitale Scheckheft?
  - Kann ich mein Fahrzeug an einen neuen Besitzer übertragen?
  - Wie erstelle ich ein Verkaufsinserat?
  - Ist die Nutzung kostenlos?
  - Wie kann ich mein Konto löschen?
  - Wie kann ich Feedback geben oder einen Bug melden?
- [ ] Link "FAQ" im Footer auf gleicher Höhe wie Impressum, Datenschutz, Haftung
- [ ] Seite ist responsive (Mobile, Tablet, Desktop)
- [ ] Seite hat einen aussagekräftigen `<title>` und Meta-Description

## Edge Cases
- Was passiert, wenn ein FAQ-Eintrag sehr langen Text enthält? → Akkordeon scrollt mit, kein Layout-Bruch
- Was passiert bei leerer FAQ-Liste? → Nicht relevant, da statisch im Code
- Wie wird die FAQ-Seite gefunden? → Über Footer-Link, ggf. auch über Suchmaschinen (SEO)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur
```
/faq (Seite)
+-- Header (BrandLogo + Link, wie Impressum)
+-- FAQ-Überschrift + Einleitungstext
+-- Accordion (shadcn/ui)
|   +-- AccordionItem (8-10 Einträge)
+-- SiteFooter (mit FAQ + Kontakt Links)
```

### Datenmodell
- Keine Datenbank — FAQ-Inhalte als Array in der Seitenkomponente
- Jeder Eintrag: Frage (string) + Antwort (string/JSX)

### Tech-Entscheidungen
- Statisch im Code: schnell, SEO-freundlich, kein Backend
- shadcn/ui Accordion: bereits installiert, barrierefrei
- Seitenlayout wie Impressum: konsistentes Pattern

### Dependencies
- Keine neuen Packages

### Footer-Update (gemeinsam mit PROJ-15)
- Links "FAQ" und "Kontakt" im SiteFooter ergänzen

## QA Test Results

**Tested:** 2026-04-08
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: FAQ-Seite unter /faq erreichbar
- [x] Seite ist erreichbar und rendert korrekt

#### AC-2: Seite ist öffentlich zugänglich
- [x] Kein Login erforderlich, keine Weiterleitung

#### AC-3: Aufklappbare Akkordeon-Elemente (shadcn/ui)
- [x] Accordion rendert korrekt mit expand/collapse

#### AC-4: Mindestens 8-10 FAQ-Einträge
- [x] 10 FAQ-Einträge vorhanden, alle geforderten Themen abgedeckt

#### AC-5: Footer-Link "FAQ"
- [x] Link ist im Footer sichtbar und funktioniert

#### AC-6: Responsive Design
- [x] Mobile (375px), Tablet (768px), Desktop getestet

#### AC-7: Meta-Title und Meta-Description
- [x] Title und Description sind gesetzt

### Edge Cases Status
- [x] Intro-Text verlinkt auf Kontaktseite
- [x] Accordion-Items lassen sich öffnen und schließen

### Security Audit Results
- [x] Keine sensiblen Daten exponiert (statische Seite)
- [x] Kein XSS-Risiko (statischer Content)

### Bugs Found
Keine Bugs gefunden.

### Summary
- **Acceptance Criteria:** 7/7 passed
- **Bugs Found:** 0
- **Security:** Pass
- **Production Ready:** YES
- **E2E Tests:** 10 tests in `tests/PROJ-14-faq.spec.ts` (alle bestanden)

## Deployment
_To be added by /deploy_
