# PROJ-25: Wiederkehrende Kosten

## Status: Deployed
**Created:** 2026-07-31
**Last Updated:** 2026-07-31

## Dependencies
- Requires: PROJ-1 (User Authentication) — User muss eingeloggt sein
- Requires: PROJ-2 (Fahrzeugprofil) — Kosten gehören zu einem Fahrzeug; `insurance_company` und `insurance_policy_number` existieren dort bereits
- Beeinflusst: PROJ-27 (Kostenanalyse) — liefert alle zeitraumbezogenen Kostenarten

## Zusammenfassung
Manche Fahrzeugkosten sind keine Einzelereignisse, sondern laufen über einen Zeitraum: Versicherung, Kfz-Steuer, Garagenmiete, Clubbeitrag. Der Nutzer hinterlegt den Betrag einmal mit Gültigkeitszeitraum; die Anwendung legt ihn rechnerisch auf die Monate um, damit er in der Auswertung als gleichmäßige Belastung erscheint statt als einzelner Ausschlag.

Das Feature ist bewusst **nach Kostenform geschnitten, nicht nach Kostenart**: Die Umlage-, Historisierungs- und Überlappungslogik ist für alle wiederkehrenden Kosten identisch. Eine weitere Kostenart aufzunehmen ist damit ein Eintrag in der Auswahlliste und keine Änderung an dieser Spec.

Beiträge ändern sich jährlich. Die Erfassung ist deshalb **historisierend**: Für jeden Zeitraum existiert ein eigener Eintrag, alte Werte bleiben erhalten — sonst werden Auswertungen vergangener Jahre rückwirkend falsch, sobald sich ein Beitrag ändert.

## Kostenarten
| Kostenart | Anmerkung |
|---|---|
| Versicherung | `vehicles.insurance_company` existiert bereits und dient als Vorbelegung |
| Kfz-Steuer | Jahresbetrag, bei Saisonkennzeichen anteilig |
| Unterstellung / Garage / Winterlager | Für viele Halter der zweitgrößte Posten nach der Versicherung |
| Club- / Verbandsbeitrag | Oft Voraussetzung für vergünstigte Oldtimer-Tarife |

Die Liste ist erweiterbar, ohne dass sich Erfassung oder Auswertung ändern.

## User Stories
- Als Oldtimer-Besitzer möchte ich den Jahresbeitrag meiner Versicherung hinterlegen, damit er in meiner Kostenübersicht auftaucht
- Als Oldtimer-Besitzer möchte ich meine jährliche Kfz-Steuer hinterlegen, damit meine Gesamtkosten vollständig sind
- Als Oldtimer-Besitzer möchte ich meine Garagen- oder Winterlagermiete erfassen, weil sie einen erheblichen Teil meiner Unterhaltskosten ausmacht
- Als Oldtimer-Besitzer möchte ich meinen Clubbeitrag erfassen, damit auch die kleineren laufenden Posten abgebildet sind
- Als Oldtimer-Besitzer möchte ich für jeden Zeitraum einen eigenen Betrag hinterlegen, weil sich Beiträge jährlich ändern
- Als Oldtimer-Besitzer mit Saisonkennzeichen möchte ich einen abweichenden Gültigkeitszeitraum angeben, weil ich nur von April bis Oktober zugelassen bin
- Als Oldtimer-Besitzer möchte ich den Verlauf meiner Beiträge sehen, damit ich Steigerungen erkenne
- Als Oldtimer-Besitzer möchte ich einen Eintrag korrigieren oder löschen können

