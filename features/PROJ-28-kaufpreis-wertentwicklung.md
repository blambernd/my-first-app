# PROJ-28: Kaufpreis & Wertentwicklung

## Status: Approved
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

**F1 — Der Fahrzeug-Transfer braucht eine eigene Aufgabe.**
Die Spec verlangt, dass der Kaufpreis beim Besitzerwechsel **entfernt** und nicht nur ausgeblendet wird — er würde dem Käufer sonst verraten, was der Vorbesitzer gezahlt hat. PROJ-28 kann das nicht leisten, die Änderung gehört in die Transfer-Logik von PROJ-7.

Diese Aufgabe fällt mit der bereits offenen Frage aus PROJ-27 zusammen: Auch die Kostenhistorie soll beim Transfer nicht mit übergehen. **Beides gehört in dieselbe Aufgabe**, samt Hinweis und Exportangebot vor dem Löschen — sonst verliert der Vorbesitzer seine eigenen Aufzeichnungen. Vorgeschlagene ID: **PROJ-32** (PROJ-30 und PROJ-31 sind inzwischen anderweitig vergeben).

Solange diese Aufgabe offen ist, gilt: Ein übertragenes Fahrzeug nimmt den Kaufpreis des Vorbesitzers mit. Das sollte vor einer breiteren Nutzung des Transfers geschlossen sein.

**F2 — Das Acceptance Criterion „Sichtbarkeit gesondert steuerbar" wird nicht umgesetzt.**
Siehe C10. Empfehlung: Kriterium auf „nur für den Besitzer sichtbar" ändern.

**F3 — Prüfen, ob der Kosten-Bereich der richtige Ort ist.**
Die Wertentwicklung ist als vierter Reiter neben Laufende Kosten, Einzelkosten und Auswertung vorgesehen. Alternativ wäre das Fahrzeugprofil denkbar. Der Kostenbereich ist stimmiger, weil die Bilanz auf den dort berechneten Kosten aufbaut — und weil er bereits vollständig auf den Besitzer beschränkt ist.

## Implementierung (Frontend)

**Stand:** 2026-08-01 · Oberfläche, Rechenlogik und Schema stehen

### Gebaute Dateien

| Datei | Zweck |
|---|---|
| `supabase/migrations/20260801_create_vehicle_purchases.sql` | Zwei neue Tabellen samt Zugriffsregeln |
| `src/lib/validations/vehicle-purchase.ts` | Schema, Typen, Normalisierung |
| `src/lib/value-development.ts` | Bilanzlogik als reine Funktionen |
| `src/lib/value-development.test.ts` | 23 Unit-Tests |
| `src/components/vehicle-purchase-form.tsx` | Erfassungsdialog mit dynamischer Nebenkosten-Liste |
| `src/components/vehicle-purchase-section.tsx` | Abschnitt „Anschaffung" im Fahrzeugprofil |
| `src/components/value-development-view.tsx` | Bilanz-Ansicht |
| `src/app/vehicles/[id]/kosten/wertentwicklung/page.tsx` | Besitzerprüfung, Premium-Sperre, Datenzusammenführung |
| `src/components/cost-area-nav.tsx` | vierter Reiter |
| `src/app/vehicles/[id]/page.tsx` | Abschnitt eingebunden, nur für den Besitzer geladen |

### Umgesetzte Entscheidungen

- **Zwei eigene Tabellen** statt einer Spalte an `vehicles` (C1) — der Kaufpreis ist damit strukturell unerreichbar, ohne dass eine einzige bestehende Abfrage geändert wurde
- **Zusammengesetzter Fremdschlüssel** auf den Nebenkosten: Er erzwingt, dass Nebenkosten und Anschaffung zum selben Fahrzeug gehören. Das ist genau die Lücke, die in PROJ-26 als BUG-1 aufgefallen war — hier von Anfang an geschlossen
- **Nebenkosten nicht als Einzelkosten** (C2) — sonst flössen sie in die Kostenkurve von PROJ-27 ein
- **Marktwert wird gelesen, nie kopiert** (C4), mit Datum und Hinweis ab 90 Tagen Alter
- **Median statt Durchschnitt** als Marktwert: Bei kleinen Stichproben — und Oldtimer-Inserate sind immer eine kleine Stichprobe — verschiebt ein einzelnes überteuertes Angebot den Durchschnitt spürbar, den Median kaum. Welcher Wert verwendet wurde, steht in der Karte
- **Ohne Kaufpreis keine Bilanz** (C5) — die Kostenquellen werden dann gar nicht erst geladen
- **Anschaffung und Investition immer getrennt** (C6), auch in der Kennzahlen-Reihe
- **Wertverlust ohne Warnfarbe** (C7)
- **Kosten vor dem Kaufdatum** werden mit frühestem Monat benannt (C8)
- **Premium nur auf der Auswertung** (C9), Erfassung frei
- **Nur der Besitzer**, ohne Schalter (C10) — auf der Seite, im Profil und in den Zugriffsregeln

