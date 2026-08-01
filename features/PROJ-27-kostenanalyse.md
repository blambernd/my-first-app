# PROJ-27: Kostenanalyse

## Status: In Progress
**Created:** 2026-07-31
**Last Updated:** 2026-07-31

## Dependencies
- Requires: PROJ-1 (User Authentication) — User muss eingeloggt sein
- Requires: PROJ-2 (Fahrzeugprofil) — Auswertung erfolgt je Fahrzeug
- Requires: PROJ-3 (Digitales Scheckheft) — liefert Wartungs- und Reparaturkosten aus `service_entries.cost_cents`
- Requires: PROJ-24 (Tankbuch) — liefert die Kostenart "Benzin"
- Requires: PROJ-25 (Wiederkehrende Kosten) — liefert Versicherung, Steuer, Unterstellung, Clubbeitrag
- Requires: PROJ-26 (Einzelkosten) — liefert Ersatzteile, Wertgutachten, Sonstiges
- Ergänzt durch: PROJ-28 (Kaufpreis & Wertentwicklung) — Anschaffung wird dort getrennt ausgewiesen

## Zusammenfassung
Die Kostenanalyse führt alle Kostenarten eines Fahrzeugs zusammen und stellt sie grafisch dar: Verteilung nach Kostenart, Entwicklung über die Zeit und Kennzahlen wie Gesamtkosten und Kosten pro Kilometer.

Dieses Feature **erfasst keine eigenen Daten** — es wertet ausschließlich aus, was PROJ-3, PROJ-24, PROJ-25 und PROJ-26 liefern. Das macht es unabhängig testbar und erlaubt, die Erfassungs-Features vorher einzeln auszurollen.

Zwei Punkte prägen den Zuschnitt: Die Auswertung muss **mit unvollständigen Daten sinnvoll umgehen** — kaum ein Nutzer wird alle sechs Kostenarten gepflegt haben, und eine Analyse, die dann leer oder irreführend ist, wäre wertlos. Und sie muss **Doppelzählungen ausschließen**, insbesondere bei Ersatzteilen, die auch in einer Werkstattrechnung stecken können.

## User Stories
- Als Oldtimer-Besitzer möchte ich sehen, wie sich meine Kosten auf die Kostenarten verteilen, damit ich weiß, wo mein Geld hingeht
- Als Oldtimer-Besitzer möchte ich die Entwicklung meiner Kosten über die Zeit sehen, damit ich teure Jahre erkenne
- Als Oldtimer-Besitzer möchte ich meine Gesamtkosten für einen wählbaren Zeitraum sehen, damit ich die Unterhaltskosten realistisch einschätze
- Als Oldtimer-Besitzer möchte ich meine Kosten pro Kilometer sehen, damit ich sie mit anderen Fahrzeugen vergleichen kann
- Als Oldtimer-Besitzer möchte ich erkennen, welche Kostenarten ich noch nicht gepflegt habe, damit ich weiß, wie belastbar die Auswertung ist
- Als Oldtimer-Besitzer, der sein Fahrzeug verkaufen will, möchte ich die dokumentierten Unterhaltskosten vorweisen können, damit ich den gepflegten Zustand belegen kann
- Als Oldtimer-Besitzer möchte ich von einer Kostenposition zum zugrundeliegenden Eintrag springen können, damit ich Auffälligkeiten nachvollziehen kann

