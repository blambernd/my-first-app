# PROJ-26: Einzelkosten

## Status: Planned
**Created:** 2026-07-31
**Last Updated:** 2026-07-31

## Dependencies
- Requires: PROJ-1 (User Authentication) — User muss eingeloggt sein
- Requires: PROJ-2 (Fahrzeugprofil) — Kosten gehören zu einem Fahrzeug
- Optional verknüpft mit: PROJ-3 (Digitales Scheckheft) — eine Ausgabe kann einem Scheckheft-Eintrag zugeordnet werden
- Beeinflusst: PROJ-27 (Kostenanalyse) — liefert alle punktuellen Kostenarten

## Zusammenfassung
Nicht jede Ausgabe passt ins Scheckheft oder ist wiederkehrend. Wer selbst schraubt, kauft Teile über eBay, Teilemärkte oder Spezialhändler — diese Ausgaben tauchen heute nirgends auf. Auch ein Wertgutachten fällt unregelmäßig an, nicht in festen Perioden.

Dieses Feature erfasst **punktuelle Ausgaben mit Datum und Betrag**. Wie PROJ-25 ist es nach Kostenform geschnitten statt nach Kostenart: Erfassung, Verknüpfungslogik und Doppelerfassungsschutz sind für alle Einzelkosten identisch, eine weitere Kostenart ist ein Listeneintrag.

Wichtig zur Abgrenzung: `part_alerts` und `part_alert_matches` aus PROJ-9 sind **Preis-Alarme für die Suche**, keine getätigten Käufe. Diese Tabellen werden nicht wiederverwendet.

Der zentrale Anspruch ist, **Doppelerfassung sichtbar und vermeidbar** zu machen: Ein Teil, das über die Werkstattrechnung lief und zusätzlich hier erfasst wird, darf in der Kostenanalyse nicht zweimal zählen.

## Kostenarten
| Kostenart | Anmerkung |
|---|---|
| Ersatzteile | Selbst gekaufte Teile; ergänzt die im Scheckheft enthaltenen Werkstatt-Teilekosten |
| Wertgutachten | Alle 2–3 Jahre, oft vom Versicherer verlangt; unregelmäßig, daher Einzelkosten |
| Sonstiges | Kleinposten wie Pflegemittel, Additive, Betriebsstoffe außer Öl |

Die Liste ist erweiterbar. Bewusst noch **nicht** aufgenommen (Entscheidung 2026-07-31): Transport/Überführung, Zulassung/H-Kennzeichen, Veranstaltungen/Startgelder — durch den generalisierten Schnitt jeweils ohne Spec-Änderung ergänzbar.

## User Stories
- Als selbstschraubender Oldtimer-Besitzer möchte ich gekaufte Teile mit Bezeichnung, Preis und Datum erfassen, damit meine Teilekosten dokumentiert sind
- Als Oldtimer-Besitzer möchte ich die Kosten eines Wertgutachtens erfassen, damit auch unregelmäßige Posten in der Übersicht auftauchen
- Als Oldtimer-Besitzer möchte ich eine Ausgabe optional einem Scheckheft-Eintrag zuordnen, damit erkennbar ist, wofür sie angefallen ist
- Als Oldtimer-Besitzer möchte ich sehen, wenn eine Ausgabe möglicherweise doppelt erfasst ist, damit meine Kostenübersicht stimmt
- Als Oldtimer-Besitzer möchte ich meine Ausgaben als Liste sehen und durchsuchen, damit ich nachvollziehe, was ich wann gekauft habe
- Als Oldtimer-Besitzer möchte ich zu einem Teil die Bezugsquelle festhalten, damit ich sie beim nächsten Bedarf wiederfinde
- Als Oldtimer-Besitzer möchte ich einen Eintrag korrigieren oder löschen können

