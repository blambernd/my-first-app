# PROJ-34: Preisübersicht aus echten Verkäufen

## Status: Planned
**Created:** 2026-08-04
**Last Updated:** 2026-08-04

## Dependencies
- Requires: PROJ-33 (Verkaufspreis-Erhebung) — liefert die Datenpunkte; ohne sie zeigt diese Seite nichts
- Requires: PROJ-2 (Fahrzeugprofil) — Marke, Modell, Baujahr, Zustandsnote des eigenen Fahrzeugs
- Betrifft: PROJ-28 (Wertentwicklung) — hier trägt der Nutzer bisher seinen Marktwert von Hand ein
- Betrifft: PROJ-29 (Belastbarer Marktüberblick) — zurückgestellt; dieses Feature verfolgt dasselbe Ziel mit einer eigenen Datenquelle statt gescrapter Inserate

## Zusammenfassung

PROJ-33 sammelt bei jedem Transfer einen anonymen Datenpunkt: was tatsächlich gezahlt wurde. Dieses Feature macht daraus eine Antwort auf die Frage „Was ist mein Fahrzeug wert?".

**Der Unterschied zu PROJ-29 ist die Datenquelle.** Dort wurden Inseratspreise aus Suchergebnissen gelesen — Forderungen, keine Abschlüsse, und die Suche lieferte für gängige Fahrzeuge null Treffer. Hier sind es echte Verkaufspreise aus dem eigenen Bestand. Die Menge ist anfangs klein, die Qualität dafür ungleich besser.

**Ehrlichkeit vor Vollständigkeit.** Lieber keine Zahl als eine geratene: Der Fehler von PROJ-29 war nicht die fehlende Zahl, sondern die falsche.

## Entscheidungen (2026-08-04)

| Frage | Entscheidung |
|---|---|
| Zugang | **Alle angemeldeten Nutzer** — der Wert wächst mit der Beteiligung |
| Zu dünne Datenlage | **Nichts anzeigen, Grund nennen** — kein Wert unterhalb der Mindestzahl |

## User Stories

- Als Oldtimer-Besitzer möchte ich sehen, was für vergleichbare Fahrzeuge tatsächlich gezahlt wurde, damit ich den Wert meines Fahrzeugs einschätzen kann
- Als Oldtimer-Besitzer möchte ich erkennen, worauf eine angezeigte Spanne beruht — wie viele Verkäufe, aus welchem Zeitraum — damit ich weiß, wie belastbar sie ist
- Als Oldtimer-Besitzer möchte ich verstehen, warum zu meinem Fahrzeug nichts angezeigt wird, statt eine leere Seite zu sehen
- Als verkaufender Besitzer möchte ich eine Preisvorstellung entwickeln, die auf Abschlüssen beruht und nicht auf Inseratsforderungen
- Als kaufender Interessent möchte ich einschätzen, ob ein geforderter Preis im üblichen Rahmen liegt
- Als Nutzer, der einen Preis beigetragen hat, möchte ich sehen, dass daraus etwas entstanden ist

## Acceptance Criteria

### Anzeige
- [ ] Zu einem Fahrzeug wird eine Preisspanne vergleichbarer Verkäufe angezeigt
- [ ] Angegeben wird, auf wie vielen Verkäufen die Spanne beruht
- [ ] Angegeben wird, aus welchem Zeitraum die Verkäufe stammen
- [ ] Angegeben wird, welche Merkmale als „vergleichbar" galten
- [ ] Ein **einzelner** Verkaufspreis wird nie angezeigt, unter keinen Umständen
- [ ] Beträge erscheinen in deutscher Formatierung mit Euro-Angabe

### Mindestbesetzung
- [ ] Unterhalb einer festgelegten Mindestzahl von Verkäufen wird **kein Wert** angezeigt
- [ ] Stattdessen erscheint eine Erklärung, dass die Datenlage noch nicht ausreicht
- [ ] Die Erklärung nennt nicht, wie viele Verkäufe bereits vorliegen — die Zahl selbst verrät bei seltenen Modellen zu viel
- [ ] Die Mindestzahl gilt ausnahmslos, auch für den, der selbst beigetragen hat
- [ ] Sie wird auch dann eingehalten, wenn dadurch bei seltenen Modellen dauerhaft nichts erscheint — das Baujahr wird jahresgenau verglichen (PROJ-33), die Mindestzahl ist deshalb die einzige Schranke gegen einen erkennbaren Einzelverkauf