## Acceptance Criteria
- [ ] Kostenanalyse ist je Fahrzeug über die Fahrzeug-Navigation erreichbar
- [ ] Folgende Kostenarten werden ausgewiesen: Benzin, Wartung, Reparatur, Ersatzteile, Versicherung, Steuern, Unterstellung, Clubbeitrag, Wertgutachten, Sonstiges
- [ ] Zuordnung der Scheckheft-Einträge über `entry_type`: **Wartung** = Inspektion, Ölwechsel, TÜV/HU; **Reparatur** = Reparatur, Restaurierung; **Sonstiges** = Sonstiges
- [ ] **Reifen** zählen als Ersatzteile, nicht als Wartung — damit die Zuordnung nicht je nach Erfassungsweg schwankt
- [ ] Die Auswertung ist zusätzlich nach **Standkosten** und **Fahrtkosten** aufteilbar: Standkosten = Versicherung, Steuer, Unterstellung, Clubbeitrag, Wertgutachten; Fahrtkosten = Benzin, Wartung, Reparatur, Ersatzteile
- [ ] Die Standkosten beantworten sichtbar die Frage "Was kostet mich das Fahrzeug, wenn ich es nicht fahre?" — als Betrag pro Monat und pro Jahr
- [ ] Die Kostenarten sind nicht fest verdrahtet: Eine in PROJ-25/26 ergänzte Kostenart erscheint automatisch in der Auswertung
- [ ] Der Kaufpreis aus PROJ-28 fließt **nicht** in die Zeitreihe der laufenden Kosten ein, sondern wird getrennt ausgewiesen
- [ ] Verteilung der Kosten nach Kostenart wird grafisch dargestellt
- [ ] Kostenentwicklung über die Zeit wird grafisch dargestellt, aufgeschlüsselt nach Kostenart
- [ ] Gesamtsumme für den gewählten Zeitraum wird angezeigt
- [ ] Kosten pro Kilometer werden angezeigt, sofern ein Kilometerbezug ermittelbar ist
- [ ] Zeitraum ist wählbar (u. a. laufendes Jahr, letztes Jahr, gesamter Zeitraum)
- [ ] Fixkosten aus PROJ-25 gehen als monatlich umgelegte Beträge ein, nicht als Einmalbetrag im Zahlungsmonat
- [ ] Als "bereits im Scheckheft enthalten" gekennzeichnete Ersatzteile (PROJ-26) werden **nicht** zusätzlich gezählt
- [ ] Es ist erkennbar, ob und wie viele Beträge wegen Doppelerfassung ausgeschlossen wurden
- [ ] Kostenarten ohne erfasste Daten werden als "nicht erfasst" gekennzeichnet und nicht als 0 € dargestellt
- [ ] Ein Hinweis weist auf die Vollständigkeit der Datenbasis hin, wenn Kostenarten fehlen
- [ ] Von einer Kostenposition kann zum zugrundeliegenden Eintrag navigiert werden
- [ ] Leerer Zustand: Hinweis mit Verweis auf die Erfassungs-Features, wenn noch keinerlei Kosten vorliegen
- [ ] Zugriff folgt den Rollen aus PROJ-6
- [ ] Darstellung ist auf Mobile (375px), Tablet (768px) und Desktop (1440px) nutzbar

## Edge Cases
- **Gar keine Kostendaten:** Leerer Zustand mit Erklärung, welche Erfassungen die Analyse speist — keine leeren Diagramme oder Nullwerte anzeigen
- **Nur eine Kostenart gepflegt:** Verteilungsdiagramm zeigt 100 % für diese Art. Das ist technisch korrekt, aber irreführend — die Unvollständigkeit muss deutlich benannt werden, sonst zieht der Nutzer falsche Schlüsse
- **Kosten pro Kilometer ohne Fahrleistung:** Fahrzeug hat keinen oder nur einen km-Stand. Division durch null vermeiden und stattdessen "nicht berechenbar" ausweisen — kein 0 € und kein Unendlich-Wert
- **Fahrzeug mit sehr geringer Jahresfahrleistung:** Bei Oldtimern üblich (wenige hundert km). Der €/km-Wert wird dann extrem hoch. Er ist rechnerisch richtig, sollte aber eingeordnet werden, statt als Alarmsignal zu wirken
- **Fixkostenzeitraum reicht in die Zukunft:** Nur bereits vergangene Monate dürfen als angefallene Kosten zählen, sonst weist die Analyse Kosten aus, die noch nicht entstanden sind
- **Überlappende Zeiträume wiederkehrender Kosten (aus PROJ-25):** Würden doppelt zählen. Die Analyse muss die Überlappung offenlegen, statt still zu summieren
- **Winterlager und Saisonkennzeichen greifen ineinander:** Garage wird oft genau dann bezahlt, wenn das Fahrzeug abgemeldet ist. In Monaten ohne Fahrleistung entstehen dann Standkosten ohne Fahrtkosten — das ist korrekt und darf nicht als Datenfehler markiert werden
- **Neue Kostenart ohne Standkosten-/Fahrtkosten-Klassifizierung:** Muss in der Gesamtsumme trotzdem auftauchen und darf nicht aus der Auswertung fallen, nur weil die Zuordnung fehlt
- **Ersatzteil als "bereits enthalten" markiert, verknüpfter Scheckheft-Eintrag existiert aber nicht mehr:** Der Betrag darf nicht dauerhaft aus der Auswertung verschwinden — siehe Löschverhalten in PROJ-26
- **Scheckheft-Eintrag ohne Kostenangabe:** `cost_cents` ist optional. Solche Einträge zählen mit 0 € — die Anzahl der Einträge ohne Kostenangabe sollte erkennbar sein, damit die Lücke nicht unbemerkt bleibt
- **Zeitraum ohne jede Kostenposition:** Diagramme zeigen den leeren Zeitraum als solchen, nicht als durchgehende Nulllinie neben befüllten Zeiträumen
- **Geteiltes Fahrzeug (PROJ-6):** Ob eingeladene Mitglieder — insbesondere Werkstätten — die Kostenauswertung sehen dürfen, ist eine bewusst zu treffende Entscheidung. Kosten sind sensibler als Wartungshistorie
- **Fahrzeug-Transfer (PROJ-7):** Beim Besitzerwechsel ist zu klären, ob die Kostenhistorie mit übergeht. Sie kann Rückschlüsse auf Kaufpreis und Zahlungsverhalten des Vorbesitzers erlauben
- **Sehr langer Zeitraum mit vielen Einträgen:** Die Zeitachse muss sinnvoll aggregieren (Monate statt Tage), damit die Darstellung lesbar bleibt