### Abweichung vom üblichen Ablauf

**Die Migration wurde bereits hier angewendet, nicht erst in `/backend`.** Ohne die Tabellen wäre von der Oberfläche nichts prüfbar gewesen — und genau in der Sichtprüfung sind in diesem Zyklus die echten Fehler aufgetaucht, die weder `tsc` noch der Build sehen. Die Migration legt ausschließlich neue Tabellen an und kann Bestehendes nicht beeinträchtigen.

**Offen für `/backend`:** die Zugriffsprüfung mit Gegenprobe (Werkstatt und Betrachter gegen Besitzer), die Security-Advisors und die Index-Kontrolle.

### Geprüft

| Prüfung | Ergebnis |
|---|---|
| Unit-Tests `value-development` | **23/23 grün** |
| Unit gesamt | 503 grün, 4 vorbestehende Fehlschläge |
| `npm run build` | erfolgreich, Route im Manifest |
| `npx eslint` auf allen PROJ-28-Dateien | keine Meldung |
| Sichtprüfung **im Produktionsbuild**, 1280 px und 375 px | Profilabschnitt, Bilanz und Mobilansicht korrekt |
| Konsolenfehler | **0** |

**Rechenprobe gegen die Oberfläche:** Kaufpreis 20.000 € + Nebenkosten 620 € = Anschaffung **20.620 €**; Investition **450 €**; aufgewendet **21.070 €**; Marktwert **24.450 €** (Median); Wertveränderung **+ 4.450 €** gegenüber dem Kaufpreis; Gesamtbilanz **+ 3.380 €**. Die Warnung wegen Kosten vor dem Kaufdatum erschien mit dem richtigen Monat.

Beim Aufräumen bestätigte sich zudem das Löschverhalten: Das Entfernen der Anschaffung nahm die Nebenkosten mit, ohne dass sie einzeln gelöscht werden mussten.

**Zur Einordnung einer Beobachtung:** Beim ersten Aufruf über den Entwicklungsserver erschien eine Hydration-Warnung. Sie ließ sich weder erneut auslösen noch im Produktionsbuild nachweisen — dort sind es 0 Konsolenfehler. Es handelt sich um ein Artefakt des ersten Kompilats, nicht um einen Fehler der Seite.

### Offene Punkte

- **AC „Sichtbarkeit gesondert steuerbar"** wird bewusst nicht umgesetzt (C10). Empfehlung: Kriterium auf „nur für den Besitzer sichtbar" ändern
- **Transfer-Aufgabe** (Vorschlag PROJ-32): Kaufpreis und Kostenhistorie dürfen beim Besitzerwechsel nicht mit übergehen. Noch nicht umgesetzt

## Implementierung (Backend)

**Stand:** 2026-08-01 · Keine API-Route — das Feature schreibt wie im Projekt üblich direkt über die Zugriffsregeln

### Schema

| Prüfung | Ergebnis |
|---|---|
| Tabellen | `vehicle_purchases`, `vehicle_purchase_costs` |
| Row Level Security | auf beiden aktiv |
| Regeln | **8**, ausnahmslos auf `besitzer` |
| Indexe | 5 (Primärschlüssel, Eindeutigkeit je Fahrzeug, Eindeutigkeit für den Fremdschlüssel, Nebenkosten) |
| Trigger | 1 (`updated_at`) |
| Fremdschlüssel der Nebenkosten | `(purchase_id, vehicle_id) → vehicle_purchases (id, vehicle_id) ON DELETE CASCADE` |

### Zugriffsprüfung — jede Rolle mit Gegenprobe

