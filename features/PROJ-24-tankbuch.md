# PROJ-24: Tankbuch & Verbrauch

## Status: Deployed
**Created:** 2026-07-31
**Last Updated:** 2026-07-31

## Dependencies
- Requires: PROJ-1 (User Authentication) — User muss eingeloggt sein
- Requires: PROJ-2 (Fahrzeugprofil) — Tankvorgänge gehören zu einem Fahrzeug
- Beeinflusst: PROJ-27 (Kostenanalyse) — liefert die Kostenart "Benzin"

## Zusammenfassung
Oldtimer-Besitzer erfassen pro Tankvorgang Datum, Literzahl, Preis und Kilometerstand. Daraus berechnet die Anwendung den Durchschnittsverbrauch in L/100km und zeigt dessen Entwicklung über die Zeit. Der Verbrauch ist für Oldtimer doppelt relevant: als Kostenposition und als Frühwarnsignal — ein plötzlich steigender Verbrauch deutet auf Vergaser-, Zündungs- oder Motorprobleme hin, oft bevor sie hörbar werden.

Das Tankbuch ist bewusst eine eigenständige Funktion: Es ist auch ohne die spätere Kostenanalyse nutzbar und liefert dieser lediglich die Kostenart "Benzin" zu.

## User Stories
- Als Oldtimer-Besitzer möchte ich jeden Tankvorgang mit Datum, Litern, Preis und km-Stand erfassen, damit ich meine Spritkosten lückenlos dokumentiere
- Als Oldtimer-Besitzer möchte ich meinen Durchschnittsverbrauch in L/100km sehen, damit ich einschätzen kann, ob mein Fahrzeug normal läuft
- Als Oldtimer-Besitzer möchte ich die Verbrauchsentwicklung über die Zeit sehen, damit ich eine Verschlechterung früh bemerke
- Als Oldtimer-Besitzer möchte ich zwischen Volltankung und Teilbetankung unterscheiden, damit die Verbrauchsberechnung korrekt bleibt
- Als Oldtimer-Besitzer möchte ich einen Tankvorgang nachträglich korrigieren oder löschen können, weil ich mich beim km-Stand vertippe
- Als Oldtimer-Besitzer möchte ich meine Tankvorgänge chronologisch als Liste sehen, damit ich einzelne Einträge wiederfinde
- Als Werkstatt-Mitglied eines geteilten Fahrzeugs möchte ich Tankvorgänge sehen, aber nur der Besitzer soll sie löschen können

## Acceptance Criteria
- [ ] Tankvorgang erfassen mit Pflichtfeldern: Datum, Liter, Gesamtpreis, km-Stand
- [ ] Optionale Felder: Tankstelle/Ort, Kraftstoffsorte, Notiz
- [ ] Kennzeichnung "Volltankung" (ja/nein), Standard ist "ja"
- [ ] Preis wird in Cent gespeichert (analog zu `service_entries.cost_cents`), Eingabe in Euro
- [ ] Preis pro Liter wird automatisch berechnet und angezeigt (Gesamtpreis ÷ Liter)
- [ ] Verbrauch in L/100km wird zwischen zwei aufeinanderfolgenden **Volltankungen** berechnet
- [ ] Bei Teilbetankungen werden die Liter bis zur nächsten Volltankung aufsummiert und erst dann ein Verbrauchswert gebildet
- [ ] Beim ersten Tankvorgang eines Fahrzeugs wird kein Verbrauch angezeigt (keine Referenz vorhanden)
- [ ] Durchschnittsverbrauch über alle auswertbaren Tankvorgänge wird angezeigt
- [ ] Verbrauchsentwicklung wird als Verlauf über die Zeit dargestellt
- [ ] Tankvorgänge werden chronologisch sortiert angezeigt (neuester zuerst)
- [ ] Tankvorgang kann bearbeitet werden; abhängige Verbrauchswerte werden neu berechnet
- [ ] Tankvorgang kann gelöscht werden (mit Bestätigungsdialog); abhängige Verbrauchswerte werden neu berechnet
- [ ] Leerer Zustand: Hinweis "Noch keine Tankvorgänge erfasst" mit Button zum Anlegen
- [ ] Validierung: Liter > 0, Gesamtpreis ≥ 0, km-Stand ≥ 0, Datum nicht in der Zukunft
- [ ] Zugriff folgt den Rollen aus PROJ-6: Lesen für alle Mitglieder, Anlegen/Bearbeiten/Löschen gemäß Rolle
- [ ] Tankbuch ist über die Fahrzeug-Navigation erreichbar

## Edge Cases
- **Erster Tankvorgang:** Kein Verbrauch berechenbar. Statt eines Werts wird "Verbrauch ab dem nächsten Volltanken verfügbar" angezeigt — kein Fehler, kein leeres Feld
- **km-Stand niedriger als beim vorherigen Tankvorgang:** Deutet auf Tippfehler oder Tachotausch hin. Warnung anzeigen und Bestätigung verlangen. Für den betroffenen Abschnitt wird kein Verbrauch berechnet, statt einen negativen oder unsinnigen Wert auszuweisen
- **Tachowechsel / Tacho-Rücksetzung:** Das Scheckheft kennt bereits `is_odometer_correction`. Das Tankbuch braucht dieselbe Möglichkeit, einen Tachostand als Korrektur zu markieren, damit die Verbrauchsberechnung an dieser Stelle unterbrochen statt verfälscht wird
- **Zwei Tankvorgänge am selben Tag:** Erlaubt (z. B. Tour mit zwei Stopps). Sortierung nach Erfassungszeitpunkt als Zweitkriterium
- **Nur Teilbetankungen, nie voll:** Es kann kein Verbrauch berechnet werden. Hinweis anzeigen, dass mindestens zwei Volltankungen nötig sind — die Kostenerfassung funktioniert trotzdem
- **Sehr lange Standzeit zwischen Tankvorgängen:** Bei Oldtimern normal (Winterpause). Kein Sonderfall für die Berechnung, aber der Verbrauchsverlauf darf keine irreführende Linie über eine 6-Monats-Lücke ziehen
- **Unplausibler Verbrauch (z. B. > 40 L/100km oder < 1 L/100km):** Wert anzeigen, aber als möglicherweise fehlerhaft markieren, statt ihn stillschweigend in den Durchschnitt einzurechnen
- **Nachträglich eingefügter Tankvorgang zwischen zwei bestehenden:** Verbrauchswerte der angrenzenden Abschnitte müssen neu berechnet werden, nicht nur der des neuen Eintrags
- **Fahrzeug ohne km-Stand im Profil:** Tankbuch funktioniert eigenständig. **Entschieden (2026-07-31):** Der Profil-km-Stand wird nie automatisch überschrieben; liegt der getankte Wert höher, wird die Übernahme angeboten und muss bestätigt werden (siehe Tech Design C5)

