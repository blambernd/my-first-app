# PROJ-36: Währung pro Fahrzeug

## Status: Planned
**Created:** 2026-08-07
**Last Updated:** 2026-08-07

## Dependencies
- Erfordert PROJ-2 (Fahrzeugprofil) — die Währung wird beim Fahrzeug hinterlegt
- Berührt PROJ-24 (Tankbuch), PROJ-25 (Wiederkehrende Kosten), PROJ-26 (Einzelkosten), PROJ-27 (Kostenanalyse), PROJ-28 (Kaufpreis & Wertentwicklung), PROJ-31 (Kosten-Überblick), PROJ-3 (Scheckheft, Kostenfeld) — überall dort werden Beträge erfasst oder angezeigt
- Berührt PROJ-32 (Kostendaten beim Transfer) — der CSV-Export muss die Währung nennen
- Berührt PROJ-33 (Verkaufspreis-Erhebung) — der anonyme Datensatz bekommt eine Währung
- **Blockiert PROJ-34 (Preisübersicht aus echten Verkäufen)** — die Preisübersicht muss je Währung getrennt auswerten. PROJ-34 ist bereits „Architected", das Design ist entsprechend anzupassen.

## Overview

Bisher rechnet die Anwendung überall in Euro, ohne das je zur Wahl zu stellen: 13 Stellen im Code setzen `currency: "EUR"` fest, 17 Komponenten schreiben ein hartes „€". Für Nutzer in der Schweiz, in Skandinavien oder für jemanden, der einen Wagen in Großbritannien unterhält, sind damit sämtliche Kostenzahlen falsch beschriftet.

Diese Funktion lässt den Nutzer **pro Fahrzeug** eine Währung wählen. Alle selbst erfassten Beträge dieses Fahrzeugs werden in dieser Währung erfasst, angezeigt und summiert.

### Warum pro Fahrzeug und nicht pro Beleg

Die Kostenauswertung addiert Tankbuch, laufende Kosten und Einzelkosten zu einer Jahressumme. Wären die einzelnen Belege in verschiedenen Währungen, ließe sich diese Summe ohne Umrechnungskurs gar nicht bilden — und ein Kurs bedeutet: Kurs zu welchem Datum, aus welcher Quelle, und was tun, wenn die Quelle ausfällt.

Eine Währung pro Fahrzeug löst den tatsächlichen Bedarf (ein Schweizer Halter, ein britischer Klassiker) und hält **jede Summe in sich stimmig, ohne dass die Anwendung je einen Kurs raten muss.** Wer zwei Fahrzeuge in zwei Ländern hat, kann sie unterschiedlich führen — das ist der Fall, für den „pro Nutzerkonto" nicht gereicht hätte.

### Was ausdrücklich nicht umgerechnet wird

**Die Anwendung rechnet an keiner Stelle Währungen um.** Kein Tageskurs, keine Kursquelle, keine Kurshistorie. Das ist kein weggelassenes Feature, sondern die tragende Entscheidung: Sobald irgendwo ein Kurs eingesetzt würde, stünde in der Auswertung eine gerundete Schätzung neben einer belegten Rechnung, ohne dass man den beiden ansieht, welche welche ist.

## User Stories

- Als Schweizer Oldtimer-Besitzer möchte ich mein Fahrzeug in Franken führen, damit meine Rechnungen und die erfassten Beträge dieselbe Währung haben und ich nichts im Kopf umrechnen muss.
- Als Besitzer eines britischen Klassikers, den ich in England eingestellt habe, möchte ich für dieses eine Fahrzeug Pfund wählen, während meine anderen Fahrzeuge in Euro bleiben.
- Als Nutzer möchte ich die Währung beim Anlegen eines Fahrzeugs sehen und wählen können, damit ich sie nicht erst suchen muss, nachdem ich schon Kosten erfasst habe.
- Als Nutzer, der die Währung versehentlich falsch gewählt hat, möchte ich sie ändern können und dabei klar gesagt bekommen, dass meine Beträge nicht umgerechnet werden.
- Als bestehender Nutzer möchte ich, dass sich für mich nichts ändert, wenn ich in Euro rechne — ohne Migrationsschritt, ohne neue Pflichtangabe.
- Als Verkäufer möchte ich, dass mein Verkaufspreis nur mit Verkäufen derselben Währung verglichen wird, damit die Preisübersicht keine falschen Schlüsse nahelegt.

## Acceptance Criteria

### Währung wählen

