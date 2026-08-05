# PROJ-33: Verkaufspreis-Erhebung beim Transfer

## Status: Deployed
**Created:** 2026-08-04
**Last Updated:** 2026-08-05

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

## Backend-Umsetzung (2026-08-04)

Damit ist das Feature vollständig: Der Käufer wird gefragt, seine Angaben werden gespeichert, und der anonyme Datenpunkt entsteht gemeinsam mit dem Besitzerwechsel.

### Migrationen

| Datei | Inhalt |
|---|---|
| `20260804_proj33_vehicle_sales.sql` | die anonyme Tabelle |
| `20260804_proj33_accept_with_sale.sql` | vier neue Parameter an `accept_vehicle_transfer` |
| `20260804_proj33_transfer_info_fields.sql` | Zustandsnote und Kilometerstand in der Auskunft |

### Die Tabelle

Keine Spalte verweist auf Nutzer, Fahrzeug, Transfer oder Vorbesitzer — und es gibt **kein Anlagedatum**. Gespeichert wird `sold_month` im Format `2026-08`. Prüfregeln in der Datenbank erzwingen, was der Entwurf verlangt: Die Kilometer-Klasse muss durch 25.000 teilbar sein, der Preis zwischen 500 € und 2 Mio. € liegen, der Monat dem Muster entsprechen.

**Zugriff:** keine einzige Policy, dazu `REVOKE ALL` für `anon` und `authenticated`. Geschrieben wird ausschließlich durch die Übergabe-Funktion, die als `SECURITY DEFINER` läuft.

### Die Trennung in der Funktion

Zwei Bedingungen, bewusst getrennt:

- **Kaufpreis** → wird gespeichert, sobald er angegeben ist, unabhängig von der Einwilligung. Er steht **nach** dem Löschen der Vorbesitzer-Beträge (PROJ-32) — davor stehend würde er mitgelöscht
- **Anonymer Datenpunkt** → nur mit Einwilligung **und** vollständigen, plausiblen Angaben

Zustandsnote und Kilometerstand: Die Angabe des Käufers hat Vorrang, sonst gilt, was am Fahrzeug steht.

### Nebenbefund

`get_transfer_by_token` meldete den Status `abgelaufen` (seit PROJ-32 möglich) nicht als „expired", sondern ließ ihn durch alle Zweige fallen. Mit derselben Migration berichtigt.

### Nachgewiesen

Echte Aufrufe von `accept_vehicle_transfer`, jeweils in zurückgerollten Transaktionen:

| Fall | Datenpunkt | Eigene Anschaffung |
|---|---|---|
| 18.500 €, Note 2, 52.000 km, **mit** Einwilligung | **1** | **1** |
| 18.500 €, **ohne** Einwilligung | 0 | **1** |
| 1 €, mit Einwilligung (Schenkung) | 0 | **1** |

Der erzeugte Datenpunkt, vollständig ausgelesen:

```
E2E-Testfahrzeug Wegwerf / 1970 / 50000 km-Klasse / Note 2 / 1850000 Cent / 2026-08
```

52.000 km sind zur Klasse 50.000 geworden, der Zeitpunkt ist auf den Monat verkürzt, und keine Spalte verweist zurück.

**Zugriffstest mit Positivkontrolle:** mit erhöhten Rechten 1 Zeile sichtbar; als angemeldeter Nutzer und als anonymer Besucher jeweils `permission denied for table vehicle_sales`. Die Sperre greift schon vor den Zeilenregeln, auf Tabellenebene.

**643 Unit-Tests grün**, **Gesamtregression 117 grün und 2 übersprungen** ohne Fehlschläge, Lint 0 Fehler, Build erfolgreich.

## QA Test Results

**Geprüft am:** 2026-08-04 · **Ergebnis: produktionsreif** (BUG-1 behoben, zwei geringe Fehler offen)

### Akzeptanzkriterien

| Bereich | Ergebnis |
|---|---|
| Die Frage beim Annehmen (6) | **6 / 6** |
| Was der Käufer vorher erfährt (4) | **4 / 4** |
| Was gespeichert wird (6) | **6 / 6** |
| Plausibilität (3) | **3 / 3** |
| Sicherheit (3) | **3 / 3** (nach der Nachbesserung) |

