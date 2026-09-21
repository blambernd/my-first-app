# PROJ-35: Scheckheft-Import aus Dokumenten

## Status: In Progress
**Created:** 2026-08-05
**Last Updated:** 2026-08-06

## Dependencies
- Requires: PROJ-3 (Digitales Scheckheft) — Ziel der Einträge. **Dieses Feature ändert PROJ-3:** `description` wird vom Pflicht- zum optionalen Feld
- Requires: PROJ-4 (Dokumenten-Archiv) — Upload, erlaubte Formate, Ablage des Belegs
- Requires: PROJ-2 (Fahrzeugprofil) — Einträge hängen an einem Fahrzeug
- Requires: PROJ-8 (Freemium-Modell) — Kontingentsteuerung
- Betrifft: PROJ-27 (Kostenanalyse) und PROJ-28 (Wertentwicklung) — falsch importierte Kilometerstände wandern dorthin weiter
- Betrifft: PROJ-22 (Kamera-Integration) — die Seiten werden in der Regel abfotografiert, nicht gescannt
- Liefert an: PROJ-23 (Push-Notifications) — `next_due_date` aus TÜV-Berichten speist die Terminerinnerungen

## Zusammenfassung

Das Papier-Scheckheft ist der Ausgangspunkt des Produkts: Die PRD nennt „Papier-Scheckheft geht verloren oder wird unleserlich" als ersten Schmerzpunkt. Heute muss ein Nutzer diese Historie **Eintrag für Eintrag von Hand abtippen**. Bei einem Fahrzeug mit dreißig Jahren Wartungsgeschichte ist das die Hürde, an der die Einrichtung scheitert.

**Hauptfall — Papier-Scheckheft (viele Einträge):** Der Nutzer fotografiert die Seiten seines Scheckhefts. Eine Doppelseite trägt typischerweise fünf bis zehn Stempel. Daraus werden **mehrere Scheckheft-Einträge auf einmal** vorbefüllt und dem Nutzer zur Prüfung vorgelegt.

**Nebenfall — Rechnung oder TÜV-Bericht (ein Eintrag):** Gedruckt, eins zu eins, alle Felder vorhanden. Technisch der einfachere Fall und deshalb mit im Umfang.

**Der Import schreibt nie selbst.** Er befüllt ein Formular vor. Übernommen wird nur, was der Nutzer bestätigt hat. Der Wert eines Scheckhefts ist seine Glaubwürdigkeit beim Verkauf — ein von einer Maschine erfundener Eintrag zerstört genau die.

## Entscheidungen (2026-08-05)

| Frage | Entscheidung |
|---|---|
| Pflichtfeld `description` | **Optional machen.** Der Import übernimmt die gedruckte Vordruck-Zeile wörtlich, wo eine steht — sonst bleibt das Feld leer |
| Kilometerstand bricht die Kette | **Warnung pro Eintrag.** Der Nutzer entscheidet einzeln: übernehmen, korrigieren oder als Tacho-Korrektur markieren |
| Bestätigung der Einträge | **Liste, nichts vorausgewählt.** Der Nutzer hakt aktiv an, was übernommen wird |
| Zugang | **Alle Nutzer, mit Kontingent.** Kein Premium-Zwang; die Höhe und Bezugsgröße des Kontingents ist offen (siehe unten) |

## User Stories

- Als Oldtimer-Besitzer möchte ich mein Papier-Scheckheft abfotografieren und daraus alle Wartungseinträge auf einmal übernehmen, damit ich dreißig Jahre Historie nicht von Hand abtippen muss
- Als Oldtimer-Besitzer möchte ich jeden erkannten Eintrag vor der Übernahme sehen und korrigieren können, damit keine falsch gelesene Zahl unbemerkt in meine Historie gerät
- Als Oldtimer-Besitzer möchte ich erkennen, welche Angaben aus dem Dokument stammen und welche leer geblieben sind, damit ich weiß, wo ich nacharbeiten muss
- Als Oldtimer-Besitzer möchte ich eine Werkstattrechnung hochladen und daraus einen fertig vorbefüllten Eintrag bekommen, damit die laufende Pflege weniger Arbeit macht
- Als Oldtimer-Besitzer möchte ich, dass aus einem TÜV-Bericht die nächste Fälligkeit übernommen wird, damit ich rechtzeitig erinnert werde
- Als Oldtimer-Besitzer möchte ich das hochgeladene Dokument als Beleg zu den erzeugten Einträgen behalten, damit die Historie beim Verkauf belegbar bleibt
- Als Oldtimer-Besitzer möchte ich verstehen, warum ein Import nicht funktioniert hat, statt vor einer leeren Liste zu stehen
- Als verkaufender Besitzer möchte ich sicher sein, dass kein Eintrag ohne meine Bestätigung entstanden ist, damit ich für jede Angabe geradestehen kann

