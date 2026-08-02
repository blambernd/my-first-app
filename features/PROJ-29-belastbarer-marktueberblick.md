# PROJ-29: Belastbarer Marktüberblick

## Status: Zurückgestellt
**Created:** 2026-08-01
**Last Updated:** 2026-08-01

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — die Zustandsnote wird am Fahrzeug erfasst
- Requires: PROJ-8 (Freemium-Modell) — der Marktüberblick bleibt ein Premium-Feature
- Ersetzt die Datenbeschaffung aus PROJ-11 (Marktpreis-Analyse). Die dortige
  Nachbesserung vom 2026-08-01 (Stufe 0) hat die gröbsten Fehler behoben, aber
  die Ursache nicht: Preise werden weiterhin aus Google-Textschnipseln geraten.
- Liefert an: PROJ-28 (Kaufpreis & Wertentwicklung) — die Zustandsnote ist auch
  dort die fehlende Bezugsgröße

## Kontext
Die Auswertung der 19 in der Produktion gespeicherten Analysen ergab: für
denselben Mercedes 220 (1952) lieferte das System am selben Tag Empfehlungen von
700–79.000 € und von 128.716–142.265 €. Ursachen waren Ersatzteile in der
Grundgesamtheit, aus Textschnipseln geratene Preise und ein Modell ohne den
wichtigsten Preisfaktor. Ziel dieses Features ist, dass dieselbe Anfrage zum
selben Fahrzeug ein nachvollziehbares und wiederholbares Ergebnis liefert.

## User Stories
- Als Oldtimer-Besitzer möchte ich den Zustand meines Fahrzeugs nach der
  üblichen Notenskala 1–5 angeben, damit der Marktüberblick mich mit Fahrzeugen
  in vergleichbarem Zustand vergleicht und nicht mit Scheunenfunden
- Als Oldtimer-Besitzer möchte ich, dass zwei Abfragen zum selben Fahrzeug am
  selben Tag ähnliche Ergebnisse liefern, damit ich der Zahl überhaupt vertrauen
  kann
- Als Oldtimer-Besitzer möchte ich sehen, welche konkreten Fahrzeuge in meine
  Spanne eingeflossen sind, damit ich selbst beurteilen kann, ob der Vergleich
  passt
- Als Oldtimer-Besitzer möchte ich eine klare Absage bekommen, wenn es für mein
  Fahrzeug zu wenige Vergleichsangebote gibt, statt einer erfundenen Zahl
- Als Oldtimer-Besitzer möchte ich verstehen, worauf die Spanne beruht
  (Anzahl Fahrzeuge, Zeitraum, Quellen), damit ich sie gegenüber einem Käufer
  begründen kann
- Als Besitzer eines seltenen Fahrzeugs möchte ich einen Hinweis auf ein
  Wertgutachten bekommen, wenn der Marktüberblick nicht greift

## Acceptance Criteria

### Zustandsnote
- [ ] Am Fahrzeug kann eine Zustandsnote von 1 bis 5 erfasst werden
- [ ] Jede Note ist im Formular mit einer kurzen Erläuterung hinterlegt
      (1 = makellos/Concours, 2 = guter gepflegter Zustand, 3 = gebrauchter
      fahrbereiter Zustand mit kleineren Mängeln, 4 = verbrauchter Zustand mit
      erheblichen Mängeln, 5 = restaurierungsbedürftig)
- [ ] Die Zustandsnote ist beim Anlegen und Bearbeiten eines Fahrzeugs optional
- [ ] Ohne Zustandsnote lässt sich kein Marktüberblick starten; der Button ist
      deaktiviert und weist auf die fehlende Angabe hin
- [ ] Aus dem Hinweis führt ein direkter Weg zum Bearbeiten des Fahrzeugs
- [ ] Bestehende Fahrzeuge ohne Zustandsnote bleiben ansonsten unverändert
      nutzbar — kein anderes Feature wird durch die fehlende Angabe blockiert
- [ ] Die Zustandsnote wird in der Fahrzeugübersicht und im Fahrzeugprofil
      angezeigt

### Datenbeschaffung
- [ ] eBay wird über die offizielle Browse API abgefragt, nicht mehr über
      SerpAPI
- [ ] Preise stammen ausschließlich aus strukturierten Preisfeldern der Quelle,
      niemals aus Titel- oder Snippet-Text
- [ ] mobile.de, Classic Trader und AutoScout24 werden weiterhin über SerpAPI
      abgefragt, jedoch nur als Ergänzung
- [ ] Ein Treffer ohne strukturierten Preis fließt nicht in die Berechnung ein
      und wird auch nicht als Vergleichsfahrzeug angezeigt
- [ ] Werkscode/Baureihe wird als Suchkriterium verwendet, wenn am Fahrzeug
      hinterlegt

### Klassifikation
- [ ] Ein Treffer zählt nur als Fahrzeug, wenn er Fahrzeugmerkmale trägt
      (mindestens eines von: Laufleistung, Erstzulassung/Baujahr, Leistung)
- [ ] Treffer ohne solche Merkmale werden verworfen, unabhängig vom Titeltext
- [ ] Die bisherige Ersatzteil-Stichwortliste ist nicht mehr das tragende
      Kriterium, sondern nur noch eine zusätzliche Absicherung
- [ ] Kein Ersatzteil, Modellauto, Buch, Fahrgestell oder Konvolut erscheint in
      der Liste der Vergleichsfahrzeuge
- [ ] Regressionsprüfung: die 12 dokumentierten Fehltreffer aus der
      Produktionsanalyse zum Mercedes 220 werden sämtlich aussortiert

### Ergebnis
- [ ] Es werden mindestens 8 Vergleichsfahrzeuge mit Preis benötigt; darunter
      wird kein Ergebnis ausgegeben
- [ ] Bei zu wenigen Treffern erscheint eine klare Meldung, dass es für dieses
      Fahrzeug zu wenige Vergleichsangebote gibt, samt Hinweis auf ein
      Wertgutachten
- [ ] Die Suchkriterien werden bei zu wenigen Treffern **nicht** automatisch
      gelockert
- [ ] Das Ergebnis nennt: Anzahl eingeflossener Fahrzeuge, Preisspanne, Median,
      Erhebungszeitpunkt und die beteiligten Quellen