| Rolle / Angriff | Ergebnis |
|---|---|
| Werkstatt: Anschaffung / Nebenkosten sehen | **0 / 0** |
| Werkstatt: anlegen | **blockiert** (`42501`) |
| Werkstatt: ändern / löschen | **0 / 0 Zeilen** |
| Völlig fremder Nutzer: sehen | **0 / 0** |
| **Anonym** (die Rolle hinter öffentlichen Aufrufen): sehen | **0 / 0** |
| **Anonym: anlegen** | **blockiert** (`42501`) |
| **Gegenprobe Besitzer: sehen / sehen / ändern** | **1 / 1 / 1** |

### Datenintegrität — ebenfalls mit Gegenprobe

| Prüfung | Ergebnis |
|---|---|
| Nebenkosten nennen ein **anderes** Fahrzeug als ihre Anschaffung | **blockiert** (`23503`) |
| **Gegenprobe:** passendes Fahrzeug | erlaubt |
| Zweite Anschaffung am selben Fahrzeug | **blockiert** (`23505`) |
| Anschaffung löschen | Nebenkosten verschwinden mit (Kaskade) |
| Negativer Kaufpreis | **blockiert** (`23514`) |

Der zusammengesetzte Fremdschlüssel ist damit belegt: Genau die Lücke, die in PROJ-26 als BUG-1 auffiel und dort nachträglich geschlossen werden musste, ist hier von Anfang an dicht.

### Der Kaufpreis kann nirgends nach außen gelangen

Das ist die eigentliche Anforderung dieses Features, geprüft auf zwei Wegen:

**Statisch** — nur **vier** Dateien fragen die Tabellen überhaupt ab, alle besitzergebunden:

| Datei | Absicherung |
|---|---|
| `kosten/wertentwicklung/page.tsx` | `notFound()`, wenn nicht Besitzer |
| `vehicles/[id]/page.tsx` | Abfrage liegt innerhalb von `if (isOwner)` |
| `vehicle-purchase-form.tsx`, `vehicle-purchase-section.tsx` | werden nur für den Besitzer gerendert |

Kein öffentlicher Pfad — weder Kurzprofil noch Inserat — nennt `price_cents` oder `purchased_on`. Sie fragen ausdrücklich einzelne Fahrzeugspalten ab und berühren die neuen Tabellen gar nicht.

**Dynamisch** — die Rolle `anon` sieht 0 Zeilen und darf nicht schreiben, bei nachweislich vorhandenen Daten (Gegenprobe Besitzer: 1/1).

Damit greift der Schutz zweifach: Selbst wenn eine künftige Abfrage versehentlich an einer öffentlichen Stelle landete, gäbe die Datenbank nichts heraus. Das ist der Gewinn aus der Entscheidung für eigene Tabellen (C1) — bei einer Spalte an `vehicles` wäre nur die erste Ebene vorhanden gewesen.

### Weitere Prüfungen

| Prüfung | Ergebnis |
|---|---|
| Abfrage der Anschaffung (`EXPLAIN ANALYZE`, Rolle `authenticated`) | Index Scan, **0,086 ms** |
| Supabase-Security-Advisors | **keine Meldung** zu den neuen Tabellen |
| Bestand nach allen Prüfungen | beide Tabellen 0 Zeilen, alle Testtransaktionen zurückgerollt |

### Keine API-Route

Wie bei PROJ-24 bis PROJ-27: Gelesen wird in Server Components, geschrieben direkt aus der Oberfläche über die Zugriffsregeln. Eine Route brächte hier keinen zusätzlichen Schutz — die Regeln in der Datenbank greifen unabhängig vom Weg, wie die Prüfung mit `anon` und Werkstatt zeigt.

## QA Test Results

**Getestet:** 2026-08-01 · **Ergebnis: nicht produktionsreif** — ein Befund der Stufe Hoch

### BUG-1 (Hoch): Der Erfassungsdialog stürzt beim Öffnen ab

*Schritte:* Fahrzeugprofil öffnen → „Anschaffung erfassen" anklicken.

*Erwartet:* Der Dialog öffnet sich.
*Tatsächlich:* Laufzeitfehler, der Dialog erscheint nicht:

```
useFormField should be used within <FormField>
src/components/ui/form.tsx (48:11) @ useFormField
  → FormLabel → VehiclePurchaseForm → VehiclePurchaseSection → VehicleDetailPage
```

*Ursache:* In `vehicle-purchase-form.tsx` Zeile 263 wird `FormLabel` als **Abschnitts­überschrift** für die Nebenkosten verwendet — außerhalb jedes `FormField`. `FormLabel` ruft intern `useFormField()` auf und wirft ohne den zugehörigen Kontext. Die drei übrigen `FormLabel` im Formular liegen korrekt innerhalb ihrer Felder; es ist genau diese eine Stelle.