### Robustheit gegen einzelne falsche Werte
- [ ] Die gezeigte Kennzahl beruht auf dem **Median**, nicht auf dem Mittelwert — ein einzelner Ausreißer darf sie kaum bewegen
- [ ] Die gezeigte Spanne ist **gestutzt**: Die extremsten Werte am oberen und unteren Rand bleiben außen vor
- [ ] Auch mehrere gezielt gesetzte Werte verschieben das Ergebnis nicht in einem Maß, das die Aussage umkehrt

> **Warum das hier steht:** Die QA zu PROJ-33 hat gezeigt, dass sich die Erhebung mit Aufwand fluten lässt. Die dort eingebauten Grenzen — ein Datenpunkt je Fahrzeug, höchstens drei je Kontopaar — verteuern das erheblich, sind aber keine dichte Wand. **Keine Strukturregel ist dicht.** Die Statistik ist die zweite, unabhängige Schranke, und sie macht die Auswertung ohnehin belastbarer.

### Einordnung der Aussagekraft
- [ ] Beruht die Spanne auf wenigen Verkäufen, wird sie als eingeschränkt belastbar gekennzeichnet
- [ ] Sind die Verkäufe überwiegend alt, wird darauf hingewiesen
- [ ] Es wird deutlich, dass es sich um gezahlte Preise handelt, nicht um Forderungen aus Inseraten

### Zugang
- [ ] Die Übersicht ist für alle angemeldeten Nutzer erreichbar
- [ ] Ohne Anmeldung ist sie nicht erreichbar
- [ ] Der Zugriff verrät nicht, welche Fahrzeuge in die Auswertung eingeflossen sind

### Darstellung
- [ ] Die Seite ist auf 375 px, 768 px und 1440 px vollständig nutzbar
- [ ] Es gibt einen erklärenden Zustand für „noch keine Daten", der nicht wie ein Fehler wirkt

## Edge Cases

- **Kein einziger Verkauf zum Modell:** Häufigster Fall am Anfang. Muss wie ein normaler Zustand wirken, nicht wie ein Defekt
- **Genau ein Verkauf:** Die gefährlichste Lage — der Preis wäre unmittelbar einem Fahrzeug zuzuordnen. Es darf nichts erscheinen, auch keine Andeutung
- **Alle Verkäufe stammen aus einem einzigen Monat:** Eine Spanne daraus ist eine Momentaufnahme, keine Marktlage
- **Verkäufe liegen Jahre zurück:** Oldtimerpreise ändern sich. Ein Durchschnitt aus 2019 ist heute womöglich irreführend
- **Ausreißer:** Ein Restaurierungsobjekt für 3.000 € neben Concours-Fahrzeugen für 120.000 €. Die Zustandsnote soll das trennen — aber nur, wenn sie gepflegt ist
- **Eigenes Fahrzeug in der Auswertung:** Wer sein Fahrzeug gekauft und den Preis beigetragen hat, sieht später eine Spanne, die seinen eigenen Preis enthält. Er darf ihn darin nicht herauslesen können
- **Nutzer versucht, durch Variation der Merkmale einen Einzelwert einzugrenzen:** Wiederholte Abfragen mit leicht verschobenen Angaben könnten eine Spanne so weit einengen, dass ein einzelner Preis erkennbar wird
- **Fahrzeug ohne Zustandsnote:** Womit soll dann verglichen werden?
- **Sehr gängiges Modell:** Bei einem VW Käfer können viele Verkäufe zusammenkommen, die inhaltlich wenig gemein haben

## Technische Anforderungen

- Kein Weg, über den ein einzelner Datensatz sichtbar wird — auch nicht über wiederholte, verschieden zugeschnittene Abfragen
- Die Mindestbesetzung wird serverseitig durchgesetzt, nicht in der Anzeige
- Die Auswertung darf die Antwortzeit der Seite nicht spürbar belasten

## Offene Entscheidungen

- **Höhe der Mindestzahl** — 5 ist ein üblicher Ausgangswert. Sie trägt hier die Hauptlast des Schutzes: Da das Baujahr jahresgenau gespeichert wird (PROJ-33), ist sie die einzige Schranke, die einen einzelnen Verkauf unsichtbar hält
- **Ob bei zu dünner Lage benachbarte Baujahre zusammengefasst werden dürfen**, um überhaupt eine Aussage zu ermöglichen — und ob das dann kenntlich gemacht wird
- **Wo die Übersicht erscheint** — in der Wertentwicklung des Fahrzeugs, als eigener Bereich oder an beiden Stellen
- **Ob sie den manuell eingetragenen Marktwert (PROJ-28) ersetzt, ergänzt oder vorschlägt**
- **Welche Kennzahl gezeigt wird** — Spanne, Median, beides
- **Ob und wie alte Verkäufe an heutige Preise angepasst werden**
- **Ob wiederholte Abfragen begrenzt werden**, um das Eingrenzen einzelner Werte zu erschweren

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
