# PROJ-34: Preisübersicht aus echten Verkäufen

## Status: Architected
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

**Erstellt:** 2026-08-07

### Entscheidungen des Nutzers (2026-08-07)

| Frage | Entscheidung |
|---|---|
| Wo erscheint die Übersicht | **In der Wertentwicklung** |
| Verhältnis zum eigenen Marktwert | **Ergänzen, nebeneinander** |
| Zu dünne Datenlage je Baujahr | **Benachbarte Baujahre schrittweise und kenntlich zusammenfassen** |

### ⚠ Eine Folge, die vorab geklärt gehört

Die Wertentwicklung ist **Premium** (PROJ-31/PROJ-33). Mit der Entscheidung, die Übersicht dort anzusiedeln, wird sie damit ebenfalls kostenpflichtig — das **widerspricht dem Akzeptanzkriterium** „Die Übersicht ist für alle angemeldeten Nutzer erreichbar".

Unangenehmer ist die zweite Seite davon: **Beigetragen wird von allen, gesehen nur von Zahlenden.** Ein Nutzer ohne Premium gibt beim Fahrzeug-Transfer seinen Kaufpreis frei (PROJ-33) und bekommt die Auswertung, zu der er beigetragen hat, nicht zu sehen. Das ist vertretbar, aber es sollte eine bewusste Entscheidung sein und keine Nebenwirkung der Platzierung.

**Zwei saubere Auflösungen** — beide ohne großen Aufwand:

1. Das Kriterium ändern: Die Übersicht ist Teil von Premium. Dann sollte die Einwilligung in PROJ-33 das erwähnen
2. Den Abschnitt innerhalb der Wertentwicklung frei zugänglich machen, den Rest der Seite weiter hinter der Schranke

**Empfehlung: Variante 2.** Sie hält beide Entscheidungen ein und macht die Übersicht zugleich zum stärksten Werbeträger für Premium — wer die Vergleichszahl sieht, sieht daneben, was ihm sonst noch fehlt.

*Bis zur Klärung geht dieser Entwurf von Variante 2 aus.*

### A) Aufbau der Oberfläche

```
Wertentwicklung  (/vehicles/[id]/kosten/wertentwicklung)
│
├── Anschaffung                          bestehend, Premium
├── Eigener Marktwert                    bestehend, Premium
│
├── [NEU] Vergleichspreise               frei zugänglich
│   ├── Median vergleichbarer Verkäufe
│   ├── Gestutzte Spanne (ohne die Ränder)
│   ├── Grundlage: „N Verkäufe · Baujahr 1969–1971 · 50.000–75.000 km · Note 2–3"
│   ├── Belastbarkeitshinweis, wenn wenige oder alte Verkäufe
│   └── Leerer Zustand mit Begründung
│
└── Wertentwicklung (Verlauf)            bestehend, Premium
```

**Der eigene Marktwert bleibt maßgeblich.** Die Vergleichsspanne steht daneben als Einordnung — der Nutzer sieht, ob seine Einschätzung im Rahmen liegt, und behält die Hoheit über seine Zahl. Die Wertentwicklung rechnet unverändert mit dem selbst eingetragenen Wert.

### B) Welche Angaben gebraucht werden

**Keine neue Tabelle.** Gelesen wird ausschließlich `vehicle_sales` aus PROJ-33, und zwar **nur zusammengefasst**.

```
Gebraucht werden die Merkmale des eigenen Fahrzeugs:
- Marke und Modell
- Baujahr
- Kilometerstand → Klasse
- Zustandsnote

Zurück kommt:
- Median und gestutzte Spanne
- Anzahl der Verkäufe, auf denen das beruht
- Der tatsächlich verglichene Baujahr-Bereich
- Zeitraum der berücksichtigten Verkäufe
```

Einzelne Verkäufe verlassen die Datenbank **nie**.

### C) Technische Entscheidungen

**C1 — Es gibt keine Suche, sondern nur den Vergleich zum eigenen Fahrzeug.**

Das ist die wichtigste Entscheidung des Entwurfs, und sie löst einen der schwierigsten Randfälle: Wer die Merkmale frei wählen könnte, würde eine Spanne so lange einengen, bis ein einzelner Preis erkennbar wird. Genau davor warnt die Spec.

Deshalb bekommt die Auswertung **keine frei wählbaren Parameter**. Sie liefert die Vergleichszahl für ein Fahrzeug, das dem Anfragenden gehört. Wer die Merkmale verschieben will, muss sein Fahrzeug ändern — das ist langsam, sichtbar und für das Ausspähen eines einzelnen Preises untauglich.

**C2 — Die Zusammenfassung entsteht in der Datenbank, nicht in der Anwendung.**

