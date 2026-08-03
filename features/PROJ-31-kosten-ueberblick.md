# PROJ-31: Kosten-Überblicksseite

## Status: In Progress
**Created:** 2026-08-01
**Last Updated:** 2026-08-01

## Kontext

Der Kostenbereich besteht inzwischen aus vier Unterbereichen (Laufende Kosten,
Einzelkosten, Auswertung, Wertentwicklung), hat aber keinen eigenen Einstieg:
Der Aufruf von „Kosten" landet unmittelbar auf „Laufende Kosten". Damit ist weder
erkennbar, dass es weitere Unterbereiche gibt, noch bekommt der Nutzer eine Antwort
auf die naheliegendste Frage — was kostet mich dieses Fahrzeug?

Diese Spec ergänzt eine Einstiegsseite, die diese Frage in wenigen Kennzahlen
beantwortet und von dort in die Detailbereiche verzweigt.

## Dependencies
- Requires: PROJ-30 (Fahrzeug-Navigation) — die Navigation muss den Überblick als
  eigenen Einstieg abbilden können, getrennt von „Laufende Kosten"
- Requires: PROJ-24 (Tankbuch) — Kraftstoffkosten als Datenquelle
- Requires: PROJ-25 (Wiederkehrende Kosten) — laufende Kosten als Datenquelle
- Requires: PROJ-26 (Einzelkosten) — Einzelkosten als Datenquelle
- Requires: PROJ-27 (Kostenanalyse) — die Berechnungslogik wird wiederverwendet,
  nicht neu erfunden
- Optional: PROJ-28 (Kaufpreis & Wertentwicklung) — Anschaffungskosten, sofern erfasst

## User Stories

- Als Fahrzeugbesitzer möchte ich beim Öffnen des Kostenbereichs sofort sehen, was
  mich das Fahrzeug im letzten Jahr gekostet hat, ohne mich durch Unterbereiche zu klicken.
- Als Fahrzeugbesitzer möchte ich erkennen, wie sich die Kosten grob aufteilen,
  damit ich weiß, wo sich ein genauerer Blick lohnt.
- Als Fahrzeugbesitzer möchte ich vom Überblick aus direkt in den passenden
  Detailbereich springen.
- Als neuer Nutzer ohne erfasste Kosten möchte ich verstehen, was ich eintragen muss,
  damit die Auswertung etwas anzeigt.
- Als Fahrzeugbesitzer möchte ich erkennen können, wenn eine Kennzahl auf lückenhaften
  Daten beruht, damit ich sie nicht überbewerte.

## Acceptance Criteria

### Einstieg und Navigation
- [ ] Der Aufruf des Kostenbereichs zeigt die Überblicksseite, nicht mehr direkt
      „Laufende Kosten".
- [ ] „Laufende Kosten" bleibt als eigener Unterbereich vollständig erhalten und
      ist über die Navigation erreichbar.
- [ ] Bestehende Links und Lesezeichen auf die bisherigen Kosten-Unterseiten
      funktionieren unverändert.
- [ ] Von jeder Kennzahlengruppe führt ein sichtbarer Weg in den zugehörigen
      Detailbereich.

### Kennzahlen
- [ ] Die Seite zeigt die Gesamtkosten der letzten zwölf Monate.
- [ ] Die Seite zeigt die durchschnittlichen Kosten pro Monat im selben Zeitraum.
- [ ] Die Seite zeigt die Kosten pro Kilometer, sofern die Laufleistung dies zulässt.
- [ ] Die Seite zeigt eine Aufteilung der Kosten nach Quelle (Kraftstoff, Wartung,
      laufende Kosten, Einzelkosten).
- [ ] Alle Kennzahlen beziehen sich auf denselben, klar benannten Zeitraum.
- [ ] Die Zahlen stimmen mit denen des Auswertungsbereichs für denselben Zeitraum
      überein — es wird dieselbe Berechnungsgrundlage verwendet.
- [ ] Beträge erscheinen in deutscher Formatierung mit Euro-Angabe.

### Datenlage
- [ ] Sind für den Zeitraum keinerlei Kosten erfasst, erscheint statt Kennzahlen ein
      erklärender Hinweis mit direkten Wegen zum Erfassen.