## Acceptance Criteria
- [ ] Eintrag anlegen mit: Kostenart (Auswahlliste), Betrag, Zahlungsintervall, Gültigkeit von, Gültigkeit bis
- [ ] Zahlungsintervall wählbar: jährlich, halbjährlich, vierteljährlich, monatlich
- [ ] Optionale Felder: Anbieter/Bezeichnung, Notiz
- [ ] Bei Kostenart "Versicherung" wird `vehicles.insurance_company` als Vorbelegung vorgeschlagen
- [ ] Beträge werden in Cent gespeichert, Eingabe in Euro
- [ ] Der Betrag wird rechnerisch auf die Monate des Gültigkeitszeitraums umgelegt
- [ ] Die Umlage berücksichtigt abweichende Zeiträume: Ein Betrag über 7 Monate wird auf 7 Monate verteilt, nicht auf 12
- [ ] Mehrere Einträge derselben Kostenart mit unterschiedlichen Zeiträumen sind möglich (Historie)
- [ ] Übersicht listet alle Einträge, gruppiert nach Kostenart, chronologisch sortiert
- [ ] Summe der laufenden Kosten pro Monat und pro Jahr wird angezeigt
- [ ] Verlauf der Beiträge über die Jahre ist je Kostenart erkennbar
- [ ] Eintrag kann bearbeitet und gelöscht werden (Löschen mit Bestätigungsdialog)
- [ ] Leerer Zustand: Hinweis "Noch keine laufenden Kosten hinterlegt" mit Button zum Anlegen
- [ ] Validierung: Betrag ≥ 0, "Gültig bis" muss nach "Gültig von" liegen
- [ ] Warnung bei überlappenden Zeiträumen derselben Kostenart
- [ ] Jede Kostenart ist als **Standkosten** oder **Fahrtkosten** klassifiziert (alle hier erfassten Arten sind Standkosten) — Grundlage für die Auswertung in PROJ-27
- [ ] Zugriff folgt den Rollen aus PROJ-6
- [ ] Erreichbar über die Fahrzeug-Navigation

## Edge Cases
- **Überlappende Zeiträume derselben Kostenart:** Zwei Versicherungsbeiträge für denselben Monat würden doppelt zählen. Beim Speichern warnen und Bestätigung verlangen; die Auswertung muss eine bestehende Überlappung offenlegen statt still zu summieren
- **Lücke zwischen zwei Zeiträumen:** Zulässig (Fahrzeug war abgemeldet oder stand nicht in der Halle). Für Lückenmonate werden keine Kosten angesetzt — das ist korrekt und kein Fehler
- **Saisonkennzeichen:** Häufigster Fall bei Oldtimern. Der Zeitraum umfasst nur die Saisonmonate; die Umlage darf nicht stur durch 12 teilen
- **Winterlager läuft gegenläufig zur Saison:** Die Garage wird oft genau dann bezahlt, wenn das Fahrzeug abgemeldet ist. Zeiträume verschiedener Kostenarten dürfen sich deshalb frei überlappen — nur Überlappungen *derselben* Art sind verdächtig
- **Fahrzeug unterjährig gekauft:** Erster Zeitraum beginnt mitten im Jahr. Die Umlage muss ab dem Startmonat greifen, nicht ab Januar
- **Beitrag rückwirkend geändert:** Der Nutzer korrigiert einen abgelaufenen Zeitraum. Bereits berechnete Auswertungen müssen sich aktualisieren — der Betrag ist keine eingefrorene Momentaufnahme
- **Zeitraum reicht in die Zukunft:** Zulässig (laufendes Versicherungsjahr). In der Auswertung dürfen zukünftige Monate aber nicht als bereits angefallene Kosten zählen
- **Versicherungswechsel mitten im Jahr:** Zwei Einträge mit angrenzenden Zeiträumen, zulässig solange sie sich nicht überlappen
- **Monatliche Zahlung statt Jahresbetrag:** Über das Zahlungsintervall abgebildet; die Umlage muss für alle Intervalle dasselbe Monatsergebnis liefern
- **Sehr langer Zeitraum (mehrere Jahre in einem Eintrag):** Zulässig, Umlage läuft über alle Monate. Hinweis anbieten, stattdessen Jahreseinträge anzulegen

## Technische Anforderungen
- Beträge als Ganzzahl in Cent speichern (konsistent zu `service_entries.cost_cents`)
- Die monatliche Umlage berechnen statt als redundante Zeilen speichern, damit eine Beitragskorrektur keine inkonsistenten Altdaten hinterlässt
- Kostenart als erweiterbare Liste modellieren, nicht als fest verdrahtete Spalten — eine neue Art darf keine Migration der Auswertung erfordern
- Bestehende Felder `vehicles.insurance_company` / `insurance_policy_number` nicht duplizieren, sondern als Vorbelegung nutzen
- Responsive: Formular auf Mobile (375px) bedienbar
- RLS-Policies analog zu `service_entries`

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
Fahrzeug-Navigation (bestehend, bekommt EINEN neuen Eintrag)
+-- Übersicht | Scheckheft | Historie | Dokumente | Tankbuch | [Kosten] | Verkaufsassistent

