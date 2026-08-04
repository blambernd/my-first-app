# PROJ-33: Verkaufspreis-Erhebung beim Transfer

## Status: In Progress
**Created:** 2026-08-04
**Last Updated:** 2026-08-04

## Dependencies
- Requires: PROJ-7 (Fahrzeug-Transfer) — die Übergabe ist der Anlass der Frage
- Requires: PROJ-32 (Kostendaten beim Transfer) — greift in denselben Annahme-Vorgang ein
- Requires: PROJ-2 (Fahrzeugprofil) — liefert Marke, Modell, Baujahr, Zustandsnote
- Requires: PROJ-28 (Kaufpreis & Wertentwicklung) — der Käufer trägt den Kaufpreis ohnehin dort ein
- Ermöglicht: PROJ-34 (Preisübersicht) — wertet aus, was hier gesammelt wird

## Zusammenfassung

PROJ-29 (Belastbarer Marktüberblick) ist zurückgestellt, weil die Datenquelle nicht trägt: Google indexiert keine Fahrzeug-Detailseiten von mobile.de oder AutoScout24, ein BMW Z3 lieferte **null** Vergleichsfahrzeuge. Gescrapte Inseratspreise sind zudem Forderungen, keine Verkaufspreise.

Bei jedem Fahrzeug-Transfer entsteht dagegen etwas, das kein Portal hat: ein **tatsächlich gezahlter Preis**. Dieses Feature fragt den Käufer beim Annehmen danach und legt die Angabe — losgelöst von Person und Fahrzeug — als Datenpunkt ab.

**Das Feature sammelt nur.** Die Auswertung ist PROJ-34 und kann erst sinnvoll erscheinen, wenn genug Datenpunkte vorliegen.

### Die eigentliche Schwierigkeit ist die Anonymität

Ein Datensatz ohne Namen ist noch nicht anonym. Bei einem 1970er Mercedes SL mit 52.000 km ist die Kombination aus Marke, Modell, Baujahr und Kilometerstand oft **genau ein Fahrzeug** — und über ein öffentliches Kurzprofil oder ein Inserat rückführbar auf eine Person und deren Verkaufspreis. Genau das soll PROJ-32 gerade verhindern.

Der Datensatz muss deshalb so entkoppelt abgelegt werden, dass eine Rückführung auch dann nicht gelingt, wenn jemand Zugriff auf die Tabelle hat und das Fahrzeug kennt.

### Den Schutz trägt die Mindestbesetzung, nicht die Vergröberung (2026-08-04)

Das **Baujahr wird jahresgenau** gespeichert. Bei Oldtimern ist es das wichtigste Vergleichsmerkmal — zwischen einem 1967er und einem 1972er Modell liegen oft Welten in Technik und Preis. Eine Baujahr-Spanne würde die spätere Auswertung entwerten, also genau den Zweck der Erhebung.

Das ist vertretbar, weil die Anonymität nicht an der Körnung der Merkmale hängt, sondern an der **Mindestzahl vergleichbarer Verkäufe** (PROJ-34): Solange weniger als die festgelegte Zahl vorliegt, erscheint überhaupt kein Wert. Ein einzelner Verkauf bleibt damit unsichtbar, gleichgültig wie fein oder grob er abgelegt ist.

Die Vergröberung wirkt anders, als es zunächst scheint: Sie schützt nicht selbst, sie sorgt nur dafür, dass Gruppen die Mindestzahl **häufiger erreichen**. Der Preis dafür ist Genauigkeit. Beim Kilometerstand ist dieser Tausch sinnvoll — 52.000 und 54.000 km sind praktisch gleichwertig. Beim Baujahr ist er es nicht.

**Folge, die offen benannt gehört:** Bei seltenen Modellen wird die Auswertung dadurch länger — womöglich dauerhaft — nichts anzeigen. Das ist die gewollte Richtung: lieber keine Zahl als eine, die auf ein bestimmtes Fahrzeug zurückführt.

## Entscheidungen (2026-08-04)

| Frage | Entscheidung |
|---|---|
| Einwilligung | **Freiwillig, aktive Zustimmung** — kein vorausgewähltes Häkchen |
| Wer gibt den Preis an | **Der Käufer beim Annehmen** |
| Zugang zur späteren Auswertung | Alle angemeldeten Nutzer (betrifft PROJ-34) |
| Zu dünne Datenlage | Nichts anzeigen, Grund nennen (betrifft PROJ-34) |

