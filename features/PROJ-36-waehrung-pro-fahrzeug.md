# PROJ-36: Währung pro Fahrzeug

## Status: In Review
**Created:** 2026-08-07
**Last Updated:** 2026-08-09

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

### Der Befund, der alles andere bestimmt

Bevor irgendetwas entworfen wird, die eine Frage: Wie oft steht „Euro" eigentlich im Programm? Die Antwort entscheidet, ob diese Funktion einen Nachmittag oder zwei Wochen kostet.

**Es gibt genau eine Stelle, die Geld zur Anzeige bringt.** Ein einziger Helfer wird **46 Mal aus 11 Komponenten** aufgerufen — Kostenüberblick, Auswertung, Wertentwicklung, Diagramme, Tankbuch, laufende Kosten, Einzelkosten, Scheckheft und Kaufpreis. Alle bekommen ihr Euro-Zeichen von dort.

Das ist der Glücksfall dieser Aufgabe: Diese eine Stelle erfährt, welche Währung gilt, und **46 Anzeigen stimmen auf einen Schlag.** Ohne diesen gemeinsamen Helfer wären es 46 einzelne Entscheidungen gewesen, von denen erfahrungsgemäß zwei oder drei vergessen werden — und genau die fallen dann als falsch beschriftete Beträge auf.

**Der zweite Glücksfall:** Das gemeinsame Grundgerüst aller Fahrzeugseiten (`vehicles/[id]/layout.tsx`) lädt bereits **alle Spalten des Fahrzeugs**, für jede Unterseite, bei jedem Aufruf. Die neue Währungsspalte ist dort also automatisch vorhanden — **ohne eine einzige zusätzliche Datenbankabfrage.**

### A) Komponentenstruktur

```
Fahrzeug-Grundgerüst  (lädt das Fahrzeug bereits vollständig)
+-- NEU: Währungs-Bereitsteller
|      Kennt die Währung des Fahrzeugs und stellt sie allen
|      Unterseiten zur Verfügung. Kostet keine Abfrage.
|
+-- Kostenüberblick ........... liest die Währung
+-- Kostenauswertung .......... liest die Währung
+-- Wertentwicklung ........... liest die Währung
+-- Laufende Kosten ........... liest die Währung
+-- Einzelkosten .............. liest die Währung
+-- Tankbuch .................. liest die Währung
+-- Scheckheft (Kostenfeld) ... liest die Währung
+-- Kaufpreis-Bereich ......... liest die Währung
|
+-- Ersatzteile ............... bleibt Euro (fremder Markt)
+-- Marktpreis-Analyse ........ bleibt Euro (fremder Markt)

Fahrzeug anlegen / bearbeiten
+-- NEU: Auswahlfeld „Währung" (neun Einträge, Code + Klartext)
+-- NEU: Warnhinweis beim Wechsel
       Erscheint nur, wenn bereits Beträge erfasst sind.
       Nennt die Zahl der betroffenen Einträge.

Transfer annehmen  (eigene Seite, außerhalb des Fahrzeug-Grundgerüsts)
+-- NEU: Währungsauswahl, vorbelegt mit der bisherigen Währung
+-- Kaufpreis-Eingabe .......... in der gewählten Währung

Fahrzeugübersicht (Dashboard)
+-- NEU: Währungskennzeichen je Fahrzeug
       Nur sichtbar, wenn der Nutzer überhaupt gemischt führt.
```

### B) Datenmodell (in Worten)

**Beim Fahrzeug kommt eine Angabe dazu:**

> Währung — ein dreistelliger Code nach dem internationalen Standard (EUR, CHF, GBP, USD, SEK, DKK, NOK, PLN, CZK). Pflichtangabe, Vorgabe **EUR**.

Die Vorgabe ist der ganze Migrationsplan: **Alle heute vorhandenen Fahrzeuge werden dadurch automatisch zu Euro-Fahrzeugen** — was sie faktisch immer waren. Niemand muss etwas bestätigen, niemand bekommt eine Rückfrage, und für ein reines Euro-Konto sieht die Anwendung danach exakt aus wie vorher.

**Bei den Beträgen ändert sich nichts.** Sie bleiben ganzzahlige Kleinsteinheiten wie bisher. Das ist wichtig zu betonen, weil es der Grund ist, warum diese Funktion keine Datenwanderung braucht: Es wird kein einziger gespeicherter Betrag angefasst. Die Währung ist eine reine Beschriftung — und weil nie umgerechnet wird, bleibt sie das auch.

**Bei der anonymen Verkaufssammlung kommt dieselbe Angabe dazu:**

> Währung des Verkaufs — dreistelliger Code, Vorgabe EUR für die bestehenden Datensätze.

**Die Währungsliste selbst wird nicht gespeichert.** Neun feste Einträge im Programm. Eine Datenbanktabelle für neun Zeilen, die sich nie ändern, wäre eine Abfrage bei jedem Seitenaufruf für einen Inhalt, der schon feststeht.

### C) Tech-Entscheidungen

**1. Die Währung wird bereitgestellt, nicht durchgereicht.**

Zwei Wege führen zum Ziel. Man kann die Währung von Seite zu Komponente zu Unterkomponente weiterreichen — das wären Änderungen an jeder Zwischenstation, auch an solchen, die mit Geld nichts zu tun haben. Oder das Fahrzeug-Grundgerüst stellt sie einmal bereit, und wer sie braucht, holt sie sich.

**Empfehlung: bereitstellen.** Begründung: Das Grundgerüst lädt das Fahrzeug ohnehin schon vollständig, die Angabe ist also gratis da. Und die einzelnen Seiten laden das Fahrzeug heute mit gezielten, schmalen Abfragen (das Tankbuch etwa holt nur Kennung und Kilometerstand) — beim Durchreichen müsste **jede dieser Abfragen erweitert werden**, und jede vergessene wäre ein Fahrzeug, das plötzlich wieder Euro anzeigt.