Kosten-Bereich  (/vehicles/[id]/kosten)
+-- Unterreiter
|   +-- [Laufende Kosten]  ← dieses Feature
|   +-- Einzelkosten        ← PROJ-26, später
|   +-- Auswertung          ← PROJ-27, später
|
+-- Laufende Kosten
    +-- Kennzahlen-Leiste
    |   +-- Summe pro Monat
    |   +-- Summe pro Jahr
    +-- Schaltfläche "Laufende Kosten erfassen"
    |   +-- Erfassungsdialog
    |       +-- Kostenart (Auswahl)
    |       +-- Betrag und Zahlungsintervall
    |       +-- Gültig von / Gültig bis
    |       +-- Optional: Anbieter/Bezeichnung, Notiz
    |       +-- Live-Anzeige "entspricht X € pro Monat"
    |       +-- Warnung bei Überlappung mit derselben Kostenart
    +-- Liste, gruppiert nach Kostenart, chronologisch
    |   +-- Eintrag
    |       +-- Zeitraum, Betrag, Zahlungsintervall
    |       +-- daraus errechnete Monatsbelastung
    |       +-- Kennzeichnung, wenn sich der Zeitraum mit einem anderen überschneidet
    |       +-- Bearbeiten / Löschen (Löschen mit Rückfrage)
    +-- Beitragsverlauf je Kostenart (erkennbare Entwicklung über die Jahre)
    +-- Leerer Zustand ("Noch keine laufenden Kosten hinterlegt")