## Technische Anforderungen
- Es ist **keine Chart-Bibliothek installiert** — die Wahl (bzw. der Verzicht zugunsten von eigenem SVG) ist eine Architekturentscheidung für `/architecture`, inklusive Auswirkung auf die Bundle-Größe
- Diagramme müssen in hellem und dunklem Design lesbar sein (`next-themes` ist im Projekt vorhanden)
- Farben der Kostenarten müssen auch für Nutzer mit Farbfehlsichtigkeit unterscheidbar sein; Kostenarten dürfen nicht ausschließlich über Farbe identifizierbar sein
- Beträge durchgängig in Cent verarbeiten, erst bei der Anzeige in Euro formatieren (deutsche Formatierung)
- Aggregation sollte serverseitig erfolgen, damit nicht alle Einzeleinträge an den Client übertragen werden
- Performance: Auswertung < 500ms bei einem Fahrzeug mit mehreren hundert Einträgen
- Offene Produktentscheidung: Ob die Kostenanalyse ein Premium-Feature nach PROJ-8 wird, ist noch nicht entschieden — siehe Anmerkung unten

## Offene Entscheidungen
- **Premium oder Free?** Die Kostenanalyse ist ein plausibler Premium-Hebel für PROJ-8 (Free = Erfassung, Premium = Auswertung). Das ist eine Produktentscheidung und bewusst nicht vorweggenommen
- **Sichtbarkeit für geteilte Fahrzeuge:** siehe Edge Cases
- **Verhalten beim Fahrzeug-Transfer:** siehe Edge Cases

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Entscheidungen des Nutzers (2026-07-31)

| Frage | Entscheidung |
|---|---|
| Premium oder frei? | **Auswertung Premium, Erfassung frei** — PROJ-24/25/26 bleiben frei, PROJ-27 ist Premium |
| Sichtbarkeit bei geteilten Fahrzeugen | **Nur der Besitzer** |
| Kostenhistorie beim Fahrzeug-Transfer | **Bleibt beim Vorbesitzer**, geht nicht mit über |

### A) Komponenten-Struktur

```
Kosten-Bereich  (/vehicles/[id]/kosten)
+-- Unterreiter
|   +-- Laufende Kosten     (PROJ-25)
|   +-- Einzelkosten        (PROJ-26)
|   +-- [Auswertung]        ← dieses Feature
|
+-- Auswertung  (/vehicles/[id]/kosten/auswertung)
    +-- Premium-Sperre (falls kein Premium)
    |   +-- Erklärung, was die Auswertung zeigt, mit Verweis auf das Abo
    +-- Zeitraum-Auswahl
    |   +-- laufendes Jahr · letztes Jahr · gesamter Zeitraum
    +-- Kennzahlen-Leiste
    |   +-- Gesamtkosten im Zeitraum
    |   +-- Standkosten je Monat und je Jahr  ("Was kostet es im Stand?")
    |   +-- Kosten pro Kilometer   (oder "nicht berechenbar")
    +-- Datenbasis-Hinweis
    |   +-- welche Kostenarten nicht erfasst sind
    |   +-- wie viele Beträge wegen Doppelerfassung ausgeschlossen wurden
    |   +-- wie viele Scheckheft-Einträge ohne Kostenangabe sind
    |   +-- Warnung bei überlappenden Zeiträumen (aus PROJ-25)
    +-- Diagramm: Verteilung nach Kostenart
    +-- Umschalter: alle Kostenarten / Standkosten / Fahrtkosten
    +-- Diagramm: Entwicklung über die Zeit (monatlich gestapelt)
    +-- Tabelle je Kostenart
    |   +-- Betrag, Anteil, Anzahl Positionen
    |   +-- Verweis zur Quelle (Tankbuch / Scheckheft / Laufende / Einzelkosten)
    +-- Leerer Zustand
        +-- Erklärung, welche Erfassungen die Auswertung speisen, mit Links
```

### B) Datenmodell

**Dieses Feature legt keine eigene Tabelle an.** Es liest ausschließlich, was bereits erfasst ist:

| Quelle | Liefert | Kostenarten |
|---|---|---|
| Tankbuch (PROJ-24) | Betrag und Datum je Tankvorgang | Benzin |
| Scheckheft (PROJ-3) | Kosten je Eintrag, Kostenart aus dem Eintragstyp | Wartung, Reparatur, Sonstiges |
| Laufende Kosten (PROJ-25) | Betrag, Intervall, Gültigkeitszeitraum | Versicherung, Steuer, Unterstellung, Clubbeitrag |
| Einzelkosten (PROJ-26) | Betrag, Datum, Kennzeichen "bereits enthalten" | Ersatzteile, Wertgutachten, Sonstiges |