`vehicle_sales` ist für normale Nutzer vollständig gesperrt (PROJ-33 C4) — kein Lesen, auf Tabellenebene entzogen. Die Auswertung läuft deshalb in einer Funktion mit erhöhten Rechten, die **nur aggregierte Werte** zurückgibt und die Mindestzahl selbst durchsetzt.

Das ist keine Formsache: Läge die Prüfung in der Anwendung, wäre sie umgehbar. In der Funktion ist sie es nicht.

**C3 — Median statt Mittelwert, Spanne gestutzt.**

Die Strukturregeln aus PROJ-33 gegen das Fluten verteuern einen Angriff erheblich, aber **keine Strukturregel ist dicht**. Die Statistik ist die zweite, unabhängige Schranke: Ein einzelner gesetzter Ausreißer bewegt einen Median kaum, einen Mittelwert erheblich. Gestutzte Ränder fangen zusätzlich Vertipper ab, die die Plausibilitätsprüfung passiert haben.

Nebenbei wird die Auswertung dadurch schlicht besser — bei Oldtimerpreisen ist der Median ohnehin die ehrlichere Kennzahl.

**C4 — Baujahre werden schrittweise erweitert, und das steht dran.**

Reicht das exakte Baujahr nicht für die Mindestzahl, wird auf ±1 erweitert, dann ±2. Ohne das bliebe die Übersicht bei seltenen Modellen dauerhaft leer, weil PROJ-33 das Baujahr jahresgenau speichert.

**Die verwendete Spanne wird immer angezeigt.** „Median aus 6 Verkäufen, Baujahr 1969–1971" ist eine andere Aussage als „aus 6 Verkäufen von 1970" — sie zu verschweigen wäre eine stille Ungenauigkeit.

Die Erweiterung endet bei ±2. Darüber hinaus vergleicht man Fahrzeuge, die technisch nicht mehr dasselbe sind.

**C5 — Die Mindestzahl gilt ausnahmslos.**

Auch für den, der selbst beigetragen hat, und auch nach der Erweiterung der Baujahre. Wird sie nicht erreicht, erscheint kein Wert — und **auch nicht die Anzahl**: Bei einem seltenen Modell verrät schon „2 Verkäufe" zu viel.

**C6 — Marke und Modell sind Freitext (offener Punkt aus PROJ-33 F4).**

„Mercedes-Benz", „Mercedes" und „MB" wären drei Gruppen. Für die Erhebung war das noch kein Problem, für den Vergleich ist es eines: Getrennte Gruppen erreichen die Mindestzahl nie.

Der Vergleich muss deshalb mindestens Groß-/Kleinschreibung und Leerzeichen ignorieren. Eine echte Vereinheitlichung von Schreibweisen ist mehr Arbeit und beim Bauen zu entscheiden.

**C7 — Alte Verkäufe werden nicht umgerechnet.**

Eine Anpassung an heutige Preise bräuchte einen Index für Oldtimerpreise, den es hier nicht gibt. Sie zu schätzen hieße, eine Zahl zu erfinden. Stattdessen wird der **Zeitraum genannt**, und wenn die Verkäufe überwiegend alt sind, steht das als Hinweis dabei.

### D) Abhängigkeiten

**Keine neuen Pakete.** Die Auswertung ist eine Datenbankabfrage, die Anzeige nutzt vorhandene Bausteine.

### E) Was dieses Feature bewusst NICHT tut

- **Keine freie Suche** über den Bestand — siehe C1
- **Keine Preishistorie** eines Modells über die Zeit: Bei der zu erwartenden Datenmenge wäre das eine Linie durch drei Punkte
- **Kein Eingriff in die Wertentwicklung.** Sie rechnet weiter mit dem selbst eingetragenen Wert
- **Keine Anzeige, solange die Mindestzahl nicht erreicht ist** — auch nicht abgeschwächt

### F) Offene Punkte für die Umsetzung

**F1 — Die Mindestzahl.** Vorschlag: **5**. Beim Bauen zu bestätigen, sobald absehbar ist, wie viele Datenpunkte tatsächlich entstehen.

**F2 — Wie stark die Spanne gestutzt wird.** Bei fünf Verkäufen ist „ohne die Ränder" schon fast der Median selbst. Möglicherweise erst ab einer größeren Zahl stutzen.

**F3 — Ob die Zustandsnote exakt passen muss oder ±1 zulässig ist.** Exakt ist sauberer, halbiert aber die Treffer.

**F4 — Wann „überwiegend alt" gilt.** Ein Schwellenwert, der beim Bauen festzulegen ist.

**F5 — Das Feature sollte erst gebaut werden, wenn Datenpunkte vorliegen.** Heute sind es null. Eine Auswertung, die niemand mit echten Zahlen sehen kann, lässt sich weder beurteilen noch sinnvoll prüfen.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