```

**Wichtig für die Reihenfolge:** Dieses Feature legt den Kosten-Bereich samt Unterreitern an. PROJ-26 und PROJ-27 hängen sich später nur noch ein. Sie sollten deshalb **nach** PROJ-25 gebaut werden, nicht parallel.

### B) Datenmodell

**Neu: Laufende Kosten.** Jeder Eintrag gehört zu genau einem Fahrzeug und hält fest:

- Eindeutige Kennung und Zugehörigkeit zum Fahrzeug
- Wer den Eintrag erfasst hat (für geteilte Fahrzeuge)
- Kostenart — aus einer festen Liste: Versicherung, Kfz-Steuer, Unterstellung, Clubbeitrag
- Betrag **pro Zahlungsintervall**, als ganzzahliger Centbetrag
- Zahlungsintervall: jährlich, halbjährlich, vierteljährlich oder monatlich
- Gültigkeitszeitraum: von / bis
- Optional: Anbieter oder Bezeichnung, Notiz
- Zeitpunkt der Erfassung und der letzten Änderung

**Bewusst nicht gespeichert:** die monatliche Umlage und die Einordnung als Stand- oder Fahrtkosten. Begründung unter C1 und C5.

**Speicherort:** Datenbank (Supabase), Zugriffsschutz über dieselben Regeln wie beim Scheckheft und Tankbuch.

### C) Tech-Entscheidungen

**C1 — Die Umlage wird berechnet, nicht gespeichert.**
Korrigiert jemand einen Beitrag rückwirkend, müssten gespeicherte Monatswerte über den gesamten Zeitraum nachgezogen werden. Schlägt das einmal fehl, stehen dauerhaft falsche Zahlen in der Auswertung, ohne dass es jemand bemerkt. Die Datenmenge ist winzig — wenige Einträge pro Fahrzeug und Jahr —, das Neuberechnen also praktisch kostenlos. Dieselbe Überlegung liegt bereits der Verbrauchsberechnung in PROJ-24 zugrunde.

**C2 — Der Betrag ist der Betrag *pro Zahlungsintervall*, nicht der Gesamtbetrag.**
Das klingt selbstverständlich, ist aber die wahrscheinlichste Fehlerquelle im ganzen Feature: „600 € jährlich über 12 Monate" und „50 € monatlich über 12 Monate" müssen dieselbe Monatsbelastung ergeben. Die Beschriftung im Formular muss das eindeutig machen, und die Umlage muss das Intervall berücksichtigen — sonst weicht die Auswertung je nach Eingabeform um den Faktor 12 ab.

**C3 — Die Kostenarten sind in der Datenbank abgesichert.**
Die Datenbank kennt die erlaubten Werte und weist alles andere ab — wie bereits bei Scheckheft, Dokumenten und Tankbuch. Eine neue Kostenart erfordert eine einzeilige Datenbankänderung; die Auswertung bleibt davon unberührt, weil sie über die Kostenart hinweg arbeitet und keine festen Spalten kennt. Die Alternative — Prüfung nur in der Anwendung — hätte eine Migration gespart, aber ein Tippfehler hätte stillschweigend eine neue Kostenart erzeugt, die in keiner Auswertung auftaucht.

**C4 — Ein Bereich „Kosten" statt drei Navigationseinträge.**
Die Fahrzeug-Navigation hat bereits sechs Einträge und ist auf dem Handy nur durch seitliches Scrollen vollständig erreichbar. Drei weitere hätten sie auf neun gebracht. Stattdessen ein Eintrag mit Unterreitern: Die drei Kosten-Features gehören fachlich zusammen und sind so auch sichtbar gruppiert. Ob das Tankbuch später ebenfalls dorthin wandert, bleibt offen.

**C5 — Stand- oder Fahrtkosten ist eine Eigenschaft der Kostenart, nicht des Eintrags.**
Versicherung ist immer Standkosten, unabhängig davon, wer sie wann erfasst. Die Zuordnung gehört deshalb in die Anwendung und nicht als Feld an jeden einzelnen Datensatz — sonst könnten zwei Einträge derselben Kostenart widersprüchlich klassifiziert sein.

**C6 — Überlappungen werden gemeldet, nicht verhindert.**
Zwei Versicherungsbeiträge für denselben Monat deuten meist auf einen Fehler hin — aber nicht immer: Bei einem Wechsel mit Übergangsfrist kann es korrekt sein. Deshalb Warnung mit Bestätigung statt Blockade. Die Auswertung in PROJ-27 muss eine bestehende Überlappung offenlegen, statt sie still zu summieren. **Zeiträume verschiedener Kostenarten dürfen sich frei überlappen** — Winterlager und Saisonkennzeichen laufen sogar typischerweise gegenläufig.

**C7 — Kein eigener API-Endpunkt.**
Wie bei Scheckheft und Tankbuch wird direkt aus der Oberfläche gespeichert, abgesichert über Zugriffsregeln in der Datenbank. Kein Sonderfall in Sicht, der eine eigene Schnittstelle rechtfertigen würde.

**C8 — Beträge als ganze Cent.**
Wie überall im Projekt. Bei einer Umlage, die durch die Monatszahl teilt, sind Rundungsfehler sonst vorprogrammiert und summieren sich in der Jahresauswertung auf.

### D) Abhängigkeiten

**Keine neuen Pakete.** Formular-, Dialog-, Auswahl- und Datumsbausteine sind vorhanden; die Diagrammkomponente wurde bereits mit PROJ-24 ergänzt und steht für den Beitragsverlauf zur Verfügung, falls `/frontend` ihn grafisch statt als Liste umsetzen möchte.

### F) Implementierungsnotizen — Frontend (2026-07-31)

**Angelegte Dateien**

| Datei | Inhalt |
|---|---|
| `src/lib/validations/recurring-cost.ts` | Zod-Schema, Kostenarten, Zahlungsintervalle, Stand-/Fahrtkosten-Zuordnung |
| `src/lib/recurring-costs.ts` | Umlage, Überlappungserkennung, Kennzahlen (reine Funktionen) |
| `src/lib/recurring-costs.test.ts` | 31 Unit-Tests |
| `src/components/recurring-cost-form.tsx` | Erfassungs- und Bearbeitungsdialog |
| `src/components/recurring-cost-list.tsx` | Kennzahlen, Gruppierung nach Kostenart, Liste |
| `src/components/cost-area-nav.tsx` | Unternavigation des Kosten-Bereichs |
| `src/app/vehicles/[id]/kosten/page.tsx` | Server-Seite mit Rechteprüfung |

**Geänderte Dateien:** `src/components/vehicle-profile-nav.tsx` (Navigationseintrag „Kosten")

**Präzisierungen gegenüber dem Entwurf**

- **Die Umlage rechnet in zwei Schritten** (C2): erst wie oft der Betrag im Zeitraum fällig wird — aufgerundet, weil ein angebrochenes Intervall trotzdem voll bezahlt wird —, dann Gesamtbetrag geteilt durch die Monate. Damit liefern alle vier Intervalle über zwölf Monate dieselbe Monatsbelastung, und ein Jahresbetrag über eine Sieben-Monats-Saison verteilt sich korrekt auf sieben Monate. Beides ist durch Tests abgedeckt.
- **Die Jahreskennzahl ist nicht „Monatsbelastung mal zwölf".** Ein Saisonvertrag über sieben Monate hat eine hohe Monatsbelastung, fällt aber nur sieben Monate an — hochgerechnet ergäbe das einen deutlich zu hohen Jahreswert. Stattdessen wird je Eintrag gezählt, wie viele seiner Monate ins Kalenderjahr fallen. Durch einen Test abgesichert.
- **Die Unternavigation zeigt vorerst keinen Reiter.** Solange nur „Laufende Kosten" existiert, wäre ein einzelner Reiter sinnlos und deaktivierte Reiter für PROJ-26/27 würden Funktionen versprechen, die es nicht gibt. Die Leiste erscheint automatisch, sobald ein zweiter Reiter eingetragen wird — die Stellen dafür stehen auskommentiert im Code.
- **Löschrecht:** nur der Besitzer, analog zum Tankbuch. Eingeladene Mitglieder mit Schreibrecht dürfen anlegen und bearbeiten.
- **Vorbelegung Versicherung:** Bei Kostenart „Versicherung" wird `vehicles.insurance_company` als Anbieter vorgeschlagen, aber nur beim Anlegen und nur solange das Feld leer ist.

**Noch nicht lauffähig:** Die Tabelle `recurring_costs` existiert noch nicht. Die Seite lädt und zeigt den leeren Zustand, Speichern schlägt fehl, bis `/backend` Tabelle und Zugriffsregeln angelegt hat.

### G) Implementierungsnotizen — Backend (2026-07-31)

**Migration:** `supabase/migrations/20260731_create_recurring_costs.sql` — **angewendet am 2026-07-31**

**Tabelle `recurring_costs`** (12 Spalten): `vehicle_id` mit ON DELETE CASCADE, `cost_type` und `payment_interval` jeweils gegen eine feste Werteliste geprüft, `amount_cents` als Ganzzahl, Gültigkeitszeitraum, optional `provider`/`notes`, Zeitstempel und `created_by`.

**Index:** zusammengesetzt auf `(vehicle_id, valid_from DESC)` — bedient Fremdschlüsselzugriff und Sortierung der Seite in einem.

**Zusätzlicher Constraint:** `valid_to > valid_from` als Prüfregel in der Datenbank. Anders als „Datum nicht in der Zukunft" (Tankbuch) lässt sich das abbilden, weil nur zwei Spalten verglichen werden und keine Funktion im Spiel ist. Damit ist die Regel doppelt abgesichert — im Zod-Schema und in der Datenbank.

**RLS-Policies** (4, über `get_user_vehicle_role`):

| Operation | Wer |
|---|---|
| SELECT | alle mit Fahrzeugzugriff |
| INSERT | Besitzer und Werkstatt |
| UPDATE | Besitzer und Werkstatt |
| DELETE | **nur Besitzer** — laufende Kosten enthalten Vertrags- und Beitragsdaten des Halters, daran hat eine eingeladene Werkstatt kein berechtigtes Interesse |

**Keine API-Route** — bewusst, gemäß Tech Design C7. Geschrieben wird direkt aus der Oberfläche, abgesichert durch RLS. Route-Integrationstests entfallen damit; die Fachlogik ist über 31 Unit-Tests abgedeckt.

**Gegen die Datenbank verifiziert:**

| Prüfung | Ergebnis |
|---|---|
| Schema | RLS aktiv, 4 Policies, 2 Indexe, 1 Trigger |
| Supabase-Security-Advisors | keine Meldung zu `recurring_costs` |
| Schreibtest mit Formular-Payload | erfolgreich |
| Fremder Nutzer: sehen / ändern / löschen | **0 / 0 / 0 Zeilen** |
| Fremder Nutzer: anlegen auf fremdem Fahrzeug | **abgewiesen** (`42501`) |
| **Gegenprobe Besitzer: sehen / ändern** | **1 / 1 Zeile** |
| Zeitraum-Constraint („bis" vor „von") | **abgewiesen** (`23514`) |
| Testdaten entfernt | Tabelle danach 0 Zeilen |

**Nebenbefund:** `amount_cents` ist `INTEGER` und kommt als Zahl zurück — die String-Falle aus PROJ-24 (`NUMERIC`) greift hier nicht. `normalizeRecurringCost` bleibt trotzdem als Absicherung bestehen, kostet nichts und schützt, falls der Typ je wechselt.

### E) Offene Punkte für die Umsetzung

- Darstellungsform des Beitragsverlaufs (Liste oder Diagramm) — Entscheidung in `/frontend`
- Ob der Kosten-Bereich zum Premium-Umfang nach PROJ-8 gehört, ist eine Produktentscheidung und hier bewusst nicht vorweggenommen
- Ob das Tankbuch später in den Kosten-Bereich einzieht — sinnvoll, aber eine eigene Entscheidung, die eine bestehende, bereits ausgelieferte Route verschieben würde

## QA Test Results

**Getestet:** 2026-07-31
**Tester:** QA Engineer (AI)

### Reichweite

Anders als bei PROJ-24 stand die E2E-Infrastruktur diesmal von Anfang an: Testnutzer, Wegwerf-Fahrzeug und Anmelde-Setup existieren bereits. Die Oberfläche wurde deshalb **in der laufenden Anwendung** geprüft, nicht nur aus dem Code abgeleitet.

**Nicht geprüft:** Cross-Browser über Chromium und Mobile Safari hinaus, Darstellung auf Tablet-Breite, und der Beitragsverlauf über mehrere Jahre (dafür bräuchte es Einträge aus Vorjahren).

### Acceptance Criteria

| # | Kriterium | Status | Nachweis |
|---|---|---|---|
| 1 | Eintrag anlegen mit allen Pflichtfeldern | ✅ | E2E |
| 2 | Zahlungsintervall wählbar (4 Stufen) | ✅ | E2E (alle vier durchgespielt) |
| 3 | Optionale Felder Anbieter, Notiz | ✅ | E2E |
| 4 | Versicherungsgesellschaft wird vorbelegt | ✅ | E2E |
| 5 | Beträge in Cent gespeichert, Eingabe in Euro | ✅ | Schreibtest gegen die Datenbank |
| 6 | Betrag wird auf die Monate umgelegt | ✅ | E2E + 31 Unit-Tests |
| 7 | Abweichende Zeiträume korrekt behandelt | ✅ | Unit-Test (7-Monats-Saison) |
| 8 | Mehrere Zeiträume je Kostenart (Historie) | ✅ | Unit-Test |
| 9 | Übersicht gruppiert nach Kostenart | ✅ | E2E |
| 10 | Summe pro Monat und pro Jahr | ✅ | E2E |
| 11 | Beitragsverlauf je Kostenart erkennbar | ⚠️ | Gruppierung und Sortierung per Unit-Test; mehrjähriger Verlauf nicht mit echten Daten gesehen |
| 12 | Bearbeiten und Löschen mit Bestätigung | ✅ | E2E |
| 13 | Leerer Zustand | ✅ | E2E |
| 14 | Validierung Betrag und Zeitraum | ✅ | Zod + **Datenbank-Constraint** (`23514` nachgewiesen) |
| 15 | Warnung bei Überlappung derselben Kostenart | ✅ | E2E |
| 16 | Stand-/Fahrtkosten-Klassifizierung | ✅ | Code-Review — liegt bewusst im Code, nicht am Datensatz |
| 17 | Zugriff folgt den Rollen | ✅ | **RLS-Test gegen die Datenbank mit Gegenprobe** |
| 18 | Über die Fahrzeug-Navigation erreichbar | ✅ | E2E |

**17 von 18 belastbar verifiziert**, 1 teilweise.

### Sicherheitsaudit

Durchgeführt im Rahmen von `/backend`, hier zusammengefasst:

| Test | Ergebnis |
|---|---|
| Fremder Nutzer: sehen / ändern / löschen | **0 / 0 / 0 Zeilen** |
| Fremder Nutzer: anlegen auf fremdem Fahrzeug | **abgewiesen** (`42501`) |
| **Gegenprobe Besitzer: sehen / ändern** | **1 / 1 Zeile** |
| Zeitraum-Constraint in der Datenbank | **abgewiesen** (`23514`) |
| Supabase-Security-Advisors | keine Meldung zu `recurring_costs` |
| XSS über Freitextfelder | kein `dangerouslySetInnerHTML`; alle Ausgaben laufen über JSX-Textknoten und werden escaped |

**Nicht geprüft:** Rate Limiting (projektweit nicht vorhanden).

### Gefundene Mängel

#### BUG-1: Standardzeitraum verleitet zu falschen Eingaben — ✅ BEHOBEN (2026-07-31)
- **Schweregrad:** Medium
- **Fundort:** `src/components/recurring-cost-form.tsx`, Funktion `endOfNextYearIso`
- **Wie gefunden:** Der E2E-Test für die Umlage schlug fehl und zeigte: 1.200 € jährlich ergaben 200 €/Monat statt der erwarteten 100 €.
- **Ursache:** Der Standardzeitraum war **heute bis Jahresende**. Ende Juli sind das nur sechs Monate. Ein Jahresbeitrag verteilte sich dann rechnerisch korrekt auf sechs Monate — aber der Nutzer, dessen Versicherung von Januar bis Dezember läuft, akzeptierte den Vorschlag und erhielt eine **doppelt so hohe Monatsbelastung**, ohne dass etwas offensichtlich falsch aussah.
- **Warum das mehr als Kosmetik war:** Die Zahl ist plausibel und wird nicht hinterfragt. Sie wäre später in die Kostenanalyse (PROJ-27) eingeflossen und hätte dort die Auswertung verfälscht.
- **Fix:** Neue Funktion `defaultPeriod()` liefert **exakt zwölf Kalendermonate** — vom Ersten des laufenden Monats bis zum letzten Tag des elften Folgemonats. Der Monatserste ist nötig, weil die Umlage in ganzen Kalendermonaten rechnet: Ein Zeitraum vom 31.07. bis zum 30.07. des Folgejahres würde 13 Monate berühren, nicht 12.
- **Abgesichert durch einen neuen E2E-Regressionstest**, der prüft, dass die Vorschau „12 Monate" ausweist und alle vier Zahlungsintervalle bei gleichwertigen Jahreskosten denselben Monatswert liefern.

#### BUG-2: Hilfsfunktion trägt einen irreführenden Namen — ✅ BEHOBEN (2026-07-31)
- **Schweregrad:** Low
- `endOfNextYearIso()` lieferte das Ende des **laufenden** Jahres, nicht des nächsten. Die Funktion ist mit dem Fix zu BUG-1 entfallen.

#### HINWEIS-1: Beitragsverlauf über Jahre nicht mit echten Daten gesehen
- Gruppierung und Sortierung sind per Unit-Test abgesichert, aber es gab im Test nie Einträge aus mehreren Jahren. Ob der Verlauf in der Oberfläche als solcher erkennbar ist, bleibt offen.

### Automatisierte Tests

- **Unit-Tests:** 372 grün, davon **31 für die Umlage-Logik**. Die 4 roten (`auth.test.ts` ×3, `milestone.test.ts` ×1) sind vorbestehend und unabhängig von diesem Feature.
- **E2E-Tests:** `tests/PROJ-25-kosten.spec.ts` (4 Tests × 2 Browser) und `tests/PROJ-25-kosten-crud-auth.spec.ts` (13 Tests, angemeldet, schreibend) — **22 grün**.
- **Testdaten:** vollständig entfernt, Tabelle danach 0 Zeilen.

### Zusammenfassung (Stand nach Behebung)

- **Acceptance Criteria:** 17/18 belastbar verifiziert, 1 teilweise, 0 fehlgeschlagen
- **Mängel:** keine offenen Bugs. BUG-1 (Medium) und BUG-2 (Low) behoben, HINWEIS-1 bleibt bestehen.
- **Sicherheit:** bestanden, mit Gegenprobe belegt
- **Tests:** 372 Unit-Tests, 22 E2E-Tests, Build und Lint sauber
- **Produktionsreif:** **JA**

**Empfehlung: freigabefähig.** Der einzige blockierende Befund ist behoben und durch einen Regressionstest abgesichert. Die Oberfläche wurde in der laufenden Anwendung geprüft, nicht nur aus dem Code abgeleitet.

**Was offen bleibt:** HINWEIS-1 — der Beitragsverlauf über mehrere Jahre wurde nie mit echten Daten gesehen, weil es im Test keine Einträge aus Vorjahren gab. Gruppierung und Sortierung sind per Unit-Test abgesichert, die Erkennbarkeit des Verlaufs in der Oberfläche nicht. Ebenfalls ungeprüft: Cross-Browser über Chromium und Mobile Safari hinaus.

## Deployment

- **Deployed:** 2026-07-31
- **Commit:** `ff0d661` — `feat(PROJ-25): Implement Wiederkehrende Kosten`
- **Produktion:** https://www.oldtimer-docs.com
- **Migration:** `20260731_create_recurring_costs.sql` — **bereits angewendet** (verifiziert: Tabelle vorhanden, RLS aktiv, 4 Policies, Zeitraum-Constraint greift)
- **Neue Env-Variablen:** keine. In Vercel ist nichts zu ergänzen.
- **Neue Abhängigkeiten:** keine — alle benötigten Bausteine waren vorhanden, die Diagrammkomponente kam bereits mit PROJ-24

### Vor dem Deployment geprüft

| Punkt | Ergebnis |
|---|---|
| `npm run build` | ✅ erfolgreich |
| `npm run lint` | ⚠️ 2 Fehler — beide vorbestehend in `cookie-consent-banner.tsx:69` und `landing-page.tsx:133`, unverändert und bereits in Produktion |
| QA freigegeben | ✅ Status Approved, 17/18 Kriterien belastbar verifiziert |
| Critical/High-Fehler | ✅ keine; beide gefundenen Bugs (1 Medium, 1 Low) vor dem Deployment behoben |
| Env-Variablen dokumentiert | ✅ keine neuen |
| Keine Geheimnisse im Commit | ✅ Staged-Diff auf Muster geprüft, 0 Treffer |
| Migration angewendet | ✅ |

### Bewusst nicht getan

- **Kein Feature-Test in der Produktion.** Die 22 E2E-Tests liefen gegen `localhost`. Verifiziert ist, dass die Produktion erreichbar ist und der Build durchlief — nicht, dass der Kosten-Bereich dort im eingeloggten Zustand funktioniert.
- **Kein Lighthouse-Lauf**, keine Änderung an Security-Headern oder Fehler-Tracking — bereits eingerichtet und von diesem Feature nicht berührt.

---

## Nachtrag: Zugriff auf den Besitzer beschränkt (2026-08-01)

Im Rahmen von PROJ-27 entschieden und umgesetzt: **Laufende Kosten sind nur noch für den Besitzer sichtbar und bearbeitbar** — Mitglieder, auch Werkstätten, haben keinen Zugriff mehr.

Grund: Kosten sind sensibler als die Wartungshistorie. Eine eingeladene Werkstatt soll nicht sehen, was der Besitzer anderswo bezahlt hat. Die Beschränkung nur auf die Auswertung in PROJ-27 zu legen wäre wirkungslos gewesen, weil die Beträge hier eine Klickebene tiefer offenstanden.

- Migration: `20260801_restrict_cost_tables_to_owner.sql` — alle vier Regeln auf `recurring_costs` auf `besitzer`
- Seite: Mitglieder bekommen `notFound()` statt einer leeren Liste
- **Tankbuch und Scheckheft bleiben unberührt** — dafür existiert die Werkstatt-Rolle
- Zum Zeitpunkt der Umstellung gab es in der Produktion keine einzige Mitgliedschaft; kein Nutzer hat einen Zugriff verloren
- Verifiziert: Werkstatt sieht 0 Zeilen und kann nicht schreiben, Gegenprobe Besitzer 1/1/1; E2E von PROJ-25 und PROJ-26 danach 45/45 grün