## Acceptance Criteria

### Erkennung
- [ ] Ein hochgeladenes Dokument kann **mehrere** Scheckheft-Einträge erzeugen
- [ ] Mehrere Seiten können in einem Vorgang verarbeitet werden
- [ ] Erkannt werden mindestens: Datum, Kilometerstand, Werkstatt, Eintragstyp
- [ ] Handschriftliche Einträge und Werkstattstempel werden verarbeitet, nicht nur gedruckter Text
- [ ] Erkannte Datumsangaben werden als deutsches Format gelesen (TT.MM.JJJJ)
- [ ] Der Eintragstyp wird auf die bestehenden sechs Werte abgebildet; ist keine Zuordnung möglich, wird „Sonstiges" gesetzt
- [ ] Felder, die im Dokument nicht stehen, bleiben **leer** — sie werden nicht geraten

### Prüfung vor der Übernahme
- [ ] Alle erkannten Einträge werden als Liste vorgelegt, chronologisch sortiert
- [ ] **Kein Eintrag ist vorausgewählt** — Übernahme erfordert eine aktive Auswahl
- [ ] Jedes Feld jedes Eintrags ist vor der Übernahme bearbeitbar
- [ ] Erkannte und leer gebliebene Felder sind optisch unterscheidbar
- [ ] Die zugehörige Stelle im Dokument ist während der Prüfung einsehbar
- [ ] Einzelne Einträge können verworfen werden, ohne den ganzen Vorgang abzubrechen
- [ ] Der Nutzer kann den gesamten Vorgang abbrechen; dabei entsteht **kein** Eintrag
- [ ] **Ohne Bestätigung wird unter keinen Umständen ein Eintrag gespeichert**

### Kilometerstand-Kette
- [ ] Einträge werden chronologisch geprüft, nicht in der Reihenfolge der Erkennung
- [ ] Unterschreitet ein Kilometerstand den vorherigen, wird der betroffene Eintrag hervorgehoben
- [ ] Der Nutzer kann pro Eintrag wählen: unverändert übernehmen, Zahl korrigieren, oder als Tacho-Korrektur markieren
- [ ] Ein Konflikt blockiert die übrigen Einträge nicht
- [ ] Die Prüfung berücksichtigt auch bereits im Scheckheft vorhandene Einträge, nicht nur die des Imports

### Belegzuordnung
- [ ] Das hochgeladene Dokument wird im Dokumenten-Archiv abgelegt
- [ ] Es bleibt **allen** daraus erzeugten Einträgen als Beleg zugeordnet
- [ ] Die Datei wird dabei nur einmal gespeichert, nicht je Eintrag kopiert
- [ ] Aus einem Eintrag heraus ist der zugehörige Beleg auffindbar

### Rechnungen und TÜV-Berichte
- [ ] Aus einer Werkstattrechnung wird ein einzelner Eintrag mit Datum, Beschreibung, Werkstatt und Kosten vorbefüllt
- [ ] Beträge werden in Cent übernommen und in Euro angezeigt
- [ ] Aus einem TÜV-Bericht wird die nächste Fälligkeit als `next_due_date` vorbefüllt
- [ ] Der Eintragstyp wird dabei auf „TÜV/HU" gesetzt
- [ ] Eine bestätigte TÜV-Fälligkeit erscheint in den Terminerinnerungen (PROJ-23)

