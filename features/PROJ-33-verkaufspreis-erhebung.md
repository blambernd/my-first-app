# PROJ-33: Verkaufspreis-Erhebung beim Transfer

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
