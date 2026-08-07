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