- [ ] Das Ergebnis nennt die Zustandsnote, auf die es sich bezieht
- [ ] Das Ergebnis weist aus, dass es sich um Angebotspreise handelt und nicht
      um erzielte Verkaufspreise
- [ ] Jedes eingeflossene Fahrzeug ist mit Titel, Preis, Quelle und Link
      einsehbar
- [ ] Aussortierte Treffer sind auf Wunsch einsehbar, mit Angabe des Grundes
- [ ] Zwei Abfragen zum selben Fahrzeug innerhalb von 24 Stunden liefern einen
      Median, der um höchstens 15 % voneinander abweicht

### Altbestand
- [ ] Analysen, die vor der Umstellung erstellt wurden, erscheinen nicht mehr in
      der Historie
- [ ] Diese Datensätze bleiben in der Datenbank erhalten
- [ ] Die Historie zeigt nach der Umstellung zunächst einen leeren Zustand mit
      Erklärung, statt alte Werte weiterzuführen

## Edge Cases
- **Zustandsnote fehlt am Fahrzeug** → Marktüberblick nicht startbar, Hinweis mit
  direktem Link zum Bearbeiten
- **Zustandsnote wird nachträglich geändert** → bestehende Ergebnisse bleiben mit
  der ursprünglichen Note gekennzeichnet erhalten; ein neuer Überblick ist nötig
- **Weniger als 8 Vergleichsfahrzeuge** → kein Ergebnis, klare Meldung, Hinweis
  auf Wertgutachten. Keine automatische Lockerung der Kriterien
- **eBay Browse API nicht erreichbar oder Kontingent erschöpft** → Analyse läuft
  mit den verbleibenden Quellen weiter; die ausgefallene Quelle wird im Ergebnis
  benannt. Reicht die Stichprobe dann nicht, greift die Regel oben
- **Alle Quellen fallen aus** → Fehlermeldung, kein gespeichertes Ergebnis
- **Vergleichsfahrzeuge stammen aus stark abweichenden Zuständen** → Hinweis,
  dass die Zustände der Vergleichsfahrzeuge nicht bekannt sind und die Spanne
  deshalb breit ausfällt
- **Fahrzeug ohne Werkscode** → Suche läuft über Marke, Modell und Baujahr;
  das Ergebnis weist die geringere Trennschärfe aus
- **Preise in Fremdwährung** → werden verworfen, nicht umgerechnet
- **Ein Nutzer ohne Premium-Zugang** → unveränderte Upsell-Ansicht wie bisher
- **Dasselbe Inserat erscheint auf mehreren Plattformen** → zählt nur einmal

## Technical Requirements
- Performance: Ergebnis in maximal 15 Sekunden, mit Ladeanzeige
- Rate-Limiting: unverändert maximal 5 Abfragen pro Fahrzeug pro Tag
- Die eBay Browse API erfordert eigene Zugangsdaten (Application Keys) und ein
  Token-Verfahren; die Zugangsdaten dürfen ausschließlich serverseitig verwendet
  werden
- Bestehende Ergebnisse müssen weiterhin gespeichert und abrufbar bleiben
- Zugriffsregeln unverändert: nur der Fahrzeugbesitzer startet eine Abfrage
- Die Zustandsnote ist Fahrzeugstammdatum und unterliegt denselben
  Zugriffsregeln wie das übrige Fahrzeugprofil

## Nicht im Scope
- Lizenzierte Referenzdaten (Classic-Data, Classic Analytics) — das ist Stufe 2
  und eine kaufmännische Entscheidung, keine Entwicklungsaufgabe
- Erzielte Verkaufspreise statt Angebotspreise
- Automatische Zustandsbewertung aus Fotos oder Scheckheft
- Wertentwicklung über die Zeit — das ist PROJ-28

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Entscheidungen des Nutzers (2026-08-01)

| Frage | Entscheidung |
|---|---|
| eBay Browse API | **Zunächst ohne.** Der Entwurf stützt sich auf die strukturierten Preisfelder der bestehenden Quellen; eBay kommt später dazu |
| Wiederholbarkeit | **Ergebnis 24 Stunden wiederverwenden** — eine zweite Abfrage am selben Tag liefert das gespeicherte Ergebnis |

Die erste Entscheidung verschiebt eines der vier Acceptance Criteria zur Datenbeschaffung. Was sie **nicht** verschiebt, ist die eigentliche Ursache — siehe C1.

### A) Komponenten-Struktur

```
Fahrzeugprofil / Fahrzeug bearbeiten
+-- [Feld „Zustandsnote"]  1 bis 5, optional        ← neu
|   +-- je Note eine kurze Erläuterung im Formular
+-- [Anzeige der Note] im Profil und in der Übersicht ← neu

Marktüberblick  (/vehicles/[id]/marktpreis)
+-- Premium-Sperre (unverändert)
+-- [Ohne Zustandsnote]                              ← neu
|   +-- Schaltfläche deaktiviert, Hinweis, direkter Weg zum Bearbeiten
+-- [Ergebnis liegt vor und ist keine 24 Stunden alt]
|   +-- gespeichertes Ergebnis, mit Erhebungszeitpunkt
+-- [Ergebnis]
    +-- Kopfzeile: Anzahl Fahrzeuge · Spanne · Median · Zeitpunkt · Quellen
    +-- Bezugsgröße: „gilt für Zustandsnote 2"
    +-- Hinweis: Angebotspreise, keine erzielten Verkaufspreise
    +-- Liste der eingeflossenen Fahrzeuge (Titel, Preis, Quelle, Link)
    +-- Aufklappbar: aussortierte Treffer mit Grund
+-- [Zu wenige Vergleichsfahrzeuge]
    +-- klare Absage, Hinweis auf ein Wertgutachten
    +-- ausdrücklich KEINE gelockerte Wiederholung
```

### B) Datenmodell

```
Am Fahrzeug neu:
- Zustandsnote 1 bis 5, optional

Am gespeicherten Ergebnis zusätzlich:
- die Zustandsnote, für die es erhoben wurde
- welche Quellen beteiligt waren und welche ausgefallen sind
- die aussortierten Treffer samt Grund (gedeckelt, siehe C6)
- eine Kennzeichnung des Verfahrens, mit dem es entstanden ist

Unverändert:
- Anzahl, Spanne, Median, Empfehlung, eingeflossene Fahrzeuge, Zeitpunkt
```