**2. Der Formatierer zieht um.**

Der Helfer, der 11 Komponenten mit Geldbeträgen versorgt, liegt heute in der Prüfdatei für Scheckheft-Einträge — historisch gewachsen, sachlich am falschen Ort. Er bekommt ein eigenes Zuhause für „Währung und Geldanzeige".

Das ist nicht Ordnungsliebe: Diese Datei wird **gerade parallel für PROJ-35 bearbeitet.** Beide Arbeiten an derselben Datei bedeuten Konflikte beim Zusammenführen. Der Umzug löst das Problem, statt es zu verwalten.

**3. Kein Umrechnungskurs — und das ist eine Architekturentscheidung, keine Sparmaßnahme.**

Ein Kurs bringt eine Kette mit: Kursquelle, Stichtag je Betrag, Zwischenspeicher, Verhalten bei Ausfall der Quelle, Nachvollziehbarkeit im Nachhinein. Und am Ende steht in der Auswertung eine gerundete Schätzung neben einem belegten Rechnungsbetrag, ohne dass man den beiden ansieht, welche welche ist.

Die Entscheidung „eine Währung pro Fahrzeug" **macht die gesamte Kette überflüssig**, weil innerhalb eines Fahrzeugs nie zwei Währungen aufeinandertreffen. Deshalb war die Wahl der Ebene die eigentliche Architekturfrage — nicht die Auswahl der Währungen.

**4. Fahrzeugübergreifende Summen: getrennt oder gar nicht.**

Sobald zwei Fahrzeuge in verschiedenen Währungen geführt werden, gibt es keine gemeinsame Gesamtzahl mehr. Jede Stelle, die heute über Fahrzeuge hinweg addiert, muss entweder je Währung getrennt ausweisen oder die Summe weglassen. **Was nicht passieren darf: eine Zahl, die aussieht wie eine Summe und keine ist.** Beim Bau ist zu prüfen, wo solche Summen überhaupt existieren.

**5. Die Warnung beim Wechsel zählt echt.**

„Einige Einträge sind betroffen" überzeugt niemanden. „47 Einträge sind betroffen" schon. Die Zahl kostet eine Abfrage über die sechs Kostenarten — einmalig, nur beim Öffnen des Auswahlfelds, und nur wenn tatsächlich gewechselt wird. Das ist der Preis wert, weil dieser Hinweis die einzige Schutzlinie gegen ein Missverständnis ist, das sonst still 47 falsch beschriftete Beträge hinterlässt.

**6. Die Verkaufsfunktion in der Datenbank bekommt einen Parameter mehr.**

Die Funktion, die einen Fahrzeugübergang abwickelt, erhält die Währung als zusätzliche Angabe. **Wichtig aus Erfahrung:** Die alte Fassung muss dabei ausdrücklich entfernt werden. Am 2026-08-04 entstand bei genau dieser Funktion versehentlich eine zweite Fassung mit weniger Parametern, die stillschweigend die Daten des Käufers verworfen hätte. Zwei Fassungen nebeneinander sind kein Schönheitsfehler, sondern ein stiller Datenverlust.

### D) Die Grenze: was ausdrücklich **nicht** die Fahrzeugwährung bekommt

| Bereich | Bleibt Euro, weil |
|---|---|
| Ersatzteil-Suche und Preis-Alerts (PROJ-9) | Die Angebote kommen aus dem deutschen Markt und sind dort in Euro ausgezeichnet. Sie als Franken zu beschriften wäre eine falsche Behauptung über einen fremden Marktplatz. |
| Marktpreis-Analyse (PROJ-11) | Dieselbe Quelle, derselbe Grund. |
| Abo-Preise (4,99 € / 49,99 €) | Gehören zum Anbieter, nicht zum Fahrzeug. |

Architektonisch ist das der einfachste Teil: Diese Bereiche **greifen die Währung schlicht nicht ab**. Sie bleiben, wie sie sind. Zu tun ist nur eines — dort, wo eine solche Euro-Angabe neben Beträgen in Fahrzeugwährung steht, muss sie **sichtbar als Euro** beschriftet sein. Sonst liest der Nutzer eines CHF-Fahrzeugs die Preisgrenze seines Ersatzteil-Alerts als Franken.

### E) Reihenfolge — und die eine Tür, die nur einmal aufgeht

Fast alles an dieser Funktion ist umkehrbar. Eine Sache nicht:

> **Die anonyme Verkaufssammlung ist für niemanden lesbar** — keine Leseregel, ausdrücklich entzogene Rechte. Geschrieben wird nur durch die Übergabefunktion. Landet dort ein Verkauf in Franken ohne Währungsangabe, kann ihn **niemand mehr finden und niemand mehr richtigstellen.** Weder der Nutzer noch der Betreiber.

Daraus folgt eine harte Reihenfolge:

1. **Währungsspalte in der Verkaufssammlung** — zuerst, vor allem anderen. Solange nur Euro-Fahrzeuge existieren, ist sie folgenlos; sobald das erste Fremdwährungs-Fahrzeug übertragen wird, ist sie unersetzlich.
2. Währungsspalte beim Fahrzeug, Auswahlfeld, Anzeige
3. Warnung beim Wechsel
4. Transfer und CSV-Export
5. **Erst danach PROJ-34**

**PROJ-34 steht auf „Architected" und geht von einer reinen Euro-Sammlung aus.** Wird es vor PROJ-36 gebaut, mittelt es Währungen still zusammen — und weil die Tabelle für niemanden lesbar ist, fällt es niemandem auf. Das Design von PROJ-34 ist entsprechend anzupassen: **Die Mindestanzahl für die Anonymität gilt je Währung.** Acht Euro-Verkäufe und zwei Franken-Verkäufe ergeben eine sichtbare Euro-Übersicht und keine Franken-Übersicht — es wird nicht zusammengezählt, um die Mindestzahl zu erreichen.