## User Stories

- Als kaufender Oldtimer-Besitzer möchte ich beim Annehmen der Übergabe meinen Kaufpreis eintragen können, damit meine Wertentwicklung von Anfang an stimmt
- Als kaufender Besitzer möchte ich selbst entscheiden, ob mein Kaufpreis in die gemeinsame Auswertung einfließt, damit ich die Kontrolle über meine Angaben behalte
- Als kaufender Besitzer möchte ich vor der Zustimmung verstehen, was genau gespeichert wird und dass es sich danach nicht mehr zurückholen lässt, damit ich eine informierte Entscheidung treffe
- Als Nutzer der Plattform möchte ich, dass aus echten Verkäufen eine belastbare Preisgrundlage entsteht, statt aus Inseratsforderungen geraten zu werden
- Als verkaufender Besitzer möchte ich sicher sein, dass mein Verkaufspreis nicht auf mich oder mein Fahrzeug zurückführbar ist, auch wenn der Käufer zustimmt
- Als kaufender Besitzer möchte ich die Übergabe auch ohne Preisangabe abschließen können, damit die Frage kein Hindernis ist

## Acceptance Criteria

### Die Frage beim Annehmen
- [ ] Beim Annehmen eines Transfers wird der Käufer nach dem gezahlten Kaufpreis gefragt
- [ ] Die Preisangabe ist **freiwillig**: Der Transfer lässt sich auch ohne sie abschließen
- [ ] Ein eingetragener Kaufpreis wird als Anschaffung des neuen Besitzers gespeichert (PROJ-28), unabhängig von der Einwilligung zur Auswertung
- [ ] Die Einwilligung zur anonymen Auswertung ist eine **zusätzliche, aktive** Zustimmung — kein vorausgewähltes Häkchen
- [ ] Ohne Einwilligung entsteht **kein** Datenpunkt für die Auswertung
- [ ] Wird der Transfer abgelehnt, storniert oder läuft ab, entsteht kein Datenpunkt

### Was der Käufer vor der Zustimmung erfährt
- [ ] Es wird ausdrücklich benannt, welche Angaben in die Auswertung einfließen
- [ ] Es wird benannt, dass die Angaben **nicht** mit ihm oder dem Fahrzeug verknüpft gespeichert werden
- [ ] Es wird benannt, dass sich die Angabe nach dem Absenden **nicht widerrufen** lässt, weil sie danach niemandem mehr zuzuordnen ist
- [ ] Es wird benannt, dass ein einzelner Preis niemals sichtbar wird, sondern nur zusammengefasste Werte

### Was gespeichert wird
- [ ] Gespeichert werden ausschließlich: Marke, Modell, Baujahr, Kilometerstand, Zustandsnote, Kaufpreis und der Verkaufszeitpunkt
- [ ] Der Datensatz enthält **keine** Kennung des Nutzers, des Fahrzeugs, des Transfers oder des Vorbesitzers
- [ ] Der Verkaufszeitpunkt wird nur monatsgenau abgelegt, nicht tagesgenau
- [ ] Das **Baujahr wird jahresgenau** abgelegt — es ist bei Oldtimern das wichtigste Vergleichsmerkmal, eine Spanne würde die Auswertung entwerten
- [ ] Der Kilometerstand wird in Klassen abgelegt, nicht als Einzelwert
- [ ] Aus einem Datensatz lässt sich der zugehörige Transfer nicht bestimmen, auch nicht über den Zeitpunkt

### Plausibilität
- [ ] Ein Preis außerhalb eines plausiblen Bereichs wird abgewiesen, mit verständlicher Begründung
- [ ] Eine Übergabe ohne Kaufpreis — Schenkung, Erbschaft, Übertrag im Familienkreis — führt zu keinem Datenpunkt
- [ ] Fehlt am Fahrzeug die Zustandsnote oder der Kilometerstand, wird der Datenpunkt nicht angelegt, statt Lücken zu erfinden

### Sicherheit
- [ ] Kein Nutzer kann einzelne Datensätze abfragen — weder über die Oberfläche noch direkt
- [ ] Das Anlegen des Datensatzes geschieht gemeinsam mit dem Besitzerwechsel: entweder beides oder keines von beidem
- [ ] Ein Datensatz lässt sich nachträglich weder ändern noch löschen, auch nicht durch den, der ihn ausgelöst hat

