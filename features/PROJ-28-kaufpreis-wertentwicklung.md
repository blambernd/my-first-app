# PROJ-28: Kaufpreis & Wertentwicklung

## Status: Architected
**Created:** 2026-07-31
**Last Updated:** 2026-07-31

## Dependencies
- Requires: PROJ-1 (User Authentication) — User muss eingeloggt sein
- Requires: PROJ-2 (Fahrzeugprofil) — Kaufpreis gehört zum Fahrzeug
- Requires: PROJ-11 (Marktpreis-Analyse) — liefert den aktuellen Marktwert aus `market_analyses`
- Ergänzt: PROJ-5 (Fahrzeug-Timeline) — die Meilenstein-Kategorie `kauf` existiert bereits, bisher ohne Betrag
- Beeinflusst: PROJ-27 (Kostenanalyse) — Anschaffung wird dort getrennt von laufenden Kosten ausgewiesen

## Zusammenfassung
Der Kaufpreis ist der mit Abstand größte Betrag in der Fahrzeughistorie — und wird heute **nirgends erfasst**: `vehicles` hat kein Preisfeld, und die Meilenstein-Kategorie `kauf` speichert nur Datum und Text.

Dieses Feature schließt die Lücke und verbindet sie mit der bestehenden Marktpreis-Analyse zu einer **Wertentwicklung**: Kaufpreis, aufgelaufene Unterhaltskosten und aktueller Marktwert ergeben zusammen die Antwort auf die Frage, die sich jeder Sammler stellt — *"Was hat mich dieses Fahrzeug unterm Strich gekostet?"*