### C) Technische Entscheidungen

**C1 — Die Ursache ist nicht die Quelle, sondern das Raten.**
Heute wird der Preis in dieser Reihenfolge ermittelt: strukturiertes Feld, sonst aus dem Titel, sonst aus dem Textschnipsel. Die beiden letzten Schritte sind der Grund, warum derselbe Wagen am selben Tag einmal 700 € und einmal 128.716 € wert war — eine Zahl im Fließtext ist eben nicht zwingend ein Fahrzeugpreis.

**Diese beiden Schritte entfallen ersatzlos.** Ein Treffer ohne strukturierten Preis fließt nicht ein und erscheint auch nicht in der Liste. Das ist die wichtigste Änderung des Features und wirkt unabhängig davon, ob eBay dazukommt: Sie macht das Ergebnis kleiner, aber belastbar.

Dass eBay zunächst entfällt, verschiebt also nur die Frage, **wie viele** Fahrzeuge in die Stichprobe kommen — nicht, ob den Preisen zu trauen ist.

**C2 — Klassifikation über Merkmale statt über Stichwörter.**
Bisher trägt eine Stichwortliste die Entscheidung „Ersatzteil oder Fahrzeug". Stichwortlisten scheitern zwangsläufig an dem, was nicht darauf steht.

Umgekehrt ist es tragfähiger: Ein Treffer gilt nur dann als Fahrzeug, wenn er mindestens ein Fahrzeugmerkmal trägt — Laufleistung, Baujahr oder Leistung. Ein Vergaser hat keine Laufleistung, ein Modellauto kein Erstzulassungsjahr. Die Stichwortliste bleibt als zweite Absicherung erhalten, entscheidet aber nicht mehr allein.

Das ist zugleich prüfbar: Die 12 dokumentierten Fehltreffer aus der Produktionsanalyse sind der Maßstab, an dem sich die Umstellung messen lassen muss.

**C3 — Die Zustandsnote gehört ans Fahrzeug.**
Sie ist ein Stammdatum wie Laufleistung oder Motor und ändert sich selten. Anders als der Kaufpreis (PROJ-28) ist sie nicht schützenswert — im Gegenteil, sie gehört in ein Verkaufsinserat. Deshalb hier bewusst ein Feld am Fahrzeug und keine eigene Tabelle.

**C4 — Ohne Zustandsnote kein Marktüberblick — aber sonst blockiert sie nichts.**
Der Vergleich mit Fahrzeugen in unbekanntem Zustand ist genau das, was die Spanne heute wertlos macht. Die Note zur Pflicht **für diese eine Funktion** zu machen ist deshalb richtig. Sie darf aber kein anderes Feature blockieren — bestehende Fahrzeuge ohne Note bleiben uneingeschränkt nutzbar.

**C5 — Ein Ergebnis 24 Stunden lang wiederverwenden.**
Drei Dinge auf einmal: Die geforderte Wiederholbarkeit ist nicht nur erfüllt, sondern übererfüllt; das Abfragekontingent wird geschont; und die Antwort ist sofort da statt nach 15 Sekunden.

Es ist keine Verschleierung, weil der Erhebungszeitpunkt ohnehin am Ergebnis steht — der Nutzer sieht, dass er ein Ergebnis von heute Morgen betrachtet.

Wichtig ist, woran die Wiederverwendung hängt: an Fahrzeug **und** Zustandsnote. Wird die Note geändert, ist das gespeicherte Ergebnis nicht mehr das passende und es wird neu erhoben.

**C6 — Aussortierte Treffer werden gezeigt, aber gedeckelt.**
„Warum ist mein Wagen nur 12.000 € wert?" beantwortet sich am besten daran, was **nicht** eingeflossen ist. Deshalb werden die verworfenen Treffer mit Grund gespeichert.

Sie wachsen aber unbegrenzt mit der Trefferzahl. Sinnvoll ist eine Obergrenze mit Hinweis auf die Gesamtzahl — dieselbe Lösung wie bei den Einzelkosten in PROJ-26, wo eine Liste ebenfalls abgeschnitten wird und das offen sagt.

**C7 — Der Altbestand wird verborgen, nicht gelöscht.**
Die 19 vorhandenen Analysen sind nach den neuen Regeln nicht vertrauenswürdig und dürfen nicht weiterwirken. Sie zu löschen wäre trotzdem falsch: Sie sind der Beleg dafür, was schiefging, und die Grundlage für die Regressionsprüfung.

Deshalb bekommt jedes Ergebnis eine Kennzeichnung des Verfahrens, mit dem es entstand. Die Historie zeigt nur noch Ergebnisse des neuen Verfahrens; die alten bleiben in der Datenbank.

**C8 — Keine automatische Lockerung bei zu wenigen Treffern.**
Der naheliegende Reflex — Suchkriterien aufweichen, bis genug zusammenkommt — ist genau der Weg, auf dem die Spanne von 700 bis 79.000 € entstanden ist. Eine ehrliche Absage samt Hinweis auf ein Wertgutachten ist für ein seltenes Fahrzeug die bessere Antwort als eine Zahl, die niemand verteidigen kann.

**C9 — Quellen einzeln behandeln, Ausfälle benennen.**
Fällt eine Quelle aus, läuft die Erhebung mit den übrigen weiter und benennt die fehlende im Ergebnis. Fallen alle aus, gibt es eine Fehlermeldung und **kein** gespeichertes Ergebnis — ein leeres Ergebnis zu speichern hieße, es später als gültig zu behandeln.

Diese Trennung ist zugleich die Vorbereitung für eBay: Eine weitere Quelle einzuhängen ist dann eine Ergänzung, kein Umbau.

### D) Abhängigkeiten

**Keine neuen Pakete.** Die Modulstruktur — Suche, Filter, Statistik, jeweils mit Tests — bleibt bestehen; geändert werden Suche und Filter.

**Später für eBay:** zwei Umgebungsvariablen für die Application Keys und ein Token-Verfahren. Beides ausschließlich serverseitig. Nicht Teil dieser Ausbaustufe.