- [ ] Beruht eine Kennzahl auf unvollständigen Daten, wird sie als eingeschränkt
      belastbar gekennzeichnet statt kommentarlos ausgegeben.
- [ ] Fehlt die Laufleistung, entfällt die Kennzahl „Kosten pro Kilometer" mit
      kurzer Begründung, statt null oder einen irreführenden Wert zu zeigen.

### Zugriff
- [ ] Die Überblicksseite ist wie der gesamte Kostenbereich ausschließlich dem
      Besitzer zugänglich.

### Darstellung
- [ ] Die Seite ist auf 375 px, 768 px und 1440 px vollständig nutzbar.
- [ ] Während des Ladens erscheinen Platzhalter, keine springenden Zahlen.

## Edge Cases

- **Fahrzeug jünger als zwölf Monate:** Der Zeitraum muss auf die tatsächliche
  Datenlage eingegrenzt und als solcher benannt werden — eine Hochrechnung auf zwölf
  Monate wäre irreführend.
- **Nur eine einzige Kostenart erfasst:** Die Aufteilung darf nicht als
  aussagekräftige Verteilung erscheinen, wenn sie zu 100 % aus einer Quelle besteht.
- **Kosten außerhalb des Zeitraums:** Ein Fahrzeug mit Einträgen ausschließlich vor
  über zwölf Monaten darf nicht wie ein Fahrzeug ohne Daten aussehen.
- **Nur ein Kilometerstand bekannt:** Ohne zwei Messpunkte lässt sich keine Fahrleistung
  bestimmen — die Kennzahl entfällt.
- **Rückläufiger Kilometerstand:** Widersprüchliche Stände (Tachotausch, Tippfehler)
  dürfen nicht zu negativen Kosten pro Kilometer führen.
- **Sehr hohe Einzelkosten:** Eine einmalige Restaurierung darf den Monatsdurchschnitt
  nicht unkommentiert verzerren.
- **Anschaffungskosten:** Der Kaufpreis ist keine laufende Kostenposition und darf die
  Kennzahlen nicht auffüllen; ob er separat erscheint, entscheidet die Architektur.

## Technical Requirements (optional)
- Die vorhandene Berechnungslogik der Kostenanalyse wird wiederverwendet; es entsteht
  keine zweite, abweichende Rechenquelle.
- Kein neues Datenbankschema; die Seite liest ausschließlich vorhandene Daten.
- Zugriffsschutz serverseitig, konsistent mit den übrigen Kosten-Unterseiten.

## Offene Punkte für /architecture
- Ob die Kennzahlen serverseitig vorberechnet oder wie bisher im Browser aus den
  Rohdaten aggregiert werden.
- Ob der bisherige Pfad des Kostenbereichs auf den Überblick zeigt und „Laufende
  Kosten" einen eigenen Unterpfad bekommt, oder umgekehrt — hat Folgen für bestehende Links.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Erstellt:** 2026-08-03

### A) Aufbau der Oberfläche

```
Kosten (Einstieg)                    ← neu, ersetzt den bisherigen Einstieg
│
├── Zeitraum-Angabe
│   „Letzte 12 Monate (August 2025 – August 2026)"
│   oder verkürzt, wenn das Fahrzeug jünger ist
│
├── Kennzahlen (vier Felder)
│   ├── Gesamtkosten im Zeitraum
│   ├── Durchschnitt je Monat
│   ├── Kosten je Kilometer      ← entfällt ohne Fahrleistung
│   └── Gefahrene Kilometer
│
├── Aufteilung nach Quelle
│   Kraftstoff · Wartung & Reparatur · Laufende Kosten · Einzelkosten
│   je mit Betrag, Anteil und Weg in den Detailbereich
│
├── Hinweisfeld (nur wenn nötig)
│   „Beruht auf lückenhaften Daten" — mit Angabe, woran es liegt
│
└── Leerer Zustand (statt Kennzahlen)
    Erklärung, was zu erfassen ist, mit Wegen ins Tankbuch,
    zu Laufenden Kosten und Einzelkosten
```

Die Seite **rechnet nichts Eigenes**. Sie stellt dieselben Zahlen dar, die der Auswertungsbereich für denselben Zeitraum liefert.

