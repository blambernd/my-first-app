# PROJ-17: Landing Page

## Status: Approved
**Created:** 2026-04-08
**Last Updated:** 2026-08-05

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
- [ ] Features: Digitales Scheckheft, Dokumenten-Archiv, Fahrzeug-Timeline, Kosten im Blick, Wertentwicklung, Fahrzeug-Transfer
- [ ] **Es werden nur Funktionen beworben, die eingeschaltet sind** — nichts aus `feature-flags.ts`, was auf `false` steht
- [ ] Visuell ansprechend mit Icons (Lucide-Icons)

> **Geändert am 2026-08-05.** Bis dahin verlangte dieses Kriterium „Kurzprofil teilen" und „Verkaufsinserat". Beide sind seit der Zurückstellung von PROJ-29 abgeschaltet; die Seite bewarb sie trotzdem. Das dritte Kriterium ist neu und soll verhindern, dass das wieder passiert.

### Freemium-Preistabelle
- [ ] Zwei Spalten: Free vs. Premium
- [ ] Free: 1 Fahrzeug, 100 MB Speicher, Basis-Features
- [ ] Premium: Unbegrenzt Fahrzeuge, 5 GB Speicher, Kostenauswertung und Wertentwicklung
- [ ] Die **Fahrzeuganzahl** steht in beiden Listen an erster Stelle — sie ist der Unterschied, auf den es ankommt
- [ ] Die genannten Grenzen stimmen mit `PLANS` in `stripe.ts` überein
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
- [ ] Eingeloggte Nutzer werden automatisch zum Dashboard redirected
- [ ] Seite hat optimierten `<title>` und Meta-Description für SEO
- [ ] **Die Meta-Description bewirbt ebenfalls nur eingeschaltete Funktionen** — sie ist der Text, den Suchmaschinen zeigen

- [ ] Footer wird über Root-Layout bereitgestellt (kein doppelter Footer)

> **Geändert am 2026-08-05.** „Smooth Scroll zwischen Sektionen" ist gestrichen: Die Seite hat keine Sprungmarken (0 Anker geprüft), das Kriterium beschrieb etwas, das nie gebaut wurde. Das Kriterium zur Meta-Description ist neu — sie hatte den Wechsel des Seiteninhalts nicht mitgemacht und nannte weiter „Verkaufsinserate".

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

**Geprüft am:** 2026-08-05 · **Ergebnis: produktionsreif** (beide Fehler behoben)

### Akzeptanzkriterien

| Bereich | Ergebnis |
|---|---|
| Hero (5) | **5 / 5** |
| Features (4, angepasst) | **4 / 4** |
| Preistabelle (9, angepasst) | **9 / 9** |
| Social Proof (3) | **3 / 3** |
| FAQ-Teaser (2) | **2 / 2** |
| Abschluss-CTA (2) | **2 / 2** |
| Allgemein (7, angepasst) | **7 / 7** |

### Gefundene Fehler

| # | Schwere | Befund |
|---|---|---|
| BUG-1 | **Mittel** | **Der 14-tägige Testzeitraum wird nirgends erwähnt, obwohl es ihn gibt.** Der Auslöser in `20260408_subscriptions.sql` setzt für **jeden** neuen Nutzer `plan='trial'` und `trial_end = NOW() + 14 Tage`; `getEffectivePlan` liefert währenddessen „trial" mit unbegrenzten Fahrzeugen und 5 GB. Ein Besucher sieht auf der Seite nur „1 Fahrzeug" im Free-Tarif und erfährt nicht, dass er den Premium-Umfang zwei Wochen lang umsonst bekommt. Das Kriterium verlangt den Hinweis ausdrücklich — und es ist das stärkste Argument für genau das Merkmal, um das es geht: die Fahrzeuganzahl. |
| BUG-2 | **Mittel** | **Die Seitenbeschreibung bewirbt weiter eine abgeschaltete Funktion.** `src/app/page.tsx` nennt „Erstelle Verkaufsinserate und teile die Fahrzeughistorie". Das ist der Text, den Suchmaschinen anzeigen — er erreicht Menschen, bevor die Seite selbst es tut. Beim Überarbeiten des Seiteninhalts blieb er zurück; **das habe ich selbst übersehen.** |

### Überholte Akzeptanzkriterien

Diese Kriterien sind nicht verletzt, sondern **veraltet**. Sie stammen aus dem April und sollten angepasst werden, statt die Umsetzung daran zu messen:

| Kriterium | Warum überholt |
|---|---|
| „Features: … Kurzprofil teilen, Verkaufsinserat …" | Alle drei Funktionen sind abgeschaltet. Sie zu bewerben war der Hauptbefund der Überarbeitung |
| „Premium: … alle Features" | Verkaufsassistent und Marktüberblick werden gar nicht mehr angeboten |
| „Smooth Scroll zwischen Sektionen" | Es gibt keine Sprungmarken auf der Seite (0 Anker geprüft), `scroll-behavior` steht auf `auto`. Das Kriterium beschreibt etwas, das nie gebaut wurde und heute keinen Zweck hätte |

### Sicherheitsprüfung

| Angriff | Ergebnis |
|---|---|
| HTML-Einschleusung über `?registered=<img onerror=…>` | **abgewehrt** — kein Element im DOM, kein Dialog |
| Angemeldete Besucher auf `/` | Weiterleitung nach `/dashboard` |
| Doppelter Footer | nein, genau einer |
| Browser-Konsole | keine Fehler |

**Ein Fehlalarm, den ich korrigiert habe:** Die erste Prüfung suchte die Zeichenfolge „onerror" im HTML und meldete „durchlässig". Tatsächlich stand der Wert nur **URL-kodiert im Router-Zustand** von Next.js — kein Element, kein Dialog. Der Test prüft jetzt auf das Element, nicht auf den Text.

### Automatisierte Tests

- `tests/PROJ-17-landing-page.spec.ts` — **26 grün, 2 rot**. Die zwei roten sind BUG-1 und BUG-2; sie sind bewusst so geschrieben, dass sie erst nach der Behebung grün werden
- `chromium` **178 grün**, `Mobile Safari` **178 grün**, `chromium-auth` **128 grün**
- Unit-Tests **643 grün**

### Nachbesserung (2026-08-05) — beide Fehler behoben

**BUG-1:** Über der Tarifübersicht steht jetzt „**14 Tage kostenlos testen** — voller Umfang, unbegrenzt Fahrzeuge, keine Zahlungsdaten nötig." Der Zusatz zu den Zahlungsdaten ist geprüft: Das Abo entsteht durch den Auslöser beim Anlegen des Kontos, ohne Stripe.

Die erste Fassung lautete „Jeder Start beginnt mit 14 Tage kostenlos testen" — grammatisch schief. Umgestellt.

**BUG-2:** Die Beschreibung nennt jetzt den Kostenbereich statt der Verkaufsinserate: „Dokumentiere Wartungen, Restaurierungen und Kosten — vom Tankbuch bis zur Wertentwicklung. 14 Tage kostenlos testen."

### Angepasste Akzeptanzkriterien

Drei überholte Kriterien sind ersetzt, vier neue kamen hinzu — jeweils mit einer Notiz im Spec, warum:

| Alt | Neu |
|---|---|
| „Features: … Kurzprofil teilen, Verkaufsinserat" | „… Kosten im Blick, Wertentwicklung" **+ es werden nur eingeschaltete Funktionen beworben** |
| „Premium: … alle Features" | „… Kostenauswertung und Wertentwicklung" **+ Fahrzeuganzahl an erster Stelle** **+ Grenzen stimmen mit `PLANS` überein** |
| „Smooth Scroll zwischen Sektionen" | gestrichen **+ die Meta-Description bewirbt ebenfalls nur eingeschaltete Funktionen** |

Die drei neuen Kriterien sind genau die, die die beiden Fehler und den Hauptbefund der Überarbeitung verhindert hätten.

### Prüfstand nach der Nachbesserung

| Prüfung | Ergebnis |
|---|---|
| `tests/PROJ-17-landing-page.spec.ts` | **28 / 28 grün** |
| `chromium` | **182 grün**, 0 Fehlschläge |
| `Mobile Safari` | **182 grün**, 0 Fehlschläge |
| Unit-Tests | **643 grün** |
| Lint / Typen / Build | 0 Fehler |
| 375 / 768 / 1440 px | kein Querscrollen |

### Empfehlung

**Auslieferbar.** Kein offener Fehler.

Ein Punkt bleibt bewusst liegen: Die beiden Kundenstimmen sind erfunden und als Platzhalter gekennzeichnet. Sie sind über `NEXT_PUBLIC_MVP_MODE` ausgeblendet und derzeit nicht öffentlich. **Vor dem Einschalten dieses Abschnitts** braucht es echte, freigegebene Zitate — oder er wird gestrichen.


## Deployment
_To be added by /deploy_