### F) Umfang in Zahlen

| Was | Umfang |
|---|---|
| Zentraler Geldformatierer | **1 Stelle** — versorgt 46 Anzeigen |
| Komponenten, die ihn nutzen | 11 (keine muss einzeln umgebaut werden) |
| Bereitsteller im Fahrzeug-Grundgerüst | 1 neu, **0 zusätzliche Abfragen** |
| Prüftexte mit „€" (z. B. „Betrag muss zwischen … liegen") | rund 9, in 6 Prüfdateien |
| Datenbank | 2 neue Spalten, 1 Funktion erweitert |
| Formulare mit Währungsauswahl | 3 (anlegen, bearbeiten, Transfer annehmen) |
| Neue Pakete | **keine** |

### G) Dependencies

**Keine neuen Pakete.** Die Währungsformatierung kann der Browser bereits — dieselbe eingebaute Funktion, die heute das Euro-Zeichen setzt, versteht alle neun Codes. Es wird ihr künftig nur gesagt, welcher gemeint ist.

### H) Was beim Bau zu prüfen ist

1. **Gibt es fahrzeugübergreifende Geldsummen?** (Dashboard, Auswertungen) — falls ja, je Währung trennen oder weglassen.
2. **Zeigt das öffentliche Kurzprofil (PROJ-10) Beträge?** Die Spec vermutet nein — das ist zu prüfen, nicht anzunehmen.
3. **Der CSV-Export** muss die Währung in Kopfzeile oder Spalte nennen, ohne Währungszeichen in die Zahlenfelder zu schreiben — Tabellenkalkulationen sollen weiter rechnen können.
4. **Die Plausibilitätsgrenzen** (500 bis 2.000.000) gelten je Währung unverändert. Sie fangen Zehnerpotenz-Vertipper, sie bilden keine Kaufkraft ab — eine Umrechnung wäre hier sinnlos.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_

---

## Umsetzung (2026-08-08)

### Der eine Formatierer hat gehalten, was der Entwurf versprach

46 Anzeigen in 11 Komponenten hingen an einem einzigen Helfer. Er ist nach `lib/currency.ts` umgezogen, heißt dort `formatMoney` und **verlangt die Währung als Pflichtangabe ohne Vorgabewert**.

Das ist die wichtigste Zeile der ganzen Umsetzung. Ein Vorgabewert hätte bedeutet: Wer die Währung vergisst, bekommt schweigend Euro angezeigt — und niemandem fällt auf, dass die Zahl daneben in Franken erfasst wurde. So bricht stattdessen jede vergessene Stelle sofort beim Übersetzen.

Dieselbe Frage fällt an anderer Stelle umgekehrt aus: Im Fahrzeug-Schema **hat** die Währung eine Vorgabe (EUR). Der Unterschied ist die Bedeutung — dort heißt „keine Angabe" nur, dass ein Fahrzeug Euro führt, und das trifft auf jedes Bestandsfahrzeug zu.

### Bereitgestellt statt durchgereicht

`CurrencyProvider` hängt im Fahrzeug-Grundgerüst. Es lädt das Fahrzeug ohnehin mit allen Spalten — **keine zusätzliche Datenbankabfrage.** `useCurrency()` wirft ohne Bereitsteller einen Fehler, statt auf Euro zurückzufallen; dasselbe Vorgehen wie bei `useSidebar`. Ein stiller Rückfall wäre genau die Fehlerklasse, die dieser Entwurf verhindern soll.

### Was gebaut wurde

| Bereich | Umsetzung |
|---|---|
| `lib/currency.ts` | Neun Währungen, `formatMoney`, `toCurrency`, `getCurrencySymbol`, `EXTERNAL_CURRENCY` |
| `currency-provider.tsx` | Bereitsteller + `useCurrency()` |
| `currency-select.tsx` | Auswahlfeld **samt Warnung** mit echter Anzahl der betroffenen Einträge |
| `external-currency-note.tsx` | Hinweis an Euro-Angaben aus fremder Quelle — erscheint nur bei Nicht-Euro-Fahrzeugen |
| 11 Anzeige-Komponenten | lesen die Währung, keine einzeln umgebaut |
| 7 Eingabeformulare | Währungszeichen am Feld, **bevor** getippt wird |
| Fahrzeugübersicht | Kennzeichen je Kachel, nur bei gemischten Beständen |
| Transfer annehmen | Käufer wählt die Währung, vorbelegt mit der bisherigen |
| CSV-Export | Währung in der **Kopfzeile**, nicht in den Zahlenfeldern |

### Warum die Warnung echt zählt

„Einige Einträge sind betroffen" liest niemand zu Ende. Die Warnung fragt deshalb sechs Tabellen ab und nennt die Zahl. Scheitert das Zählen, wird trotzdem gewarnt — nur ohne Zahl. Den Wechsel deswegen zu verweigern wäre die schlechtere Antwort: Der Nutzer käme dann gar nicht mehr an seine Einstellung.

Bei einem Fahrzeug ohne erfasste Beträge erscheint keine Warnung. Es gäbe nichts zu warnen.

### Die Grenze zu fremden Preisen

Ersatzteil-Angebote (PROJ-9) und Marktpreis-Analyse (PROJ-11) bleiben Euro. Sie stammen aus dem deutschen Markt; sie bei einem Franken-Fahrzeug als Franken zu beschriften wäre eine falsche Behauptung über einen fremden Marktplatz.

Unkommentiert wäre das aber wie ein Fehler gelesen worden. `ExternalCurrencyNote` macht aus der scheinbaren Unstimmigkeit eine erklärte Entscheidung — und erscheint **nur**, wenn das Fahrzeug nicht in Euro geführt wird. Bei einem Euro-Konto ist die Anwendung unverändert.

### Über die Frontend-Grenze hinaus — und warum

