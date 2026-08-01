# PROJ-32: Kostendaten beim Fahrzeug-Transfer

## Status: Planned
**Created:** 2026-08-01
**Last Updated:** 2026-08-01

## Dependencies
- Requires: PROJ-7 (Fahrzeug-Transfer) — die Übergabe selbst existiert bereits
- Betrifft: PROJ-3 (Scheckheft), PROJ-24 (Tankbuch), PROJ-25 (Laufende Kosten), PROJ-26 (Einzelkosten), PROJ-28 (Kaufpreis)
- Betrifft: PROJ-27 (Kostenanalyse) — wertet aus, was hier entfernt wird

## Zusammenfassung
Beim Besitzerwechsel geht heute **alles** mit über — auch der Kaufpreis und die vollständige Kostenhistorie. Der Käufer sieht damit, was der Vorbesitzer für das Fahrzeug gezahlt hat, was er für Versicherung, Teile und Werkstatt ausgegeben hat und welche Rechnung wie hoch war. Das unterläuft jede Preisverhandlung und ist die letzte offene Datenschutzlücke im Kostenbereich.

Dieses Feature schließt sie. Der Zuschnitt folgt einer Unterscheidung, die sich durch den ganzen Kostenbereich zieht:

- **Wartungs- und Verbrauchshistorie ist Fahrzeugwissen.** Sie gehört zum Fahrzeug und geht mit über — genau dafür ist das Produkt gebaut
- **Beträge sind persönliche Finanzdaten.** Sie gehören zum bisherigen Besitzer und bleiben bei ihm

Ein Scheckheft-Eintrag „Vergaser überholt, 82.000 km, Werkstatt Müller" wandert also mit. Die 1.240 € daneben nicht.

**Gegenläufige Anforderung:** Der Vorbesitzer hat diese Daten selbst gepflegt. Sie ihm ersatzlos zu nehmen wäre schlechter als das Problem. Deshalb ist ein Export vor dem Transfer Teil dieses Features, nicht ein späterer Zusatz.

## Entscheidungen (2026-08-01)

| Frage | Entscheidung |
|---|---|
| Scheckheft und Tankbuch | **Nur die Beträge entfernen** — Einträge, Daten, Kilometerstände und Beschreibungen bleiben |
| Export für den Vorbesitzer | **Ja**, vor dem Absenden des Transfers |
| Zeitpunkt des Entfernens | **Beim Annehmen** durch den neuen Besitzer |

## User Stories
- Als verkaufender Oldtimer-Besitzer möchte ich, dass der Käufer meinen Kaufpreis und meine Ausgaben nicht sieht, damit meine Preisverhandlung nicht unterlaufen wird
- Als verkaufender Besitzer möchte ich vor der Übergabe erfahren, welche Daten dabei entfernt werden, damit mich nichts überrascht
- Als verkaufender Besitzer möchte ich meine Kostenaufzeichnungen vorher herunterladen, damit ich sie behalte, obwohl sie aus dem Fahrzeug verschwinden
- Als kaufender Oldtimer-Besitzer möchte ich die vollständige Wartungs- und Verbrauchshistorie erhalten, damit die Übergabe ihren Zweck erfüllt
- Als kaufender Besitzer möchte ich erkennen, dass Kostenangaben bewusst fehlen und nicht etwa nie gepflegt wurden, damit ich die Historie richtig einschätze
- Als verkaufender Besitzer möchte ich, dass bei einem abgelehnten oder abgelaufenen Transfer nichts verloren geht

## Acceptance Criteria

### Was beim Annehmen des Transfers entfernt wird
- [ ] Der Kaufpreis samt Kauf-Nebenkosten (PROJ-28) wird vollständig gelöscht
- [ ] Alle laufenden Kosten (PROJ-25) werden vollständig gelöscht
- [ ] Alle Einzelkosten (PROJ-26) werden vollständig gelöscht
- [ ] Bei Scheckheft-Einträgen (PROJ-3) wird **nur die Kostenangabe** geleert; Datum, Typ, Beschreibung, Kilometerstand, Werkstatt, Notizen und verknüpfte Dokumente bleiben unverändert
- [ ] Bei Tankvorgängen (PROJ-24) wird **nur der Betrag** geleert; Datum, Liter, Kilometerstand, Volltank-Kennzeichen und Kraftstoffart bleiben unverändert
- [ ] Die Verbrauchsberechnung des Tankbuchs funktioniert nach dem Transfer unverändert, da sie auf Litern und Kilometern beruht

### Was erhalten bleibt
- [ ] Der neue Besitzer sieht die vollständige Wartungshistorie
- [ ] Der neue Besitzer sieht die vollständige Verbrauchshistorie
- [ ] Dokumente, Bilder und Meilensteine sind unberührt