## Edge Cases

- **Käufer stimmt nicht zu:** Sein Kaufpreis wird trotzdem für seine eigene Wertentwicklung gespeichert. Nur der anonyme Datenpunkt entfällt. Beides zu vermengen wäre falsch — die Einwilligung betrifft die Weitergabe, nicht die eigene Erfassung
- **Schenkung oder Erbschaft:** Ein Preis von 0 € oder eine leere Angabe ist kein Marktpreis und darf die Auswertung nicht verzerren
- **Absurder Preis:** 1 € oder 10 Mio. € — sei es Tippfehler oder Absicht. Ein einzelner falscher Wert wiegt bei kleiner Datenmenge schwer
- **Dasselbe Fahrzeug wird mehrfach übertragen:** Jeder Verkauf ist ein eigener, gültiger Datenpunkt. Dass es dasselbe Fahrzeug ist, darf aus den Daten aber nicht hervorgehen — sonst entsteht eine Preishistorie, die auf ein bestimmtes Fahrzeug zurückführt
- **Sehr seltenes Modell:** Der Datenpunkt entsteht, wird aber in der Auswertung erst sichtbar, wenn genug Vergleichsfälle vorliegen (PROJ-34). Die Erhebung darf nicht davon abhängen, ob es je genug werden
- **Fahrzeug ohne Zustandsnote:** Häufiger Fall, weil die Angabe optional ist. Ein Datenpunkt ohne Zustandsnote wäre nur begrenzt vergleichbar
- **Transfer an einen Nutzer, der das Fahrzeug schon als Mitglied kennt:** Ändert nichts — gefragt wird beim Annehmen, unabhängig von der Vorgeschichte
- **Käufer bricht mitten in der Eingabe ab:** Der Transfer darf dadurch nicht in einem unklaren Zustand hängen bleiben
- **Mehrere offene Transfers zum selben Fahrzeug:** Nur der angenommene erzeugt einen Datenpunkt
- **Widerruf im Nachhinein:** Der Nutzer bittet später darum, seine Angabe zu entfernen. Ist die Anonymisierung gelungen, ist das nicht möglich — deshalb muss es **vor** der Zustimmung klar gesagt werden

## Technische Anforderungen

- Der Datensatz darf keinen Fremdschlüssel auf Nutzer, Fahrzeug oder Transfer tragen
- Der Zeitpunkt des Anlegens darf nicht als Umweg zur Zuordnung taugen (kein tagesgenauer Zeitstempel, der sich mit dem Transfer abgleichen lässt)
- Das Anlegen gehört in dieselbe Transaktion wie der Besitzerwechsel
- Kein Leseweg auf die Einzeldatensätze für normale Nutzer
- Die Preisangabe wird serverseitig auf Plausibilität geprüft, nicht nur im Browser

## Offene Entscheidungen

- **Zuschnitt der Kilometer-Klassen** — das Baujahr ist entschieden (jahresgenau), der Kilometerstand nicht. Zu fein lässt Gruppen die Mindestzahl seltener erreichen, zu grob macht den Vergleich beliebig. Entscheidung für `/architecture`
- **Plausibler Preisbereich** — feste Grenzen oder abhängig vom Fahrzeug
- **Umgang mit fehlender Zustandsnote** — Datenpunkt verwerfen oder mit gekennzeichneter Lücke aufnehmen
- **Ob der Vorbesitzer informiert wird**, dass ein Datenpunkt aus seinem Verkauf entstanden ist

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Erstellt:** 2026-08-04

### Entscheidungen des Nutzers (2026-08-04)

| Frage | Entscheidung |
|---|---|
| Wo sitzt die Preisfrage | **Vor dem Annehmen**, im selben Vorgang |
| Fehlende Zustandsnote | **Beim Annehmen miterfragen** |
| Kilometer-Klassen | **25.000-km-Schritte** |

### A) Aufbau der Oberfläche