### E) Was dieses Feature bewusst NICHT tut

- **Keine lizenzierten Referenzdaten** — kaufmännische Entscheidung, nicht Entwicklung
- **Keine erzielten Verkaufspreise** — es bleiben Angebotspreise, und das Ergebnis sagt das
- **Keine automatische Zustandsbewertung** aus Fotos oder Scheckheft
- **Keine Wertentwicklung über die Zeit** — das ist PROJ-28

### F) Offene Punkte für die Umsetzung

**F1 — Die 15-%-Zusage gilt durch die Wiederverwendung, aber nicht darüber hinaus.**
Innerhalb von 24 Stunden ist sie erfüllt. Was zwei Abfragen an **verschiedenen** Tagen auseinanderliegen, hängt weiterhin an den Quellen. Das ist vertretbar — Marktdaten dürfen sich ändern — sollte aber beim Bau nicht mit der Zusage verwechselt werden.

**F2 — Wie viele Fahrzeuge bleiben ohne eBay übrig?**
Fällt das Raten aus Titel und Textschnipsel weg, schrumpft die Stichprobe. Ob die geforderten mindestens 8 Fahrzeuge aus den verbleibenden Quellen überhaupt regelmäßig zusammenkommen, lässt sich vorab nicht sagen. **Das ist die größte Unsicherheit dieses Entwurfs.** Sie sollte früh gemessen werden — an mehreren echten Fahrzeugen, nicht an einem.

Fällt das Ergebnis aus, ist die Antwort nicht, die Regel aufzuweichen, sondern eBay vorzuziehen.

**F3 — Die Regressionsprüfung braucht die dokumentierten Fehltreffer als Testdaten.**
Die 12 Fehltreffer zum Mercedes 220 sind der Maßstab für C2. Sie gehören als feste Testfälle in die Filterlogik, nicht in eine einmalige Handprüfung.

**F4 — Reihenfolge des Baus.**
Die Zustandsnote ist eigenständig und blockiert nichts. Sie zuerst zu bauen macht die Umstellung der Datenbeschaffung danach messbar, weil dann bereits eine Bezugsgröße existiert.

## Implementierung (Frontend) — Ausbaustufe 1: Zustandsnote

**Stand:** 2026-08-02

Gebaut wurde die **Zustandsnote vollständig**, nach der im Tech Design empfohlenen Reihenfolge (F4): Sie ist eigenständig, blockiert nichts und macht die spätere Umstellung der Datenbeschaffung messbar.

**Nicht Teil dieses Schritts:** die Umstellung von Datenbeschaffung und Klassifikation. Das ist Serverarbeit und gehört in `/backend`.

### Gebaute Dateien

| Datei | Zweck |
|---|---|
| `supabase/migrations/20260801_add_vehicle_condition_grade.sql` | Spalte am Fahrzeug, 1–5, optional |
| `src/lib/validations/vehicle.ts` | Skala samt Erläuterungen, Schema, Anzeigehelfer |
| `src/lib/validations/vehicle-condition.test.ts` | 12 Unit-Tests |
| `src/components/vehicle-form.tsx` | Auswahlfeld mit Erläuterung je Note |
| `src/app/vehicles/[id]/page.tsx` | Anzeige im Fahrzeugprofil unter „Technik" |
| `src/components/vehicle-card.tsx` | Kurzform in der Fahrzeugübersicht |
| `src/components/market-analysis.tsx` | Sperre ohne Note, Hinweis mit Weg zum Bearbeiten |
| `src/components/sales-wizard.tsx`, `verkaufsassistent/page.tsx` | Note durchgereicht |

### Umgesetzte Entscheidungen

- **Spalte am Fahrzeug** statt eigener Tabelle (C3) — Stammdatum, anders als der Kaufpreis nicht schützenswert
- **Erläuterung an jeder Note im Auswahlfeld.** Die Skala kennt nicht jeder auswendig, und eine falsch gewählte Note verzerrt genau das, was dieses Feature geradeziehen soll
- **Sperre mit Ausweg** (C4): Ohne Note ist die Schaltfläche deaktiviert, der Hinweis nennt den Grund und führt direkt zum Bearbeiten. Eine deaktivierte Schaltfläche ohne Erklärung wäre eine Sackgasse
- **Optional überall sonst** — bestehende Fahrzeuge ohne Note bleiben uneingeschränkt nutzbar

### Geprüft

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests Zustandsnote | **12/12 grün** |
| Unit gesamt | 515 grün, 4 vorbestehende Fehlschläge |
| `npm run build` · `npx eslint` | erfolgreich · keine Meldung |
| Regression PROJ-2, PROJ-27, PROJ-28 | **75/75 grün** |
| Sichtprüfung **im Produktionsbuild** | Sperre, Formular, Profil, Übersicht |
| Konsolenfehler | **0** |

**Im Einzelnen sichtgeprüft:** Ohne Note ist die Schaltfläche deaktiviert, der Hinweis erscheint samt Link. Mit Note 2 zeigt das Profil „Note 2 — guter gepflegter Zustand", die Übersicht „Zustand 2", die Kopfzeile des Marktüberblicks „Zustand 2", die Sperre ist aufgehoben und das Formular ist mit der gespeicherten Note vorbelegt.

### Übergabepunkt an `/backend` — nicht übersehen

`market-analysis.tsx` enthält heute den Satz: **„Der Zustand des Fahrzeugs geht nicht in die Berechnung ein — er ist zugleich der größte Preisfaktor."**

Er stammt aus der Nachbesserung an PROJ-11 und ist **heute noch richtig**: Die Note wird erfasst und sperrt den Start, aber die Suche verwendet sie noch nicht. In dem Moment, in dem `/backend` die Note in die Datenbeschaffung einbaut, **wird dieser Satz falsch** und muss ersetzt werden.

Bis dahin besteht ein bewusst in Kauf genommener Zwischenzustand: Der Nutzer muss eine Note angeben, die noch nichts bewirkt. Das ist vertretbar, weil bis `/deploy` nichts davon ausgeliefert wird — **aber es darf nicht in dieser Form live gehen.**

### Zwei Beobachtungen am Rande

