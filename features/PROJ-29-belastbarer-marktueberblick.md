# PROJ-29: Belastbarer Marktüberblick

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