### B) Welche Angaben gebraucht werden

**Keine neue Datenbanktabelle, keine neue Spalte.** Die Seite liest ausschließlich, was Tankbuch, Scheckheft, laufende Kosten und Einzelkosten ohnehin schon enthalten.

Gebraucht werden pro Fahrzeug:
- die Kostenzeilen der vier Quellen im gewählten Zeitraum
- die Kilometerstände aus Tankbuch und Scheckheft, um die Fahrleistung zu bestimmen
- die Angabe, welche Kostenarten gar nicht erfasst sind — daraus entsteht der Belastbarkeitshinweis

**Der Kaufpreis bleibt außen vor.** Er ist Kapital, kein laufender Aufwand; flösse er ein, wären Monatsdurchschnitt und Kosten je Kilometer unbrauchbar. Er hat seit dem 2026-08-03 seinen Platz unter *Wertentwicklung*, und dorthin führt vom Überblick ein Weg.

### C) Technische Entscheidungen

**1. Die Zahlen entstehen auf dem Server — offener Punkt aus der Spec**

Wie bei Auswertung und Wertentwicklung. Drei Gründe:

- Die Spec verlangt „Platzhalter, keine springenden Zahlen". Serverseitig gerechnet gibt es **gar kein Nachladen** — die Seite kommt fertig an. Das ist besser als ein guter Platzhalter.
- Die Rechnung ist billig: In PROJ-27 gemessen **3,8 ms** für 868 Datensätze. Sie in den Browser zu verlagern spart nichts und verlangte, sämtliche Rohdaten dorthin zu schicken.
- Der Kostenbereich ist auf den Besitzer beschränkt. Was der Server nicht ausliefert, kann auch nicht abgegriffen werden.

**2. Ein neuer Zeitraum, keine neue Rechenmaschine**

Die vorhandene Auswertung kennt heute *laufendes Jahr*, *Vorjahr* und *Gesamtzeitraum*. Die Spec verlangt **die letzten zwölf Monate** — ein rollierendes Fenster, das es noch nicht gibt.

Die Rechenlogik nimmt einen Zeitraum bereits als Eingabe entgegen; es kommt also nur ein weiterer Zeitraum hinzu, keine zweite Berechnung. Beginnt die Datenlage später, wird das Fenster entsprechend verkürzt und **so benannt** — eine Hochrechnung auf zwölf Monate wäre eine erfundene Zahl.

**3. Der Kostenbereich zeigt künftig den Überblick — offener Punkt aus der Spec**

Heute liegt „Laufende Kosten" auf dem Pfad des Kostenbereichs selbst. Künftig:

| | heute | künftig |
|---|---|---|
| Kostenbereich | Laufende Kosten | **Überblick** |
| Laufende Kosten | — | eigener Unterpfad |
| Einzelkosten, Auswertung, Wertentwicklung | unverändert | unverändert |