*Empfehlung:* Die Überschrift durch ein einfaches Textelement ersetzen — sie beschriftet kein Eingabefeld, sondern einen Abschnitt.

*Warum Hoch:* Der Dialog ist der **einzige** Weg, eine Anschaffung zu erfassen. Ohne ihn kann kein Nutzer das Feature in Betrieb nehmen. Die Anzeigeseite funktioniert mit vorhandenen Daten nachweislich korrekt — aber es gibt keinen Weg, an diese Daten zu kommen.

**Zur Herkunft des Fehlers, offen gesagt:** Die Sichtprüfung während `/frontend` hat Profilabschnitt und Bilanzseite geprüft, den Dialog aber **nie geöffnet**. Die Daten waren dort per SQL angelegt. Genau deshalb blieb der Fehler stehen — die Verifikation deckte die Anzeige ab, nicht die Eingabe. Weder `tsc` noch `npm run build` sehen so etwas; erst der E2E-Test durch die echte Oberfläche hat ihn gefunden.

### Testläufe

| Ebene | Ergebnis |
|---|---|
| E2E unangemeldet | **10/10 grün** (5 Tests × Chromium + Mobile Safari) |
| E2E angemeldet | 4 grün, dann **Abbruch an BUG-1** — die Folgetests setzen eine erfasste Anschaffung voraus |
| Unit `value-development` | **23/23 grün** |
| Unit gesamt | 503 grün, 4 vorbestehende Fehlschläge |
| Regression PROJ-24 / 25 / 26 / 27 | **80/81** — der eine Fehlschlag lief im Sammellauf auf, isoliert ist PROJ-27 **21/21 grün**. Kein Zusammenhang mit PROJ-28 |

### Acceptance Criteria

| # | Kriterium | Ergebnis |
|---|---|---|
| 1 | Kaufpreis und Kaufdatum hinterlegen | ❌ **BUG-1** — Dialog nicht bedienbar |
| 2 | Kauf-Nebenkosten erfassen | ❌ BUG-1 |
| 3 | Beträge in Cent, Eingabe in Euro | ⚠️ in Unit-Tests und mit angelegten Daten belegt, über das Formular nicht prüfbar |
| 4 | Beide Angaben optional, Profil bleibt funktionsfähig | ✅ E2E |
| 5 | Kauf-Meilenstein als Vorbelegung | ❌ BUG-1 |
| 6 | Bilanz stellt vier Größen gegenüber | ⚠️ mit angelegten Daten geprüft (siehe Frontend-Abschnitt), nicht per E2E |
| 7 | Wertveränderung gegen den Kaufpreis | ⚠️ dito, zusätzlich 23 Unit-Tests |
| 8 | Gesamtbilanz | ⚠️ dito |
| 9 | Marktwert als Schätzung kenntlich | ⚠️ dito |
| 10 | Ohne Marktpreis-Analyse nur die Kostenseite | ❌ BUG-1 — E2E kam nicht so weit |
| 11 | Ohne Kaufpreis Hinweis statt Bilanz | ✅ **E2E**, inklusive Gegenprobe, dass keine Bilanz erscheint |
| 12 | Sichtbarkeit gesondert steuerbar | ⛔ **bewusst nicht umgesetzt** (Tech Design C10) |
| 13 | Zugriff nach Rollen | ✅ siehe Sicherheitsaudit |
| 14 | Drei Bildschirmbreiten | ⚠️ mit angelegten Daten geprüft, per E2E blockiert |

**Nur 2 von 14 vollständig per E2E belegt** — nicht weil das Feature schlecht wäre, sondern weil BUG-1 den Testpfad an der zweiten Station blockiert. Sobald der Dialog öffnet, laufen die übrigen Tests durch; sie sind bereits geschrieben und liegen in `tests/PROJ-28-wertentwicklung-auth.spec.ts`.

### Sicherheitsaudit

Die Prüfungen aus dem Backend-Abschnitt bleiben gültig — an Schema und Zugriffsregeln hat sich nichts geändert. Ergänzend aus QA-Sicht:

| Prüfung | Ergebnis |
|---|---|
| Unangemeldet: „Kaufpreis", „Anschaffung", „Gesamtbilanz" im HTML | **nicht enthalten** |
| Unangemeldet: Fahrzeugprofil | **nicht enthalten** |
| Angemeldet: Kaufpreis in fremden Seitenantworten (Scheckheft, Dokumente, Tankbuch, Kosten, Einzelkosten, Auswertung, Dashboard) | E2E geschrieben, wegen BUG-1 noch nicht gelaufen |
| Werkstatt / fremder Nutzer / anonym gegen Besitzer | **0/0/0 gegen 1/1** (Backend-Durchgang, mit Gegenprobe) |

### Beobachtung ohne Befundcharakter

Im Sammellauf über vier Suiten fiel ein PROJ-27-Test aus, der isoliert grün ist. Alle Suiten teilen sich dasselbe Wegwerf-Fahrzeug; bei langen Läufen entstehen Zeitfenster, in denen eine Liste kurz anders aussieht als erwartet. Kein Produktfehler, aber die Testbasis ist an dieser Stelle empfindlich.

### Empfehlung

**Nicht produktionsreif.** BUG-1 muss vor allem Weiteren behoben werden — es ist eine Zeile, blockiert aber den gesamten Testpfad und die Nutzung des Features. Danach `/qa` erneut; die Tests liegen bereit.


---

## Fehlerbehebung BUG-1 (2026-08-01)

Die Abschnittsüberschrift der Nebenkosten ist kein `FormLabel` mehr. Sie beschriftet eine **Gruppe** von Feldern, nicht ein einzelnes — deshalb jetzt ein Gruppentitel mit `role="group"` und `aria-labelledby`. Das ist zugleich semantisch richtiger als vorher: `FormLabel` hätte auch dann auf kein sinnvolles Feld gezeigt, wenn es nicht abgestürzt wäre.

Ein Kommentar an der Stelle nennt den Grund, damit die Zeile nicht versehentlich zurückgedreht wird. **Kontrolliert:** Die drei verbleibenden `FormLabel` im Formular liegen jeweils innerhalb ihres `FormField`.

### Geprüft — diesmal mit geöffnetem Dialog

| Prüfung | Ergebnis |
|---|---|
| E2E angemeldet | **17/17 grün** |
| Dialog öffnet und speichert | ✅ |
| Bilanz gegen Handrechnung | Anschaffung **19.000,00 €**, Investition **80,00 €**, aufgewendet **19.080,00 €** |
| Kaufpreis in fremden Seitenantworten | **nirgends** — sieben Seiten geprüft |
| Kaufpreis in der Kostenanalyse | **fließt nicht ein** — dort stehen nur die 80,00 € Unterhalt |
| Bearbeiten und Entfernen | ✅ inklusive Entfernen einer Nebenkosten-Position |
| Drei Bildschirmbreiten | ✅ kein waagerechter Überlauf |
| `tsc`, `eslint`, `npm run build` | sauber |
| Wegwerf-Fahrzeug danach | alle Tabellen 0 Zeilen |

Zwei weitere Fehlschläge im Lauf waren Testfehler und wurden dort behoben: „500,00 €" steckt als Teilzeichenkette in „18.500,00 €" und traf zwei Elemente; und der Sicherheitstest ruft sieben Seiten in einem Test auf, wofür die voreingestellten 30 Sekunden nicht reichen.

## Deployment
_To be added by /deploy_

---

## QA Test Results — zweiter Durchgang (2026-08-01)

**Ergebnis: produktionsreif.** BUG-1 behoben und nachgeprüft, keine neuen Befunde.

### Testläufe

| Ebene | Ergebnis |
|---|---|
| E2E unangemeldet | **10/10 grün** |
| E2E angemeldet | **19/19 grün** (17 aus Durchgang 1, 2 neu) |
| Unit `value-development` | **23/23 grün** |
| Unit gesamt | 503 grün, 4 vorbestehende Fehlschläge |
| Regression PROJ-24 / 25 / 26 / 27 | **95/95 grün** — die Auffälligkeit aus Durchgang 1 trat nicht wieder auf |
| Wegwerf-Fahrzeug danach | alle beteiligten Tabellen 0 Zeilen |

### Neu in diesem Durchgang

**Angriffsfläche, die es in PROJ-27 nicht gab.** Anders als die Kostenanalyse rendert dieses Feature **Nutzereingaben** — die Bezeichnung der Nebenkosten und die Notiz. Dafür wurde ein eigener Test ergänzt: Eine Eingabe mit `<img src=x onerror=...>` erscheint unverändert als Text, es entsteht kein Bild-Element und nichts wird ausgeführt.