### Kontingent
- [ ] Jeder angemeldete Nutzer kann den Import nutzen — er ist nicht Premium-exklusiv
- [ ] Ein verbrauchtes Kontingent wird **vor** dem Start des Vorgangs angezeigt, nicht danach
- [ ] Der verbleibende Rest ist jederzeit einsehbar
- [ ] Ein abgebrochener oder vollständig verworfener Vorgang verbraucht kein Kontingent
- [ ] Bei erschöpftem Kontingent bleibt die manuelle Eingabe uneingeschränkt möglich
- [ ] Die Grenze wird serverseitig durchgesetzt, nicht in der Anzeige

### Datenschutz
- [ ] Vor dem ersten Import wird der Nutzer darüber informiert, dass das Dokument zur Auswertung an einen Dienstleister übermittelt wird
- [ ] Die Datenschutzerklärung benennt diese Verarbeitung
- [ ] Der Nutzer kann die Auswertung ablehnen und das Dokument trotzdem als Beleg ablegen

### Darstellung
- [ ] Die Prüfansicht ist auf 375 px, 768 px und 1440 px vollständig nutzbar
- [ ] Während der Auswertung ist erkennbar, dass gearbeitet wird und wie lange es etwa dauert
- [ ] Ein Fehlschlag nennt einen verständlichen Grund und lässt den Vorgang wiederholen

## Edge Cases