```
Übergabe-Seite  (/transfer/<token>)      ← die Seite gibt es schon
│
├── Fahrzeugangaben und Absender          unverändert
│
├── [Neuer Abschnitt: „Dein Kaufpreis"]   ← neu, vor den Schaltflächen
│   ├── Kaufpreis            (freiwillig)
│   ├── Zustandsnote         (nur wenn am Fahrzeug keine hinterlegt ist)
│   ├── Kilometerstand       (vorbelegt aus dem letzten Eintrag)
│   │
│   └── [Einwilligung]       ← eigenes, NICHT vorausgewähltes Häkchen
│       „Mein Kaufpreis darf anonym in die Preisübersicht einfließen"
│       + aufklappbar: was gespeichert wird, was nicht,
│         und dass es sich danach nicht widerrufen lässt
│
├── Schaltfläche „Übernehmen"             unverändert beschriftet
└── Schaltfläche „Ablehnen"               unverändert
```

**Die Übergabe bleibt möglich, ohne irgendetwas auszufüllen.** Kein Feld ist Pflicht, kein Häkchen vorbelegt. Wer nur übernehmen will, klickt wie bisher.

**Was das Ausfüllen bewirkt — zwei getrennte Dinge:**

| Eingabe | Wirkung |
|---|---|
| Kaufpreis allein | wird als **eigene Anschaffung** gespeichert (PROJ-28), damit die Wertentwicklung von Anfang an stimmt |
| Kaufpreis **und** Häkchen | zusätzlich entsteht ein anonymer Datenpunkt |

Diese Trennung ist der Kern: Die Einwilligung betrifft die **Weitergabe**, nicht die eigene Erfassung. Sie zu vermengen hieße, dem Nutzer entweder seine Wertentwicklung vorzuenthalten oder ihn zur Datenspende zu drängen.

### B) Welche Angaben gespeichert werden

**Eine neue Tabelle, bewusst ohne jede Verbindung.** Sie trägt keinen Verweis auf Nutzer, Fahrzeug, Transfer oder Vorbesitzer — nicht als versteckte Kennung, nicht als Fremdschlüssel.

```
Ein Datenpunkt besteht aus:
- Marke und Modell                (wie am Fahrzeug hinterlegt)
- Baujahr                         jahresgenau
- Kilometer-Klasse                25.000er-Schritte, nicht der Einzelwert
- Zustandsnote                    1–5
- Kaufpreis                       in Cent
- Verkaufsmonat                   nur Monat und Jahr, kein Tag
```

Daneben, unverändert im bestehenden Bereich: der Kaufpreis als **Anschaffung des neuen Besitzers** — mit allen Verbindungen, denn das sind seine eigenen Daten.

### C) Technische Entscheidungen

**C1 — Alles in derselben Übergabe-Funktion, wie schon bei PROJ-32.**

Der Datenpunkt entsteht dort, wo auch der Besitzer wechselt und die Beträge des Vorbesitzers verschwinden. Eine Funktion ist eine Transaktion: Es kann nicht passieren, dass ein Verkauf erfasst wird, dessen Übergabe scheiterte — oder umgekehrt. Dass PROJ-32 diese Funktion gerade erweitert hat, macht den Weg vorgezeichnet.

Daraus folgt der Ablauf: Preis, Zustandsnote und Einwilligung müssen **vor** dem Klick bekannt sein und mit ihm übergeben werden. Deshalb sitzt das Formular davor und nicht danach.

**C2 — Der Zeitpunkt ist die unauffälligste Spur.**

Ein tagesgenauer Zeitstempel neben einem tagesgenauen Transfer ist eine Zuordnung, auch ohne gemeinsame Kennung. Deshalb wird nur **Monat und Jahr** gespeichert, und die Tabelle bekommt **kein Anlagedatum**. Das ist kein Detail — es ist der Unterschied zwischen anonym und pseudonym.

**C3 — Was die Anonymität wirklich trägt, ist die Mindestzahl.**

Baujahr wird jahresgenau gespeichert, weil es bei Oldtimern das entscheidende Vergleichsmerkmal ist. Das ist vertretbar, weil kein einzelner Datenpunkt je sichtbar wird: Die Auswertung (PROJ-34) zeigt erst ab einer Mindestzahl vergleichbarer Verkäufe überhaupt etwas.

Die Vergröberung des Kilometerstands schützt nicht selbst — sie sorgt dafür, dass Gruppen diese Mindestzahl **häufiger erreichen**. Beim Kilometerstand ist der Tausch sinnvoll (52.000 und 54.000 km sind gleichwertig), beim Baujahr nicht.