Was die Auswertung im Arbeitsspeicher daraus bildet:

```
Je Kostenart:
- Bezeichnung und Herkunft (aus welcher Erfassung sie stammt)
- Einordnung: Standkosten, Fahrtkosten oder ohne Zuordnung
- Summe im gewählten Zeitraum
- Anzahl der Positionen
- Zustand: "nicht erfasst" | "erfasst" — ausdrücklich unterschieden

Je Monat im Zeitraum:
- Betrag je Kostenart
- Kennzeichen, ob der Monat überhaupt Daten hat

Für die Datenbasis:
- ausgeschlossene Beträge wegen Doppelerfassung (Anzahl und Summe)
- Scheckheft-Einträge ohne Kostenangabe (Anzahl)
- überlappende Zeiträume laufender Kosten (Anzahl)
- ermittelte Fahrleistung im Zeitraum (oder: nicht ermittelbar)
```

### C) Technische Entscheidungen

**C1 — Keine eigene Tabelle, keine gespeicherten Auswertungen.**
Die Auswertung wird bei jedem Aufruf frisch berechnet. Gespeicherte Summen müssten bei jeder Änderung in vier Erfassungs-Features nachgezogen werden; jede vergessene Stelle erzeugt still falsche Zahlen. Der Rechenaufwand ist bei den erwarteten Datenmengen unerheblich.

**C2 — Gerechnet wird auf dem Server, aber in der Anwendung, nicht in der Datenbank.**
Die Spec verlangt serverseitige Aggregation, damit nicht alle Einzeleinträge zum Browser wandern. Das ist erfüllt: Die Seite lädt und verdichtet auf dem Server, an den Browser gehen nur die fertigen Summen.

Bewusst **nicht** als Datenbankfunktion: Die schwierigen Regeln — die Umlage der Fixkosten aus PROJ-25 und der Doppelzählungsschutz aus PROJ-26 — existieren bereits als geprüfte Bausteine mit 22 bzw. gut zwei Dutzend Tests. Eine zweite Fassung derselben Regeln in der Datenbank hieße zwei Quellen der Wahrheit, die auseinanderlaufen werden. Genau bei diesen Regeln sind in PROJ-24 und PROJ-25 bereits Fehler aufgetreten, die erst durch Tests auffielen.

**C3 — Ein zentrales Verzeichnis der Kostenarten.**
An einer Stelle steht, welche Kostenart es gibt, aus welcher Erfassung sie stammt und ob sie Stand- oder Fahrtkosten sind. Damit erfüllt sich die Anforderung, dass eine in PROJ-25 oder PROJ-26 ergänzte Kostenart automatisch in der Auswertung erscheint — sie wird dort eingetragen und ist überall sichtbar, statt an mehreren Stellen nachgepflegt zu werden.

**C4 — "Nicht erfasst" ist etwas anderes als "0 €".**
Jede Kostenart hat einen von zwei Zuständen. Wer keine Versicherung erfasst hat, bekommt "nicht erfasst" — nicht die Aussage, seine Versicherung koste nichts. Diese Unterscheidung zieht sich durch alle Darstellungen: Nicht erfasste Arten erscheinen nicht im Verteilungsdiagramm, sondern im Datenbasis-Hinweis.

**C5 — Fixkosten gehen monatlich umgelegt ein, und nur für vergangene Monate.**
Ein Jahresbeitrag verteilt sich auf zwölf Monate, statt im Zahlungsmonat als Spitze zu erscheinen. Die Umlage-Logik aus PROJ-25 wird unverändert weiterverwendet. Läuft ein Gültigkeitszeitraum in die Zukunft, zählen nur die bereits vergangenen Monate — sonst weist die Auswertung Kosten aus, die noch gar nicht angefallen sind.

**C6 — Doppelzählung wird ausgeschlossen und sichtbar gemacht.**
Die Regel aus PROJ-26 wird unverändert übernommen: Ein Betrag wird nur dann übersprungen, wenn er als "bereits enthalten" gekennzeichnet ist **und** die Verknüpfung noch besteht. Fällt der Scheckheft-Eintrag weg, zählt der Betrag wieder mit. Die Auswertung nennt Anzahl und Summe der ausgeschlossenen Beträge ausdrücklich, statt sie stillschweigend zu unterschlagen.

**C7 — Kosten pro Kilometer: Fahrleistung aus zwei Quellen, mit Vorsicht.**
Kilometerstände stehen sowohl im Scheckheft als auch im Tankbuch. Beide werden zusammengeführt und nach Datum sortiert; die Fahrleistung ist die Summe der Zuwächse zwischen aufeinanderfolgenden Ablesungen.