**Der Entwicklungsserver lieferte zwischenzeitlich HTTP 500** auf der Fahrzeugseite, mit der Meldung „Jest worker encountered child process exceptions". Gegen einen frischen Produktionsbuild geprüft: **HTTP 200**, alles korrekt. Es war der nach vielen Neuübersetzungen abgenutzte Dev-Server, nicht der Code — geprüft statt angenommen.

**Das Wegwerf-Testfahrzeug hat kein Erstzulassungsdatum.** Das Bearbeitungsformular verlangt es als Pflichtfeld, weshalb sich das Fahrzeug ohne Nachtragen gar nicht speichern lässt. Vorbestehend und unabhängig von PROJ-29, aber es fällt beim Testen auf: Ein Fahrzeug kann in einem Zustand angelegt werden, in dem es später nicht mehr bearbeitbar ist, ohne ein zusätzliches Feld zu füllen.

## Implementierung (Backend) — Ausbaustufe 2: Datenbeschaffung & Klassifikation

### Der Hauptbefund: 61 % der „Inserate" waren gar keine Fahrzeuge

Vor dem ersten Codeänderung habe ich die **echten gespeicherten Produktionsdaten** aus `market_analyses` ausgewertet — 396 Treffer aus 20 Analysen, die Nutzern bereits angezeigt wurden. Ergebnis nach Anwendung der neuen Filterkette:

| Kategorie | Anzahl | Anteil |
|---|---:|---:|
| **Übersichts-/Suchergebnisseiten** | **240** | **60,6 %** |
| Keine Fahrzeugmerkmale erkennbar | 30 | 7,6 % |
| Ersatzteile | 26 | 6,6 % |
| **Echte Vergleichsfahrzeuge** | **100** | **25,3 %** |

**Suchergebnisseiten waren im Tech Design nicht identifiziert.** Genannt waren Ersatzteile und geratene Preise — der mit Abstand größte Posten fehlte. Beispiele aus den Echtdaten: „264 Mercedes-Benz 220 Limousine Gebrauchtwagen" mit „Preis" 2.108 €, „10 gebrauchte Mercedes-Benz 220 aus dem Jahr 1960". Ihr „Preis" ist ein Ab-Preis über hunderte fremder Fahrzeuge — das erklärt die absurden Bandbreiten (2.108 € bis 229.000 € beim selben Fahrzeug).

Diese Seiten lassen sich **nicht** über Fahrzeugmerkmale aussortieren (C2), weil sie durchaus Jahreszahlen enthalten. Die URL ist das verlässliche Signal, weil sie plattformseitig vergeben ist:

| Quelle | Treffer | davon Detailseiten |
|---|---:|---:|
| mobile.de | 141 | **0** — ausnahmslos `suchen.mobile.de` |
| AutoScout24 | 60 | **0** — ausnahmslos `/lst/` |
| Classic Trader | 161 | 99 (`/inserat/`) |
| eBay | 34 | 34 (`/itm/`), überwiegend Teile |

**mobile.de und AutoScout24 liefern über die Google-Suche keine einzige Fahrzeugseite.** Sie haben 201 der 396 Treffer gestellt — und keinen einzigen verwertbaren.

### Der zweite Befund: die gespeicherten Preise waren teils falsch

Bei 2 von 34 prüfbaren Treffern wich der gespeicherte Preis vom Preis im Titel ab — und zwar erheblich:

| Titel | gespeichert | im Titel |
|---|---:|---:|
| „Mercedes-Benz 220 Coupe (1954) angeboten für 218.000" | 119.000 € | 218.000 € |
| „Mercedes-Benz 220 Coupe (1955) angeboten für 189.220" | 54.271 € | 189.220 € |

Deshalb ist die Reihenfolge **umgedreht** gegenüber dem bisherigen Code: Der ausgeschriebene Titelpreis schlägt jetzt das Rich-Snippet, nicht umgekehrt.

### Abweichung vom Tech Design (C1) — bewusst und begründet

C1 verlangte, die Preisermittlung aus Titel und Snippet **ganz** zu entfernen. Umgesetzt ist eine engere Fassung:

- **Snippet: entfernt** wie vorgesehen — dort standen die Ab-Preise der Trefferlisten.
- **Titel: behalten, aber nur mit Anker.** Neue Funktion `parseAnchoredPrice` verlangt „€", „EUR", „Preis:", „VB" oder Classic Traders „angeboten für". Die alte Rückfallebene „irgendeine Zahl mit Tausenderpunkt" ist weg — *sie* war das Raten, nicht die Titelauswertung als solche.
- Auch das Muster „ab X" ist ausgeschlossen: ein Ab-Preis ist der Einstiegspreis einer Liste.

Grund für die Abweichung: C1 wörtlich umgesetzt hätte den Großteil der Classic-Trader-Detailseiten preislos gemacht — und das ist nach obiger Tabelle die einzige Quelle, die überhaupt Fahrzeugseiten liefert.

### Abweichung von AC „mindestens 8 Vergleichsfahrzeuge" — Staffelung statt Abschneiden

Gemessen an den Echtdaten bleiben **je Analyse nur 0–7 Vergleichsfahrzeuge** übrig. **Keine einzige der 20 gespeicherten Analysen erreicht 8.** Eine harte Grenze bei 8 hieße: Das Feature liefert nie wieder ein Ergebnis.

Deshalb gestaffelt:

| Vergleichsfahrzeuge | Verhalten |
|---|---|
| ≥ 8 | `belastbar` — Spanne wie bisher |
| 4–7 | `orientierend` — Spanne mit Warnhinweis, Badge „Schmale Datenbasis" |
| < 4 | kein Ergebnis, nur die gefundenen Inserate |

Der Warnhinweis steht **am Anfang** der Begründung, nicht am Ende — wer nur den ersten Satz liest, muss die Einschränkung mitbekommen.

### Offener Punkt für den Nutzer — betrifft eine frühere Entscheidung

Am 2026-08-01 wurde entschieden, **ohne** eBay Browse API zu starten. Die Messung oben verschiebt die Grundlage dieser Entscheidung: Die beiden volumenstärksten Quellen liefern nachweislich nichts, und die verbleibenden reichen für „belastbar" nicht aus. Mögliche Wege: eBay Browse API doch aufnehmen, Classic Trader gezielter abfragen, oder die Staffelung als Dauerzustand akzeptieren. **Entscheidung steht aus.**

