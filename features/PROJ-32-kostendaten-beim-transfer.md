# PROJ-32: Kostendaten beim Fahrzeug-Transfer

## Status: In Progress
**Created:** 2026-08-01
**Last Updated:** 2026-08-04

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

### Entscheidungen des Nutzers (2026-08-01)

| Frage | Entscheidung |
|---|---|
| Exportformat | **CSV-Tabelle** — zum Weiterrechnen, nicht zum Vorzeigen |
| Exportumfang | **Nur, was entfernt wird** — der Export ist das Gegenstück zum Verlust |

### A) Komponenten-Struktur

```
Transfer-Seite  (/vehicles/[id]/transfer)
+-- Bestehendes Formular „Fahrzeug übertragen"
+-- [Abschnitt „Kostendaten"]                     ← neu, nur wenn Kosten vorhanden
|   +-- Auflistung, was beim Annehmen entfernt wird, mit Anzahlen
|   |   +-- Kaufpreis und Nebenkosten
|   |   +-- N laufende Kosten
|   |   +-- N Einzelkosten
|   |   +-- Beträge aus N Scheckheft-Einträgen
|   |   +-- Beträge aus N Tankvorgängen
|   +-- Hinweis: Einträge und Historie bleiben, nur die Beträge gehen
|   +-- Hinweis: gilt auch, wenn du als Betrachter im Fahrzeug bleibst
|   +-- Schaltfläche „Kostendaten als Tabelle sichern"
|
+-- [Abschnitt bei bereits offenem Transfer]      ← neu
    +-- derselbe Export, solange nicht angenommen wurde

Kosten-Bereich des neuen Besitzers
+-- [Hinweis] „Beim Besitzerwechsel am TT.MM.JJJJ wurden die Kostenangaben
    des Vorbesitzers entfernt."                   ← neu, statt leerem Zustand ohne Erklärung
```

### B) Datenmodell

**Keine neue Tabelle.** Das Feature entfernt Daten und merkt sich, dass es das getan hat.

```
Am Fahrzeug wird ein Zeitpunkt vermerkt:
- Wann die Kostendaten wegen eines Besitzerwechsels entfernt wurden
- Leer, solange das nie geschehen ist

Vollständig gelöscht werden beim Annehmen:
- Anschaffung samt Nebenkosten (PROJ-28)
- Alle laufenden Kosten (PROJ-25)
- Alle Einzelkosten (PROJ-26)

Nur geleert — die Zeilen selbst bleiben:
- Kostenangabe der Scheckheft-Einträge (PROJ-3)
- Betrag der Tankvorgänge (PROJ-24)

Unberührt:
- Datum, Typ, Beschreibung, Kilometerstand, Werkstatt, Notizen
- Liter, Volltank-Kennzeichen, Kraftstoffart
- Dokumente, Bilder, Meilensteine
```

### C) Technische Entscheidungen

**C1 — Das Entfernen gehört in die bestehende Übergabe-Funktion.**
Der Besitzerwechsel läuft heute schon vollständig in **einer** Datenbankfunktion ab: Eigentümer umsetzen, Mitgliedschaften anpassen, Meilenstein anlegen, Transfer als angenommen markieren. Das Entfernen der Beträge dort einzufügen löst zwei Anforderungen auf einmal:

- **Alles oder nichts.** Eine Funktion ist eine Transaktion. Ein halb entfernter Zustand — Fahrzeug übertragen, Kosten noch da oder umgekehrt — kann gar nicht erst entstehen. Das ist die schärfste Anforderung der Spec und hier geschenkt
- **Der Richtige darf es tun.** Angenommen wird vom **neuen** Besitzer, gelöscht werden aber Daten des **alten**. Über die normalen Zugriffsregeln ginge das nicht. Die Übergabe-Funktion läuft bereits mit erhöhten Rechten, weil sie schon heute fremde Daten anfassen muss

Eine Lösung außerhalb dieser Funktion — etwa ein nachgelagerter Aufruf — hätte beide Eigenschaften nicht.