Das trifft den Kern der Produktvision („Wert der Fahrzeuge durch lückenlose Dokumentation sichern") und ist etwas, das ein Papier-Scheckheft grundsätzlich nicht kann.

**Abgrenzung:** Der Kaufpreis ist Kapital, kein laufender Aufwand. Er darf nicht in die monatliche Kostenkurve von PROJ-27 einfließen, sonst wird jede Zeitreihe unbrauchbar. Er wird immer getrennt ausgewiesen.

## User Stories
- Als Oldtimer-Besitzer möchte ich Kaufpreis und Kaufdatum meines Fahrzeugs hinterlegen, damit meine Kostenbilanz vollständig ist
- Als Oldtimer-Besitzer möchte ich sehen, wie sich Kaufpreis, aufgelaufene Kosten und aktueller Marktwert zueinander verhalten, damit ich den wirtschaftlichen Stand einschätze
- Als Oldtimer-Besitzer möchte ich Nebenkosten des Kaufs erfassen (Überführung, Zulassung, Gutachten beim Kauf), damit die Anschaffung realistisch abgebildet ist
- Als Sammler möchte ich erkennen, ob mein Fahrzeug im Wert gestiegen oder gefallen ist, damit ich Verkaufsentscheidungen fundiert treffe
- Als Oldtimer-Besitzer möchte ich den Kaufpreis vertraulich halten können, weil er nicht jeden angeht, der Zugriff auf mein Fahrzeug hat
- Als Verkäufer möchte ich meine dokumentierten Investitionen vorweisen können, damit ich meine Preisvorstellung begründen kann

## Acceptance Criteria
- [ ] Kaufpreis und Kaufdatum können am Fahrzeug hinterlegt werden
- [ ] Optionale Kauf-Nebenkosten können erfasst werden (Bezeichnung + Betrag), z. B. Überführung, Zulassung, Gutachten
- [ ] Beträge werden in Cent gespeichert, Eingabe in Euro
- [ ] Beide Angaben sind optional — das Fahrzeugprofil bleibt ohne sie voll funktionsfähig
- [ ] Ist ein Meilenstein der Kategorie `kauf` vorhanden, wird dessen Datum als Vorbelegung für das Kaufdatum vorgeschlagen
- [ ] Wertentwicklung stellt gegenüber: Kaufpreis, Kauf-Nebenkosten, aufgelaufene Unterhaltskosten (aus PROJ-27), aktueller Marktwert (aus PROJ-11)
- [ ] Die Differenz zwischen Marktwert und Kaufpreis wird als Wertveränderung ausgewiesen
- [ ] Die Gesamtbilanz (Marktwert minus Kaufpreis minus Nebenkosten minus Unterhaltskosten) wird ausgewiesen
- [ ] Die Darstellung macht kenntlich, dass der Marktwert eine **Schätzung** ist und kein realisierter Verkaufserlös
- [ ] Ohne vorliegende Marktpreis-Analyse wird nur die Kostenseite gezeigt, mit Verweis auf PROJ-11 — keine leere oder fehlerhafte Bilanz
- [ ] Ohne hinterlegten Kaufpreis wird die Wertentwicklung nicht angezeigt, sondern ein Hinweis zum Nachtragen
- [ ] Die Sichtbarkeit des Kaufpreises für eingeladene Mitglieder ist gesondert steuerbar (siehe Edge Cases)
- [ ] Zugriff folgt im Übrigen den Rollen aus PROJ-6
- [ ] Darstellung ist auf Mobile (375px), Tablet (768px) und Desktop (1440px) nutzbar

## Edge Cases
- **Kaufpreis unbekannt (Erbstück, Schenkung, Familienbesitz):** Bei Oldtimern häufig. Das Feld bleibt leer; die Wertentwicklung wird nicht angezeigt statt mit 0 € gerechnet — eine Bilanz mit Kaufpreis 0 wäre grob irreführend
- **Fahrzeug als Restaurierungsobjekt gekauft:** Sehr niedriger Kaufpreis, sehr hohe Folgekosten. Die Bilanz ist rechnerisch korrekt, aber die Darstellung sollte Anschaffung und Investition getrennt zeigen, statt nur eine große Negativzahl auszuweisen
- **Marktwert veraltet:** `market_analyses` kann Monate alt sein. Das Datum der zugrundeliegenden Analyse muss sichtbar sein, sonst wirkt eine alte Schätzung wie ein aktueller Wert
- **Mehrere Marktpreis-Analysen vorhanden:** Die jüngste wird verwendet; ältere bleiben unberührt
- **Marktwert liegt unter dem Kaufpreis:** Völlig normal, gerade in den ersten Jahren. Die Darstellung darf das nicht als Fehler oder Warnung inszenieren
- **Kaufdatum liegt nach erfassten Kosten:** Deutet auf einen Tippfehler oder auf Kosten aus der Zeit vor dem Kauf hin. Warnen und die betroffenen Einträge benennen, statt still zu rechnen
- **Sichtbarkeit bei geteilten Fahrzeugen (PROJ-6):** Der Kaufpreis ist die sensibelste Angabe im gesamten Produkt — deutlich heikler als die Wartungshistorie. Eine eingeladene Werkstatt hat kein berechtigtes Interesse daran. Standardmäßig nur für den Besitzer sichtbar
- **Fahrzeug-Transfer (PROJ-7):** Der Kaufpreis darf beim Besitzerwechsel **nicht** mit übergehen — er verrät dem Käufer, was der Vorbesitzer gezahlt hat, und würde jede Preisverhandlung unterlaufen. Beim Transfer ist er zu entfernen, nicht nur auszublenden
- **Öffentliches Kurzprofil (PROJ-10) und Verkaufsinserat (PROJ-12/13):** Kaufpreis und Wertentwicklung dürfen dort unter keinen Umständen erscheinen
- **Fahrzeug wird verkauft:** Ob der tatsächliche Verkaufserlös erfasst und die Bilanz damit abgeschlossen wird, ist eine offene Frage für `/architecture`

## Technische Anforderungen
- Beträge als Ganzzahl in Cent speichern (konsistent zu `service_entries.cost_cents`)
- Der Kaufpreis ist gegenüber allen anderen Feldern gesondert zu behandeln: Er darf nicht über bestehende Export-, Profil- oder Inseratspfade nach außen gelangen
- Marktwert wird aus `market_analyses` gelesen, nicht dupliziert
- Kauf-Nebenkosten sind von den laufenden Kosten aus PROJ-25/26 abzugrenzen, damit sie nicht doppelt zählen
- Responsive und in hellem wie dunklem Design lesbar

## Offene Entscheidungen
- **Speicherort:** Feld am Fahrzeug oder Erweiterung des `kauf`-Meilensteins — Entscheidung für `/architecture`. Der Meilenstein hat bereits das Datum, aber kein Betragsfeld
- **Premium oder Free?** Wertentwicklung ist ein plausibler Premium-Hebel für PROJ-8, ebenso wie PROJ-27. Produktentscheidung, hier nicht vorweggenommen
- **Verkaufserlös erfassen?** siehe Edge Cases

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Entscheidungen des Nutzers (2026-08-01)

| Frage | Entscheidung |
|---|---|
| Sichtbarkeit für Mitglieder | **Kein Schalter — ausschließlich der Besitzer.** Weicht bewusst vom Acceptance Criterion „gesondert steuerbar" ab |
| Premium oder frei? | **Erfassung frei, Wertentwicklung Premium** — wie bei PROJ-27 |
| Verkaufserlös erfassen? | **Jetzt nicht** — erst klären, was beim Fahrzeug-Transfer damit geschieht |

### A) Komponenten-Struktur

```
Fahrzeugprofil  (/vehicles/[id])
+-- Abschnitt "Anschaffung"          ← nur für den Besitzer sichtbar
|   +-- Kaufpreis und Kaufdatum, oder Hinweis zum Nachtragen
|   +-- Schaltfläche "Anschaffung erfassen"
|       +-- Erfassungsdialog
|           +-- Kaufpreis, Kaufdatum
|           +-- Liste der Nebenkosten (Bezeichnung + Betrag), beliebig viele
|           +-- Notiz
|
Kosten-Bereich  (/vehicles/[id]/kosten)
+-- Laufende Kosten · Einzelkosten · Auswertung
+-- [Wertentwicklung]  (/vehicles/[id]/kosten/wertentwicklung)   ← neuer Reiter
    +-- Premium-Sperre (falls kein Premium)
    +-- Ohne Kaufpreis: Hinweis mit Verweis auf die Erfassung
    +-- Bilanz-Übersicht
    |   +-- Anschaffung      (Kaufpreis + Nebenkosten)
    |   +-- Investition      (aufgelaufene Unterhaltskosten aus PROJ-27)
    |   +-- Marktwert        (Schätzung aus PROJ-11, mit Datum)
    |   +-- Wertveränderung  (Marktwert − Kaufpreis)
    |   +-- Gesamtbilanz     (Marktwert − Anschaffung − Investition)
    +-- Hinweisleiste
    |   +-- "Marktwert ist eine Schätzung, kein Verkaufserlös"
    |   +-- Alter der Marktpreis-Analyse
    |   +-- Warnung, falls Kosten vor dem Kaufdatum liegen
    +-- Ohne Marktpreis-Analyse: nur die Kostenseite, mit Verweis auf PROJ-11
```

### B) Datenmodell

**Eine neue Tabelle, nicht ein Feld am Fahrzeug** — die Begründung steht unter C1.

```
Anschaffung (je Fahrzeug höchstens eine):
- Fahrzeug
- Kaufpreis in Cent
- Kaufdatum
- Notiz (optional)
- angelegt am / geändert am / angelegt von

Kauf-Nebenkosten (beliebig viele je Anschaffung):
- Bezeichnung (z. B. Überführung, Zulassung, Gutachten)
- Betrag in Cent
```

Gelesen, aber **nicht** dupliziert:

| Quelle | Liefert |
|---|---|
| PROJ-11 `market_analyses` | jüngster Marktwert samt Datum der Analyse |
| PROJ-27 Auswertungslogik | aufgelaufene Unterhaltskosten über den gesamten Zeitraum |
| PROJ-5 `vehicle_milestones` | Datum eines vorhandenen `kauf`-Meilensteins als Vorbelegung |

### C) Technische Entscheidungen

**C1 — Eigene Tabelle statt Spalte am Fahrzeug. Das ist die wichtigste Entscheidung dieses Entwurfs.**

Der naheliegende Weg wäre ein Preisfeld an `vehicles`. Er ist nachweislich unsicher:

- Vier Stellen lesen das Fahrzeug mit **allen** Spalten
- Darunter die Fahrzeug-Layout-Seite, die für eingeladene Mitglieder ausdrücklich `vehicles(*, …)` lädt

Eine neue Spalte ginge damit bei **jedem Seitenaufruf an jede Werkstatt und jeden Betrachter** — auch wenn die Oberfläche sie nirgends anzeigt. Zeilenbasierte Zugriffsregeln können das nicht verhindern, sie wirken auf Zeilen, nicht auf Spalten.

Mit einer eigenen Tabelle ist der Kaufpreis **strukturell** unerreichbar: Keine bestehende Abfrage berührt sie, ihre Zugriffsregeln lassen nur den Besitzer zu, und öffentliche Pfade wie Kurzprofil und Inserat können sie gar nicht erst mitlesen — sie fragen ausdrücklich einzelne Spalten des Fahrzeugs ab. Das erfüllt die Anforderung „darf nicht über bestehende Export-, Profil- oder Inseratspfade nach außen gelangen" ohne eine einzige Änderung an bestehendem Code.

**C2 — Nebenkosten gehören nicht in die Einzelkosten aus PROJ-26.**
Verlockend, weil dort schon alles steht. Aber falsch: Einzelkosten fließen in die laufende Kostenkurve von PROJ-27 ein. Die Anschaffung ist Kapital, kein laufender Aufwand — sie dort einzutragen würde genau die Doppelzählung erzeugen, die dieses Feature ausdrücklich vermeiden soll, und jede Zeitreihe verzerren.

**C3 — Der Kaufpreis verlässt den Kostenbereich nicht.**
Er fließt in keine Zeitreihe, in keine Verteilung und in keine Summe von PROJ-27 ein. Die Wertentwicklung ist eine eigene Seite, die den Kaufpreis **neben** die dort berechneten Kosten stellt, statt ihn hineinzurechnen.

**C4 — Marktwert wird gelesen, nie kopiert.**
Verwendet wird die jüngste Analyse aus PROJ-11, zusammen mit ihrem Datum. Das Datum wird immer angezeigt: Eine drei Monate alte Schätzung darf nicht wie ein tagesaktueller Wert wirken. Gäbe es eine gespeicherte Kopie, würde sie beim nächsten Marktlauf veralten, ohne dass es jemand merkt.

**C5 — Ohne Kaufpreis keine Bilanz, ohne Marktwert nur die Kostenseite.**
Zwei getrennte Fälle mit zwei getrennten Antworten. Eine Bilanz mit Kaufpreis 0 € wäre grob irreführend — bei Erbstücken und Schenkungen der Normalfall. Fehlt nur der Marktwert, sind Anschaffung und Investition trotzdem aussagekräftig und werden gezeigt, mit Verweis auf die Marktpreis-Analyse.

**C6 — Anschaffung und Investition werden getrennt ausgewiesen, nie nur saldiert.**
Ein Restaurierungsobjekt für 3.000 € mit 40.000 € Aufwand ergibt saldiert eine große Negativzahl, die nichts erklärt. Erst die Trennung macht sichtbar, dass hier investiert und nicht verloren wurde.

**C7 — Ein Marktwert unter dem Kaufpreis ist kein Fehler.**
Er wird neutral dargestellt, ohne Warnfarbe und ohne Ausrufezeichen. In den ersten Jahren ist das der Normalfall.

**C8 — Kosten vor dem Kaufdatum werden gemeldet, nicht stillschweigend verrechnet.**
Liegen erfasste Kosten vor dem Kaufdatum, deutet das auf einen Tippfehler oder auf Aufwand aus der Zeit vor dem Kauf hin. Die Seite benennt Anzahl und frühestes Datum, statt zu raten. Die dafür nötige Information liefert die Auswertungslogik aus PROJ-27 bereits.

**C9 — Premium-Sperre nur auf der Auswertung.**
Erfassen kann jeder, die Bilanz sehen nur Premium-Nutzer — dasselbe Muster wie bei PROJ-27 und der Marktpreis-Analyse.

**C10 — Nur der Besitzer, ohne Schalter.**
Bewusste Abweichung vom Acceptance Criterion „gesondert steuerbar". Begründung: Der Kaufpreis ist laut Spec die sensibelste Angabe im Produkt, der gesamte Kostenbereich wurde gerade auf den Besitzer beschränkt, und ein Freigabeschalter wäre eine zusätzliche Stelle, an der etwas versehentlich offensteht. Wer den Kaufpreis zeigen möchte, kann ihn nennen — dafür braucht es keine Funktion.

### D) Abhängigkeiten

**Keine neuen Pakete.** Formular, Dialog, Tabelle, Premium-Prüfung und die Auswertungslogik aus PROJ-27 sind vorhanden.

### E) Was dieses Feature bewusst NICHT tut

- **Kein Verkaufserlös** — erst klären, was beim Fahrzeug-Transfer damit geschieht
- **Keine Wertprognose** — nur Ist-Vergleich, keine Hochrechnung künftiger Wertentwicklung
- **Keine Änderung an PROJ-27** — die Kostenanalyse bleibt, wie sie ist; der Kaufpreis erscheint dort nicht
- **Kein Export** — der Kaufpreis wird ausdrücklich aus allen Ausgabepfaden herausgehalten

### F) Offene Punkte für die Umsetzung

**F1 — Der Fahrzeug-Transfer braucht eine eigene Aufgabe (PROJ-30).**
Die Spec verlangt, dass der Kaufpreis beim Besitzerwechsel **entfernt** und nicht nur ausgeblendet wird — er würde dem Käufer sonst verraten, was der Vorbesitzer gezahlt hat. PROJ-28 kann das nicht leisten, die Änderung gehört in die Transfer-Logik von PROJ-7.

Diese Aufgabe fällt mit der bereits offenen Frage aus PROJ-27 zusammen: Auch die Kostenhistorie soll beim Transfer nicht mit übergehen. **Beides gehört in dieselbe Aufgabe**, samt Hinweis und Exportangebot vor dem Löschen — sonst verliert der Vorbesitzer seine eigenen Aufzeichnungen. Vorgeschlagene ID: **PROJ-30**.

Solange PROJ-30 offen ist, gilt: Ein übertragenes Fahrzeug nimmt den Kaufpreis des Vorbesitzers mit. Das sollte vor einer breiteren Nutzung des Transfers geschlossen sein.

**F2 — Das Acceptance Criterion „Sichtbarkeit gesondert steuerbar" wird nicht umgesetzt.**
Siehe C10. Empfehlung: Kriterium auf „nur für den Besitzer sichtbar" ändern.

**F3 — Prüfen, ob der Kosten-Bereich der richtige Ort ist.**
Die Wertentwicklung ist als vierter Reiter neben Laufende Kosten, Einzelkosten und Auswertung vorgesehen. Alternativ wäre das Fahrzeugprofil denkbar. Der Kostenbereich ist stimmiger, weil die Bilanz auf den dort berechneten Kosten aufbaut — und weil er bereits vollständig auf den Besitzer beschränkt ist.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