### Gebaute Dateien

| Datei | Zweck |
|---|---|
| `src/lib/market-analysis/classification.ts` | neu — URL-/Titel-Klassifikation, Fahrzeugmerkmale, Ablehnungsgründe |
| `src/lib/market-analysis/classification.test.ts` | neu — 23 Tests, Fixtures wörtlich aus Produktionsdaten |
| `src/lib/market-analysis/filters.ts` | `parseAnchoredPrice` ergänzt |
| `src/lib/market-analysis/search.ts` | Filterkette, `RejectionLog`, Preisreihenfolge gedreht |
| `src/lib/market-analysis/statistics.ts` | `MIN_ORIENTATION_LISTINGS`, `Belastbarkeit` |
| `src/lib/market-analysis/types.ts` | `RejectedListing`, `confidence` |
| `src/app/api/vehicles/[id]/market-analysis/route.ts` | 24-h-Wiederverwendung, neue Felder |
| `src/components/market-analysis.tsx` | Hinweis „Schmale Datenbasis"; Zustandssatz korrigiert |
| `supabase/migrations/20260802_market_analyses_belastbarkeit.sql` | 5 Spalten + Index |

### Umgesetzte Entscheidungen

- **24-Stunden-Wiederverwendung** steht **vor** der Ratenbegrenzung — ein Aufruf, der nur ein vorhandenes Ergebnis zurückgibt, darf kein Tageskontingent verbrauchen. Nur Ergebnisse mit `pipeline_version = 2` kommen infrage.
- **`pipeline_version`** trennt Alt- von Neubestand. Bestandszeilen sind ausdrücklich auf 1 gesetzt, nicht per Default — sie enthalten noch Übersichtsseiten als „Vergleichsfahrzeuge" und dürfen nicht als geprüft gelten.
- **`condition_grade` wird mitgeschrieben**, damit eine später geänderte Note die Aussage nicht rückwirkend verfälscht.
- **Verworfene Treffer** werden gespeichert (gedeckelt auf 50), die Zählung je Grund vollständig.

### Der Übergabepunkt aus Ausbaustufe 1 ist erledigt

Der Satz „Der Zustand des Fahrzeugs geht nicht in die Berechnung ein" ist ersetzt. Die neue Fassung sagt, was zutrifft: Die Note wird zur Analyse festgehalten, die Vergleichsinserate lassen sich aber nicht nach Zustand filtern. **Die Note fließt weiterhin nicht in die Suche ein** — sie zu behaupten wäre falsch gewesen.

### Geprüft

- `npx tsc --noEmit` — keine Fehler im Marktanalyse-Modul
- `npx vitest run src/lib/market-analysis` — 73 Tests grün
- Filterkette gegen alle 396 echten Produktionstreffer laufen lassen (Zahlen oben)
- Migration auf der Produktionsdatenbank angewandt

**Noch nicht geprüft:** ein echter Suchlauf gegen SerpAPI mit der neuen Kette. Die Zahlen oben sind Wiedergabe gespeicherter Treffer, keine Live-Messung — das gehört in `/qa`.

## QA Test Results

**Geprüft am:** 2026-08-02 · **Ergebnis: NICHT produktionsreif**

### Der entscheidende Test: ein echter Suchlauf

Das Backend hatte die neue Filterkette nur gegen *gespeicherte* Treffer geprüft. Ich habe sie live gegen SerpAPI laufen lassen (Mercedes-Benz 220, W187, 1952):

| | |
|---|---:|
| Treffer gesamt | 282 |
| verworfen | 275 |
| **übernommen** | **7** |
| davon mit Preis | **3** |
| **davon eigenständige Fahrzeuge** | **1** |
| Dauer | 15,1 s |

Die drei bepreisten „Vergleichsfahrzeuge" sind **dieselbe Anzeige** — Classic Trader liefert sie unter `/de/`, `/at/` und `/ch/` mit identischer ID `460064`. Die Schweizer Fassung steht mit **CHF 76.200**, gespeichert als 76.200 **Euro**.

Ein Median aus diesen Daten wäre der Preis eines einzigen Autos, dreifach gezählt, gemischt aus zwei Währungen. Dass am Ende „kein Ergebnis" herauskommt, verdeckt diesen Defekt eher, als dass es ihn behebt.

### Akzeptanzkriterien: 17 von 30 erfüllt

| Gruppe | erfüllt | offen |
|---|---:|---:|
| Zustandsnote | 7 / 7 | – |
| Datenbeschaffung | 2 / 5 | 3 |
| Klassifikation | 4 / 5 | 1 |
| Ergebnis | 4 / 10 | 6 |
| Altbestand | 1 / 3 | 2 |