**C2 — Leeren statt Löschen bei Scheckheft und Tankbuch.**
Die Zeilen bleiben, nur die Betragsfelder werden geleert. Damit bleibt die Wartungshistorie vollständig, die Verbrauchsberechnung des Tankbuchs funktioniert unverändert weiter (sie rechnet mit Litern und Kilometern, nicht mit Geld), und verknüpfte Dokumente behalten ihren Bezugspunkt.

Der Unterschied zu den drei gelöschten Bereichen ist inhaltlich, nicht technisch: Ein Scheckheft-Eintrag ist ein Ereignis am Fahrzeug, das zufällig Geld gekostet hat. Ein Einzelkosten-Eintrag **ist** die Ausgabe — ohne Betrag bliebe eine leere Hülle.

**C3 — Die Verknüpfung zwischen Einzelkosten und Scheckheft darf nicht mitreißen.**
Einzelkosten können auf einen Scheckheft-Eintrag zeigen (PROJ-26). Beim Löschen der Einzelkosten muss der Wartungseintrag stehen bleiben. Das Löschverhalten dieser Verknüpfung zeigt bereits in die richtige Richtung — es ist beim Bau ausdrücklich zu prüfen, weil ein Fehler hier die Wartungshistorie zerstören würde, also genau das, was dieses Feature schützen soll.

**C4 — Ein Zeitpunkt am Fahrzeug statt einer Kennzeichnung je Eintrag.**
Der neue Besitzer soll erkennen, dass Beträge entfernt wurden und nicht etwa nie gepflegt waren. Dafür genügt **ein** Vermerk am Fahrzeug; jeden einzelnen Eintrag zu markieren wäre viel Aufwand für dieselbe Aussage.

Die Frage, ob eine Angabe am Fahrzeug problematisch ist, stellt sich hier anders als in PROJ-28: Dort ging es um den Kaufpreis, der Mitgliedern nicht zugänglich sein darf. Ein Datum, an dem der Besitzer gewechselt hat, ist keine schützenswerte Angabe — der Besitzerwechsel steht ohnehin als Meilenstein in der Fahrzeug-Historie.

**C5 — Der Export ist eine Datei-Auslieferung und damit ein begründeter Sonderfall.**
Das Projekt kommt sonst ohne eigene Schnittstellen aus. Für Dateien gibt es bereits drei Ausnahmen — Dokumenten-Archiv, Inserats-PDF und Timeline-PDF. Der Export reiht sich dort ein.

Er ist ausschließlich für den **aktuellen Besitzer** erreichbar. Das ist keine Formalie: Ein Export ist genau der Weg, über den Kostendaten das System verlassen sollen — er darf nicht zugleich ein Weg werden, über den sie es unbefugt tun.

**C6 — CSV, und zwar so, dass es in deutschem Excel aufgeht.**
Kostendaten hebt man auf, um damit weiterzurechnen — für die Steuererklärung, eine eigene Aufstellung, ein anderes Werkzeug. Ein PDF kann das nicht.

Zwei Details entscheiden darüber, ob die Datei beim Nutzer funktioniert oder als Zeichensalat in einer einzigen Spalte landet: Semikolon als Trennzeichen und eine Kennung am Dateianfang, an der Excel die Zeichenkodierung erkennt. Beides ist ohne diese Erfahrung leicht zu übersehen und danach schwer zu erklären.

**C7 — Der Export muss vor dem Annehmen laufen.**
Nach dem Annehmen sind die Daten weg; ein Export danach hätte nichts mehr zu liefern. Deshalb ist er auf der Transfer-Seite verankert und bleibt verfügbar, solange ein Transfer offen ist.

**C8 — Nichts geschieht vor dem Annehmen.**
Ein abgelehnter, stornierter oder abgelaufener Transfer lässt die Kostendaten unberührt. Das ergibt sich aus C1 von selbst: Was in der Annahme-Funktion steht, läuft nur bei der Annahme.

### D) Abhängigkeiten

