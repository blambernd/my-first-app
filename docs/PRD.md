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
| P0 (MVP) | PROJ-1: User Authentication | Deployed |
| P0 (MVP) | PROJ-2: Fahrzeugprofil | Deployed |
| P0 (MVP) | PROJ-3: Digitales Scheckheft | Deployed |
| P0 (MVP) | PROJ-4: Dokumenten-Archiv | Deployed |
| P0 (MVP) | PROJ-5: Fahrzeug-Timeline | Deployed |
| P1 | PROJ-6: Rollen & Kollaboration | Deployed |
| P1 | PROJ-7: Fahrzeug-Transfer | Deployed |
| P2 | PROJ-8: Freemium-Modell | Deployed |
| P2 | PROJ-9: Ersatzteil-Suche & Preis-Alerts | Deployed |
| P1 | PROJ-10: Fahrzeug-Kurzprofil (öffentlich) | Deployed |
| P1 | PROJ-11: Marktpreis-Analyse | Deployed |
| P1 | PROJ-12: Verkaufsinserat erstellen | Deployed |
| P2 | PROJ-13: Inserat veröffentlichen | Deployed |
| P1 | PROJ-14: FAQ-Seite | Deployed |
| P1 | PROJ-15: Kontakt & Feedback | Deployed |
| P1 | PROJ-16: Verkaufsassistent | Deployed |
| P0 | PROJ-17: Landing Page | Deployed |
| P1 | PROJ-18: Empfehlungsprogramm (Referral) | Deployed |
| P1 | PROJ-19: Veranstaltungsübersicht | Deployed |
| P0 | PROJ-20: Mobile Responsive Optimierung | In Progress |
| P0 | PROJ-21: Capacitor App Setup (iOS + Android) | Deployed |
| P1 | PROJ-22: Kamera-Integration | Deployed |
| P1 | PROJ-23: Push-Notifications (Termine) | Deployed |
| P1 | PROJ-24: Tankbuch & Verbrauch | Deployed |
| P1 | PROJ-25: Wiederkehrende Kosten | Deployed |
| P2 | PROJ-26: Einzelkosten | Deployed |
| P1 | PROJ-27: Kostenanalyse | Deployed |
| P2 | PROJ-28: Kaufpreis & Wertentwicklung | Deployed |
| P1 | PROJ-29: Belastbarer Marktüberblick | Zurückgestellt |
| P1 | PROJ-30: Fahrzeug-Navigation & UX-Überarbeitung | Deployed |
| P2 | PROJ-31: Kosten-Überblicksseite | Deployed |
| P1 | PROJ-32: Kostendaten beim Fahrzeug-Transfer | Deployed |
| P1 | PROJ-33: Verkaufspreis-Erhebung beim Transfer | Deployed |
| P2 | PROJ-34: Preisübersicht aus echten Verkäufen | Architected |
| P1 | PROJ-35: Scheckheft-Import aus Dokumenten | In Progress |
| P2 | PROJ-36: Währung pro Fahrzeug | Deployed |
| P1 | PROJ-37: Werkstatt-Dashboard | Deployed |
| P2 | PROJ-38: Händler-Bestandsübersicht | Deployed |
| P1 | PROJ-39: Werkstatt-Konto & Kundenfahrzeuge | Deployed |
| P1 | PROJ-40: Fahrzeug-Übergabe an den Kunden | In Review |

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