- [ ] Beim Anlegen eines Fahrzeugs (`/vehicles/new`) steht ein Auswahlfeld „Währung" zur Verfügung
- [ ] Die Vorauswahl ist **EUR** — der häufigste Fall bleibt ein Klick weniger
- [ ] Zur Auswahl stehen genau neun Währungen: **EUR, CHF, GBP, USD, SEK, DKK, NOK, PLN, CZK**
- [ ] Jede Option zeigt Code und Klartextnamen (z. B. „CHF — Schweizer Franken"), nicht nur das Symbol
- [ ] Die Währung ist auch im Fahrzeug bearbeiten (`/vehicles/[id]/edit`) änderbar
- [ ] Ein Fahrzeug hat immer genau eine Währung — das Feld kann nicht leer bleiben

### Anzeige

- [ ] Alle selbst erfassten Beträge eines Fahrzeugs werden in dessen Währung angezeigt: Tankbuch, laufende Kosten, Einzelkosten, Scheckheft-Kosten, Kaufpreis, Marktwert-Einträge
- [ ] Betrifft alle Seiten des Kostenbereichs: Überblick, Auswertung, Wertentwicklung, laufende Kosten, Einzelkosten, Tankbuch
- [ ] Die Beschriftung von Diagrammachsen und Summenzeilen nennt dieselbe Währung wie die Einzelwerte
- [ ] Bei Eingabefeldern steht die Währung sichtbar am Feld, **bevor** der Nutzer tippt — nicht erst im Ergebnis
- [ ] Die Zahlenformatierung bleibt deutsch (`de-DE`, Punkt als Tausender-, Komma als Dezimaltrenner) — nur das Währungszeichen wechselt
- [ ] Auf der Fahrzeugübersicht (Dashboard) ist erkennbar, in welcher Währung ein Fahrzeug geführt wird, sobald der Nutzer mindestens zwei verschiedene Währungen verwendet

### Keine Umrechnung, keine gemischten Summen

- [ ] **An keiner Stelle wird ein Betrag umgerechnet**
- [ ] **Es wird niemals über mehrere Währungen hinweg summiert.** Gibt es eine fahrzeugübergreifende Summe, wird sie je Währung getrennt ausgewiesen oder gar nicht gebildet
- [ ] Die Anwendung fragt keine Kursquelle ab und speichert keine Kurse

### Währung nachträglich ändern

- [ ] Der Wechsel ist jederzeit möglich, auch wenn schon Kosten erfasst sind
- [ ] **Vor dem Speichern erscheint eine Warnung**, die ausdrücklich sagt, dass die Beträge *nicht* umgerechnet werden — Beispieltext: „Aus 1.000 € wird 1.000 CHF."
- [ ] Die Warnung nennt die **Zahl der betroffenen Einträge** (alle Kosten-, Tank-, Scheckheft-, Kaufpreis- und Marktwerteinträge des Fahrzeugs)
- [ ] Die Warnung erscheint nur, wenn tatsächlich Beträge erfasst sind — bei einem leeren Fahrzeug ist der Wechsel folgenlos und wird nicht kommentiert
- [ ] Der Nutzer kann abbrechen, ohne dass etwas geändert wird

### Externe Preise bleiben Euro

- [ ] Die **Ersatzteil-Suche und Preis-Alerts** (PROJ-9) bleiben in Euro, unabhängig von der Fahrzeugwährung — die Angebote stammen aus dem deutschen Markt und sind in Euro ausgezeichnet
- [ ] Die **Marktpreis-Analyse** (PROJ-11) bleibt in Euro, aus demselben Grund
- [ ] Wo eine solche Euro-Angabe neben Beträgen in Fahrzeugwährung steht, ist sie erkennbar als Euro beschriftet
- [ ] Die **Abo-Preise** (4,99 € / 49,99 €) bleiben unverändert in Euro — sie haben mit dem Fahrzeug nichts zu tun

### Fahrzeug-Transfer

- [ ] Beim Annehmen eines Transfers kann der **Käufer die Währung neu wählen**; vorbelegt ist die bisherige Währung des Fahrzeugs
- [ ] Der Kaufpreis, den der Käufer beim Übertrag einträgt, gilt in der von ihm gewählten Währung
- [ ] Der **CSV-Export der Kostendaten** (PROJ-32) nennt die Währung — in einer eigenen Spalte oder in der Kopfzeile, so dass die Datei ohne die Anwendung eindeutig lesbar ist
- [ ] Der Export enthält weiterhin keine Währungssymbole in den Zahlenfeldern (Tabellenkalkulationen sollen rechnen können)

### Anonyme Verkaufserfassung (PROJ-33 / PROJ-34)

- [ ] Der anonyme Verkaufsdatensatz speichert die **Währung mit**
- [ ] Die Preisübersicht vergleicht **ausschließlich innerhalb derselben Währung** — ein Verkauf in CHF taucht nie in einer EUR-Auswertung auf
- [ ] Die **Mindestanzahl für die Anonymität gilt je Währung** und nicht über alle Währungen zusammen. Acht EUR-Verkäufe und zwei CHF-Verkäufe ergeben eine sichtbare EUR-Übersicht und **keine** CHF-Übersicht
- [ ] Bestehende Datensätze gelten als EUR
- [ ] Die bisherigen Plausibilitätsgrenzen (500 bis 2.000.000) gelten weiter je Währung, ohne Umrechnung — sie sollen Zehnerpotenz-Vertipper fangen, nicht Kaufkraft abbilden

### Bestandsdaten

- [ ] Alle bereits angelegten Fahrzeuge gelten als **EUR** — sie waren es faktisch immer
- [ ] Kein bestehender Nutzer muss etwas bestätigen, migrieren oder nachtragen
- [ ] Für ein Konto, das nur Euro verwendet, sieht die Anwendung nach dieser Änderung **genauso aus wie vorher**

## Edge Cases

- **Der Nutzer wechselt die Währung, obwohl 47 Einträge erfasst sind.** → Warnung mit genau dieser Zahl, Abbruch möglich; bei Bestätigung ändert sich nur die Beschriftung, keine Zahl.
- **Der Nutzer wechselt hin und wieder zurück.** → Zahlen sind unverändert, weil nie gerechnet wurde. Der Zustand ist derselbe wie vorher — das ist der Vorteil des Nicht-Umrechnens.
- **Ein Fahrzeug in CHF wird an einen deutschen Käufer übertragen.** → Der Käufer sieht die bisherige Währung vorbelegt und stellt sie auf EUR; die Kostendaten des Verkäufers sind ohnehin gelöscht, es bleibt nichts falsch beschriftet zurück.
- **Ein Fahrzeug in CHF wird verkauft und der Käufer belässt es bei CHF.** → Der anonyme Datensatz wird mit CHF gespeichert und zählt nur zur CHF-Gruppe.
- **Für ein Modell gibt es 8 EUR-Verkäufe und 2 CHF-Verkäufe.** → EUR-Übersicht sichtbar, CHF-Übersicht verborgen. Es wird nicht zusammengezählt, um die Mindestzahl zu erreichen.
- **Der Nutzer hat zwei Fahrzeuge in verschiedenen Währungen und erwartet eine Gesamtsumme.** → Es gibt keine gemischte Gesamtsumme. Getrennte Ausweisung je Währung, mit erkennbarer Beschriftung.
- **Ein Ersatzteil-Alert auf einem CHF-Fahrzeug.** → Preisgrenze und gefundene Angebote in Euro, sichtbar als Euro beschriftet. Alles andere wäre eine falsche Behauptung über einen fremden Marktplatz.
- **Der Nutzer sucht seine Währung in der Liste und findet sie nicht** (z. B. HUF, CAD, AUD). → Die Liste ist bewusst kurz. Der Fall ist zu dokumentieren, aber nicht in V1 zu lösen; eine Erweiterung ist jederzeit möglich, ohne bestehende Daten anzufassen.
- **Ein Fahrzeug wird von zwei Personen geführt (PROJ-6).** → Die Währung gehört zum Fahrzeug, nicht zur Person. Beide sehen dieselbe. Ändern darf sie nur, wer das Fahrzeug bearbeiten darf.
- **Ein öffentliches Kurzprofil (PROJ-10) eines CHF-Fahrzeugs.** → Falls dort Beträge erscheinen, in Fahrzeugwährung. Das Kurzprofil zeigt heute keine Kosten — zu prüfen, nicht anzunehmen.

## Technical Requirements

- **Keine externe Abhängigkeit:** keine Kurs-API, kein zusätzliches Paket. Die Währungsliste ist statisch.
- **Speicherung:** Die Beträge bleiben ganzzahlige Kleinsteinheiten wie bisher. Die Währung wird als ISO-4217-Code (drei Buchstaben) hinterlegt.
- **Sicherheit:** Die Währung ist Teil des Fahrzeugs und unterliegt denselben Zugriffsregeln — nur wer das Fahrzeug bearbeiten darf, darf sie ändern. Der Kostenbereich bleibt eigentümer-exklusiv (PROJ-27 C10).
- **Rückwärtskompatibel:** Ohne Angabe gilt EUR. Kein Datenbankfeld darf bestehende Zeilen ungültig machen.
- **Formatierung:** Die Sprachumgebung bleibt `de-DE`; nur der Währungsteil ist veränderlich.

## Offene Punkte für `/architecture`

1. **PROJ-34 ist bereits „Architected"** und geht von einer reinen Euro-Tabelle aus. Das Design muss um die Trennung je Währung erweitert werden, **bevor** PROJ-34 gebaut wird. Sonst entsteht genau die stille Vermischung, die dieses Kriterium verhindern soll.
2. Ob die Warnung beim Währungswechsel die betroffenen Einträge über alle sechs Kostenarten zählt oder eine grobe Aussage genügt — die genaue Zahl ist überzeugender, kostet aber eine Abfrage mehr.
3. Ob die Fahrzeugübersicht die Währung immer zeigt oder nur bei gemischten Beständen (Kriterium oben sagt: nur bei gemischt — das ist zu bestätigen).

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