Übersprungen werden Abschnitte, in denen eine Tacho-Korrektur liegt oder der Stand sinkt — dieselbe Vorsicht, die im Tankbuch bereits die Verbrauchsberechnung schützt. Liegen weniger als zwei brauchbare Ablesungen vor, lautet das Ergebnis **"nicht berechenbar"**; es wird weder 0 € noch ein Unendlich-Wert angezeigt.

Bei sehr geringer Fahrleistung — bei Oldtimern der Normalfall — wird der Wert mit der zugrundeliegenden Kilometerzahl zusammen genannt, damit ein hoher Wert einzuordnen ist und nicht als Alarm wirkt.

**C8 — Diagramme mit dem vorhandenen Baukasten.**
Die Spec vermerkt, es sei keine Diagramm-Bibliothek installiert. **Das stimmt nicht mehr:** Mit PROJ-24 kamen Recharts und die zugehörige shadcn-Komponente ins Projekt. Es wird also nichts Neues installiert und die Bündelgröße wächst nicht.

Kostenarten sind nie **nur** über Farbe unterscheidbar: Jedes Segment und jede Reihe trägt zusätzlich eine Beschriftung, und die Tabelle unter den Diagrammen enthält dieselben Zahlen in Textform. Damit ist die Auswertung auch bei Farbfehlsichtigkeit und mit Vorlesehilfen benutzbar. Helles und dunkles Design sind über die vorhandene Komponente bereits abgedeckt.

**C9 — Premium-Sperre nach dem etablierten Muster.**
Es wird dieselbe Prüfung verwendet wie bei Marktpreis-Analyse und Verkaufsassistent. Statt einer leeren Seite sieht ein Nutzer ohne Premium, **was** die Auswertung leisten würde — sonst wirbt die Sperre nicht, sondern frustriert nur.

**C10 — Sichtbarkeit nur für den Besitzer: betrifft den ganzen Kostenbereich.**
Hier ist eine Folge zu benennen, die über dieses Feature hinausgeht. Die Auswertung zeigt nichts, was nicht schon in den Listen von PROJ-25 und PROJ-26 stünde — und **diese sind heute für alle Mitglieder sichtbar**, Werkstätten eingeschlossen. Nur die Auswertung zu sperren, wäre reine Fassade: Die Beträge blieben eine Klickebene tiefer offen.

Empfehlung: Der gesamte Kostenbereich wird auf den Besitzer beschränkt — Seiten **und** Datenbankregeln, denn die Regeln erlauben Mitgliedern derzeit ebenfalls das Lesen. Das ist eine Änderung an zwei bereits ausgelieferten Features und sollte bewusst entschieden werden. Das Tankbuch bleibt davon unberührt: Verbrauch ist Fahrzeugtechnik, kein Finanzdatum.

**C11 — Zeitachse in Monaten, Lücken bleiben Lücken.**
Aggregiert wird monatlich, nicht tagesgenau, damit auch mehrjährige Zeiträume lesbar bleiben. Monate ohne jede Kostenposition werden als Lücke dargestellt und nicht als Nulllinie neben befüllten Monaten — eine durchgezogene Null suggeriert eine Aussage, die die Daten nicht hergeben.

Monate mit Standkosten, aber ohne Fahrtkosten sind **kein** Datenfehler: Genau so sieht ein Winterlager mit Saisonkennzeichen aus. Sie werden nicht als Auffälligkeit markiert.

**C12 — Von der Zahl zur Quelle.**
Jede Kostenart in der Tabelle verweist auf die Erfassung, aus der sie stammt. Bewusst auf die jeweilige Übersicht und nicht auf den Einzeleintrag: Eine Kostenart fasst viele Positionen zusammen, ein Sprung auf genau eine davon wäre willkürlich.

### D) Abhängigkeiten

**Keine neuen Pakete.** Recharts und die Diagramm-Komponente kamen mit PROJ-24, die Rechenbausteine aus PROJ-24/25/26 werden weiterverwendet, die Premium-Prüfung besteht.

### E) Was dieses Feature bewusst NICHT tut

- **Keine eigene Datenerfassung.** Fehlt eine Kostenart, verweist die Auswertung auf das zuständige Erfassungs-Feature
- **Kein Kaufpreis.** Die Anschaffung aus PROJ-28 wird dort getrennt ausgewiesen und verzerrt die Zeitreihe der laufenden Kosten nicht
- **Kein Export.** Weder PDF noch CSV — nicht in den Acceptance Criteria; die Verkaufs-Story wird über PROJ-12 und PROJ-16 bedient

### F) Offene Punkte für die Umsetzung