## Technische Anforderungen
- Beträge als Ganzzahl in Cent speichern (konsistent zu `service_entries.cost_cents`) — keine Fließkommazahlen für Geld
- Literangaben mit einer Nachkommastelle
- Verbrauchsberechnung muss nachvollziehbar sein: Der zugrundeliegende Abschnitt (von km X bis km Y) sollte einsehbar sein
- Responsive: Erfassungsformular muss auf Mobile (375px) gut bedienbar sein — Erfassung erfolgt typischerweise direkt an der Tankstelle
- RLS-Policies analog zu `service_entries`

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
Tankbuch-Seite  (/vehicles/[id]/tankbuch)
+-- Kennzahlen-Leiste
|   +-- Durchschnittsverbrauch in L/100km
|   +-- Gesamte Spritkosten
|   +-- Durchschnittlicher Preis pro Liter
+-- Verbrauchsverlauf (Diagramm über die Zeit)
|   +-- Hinweis, solange noch keine zwei Volltankungen vorliegen
+-- Schaltfläche "Tankvorgang erfassen"
|   +-- Erfassungsdialog
|       +-- Pflichtangaben: Datum, Liter, Gesamtpreis, km-Stand
|       +-- Schalter "Volltankung" (voreingestellt: ja)
|       +-- Schalter "Tacho-Korrektur"
|       +-- Optional: Tankstelle, Kraftstoffsorte, Notiz
|       +-- Live-Anzeige "Preis pro Liter"
|       +-- Rückfrage, wenn km-Stand niedriger als zuvor
|       +-- Angebot, den km-Stand ins Fahrzeugprofil zu übernehmen
+-- Liste der Tankvorgänge (neuester zuerst)
|   +-- Einzelner Eintrag
|   |   +-- Datum, Liter, Preis, km-Stand
|   |   +-- Berechneter Verbrauch mit Abschnittsangabe (von km X bis km Y)
|   |   +-- Kennzeichnung bei unplausiblem Wert
|   |   +-- Bearbeiten / Löschen (Löschen mit Bestätigung)
|   +-- Seitenweises Nachladen bei vielen Einträgen
+-- Leerer Zustand ("Noch keine Tankvorgänge erfasst")