### Hinweis und Export vor dem Transfer
- [ ] Beim Erstellen eines Transfers wird ausdrücklich benannt, welche Daten beim Annehmen entfernt werden
- [ ] Der Hinweis nennt die betroffenen Mengen konkret, nicht nur allgemein (z. B. „14 laufende Kosten, 23 Einzelkosten, Kaufpreis")
- [ ] Vor dem Absenden kann der Vorbesitzer seine Kostendaten herunterladen
- [ ] Der Export enthält alle Beträge, die entfernt werden, jeweils mit Datum und Bezeichnung
- [ ] Der Export ist auch dann verfügbar, wenn ein Transfer bereits offen ist — solange er nicht angenommen wurde

### Verhalten nach dem Transfer
- [ ] Für den neuen Besitzer ist erkennbar, dass Kostenangaben beim Besitzerwechsel entfernt wurden und nicht fehlen, weil sie nie gepflegt wurden
- [ ] Die Kostenanalyse (PROJ-27) zeigt für den neuen Besitzer den leeren Zustand, nicht eine Auswertung mit 0 €
- [ ] Die Wertentwicklung (PROJ-28) verlangt vom neuen Besitzer einen eigenen Kaufpreis

### Sicherheit und Zuverlässigkeit
- [ ] Das Entfernen und der Besitzerwechsel geschehen gemeinsam: Entweder beides oder keines von beidem
- [ ] Nach dem Transfer ist über keinen Weg — Oberfläche, Seitenantwort oder direkte Abfrage — ein entfernter Betrag des Vorbesitzers erreichbar
- [ ] Wird ein Transfer abgelehnt, storniert oder läuft er ab, bleiben alle Kostendaten unverändert beim bisherigen Besitzer

## Edge Cases
- **Transfer wird abgelehnt oder läuft ab:** Es darf nichts entfernt worden sein. Das ist der Grund, warum erst beim Annehmen gelöscht wird und nicht beim Absenden
- **Mehrere offene Transfers zum selben Fahrzeug:** Nur der angenommene löst das Entfernen aus; die übrigen verfallen wirkungslos
- **Vorbesitzer bleibt als Betrachter im Fahrzeug (Option in PROJ-7):** Er sieht die Kostendaten danach ebenfalls nicht mehr — sie sind gelöscht, nicht ausgeblendet. Der Hinweis vor dem Transfer muss das klar sagen, sonst rechnet er damit, sie weiter einsehen zu können
- **Scheckheft-Eintrag ohne Kostenangabe:** Bleibt unverändert; es gibt nichts zu entfernen
- **Einzelkosten, die mit einem Scheckheft-Eintrag verknüpft sind (PROJ-26):** Der Einzelkosten-Eintrag wird gelöscht, der Scheckheft-Eintrag bleibt bestehen. Die Verknüpfung darf nicht dazu führen, dass der Wartungseintrag mitgelöscht wird
- **Fahrzeug ohne jede Kostenerfassung:** Der Hinweis vor dem Transfer sollte dann nicht so wirken, als ginge etwas verloren
- **Export bei sehr vielen Einträgen:** Bei Restaurierungen sind mehrere hundert Positionen realistisch. Der Export muss vollständig sein, nicht abgeschnitten
- **Der neue Besitzer legt eigene Kosten an:** Sie beginnen bei null und vermischen sich nicht mit Resten des Vorbesitzers
- **Transfer an einen Nutzer, der das Fahrzeug bereits als Mitglied kennt:** Er hatte als Werkstatt oder Betrachter ohnehin keinen Zugriff auf Kosten; nach dem Transfer als Besitzer sieht er sie ebenfalls nicht, weil sie entfernt wurden
- **Abbruch mitten im Vorgang:** Ein halb entfernter Zustand — Fahrzeug übertragen, Kosten noch da, oder umgekehrt — wäre schlimmer als beide Ausgangszustände

## Technische Anforderungen
- Das Entfernen gehört in dieselbe Transaktion wie der Besitzerwechsel
- Für Scheckheft und Tankbuch werden **Felder geleert**, keine Zeilen gelöscht
- Der Export muss die Daten liefern, **bevor** sie entfernt werden — nach dem Annehmen ist es zu spät
- Kein neuer Weg, über den Kostendaten nach außen gelangen: Der Export ist ausschließlich für den aktuellen Besitzer erreichbar
- Der Hinweis vor dem Transfer braucht die Anzahlen der betroffenen Datensätze

## Offene Entscheidungen
- **Format des Exports** — Entscheidung für `/architecture`. Eine maschinenlesbare Tabelle ist naheliegend, ein PDF wäre lesbarer, aber schlechter weiterzuverwenden
- **Umfang des Exports** — nur die Beträge, die entfernt werden, oder eine vollständige Kostenübersicht des Fahrzeugs
- **Kennzeichnung für den neuen Besitzer** — ob am einzelnen Eintrag oder einmal je Bereich vermerkt wird, dass Beträge beim Besitzerwechsel entfernt wurden

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