**F1 — Der Fahrzeug-Transfer braucht eine eigene Aufgabe, und die Entscheidung hat eine unangenehme Kehrseite.**

Die Entscheidung lautet: Kostendaten bleiben beim Vorbesitzer. PROJ-27 liest jedoch nur und kann das nicht umsetzen — die Änderung gehört in die Transfer-Logik von PROJ-7.

Dabei ist Folgendes zu bedenken: Die Kostendaten hängen am Fahrzeug, nicht am Nutzer. "Bleiben beim Vorbesitzer" lässt sich technisch nur als **Löschen beim Transfer** umsetzen — und dann sind sie auch für den Vorbesitzer weg. Bei aktivierter Option "als Betrachter behalten" verliert er sie ebenfalls. Die Entscheidung schützt ihn also vor Offenlegung, kostet ihn aber seine eigenen Aufzeichnungen.

Empfehlung: Vor dem Transfer ausdrücklich darauf hinweisen und einen Export anbieten, bevor die Kostendaten entfernt werden. Das ist eine eigenständige Aufgabe mit eigener ID (PROJ-29) und **keine Voraussetzung** für PROJ-27.

**F2 — Die Zuordnung "Reifen zählen als Ersatzteile" ist nicht umsetzbar.**
Das Acceptance Criterion setzt eine Kostenart "Reifen" voraus, die es nirgends gibt: Weder das Scheckheft noch die Einzelkosten kennen einen solchen Typ. Reifen sind heute eine Beschreibung, kein Typ. Empfehlung: Das Kriterium streichen — Reifen fallen als Ersatzteile ohnehin richtig an, sobald sie dort erfasst werden.

**F3 — C10 ist eine Entscheidung über zwei ausgelieferte Features.**
Ob PROJ-25 und PROJ-26 mit auf "nur Besitzer" umgestellt werden, sollte vor dem Bau feststehen. Ohne diese Umstellung ist die Zugriffsbeschränkung der Auswertung wirkungslos.

**F4 — Aufteilung nach Stand- und Fahrtkosten bei "Sonstiges".**
"Sonstiges" ist in PROJ-25 und PROJ-26 bewusst nicht eingeordnet. Solche Beträge erscheinen in der Gesamtsumme, aber in keinem der beiden Töpfe. In der Aufteilung wird das als eigener Posten "ohne Zuordnung" ausgewiesen, damit die Summe der Töpfe nachvollziehbar unter der Gesamtsumme liegt.

## Implementierung (Frontend)

**Stand:** 2026-08-01 · Oberfläche und Rechenlogik fertig, Datenzugriff über Server Components

### Gebaute Dateien

| Datei | Zweck |
|---|---|
| `src/lib/cost-analysis.ts` | Gesamte Rechenlogik als reine Funktionen — Verzeichnis der Kostenarten, Zeiträume, Fahrleistung, Aggregation |
| `src/lib/cost-analysis.test.ts` | 41 Unit-Tests |
| `src/components/cost-analysis-view.tsx` | Ansicht: Kennzahlen, Datenbasis-Hinweis, Filter, Tabelle, leerer Zustand |
| `src/components/cost-charts.tsx` | Die beiden Diagramme, getrennt wegen des Nachladens im Browser |
| `src/app/vehicles/[id]/kosten/auswertung/page.tsx` | Besitzerprüfung, Premium-Sperre, Laden und Aggregation auf dem Server |
| `src/components/cost-area-nav.tsx` | Reiter „Auswertung" freigeschaltet |
| `src/app/globals.css` | `--chart-6` bis `--chart-10` ergänzt, hell und dunkel |

### Umgesetzte Entscheidungen

- **Keine eigene Tabelle**, keine gespeicherten Summen (C1)
- **Aggregation auf dem Server**: Die Seite rechnet alle drei Zeiträume vor und übergibt fertige Summen. Das Umschalten in der Oberfläche braucht keinen weiteren Serveraufruf, und es wandert kein einziger Einzeleintrag in den Browser (C2)
- **Verzeichnis abgeleitet statt wiederholt**: Kostenarten aus PROJ-25 und PROJ-26 werden aus deren eigenen Listen aufgebaut. Eine dort ergänzte Art erscheint automatisch (C3). Die Zuordnung der Scheckheft-Typen ist bewusst vollständig ausgeschrieben — kommt in PROJ-3 ein Typ hinzu, meldet TypeScript einen Fehler, statt ihn stillschweigend unter „Sonstiges" abzulegen
- **„Nicht erfasst" ≠ „0 €"** (C4): Der Zustand wird über **alle** Daten bestimmt, nicht nur über den Zeitraum. Wer Tankbelege hat, aber keinen im gewählten Jahr, gilt als erfasst mit 0 € — das ist etwas anderes als nie erfasst
- **Fixkosten monatlich umgelegt** über `prorate` aus PROJ-25, ohne Nachbau (C5). Noch nicht angebrochene Monate zählen nicht; der **laufende** Monat zählt mit, weil er begonnen hat
- **Doppelzählungsschutz** über `countsTowardTotal` aus PROJ-26, ohne Nachbau (C6). Anzahl und Summe der ausgeschlossenen Beträge stehen sichtbar auf der Seite
- **Fahrleistung** aus Tankbuch und Scheckheft zusammen; Abschnitte mit Tacho-Korrektur oder sinkendem Stand werden übersprungen, unter zwei Ablesungen lautet das Ergebnis „nicht berechenbar" (C7)
- **Diagramme** mit dem seit PROJ-24 vorhandenen Recharts; keine neue Abhängigkeit (C8)
- **Premium-Sperre** nach dem Muster von Marktpreis und Verkaufsassistent (C9)
- **Nur der Besitzer** sieht die Seite (C10)
- **Lücken bleiben Lücken**: Monate ohne Kosten werden im Diagramm ausgelassen (C11)
- **Verweis zur Quelle** je Kostenart in der Tabelle (C12)

