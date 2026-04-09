# PROJ-17: Landing Page

## Status: In Progress
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- None (statische Seite, kein Backend)
- Referenziert PROJ-8 (Freemium-Modell) für Preistabelle — aber nur visuell, keine Stripe-Integration nötig

## Overview
Die bestehende minimalistische Startseite (/) wird durch eine professionelle Landing Page ersetzt, die die Vorteile von Oldtimer Docs überzeugend präsentiert, das Freemium-Modell mit konkreten Preisen erklärt und Besucher zur Registrierung motiviert. Eingeloggte Nutzer werden automatisch zum Dashboard weitergeleitet.

## User Stories
- Als Besucher möchte ich auf den ersten Blick verstehen, was Oldtimer Docs ist und welches Problem es löst, damit ich entscheiden kann, ob es für mich relevant ist.
- Als potenzieller Nutzer möchte ich die wichtigsten Features und Vorteile sehen, damit ich den Mehrwert der Plattform erkenne.
- Als Besucher möchte ich die Preise und den Unterschied zwischen Free und Premium klar sehen, damit ich eine informierte Entscheidung treffen kann.
- Als Besucher möchte ich Social Proof sehen (Nutzerstimmen, Zahlen), damit ich Vertrauen in die Plattform gewinne.
- Als eingeloggter Nutzer möchte ich beim Öffnen der Startseite direkt zum Dashboard weitergeleitet werden, damit ich nicht jedes Mal die Landing Page sehe.

## Acceptance Criteria

### Hero-Sektion
- [ ] Aussagekräftige Überschrift, die den Kernnutzen kommuniziert
- [ ] Kurzer Untertitel (1-2 Sätze) mit Erklärung
- [ ] Primärer CTA-Button "Kostenlos starten" → /register
- [ ] Sekundärer CTA "Anmelden" → /login
- [ ] Visuelles Element (z.B. Hero-Illustration oder App-Screenshot-Platzhalter)

### Features/Vorteile-Sektion
- [ ] Mindestens 4-6 Feature-Karten mit Icon, Titel und kurzer Beschreibung
- [ ] Features: Digitales Scheckheft, Dokumenten-Archiv, Fahrzeug-Timeline, Kurzprofil teilen, Verkaufsinserat, Fahrzeug-Transfer
- [ ] Visuell ansprechend mit Icons (Lucide-Icons)

### Freemium-Preistabelle
- [ ] Zwei Spalten: Free vs. Premium
- [ ] Free: 1 Fahrzeug, 100 MB Speicher, Basis-Features
- [ ] Premium: Unbegrenzt Fahrzeuge, 5 GB Speicher, alle Features
- [ ] Konkreter Preis: 4,99 €/Monat oder 49,99 €/Jahr (2 Monate gratis)
- [ ] "14 Tage kostenlos testen" Hinweis
- [ ] CTA-Buttons: Free → /register, Premium → /register (solange PROJ-8 nicht live)
- [ ] Visueller Highlight/Empfehlung auf dem Premium-Plan

### Social Proof-Sektion
- [ ] Platzhalter für Nutzerstimmen/Testimonials (2-3 Karten)
- [ ] Optional: Zahlen/Statistiken (z.B. "500+ Fahrzeuge dokumentiert")
- [ ] Platzhalter-Inhalte, die später durch echte ersetzt werden

### FAQ-Teaser
- [ ] 3-4 der wichtigsten FAQs direkt auf der Landing Page (Accordion)
- [ ] Link "Alle FAQs ansehen" → /faq

### Abschluss-CTA
- [ ] Finaler Call-to-Action-Block am Ende der Seite
- [ ] "Jetzt kostenlos starten" Button → /register

### Allgemein
- [ ] Header mit Logo + Login/Registrieren Buttons (wie bisher)
- [ ] Seite ist responsive (Mobile 375px, Tablet 768px, Desktop 1440px)
- [ ] Smooth Scroll zwischen Sektionen
- [ ] Eingeloggte Nutzer werden automatisch zum Dashboard redirected
- [ ] Seite hat optimierten `<title>` und Meta-Description für SEO
- [ ] Footer wird über Root-Layout bereitgestellt (kein doppelter Footer)

## Edge Cases
- Was passiert, wenn ein eingeloggter Nutzer direkt / aufruft? → Redirect zu /dashboard
- Was passiert bei langsamer Verbindung? → Seite ist statisch, lädt schnell (kein API-Call nötig, nur Auth-Check für Redirect)
- Wie verhält sich die Preistabelle auf Mobile? → Karten stacken vertikal
- Was passiert, wenn PROJ-8 (Stripe) live geht? → Premium-CTA wird dann zu Stripe Checkout verlinkt, Free bleibt /register

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur
```
/ (Startseite)
+-- Auth-Check: eingeloggt → Redirect /dashboard
+-- Header (Logo + Login/Registrieren)
+-- Hero (Überschrift, Untertitel, CTAs, Platzhalter-Visual)
+-- Features (6x Card mit Lucide-Icon + Titel + Text)
+-- Preistabelle (Free vs. Premium, Monat/Jahr-Toggle)
+-- Social Proof (3 Statistik-Zahlen + 3 Testimonial-Platzhalter)
+-- FAQ-Teaser (3-4 Accordion + Link zu /faq)
+-- Abschluss-CTA
+-- SiteFooter (via Root-Layout)
```

### Datenmodell
- Keine Datenbank — alle Inhalte statisch
- FAQ-Daten in separater Datei, geteilt mit /faq
- Auth-Check: Supabase Session prüfen → Redirect

### Tech-Entscheidungen
- Statisch: schnell, SEO-freundlich
- Client-Komponente nur für Auth-Check + Preis-Toggle
- shadcn Card + Badge + Accordion: bereits installiert
- Lucide-Icons für Feature-Karten
- FAQ-Array ausgelagert, keine Duplikation

### Dependencies
- Keine neuen Packages

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