Die Spec verlangt das ausdrücklich („Der Aufruf des Kostenbereichs zeigt die Überblicksseite"). Die drei übrigen Unterseiten behalten ihre Adressen, Lesezeichen darauf funktionieren weiter.

**Was sich für Nutzer ändert:** Wer den Kostenbereich als Lesezeichen hat, landet künftig auf dem Überblick statt bei den laufenden Kosten. Das ist der beabsichtigte Zweck des Features; vom Überblick führt ein Weg dorthin.

**Nicht vergessen:** Zwei Stellen im Programm verweisen heute auf den Kostenbereich in der Bedeutung „Laufende Kosten" — die Quellenverweise der Auswertung und die Bereichsliste der Navigation. Beide müssen auf den neuen Unterpfad zeigen, sonst führen sie auf den Überblick statt auf die Liste. Das gehört ausdrücklich in die Prüfliste.

**4. Die Navigation muss nicht angefasst werden**

PROJ-30 hat die Bereiche an **einer** Stelle zusammengeführt. Der Überblick wird dort als weiterer Unterpunkt eingetragen — die Navigationskomponenten selbst bleiben unberührt. Genau dafür war die Zusammenführung gedacht.

**5. Belastbarkeit wird gekennzeichnet, nicht verschwiegen**

Die Rechenlogik meldet bereits, welche Kostenarten unerfasst sind, wie viele Scheckheft-Einträge ohne Betrag geführt werden und wie viele Kilometer-Abschnitte wegen widersprüchlicher Stände übersprungen wurden. Diese Angaben tragen den Hinweis „eingeschränkt belastbar". Eine Kennzahl kommentarlos auszugeben, die auf drei von zwölf Monaten beruht, wäre die schlechtere Antwort.

**6. Kosten je Kilometer entfallen lieber, als zu raten**

Ohne zwei verwertbare Kilometerstände gibt es keine Fahrleistung und damit keine Kosten je Kilometer. Die Kennzahl verschwindet dann mit einer kurzen Begründung. Ein Wert von 0 € oder ein aus einem einzigen Stand hochgerechneter Wert sähe plausibel aus und wäre falsch.

### D) Was zusätzlich installiert werden muss

**Nichts.** Kennzahlenfelder, Hinweisfelder, Ladeplatzhalter und die Aufteilungsdarstellung sind alle bereits im Projekt vorhanden.

### E) Was dieses Feature bewusst nicht tut

- **Keine wählbaren Zeiträume.** Der Überblick beantwortet eine Frage; wer vergleichen will, geht in die Auswertung.
- **Keine Diagramme.** Sie sind der Zweck der Auswertung; hier stünden sie dem schnellen Blick im Weg.
- **Keine neue Erfassung.** Der Überblick zeigt und verweist, er nimmt nichts auf.
- **Kein Kaufpreis in den Kennzahlen** (siehe B).

### F) Risiken und offene Punkte für die Umsetzung

**Der Umzug der laufenden Kosten ist die eigentliche Gefahrenstelle.** Nicht die neue Seite, sondern die beiden Verweise, die heute auf den Kostenbereich zeigen und künftig ins Falsche laufen. Sie sind still — es gibt keine Fehlermeldung, der Nutzer landet nur woanders. Gehört gezielt geprüft.

**„Nur eine Kostenart erfasst" braucht eine Entscheidung beim Bauen.** Die Spec verlangt, dass eine Aufteilung dann nicht als aussagekräftige Verteilung erscheint. Vorgesehen: Bei nur einer Quelle entfällt die Anteilsdarstellung und es steht schlicht der Betrag da. Am echten Fall zu prüfen.

**Sehr hohe Einzelposten verzerren den Monatsdurchschnitt.** Eine Restaurierung über 15.000 € lässt zwölf Monate teuer aussehen. Vorgesehen: Der Durchschnitt weist aus, wenn ein einzelner Posten mehr als die Hälfte der Gesamtkosten ausmacht. Ob das genügt oder ein Median die ehrlichere Zahl wäre, ist beim Bauen an echten Daten zu beurteilen.

**Die Zahlen müssen mit der Auswertung übereinstimmen.** Beide Seiten nutzen dieselbe Rechenlogik, aber unterschiedliche Zeiträume. Ein Test, der für denselben Zeitraum beide Seiten vergleicht, ist die einzige verlässliche Absicherung dagegen, dass sie später auseinanderlaufen.

## Implementierung (Frontend)

**Umgesetzt am:** 2026-08-03

### Gebaute und geänderte Dateien

| Datei | Zweck |
|---|---|
| `src/app/vehicles/[id]/kosten/page.tsx` | **neu** — der Überblick, serverseitig gerechnet |
| `src/app/vehicles/[id]/kosten/laufende/page.tsx` | **verschoben** von `/kosten` |
| `src/components/cost-overview-view.tsx` | neu — Kennzahlen, Aufteilung, Hinweise, leerer Zustand |
| `src/lib/cost-overview.ts` | neu — Zusammenfassung zu vier Zahlen |
| `src/lib/cost-overview.test.ts` | neu — 15 Tests |
| `src/lib/cost-analysis.ts` | `buildOverviewPeriod` ergänzt, Quellenpfad nachgezogen |
| `src/lib/cost-analysis.test.ts` | 7 Tests zum neuen Zeitraum |
| `src/components/cost-analysis-view.tsx` | Quellenverweis auf den neuen Pfad |
| `src/lib/vehicle-areas.ts` | „Überblick" ergänzt, „Laufende Kosten" umgehängt |

### An echten Daten nachgerechnet

Mit vier Quellen befüllt und im Browser gegengeprüft:

| Quelle | Betrag |
|---|---:|
| Kraftstoff (3 Tankvorgänge) | 270,00 € |
| Wartung (1 Inspektion) | 350,00 € |
| Einzelkosten (Ersatzteile) | 220,00 € |
| Laufende Kosten (Versicherung 600 €/Jahr) | 600,00 € |
| **Gesamt** | **1.440,00 €** |

Die Seite zeigte **1.440,00 €**, **120,00 € je Monat** (1440 ÷ 12) und **0,36 € je Kilometer** bei 4.000 km — jede Zahl von Hand nachgerechnet. Die Anteile (19 % Kraftstoff, 24 % Wartung) summieren sich auf 100 %.

Der Belastbarkeitshinweis nannte die sieben nicht erfassten Kostenarten. Konsole auf allen geprüften Seiten sauber, kein Querscrollen bei 375, 768 und 1440 px.

### Umgesetzte Entscheidungen

- **Serverseitig gerechnet.** Die Seite kommt fertig an; es gibt kein Nachladen und damit auch keine springenden Zahlen — besser als der in der Spec geforderte Platzhalter.
- **Der Monatsdurchschnitt teilt durch die abgedeckten Monate**, nicht durch zwölf. Bei einem im Mai gekauften Fahrzeug wäre sonst jeder Monat um zwei Drittel zu billig.
- **Kosten je Kilometer entfallen mit Begründung**, wenn zwei Messpunkte fehlen oder die Stände sich widersprechen. Beide Fälle werden unterschieden und getrennt benannt.
- **Bei einer einzigen Quelle entfällt die Anteilsangabe.** 100 % aus einer Quelle ist keine Verteilung, sondern eine Feststellung; die Karte heißt dann „Erfasste Kosten" statt „Aufteilung".
- **Ein beherrschender Posten wird gemeldet**, sobald eine Gruppe über die Hälfte ausmacht — aber nur, wenn es überhaupt mehrere gibt.
- **Der Kaufpreis bleibt draußen**, mit einem Verweis auf die Wertentwicklung am Fuß der Seite.

### Der Umzug — die im Entwurf benannte Gefahrenstelle

Beide Verweise, die den Kostenbereich mit „Laufende Kosten" gleichsetzten, sind nachgezogen:

- `SOURCE_META` in der Rechenlogik (speist die Quellenverweise der Auswertung)
- die feste Quellenliste in der Auswertungsansicht

Im Browser bestätigt: Der Quellenverweis der Auswertung zeigt auf `/kosten/laufende`. In der Navigation stehen fünf Unterpunkte, „Überblick" ist auf `/kosten` aktiv und „Laufende Kosten" auf `/kosten/laufende` — beide exakt und nicht gleichzeitig.

### Was der Umzug an Tests gekostet hat

Vier E2E-Tests brachen, alle aus demselben Grund: Der Überblick verweist selbst nach „Laufende Kosten" und „Einzelkosten", wodurch diese Begriffe auf `/kosten` nun **doppelt** vorkommen — einmal in der Navigation, einmal in der Aufteilung. Betroffene Prüfungen zielen jetzt ausdrücklich auf den Navigationseintrag.

Ein fünfter Test lief in einen Zeitüberlauf: Er ruft alle Fahrzeugseiten nacheinander auf, und mit dem neuen Unterpfad sind es dreizehn statt zwölf — die voreingestellten 30 Sekunden reichten nicht mehr. Grenze angehoben.

### Nicht geprüft

- **Der verkürzte Zeitraum im Browser.** Das Wegwerf-Fahrzeug hat keine Daten, die jünger als zwölf Monate wären. Die Logik ist mit sieben Tests abgedeckt, einschließlich Jahreswechsel und Daten aus genau dem laufenden Monat — die Darstellung des Hinweises gehört aber in `/qa`.
- **Der beherrschende Posten in der Oberfläche.** Ebenfalls nur als reine Funktion geprüft.
- **Tastaturbedienung** über die Voreinstellungen hinaus.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
