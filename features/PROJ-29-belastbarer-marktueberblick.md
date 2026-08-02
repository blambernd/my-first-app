# PROJ-29: Belastbarer Marktüberblick

## Status: In Progress
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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