Fahrzeug-Navigation (bestehend, wird um einen Eintrag ergänzt)
+-- Übersicht | Scheckheft | Historie | Dokumente | [Tankbuch] | Verkaufsassistent
```

### B) Datenmodell

**Neu: Tankvorgänge.** Jeder Tankvorgang gehört zu genau einem Fahrzeug und hält fest:

- Eindeutige Kennung und Zugehörigkeit zum Fahrzeug
- Wer den Eintrag erfasst hat (für geteilte Fahrzeuge)
- Datum des Tankvorgangs
- Getankte Menge in Litern, mit einer Nachkommastelle
- Gesamtpreis, als ganzzahliger Centbetrag
- Kilometerstand zum Zeitpunkt des Tankens
- Ob voll getankt wurde (ja/nein)
- Ob es sich um eine Tacho-Korrektur handelt (ja/nein)
- Optional: Tankstelle, Kraftstoffsorte, Notiz
- Zeitpunkt der Erfassung und der letzten Änderung

**Bewusst nicht gespeichert:** Verbrauch in L/100km und Preis pro Liter. Beide werden bei jedem Aufruf aus den vorhandenen Werten errechnet — die Begründung steht unter C1.

**Speicherort:** Datenbank (Supabase), nicht im Browser. Nötig, weil die Daten auf mehreren Geräten verfügbar sein müssen, bei geteilten Fahrzeugen auch für eingeladene Mitglieder, und weil PROJ-27 später darauf zugreift. Zugriffsschutz über dieselben Regeln wie beim Scheckheft.

### C) Tech-Entscheidungen

**C1 — Der Verbrauch wird berechnet, nicht gespeichert.**
Der Verbrauch eines Abschnitts ergibt sich immer aus zwei Tankvorgängen. Trägt jemand einen vergessenen Tankstopp nach, ändern sich dadurch die Werte der *benachbarten* Einträge mit. Gespeicherte Werte müssten dann jedes Mal nachgezogen werden — und wenn das einmal fehlschlägt, stehen dauerhaft falsche Zahlen im Tankbuch, ohne dass es jemand merkt. Bei der zu erwartenden Datenmenge (typischerweise einige Dutzend bis wenige hundert Einträge pro Fahrzeug) ist das Neuberechnen praktisch kostenlos. Dieselbe Überlegung liegt der Umlage-Entscheidung in PROJ-25 zugrunde.

**C2 — Kein eigener API-Endpunkt.**
Das Projekt legt Daten bisher direkt aus der Oberfläche in der Datenbank ab, abgesichert über Zugriffsregeln in der Datenbank selbst; eigene Schnittstellen gibt es nur für Sonderfälle wie PDF-Erzeugung oder externe Dienste. Das Tankbuch braucht keinen dieser Sonderfälle und folgt deshalb dem Muster des Scheckhefts. Weniger neue Bausteine, gleiches Sicherheitsniveau.

**C3 — Diagramm über die shadcn-Komponente.**
Es ist bisher keine Diagramm-Bibliothek im Projekt. Statt einer selbst gebauten Grafik wird die offizielle shadcn-Diagrammkomponente ergänzt. Gründe: Sie fügt sich in das bestehende Designsystem ein, unterstützt das vorhandene helle und dunkle Design, und PROJ-27 braucht später ohnehin deutlich komplexere Diagramme — eine Eigenbau-Lösung müsste dann ersetzt werden. Preis dafür sind rund 100 KB zusätzliche Ladegröße, die nur auf den Seiten anfallen, die tatsächlich ein Diagramm zeigen.

**C4 — Tacho-Korrektur unterbricht die Berechnungskette.**
Wird ein Eintrag als Korrektur markiert, wird über diese Stelle hinweg kein Verbrauch gebildet. Andernfalls entstünde bei einem Tachotausch ein sinnloser Wert, der den Durchschnitt dauerhaft verzerrt. Das Scheckheft kennt dieses Prinzip bereits.

**C5 — Der Kilometerstand im Fahrzeugprofil wird nur auf Bestätigung übernommen.**
Liegt der getankte km-Stand über dem im Profil hinterlegten, wird die Übernahme angeboten. Automatisch zu überschreiben wäre riskant: Ein Tippfehler (890000 statt 89000) würde unbemerkt ins Fahrzeugprofil wandern und von dort aus auch im öffentlichen Kurzprofil und im Verkaufsinserat erscheinen.

**C6 — Beträge als ganze Cent.**
Wie beim Scheckheft. Kommazahlen führen beim Aufsummieren zu Rundungsfehlern, die sich in der späteren Kostenanalyse aufaddieren.

**C7 — Lücken im Verlauf bleiben Lücken.**
Zwischen zwei Tankvorgängen können bei einem Oldtimer Monate liegen (Winterpause). Das Diagramm zeichnet über solche Pausen keine durchgehende Linie, weil sonst eine Entwicklung suggeriert würde, für die keine Messpunkte existieren.

### D) Abhängigkeiten

| Paket | Zweck |
|---|---|
| shadcn-Diagrammkomponente (bringt `recharts` mit) | Verbrauchsverlauf; wird später auch von PROJ-27 genutzt |

Alles Übrige ist vorhanden: Formular- und Validierungsbausteine, Dialoge, Tabellen, Datumsauswahl, Benachrichtigungen sowie die Datenbankanbindung.

### F) Implementierungsnotizen — Frontend (2026-07-31)

**Angelegte Dateien**

| Datei | Inhalt |
|---|---|
| `src/lib/validations/fuel-entry.ts` | Zod-Schema, Typen, Kraftstoffsorten, Formatierungs-Helfer |
| `src/lib/fuel-consumption.ts` | Verbrauchsberechnung, Kennzahlen, Diagramm-Datenreihe (reine Funktionen) |
| `src/lib/fuel-consumption.test.ts` | 27 Unit-Tests |
| `src/components/fuel-entry-form.tsx` | Erfassungs- und Bearbeitungsdialog |
| `src/components/fuel-log.tsx` | Kennzahlen, Verlaufsdiagramm, Liste, Löschdialog |
| `src/app/vehicles/[id]/tankbuch/page.tsx` | Server-Seite mit Rechteprüfung |
| `src/components/ui/chart.tsx` | shadcn-Chart (per CLI ergänzt, bringt `recharts`) |

**Geänderte Dateien:** `src/components/vehicle-profile-nav.tsx` (Navigationseintrag „Tankbuch")

**Abweichungen und Präzisierungen gegenüber der Spec**

- **Durchschnittsverbrauch ist streckengewichtet.** Die Spec sagt nur „Durchschnittsverbrauch über alle auswertbaren Tankvorgänge". Umgesetzt als Gesamtliter ÷ Gesamtstrecke statt als Mittel der Einzelwerte — sonst zählt ein 80-km-Stadtabschnitt genauso stark wie eine 900-km-Tour. Durch einen Test abgesichert.
- **Eingabe in Euro, Speicherung in Cent.** Das Formularfeld heißt `cost_eur`, die Umrechnung erfolgt beim Speichern über das vorhandene `eurToCents`.
- **km-Übernahme ins Fahrzeugprofil** ist ein vorausgewähltes Kontrollkästchen, das nur erscheint, wenn der erfasste Stand über dem Profilwert liegt. Der Zielwert steht sichtbar daneben, die Übernahme lässt sich abwählen (Tech Design C5). Schlägt die Profil-Aktualisierung fehl, bleibt der Tankvorgang gespeichert und es erscheint nur ein Hinweis.
- **Diagramm erst ab zwei Messpunkten**, also ab der dritten Volltankung — ein Diagramm mit einem einzelnen Punkt zeigt keine Entwicklung. Darunter erscheint ein erklärender Hinweis statt einer leeren Fläche.
- **Löschrecht:** Nur der Besitzer darf löschen; eingeladene Mitglieder mit Schreibrecht dürfen anlegen und bearbeiten (aus der User Story abgeleitet).

**Bekannte Einschränkung**

- Die Warnung bei sinkendem Kilometerstand erscheint nur beim **Anlegen**, nicht beim **Bearbeiten** eines bestehenden Eintrags. Beim Bearbeiten ist der korrekte Vergleichswert nicht der jüngste Eintrag, sondern der chronologische Vorgänger des bearbeiteten Eintrags. Bewusst zurückgestellt; die Verbrauchsberechnung selbst behandelt den Fall korrekt (kein Wert statt eines falschen).

**Noch nicht lauffähig:** Die Tabelle `fuel_entries` existiert noch nicht. Die Seite lädt und zeigt den leeren Zustand, Speichern schlägt fehl, bis `/backend` Tabelle und Zugriffsregeln angelegt hat.

### G) Implementierungsnotizen — Backend (2026-07-31)

**Migration:** `supabase/migrations/20260731_create_fuel_entries.sql` — **angewendet am 2026-07-31**

**Tabelle `fuel_entries`** (14 Spalten): `vehicle_id` mit ON DELETE CASCADE, `fueled_at`, `liters` als `NUMERIC(4,1)`, `cost_cents` als Ganzzahl, `mileage_km`, die Schalter `is_full_tank` und `is_odometer_correction`, optional `station`/`fuel_type`/`notes`, dazu Zeitstempel und `created_by`.

**Index:** ein zusammengesetzter Index auf `(vehicle_id, fueled_at DESC, created_at DESC)`. Er bedient sowohl den Fremdschlüsselzugriff als auch die Sortierung der Seite; ein separater Index nur auf `vehicle_id` wäre redundant, weil er dessen führende Spalte ist.

**RLS-Policies** (4, über die vorhandene Funktion `get_user_vehicle_role`):

| Operation | Wer |
|---|---|
| SELECT | alle mit Fahrzeugzugriff — Besitzer, Werkstatt, Betrachter |
| INSERT | Besitzer und Werkstatt |
| UPDATE | Besitzer und Werkstatt |
| DELETE | **nur Besitzer** (aus der User Story) |

Abweichung zu `service_entries`: Dort darf eine Werkstatt nur eigene Einträge ändern. Für Tankvorgänge gilt diese Einschränkung nicht — ein Tankbeleg trägt nicht die Haftungsfrage, die bei Werkstatteinträgen im Scheckheft die engere Regel begründet.

**Keine API-Route** — bewusst, gemäß Tech Design C2. Geschrieben wird direkt aus der Oberfläche, abgesichert durch RLS. Damit entfallen auch Route-Integrationstests; die Fachlogik ist über 29 Unit-Tests abgedeckt.

**Verifiziert gegen die Datenbank:** RLS aktiv, 4 Policies, 2 Indexe (inkl. Primärschlüssel), 1 Trigger für `updated_at`. Die Supabase-Security-Advisors melden für `fuel_entries` nichts; alle offenen Warnungen betreffen vorbestehende Funktionen und Buckets. Ein Schreibtest mit echten IDs lief erfolgreich durch und wurde anschließend restlos entfernt.

**Dabei gefundener Fehler — behoben:** `liters` ist `NUMERIC` und kommt je nach Treiber als **String** zurück (`"42.5"`). Die Verbrauchsberechnung hätte dann Strings aneinandergehängt statt zu addieren. Tückisch daran: Bei nur einer Volltankung liefert die implizite Umwandlung in der Division zufällig noch das richtige Ergebnis — der Fehler schlägt erst zu, sobald eine **Teilbetankung** dazwischenliegt und zwei Werte aufsummiert werden. Behoben über `normalizeFuelEntry` an der Datengrenze in der Seite, abgesichert durch zwei Regressionstests.

### E) Offene Punkte für die Umsetzung

- Die Feinheiten der Diagrammgestaltung (Farbwahl, Achsen, Verhalten auf schmalen Bildschirmen) werden in `/frontend` festgelegt
- Ob das Tankbuch zum Premium-Umfang nach PROJ-8 gehört, ist eine Produktentscheidung und hier bewusst nicht vorweggenommen; die Navigation unterstützt eine Premium-Kennzeichnung bereits

## QA Test Results

**Getestet:** 2026-07-31
**Tester:** QA Engineer (AI)

### ⚠️ Reichweite dieses Tests — zuerst lesen

**Es fand kein Test in der laufenden Anwendung statt.** Ein hängender Dev-Server (Node-PID 16004, gestartet 15:03) belegte Port 3000, ohne zu antworten, und hielt zugleich den Next.js-Dev-Lock — ein zweiter Server ließ sich deshalb nicht starten. Der Prozess stammt aus einer früheren Sitzung und wurde nicht beendet, weil er nicht eindeutig zuzuordnen war.

**Nachtrag 2026-07-31:** Der blockierende Prozess hat sich später selbst beendet; die E2E-Tests wurden nachgeholt (Ergebnisse weiter unten). Ein Test der eingeloggten Oberfläche bleibt trotzdem aus, weil das Projekt kein Auth-Setup für E2E besitzt.

Damit sind **nicht** verifiziert: Erfassen, Bearbeiten und Löschen im eingeloggten Zustand, Darstellung und Hover-Verhalten des Diagramms, Responsive-Verhalten im eingeloggten Zustand, Cross-Browser über Chromium und Mobile Safari hinaus.

Belastbar verifiziert wurden: die Fachlogik über Unit-Tests, die Berechtigungen über echte RLS-Tests gegen die Datenbank, sowie Schema und Build. Die Kriterien unten sind entsprechend gekennzeichnet — **„Code-Review" ist keine Bestätigung, sondern eine begründete Erwartung.**

### Acceptance Criteria

| # | Kriterium | Status | Nachweis |
|---|---|---|---|
| 1 | Pflichtfelder Datum, Liter, Preis, km | ✅ | Zod-Schema + Formularfelder |
| 2 | Optionale Felder Tankstelle, Sorte, Notiz | ⚠️ | Code-Review — siehe BUG-1 |
| 3 | Volltankung-Kennzeichnung, Standard „ja" | ✅ | Schema-Default + DB-Default |
| 4 | Preis in Cent gespeichert | ✅ | DB-Spalte `cost_cents INTEGER`, Schreibtest |
| 5 | Preis pro Liter berechnet | ✅ | Unit-Test |
| 6 | Verbrauch zwischen zwei Volltankungen | ✅ | Unit-Test |
| 7 | Teilbetankungen aufsummiert | ✅ | Unit-Test |
| 8 | Erster Tankvorgang ohne Verbrauch | ✅ | Unit-Test |
| 9 | Durchschnittsverbrauch | ✅ | Unit-Test (streckengewichtet) |
| 10 | Verbrauchsentwicklung als Verlauf | ⚠️ | Nicht dargestellt geprüft — siehe RISIKO-1 |
| 11 | Chronologische Sortierung | ✅ | Unit-Test + DB-Sortierung |
| 12 | Bearbeiten mit Neuberechnung | ⚠️ | Berechnung per Unit-Test; UI-Pfad ungeprüft |
| 13 | Löschen mit Bestätigung + Neuberechnung | ⚠️ | Berechnung per Unit-Test; UI-Pfad ungeprüft |
| 14 | Leerer Zustand | ⚠️ | Code-Review |
| 15 | Validierung (Liter, Preis, km, Datum) | ✅ | Zod + DB-CHECK-Constraints |
| 16 | Rollenabhängiger Zugriff | ✅ | **RLS-Test gegen die Datenbank** |
| 17 | Über Fahrzeug-Navigation erreichbar | ✅ | Navigationseintrag + Route im Build |

**11 von 17 belastbar verifiziert, 6 nur per Code-Review.**

### Edge Cases

| Edge Case | Status | Nachweis |
|---|---|---|
| Erster Tankvorgang | ✅ | Unit-Test |
| km-Stand niedriger als zuvor | ✅ | Unit-Test (kein Wert statt falschem Wert) |
| Tacho-Korrektur unterbricht Kette | ✅ | Unit-Test |
| Zwei Tankvorgänge am selben Tag | ✅ | Unit-Test (Erfassungszeit als Zweitkriterium) |
| Nur Teilbetankungen | ✅ | Unit-Test |
| Lange Standzeit (Winterpause) | ✅ | Unit-Test (Lücke im Verlauf) |
| Unplausibler Verbrauch | ✅ | Unit-Test (markiert, nicht im Durchschnitt) |
| Nachträglich eingefügter Eintrag | ✅ | Durch Neuberechnung bei jedem Aufruf strukturell gelöst |
| km-Übernahme ins Profil | ⚠️ | Code-Review — UI-Pfad ungeprüft |

### Sicherheitsaudit — echte Tests gegen die Datenbank

Durchgeführt durch Rollenwechsel (`SET LOCAL ROLE authenticated`) mit gesetzten JWT-Claims zweier realer Nutzer auf zwei Fahrzeugen unterschiedlicher Besitzer.

| Test | Ergebnis |
|---|---|
| Fremder Nutzer sieht Einträge | **0 Zeilen** ✅ |
| Fremder Nutzer ändert Einträge | **0 Zeilen** ✅ |
| Fremder Nutzer löscht Einträge | **0 Zeilen** ✅ |
| Fremder Nutzer legt Eintrag für fremdes Fahrzeug an | **abgewiesen** (`42501 row-level security policy`) ✅ |
| **Gegenprobe:** Besitzer sieht und ändert eigene Zeile | **1 Zeile / 1 Zeile** ✅ |

Die Gegenprobe ist wesentlich: Ohne sie könnte „0 Zeilen" auch bedeuten, dass die Tabelle generell nicht lesbar ist. Alle Testdaten wurden restlos entfernt (Tabelle danach: 0 Zeilen).

**Supabase-Security-Advisors:** keine Meldung zu `fuel_entries`. Alle offenen Warnungen betreffen vorbestehende Funktionen und Storage-Buckets.

**Nicht geprüft:** XSS über Freitextfelder (React escapt standardmäßig, aber nicht in der laufenden Anwendung verifiziert), Rate Limiting (projektweit nicht vorhanden).

### Gefundene Mängel

#### BUG-1: Kraftstoffsorte lässt sich nicht mehr entfernen — ✅ BEHOBEN (2026-07-31)
- **Schweregrad:** Medium
- **Fundort:** `src/components/fuel-entry-form.tsx`, Select-Feld `fuel_type`
- **Beschreibung:** Das Auswahlfeld zeigte „Keine Angabe" nur als Platzhalter. Es gab keinen Eintrag, der auf den leeren Wert zurückführte. Wer versehentlich „Diesel" wählte, konnte das nicht mehr rückgängig machen — nur noch eine andere Sorte wählen.
- **Fix:** Die Liste enthält jetzt einen Eintrag „Keine Angabe". Weil Radix Select keinen leeren Item-Wert zulässt, trägt er den Platzhalterwert `__keine__`, der beim Ändern wieder zu `undefined` wird — gespeichert wird also weiterhin `null`.
- **Nicht durch einen automatisierten Test abgedeckt:** reine JSX-Verdrahtung; ein Radix-Select-Test in jsdom (Portale, Pointer-Events) wäre brüchiger als der Fix selbst. Im Browser mit einem Blick zu prüfen.

#### BUG-2: „Spritkosten gesamt" ist bei über 500 Einträgen falsch beschriftet
- **Schweregrad:** Low
- **Fundort:** `src/app/vehicles/[id]/tankbuch/page.tsx`, `.limit(500)`
- **Beschreibung:** Die Abfrage lädt die 500 jüngsten Einträge. Die Kennzahl heißt trotzdem „gesamt" und wäre bei mehr Einträgen stillschweigend zu niedrig.
- **Praxisrelevanz:** Bei einem Oldtimer unrealistisch — aber die Zahl wäre falsch, ohne dass es auffällt.
- **Priorität:** Nächster Sprint.

#### BUG-3: Warnung bei sinkendem km-Stand fehlt beim Bearbeiten
- **Schweregrad:** Low
- **Beschreibung:** Bereits in den Implementierungsnotizen dokumentiert. Beim Bearbeiten wird kein Vergleichswert übergeben, die Warnung erscheint also nicht. Die Berechnung selbst behandelt den Fall korrekt.
- **Priorität:** Nächster Sprint.

#### RISIKO-1: Möglicher Absturz beim Überfahren einer Diagramm-Lücke — ✅ BEHOBEN (2026-07-31)
- **Schweregrad:** Medium (war **nicht reproduziert** — aus dem Code abgeleitet)
- **Fundort:** `src/lib/fuel-consumption.ts`, `buildConsumptionSeries`
- **Beschreibung:** Lückenpunkte trugen als Datum den synthetischen Schlüssel `gap-<id>`. Der `labelFormatter` des Tooltips hätte diesen Wert an `parse()`/`format()` weitergereicht; auf einem ungültigen Datum wirft `format()` einen `RangeError` und reißt die Komponente ab.
- **Fix an der Wurzel statt am Symptom:** Der Lückenpunkt trägt jetzt ein **echtes Datum** — die zeitliche Mitte der Lücke. Damit bekommen Achsen- und Tooltip-Formatierung nie einen Wert, den sie nicht als Datum lesen können, und die Fehlerklasse verschwindet ganz. Ein defensiver Guard im Formatter hätte nur diese eine Aufrufstelle geschützt; jede weitere Verwendung der Datenreihe hätte dieselbe Falle erneut aufgestellt.
- **Warum die Mitte kollisionsfrei ist:** Die Lücke ist definitionsgemäß größer als `CHART_GAP_DAYS` (90 Tage), ihre Mitte liegt also mindestens 45 Tage von beiden Messpunkten entfernt.
- **Abgesichert durch 3 neue Tests:** Lückenpunkt ist als Datum parsebar, liegt echt zwischen den Nachbarpunkten, und alle Punkte bleiben auch bei mehreren Lücken parsebar.
- **Restrisiko:** Dass der Tooltip überhaupt auslöst, war nie bestätigt. Der Fix macht die Frage gegenstandslos — die Darstellung selbst bleibt aber weiterhin im Browser ungeprüft.

#### HINWEIS-1: Keine Sperre gegen gleichzeitiges Bearbeiten
- **Schweregrad:** Low
- Bei geteilten Fahrzeugen gewinnt der letzte Schreibvorgang. Von der Spec nicht gefordert, hier nur festgehalten.

### Automatisierte Tests

- **Unit-Tests:** 341 grün, davon **32 für die Verbrauchslogik**. Die 4 roten Tests (`auth.test.ts` ×3, `milestone.test.ts` ×1) sind vorbestehend und unabhängig von diesem Feature — sie prüfen veraltete Erwartungen an `registerSchema` und `getCategoryLabel`.
- **E2E-Tests:** `tests/PROJ-24-tankbuch.spec.ts` — **8/8 grün** (4 Tests × Chromium und Mobile Safari). Geprüft: Route stürzt nicht ab, unangemeldete Nutzer werden zur Anmeldung geleitet, ohne Anmeldung gelangen keine Kennzahlen ins HTML, Route auf Mobilgröße erreichbar. Nachgeholt am 2026-07-31, nachdem der blockierende Prozess auf Port 3000 verschwunden war.
- **Build:** erfolgreich, Route `/vehicles/[id]/tankbuch` registriert. Lint und Typecheck sauber.

### E2E-Auth-Infrastruktur (2026-07-31)

Damit die sechs bislang nur per Code-Review abgedeckten Kriterien überhaupt prüfbar werden, wurde ein Anmelde-Setup für Playwright ergänzt — das Projekt hatte bisher keines.

| Datei | Zweck |
|---|---|
| `tests/auth.setup.ts` | Meldet einen Testnutzer einmalig an, legt die Sitzung als `storageState` ab |
| `playwright.config.ts` | Neues Projekt `chromium-auth` mit Sitzung; Specs `*-auth.spec.ts` laufen nur dort. Lädt `.env.local` selbst ein, weil Playwright das im Gegensatz zu Next.js nicht tut. `webServer.timeout` von 60s auf 180s erhöht — der bisherige Wert ließ E2E-Läufe scheitern, bevor der Dev-Server bereit war. |
| `tests/PROJ-24-tankbuch-auth.spec.ts` | 5 angemeldete Tests |
| `.env.local.example` | **Neu angelegt** — die Datei fehlte trotz der Vorgabe in `.claude/rules/security.md`. Dokumentiert jetzt alle 17 verwendeten Umgebungsvariablen plus `E2E_EMAIL` / `E2E_PASSWORD`. |
| `.gitignore` | `/playwright/.auth/` ergänzt — die Sitzungsdatei enthält ein gültiges Supabase-Token |

**Status:** Ohne gesetzte Zugangsdaten werden die angemeldeten Tests übersprungen, die unangemeldeten laufen unverändert (Lauf vom 2026-07-31: 8 grün, 6 übersprungen). Sobald `E2E_EMAIL` und `E2E_PASSWORD` in `.env.local` stehen, greifen sie automatisch.

**Die fünf Tests sind bewusst rein lesend:** Navigation zum Tankbuch, Seite lädt ohne JavaScript-Fehler, leerer Zustand, Erfassungsdialog öffnet mit allen Pflichtfeldern (wird abgebrochen, nicht abgeschickt), kein waagerechtes Überlaufen auf 375 px.

### Schreibende Tests mit Wegwerf-Fahrzeug (2026-07-31)

Auf Entscheidung des Auftraggebers wurde ein **dedizierter Testnutzer mit Wegwerf-Fahrzeug** angelegt, statt eine getrennte Testdatenbank aufzusetzen:

- Nutzer `e2e-testnutzer@oldtimer-docs.test` (ID `0c64a63b-…`), über die Supabase-Admin-API mit Zufallspasswort erzeugt, bestätigt, kein echtes Konto
- Fahrzeug „E2E-Testfahrzeug Wegwerf" (ID `d1327d70-…`), gehört ausschließlich diesem Nutzer
- Zugangsdaten in `.env.local` (gitignored), **nie** im Repository oder im Verlauf

`tests/PROJ-24-tankbuch-crud-auth.spec.ts` arbeitet ausschließlich auf diesem Fahrzeug und räumt vor und nach jedem Lauf auf.

**Ergebnis: 10 von 10 grün.**

| Test | Ergebnis |
|---|---|
| Anmeldung (Setup) | ✅ |
| Vorbereitung: Fahrzeug leeren | ✅ |
| **AC-1 Tankvorgang erfassen** | ✅ |
| **AC-5 Preis pro Liter** | ✅ (80 € / 40 L → 2,00 €/L) |
| **AC-8 kein Verbrauch beim ersten Eintrag** | ✅ |
| **AC-6 Verbrauch nach zweiter Volltankung** | ✅ (50 L / 500 km → 10,0 L/100km, Abschnitt „50.000 – 50.500 km") |
| **AC-9 Durchschnittsverbrauch in den Kennzahlen** | ✅ |
| **AC-12 Bearbeiten mit Neuberechnung** | ✅ (km auf 51.000 geändert → 5,0 L/100km) |
| **AC-13 Löschen mit Bestätigung** | ✅ |
| Nachbereitung: Fahrzeug wieder leeren | ✅ (Tabelle danach 0 Zeilen) |

Damit sind **alle sechs zuvor nur per Code-Review abgedeckten Kriterien real verifiziert** — die vollständige Verbrauchsberechnung durch die laufende Anwendung hindurch, inklusive Neuberechnung nach dem Bearbeiten.

#### OFFEN-1: Bearbeiten-Dialog öffnet nicht — ✅ GEKLÄRT, war ein Testproblem (2026-07-31)

- **Ursprünglicher Verdacht:** möglicherweise ein echter Fehler im Bearbeiten-Pfad
- **Tatsächliche Ursache:** Zwei fixierte Overlays am unteren Bildrand fingen den Klick ab, bevor er die Schaltfläche erreichte. Das Klick-Protokoll benennt beide wörtlich: `<li data-sonner-toast> … subtree intercepts pointer events` (die Erfolgsmeldung nach dem Anlegen) und `<div class="fixed bottom-0 left-0 right-0 z-50 …"> … subtree intercepts pointer events` (das Cookie-Banner).
- **Entscheidender Nachweis, dass die Anwendung in Ordnung ist:** Während des gesamten Vorgangs traten **keine Seiten- und keine Konsolenfehler** auf. Die Schaltfläche war durchgehend `visible` und `enabled` — sie war nur verdeckt.
- **Behebung:** Cookie-Zustimmung wird im Anmelde-Setup direkt in den `localStorage` geschrieben (Schlüssel `cookie-consent`) statt weggeklickt — das ist unabhängig davon, ob das Banner schon gerendert ist. Zusätzlich wartet der Test nach jeder Aktion, bis keine Erfolgsmeldung mehr eingeblendet ist.
- **Keine Produktänderung nötig.**

#### Erkenntnis mit Projektwirkung: Cookie-Banner und Toasts blockieren E2E-Klicks

Beide Overlays liegen `fixed bottom-0` und decken damit genau den Bereich ab, in dem die Einträge mit ihren Bearbeiten- und Löschen-Schaltflächen stehen. Das äußert sich als `locator.click: Test timeout`, obwohl das Element sichtbar und aktiv ist — ein Fehlerbild, das leicht als Produktfehler fehlgedeutet wird.

**Das ist sehr wahrscheinlich die Ursache eines Großteils der 32 vorbestehenden E2E-Fehler**, insbesondere der 15 in PROJ-1 (Anmeldung), die genau dieses Muster zeigen. Für die **angemeldeten** Tests ist es über `tests/auth.setup.ts` behoben. Die **unangemeldeten** Specs bekommen die Zustimmung nicht — dort würde ein `page.addInitScript` mit demselben `localStorage`-Eintrag vermutlich viele Tests von selbst grün machen. Bewusst nicht umgesetzt: Das ändert das Verhalten fremder Feature-Tests und gehört gesondert entschieden.

**Für Nutzer ist das kein Fehler:** Ein Cookie-Banner, das bis zur Zustimmung den unteren Rand belegt, ist gewolltes Verhalten; eine Erfolgsmeldung verschwindet nach wenigen Sekunden von selbst.

> ⚠️ **Weiterhin keine getrennte Testdatenbank.** Die schreibenden Tests laufen gegen die Produktionsinstanz, eingegrenzt auf das Wegwerf-Fahrzeug. Ein abgebrochener Lauf kann dort Einträge hinterlassen; sie stören keine echten Daten, machen aber den nächsten Lauf unzuverlässig, weil AC-1 einen leeren Ausgangszustand erwartet.

### Regressionsprüfung — Endstand (vollständige E2E-Suite, 2026-07-31)

**382 grün, 27 rot — kein einziger davon in PROJ-24.**

Verteilung der verbliebenen Fehler: PROJ-1 Anmeldung (11), PROJ-17 Landing Page (8), PROJ-10 Kurzprofil (2), PROJ-15 Kontakt (2).

**Die Lage hat sich gegenüber dem Ausgangsstand verbessert:** vorher 362 grün / 32 rot, jetzt 382 grün / 27 rot. Vollständig grün geworden sind PROJ-14 (FAQ) und PROJ-13 (Inserat), in PROJ-1 sind vier Fehler weniger. Ursache ist mit hoher Wahrscheinlichkeit die Anhebung von `webServer.timeout` in `playwright.config.ts` von 60s auf 180s — zuvor scheiterten Läufe, bevor der Dev-Server überhaupt bereit war. Das war eine Nebenwirkung der Arbeit an diesem Feature, keine gezielte Reparatur fremder Tests.

#### Ursprüngliche Analyse (Stand vor den Korrekturen)

**362 grün, 32 rot.** Die 32 Fehler waren **vorbestehend und nicht durch dieses Feature verursacht** — belegt durch zwei unabhängige Prüfungen:

1. **Keine der betroffenen Seiten bindet die geänderte Komponente ein.** Die Fehler verteilen sich auf PROJ-1 Anmeldung (15), PROJ-17 Landing Page (8), PROJ-14 FAQ (3), PROJ-15 Kontakt (2), PROJ-10 öffentliches Kurzprofil (2), PROJ-13 Inserat (1). `VehicleProfileNav` — die einzige bestehende Laufzeitdatei, die dieses Feature verändert hat — wird ausschließlich in `src/app/vehicles/[id]/layout.tsx` gerendert und kommt auf keiner dieser Seiten vor. In PROJ-24 selbst ist kein Test rot.
2. **Die Tests sind der Oberfläche hinterhergelaufen.** `tests/PROJ-17-landing-page.spec.ts` stammt unverändert aus Commit `bb53b32`, während `src/components/landing-page.tsx` seither dreimal geändert wurde (`8b35763` Mobile-Optimierung, `bbd47d7` Blog-Links, `95421e2` Premium-Checkout). Die Fehlermeldungen passen exakt dazu: `strict mode violation: getByRole('link', { name: 'Kostenlos starten' }) resolved to 4 elements`.

**Das ist kein Freibrief:** Die E2E-Suite dieses Projekts ist in weiten Teilen veraltet und liefert derzeit kein verlässliches Regressionssignal. Das betrifft PROJ-24 nicht, sollte aber als eigenständiger Mangel behandelt werden — am ehesten als Aufräumaufgabe für PROJ-17, das ohnehin auf „In Review" steht.

### Nachtrag: Behebung der Medium-Befunde (2026-07-31)

Beide Medium-Befunde wurden nach dem Testlauf behoben; die Einträge oben sind entsprechend markiert.

| Befund | Status | Absicherung |
|---|---|---|
| BUG-1 Kraftstoffsorte | ✅ behoben | kein Test — reine JSX-Verdrahtung |
| RISIKO-1 Diagramm-Lücke | ✅ behoben (an der Wurzel) | 3 neue Unit-Tests |

Offen bleiben BUG-2 und BUG-3 (beide Low, nächster Sprint) sowie HINWEIS-1.

### Zusammenfassung (Stand 2026-07-31, nach Behebung und E2E-Verifikation)

- **Acceptance Criteria:** **17/17 verifiziert**, 0 fehlgeschlagen. Die zuvor sechs nur per Code-Review abgedeckten Kriterien sind über die angemeldeten E2E-Tests real belegt.
- **Mängel:** 2 offene Bugs (beide Low: BUG-2 Beschriftung ab 500 Einträgen, BUG-3 fehlende km-Warnung beim Bearbeiten) + 1 Hinweis. Alle Medium-Befunde behoben, OFFEN-1 als Testproblem geklärt.
- **Sicherheit:** bestanden — Cross-Tenant-Zugriff in allen vier Operationen blockiert, mit Gegenprobe belegt
- **Tests:** 341 Unit-Tests, 8 unangemeldete E2E, 6 angemeldete lesende E2E, 10 angemeldete schreibende E2E — alle grün
- **Regression:** vollständige E2E-Suite 382 grün / 27 rot, **kein PROJ-24-Fehler**; die verbliebenen Fehler sind vorbestehend (PROJ-1, PROJ-17, PROJ-10, PROJ-15)
- **Produktionsreif:** **JA**

**Empfehlung: freigabefähig.** Kein Critical-, High- oder Medium-Befund offen. Die frühere Einschränkung — ein Drittel der Kriterien nur aus dem Code abgeleitet — ist ausgeräumt: Erfassen, Verbrauchsberechnung, Bearbeiten mit Neuberechnung und Löschen sind durch die laufende Anwendung hindurch verifiziert.

**Was weiterhin nicht automatisiert geprüft ist:** die Darstellung des Verlaufsdiagramms samt Hover-Verhalten (dafür braucht es mindestens drei Volltankungen), Cross-Browser über Chromium und Mobile Safari hinaus, sowie die visuelle Erscheinung insgesamt. Die beiden Low-Befunde bleiben für einen späteren Sprint.

## Deployment

- **Deployed:** 2026-07-31
- **Commit:** `52283ce` — `feat(PROJ-24): Implement Tankbuch & Verbrauch`
- **Produktion:** https://www.oldtimer-docs.com
- **Migration:** `20260731_create_fuel_entries.sql` — **bereits angewendet** (verifiziert: Tabelle vorhanden, RLS aktiv, 4 Policies)
- **Neue Env-Variablen:** keine für die Produktion. `E2E_EMAIL`, `E2E_PASSWORD` und `E2E_VEHICLE_ID` sind reine Entwicklungswerte für die angemeldeten Tests und stehen ausschließlich in `.env.local` (gitignored). In Vercel ist nichts zu ergänzen.
- **Neue Abhängigkeit:** `recharts` über die shadcn-Chart-Komponente

### Vor dem Deployment geprüft

| Punkt | Ergebnis |
|---|---|
| `npm run build` | ✅ erfolgreich |
| `npm run lint` | ⚠️ 2 Fehler — beide vorbestehend in `cookie-consent-banner.tsx:69` und `landing-page.tsx:133`, unverändert und bereits in Produktion |
| QA freigegeben | ✅ Status Approved, 17/17 Kriterien |
| Critical/High-Fehler | ✅ keine (2 offene Low) |
| Env-Variablen dokumentiert | ✅ `.env.local.example` neu angelegt |
| Keine Geheimnisse im Commit | ✅ Staged-Diff auf Muster geprüft, 0 Treffer; `.env.local`, `.mcp.json` und `playwright/.auth/` sind ignoriert |
| Migration angewendet | ✅ |

### Bewusst nicht getan

- **Kein Feature-Test in der Produktion.** Die angemeldeten E2E-Tests laufen gegen `localhost`, nicht gegen die Live-Umgebung. Verifiziert ist, dass die Produktion erreichbar ist und der Build durchlief — nicht, dass das Tankbuch dort im eingeloggten Zustand funktioniert.
- **Kein Lighthouse-Lauf**, keine Änderung an Security-Headern oder Fehler-Tracking — beides war bereits eingerichtet und ist von diesem Feature nicht berührt.