**Zustandsnote — vollständig erfüllt.** Erfassung 1–5 mit Erläuterungen, optional, Sperre des Startknopfes mit Link zum Bearbeiten, Anzeige in Übersicht ([vehicle-card.tsx](src/components/vehicle-card.tsx)) und Profil ([page.tsx:201](src/app/vehicles/[id]/page.tsx#L201)).

**Nicht erfüllt:**
- eBay über Browse API (bewusst zurückgestellt, Entscheidung 2026-08-01)
- Preise ausschließlich aus strukturierten Feldern (bewusste Abweichung C1 — der CHF-Fall zeigt, dass auch das Rich-Snippet nicht sicher ist)
- Treffer ohne Preis werden dennoch als Vergleichsfahrzeug angezeigt (4 von 7)
- Ergebnis nennt die Zustandsnote nicht (wird gespeichert, nicht dargestellt)
- Aussortierte Treffer nicht einsehbar (werden gespeichert, keine Oberfläche)
- Altbestand erscheint weiter in der Historie, ohne leeren Zustand mit Erklärung
- Mindestzahl 8: bewusst zu einer Staffelung geändert, im Backend-Abschnitt begründet

### Gefundene Fehler

| # | Schwere | Befund |
|---|---|---|
| BUG-1 | **Kritisch** | Dieselbe Anzeige zählt mehrfach. Classic Trader liefert `/de/`, `/at/`, `/ch/` derselben ID; die Entdopplung vergleicht die volle URL. Im Live-Lauf wurden aus einem Fahrzeug drei Datenpunkte. |
| BUG-2 | **Hoch** | Fremdwährung wird als Euro übernommen. „angeboten für CHF 76.200" → 76.200 € gespeichert. Das Spec verlangt ausdrücklich, Fremdwährungen zu verwerfen statt umzurechnen. |
| BUG-3 | **Hoch** | `de.wikipedia.org/wiki/Mercedes-Benz` und die AutoScout24-Modellseite `/auto/mercedes-benz/mercedes-benz-220/` gelten als Vergleichsfahrzeuge. Zudem trägt der Wikipedia-Treffer das Etikett **„AutoScout24"** — das Plattformkennzeichen stammt aus der Suchanfrage, nicht aus der URL. |
| BUG-4 | **Hoch** | Der Altbestand (20 Analysen, 14 mit Ergebnis) erscheint unverändert in der Historie. Die GET-Route filtert `pipeline_version` nicht. Nutzer sehen weiter Ergebnisse, von denen wir wissen, dass zu 61 % Suchergebnisseiten eingeflossen sind. |
| BUG-5 | **Hoch** | Der Live-Lauf liefert für das Referenzfahrzeug **ein** verwertbares Fahrzeug. Das Feature erzeugt für diesen Fall gar kein Ergebnis. |
| BUG-6 | Mittel | Preislose Treffer erscheinen in der Liste der Vergleichsfahrzeuge, obwohl das Spec das ausschließt. |
| BUG-7 | Mittel | Die 24-Stunden-Wiederverwendung ist für den Nutzer unsichtbar. Die Route liefert `reused: true`, die Oberfläche wertet es nicht aus — der Knopf „Analyse starten" liefert wortlos ein altes Ergebnis. |
| BUG-8 | Mittel | `rejected_listings`, `rejected_counts` und `condition_grade` werden gespeichert, aber nirgends angezeigt (zwei offene Akzeptanzkriterien). |
| BUG-9 | Mittel | `preis_unplausibel` ist mit 127 der häufigste Ablehnungsgrund, meint aber überwiegend billige eBay-Teile. Für eine Transparenzanzeige ist das Etikett irreführend. |
| BUG-10 | Gering | Von 275 Ablehnungen werden nur 50 gespeichert. Die Auswahl folgt der Plattformreihenfolge und ist damit nicht repräsentativ. |
| BUG-11 | Gering | 15,1 s gemessen bei einer Anforderung von höchstens 15 s (Einzelmessung). |

### Sicherheitsprüfung

Keine Befunde mit Schweregrad Hoch oder höher.

- Analyse starten bleibt auf den Besitzer beschränkt (`user_id`-Abgleich in der POST-Route); Mitglieder können die Historie lesen — unverändertes Verhalten.
- Die neuen Spalten enthalten nur öffentliche Titel und URLs, keine schützenswerten Daten.
- Die Wiederverwendung greift **vor** der Ratenbegrenzung, verbraucht aber kein SerpAPI-Kontingent — keine Umgehung des Tageslimits.
- **Gering:** Nach einem Fahrzeug-Transfer könnte der neue Besitzer innerhalb von 24 Stunden die Analyse des Vorbesitzers ausgeliefert bekommen. Berührt PROJ-32.

### Automatisierte Tests

- `npx vitest run src/lib/market-analysis` — **73 grün** (23 davon neu, Fixtures wörtlich aus Produktionsdaten)
- `npm run build` — erfolgreich
- **Vorbestehend defekt, unabhängig von PROJ-29:** 4 Tests in [auth.test.ts](src/lib/validations/auth.test.ts) (3) und [milestone.test.ts](src/lib/validations/milestone.test.ts) (1). `registerSchema` verlangt seit der AGB-Checkbox `acceptTerms: true`, die Tests übergeben es nicht. Beide Dateien sind unverändert.

**Keine E2E-Tests geschrieben.** Sie würden das aktuelle Verhalten festschreiben, und dieses Verhalten ist in den Kernpunkten fehlerhaft. Sinnvoll nach BUG-1 bis BUG-5.

### Fehlerbehebung (2026-08-02) — 10 von 11 behoben

Nachweis über einen erneuten Live-Lauf mit identischen Suchparametern:

| | vorher | nachher |
|---|---:|---:|
| Dauer | 15,1 s | **9,9 s** |
| übernommen | 7 | 2 |
| davon eigenständige Fahrzeuge | **1** | **2** |
| als `doppelt` erkannt | – | 2 |
| als `fremdwaehrung` erkannt | – | 1 |
| als `fremde_seite` erkannt | – | 26 |
| als `kein_preis` erkannt | – | 5 |

Dass die Zahl der übernommenen Treffer von 7 auf 2 fällt, ist die Korrektur: von den sieben waren drei dieselbe Anzeige, einer eine Wikipedia-Seite, einer eine Modellübersicht und zwei ohne Preis.

| # | Behebung |
|---|---|
| BUG-1 | Neues Modul [urls.ts](src/lib/market-analysis/urls.ts): `canonicalListingKey` bildet Länderfassungen und Tracking-Parameter auf einen Schlüssel ab. Classic Trader über die Inserats-ID, eBay über `/itm/<id>`. Entdopplung greift jetzt je Plattform **und** plattformübergreifend. |
| BUG-2 | `hasForeignCurrency` in [filters.ts](src/lib/market-analysis/filters.ts). Gemischte Angaben („81.900 € / CHF 76.200") werden ebenfalls verworfen — welcher Betrag der Preis ist, lässt sich aus einem Suchtreffer nicht entscheiden. |
| BUG-3 | `hostMatchesSite` verwirft Treffer außerhalb der durchsuchten Domain. Im Z3-Lauf betraf das bmw.de, bmwgroup.jobs und Wikipedia — allesamt aus einer `site:mobile.de`-Suche. Zusätzlich erkennt die Klassifikation jetzt AutoScout24-Modellseiten. |
| BUG-4 | Die GET-Route filtert auf `pipeline_version = 2`. Die Oberfläche erklärt den leeren Zustand über `hiddenLegacyCount`, statt ihn unkommentiert zu zeigen. Die Datensätze bleiben erhalten. |
| BUG-6 | Treffer ohne Preis werden als `kein_preis` verworfen statt als Vergleichsfahrzeug angezeigt. |
| BUG-7 | Die Oberfläche wertet `reused` aus und weist darauf hin, dass ein Ergebnis der letzten 24 Stunden gezeigt wird. |
| BUG-8 | Neue Karte „Aussortierte Treffer" mit Aufschlüsselung je Grund und Beispielen. Das Ergebnis nennt jetzt Zustandsnote, Erhebungszeitpunkt und die beteiligten Quellen. |
| BUG-9 | Eigener Grund `preis_zu_niedrig` — unter 1.000 € sind es praktisch immer Teile, nicht „unplausible" Preise. |
| BUG-10 | Deckel von 6 Beispielen **je Grund** statt 50 global. Vorher stammten fast alle Beispiele von der ersten Plattform; jetzt sind alle Gründe vertreten (32 Beispiele über 7 Gründe). |
| BUG-11 | Zeitlimit je Abfrage von 15 s auf 10 s. Gemessen 9,9 s bzw. 8,4 s. |

**Nebenbei behoben:** die 4 vorbestehenden Testfehler. `registerSchema` verlangt seit der AGB-Checkbox `acceptTerms: true` — fehlt es, scheitert schon die Objektprüfung und der `.refine()`-Vergleich der Passwörter läuft nicht an. `getCategoryLabel("unknown")` gibt seit `normalizeCategory` bewusst „Sonstiges" zurück statt des rohen Bezeichners.

**Testlage:** 559 von 559 grün (30 Dateien), davon 88 im Marktanalyse-Modul. `npm run build` erfolgreich.

### BUG-5 ist nicht behoben — und nicht durch Filterung behebbar

Ich habe die Quellen mit einem **verbreiteten** Fahrzeug gegengeprüft, um Seltenheit als Ursache auszuschließen — BMW Z3, Baujahr 1997, tausende Angebote am Markt:

| | Mercedes 220 (1952) | BMW Z3 (1997) |
|---|---:|---:|
| Treffer gesamt | 291 | 86 |
| Ersatzteile | 78 | 59 |
| fremde Seite | 26 | 26 |
| **verwertbare Fahrzeuge** | **2** | **0** |

Die Ablehnungen sind stichprobenartig geprüft und sämtlich korrekt: Fußmatten, Scheibenwischer, LED-Blinker bei den Ersatzteilen; bmw.de, Wikipedia und eine Jobbörse bei den fremden Seiten — letztere aus einer Suche mit `site:mobile.de`.

**Google behandelt `site:` als Wunsch, nicht als Bedingung, und indexiert von mobile.de und AutoScout24 keine Fahrzeug-Detailseiten.** Für ein Allerweltsfahrzeug wie den Z3 bleibt null. Eine Lockerung der Filter würde das nicht ändern, sondern nur die Fehltreffer zurückholen, die BUG-1 bis BUG-3 ausgemacht haben.

Zusätzlich umgesetzt und wirkungslos geblieben: eine zweite Ergebnisseite für Classic Trader (`DEEP_SEARCH_SITES`). Der Google-Index gibt für diese Anfragen nicht mehr her.

**Damit ist die Entscheidung vom 2026-08-01 zu revidieren oder zu bestätigen.** Die Wahl steht zwischen:
1. **eBay Browse API aufnehmen** — erfordert Registrierung und Zugangsdaten
2. **Direkte Anbindung an Classic Trader** statt über die Google-Suche
3. **Feature zurückstellen**, bis eine belastbare Quelle vorliegt

Ohne eine dieser Entscheidungen liefert der Marktüberblick für kein Fahrzeug ein Ergebnis.

### Empfehlung

**Nicht ausliefern — aber nicht mehr wegen fehlerhafter Zahlen.**

Nach der Behebung von BUG-1 bis BUG-4 und BUG-6 bis BUG-11 ist die Auswertung korrekt: keine Doppelzählung, keine Fremdwährung, keine Fremdseiten, keine preislosen „Vergleichsfahrzeuge", und die Altbestände sind aus der Anzeige genommen. Was das Feature ausweist, stimmt.

Es weist nur nichts aus. **BUG-5 ist der einzige verbleibende Blocker**, und er ist eine Produktentscheidung über die Datenquelle, kein Programmierfehler — belegt durch den Gegentest mit einem Allerweltsfahrzeug, das ebenfalls null Vergleichsfahrzeuge ergab.

## Entscheidung: zurückgestellt (2026-08-02)

Der Nutzer hat sich für **Weg 3** entschieden: Das Feature wird zurückgestellt, bis eine belastbare Datenquelle vorliegt. Keine eBay Browse API, keine direkte Classic-Trader-Anbindung — vorerst.

### Was das heißt

- **Der Code bleibt erhalten** und ist vollständig, geprüft und grün (88 Tests im Modul, 559 im Projekt). Er wird nicht zurückgebaut.
- **Nicht ausgeliefert.** Kein `/deploy` für PROJ-29.
- Wieder aufgreifen, sobald eine Quelle mit Fahrzeug-Detailseiten zur Verfügung steht. Der Aufwand liegt dann allein in der Anbindung — Klassifikation, Entdopplung, Währungsprüfung und Belastbarkeitsstaffelung stehen bereits.

### Was am Datenbestand bereits geändert wurde

Die Migration `20260802_market_analyses_belastbarkeit.sql` ist **auf der Produktionsdatenbank angewandt**. Die fünf neuen Spalten sind nullable bzw. haben Vorgabewerte und werden vom ausgelieferten Code nicht verwendet — der Bestand ist unverändert nutzbar. Ein Rückbau ist nicht nötig und wäre der größere Eingriff.

### Offen und ausdrücklich nicht entschieden

PROJ-11 (Marktpreis-Analyse) ist **weiterhin live** und erzeugt bis auf Weiteres genau die Ergebnisse, deren Fehler in dieser QA-Runde belegt wurden: Suchergebnisseiten als Vergleichsfahrzeuge, Mehrfachzählung derselben Anzeige, Fremdwährung als Euro. Ob daran in der Produktion etwas geändert werden soll, ist noch zu klären.

## Deployment
_To be added by /deploy_