## Acceptance Criteria
- [ ] Eintrag anlegen mit Pflichtfeldern: Kostenart (Auswahlliste), Bezeichnung, Betrag, Datum
- [ ] Optionale Felder: Teilenummer, Bezugsquelle/Händler, Menge, Einbaudatum, Notiz
- [ ] Teilenummer, Menge und Einbaudatum werden nur bei der Kostenart "Ersatzteile" angeboten
- [ ] Beträge werden in Cent gespeichert, Eingabe in Euro
- [ ] Ein Eintrag kann optional einem bestehenden Scheckheft-Eintrag zugeordnet werden
- [ ] Bei Zuordnung wird beim Speichern darauf hingewiesen, dass die Kosten dort möglicherweise bereits enthalten sind
- [ ] Der Nutzer kann pro Eintrag kennzeichnen, ob der Betrag in den Kosten des verknüpften Scheckheft-Eintrags **bereits enthalten** ist
- [ ] Als "bereits enthalten" gekennzeichnete Einträge werden in der Kostenanalyse **nicht erneut** gezählt, bleiben aber in der Liste sichtbar
- [ ] Liste ist chronologisch sortiert (neuester Eintrag zuerst) und nach Kostenart filterbar
- [ ] Liste ist nach Bezeichnung und Teilenummer durchsuchbar
- [ ] Summe wird angezeigt, gesamt und je Kostenart
- [ ] Eintrag kann bearbeitet und gelöscht werden (Löschen mit Bestätigungsdialog)
- [ ] Leerer Zustand: Hinweis "Noch keine Einzelkosten erfasst" mit Button zum Anlegen
- [ ] Validierung: Bezeichnung nicht leer, Betrag ≥ 0, Menge ≥ 1, Datum nicht in der Zukunft
- [ ] Jede Kostenart ist als **Standkosten** oder **Fahrtkosten** klassifiziert — Grundlage für die Auswertung in PROJ-27
- [ ] Zugriff folgt den Rollen aus PROJ-6
- [ ] Erreichbar über die Fahrzeug-Navigation

## Edge Cases
- **Doppelerfassung Ausgabe ↔ Scheckheft:** Der Kernfall dieser Spec. Ein Teil wird hier erfasst *und* steckt in der Werkstattrechnung. Lösung ist das Kennzeichen "bereits enthalten"; ohne dieses Kennzeichen zählt der Betrag zusätzlich. Die Kostenanalyse muss ausweisen, welche Beträge ausgeschlossen wurden
- **Eintrag ohne Zuordnung zu einem Scheckheft-Eintrag:** Der Normalfall beim Selbstschrauben. Muss ohne Warnung funktionieren — die Zuordnung ist optional
- **Verknüpfter Scheckheft-Eintrag wird gelöscht:** Der Einzelkosten-Eintrag darf nicht mitgelöscht werden. Die Verknüpfung wird aufgehoben; war er als "bereits enthalten" markiert, muss dieses Kennzeichen zurückgesetzt werden — sonst verschwindet der Betrag dauerhaft aus der Auswertung
- **Teil gekauft, aber nie verbaut (Ersatzteillager):** Einbaudatum bleibt leer. Die Kosten sind angefallen und zählen — maßgeblich ist der Kaufzeitpunkt, nicht der Einbau
- **Teil zurückgegeben / Fehlkauf:** Negativbeträge sind nicht zulässig. Stattdessen Eintrag löschen. Ob Rückgaben eigens abgebildet werden sollen, ist eine offene Frage für `/architecture`
- **Menge > 1:** Der Betrag ist der Gesamtpreis für die erfasste Menge, nicht der Stückpreis. Im Formular eindeutig beschriften
- **Sehr viele Einträge:** Bei Restaurierungen realistisch (100+ Positionen). Liste braucht Pagination oder Lazy Loading; die Summenbildung darf davon nicht betroffen sein
- **Wertgutachten mit mehrjähriger Gültigkeit:** Wird als Einzelkosten zum Erstellungsdatum erfasst, nicht über die Gültigkeit verteilt. Wer eine Verteilung möchte, kann es alternativ in PROJ-25 anlegen — beide Wege dürfen nicht gleichzeitig genutzt werden
- **Teil aus einem Preis-Alarm (PROJ-9) gekauft:** Es gibt heute keine Übernahme aus `part_alert_matches`. Ob eine solche Verknüpfung sinnvoll ist, ist eine offene Frage für `/architecture` — für dieses Feature nicht erforderlich

## Technische Anforderungen
- Beträge als Ganzzahl in Cent speichern (konsistent zu `service_entries.cost_cents`)
- Verknüpfung zum Scheckheft über Fremdschlüssel auf `service_entries`, mit definiertem Löschverhalten (kein Cascade-Delete des Einzelkosten-Eintrags)
- Kostenart als erweiterbare Liste modellieren, nicht als fest verdrahtete Spalten
- Klare Abgrenzung zu `part_alerts` / `part_alert_matches` aus PROJ-9 — diese Tabellen werden nicht wiederverwendet
- Responsive: Formular und Liste auf Mobile (375px) bedienbar
- RLS-Policies analog zu `service_entries`

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
