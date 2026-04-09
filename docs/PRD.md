# Product Requirements Document

## Vision
Eine SaaS-Plattform für Oldtimer-Besitzer, die es ermöglicht, die komplette Historie ihrer Fahrzeuge digital zu dokumentieren. Von Wartungen über Restaurierungen bis hin zu Besitzerwechseln — alle Informationen an einem Ort, jederzeit abrufbar und teilbar. Die Plattform schafft Transparenz und Vertrauen bei Kauf, Verkauf und Versicherung von Oldtimern.

## Target Users
**Private Oldtimer-Besitzer** — Enthusiasten und Sammler, die:
- Den Wert ihrer Fahrzeuge durch lückenlose Dokumentation sichern wollen
- Wartungen und Reparaturen nachvollziehbar festhalten möchten
- Dokumente (Rechnungen, Gutachten, TÜV) digital archivieren wollen
- Bei Verkauf eine vollständige Fahrzeughistorie vorweisen möchten
- Mit Werkstätten zusammenarbeiten und deren Einträge im Scheckheft verwalten

**Pain Points:**
- Papier-Scheckheft geht verloren oder wird unleserlich
- Dokumente sind über verschiedene Ordner/Orte verstreut
- Keine zentrale Übersicht über die Fahrzeughistorie
- Schwierig, die Historie bei Fahrzeugverkauf lückenlos zu übergeben

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | PROJ-1: User Authentication | Planned |
| P0 (MVP) | PROJ-2: Fahrzeugprofil | Planned |
| P0 (MVP) | PROJ-3: Digitales Scheckheft | Planned |
| P0 (MVP) | PROJ-4: Dokumenten-Archiv | Planned |
| P0 (MVP) | PROJ-5: Fahrzeug-Timeline | Planned |
| P1 | PROJ-6: Rollen & Kollaboration | Planned |
| P1 | PROJ-7: Fahrzeug-Transfer | Planned |
| P2 | PROJ-8: Freemium-Modell | Planned |
| P2 | PROJ-9: Ersatzteil-Suche & Preis-Alerts | Planned |
| P1 | PROJ-10: Fahrzeug-Kurzprofil (öffentlich) | Planned |
| P1 | PROJ-11: Marktpreis-Analyse | Planned |
| P1 | PROJ-12: Verkaufsinserat erstellen | Planned |
| P2 | PROJ-13: Inserat veröffentlichen | Planned |
| P1 | PROJ-14: FAQ-Seite | Planned |
| P1 | PROJ-15: Kontakt & Feedback | Planned |
| P1 | PROJ-16: Verkaufsassistent | Planned |
| P0 | PROJ-17: Landing Page | Planned |
| P1 | PROJ-18: Empfehlungsprogramm (Referral) | Planned |

## Success Metrics
- **Registrierungen:** 500 Nutzer in den ersten 3 Monaten
- **Aktivierung:** 70% der Nutzer legen mindestens 1 Fahrzeug an
- **Retention:** 40% monatlich aktive Nutzer nach 3 Monaten
- **Dokumentation:** Durchschnittlich 5+ Einträge pro Fahrzeug
- **Conversion:** 10% Free-zu-Premium-Conversion innerhalb 6 Monaten

## Constraints
- **Typ:** Startup — muss zeitnah auf den Markt
- **Tech Stack:** Next.js (App Router), Supabase (Backend), Vercel (Hosting)
- **Sprache:** Nur Deutsch (V1)
- **Team:** Kleine Teamgröße, AI-unterstützte Entwicklung
- **Budget:** Supabase Free/Pro Tier, Vercel Free/Pro Tier

## Non-Goals
- **Kein Marktplatz** — kein Kauf/Verkauf von Fahrzeugen oder Teilen
- **Keine native Mobile App** — Web-first (responsive), native Apps ggf. später
- **Kein Social Feed** — keine öffentlichen Profile oder Community-Timeline (V1)
- **Kein Bewertungssystem** — keine Werkstatt-Bewertungen o.ä. (V1)
- **Keine KFZ-Datenbank-Integration** — keine automatische Fahrzeugdaten-Abfrage (V1)
