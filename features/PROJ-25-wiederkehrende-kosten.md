# PROJ-25: Wiederkehrende Kosten

## Status: Planned
**Created:** 2026-07-31
**Last Updated:** 2026-07-31

## Dependencies
- Requires: PROJ-1 (User Authentication) — User muss eingeloggt sein
- Requires: PROJ-2 (Fahrzeugprofil) — Kosten gehören zu einem Fahrzeug; `insurance_company` und `insurance_policy_number` existieren dort bereits
- Beeinflusst: PROJ-27 (Kostenanalyse) — liefert alle zeitraumbezogenen Kostenarten

## Zusammenfassung
Manche Fahrzeugkosten sind keine Einzelereignisse, sondern laufen über einen Zeitraum: Versicherung, Kfz-Steuer, Garagenmiete, Clubbeitrag. Der Nutzer hinterlegt den Betrag einmal mit Gültigkeitszeitraum; die Anwendung legt ihn rechnerisch auf die Monate um, damit er in der Auswertung als gleichmäßige Belastung erscheint statt als einzelner Ausschlag.

Das Feature ist bewusst **nach Kostenform geschnitten, nicht nach Kostenart**: Die Umlage-, Historisierungs- und Überlappungslogik ist für alle wiederkehrenden Kosten identisch. Eine weitere Kostenart aufzunehmen ist damit ein Eintrag in der Auswahlliste und keine Änderung an dieser Spec.

Beiträge ändern sich jährlich. Die Erfassung ist deshalb **historisierend**: Für jeden Zeitraum existiert ein eigener Eintrag, alte Werte bleiben erhalten — sonst werden Auswertungen vergangener Jahre rückwirkend falsch, sobald sich ein Beitrag ändert.

## Kostenarten
| Kostenart | Anmerkung |
|---|---|
| Versicherung | `vehicles.insurance_company` existiert bereits und dient als Vorbelegung |
| Kfz-Steuer | Jahresbetrag, bei Saisonkennzeichen anteilig |
| Unterstellung / Garage / Winterlager | Für viele Halter der zweitgrößte Posten nach der Versicherung |
| Club- / Verbandsbeitrag | Oft Voraussetzung für vergünstigte Oldtimer-Tarife |

Die Liste ist erweiterbar, ohne dass sich Erfassung oder Auswertung ändern.

## User Stories
- Als Oldtimer-Besitzer möchte ich den Jahresbeitrag meiner Versicherung hinterlegen, damit er in meiner Kostenübersicht auftaucht
- Als Oldtimer-Besitzer möchte ich meine jährliche Kfz-Steuer hinterlegen, damit meine Gesamtkosten vollständig sind
- Als Oldtimer-Besitzer möchte ich meine Garagen- oder Winterlagermiete erfassen, weil sie einen erheblichen Teil meiner Unterhaltskosten ausmacht
- Als Oldtimer-Besitzer möchte ich meinen Clubbeitrag erfassen, damit auch die kleineren laufenden Posten abgebildet sind
- Als Oldtimer-Besitzer möchte ich für jeden Zeitraum einen eigenen Betrag hinterlegen, weil sich Beiträge jährlich ändern
- Als Oldtimer-Besitzer mit Saisonkennzeichen möchte ich einen abweichenden Gültigkeitszeitraum angeben, weil ich nur von April bis Oktober zugelassen bin
- Als Oldtimer-Besitzer möchte ich den Verlauf meiner Beiträge sehen, damit ich Steigerungen erkenne
- Als Oldtimer-Besitzer möchte ich einen Eintrag korrigieren oder löschen können