**22 von 22 Kriterien erfüllt** — 21 im ersten Durchgang, das letzte nach der Nachbesserung zu BUG-1.

### Was sich nicht prüfen ließ — und warum das benannt gehört

Ein **erfolgreiches** Annehmen über die Oberfläche ist ungeprüft. Es gibt nur ein Testkonto; ein echter Durchlauf hätte entweder ein zweites Konto in der Produktion angelegt oder das Testfahrzeug kurzzeitig einem echten Nutzer zugeschrieben, samt bleibendem Meilenstein in dessen Fahrzeughistorie. Beides stand nicht im Verhältnis.

Stattdessen wurde die Kette in ihren Gliedern belegt:

| Glied | Nachweis |
|---|---|
| Formular → Browser | Abgefangener Rumpf: `{"share_anonymously":true,"purchase_price_eur":18500,"mileage_km":52000,"condition_grade":2}` |
| Route → Datenbankfunktion | Die Funktion antwortete inhaltlich („E-Mail stimmt nicht überein"). Hieße ein Parameter anders, käme stattdessen ein Aufruffehler |
| Funktion → Tabelle | In zurückgerollten Transaktionen belegt, siehe Backend-Abschnitt |

Offen bleibt allein der Erfolgsfall über HTTP. **Vor oder unmittelbar nach der Auslieferung sollte ein echter Transfer zwischen zwei Konten einmal von Hand durchlaufen werden.**

### Gefundene Fehler

| # | Schwere | Befund |
|---|---|---|
| BUG-1 | **Mittel** | **Nichts hindert daran, die Preisdaten zu fluten.** Wer zwei eigene Konten anlegt, kann beliebig viele Fahrzeuge erzeugen, sie hin- und herübertragen und bei jeder Annahme einen frei gewählten Preis zwischen 500 € und 2 Mio. € einwilligen. Jede Annahme erzeugt genau einen Datenpunkt; es gibt keine Begrenzung je Nutzer, je Zeitraum oder je Fahrzeug, und keine Prüfung, ob die beiden Konten zusammenhängen. Bei einem Feature, dessen ganzer Wert an der Belastbarkeit der Zahlen hängt, ist das die naheliegendste Angriffsfläche — und sie trifft PROJ-34 unmittelbar, gerade solange die Datenmenge klein ist. Nicht ausgeführt: Der Nachweis hätte Konten angelegt und die Produktionsdaten verfälscht. |
| BUG-2 | Gering | **Fehlermeldungen der Eingabeprüfung sind teils englisch.** `Too big: expected number to be <=5`, `Invalid input: expected boolean, received string`. Vorgabetexte der Prüfbibliothek, die in einem rein deutschen Produkt durchschlagen. Über die Oberfläche nicht erreichbar — das Auswahlfeld lässt nur 1–5 zu —, wohl aber bei einer abgewandelten Anfrage. |
| BUG-3 | Gering | **Ein leerer Rumpf `{}` lässt die Übergabe scheitern** (`400, expected boolean, received undefined`). Die Route ist ausdrücklich so gebaut, dass fehlende Angaben die Übergabe nicht verhindern — bei gar keinem Rumpf greift das auch. Ein leeres Objekt fällt durch, weil die Einwilligung als Pflichtfeld geführt wird. Heute sendet kein Client `{}`; unschön ist, dass ein kritischer Pfad — die Übernahme des eigenen Fahrzeugs — an einem Feld hängt, das nur die Auswertung betrifft. |

### Ein Verdacht, der sich nicht bestätigt hat

Beim ersten Durchlauf schien die Oberfläche nur ein generisches „Fehler" zu zeigen, statt den Grund zu nennen. Genauer angesehen: „Fehler" ist die Überschrift, die Meldung steht vollständig darunter (*„Deine E-Mail-Adresse stimmt nicht mit der Einladung überein"*). Mein Suchmuster hatte die Überschrift zuerst getroffen. Kein Befund.

### Sicherheitsprüfung

| Angriff | Ergebnis |
|---|---|
| Annehmen ohne Anmeldung | **401** |
| Zustandsnote 9 bzw. 0 | **400** |
| Negativer Preis, negativer Kilometerstand | **400** |
| SQL-Einschleusung im Preisfeld | **400**, als Zahl abgewiesen |
| Einwilligung als Text statt Wahrheitswert | **400** |
| `vehicle_sales` direkt lesen (angemeldet) | **permission denied** — schon auf Tabellenebene |
| `vehicle_sales` direkt lesen (anonym) | **permission denied** |
| Datenpunkt nachträglich ändern oder löschen | nicht möglich, keine Rechte |
| Preisdaten fluten | **möglich** → BUG-1 |

### Beobachtung: Wiederholte Übertragungen desselben Fahrzeugs

Der Spec verlangt, dass aus den Daten nicht hervorgehen darf, dass es sich um dasselbe Fahrzeug handelt. Eine Kennung gibt es nicht — beweisen lässt es sich also nicht. Mehrere Zeilen mit identischer Marke, Modell, Baujahr, Kilometer-Klasse und Note in aufeinanderfolgenden Monaten sind aber ein Hinweis. Das liegt in der Natur des Entwurfs und war so entschieden; es sollte niemanden später überraschen.

### Automatisierte Tests

- **Neu:** `tests/PROJ-33-verkaufspreis-auth.spec.ts` — **12 / 12 grün**

> **Die erste Fassung dieses Specs taugte nichts.** Sie hing an einem Token, den ich beim Prüfen von Hand in die Datenbank gelegt hatte. Sechs der zehn Tests schlugen fehl, sobald er wieder weg war — als Regressionstests waren sie wertlos. Aufgefallen ist es nur, weil ich das Spec nach dem Aufräumen noch einmal einzeln laufen ließ.
>
> Die jetzige Fassung **legt ihren Transfer selbst über die Maske an** und bricht ihn am Ende wieder ab. Damit prüft der Lauf nebenbei, dass das Anlegen und das Abbrechen überhaupt noch funktionieren. Zweimal hintereinander ausgeführt: beide Male 12/12, danach kein offener Transfer, Besitzer unverändert.
- Unit-Tests: **643 grün**, davon 17 für Kilometer-Klassen, Verkaufsmonat und Plausibilität
- Gesamtregression `chromium-auth`: **117 grün, 2 übersprungen**, keine Fehlschläge

### Nachbesserung (2026-08-04) — BUG-1 behoben

**Der erste Vorschlag war falsch.** Eine Grenze je Konto und Zeitraum hätte Händler getroffen, die täglich mehrere Fahrzeuge übertragen — genau die Nutzer, die man nicht treffen will. Der Einwand kam vom Nutzer und war berechtigt.

Der zweite Anlauf zielte auf das Kontopaar. Auch daran zeigte sich eine Lücke: **Händler A verkauft zwanzig Fahrzeuge an Händler B** — dasselbe Paar, viele Übertragungen, strukturell nicht von einem Ring zu unterscheiden. Aus dem Übertragungsmuster allein ist das nicht trennbar.

Zwei Überlegungen lösen es auf:

1. **Händler-zu-Händler-Preise gehören ohnehin nicht hinein.** Was zwischen zwei Händlern gezahlt wird, ist ein Einkaufspreis und liegt systematisch unter dem, was ein privater Käufer zahlt. Sie auszuschließen ist sachlich richtig, nicht bloß ein hinnehmbarer Fehlalarm.
2. **Der Schnitt muss weich sein.** Die Grenze lässt den Datenpunkt entfallen, nie die Übergabe. Ein Fehlalarm kostet damit einen Datenpunkt, kein blockiertes Fahrzeug.

**Umgesetzt sind zwei Regeln:**

| Regel | Händler | Ring |
|---|---|---|
| Ein Fahrzeug trägt höchstens **einmal** bei (`vehicles.sale_reported`) | unberührt — jedes Fahrzeug wird einmal verkauft | Hin- und Herübertragen bringt nichts mehr |
| Höchstens **drei** Datenpunkte je Kontopaar, **ungerichtet** gezählt | Einkaufspreise fallen ab dem vierten heraus — erwünscht | erzwingt für jeden weiteren Datenpunkt ein neues Konto mit bestätigter E-Mail |

Dazu in PROJ-34 aufgenommen: **Median statt Mittelwert und gestutzte Spannen.** Keine Strukturregel ist dicht; die Statistik ist die zweite, unabhängige Schranke.

#### Zwei Fehler, die dabei auffielen

**Die Zählung war richtungsabhängig.** A→B und B→A hätten sich zwei getrennte Budgets geteilt, ein Ring hätte durch Abwechseln der Richtung die doppelte Menge gehabt. Zugesagt war „je Kontopaar" — jetzt ungerichtet.

**Die alte `accept_vehicle_transfer(uuid)` existierte noch neben der neuen fünfargumentigen.** `CREATE OR REPLACE` ersetzt nur bei gleicher Signatur, sonst entsteht eine **Überladung**. Ein Aufruf mit nur `p_token` hätte die exakt passende alte Fassung getroffen und die Angaben des Käufers still verworfen — ohne Fehlermeldung. Entfernt; die neue deckt den Aufruf über Vorgabewerte mit ab.

#### Nachgewiesen

| Prüfung | Ergebnis |
|---|---|
| Hin- und Rückübertragung desselben Fahrzeugs | **1** Datenpunkt statt 2, Fahrzeug gesperrt |
| Vier Verkäufe zwischen demselben Kontopaar | **3** Datenpunkte |
| … und laufen die vier Übergaben trotzdem durch? | **alle vier erfolgreich** — die Regel ist weich |
| Fassungen der Funktion in der Datenbank | **1** (vorher 2) |

### Empfehlung

**Auslieferbar.** Kein kritischer, hoher oder mittlerer Fehler mehr.

Offen bleiben **BUG-2** und **BUG-3**, beide gering: englische Vorgabetexte der Eingabeprüfung und ein leerer Rumpf `{}`, der die Übergabe scheitern lässt. Über die Oberfläche ist keiner von beiden erreichbar.

Weiterhin gilt die Auflage aus dem Abschnitt oben: **Ein erfolgreiches Annehmen über die Oberfläche ist ungeprüft** und sollte einmal von Hand zwischen zwei Konten durchlaufen werden.

## Deployment

**Ausgeliefert am:** 2026-08-05 · **Produktion:** https://www.oldtimer-docs.com · **Tag:** `v1.33.0-PROJ-33`

### Datenbank

Alle Änderungen vor dem Deploy einzeln nachgeprüft:

| Prüfung | Zustand |
|---|---|
| Tabelle `vehicle_sales` | vorhanden |
| `vehicles.sale_reported` | vorhanden |
| Fassungen von `accept_vehicle_transfer` | **1** (die Überladung ist entfernt) |
| Paar-Grenze in der Funktion | aktiv |
| Zustandsnote und Kilometerstand in der Auskunft | vorhanden |
| Policies auf `vehicle_sales` | **0** — dazu `REVOKE ALL` |

### Nach der Auslieferung geprüft

Über die echte Maske, mit einem angelegten und danach wieder abgebrochenen Transfer:

| Prüfung | Ergebnis |
|---|---|
| Transfer über die Maske anlegen | erfolgreich |
| Häkchen vorbelegt | **nein** |
| Kaufpreis-Feld leer, Annehmen trotzdem möglich | ja |
| Aufklapptext nennt den fehlenden Widerruf | ja |
| Zustandsnote 9 an der Route | **400** |
| Transfer abbrechen | **200** |
| Browser-Konsole | keine Fehler |

Danach: kein offener Transfer, keine Datenpunkte, Besitzer unverändert.

### Was bewusst offen bleibt

**Ein erfolgreiches Annehmen über die Oberfläche ist weiterhin ungeprüft.** Dafür braucht es zwei Konten; danach gehört das Fahrzeug einem anderen. Die Wirkung der Datenbankfunktion ist in zurückgerollten Transaktionen belegt, die Kette bis dorthin über den abgefangenen Rumpf und die inhaltliche Antwort der Funktion. **Ein Durchlauf zwischen zwei echten Konten sollte einmal von Hand erfolgen.**

**BUG-2** (gering): teils englische Vorgabetexte der Eingabeprüfung. **BUG-3** (gering): ein leerer Rumpf `{}` lässt die Übergabe scheitern. Über die Oberfläche ist keiner von beiden erreichbar.

**Für PROJ-34 vorgemerkt:** Median statt Mittelwert und gestutzte Spannen. Die Strukturregeln gegen das Fluten verteuern den Angriff erheblich, aber keine Strukturregel ist dicht.
