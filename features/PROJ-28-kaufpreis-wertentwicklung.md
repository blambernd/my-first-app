# PROJ-28: Kaufpreis & Wertentwicklung

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
