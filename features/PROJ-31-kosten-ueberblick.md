# PROJ-31: Kosten-Überblicksseite

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