**C4 — Niemand darf Einzelsätze lesen, auch nicht der eigene.**

Die Tabelle ist für normale Nutzer vollständig gesperrt — kein Lesen, kein Schreiben, kein Ändern, kein Löschen. Geschrieben wird ausschließlich durch die Übergabe-Funktion, die mit erhöhten Rechten läuft. Gelesen wird später (PROJ-34) nur über eine Funktion, die zusammenfasst und die Mindestzahl selbst durchsetzt.

Ein Datenpunkt lässt sich auch nicht nachträglich ändern oder löschen — auch nicht von dem, der ihn ausgelöst hat. Das ist keine Härte, sondern die Kehrseite gelungener Anonymisierung: Was niemandem mehr zuzuordnen ist, lässt sich auch nicht mehr auf Zuruf herausfinden.

**C5 — Deshalb muss der Widerruf vorher zur Sprache kommen.**

Eine Einwilligung ist widerruflich; ein anonymer Datensatz ist nicht auffindbar. Beides zugleich geht nicht. Der einzige ehrliche Umgang damit ist, es **vor** der Zustimmung zu sagen — nicht auf Nachfrage danach. Der aufklappbare Text nennt es ausdrücklich.

**C6 — Plausibilitätsprüfung auf dem Server, nicht nur im Formular.**

Ein Tippfehler wiegt bei kleiner Datenmenge schwer: Ein einzelner Verkauf zu 1 € oder 10 Mio. € verzieht eine junge Auswertung sichtbar. Geprüft wird deshalb auf dem Server, mit einer verständlichen Rückmeldung statt einer stillen Ablehnung.

Ein Preis von 0 € oder eine leere Angabe erzeugt **keinen** Datenpunkt: Schenkung, Erbschaft und Übergabe im Familienkreis sind keine Marktpreise und dürfen die Auswertung nicht verzerren. Der Kaufpreis 0 € wird trotzdem als eigene Anschaffung gespeichert, wenn der Nutzer ihn einträgt — für seine Wertentwicklung ist er richtig.

**C7 — Der Vorbesitzer wird nicht informiert.**

Ihm mitzuteilen, dass aus seinem Verkauf ein Datenpunkt entstand, würde genau die Verbindung herstellen, die dieses Feature vermeidet: Wer die Nachricht bekommt, weiß, dass es zu diesem Zeitpunkt einen Eintrag gibt. Der Verkaufspreis ist ohnehin eine Angabe des Käufers über sich selbst.

### D) Abhängigkeiten

**Keine neuen Pakete.** Die Erhebung nutzt das vorhandene Formular-Handwerkszeug und die bestehende Übergabe-Funktion.

### E) Was dieses Feature bewusst NICHT tut

- **Keine Auswertung.** Die Preisübersicht ist PROJ-34 und kann erst sinnvoll erscheinen, wenn genug Datenpunkte vorliegen
- **Keine Rückwirkung.** Aus früheren Transfers entstehen keine Datenpunkte; niemand hat dafür eingewilligt
- **Keine Änderung am Übergabe-Ablauf selbst.** Fristen, Einladung, Rollen und das Entfernen der Kostendaten (PROJ-32) bleiben, wie sie sind
- **Keine Pflicht.** Weder zur Preisangabe noch zur Einwilligung

### F) Offene Punkte für die Umsetzung

**F1 — Der plausible Preisbereich.** Vorschlag: 500 € bis 2.000.000 €. Weit genug für einen Scheunenfund wie für einen Sammlerwagen, eng genug, um Tippfehler um Zehnerpotenzen zu fangen. Beim Bauen zu bestätigen.

**F2 — Die oberste Kilometer-Klasse braucht ein offenes Ende.** „Über 250.000 km" statt weiterer Schritte — darüber wird die Laufleistung als Merkmal ohnehin stumpf, und die Klassen blieben leer.

**F3 — Eine Restgefahr, die offen benannt gehört.** Der Schutz richtet sich gegen **Nutzer**, nicht gegen den Betreiber der Datenbank. Wer direkten Zugriff auf beide Tabellen hat, könnte die Reihenfolge der Einträge mit den Transferzeitpunkten abgleichen. Das lässt sich nicht restlos ausschließen, ohne die Daten regelmäßig umzuschichten — ein Aufwand, der hier nicht im Verhältnis stünde. Wichtig ist, es zu wissen, statt Anonymität zu behaupten, die so weit nicht reicht.