## Acceptance Criteria
- [ ] Eintrag anlegen mit: Kostenart (Auswahlliste), Betrag, Zahlungsintervall, Gültigkeit von, Gültigkeit bis
- [ ] Zahlungsintervall wählbar: jährlich, halbjährlich, vierteljährlich, monatlich
- [ ] Optionale Felder: Anbieter/Bezeichnung, Notiz
- [ ] Bei Kostenart "Versicherung" wird `vehicles.insurance_company` als Vorbelegung vorgeschlagen
- [ ] Beträge werden in Cent gespeichert, Eingabe in Euro
- [ ] Der Betrag wird rechnerisch auf die Monate des Gültigkeitszeitraums umgelegt
- [ ] Die Umlage berücksichtigt abweichende Zeiträume: Ein Betrag über 7 Monate wird auf 7 Monate verteilt, nicht auf 12
- [ ] Mehrere Einträge derselben Kostenart mit unterschiedlichen Zeiträumen sind möglich (Historie)
- [ ] Übersicht listet alle Einträge, gruppiert nach Kostenart, chronologisch sortiert
- [ ] Summe der laufenden Kosten pro Monat und pro Jahr wird angezeigt
- [ ] Verlauf der Beiträge über die Jahre ist je Kostenart erkennbar
- [ ] Eintrag kann bearbeitet und gelöscht werden (Löschen mit Bestätigungsdialog)
- [ ] Leerer Zustand: Hinweis "Noch keine laufenden Kosten hinterlegt" mit Button zum Anlegen
- [ ] Validierung: Betrag ≥ 0, "Gültig bis" muss nach "Gültig von" liegen
- [ ] Warnung bei überlappenden Zeiträumen derselben Kostenart
- [ ] Jede Kostenart ist als **Standkosten** oder **Fahrtkosten** klassifiziert (alle hier erfassten Arten sind Standkosten) — Grundlage für die Auswertung in PROJ-27
- [ ] Zugriff folgt den Rollen aus PROJ-6
- [ ] Erreichbar über die Fahrzeug-Navigation

## Edge Cases
- **Überlappende Zeiträume derselben Kostenart:** Zwei Versicherungsbeiträge für denselben Monat würden doppelt zählen. Beim Speichern warnen und Bestätigung verlangen; die Auswertung muss eine bestehende Überlappung offenlegen statt still zu summieren
- **Lücke zwischen zwei Zeiträumen:** Zulässig (Fahrzeug war abgemeldet oder stand nicht in der Halle). Für Lückenmonate werden keine Kosten angesetzt — das ist korrekt und kein Fehler
- **Saisonkennzeichen:** Häufigster Fall bei Oldtimern. Der Zeitraum umfasst nur die Saisonmonate; die Umlage darf nicht stur durch 12 teilen
- **Winterlager läuft gegenläufig zur Saison:** Die Garage wird oft genau dann bezahlt, wenn das Fahrzeug abgemeldet ist. Zeiträume verschiedener Kostenarten dürfen sich deshalb frei überlappen — nur Überlappungen *derselben* Art sind verdächtig
- **Fahrzeug unterjährig gekauft:** Erster Zeitraum beginnt mitten im Jahr. Die Umlage muss ab dem Startmonat greifen, nicht ab Januar
- **Beitrag rückwirkend geändert:** Der Nutzer korrigiert einen abgelaufenen Zeitraum. Bereits berechnete Auswertungen müssen sich aktualisieren — der Betrag ist keine eingefrorene Momentaufnahme
- **Zeitraum reicht in die Zukunft:** Zulässig (laufendes Versicherungsjahr). In der Auswertung dürfen zukünftige Monate aber nicht als bereits angefallene Kosten zählen
- **Versicherungswechsel mitten im Jahr:** Zwei Einträge mit angrenzenden Zeiträumen, zulässig solange sie sich nicht überlappen
- **Monatliche Zahlung statt Jahresbetrag:** Über das Zahlungsintervall abgebildet; die Umlage muss für alle Intervalle dasselbe Monatsergebnis liefern
- **Sehr langer Zeitraum (mehrere Jahre in einem Eintrag):** Zulässig, Umlage läuft über alle Monate. Hinweis anbieten, stattdessen Jahreseinträge anzulegen

## Technische Anforderungen
- Beträge als Ganzzahl in Cent speichern (konsistent zu `service_entries.cost_cents`)
- Die monatliche Umlage berechnen statt als redundante Zeilen speichern, damit eine Beitragskorrektur keine inkonsistenten Altdaten hinterlässt
- Kostenart als erweiterbare Liste modellieren, nicht als fest verdrahtete Spalten — eine neue Art darf keine Migration der Auswertung erfordern
- Bestehende Felder `vehicles.insurance_company` / `insurance_policy_number` nicht duplizieren, sondern als Vorbelegung nutzen
- Responsive: Formular auf Mobile (375px) bedienbar
- RLS-Policies analog zu `service_entries`

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