### Nicht umgesetzt

- **„Reifen zählen als Ersatzteile"** — nicht umsetzbar. Weder Scheckheft noch Einzelkosten kennen einen Reifen-Typ; Reifen sind heute eine Beschreibung. Als Ersatzteil erfasst fallen sie ohnehin richtig an. Empfehlung: Kriterium streichen
- **Umstellung von PROJ-25 und PROJ-26 auf „nur Besitzer"** — bewusst nicht in diesem Feature. Solange die Listen dort für alle Mitglieder sichtbar sind, ist die Beschränkung der Auswertung nur eine Fassade (siehe F3). Eigene Entscheidung, eigene Aufgabe

### Beim Bauen gefunden

**Ungültiges HTML im Datenbasis-Hinweis.** `Badge` rendert ein `div`, das ich in einen Absatz gesetzt hatte. Ergebnis: ein Hydration-Fehler, den weder `tsc` noch `npm run build` sieht — beide übersetzen fehlerfrei. Gefunden erst beim Rendern im Browser. Behoben.

**Diagramme müssen im Browser nachgeladen werden.** Recharts misst den Container aus, bevor es zeichnet; serverseitig gibt es keine Maße. Deshalb liegen die Diagramme in einer eigenen Datei, die über `next/dynamic` mit `ssr: false` geladen wird, mit Platzhalter in gleicher Höhe gegen Layout-Sprünge.

**Eine Fehlspur, die ich offenlegen sollte:** Zwischenzeitlich sahen beide Diagramme leer aus, und ich hielt die Farbangabe für die Ursache. Eine Messung im DOM zeigte das Gegenteil — 19 Balken mit echter Höhe, Farbe aufgelöst zu `rgb(40, 90, 189)`. Die Diagramme waren die ganze Zeit in Ordnung; der `fullPage`-Screenshot skaliert das Fenster um und startet dadurch Rechartsʼ Einblend-Animation neu, sodass die Flächen im Bild bei Höhe null standen. Die Umstellung auf `var(--color-<schlüssel>)` bleibt trotzdem drin, weil sie dem Muster von shadcn und PROJ-24 entspricht — sie war aber **nicht** die Behebung eines Fehlers.

### Geprüft

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests `cost-analysis` | **41/41 grün** |
| Unit-Tests gesamt | 435 grün, 4 vorbestehende Fehlschläge (`auth.test.ts` ×3, `milestone.test.ts` ×1) |
| `npm run build` | erfolgreich, Route im Manifest |
| `npx eslint` auf allen PROJ-27-Dateien | keine Meldung |
| Sichtprüfung leerer Zustand | vier Verweise auf die Erfassungs-Features |
| Sichtprüfung mit Daten (1280 px und 375 px) | Kennzahlen, Hinweise, beide Diagramme, Tabelle korrekt |
| Konsolenfehler auf der Auswertungsseite | **0** (der beobachtete Hydration-Fehler liegt per Gegenprobe auf `/dashboard` und ist vorbestehend) |
| Rechenprobe gegen die Oberfläche | Summe 2.667,00 € = 237 + 200 + 500 + 50 + 800 + 600 + 250 + 30; ausgeschlossen 120,00 €; Standkosten 1.650 / 8 Monate = 206,25 €/Monat; 2.667 € / 1.000 km = 2,67 €/km |
| Verhalten über die Monatsgrenze | Beim Tageswechsel auf den 1.8. stieg die Versicherung korrekt von 700 auf 800 € — der laufende Monat zählt mit, spätere nicht |

Die Sichtprüfung lief gegen das Wegwerf-Fahrzeug mit eigens angelegten Daten; diese wurden danach wieder entfernt (alle vier Tabellen zurück auf 0 Zeilen).

## Implementierung (Backend)