**F4 — Marke und Modell sind Freitext.** „Mercedes-Benz", „Mercedes" und „MB" wären drei Gruppen. Für die Erhebung ist das noch kein Problem, für die Auswertung (PROJ-34) wird es eines. Ob schon hier vereinheitlicht wird oder erst dort, ist beim Bauen zu entscheiden.

## Frontend-Umsetzung (2026-08-04)

**Umgesetzt ist die Erfassung: das Formular vor dem Annehmen samt Einwilligung und Plausibilitätsprüfung.** Das Speichern — die anonyme Tabelle und das Anlegen in der Übergabe-Funktion — steht noch aus, siehe „Offen für /backend".

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/lib/validations/sale-report.ts` | Kilometer-Klassen, Verkaufsmonat, Plausibilitätsprüfung |
| `src/lib/validations/sale-report.test.ts` | 17 Tests |
| `src/components/transfer-purchase-form.tsx` | Der Abschnitt vor den Schaltflächen |

### Die Trennung, auf die es ankommt

Das Häkchen ist ein **eigenes** Bedienelement, deutlich abgesetzt und nie vorbelegt. Der Kaufpreis steht darüber und funktioniert ohne es. In der Oberfläche ist damit sichtbar, was der Entwurf verlangt: Die Einwilligung betrifft die Weitergabe, nicht die eigene Erfassung.

Der Plausibilitätshinweis erscheint **nur, wenn das Häkchen gesetzt ist**. Wer die Weitergabe nicht will, soll keine Belehrung über Preisgrenzen lesen, die ihn nichts angehen.

Beim Text zu niedrigen Preisen steht ausdrücklich „Dein Kaufpreis wird trotzdem gespeichert" — sonst befürchtet der Nutzer, seine Eingabe sei ganz verworfen worden.

### Kilometer-Klassen

`kmKlasse()` gibt immer die **Untergrenze** zurück, nie den Einzelwert — der wäre ein Wiedererkennungsmerkmal. Ein Test prüft genau das für mehrere Werte. Oberhalb von 250.000 km gibt es nur noch eine offene Klasse (F2).

`verkaufsmonat()` liefert `2026-08`, nie einen Tag.

### Nachgewiesen

| Prüfung | Ergebnis |
|---|---|
| Häkchen vorbelegt | **nein** |
| Übernehmen ohne jede Eingabe möglich | ja |
| Ohne Einwilligung kein Plausibilitätshinweis | ja |
| Mit Einwilligung, leer → „Ohne Kaufpreis …" | ja |
| Preis 1 € → „unter 500 € fließen nicht ein … trotzdem gespeichert" | ja |
| Preis und km gesetzt → „Ohne Zustandsnote …" | ja |
| Aufklapptext nennt Speicherung, Nicht-Speicherung, Mindestzahl, fehlenden Widerruf | ja |
| 375 / 768 / 1440 px | kein Querscrollen |
| Konsole | keine Fehler |
| Unit-Tests | **643 / 643 grün** (17 neu) |
| Lint / Build | 0 Fehler / erfolgreich |

### Offen für /backend

1. **Die anonyme Tabelle** — ohne Verweis auf Nutzer, Fahrzeug, Transfer oder Vorbesitzer, ohne Anlagedatum, für normale Nutzer vollständig gesperrt (C2, C4)
2. **Das Anlegen in `accept_vehicle_transfer`**, gemeinsam mit dem Besitzerwechsel (C1). Die Annahme-Route nimmt die Angaben bereits entgegen und reicht sie weiter; verarbeitet werden sie noch nicht
3. **Der Kaufpreis als eigene Anschaffung** (PROJ-28), unabhängig von der Einwilligung
4. **Plausibilitätsprüfung serverseitig** — die Prüfung im Formular ist Bequemlichkeit, nicht Schutz (C6)
5. **Zwei Felder in der Transfer-Auskunft:** Zustandsnote und letzter Kilometerstand. Bis dahin wird die Zustandsnote immer gefragt und der Kilometerstand nicht vorbelegt — richtig, nur unbequemer

**Bis dahin gilt:** Der Käufer kann die Angaben machen, sie werden aber noch nicht gespeichert. Die Übergabe selbst funktioniert unverändert.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