**Keine neuen Pakete.** CSV ist Text und braucht keine Bibliothek — eine für den Zweck genügt nicht, sondern schafft nur eine weitere Abhängigkeit für ein paar Zeilen Zeichenketten.

### E) Was dieses Feature bewusst NICHT tut

- **Keine Änderung an der Übergabe selbst.** Ablauf, Einladung, Fristen und Rollen bleiben, wie sie sind
- **Kein Export für den neuen Besitzer.** Er bekommt nichts, was er nicht ohnehin sieht
- **Keine Wiederherstellung.** Entfernt ist entfernt — deshalb der Export davor
- **Keine Rückwirkung.** Fahrzeuge, die vor diesem Feature übertragen wurden, tragen die Kosten des Vorbesitzers weiterhin. Sie nachträglich zu bereinigen wäre ein Eingriff in fremde Daten ohne Anlass

### F) Offene Punkte für die Umsetzung

**F1 — Der Hinweis braucht echte Zahlen, und die kosten eine Abfrage.**
„14 laufende Kosten, 23 Einzelkosten" ist ungleich wirksamer als „deine Kostendaten". Dafür müssen auf der Transfer-Seite fünf Bestände gezählt werden. Das ist vertretbar, sollte aber nicht bei jedem Seitenaufruf des Fahrzeugs geschehen, sondern nur dort, wo der Transfer tatsächlich vorbereitet wird.

**F2 — Der Fall „nichts zu verlieren" braucht eine eigene Antwort.**
Hat ein Fahrzeug keinerlei Kostenerfassung, darf der Abschnitt nicht so wirken, als stünde ein Verlust bevor. Dann erscheint er gar nicht.

**F3 — Prüfen, ob der Hinweis für den neuen Besitzer an der richtigen Stelle sitzt.**
Vorgesehen ist der Kosten-Bereich, weil dort die Lücke auffällt. Denkbar wäre auch die Fahrzeug-Historie, wo der Besitzerwechsel ohnehin steht. Entscheidung in `/frontend`, wenn die Wirkung sichtbar ist.

**F4 — Diese Aufgabe schließt zugleich zwei ältere offene Punkte:** die Transfer-Frage aus PROJ-27 (Kostenhistorie) und die aus PROJ-28 (Kaufpreis). Beide verweisen auf genau diese Spec.

## Frontend-Umsetzung (2026-08-04)