- **Unscharfes oder schiefes Foto:** Der häufigste Fall bei abfotografierten Seiten. Muss zu einem verständlichen Hinweis führen, nicht zu leeren oder halb geratenen Einträgen
- **Gar nichts erkannt:** Muss wie ein normaler Ausgang wirken, nicht wie ein Defekt — mit dem Hinweis, was ein besseres Foto ausmacht
- **Stempel überlappt die handschriftliche Zahl:** Der schwierigste Fall überhaupt. Lieber das Feld leer lassen als raten
- **Zwei Stempel derselben Werkstatt am selben Tag:** Sind es zwei Vorgänge oder ein doppelt gestempelter? Der Nutzer muss entscheiden können
- **Doppelter Import derselben Seite:** Der Nutzer lädt dieselbe Seite ein zweites Mal hoch. Die Historie darf sich nicht stillschweigend verdoppeln
- **Eintrag existiert bereits von Hand:** Ein bereits abgetippter Eintrag wird erneut erkannt. Muss erkennbar sein, bevor er ein zweites Mal entsteht
- **Kilometerstand fehlt vollständig:** Manche alten Scheckhefte führen nur Datum und Stempel. `mileage_km` ist im Scheckheft ein Pflichtfeld — was dann?
- **Datum ohne Jahr:** Kommt bei Stempeln vor („12.03."). Nicht ergänzen, sondern nachfragen
- **Fremdsprachiges Scheckheft:** Importfahrzeuge haben englische oder italienische Vordrucke
- **Sehr viele Seiten auf einmal:** Ein volles Scheckheft kann zwanzig Seiten haben. Verarbeitungsdauer und Kontingent müssen das aushalten
- **Nutzer schließt den Browser mitten in der Prüfung:** Ist die Auswertung verloren oder findet er sie wieder?
- **Fahrzeug wird während der Prüfung übertragen (PROJ-7):** Wohin gehören die noch nicht bestätigten Einträge?
- **Kosten stehen im Scheckheft:** Selten, aber möglich. Dann sollen sie auch übernommen werden

## Technische Anforderungen

- `description` in `serviceEntrySchema` wird optional — **das ändert auch das bestehende manuelle Formular aus PROJ-3**, das bereits ausgeliefert ist
- Die Zuordnung Dokument → Eintrag muss **ein Dokument auf mehrere Einträge** abbilden können. Die heutige Verknüpfung (`vehicle_documents.service_entry_id`) leistet nur das Gegenteil
- Bestehende Uploadgrenzen gelten weiter: PDF, JPEG, PNG, WebP bis 10 MB
- Die Auswertung darf die Bedienbarkeit der übrigen Seiten nicht blockieren
- Nicht bestätigte Erkennungsergebnisse dürfen nicht in Auswertungen einfließen (PROJ-27, PROJ-28)
- Auftragsverarbeitungsvertrag mit dem Auswertungsdienstleister, Eintrag im Verarbeitungsverzeichnis, Ergänzung der Datenschutzerklärung — **vor** der Auslieferung
- Die Kosten je Dokument sind vor der Umsetzung an echten Belegen zu messen. Die vorliegende Schätzung von etwa 0,2 Cent stammt aus Listenpreisen, nicht aus einer Messung

## Offene Entscheidungen

- **Bezugsgröße des Kontingents.** „Seiten pro Monat" passt nicht zum Nutzungsmuster: Ein Scheckheft-Import ist ein **einmaliger** Vorgang je Fahrzeug, kein wiederkehrender. Ein Monatskontingent bestraft genau den Fall, für den das Feature gebaut wird — die Ersteinrichtung mit zwanzig Seiten. Naheliegender wäre ein Kontingent **je Fahrzeug** (deckt den Erstimport ab) oder eine Kombination: großzügig beim ersten Import, knapper im laufenden Betrieb für Rechnungen
- **Höhe des Kontingents** — abhängig von der Bezugsgröße oben
- **Umgang mit fehlendem Kilometerstand**, obwohl `mileage_km` im Scheckheft ein Pflichtfeld ist: Feld ebenfalls optional machen, den Nutzer schätzen lassen, oder den Eintrag ohne Kilometerstand zulassen
- **Erkennen bereits vorhandener Einträge** — ob und woran ein Duplikat erkannt wird (Datum plus Kilometerstand? Datum plus Werkstatt?)
- **Ob nicht bestätigte Erkennungsergebnisse zwischengespeichert werden**, damit ein abgebrochener Prüfvorgang fortsetzbar ist — oder ob der Import dann von vorn beginnt
- **Ob der Nutzer die Auswertung pro Dokument oder einmalig für sein Konto freigibt** (Datenschutz-Einwilligung)
- **Ob Fremdsprachen unterstützt werden** oder ein Hinweis genügt

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Entscheidungen (2026-08-05)

| Frage | Entscheidung |
|---|---|
| Wartezeit bei vielen Seiten | **Hintergrundauftrag.** Der Nutzer lädt hoch und wird benachrichtigt, wenn die Ergebnisse bereitliegen |
| Unbestätigte Ergebnisse | **Serverseitig als Entwurf gespeichert**, damit ein unterbrochener Prüfvorgang fortsetzbar ist |
| Kilometerstand | **Pflichtfeld bleibt.** Der Import lässt es leer, der Nutzer trägt vor der Übernahme eine Zahl ein |
| Kontingent | **Je Fahrzeug**, nicht pro Monat |

### Der Ablauf

```
1. Seiten wählen      Nutzer fotografiert oder wählt Dateien
                      Kontingent wird vorher angezeigt
        |
2. Auftrag läuft      Auswertung im Hintergrund
                      Nutzer kann das Fenster schließen
        |
3. Benachrichtigung   "Deine Scheckheft-Seiten sind ausgewertet"
        |
4. Prüfung            Beleg links, erkannte Einträge rechts
                      Nichts vorausgewählt
        |
5. Übernahme          Nur Angehaktes wird zum Scheckheft-Eintrag
                      Der Beleg bleibt allen Einträgen zugeordnet
```

### Aufbau der Oberfläche

```
Scheckheft (bestehende Seite)
+-- Einstieg "Scheckheft importieren"
+-- Hinweis auf einen offenen Import, falls vorhanden

Import-Assistent (neu)
+-- Schritt 1: Seiten wählen
|   +-- Kamera (vorhanden) oder Dateiauswahl
|   +-- Kontingent-Anzeige ("noch X Seiten für dieses Fahrzeug")
+-- Schritt 2: Auftrag läuft
|   +-- Fortschritt + Hinweis, dass man das Fenster schließen darf
+-- Schritt 3: Prüfansicht
    +-- Belegansicht (Seite, vergrößerbar)
    +-- Liste der erkannten Einträge (chronologisch)
    |   +-- Eintragskarte, aufklappbar
    |       +-- alle Felder bearbeitbar
    |       +-- Kennzeichnung: erkannt / leer geblieben / vom Nutzer geändert
    |       +-- Warnung, wenn der Kilometerstand die Kette bricht
    +-- Fußleiste: "X von Y ausgewählt" — Übernehmen / Verwerfen

Dokumenten-Archiv (bestehende Seite)
+-- Upload-Formular (bestehend)
    +-- neu: "Daten aus diesem Dokument übernehmen"
```

### Welche Informationen gespeichert werden

**Import-Auftrag** — ein Vorgang, den der Nutzer gestartet hat
- Zu welchem Fahrzeug er gehört und wer ihn gestartet hat
- Welche hochgeladenen Seiten dazugehören
- Sein Zustand: eingereicht, läuft, bereit zur Prüfung, abgeschlossen, fehlgeschlagen
- Bei einem Fehlschlag: der Grund, in verständlicher Sprache

**Erkannter Eintrag (Entwurf)** — je Stempel oder Beleg einer
- Dieselben Angaben wie ein Scheckheft-Eintrag: Datum, Typ, Beschreibung, Kilometerstand, Werkstatt, Kosten, nächste Fälligkeit
- Zusätzlich je Feld die Herkunft: aus dem Dokument gelesen, leer geblieben, oder vom Nutzer geändert
- Auf welcher Seite die Angabe steht
- Sein Zustand: offen, übernommen, verworfen

> **Entwürfe sind ausdrücklich keine Scheckheft-Einträge.** Sie liegen getrennt und erscheinen nicht in der Historie, in keiner Auswertung, in keinem Export und nicht beim Fahrzeug-Transfer. Diese Trennung ist die technische Absicherung des Versprechens „nie ohne Bestätigung" — sie verlässt sich nicht darauf, dass die Oberfläche sich richtig verhält.

**Beleg-Zuordnung** — Änderung am Bestehenden
- Heute kann ein Dokument auf **höchstens einen** Scheckheft-Eintrag verweisen
- Künftig verbindet eine eigene Zuordnungsliste beliebig viele Einträge mit beliebig vielen Dokumenten
- Die heutigen Zuordnungen werden dabei übernommen, es geht nichts verloren

**Kontingent**
- Je Fahrzeug wird mitgezählt, wie viele Seiten bereits ausgewertet wurden
- Nur erfolgreich ausgewertete Seiten zählen — ein abgebrochener oder fehlgeschlagener Auftrag kostet nichts

### Technische Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Auswertung | Vision-Sprachmodell statt OCR-Bibliothek | Handschrift und Gummistempel sind der schwierigste Fall. Klassische OCR liefert dort flachen Text ohne Struktur, den man anschließend selbst zerlegen müsste. Das Modell liest Bild und Struktur in einem Schritt — und die bereits erlaubten Uploadformate sind genau die, die es verarbeitet |
| Ort der Auswertung | Ausschließlich serverseitig | Der Zugangsschlüssel darf nie auf ein Endgerät gelangen |
| Wartezeit | Hintergrundauftrag | Zwanzig Seiten sprengen jede vertretbare Wartezeit vor dem Bildschirm. Das Muster existiert im Projekt bereits (Terminerinnerungen, Preis-Alarme) |
| Benachrichtigung | Über die vorhandene Anzeige im Produkt | **Nicht ausschließlich per Push** — Push funktioniert in der Capacitor-App derzeit nicht (siehe PROJ-36). Wer sich darauf verlässt, baut eine Benachrichtigung, die App-Nutzer nie erreicht |
| Entwürfe | Getrennt von den echten Einträgen | Macht das Fortsetzen möglich und sichert zugleich zu, dass unbestätigte Maschinendaten nirgends auftauchen können |
| Beleg-Zuordnung | Eigene Zuordnungsliste | Eine Scheckheftseite erzeugt viele Einträge; das heutige Feld am Dokument kann nur einen aufnehmen |
| Kontingent | Zähler je Fahrzeug | Der Erstimport ist ein einmaliger Vorgang. Ein Monatszähler bestraft genau ihn |
| Ablage der Seiten | Im bestehenden Dokumenten-Archiv | Der Beleg ist ohnehin aufbewahrenswert. Keine zweite Ablage, keine doppelte Speicherverwaltung |
| Beschreibung | Wird optional | Das Scheckheft-Raster enthält keinen Fließtext. **Betrifft auch das ausgelieferte manuelle Formular aus PROJ-3** |
| Kilometerstand | Bleibt Pflicht | Er wandert in Wertentwicklung und Kostenanalyse weiter — eine Lücke dort wäre teurer als der Aufwand beim Eintragen |

### Was neu dazukommt

- **Ein Paket:** das offizielle Anthropic-SDK für die Auswertung der Seiten
- Sonst nichts: Upload, Dateiablage, Kamera, Benachrichtigungen und Hintergrundaufträge sind alle bereits vorhanden

### Was vor der Umsetzung geklärt sein muss

- **Höhe des Kontingents je Fahrzeug** — die Bezugsgröße steht, die Zahl nicht
- **Auftragsverarbeitungsvertrag** mit dem Auswertungsdienstleister, Verarbeitungsverzeichnis, Ergänzung der Datenschutzerklärung
- **Kostenmessung an echten Belegen** — die Schätzung von etwa 0,2 Cent je Seite stammt aus Listenpreisen, nicht aus einer Messung
- **Woran ein Duplikat erkannt wird**, wenn dieselbe Seite ein zweites Mal hochgeladen wird

## Implementierung — Frontend (2026-08-06)

### Was gebaut wurde

| Datei | Zweck |
|---|---|
| `src/lib/validations/scheckheft-import.ts` | Typen und Regeln, geteilt mit dem Backend. Enthält die Prüfung der Kilometer-Kette und die Ermittlung fehlender Pflichtfelder |
| `src/app/vehicles/[id]/scheckheft/import/page.tsx` | Serverseite: Zugriffsprüfung, lädt bestehende Einträge, offenen Auftrag und Kontingent |
| `src/components/scheckheft-import-wizard.tsx` | Der Assistent mit allen vier Zuständen: Seiten wählen, Auftrag läuft, Prüfansicht, fehlgeschlagen |
| `src/components/import-entry-card.tsx` | Eine erkannte Position: aufklappbar, alle Felder bearbeitbar, Herkunftskennzeichnung, Kilometer-Warnung |
| `src/components/service-log.tsx` | Einstieg „Importieren" neben „Neuer Eintrag" |

### Verhalten, das gegen die Spec gebaut wurde

- **Nichts ist vorausgewählt.** Übernehmen bleibt deaktiviert, solange kein Eintrag angehakt ist
- **Fehlende Pflichtfelder blockieren.** Ein ausgewählter Eintrag ohne Datum, Typ oder Kilometerstand verhindert das Übernehmen; die Fußleiste nennt die Anzahl
- **Kilometer-Kette** wird über bestehende Einträge **und** ausgewählte Entwürfe hinweg geprüft. Ein Ausreisser wird bewusst nicht zur neuen Messlatte, damit ein einzelner Lesefehler nicht die gesamte Folgekette umwirft. Der Nutzer hat die drei vorgesehenen Wege: korrigieren, als Tacho-Korrektur übernehmen, oder unverändert lassen
- **Herkunft je Feld** wird angezeigt: „fehlt — bitte ergänzen" bei leeren Pflichtfeldern, „nicht erkannt" bei leeren optionalen, „geändert" nach einer Korrektur
- **Beschreibung** ist in der Oberfläche bereits optional behandelt; die Schema-Änderung selbst gehört ins Backend
- **Kilometerstand** bleibt Pflicht, wie entschieden

### Schnittstelle, die das Backend liefern muss

| Route | Zweck |
|---|---|
| `POST /api/vehicles/[id]/scheckheft-import` | Seiten entgegennehmen, Auftrag anlegen → `ImportJob` |
| `GET /api/vehicles/[id]/scheckheft-import/[jobId]` | Zustand abfragen (der Assistent fragt alle 3 s, solange der Auftrag läuft) |
| `POST /api/vehicles/[id]/scheckheft-import/[jobId]/confirm` | Ausgewählte Entwürfe zu echten Einträgen machen |
| `POST /api/vehicles/[id]/scheckheft-import/[jobId]/discard` | Auftrag verwerfen |

Erwartete Tabellen: `scheckheft_import_jobs`, `scheckheft_import_documents` (mit `vehicle_id` und `page_number`), `scheckheft_import_drafts`.

### Bewusst nicht gebaut

- **Der zweite Einstieg im Dokumenten-Archiv** („Daten aus diesem Dokument übernehmen") fehlt. Der Assistent nimmt einzelne Rechnungen und TÜV-Berichte bereits entgegen, der zweite Einstieg wäre Bequemlichkeit, keine fehlende Fähigkeit. Er berührt ein 400-Zeilen-Formular und gehört in einen eigenen Durchgang
- **Die Benachrichtigung** „deine Seiten sind ausgewertet" ist noch nicht ausgelöst — sie entsteht dort, wo der Auftrag fertig wird, also im Backend. Sie muss über die Anzeige im Produkt laufen, **nicht** nur über Push (siehe PROJ-36)

### Offener Punkt in der Oberfläche

`PROVISIONAL_IMPORT_LIMIT_PER_VEHICLE` steht auf **30 Seiten** je Fahrzeug. Das ist ein Platzhalter, damit die Anzeige etwas zeigen kann — **keine getroffene Entscheidung.** Die Höhe des Kontingents ist laut Spec offen und gehört vor der Auslieferung ersetzt.

### Prüfstand

| Prüfung | Ergebnis |
|---|---|
| Build (`npm run build`) | erfolgreich, Route `/vehicles/[id]/scheckheft/import` registriert |
| Lint | 0 Fehler; keine Meldung zu den neuen Dateien |
| Typen (`tsc --noEmit`) | keine Fehler in den neuen oder geänderten Dateien |
| Unit-Tests | 643 grün, 32 Dateien |

**Nebenbefund:** `tsc --noEmit` meldet 10 Typfehler in zwei bestehenden Testdateien (`offline-banner.test.tsx`, `use-push-notifications.test.ts`). Sie stammen nicht aus dieser Arbeit und fallen beim Build nicht auf, weil dieser Testdateien nicht übersetzt. Die Notiz zu PROJ-17 („Typen: 0 Fehler") bezog sich offenbar auf den Build, nicht auf den vollständigen Typlauf.

**Noch nicht geprüft:** Der Ablauf wurde nicht im Browser durchgespielt — ohne Backend gibt es keinen Auftrag, der laufen könnte. Die Prüfansicht ist bisher nur statisch verifiziert.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_

## Nachtrag 2026-09-21: Der Cron-Eintrag blockierte die gesamte Auslieferung

**Gefunden** bei der Suche danach, warum PROJ-37 und PROJ-38 nicht in Produktion kamen — nicht durch einen Nutzerbericht.

Mit dem Arbeitsstand dieses Features kam ein Cron-Eintrag mit dem Takt `*/10 * * * *` in `vercel.json`. Auf einem Hobby-Konto sind nur **tägliche** Cron-Läufe erlaubt, und Vercel lehnt deshalb **jedes Deployment ab, das diese Datei enthält** — noch bevor ein Build startet:

```
cron_jobs_limits_reached — Hobby accounts are limited to daily cron jobs.
This cron expression (*/10 * * * *) would run more than once per day.
```

**Warum das so lange unbemerkt blieb:** Die Ablehnung erzeugt keinen fehlgeschlagenen Build, sondern überhaupt keinen Eintrag. Im Dashboard stand weder eine Fehlermeldung noch ein roter Deploy — es sah aus, als hätte GitHub schlicht nichts gemeldet. Erst ein Deployment-Versuch über die API brachte die Meldung zutage.

**Die Folge:** Seit dem 2026-09-06 (Commit `279c6ba`, dem letzten ausgerollten) wurde jeder Push still verworfen. Zwei fertige, abgenommene Features warteten zwei Wochen auf eine Auslieferung, die nie stattfand.

**Behoben** durch Entfernen des Eintrags aus `vercel.json`. Die Route `/api/cron/process-imports` bleibt bestehen und lässt sich manuell oder extern anstoßen; am Kopf der Datei steht der Zusammenhang.

**Für die Fertigstellung dieses Features zu klären:** Der Import braucht eine regelmäßige Verarbeitung. Möglich sind ein täglicher Takt, ein externer Auslöser oder der Pro-Plan. Wer den alten Eintrag zurückholt, legt damit erneut die gesamte Auslieferung still.
