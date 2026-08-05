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

## Überarbeitung (2026-08-05)

Zwei Aufträge: die offenen Testfehler beheben und die Seite auf den heutigen Funktionsumfang bringen, mit der Fahrzeuganzahl als tragendem Premium-Merkmal.

### Der schwerste Befund stand nicht in der Aufgabe

**Die Seite bewarb drei Funktionen, die abgeschaltet sind:** Kurzprofil, Verkaufsinserat und Verkaufsassistent — alle drei über `feature-flags.ts` deaktiviert, seit PROJ-29 zurückgestellt wurde. Ein neu registrierter Nutzer hätte sie gesucht und nicht gefunden.

Gleichzeitig fehlte der gesamte Kostenbereich, also die Arbeit der letzten Monate.

### Was jetzt auf der Seite steht

| Vorher | Jetzt |
|---|---|
| Kurzprofil teilen | **Kosten im Blick** — Tankbuch, Versicherung, Steuer, Ersatzteile |
| Verkaufsinserat | **Wertentwicklung** — Kaufpreis, Investitionen und laufende Kosten getrennt |
| Fahrzeug-Transfer (Historie) | Fahrzeug-Transfer — jetzt mit dem Zusatz, dass die Kostendaten beim Verkäufer bleiben |

Scheckheft, Dokumenten-Archiv und Timeline blieben unverändert.

### Die Tarife

Der Unterschied ist die **Fahrzeuganzahl** und steht deshalb in beiden Listen an erster Stelle: **1 Fahrzeug** gegen **unbegrenzt**. Die Werte stammen aus `PLANS` in `stripe.ts`, nicht aus einer Wunschliste.

| | Free | Premium |
|---|---|---|
| Fahrzeuge | **1** | **unbegrenzt** |
| Speicher | 100 MB | 5 GB |
| Scheckheft, Dokumente, Timeline | ✓ | ✓ |
| Kostenerfassung und Überblick | ✓ | ✓ |
| Kostenauswertung | — | ✓ |
| Wertentwicklung | — | ✓ |

Die Abgrenzung entspricht den tatsächlichen Prüfungen in den Seiten: `/kosten`, `/kosten/laufende`, `/kosten/einzelkosten` und `/tankbuch` sind frei, `/kosten/auswertung` und `/kosten/wertentwicklung` verlangen Premium.

**Verkaufsassistent und Marktüberblick tauchen nicht mehr auf** — auch nicht als „nicht enthalten". Sie zu nennen hieße, sie zu versprechen.

### Erfundene Zahlen und Kundenstimmen

Der Abschnitt „Social Proof" nannte **„500+ Fahrzeuge dokumentiert", „10.000+ Scheckheft-Einträge", „98 % zufriedene Nutzer"**. Tatsächlich waren es am 2026-08-05 **6 Fahrzeuge, 5 Scheckheft-Einträge, 7 Nutzer**.

**Öffentlich war das nie:** Der Abschnitt hängt an `NEXT_PUBLIC_MVP_MODE`, und in der Produktion steht es auf `true`. Über die Live-Seite geprüft — weder „500+" noch die Kundenstimmen sind dort zu sehen. Es blieb aber eine Falle: Wer das Flag umlegt, veröffentlicht die Zahlen.

Die Werte sind deshalb durch unmissverständliche Platzhalter ersetzt („— Zahl eintragen"). Wer den Abschnitt einschaltet, sieht eine Baustelle statt einer plausibel klingenden Unwahrheit. Ein Test hält die Lücke zu.

Die dritte Kundenstimme lobte das Verkaufsinserat und ist entfernt. **Die beiden übrigen sind ebenfalls nicht von echten Nutzern** — sie sind als Platzhalter gekennzeichnet und sollten vor dem Einschalten durch echte, freigegebene Zitate ersetzt oder gestrichen werden. Erfundene Kundenstimmen als echte auszugeben ist etwas anderes als eine unfertige Zahl.

### Die neun Testfehler

Gemessen statt geschätzt: Es waren **9**, nicht die notierten „~21".

| Ursache | Anzahl | Art |
|---|---|---|
| Cookie-Hinweis fängt Klicks ab | 4 | Testfehler |
| „App-Vorschau" — der Kasten wurde durch ein Bildschirmfoto ersetzt (`1f35ac2`) | 1 | veralteter Test |
| „Kostenlos starten" trifft vier Elemente | 1 | veralteter Test |
| Funktionskarten, „Empfohlen"-Abzeichen, „14 Tage kostenlos testen" | 2 | veralteter Test |
| Passwort-Abgleich ohne AGB-Häkchen | 1 | Testfehler |

**Zum Cookie-Hinweis:** Er liegt als `fixed bottom-0` mit `z-50` über dem unteren Seitenrand und fängt dort Klicks ab. Playwright meldet das als Zeitüberschreitung — das Element ist sichtbar und stabil, der Klick kommt nicht an. Kein Fehler der Anwendung: Ein Nutzer klickt den Hinweis weg. Es war ein Fehler der Tests, die das nie taten. Neuer Helfer `tests/helpers.ts`.

**Zum Passwort-Abgleich:** Ohne das AGB-Häkchen scheitert schon die Feldprüfung, und der `.refine()`-Abgleich der beiden Passwörter läuft gar nicht erst an. Der Test suchte eine Meldung, die nie erscheinen konnte. Für Nutzer bedeutet das, dass Fehler in zwei Wellen erscheinen — unschön, aber nicht kaputt.

**Ein Wettlauf, den ich selbst einbaute:** Die erste Fassung des Helfers sah direkt nach `goto` nach, fand nichts und kehrte zurück — der Banner wird erst nach der Hydration eingehängt und fing den Klick danach ab. Auf dem schmalen Bildschirm fielen dadurch weiterhin Tests um, obwohl der Helfer schon lief. Er wartet jetzt bis zu drei Sekunden auf das Erscheinen.

### Prüfstand

| Prüfung | Ergebnis |
|---|---|
| `chromium` (öffentliche Seiten) | **178 grün**, 0 Fehlschläge |
| `Mobile Safari` | **178 grün**, 0 Fehlschläge |
| `chromium-auth` (angemeldete Bereiche) | **128 grün**, 2 übersprungen |
| Unit-Tests | **643 grün** |
| Lint / Build / Typen | 0 Fehler |
| 375 / 768 / 1440 px | kein Querscrollen |
| Browser-Konsole | keine Fehler |

Ein einzelner Fehlschlag im ersten `chromium`-Lauf trat in zwei Folgeläufen nicht wieder auf — ein Flackerer, kein Befund.

### Neue Tests

- **Abgeschaltete Funktionen werden nicht beworben** — der wichtigste: Er hätte den Hauptbefund von Anfang an gefunden
- **Der Unterschied der Tarife ist die Fahrzeuganzahl**
- **Es werden keine erfundenen Zahlen als Tatsachen ausgegeben**

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