**Kaufdatum in der Zukunft** ist im Kalender gesperrt.

### Ergänzend geprüft, was kein E2E abdecken kann

Diese Pfade brauchen eine Marktpreis-Analyse bzw. einen Meilenstein und sind über die Oberfläche allein nicht herstellbar. Geprüft mit angelegten Daten:

| Prüfung | Ergebnis |
|---|---|
| Marktwert aus der **jüngsten** Analyse | 24.450,00 € — die ältere, teurere (99.999) wird ignoriert |
| Median statt Durchschnitt, kenntlich gemacht | „Median der Vergleichsangebote" |
| Wertveränderung gegen den Kaufpreis | **+ 4.450,00 €** |
| Gesamtbilanz | **+ 3.950,00 €** |
| Schätzhinweis und Analysedatum | vorhanden |
| Hinweis bei Analyse älter als 90 Tage | erscheint |
| **Meilenstein-Vorbelegung** (AC 5) | Kauf-Meilenstein vom 07.03.2019 → Formular zeigt **07.03.2019** |
| Konsolenfehler | **0** |

**Zur Ehrlichkeit:** Meine erwartete Gesamtbilanz lag bei 3.830 € — falsch, weil ich mit den Nebenkosten eines früheren Szenarios gerechnet hatte. Die Nachrechnung ergibt 3.950 €, und genau das zeigt die Seite. Der Fehler lag bei der Erwartung, nicht beim Produkt.

### Acceptance Criteria

| # | Kriterium | Ergebnis |
|---|---|---|
| 1 | Kaufpreis und Kaufdatum hinterlegen | ✅ E2E |
| 2 | Kauf-Nebenkosten erfassen | ✅ E2E |
| 3 | Beträge in Cent, Eingabe in Euro | ✅ auf den Cent genau durch die Oberfläche |
| 4 | Beide Angaben optional | ✅ E2E |
| 5 | Kauf-Meilenstein als Vorbelegung | ✅ mit angelegtem Meilenstein |
| 6 | Bilanz stellt vier Größen gegenüber | ✅ |
| 7 | Wertveränderung gegen den Kaufpreis | ✅ |
| 8 | Gesamtbilanz | ✅ |
| 9 | Marktwert als Schätzung kenntlich | ✅ samt Analysedatum und Altershinweis |
| 10 | Ohne Analyse nur die Kostenseite | ✅ E2E, mit Gegenprobe |
| 11 | Ohne Kaufpreis Hinweis statt Bilanz | ✅ E2E, mit Gegenprobe |
| 12 | Sichtbarkeit gesondert steuerbar | ⛔ **bewusst nicht umgesetzt** (Tech Design C10) |
| 13 | Zugriff nach Rollen | ✅ |
| 14 | Mobile, Tablet, Desktop | ✅ je mit Daten geprüft |

**13 von 14 erfüllt**, das 14. bewusst abgewählt.

### Sicherheitsaudit

| Prüfung | Ergebnis |
|---|---|
| Werkstatt / fremder Nutzer / anonym gegen Besitzer | **0/0/0 gegen 1/1** |
| Kaufpreis in sieben fremden Seitenantworten | **nirgends enthalten** |
| Unangemeldet: „Kaufpreis", „Anschaffung", „Gesamtbilanz" im HTML | nicht enthalten |
| XSS über Bezeichnung und Notiz | als Text dargestellt, nichts ausgeführt |
| Kaufpreis in der Kostenanalyse | fließt nicht ein |
| Supabase-Security-Advisors | keine Meldung zu den neuen Tabellen |

### Grenzen dieses Testlaufs

- **Firefox** ist im Projekt nicht konfiguriert; geprüft wurden Chromium und Mobile Safari (nur unangemeldet)
- Der Sicherheitstest über sieben Seiten fiel in einem von drei Läufen in eine Zeitgrenze und lief in den anderen beiden durch. Kein Produktverhalten, aber der Test ist der langsamste der Suite
- Marktwert-Pfad und Meilenstein-Vorbelegung sind nicht Teil der dauerhaften E2E-Suite, weil sie Daten voraussetzen, die über die Oberfläche allein nicht entstehen

### Empfehlung

**Produktionsreif.** Keine offenen Befunde der Stufen Kritisch, Hoch oder Mittel.
