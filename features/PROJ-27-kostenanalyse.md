# PROJ-27: Kostenanalyse

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