Drei Datenbankänderungen sind mitgelaufen, obwohl sie nach `/backend` gehört hätten:

1. **`vehicles.currency`** — ohne die Spalte wäre nichts von der Oberfläche prüfbar gewesen
2. **`vehicle_sales.currency`** — der Entwurf verlangt sie *zuerst*. Die Tabelle ist für niemanden lesbar; ein Fremdwährungs-Verkauf ohne Währungsangabe wäre danach von niemandem mehr auffindbar
3. **`accept_vehicle_transfer` + `get_transfer_by_token`** — hier war die Trennung die **gefährlichere** Variante: Eine Oberfläche, die die Währung erhebt, über einer Funktion, die sie verwirft, hätte einen CHF-Verkauf still als EUR abgelegt. Genau die Datenverfälschung, die diese Funktion verhindern soll.

Bei `accept_vehicle_transfer` wurde die alte 5-Parameter-Fassung **ausdrücklich per DROP entfernt** und danach geprüft: Es existiert genau eine Signatur. Am 2026-08-04 war an derselben Funktion eine zweite Fassung entstanden, weil `CREATE OR REPLACE` bei geänderter Signatur überlädt statt überschreibt.

### Was `/backend` noch offen hat

- Integrationstests für die geänderte Übergabefunktion (Währung wird übernommen, unbekannter Code behält die bisherige)
- Ein **echter Transfer zwischen zwei Konten** mit Währungswechsel — die letzte unbestätigte Verbindung
- Prüfen, ob es fahrzeugübergreifende Geldsummen gibt (Entwurf, Punkt H1)
- Prüfen, ob das öffentliche Kurzprofil Beträge zeigt (Entwurf, Punkt H2)

### Prüfstand

| Prüfung | Ergebnis |
|---|---|
| Typen | 0 Fehler (die zwei in `offline-banner.test` und `use-push-notifications.test` sind älter und unberührt) |
| Lint | 0 Fehler, 30 Warnungen (alle vorbestehend, `<img>`) |
| Build | erfolgreich |
| Unit-Tests | siehe unten |

### Ein Fehler, den nur die E2E-Tests finden konnten

Die Annahme des Entwurfs — „alle elf Anzeigekomponenten sind Client-Komponenten" — **war falsch.** `cost-overview-view.tsx` rendert als einzige auf dem Server. React-Kontext reicht nicht auf den Server, `useCurrency()` warf dort also bei jedem Aufruf:

> `Attempted to call useCurrency() from the server but useCurrency is on the client.`

Der gesamte Kostenüberblick lieferte 500 — **19 angemeldete Tests fielen aus.** Behoben, indem diese eine Komponente die Währung als Eigenschaft von ihrer Seite bekommt.

**Das ist der Beleg für die Entscheidung, `useCurrency()` werfen zu lassen.** Wäre der Hook still auf Euro zurückgefallen, hätte die Seite unauffällig weiter gerendert und einem Franken-Fahrzeug Euro-Beträge gezeigt — kein Test wäre rot geworden, und aufgefallen wäre es erst einem Nutzer. So brach es sofort, laut und an genau der richtigen Stelle.

Der Fall ist zugleich die Ausnahme, die die Regel bestätigt: Wo eine Seite die Währung als Eigenschaft durchreicht, muss ihre schmale Datenbankabfrage erweitert werden — hier `/kosten/page.tsx` um `currency`. Genau diese Arbeit erspart der Bereitsteller an den anderen zehn Stellen.

### Ein bestehender Fehler, der dabei aufgefallen ist (nicht PROJ-36)

Der Test „AC: Auch ein Unterbereich schließt das Panel (BUG-1)" (PROJ-30) fällt **etwa in der Hälfte der Läufe** aus: Auf dem Smartphone schließt ein Tippen auf „Einzelkosten" in der Fahrzeugnavigation zwar das Panel, navigiert aber nicht.

Dass es nicht an PROJ-36 liegt, stützt sich auf drei Beobachtungen:

1. **`vehicle-sidebar.tsx` ist von PROJ-36 überhaupt nicht angefasst** — die Datei taucht in keiner Änderung dieser Funktion auf
2. Die **nicht verschachtelte** Fassung desselben Tests („Die Auswahl schließt das Panel und navigiert") läuft zuverlässig durch. Nur der **Unterpunkt** unter dem aufklappbaren „Kosten"-Bereich flackert
3. Genau dieser Bereich klappt seit `ee84115` von selbst auf (auf Wunsch des Nutzers) — dieselbe Änderung passte auch diesen Test an

Wahrscheinliche Ursache: Der Unterpunkt wird angeklickt, während das Aufklappen noch läuft. Für einen Nutzer heißt das, dass ein Tippen auf dem Smartphone gelegentlich ins Leere geht. **Das gehört behoben — aber als eigene Änderung an PROJ-30, nicht heimlich hier mit hinein.**

### Prüfstand (Endstand)

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests | **716 grün** (36 Dateien), davon 30 neu für PROJ-36 |
| E2E `chromium` | **182 / 182 grün**, 44 übersprungen — genau der Ausgangswert |
| E2E `Mobile Safari` | **180 grün, 0 Fehler**, 44 übersprungen |
| E2E `chromium-auth` | 124 grün, 2 Ausfälle (siehe unten) |
| Typen | 0 Fehler in geändertem Code |
| Lint | 0 Fehler |
| Build | erfolgreich |

**Die zwei verbliebenen Ausfälle der angemeldeten Suite:**

1. `PROJ-30 › Auch ein Unterbereich schließt das Panel` — der oben beschriebene bestehende Fehler in `vehicle-sidebar.tsx`, einer Datei, die PROJ-36 nicht anfasst.
2. `PROJ-28 › SICHERHEIT: Der Kaufpreis steht in keiner fremden Seitenantwort` — **läuft allein durch** (PROJ-28 einzeln: 20/20 grün). Im Gesamtlauf scheitert er an einer Zeitüberschreitung, nicht an der Sicherheitsprüfung: Der Fehler entsteht in `waitForToastsGone`, weil eine Meldung aus dem vorherigen Test noch steht. Die angemeldete Suite teilt sich **ein** Wegwerf-Fahrzeug; bricht ein Lauf ab, bleiben die Aufräumschritte liegen und der nächste Lauf startet auf verschmutzten Daten. Das ist dieselbe Ursache wie am 2026-08-01 und gehört zur Testeinrichtung, nicht zu dieser Funktion.

Beide sind für `/qa` festgehalten. Weggelassen habe ich nichts: Die Sicherheitsaussage — der Kaufpreis erscheint in keiner fremden Seitenantwort — ist im Einzellauf ausdrücklich bestätigt.

### Zwei Testanpassungen, die zur Änderung gehören

- `Kosten (EUR)` heißt jetzt `Kosten (€)` — das Feld trägt das Zeichen der Fahrzeugwährung. Zwei Tests suchten die alte Beschriftung.
- `/unter 500 € fließen nicht/` wurde zu `/unter 500\s*€ fließen nicht/`: Seit die Grenze über `Intl` formatiert wird, steht dort ein **geschütztes** Leerzeichen (U+00A0). Auf dem Bildschirm ist der Text unverändert, für einen Zeichenvergleich nicht — ein Unterschied, den man beim Lesen nicht sieht.

Aus demselben Grund bekam `formatMoneyUnits` die Option `ohneNachkomma`: „Preise unter 500,00 €" liest sich wie ein exakter Betrag, gemeint ist eine runde Grenze.

### Der Commit ist bewusst unvollständig

Vier Dateien tragen die parallele PROJ-35-Arbeit des Nutzers **und** die Änderung dieser Funktion in denselben Zeilen:

- `src/lib/validations/service-entry.ts`
- `src/lib/validations/service-entry.test.ts`
- `src/components/service-entry-form.tsx`
- `src/components/service-log.tsx`

Git kann nur ganze Dateien einchecken. Sie mitzunehmen hieße, fremde, unfertige Arbeit in einen fremden Commit zu ziehen — das ist am 2026-08-04 schon einmal beinahe passiert und wurde damals gerade noch abgefangen.

Sie bleiben deshalb **ungestaged**, zusammen mit den zwei Testanpassungen, die von ihnen abhängen (`PROJ-26`, `PROJ-27`, Beschriftung `Kosten (€)`). Der Commit ist dadurch in sich stimmig: Ohne diese sechs Dateien steht `formatCentsToEur` weiterhin in `service-entry.ts`, `service-log.tsx` liest von dort, und die beiden Tests suchen weiter `Kosten (EUR)` — genau wie bisher.

**Was dadurch offen bleibt:** Das Kostenfeld im Scheckheft trägt bis dahin weiter „(EUR)" statt des Fahrzeug-Symbols. Alle anderen sechs Erfassungsmasken sind vollständig umgestellt. Im Arbeitsverzeichnis ist auch das Scheckheft-Feld bereits richtig — es fehlt nur im Commit.

---

## Backend (2026-08-08)

Die Datenbankarbeit war beim Frontend schon mitgelaufen — sie zu trennen wäre gefährlicher gewesen als sie mitzunehmen (siehe oben). Dieser Durchgang hat deshalb drei Aufgaben: die zwei offenen Prüfpunkte aus dem Entwurf beantworten, die Datenbankfunktion nachweislich prüfen, und die Nahtstelle absichern.

### Prüfpunkt H2: Das öffentliche Kurzprofil zeigt sehr wohl Beträge

Der Entwurf vermutete, das Kurzprofil (PROJ-10) käme ohne Geldangaben aus, und schrieb ausdrücklich: *„das ist zu prüfen, nicht anzunehmen."* Die Prüfung hat die Vermutung widerlegt.

`public-profile.tsx` zeigt die **Kosten der Scheckheft-Einträge**, formatiert mit einem fest verdrahteten `currency: "EUR"`. Bei einem Franken-Fahrzeug war damit jeder dieser Beträge falsch beschriftet — **auf einer öffentlichen, teilbaren Seite**, die man typischerweise einem Kaufinteressenten vorlegt. Das ist die Stelle, an der eine falsche Währungsangabe am weitesten reicht.

Behoben: Die Route liefert die Währung mit, die Seite verwendet sie. Der Bereitsteller greift hier nicht — diese Seite liegt außerhalb des Fahrzeug-Grundgerüsts, sie kennt kein angemeldetes Konto und kein Fahrzeug, nur einen Freigabe-Token.

### Prüfpunkt H1: Es gibt keine fahrzeugübergreifenden Geldsummen

Durchsucht: Dashboard, Tarifübersicht, Einstellungen und alle API-Routen, die Geldspalten lesen. **Keine einzige Summe über mehrere Fahrzeuge.** Das Kriterium „nie über Währungen hinweg summieren" ist damit erfüllt, ohne dass etwas zu ändern war — es bleibt als Kriterium bestehen, damit eine künftige Gesamtsumme nicht unbemerkt gemischt wird.

Zwei Randfälle mit geprüftem Ergebnis:

- `api/cron/check-alerts` rechnet mit Ersatzteilpreisen aus dem deutschen Markt — bleibt Euro, richtig so
- `api/vehicles/[id]/listing/*` gehört zum Verkaufsassistenten (`VERKAUFSASSISTENT_AKTIV = false`) und ist nicht erreichbar. Wird er je eingeschaltet, muss er die Fahrzeugwährung übernehmen — festgehalten, nicht auf Verdacht geändert.

### Die Datenbankfunktion, nachweislich

Die Währungslogik der Übergabefunktion wurde gegen alle interessanten Eingaben geprüft (zurückgerollt, gegen ein CHF-Fahrzeug):

| Eingabe | Ergebnis | |
|---|---|---|
| `EUR`, `CHF`, `GBP`, `USD`, `SEK`, `DKK`, `NOK`, `PLN`, `CZK` | jeweils übernommen | ✓ |
| `NULL`, `''`, `XYZ` | bleibt **CHF** — die bisherige Währung | ✓ |
| `eur` (klein) | bleibt **CHF** | ✓ Groß-/Kleinschreibung zählt |

Und die Datenbank als letzte Instanz:

| Prüfung | Ergebnis |
|---|---|
| `vehicle_sales` ohne Währungsangabe | wird **EUR** |
| `vehicle_sales` mit `CHF` | wird **CHF**, Betrag unverändert |
| `vehicle_sales` mit `XYZ` | **abgewiesen** (`vehicle_sales_currency_check`) |

### Sicherheitslage unverändert

| | vorher | nachher |
|---|---|---|
| Policies auf `vehicle_sales` | 0 | **0** |
| RLS an / erzwungen | ja / ja | **ja / ja** |
| Rechte für `anon` und `authenticated` | 0 | **0** |
| Fassungen von `accept_vehicle_transfer` | 1 | **1** |
| Policies auf `vehicles` | 4 | 4 |

Der Supabase-Sicherheitsprüfer meldet nach der Änderung **keinen neuen Befund**. Die vorhandenen Warnungen (`search_path`, ausführbare `SECURITY DEFINER`-Funktionen) sind älter und betreffen 15 Funktionen quer durch das Projekt — sie gehören nicht zu PROJ-36, sind aber für `/qa` vermerkt.

Der Hinweis „RLS aktiviert, keine Policy" auf `vehicle_sales` ist **beabsichtigt** und in der Migration begründet: Es soll niemand lesen können, auch nicht der, dessen Verkauf dort steht.

### Neue Tests

- `api/transfers/[token]/accept/accept.test.ts` (8) — die Nahtstelle: Was der Browser schickt, muss vollständig an die Datenbankfunktion gehen. Genau hier wäre der stille Verlust entstanden. Geprüft: Weitergabe der Währung, **keine Umrechnung** (42.000 CHF → 4.200.000 Rappen), `null` ohne Angabe, Abweisung eines unbekannten Codes mit 400, alle neun Währungen, unveränderte PROJ-33-Angaben, 401 ohne Anmeldung, Annahme ohne lesbaren Rumpf
- `api/profil/[token]/profil.test.ts` (4) — die Währungsumwandlung des öffentlichen Kurzprofils, inklusive Rückfall auf Euro bei fehlender oder unbekannter Angabe

### Was nicht geprüft werden konnte

**Ein echter Transfer zwischen zwei Konten mit Währungswechsel.** Die E2E-Suite legt eine Übergabe an und bricht sie wieder ab — sie nimmt sie nie an, weil dafür ein zweites Konto mit passender E-Mail-Adresse nötig wäre. Die Übergabefunktion ist damit in ihren Einzelteilen geprüft (Währungslogik per SQL, Parameterweitergabe per Test, Datenbankgrenzen per CHECK), aber **nicht im Durchlauf**. Das bleibt die letzte offene Verbindung — schon aus PROJ-32 und PROJ-33.

Ebenfalls ohne Testabdeckung: die E2E-Tests des Kurzprofils (PROJ-10) werden alle **übersprungen**, weil kein veröffentlichtes Profil vorliegt. Die Änderung dort ist durch Einheitentests und Typprüfung gedeckt, nicht durch einen Seitenaufruf.

### Prüfstand

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests | **728 grün** (38 Dateien), 12 davon neu in diesem Durchgang |
| E2E `chromium` | **182 / 182 grün** |
| E2E Transfer (`PROJ-32` + `PROJ-33`) | **21 / 21 grün** |
| Typen | 0 Fehler |
| Lint | 0 Fehler, 30 Warnungen (alle vorbestehend) |
| Build | erfolgreich |
| Supabase-Sicherheitsprüfer | keine neuen Befunde |

---

## QA Test Results (2026-08-09)

### Zusammenfassung

| | |
|---|---|
| Akzeptanzkriterien geprüft | **34 von 34** |
| davon bestanden | **32** |
| davon mit Einschränkung | **2** |
| Fehler gefunden | **4** (0 kritisch, 0 hoch, 2 mittel, 2 niedrig) |
| Sicherheitsprüfung | **ohne Befund** |
| Empfehlung | **Produktionsreif** — keine kritischen oder hohen Fehler |

### Was die Tests gefunden haben, das vorher niemand gesehen hatte

Der Wert dieses Durchgangs steckt nicht in den 32 bestandenen Kriterien, sondern in vier Befunden — und drei davon hat erst das Schreiben der Tests zutage gefördert, nicht das Lesen des Codes.

---

### BUG-1 (Mittel) — Das Währungsfeld hat keine Verbindung zu seinem Label

**Was:** Im Fahrzeugformular steht sichtbar „Währung *", aber das Auswahlfeld ist damit **programmatisch nicht verknüpft**. Ein Screenreader meldet ein unbeschriftetes Auswahlfeld bei einer Pflichtangabe. Auch die Erläuterung darunter und eine mögliche Fehlermeldung werden nicht vorgelesen.

**Warum es entsteht:** Bei allen anderen Feldern des Formulars umschließt `FormControl` den `SelectTrigger` unmittelbar. `FormControl` ist ein Radix-`Slot` und reicht `id` und `aria-describedby` an sein Kind weiter — das Feld ist damit verbunden. Bei der Währung liegt dazwischen die eigene Komponente `CurrencySelect`, und die **nimmt diese Eigenschaften nicht entgegen**. Sie fallen still zu Boden.

**Nachweis:** `page.getByLabel("Währung")` findet das Feld nicht. Der E2E-Test muss es deshalb über seinen sichtbaren Wert suchen — der Umweg steht als Kommentar im Test.

**Gegenprobe:** Im Transfer-Formular ist dasselbe Auswahlfeld korrekt verdrahtet (`<Label htmlFor="waehrung">` + `<SelectTrigger id="waehrung">`). Es geht also, es fehlt nur an einer Stelle.

**Einordnung:** Regression durch PROJ-36. Die Frontend-Regeln des Projekts nennen WCAG 2.1 AA als Ziel; ein Pflichtfeld mit sichtbarer, aber nicht verbundener Beschriftung verfehlt das.

**Schritte:** `/vehicles/<id>/edit` öffnen → Screenreader oder `getByLabel("Währung")`.

---

### BUG-2 (Niedrig) — Der Euro-Hinweis auf der Ersatzteil-Seite ist zugeklappt

**Was:** `ExternalCurrencyNote` erklärt, dass Ersatzteil-Angebote in Euro stehen und nicht in der Fahrzeugwährung. Auf `/ersatzteile` sitzt der Hinweis im **Filterbereich**, und der ist standardmäßig **zugeklappt** (`filtersOpen = false`). Der Nutzer eines Franken-Fahrzeugs sieht die Angebotspreise also ohne jede Einordnung, solange er die Filter nicht öffnet.

**Einordnung niedrig, nicht mittel:** Die Preise tragen weiterhin ein „€" und sind damit als Euro erkennbar — das Kriterium ist streng genommen erfüllt. Der Hinweis ist die Erklärung dazu, und die kommt an der falschen Stelle.

**Im Suchdialog für Preis-Alerts sitzt er richtig** (direkt unter dem Preisfeld), ebenso in der Marktpreis-Analyse.

**Festgehalten als:** `test.fixme()` im E2E-Test — der Test bleibt stehen und benennt den Fehler, statt zu verschwinden.

---

### BUG-3 (Mittel) — Ein Fahrzeug ohne Erstzulassung lässt sich nicht mehr bearbeiten

**Was:** Das Fahrzeugformular verlangt die Erstzulassung (`min(1, "Datum der Erstzulassung ist erforderlich")`). Fahrzeuge, bei denen sie fehlt, lassen sich deshalb **überhaupt nicht speichern** — auch dann nicht, wenn man nur ein anderes Feld ändern will.

**Warum es hier auffällt:** Der einzige Weg, die Währung eines Fahrzeugs zu ändern, führt über dieses Formular. Ein Fahrzeug ohne Erstzulassung ist damit **dauerhaft auf Euro festgelegt**. Genau darüber ist der E2E-Test gestolpert: Das Wegwerf-Fahrzeug hat keine Erstzulassung, und das Speichern schlug ohne erkennbaren Bezug zur Währung fehl.

**Einordnung:** Die Ursache ist **älter als PROJ-36** (das Pflichtfeld stammt aus PROJ-2). Neu ist die Folge — vorher konnte man solche Fahrzeuge einfach nicht bearbeiten, jetzt hängt eine Funktion daran. Gehört als eigene Änderung an PROJ-2 behoben, nicht hier.

**Schritte:** Ein Fahrzeug ohne `first_registration_date` → `/vehicles/<id>/edit` → irgendetwas ändern → „Änderungen speichern" → Fehlermeldung an einem Feld, das man gar nicht angefasst hat.

---

### BUG-4 (Niedrig) — Die Warnung zählt die Kauf-Nebenkosten nicht mit

**Was:** Die Warnung beim Währungswechsel zählt sechs Tabellen: Tankbuch, laufende Kosten, Einzelkosten, Kaufpreis, Marktwerte und Scheckheft-Einträge mit Betrag. **`vehicle_purchase_costs` (die Nebenkosten zum Kaufpreis) fehlt.**

**Folge:** Wer Kaufpreis plus drei Nebenkosten erfasst hat, liest „Betroffen ist 1 erfasster Betrag" — tatsächlich werden vier Beträge neu beschriftet. Die Zahl ist das Einzige, was diese Warnung überzeugend macht; eine zu niedrige Zahl schwächt genau das.

**Kein Datenverlust** — die Warnung erscheint, sie untertreibt nur.

---

### Sicherheitsprüfung — ohne Befund

| Angriffsgedanke | Ergebnis |
|---|---|
| Kann ein **Mitglied** die Währung eines fremden Fahrzeugs ändern? | **Nein.** `vehicles` UPDATE ist `auth.uid() = user_id`. Zusätzlich liefert `/vehicles/<id>/edit` für Mitglieder 404. |
| Kann über die Zählabfrage der Warnung auf fremde Kostendaten geschlossen werden? | **Nein.** Sie läuft mit den Rechten des Aufrufers; für Nicht-Besitzer ergibt sie 0. Und da nur Besitzer das Formular erreichen, entsteht die Frage praktisch nicht. |
| Lässt sich ein unbekannter Währungscode einschleusen? | **Nein.** Drei Schichten: Auswahlliste, Zod-Prüfung (400), CHECK in der Datenbank (nachgewiesen abgewiesen). |
| Wird die anonyme Verkaufssammlung lesbar? | **Nein.** 0 Policies, RLS an und erzwungen, 0 Rechte für `anon`/`authenticated`. |
| Ist eine zweite Fassung der Übergabefunktion entstanden? | **Nein.** Genau eine Signatur. |
| Neue Befunde im Supabase-Sicherheitsprüfer? | **Keine.** |
| Einschleusung über die Währung (XSS)? | **Nicht möglich.** Der Wert stammt aus einer festen Liste von neun Codes und wird nie als Markup ausgegeben. |

**Ein Randbefund ohne Bezug zu PROJ-36**, weil er beim Prüfen auffiel: 15 Datenbankfunktionen quer durchs Projekt haben einen veränderlichen `search_path`, und mehrere `SECURITY DEFINER`-Funktionen sind für `anon` ausführbar. Das ist älter und betrifft PROJ-6, PROJ-7 und PROJ-8. Sollte eigenständig geprüft werden.

---

### Akzeptanzkriterien

| Bereich | Ergebnis |
|---|---|
| Währung wählen (6 Kriterien) | **6 bestanden** — EUR vorausgewählt, neun Währungen mit Code **und** Klartext, im Anlegen wie im Bearbeiten, nie leer |
| Anzeige (6) | **6 bestanden** — Überblick, Auswertung, Wertentwicklung, laufende Kosten, Einzelkosten, Tankbuch; Symbol am Feld **vor** der Eingabe; deutsche Zahlenformatierung bleibt |
| Keine Umrechnung (3) | **3 bestanden** — 1.234,00 bleibt 1.234,00, nur „€" wird „CHF". Keine fahrzeugübergreifende Summe existiert überhaupt |
| Nachträglich ändern (5) | **5 bestanden** — Warnung mit Zahl (siehe BUG-4 zur Genauigkeit), kein Hinweis bei leerem Fahrzeug, Abbrechen folgenlos |
| Externe Preise (4) | **3 bestanden, 1 eingeschränkt** (BUG-2) |
| Transfer (4) | **4 bestanden** — Währungsauswahl vorbelegt, CSV nennt sie in der Kopfzeile ohne Zeichen in den Zahlen |
| Anonyme Erfassung (5) | **5 bestanden** — Währung wird mitgespeichert, Grenzen gelten je Währung ohne Umrechnung |
| Bestandsdaten (3) | **3 bestanden** — alle vorhandenen Fahrzeuge sind EUR, kein Migrationsschritt, für ein reines Euro-Konto ändert sich nichts |

### Randfälle

| Fall | Ergebnis |
|---|---|
| Wechsel mit 47 erfassten Beträgen | Warnung nennt die Zahl ✓ (BUG-4: Nebenkosten fehlen) |
| Hin und wieder zurück | Zahlen unverändert ✓ — der Vorteil des Nicht-Umrechnens |
| Ein einziges Fahrzeug im Konto | **Kein** Währungskennzeichen ✓ — es unterschiede nichts |
| Unbekannter Code aus der Datenbank | Fällt auf Euro zurück, Seite lädt ✓ |
| Öffentliches Kurzprofil eines CHF-Fahrzeugs | Zeigt CHF ✓ (im Backend-Durchgang behoben) |
| Ersatzteil-Alert auf CHF-Fahrzeug | Grenze in Euro, so beschriftet ✓ |

### Was nicht geprüft werden konnte

- **Ein echter Transfer zwischen zwei Konten** mit Währungswechsel — braucht ein zweites Konto mit passender E-Mail. Unverändert offen seit PROJ-32.
- **Das öffentliche Kurzprofil im Browser** — die PROJ-10-E2E-Tests werden alle übersprungen, weil kein veröffentlichtes Profil vorliegt. Ausgerechnet die Seite, an der der Backend-Durchgang den Fehler gefunden hat.
- **Firefox und Safari als Desktop-Browser** — die Suite fährt `chromium` und `Mobile Safari` (WebKit). Die Änderung ist reines `Intl` und Radix; ein browserspezifisches Risiko ist nicht erkennbar, aber auch nicht gemessen.

### Vier Testfehler, die selbst etwas gezeigt haben

Der Weg zu diesen 13 grünen Tests führte über vier eigene Irrtümer. Sie stehen hier, weil jeder von ihnen eine Art Test beschreibt, die stillschweigend falsch grün wird:

1. **Prüfung auf Abwesenheit ohne Vorbedingung.** „Kein Hinweis erscheint" war grün, solange der Hinweis nur langsam genug kam — und die Vorbedingung „Fahrzeug ohne Beträge" war nie hergestellt. Jetzt wird zuerst das **positive** Signal geprüft (der Wert hat gewechselt), und der Fall läuft auf dem Anlegen-Formular, wo er zwingend zutrifft.
2. **Erfundene Beschriftungen.** „Bezeichnung *" gibt es nicht, das Feld heißt „Bezeichnung". Die Beschriftungen stammen jetzt aus dem PROJ-26-Spec statt aus dem Gedächtnis.
3. **Feste Wartezeit statt Bedingung.** Fünf Sekunden auf den Hinweis zu warten war ein Ratespiel gegen eine Abfrage über sieben Tabellen. Jetzt wird auf „Hinweis **oder** neuer Wert" gewartet.
4. **`getByRole` gegen einen offenen Dialog.** Radix markiert die Seite hinter einem Modal als `aria-hidden`; `getByRole` sieht das Feld dann **gar nicht mehr**. Eine Prüfung, die scheinbar auf einen Wert wartet, wartete in Wahrheit auf ein Element, das es aus ihrer Sicht nicht gab.

### Produktionsreife: JA

Keine kritischen, keine hohen Fehler. Die vier Befunde sind Nachbesserungen, keine Blockaden — und zwei davon (BUG-3 sowie der Randbefund zu `search_path`) gehören ohnehin nicht zu dieser Funktion.

**Vor dem Deploy zu klären:** Die sechs Dateien mit der parallelen PROJ-35-Arbeit sind weiterhin nicht committet. Im Repository trägt das Kostenfeld im Scheckheft deshalb noch „(EUR)" statt des Fahrzeug-Symbols — für ein Nicht-Euro-Fahrzeug wäre das genau die falsche Beschriftung, die diese Funktion beseitigen soll.

### Prüfstand (QA)

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests | **728 grün** (38 Dateien) |
| E2E `PROJ-36` (neu) | **13 grün**, 1 als bekannter Fehler markiert (BUG-2) |
| E2E `chromium` (Regression) | **182 / 182 grün** |
| Sicherheitsprüfung | ohne Befund |