**Umgesetzt ist der Teil vor dem Transfer: Hinweis mit echten Anzahlen und Export.** Das Entfernen selbst gehört in die Datenbank und steht noch aus — siehe „Offen für /backend".

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/lib/transfer-costs.ts` | Bestandsbeschreibung und CSV-Erzeugung |
| `src/lib/transfer-costs.test.ts` | 25 Tests |
| `src/components/transfer-cost-notice.tsx` | Der Abschnitt „Kostendaten" |
| `src/app/api/vehicles/[id]/kosten-export/route.ts` | Die Tabelle, besitzergebunden |

### Entscheidung zur offenen Frage F3

Der Hinweis für den **neuen** Besitzer gehört in den **Kostenüberblick** (PROJ-31), nicht in die Fahrzeug-Historie. Grund: Der Überblick ist seit PROJ-31 der Einstieg in den Kostenbereich und damit die Stelle, an der die Lücke tatsächlich auffällt. Er unterscheidet seit der BUG-1-Korrektur bereits zwei leere Zustände („nie erfasst" und „nur ältere Einträge"); der Besitzerwechsel wird der dritte. In der Historie stünde die Erklärung dort, wo niemand sie sucht, wenn er sich über fehlende Beträge wundert.

**Diese Anzeige ist noch nicht gebaut**, weil sie den Zeitpunkt am Fahrzeug voraussetzt, den es noch nicht gibt.

### Erweiterung gegenüber dem Spec: der eingetragene Marktwert

`vehicle_market_values` entstand am 2026-08-03 mit der PROJ-28-Überarbeitung, also **nach** diesem Spec, und fehlt deshalb in dessen Aufzählung. Der Wert wird jetzt mitgezählt, mitexportiert und ist zum Löschen vorgesehen.

Begründung: Er ist die Einschätzung des Vorbesitzers und Grundlage seiner Wertentwicklung. Das Kriterium „Die Wertentwicklung verlangt vom neuen Besitzer einen eigenen Kaufpreis" setzt voraus, dass sie leer startet — mit altem Marktwert und ohne Kaufpreis stünde sie halb gefüllt da. Vom Nutzer am 2026-08-04 bestätigt.

### Was beim Bauen geprüft wurde

**C3 — die Verknüpfung reißt nichts mit.** Der Fremdschlüssel `one_off_costs.service_entry_id` steht auf `ON DELETE SET NULL`, und er zeigt von den Einzelkosten **auf** den Scheckheft-Eintrag. Das Löschen der Einzelkosten kann den Wartungseintrag also gar nicht erreichen. Die im Entwurf benannte Gefahr besteht in dieser Richtung nicht.

**`vehicle_purchase_costs.purchase_id` steht auf `CASCADE`** — die Nebenkosten verschwinden mit dem Kaufpreis von selbst.

### Drei Details, die über den Nutzen der Datei entscheiden

- **Semikolon als Trennzeichen** — deutsches Excel erwartet es, weil das Komma hier das Dezimalzeichen ist
- **BOM am Dateianfang** — ohne die drei Bytes wird aus „Anhängerkupplung" ein „AnhÃ¤ngerkupplung"
- **Betrag als `1240,00`**, ohne Tausenderpunkt und ohne Eurozeichen — sonst liest Excel Text statt einer Zahl, und die Spalte ließe sich nicht summieren. Genau dafür ist der Export da

Dazu Maskierung nach RFC 4180: Notizen enthalten Semikolons, Werkstattnamen Anführungszeichen. Ohne Maskierung verrutscht ab dieser Zeile die ganze Tabelle. Im Browser mit `Werkstatt "Zum Kolben"` und `Überführung; inkl. Anhänger` nachgewiesen.

**Beim Prüfen nachgebessert:** Die erste Fassung schrieb `Intervall: yearly` und `gültig bis 2027-01-01` — rohe Enum-Werte und ISO-Datum in einer sonst deutschen Tabelle. Jetzt „jährlich" und „01.01.2027".

### Nachgewiesen

| Prüfung | Ergebnis |
|---|---|
| Hinweis nennt echte Anzahlen | „Kaufpreis und 2 Nebenkosten-Posten · 1 eingetragener Marktwert · 3 laufende Kostenpositionen · 2 Einzelkosten-Einträge · Beträge aus 1 Scheckheft-Eintrag · Beträge aus 2 Tankvorgängen" |
| Export vollständig | 12 Zeilen, alle sechs Bereiche |
| Maskierung | Semikolon und Anführungszeichen korrekt |
| Fahrzeug ohne Kosten (F2) | Abschnitt erscheint gar nicht, Formular bleibt |
| Export für fremdes Fahrzeug | **404**, kein Betrag ausgeliefert |
| Export ohne Anmeldung | **401** |
| 375 / 768 / 1440 px | kein Querscrollen |
| Unit-Tests | 614 / 614 grün (25 neu) |
| Lint / Build | 0 Fehler / erfolgreich |

### Offen für /backend

1. **Spalte am Fahrzeug** für den Zeitpunkt des Entfernens (C4)
2. **Das Entfernen in `accept_vehicle_transfer`** — in derselben Transaktion wie der Besitzerwechsel (C1). Löschen: `vehicle_purchases` (Nebenkosten folgen per CASCADE), `recurring_costs`, `one_off_costs`, `vehicle_market_values`. Nur Betrag leeren: `service_entries.cost_cents`, `fuel_entries.cost_cents`
3. **Der Hinweis im Kostenüberblick**, sobald die Spalte existiert (F3, siehe oben)

Bis dahin gilt: Der Vorbesitzer wird gewarnt und kann sichern — entfernt wird noch nichts.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