**Stand:** 2026-08-01 · Keine neue Tabelle, keine API-Route — die Backend-Arbeit war Zugriff und Performance

### Keine neue Tabelle, keine API-Route

Wie im Tech Design festgelegt: Das Feature liest ausschließlich. Die Aggregation läuft in der Server Component über die geprüften Bausteine aus PROJ-24/25/26. Damit gibt es kein Schema und keine Route zu bauen — und nichts, was zwischen zwei Quellen der Wahrheit auseinanderlaufen könnte.

### Zugriff: gesamter Kostenbereich auf den Besitzer beschränkt

Entscheidung des Nutzers vom 2026-08-01 nach ausdrücklicher Rückfrage (Änderungen an RLS-Regeln brauchen laut Projektregeln Freigabe).

Die Beschränkung **musste** über PROJ-27 hinausgehen: Die Auswertung zeigt nichts, was nicht schon in den Listen von PROJ-25 und PROJ-26 stünde, und deren Lesepolicies erlaubten jedem Mitglied den Zugriff. Nur die Auswertung zu sperren wäre Fassade gewesen.

- Migration: `20260801_restrict_cost_tables_to_owner.sql`
- Betroffen: `recurring_costs` und `one_off_costs`, alle vier Regeln je Tabelle auf `besitzer`
- **Tankbuch und Scheckheft bleiben unberührt** — Verbrauch und Wartungshistorie sind genau das, wofür die Werkstatt-Rolle existiert
- Seiten von PROJ-25 und PROJ-26 nachgezogen: Mitglieder bekommen eine klare Absage statt einer leeren Liste
- **Zeitpunkt bewusst gewählt:** In der Produktion existiert derzeit **keine einzige Mitgliedschaft**. Kein bestehender Nutzer verliert einen Zugriff; später wäre dieselbe Änderung eine spürbare Einschränkung laufender Freigaben

**Gegen die Datenbank verifiziert** (zurückgerollte Transaktion, jeweils mit Gegenprobe):

| Prüfung | Ergebnis |
|---|---|
| Werkstatt: laufende Kosten sehen | **0 Zeilen** |
| Werkstatt: Einzelkosten sehen | **0 Zeilen** |
| **Werkstatt: Tankbuch sehen** | **1 Zeile** — bewusst weiterhin erlaubt |
| Werkstatt: Einzelkosten anlegen | **blockiert** (`42501`) |
| Werkstatt: laufende Kosten ändern | **0 Zeilen** |
| **Gegenprobe Besitzer: sehen / sehen / ändern** | **1 / 1 / 1** |

### Performance

Die Spec verlangt unter 500 ms bei mehreren hundert Einträgen. Gemessen mit **868 Datensätzen** über sieben Jahre (320 Tankvorgänge, 220 Scheckheft-Einträge, 28 laufende Kosten, 300 Einzelkosten):

| Messung | Ergebnis |
|---|---|
| Reine Aggregation, alle drei Zeiträume | **3,8 ms** Median, 13,0 ms schlechtester von 30 Läufen |
| Datenbankabfragen einzeln (`EXPLAIN ANALYZE`, Rolle `authenticated`) | 4,8–7,0 ms, alle über Indizes |
| Seitenzeit gesamt, Produktionsbuild, 9 Läufe | **363 ms** Median (341–518 ms) |
| Vergleichswert Einzelkosten-Seite, gleicher Lauf | 467 ms Median |

Die Rechnung selbst ist also vernachlässigbar; die Seitenzeit besteht fast vollständig aus Netzwerkwegen zur Datenbank. Deshalb wurde dort optimiert: Besitzprüfung und Abo-Status laufen jetzt gemeinsam statt nacheinander — drei Wege statt vier.

**Einordnung der Messung, damit sie nicht überinterpretiert wird:** Eine erste Messung ergab 1752 ms Median, allerdings direkt nach dem Start gegen einen kalten Server und mit nur fünf Läufen. Wie viel der Verbesserung auf die Parallelisierung und wie viel auf das Aufwärmen entfällt, lässt sich daraus **nicht sauber trennen**. Belastbar ist: Die Aggregation liegt bei 3,8 ms, und die Seite liegt im warmen Zustand unter dem Budget — auf einer Seite, die vier Quellen liest, gegenüber 467 ms für eine Seite, die eine liest.

### Indizes

Keine neuen nötig. Alle vier Abfragen laufen über bestehende Indizes auf `(vehicle_id, datum)`; die Pläne zeigen Index- bzw. Bitmap-Index-Scans, keine sequenziellen Scans.

### Vorläufiger Test

`tests/PROJ-27-auswertung-smoke-auth.spec.ts` — eine Rauchprobe, dass die Seite nach der Rechteumstellung weiterhin lädt. Die vollständigen Tests folgen in `/qa`.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
