# PROJ-26: Einzelkosten

## Status: Deployed
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
- [x] Eintrag anlegen mit Pflichtfeldern: Kostenart (Auswahlliste), Bezeichnung, Betrag, Datum
- [x] Optionale Felder: Teilenummer, Bezugsquelle/Händler, Menge, Einbaudatum, Notiz
- [x] Teilenummer, Menge und Einbaudatum werden nur bei der Kostenart "Ersatzteile" angeboten
- [x] Beträge werden in Cent gespeichert, Eingabe in Euro
- [x] Ein Eintrag kann optional einem bestehenden Scheckheft-Eintrag zugeordnet werden
- [x] Bei Zuordnung wird beim Speichern darauf hingewiesen, dass die Kosten dort möglicherweise bereits enthalten sind
- [x] Der Nutzer kann pro Eintrag kennzeichnen, ob der Betrag in den Kosten des verknüpften Scheckheft-Eintrags **bereits enthalten** ist
- [x] Als "bereits enthalten" gekennzeichnete Einträge werden in der Kostenanalyse **nicht erneut** gezählt, bleiben aber in der Liste sichtbar
- [x] Liste ist chronologisch sortiert (neuester Eintrag zuerst) und nach Kostenart filterbar
- [x] Liste ist nach Bezeichnung und Teilenummer durchsuchbar
- [x] Summe wird angezeigt, gesamt und je Kostenart
- [x] Eintrag kann bearbeitet und gelöscht werden (Löschen mit Bestätigungsdialog)
- [x] Leerer Zustand: Hinweis "Noch keine Einzelkosten erfasst" mit Button zum Anlegen
- [x] Validierung: Bezeichnung nicht leer, Betrag ≥ 0, Menge ≥ 1, Datum nicht in der Zukunft
- [x] Jede Kostenart ist als **Standkosten** oder **Fahrtkosten** klassifiziert — Grundlage für die Auswertung in PROJ-27
- [x] Zugriff folgt den Rollen aus PROJ-6
- [x] Erreichbar über die Fahrzeug-Navigation

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

### A) Komponenten-Struktur

```
Kosten-Bereich  (/vehicles/[id]/kosten)
+-- Unterreiter — erscheinen jetzt sichtbar, weil es zwei gibt
|   +-- Laufende Kosten        (PROJ-25, bestehend)
|   +-- [Einzelkosten]         ← dieses Feature
|   +-- Auswertung             ← PROJ-27, später
|
+-- Einzelkosten  (/vehicles/[id]/kosten/einzelkosten)
    +-- Kennzahlen-Leiste
    |   +-- Summe gesamt
    |   +-- Summe je Kostenart
    +-- Filter- und Suchleiste
    |   +-- Kostenart-Filter
    |   +-- Suchfeld (Bezeichnung, Teilenummer)
    +-- Schaltfläche "Einzelkosten erfassen"
    |   +-- Erfassungsdialog
    |       +-- Kostenart (Auswahl)
    |       +-- Bezeichnung, Betrag, Datum
    |       +-- nur bei "Ersatzteile": Teilenummer, Menge, Einbaudatum
    |       +-- Optional: Bezugsquelle, Notiz
    |       +-- Optional: Zuordnung zu einem Scheckheft-Eintrag
    |           +-- bei Zuordnung: Schalter "Betrag ist dort bereits enthalten"
    +-- Liste, chronologisch (neuester zuerst), seitenweise nachladend
    |   +-- Eintrag
    |       +-- Datum, Bezeichnung, Betrag
    |       +-- Kennzeichnung "im Scheckheft enthalten", falls zutreffend
    |       +-- Verweis auf den verknüpften Scheckheft-Eintrag
    |       +-- Bearbeiten / Löschen (Löschen mit Rückfrage)
    +-- Leerer Zustand ("Noch keine Einzelkosten erfasst")
```

### B) Datenmodell

**Neu: Einzelkosten.** Jeder Eintrag gehört zu genau einem Fahrzeug und hält fest:

- Eindeutige Kennung, Zugehörigkeit zum Fahrzeug, wer ihn erfasst hat
- Kostenart — aus fester Liste: Ersatzteile, Wertgutachten, Sonstiges
- Bezeichnung und Betrag (ganzzahliger Centbetrag)
- Datum der Ausgabe
- Optional: Bezugsquelle, Notiz
- Nur für Ersatzteile sinnvoll: Teilenummer, Menge, Einbaudatum
- Optionale Verknüpfung zu einem Scheckheft-Eintrag
- Kennzeichen, ob der Betrag im verknüpften Scheckheft-Eintrag bereits enthalten ist

**Bewusst nicht gespeichert:** die Einordnung als Stand- oder Fahrtkosten — sie ist eine Eigenschaft der Kostenart und liegt wie in PROJ-25 im Code.

### C) Tech-Entscheidungen

**C1 — Die Doppelzählung wird strukturell unmöglich gemacht, nicht abgesichert.**
Das ist die wichtigste Entscheidung dieses Features. Die Spec beschreibt eine gefährliche Kette: Wird ein Scheckheft-Eintrag gelöscht, muss die Verknüpfung gelöst **und** das Kennzeichen „bereits enthalten" zurückgesetzt werden — sonst verschwindet der Betrag dauerhaft aus der Auswertung, ohne dass es jemand bemerkt.

Statt das über eine Aufräumregel abzusichern, wird die Auswertungsregel so formuliert, dass der Fehler nicht entstehen kann: **Ein Betrag wird nur dann ausgeschlossen, wenn das Kennzeichen gesetzt ist *und* die Verknüpfung noch besteht.** Fällt der Scheckheft-Eintrag weg, zählt der Betrag automatisch wieder mit. Es gibt nichts nachzuziehen und nichts, das schiefgehen kann.

**C2 — Summen werden über alle Einträge gebildet, die Liste lädt seitenweise nach.**
Bei einer Restaurierung sind über hundert Positionen realistisch. Die Liste wird deshalb seitenweise nachgeladen — die Summen aber über den **gesamten** Bestand berechnet, nicht über die geladene Seite. In PROJ-24 ist genau dieser Fehler entstanden: Dort werden 500 Einträge geladen und die Kennzahl heißt trotzdem „gesamt" (offener Befund BUG-2). Hier wird er von vornherein vermieden.

**C3 — Rückgaben werden durch Löschen abgebildet.**
Entscheidung vom 2026-07-31. Kein Storno-Kennzeichen, keine Negativbeträge. Eine zurückgegebene Ware hat keine Kosten verursacht — für eine Kostenübersicht ist der Eintrag damit gegenstandslos. Das spart ein Feld und eine Sonderregel in der Auswertung. Wer die Kaufhistorie braucht, ist bei einem Warenwirtschaftssystem besser aufgehoben als hier.

**C4 — Keine Übernahme aus den Preis-Alarmen.**
Entscheidung vom 2026-07-31. Die Ersatzteil-Suche (PROJ-9) ist in der Fahrzeug-Navigation derzeit deaktiviert. Eine Übernahme aus einem Feature zu bauen, das für Nutzer gar nicht sichtbar ist, wäre verfrüht. Die Tabellen `part_alerts` und `part_alert_matches` bleiben unberührt — sie enthalten Suchalarme und gefundene Angebote, keine getätigten Käufe.

**C5 — Ersatzteil-spezifische Felder erscheinen nur bei der passenden Kostenart.**
Teilenummer, Menge und Einbaudatum sind für ein Wertgutachten sinnlos. Sie werden deshalb nur bei „Ersatzteile" eingeblendet. Das Datenmodell hält sie trotzdem für alle Einträge bereit — eine eigene Tabelle je Kostenart würde den generalisierten Schnitt aufgeben, den dieses Feature ausmacht.

**C6 — Der Betrag ist der Gesamtpreis für die erfasste Menge.**
Nicht der Stückpreis. Dieselbe Klasse von Missverständnis wie das Zahlungsintervall in PROJ-25, wo eine unklare Bedeutung zu einem Fehler um den Faktor 12 geführt hätte. Die Beschriftung im Formular muss das eindeutig machen.

**C7 — Kein eigener API-Endpunkt.**
Wie bei Scheckheft, Tankbuch und laufenden Kosten: Geschrieben wird direkt aus der Oberfläche, abgesichert über Zugriffsregeln in der Datenbank.

**C8 — Werkstatt-Teilekosten bleiben im Scheckheft.**
Wichtig für die spätere Auswertung: Teile, die über eine Werkstattrechnung liefen, sind im Scheckheft-Betrag enthalten und dort nicht von der Arbeitszeit trennbar. Sie zählen in PROJ-27 deshalb als **Reparatur**, nicht als **Ersatzteile**. Die Kostenart „Ersatzteile" umfasst ausschließlich selbst gekaufte Teile. Das ist eine bewusste Vereinfachung — die Alternative wäre, jede Werkstattrechnung in Teile und Arbeit aufzuspalten, was der Nutzer manuell tun müsste.

### D) Abhängigkeiten

**Keine neuen Pakete.** Alle Bausteine sind vorhanden: Formular, Dialog, Auswahl, Datumsauswahl, Suchfeld und Tabelle. Die Unterreiter-Leiste des Kosten-Bereichs existiert seit PROJ-25 und wird mit diesem Feature erstmals sichtbar, weil sie ab zwei Reitern eingeblendet wird.

### F) Implementierungsnotizen — Frontend (2026-07-31)

**Angelegte Dateien**

| Datei | Inhalt |
|---|---|
| `src/lib/validations/one-off-cost.ts` | Zod-Schema, Kostenarten, Stand-/Fahrtkosten-Zuordnung |
| `src/lib/one-off-costs.ts` | Doppelzählungsregel, Summen, Filter, Sortierung (reine Funktionen) |
| `src/lib/one-off-costs.test.ts` | 22 Unit-Tests |
| `src/components/one-off-cost-form.tsx` | Erfassungs- und Bearbeitungsdialog |
| `src/components/one-off-cost-list.tsx` | Kennzahlen, Filter, Suche, Liste mit Nachladen |
| `src/app/vehicles/[id]/kosten/einzelkosten/page.tsx` | Server-Seite mit Rechteprüfung |

**Geänderte Dateien:** `src/components/cost-area-nav.tsx` — der zweite Reiter ist eingetragen, die Unterreiter-Leiste wird damit erstmals sichtbar.

**Präzisierungen gegenüber dem Entwurf**

- **Der Doppelzählungsschutz ist genau eine Funktion** (`countsTowardTotal`): Ein Betrag wird nur ausgeschlossen, wenn das Kennzeichen gesetzt ist **und** die Verknüpfung noch besteht. Vier Tests decken alle Kombinationen ab, insbesondere den kritischen Fall „Kennzeichen gesetzt, Verknüpfung weg" — dort zählt der Betrag wieder mit, statt dauerhaft zu verschwinden.
- **Das Kennzeichen wird beim Entfernen der Zuordnung sofort zurückgesetzt** — schon im Formular, nicht erst in der Auswertung. Ein Eintrag kann damit gar nicht als „enthalten" markiert sein, ohne dass es etwas gäbe, worin er enthalten sein könnte.
- **„Sonstiges" bleibt ohne Stand-/Fahrtkosten-Zuordnung.** Darunter fallen Pflegemittel wie Additive — eine erzwungene Einordnung wäre geraten. `classifiedTotals` führt solche Beträge getrennt; PROJ-27 hat diesen Fall bereits als Edge Case vorgesehen.
- **Die Kennzahlen decken alle geladenen Einträge ab, nicht das Filterergebnis.** Zusätzlich wird die Gesamtzahl in der Datenbank abgefragt: Liegt sie über den geladenen 1.000, weist die Oberfläche ausdrücklich darauf hin, dass die Summen nur einen Teil abdecken. Genau dieser Hinweis fehlt in PROJ-24 (offener Befund BUG-2).
- **Ersatzteil-Felder erscheinen nur bei „Ersatzteile"** und werden beim Speichern anderer Kostenarten bewusst geleert, damit kein Wertgutachten mit einer Teilenummer in der Datenbank landet.
- **Löschrecht:** nur der Besitzer, einheitlich zu Tankbuch und laufenden Kosten.

**Noch nicht lauffähig:** Die Tabelle `one_off_costs` existiert noch nicht. Die Seite lädt und zeigt den leeren Zustand, Speichern schlägt fehl, bis `/backend` Tabelle und Zugriffsregeln angelegt hat.

### G) Implementierungsnotizen — Backend (2026-07-31)

**Migration:** `supabase/migrations/20260731_create_one_off_costs.sql` — **angewendet am 2026-07-31**

**Tabelle `one_off_costs`** (16 Spalten): `vehicle_id` mit ON DELETE CASCADE, Kostenart und Beträge wie in den Vorgänger-Features, Ersatzteil-Felder, optionale Scheckheft-Verknüpfung, Kennzeichen, Zeitstempel, `created_by`.

**Zwei Indexe:** `(vehicle_id, purchased_at DESC)` für Zugriff und Sortierung, sowie ein Teilindex auf `service_entry_id` — er wird beim Löschen eines Scheckheft-Eintrags gebraucht, um die betroffenen Verknüpfungen zu finden.

**RLS-Policies** (4, über `get_user_vehicle_role`): Lesen für alle Mitglieder, Anlegen und Bearbeiten für Besitzer und Werkstatt, **Löschen nur für den Besitzer** — einheitlich zu Tankbuch und laufenden Kosten.

#### Dabei gefundener und behobener Fehler: widersprüchliche Datenbankregel

Der erste Entwurf enthielt eine zusätzliche Prüfregel: *„Kennzeichen nur, wenn eine Verknüpfung besteht."* Das schien eine harmlose Absicherung — war aber ein **Widerspruch zum eigenen Design**.

`ON DELETE SET NULL` erzeugt absichtlich genau den Zustand, den die Regel verbot: Kennzeichen gesetzt, Verknüpfung weg. Die Folge im Test: **Der Scheckheft-Eintrag ließ sich gar nicht mehr löschen** — der Löschversuch scheiterte mit `23514 check constraint violation`, in einem Kontext, in dem niemand nach einer Regel auf einer ganz anderen Tabelle gesucht hätte.

Die Regel wurde entfernt. Die Konsistenz wird dort hergestellt, wo sie hingehört: Das Formular setzt das Kennzeichen zurück, sobald die Zuordnung entfällt, und die Auswertung schließt nur aus, wenn beides vorliegt. In der Migrationsdatei steht der Fall als Warnung, damit er nicht erneut „nachgerüstet" wird.

**Gegen die Datenbank verifiziert:**

| Prüfung | Ergebnis |
|---|---|
| Schema | RLS aktiv, 4 Policies, 3 Indexe, 1 Trigger, 16 Spalten |
| Löschverhalten des Fremdschlüssels | `SET NULL` bestätigt (`confdeltype = n`) |
| **Kernfall:** Scheckheft-Eintrag mit verknüpfter, als „enthalten" markierter Ausgabe löschen | Ausgabe **bleibt erhalten**, Verknüpfung leer, Kennzeichen bleibt gesetzt, **Betrag zählt wieder mit** |
| Fremder Nutzer: sehen / ändern / löschen | **0 / 0 / 0 Zeilen** |
| **Gegenprobe Besitzer: sehen / ändern** | **1 / 1 Zeile** |
| Supabase-Security-Advisors | keine Meldung zu `one_off_costs` |
| Testdaten entfernt | Tabelle danach 0 Zeilen |

**Keine API-Route** — bewusst, gemäß Tech Design C7. Die Fachlogik ist über 22 Unit-Tests abgedeckt.

### E) Offene Punkte für die Umsetzung

- **Veraltete Stelle in der Spec:** Der Edge Case „Wertgutachten mit mehrjähriger Gültigkeit" verweist darauf, es alternativ in PROJ-25 anzulegen. Diese Möglichkeit besteht nicht — PROJ-25 kennt nur Versicherung, Steuer, Unterstellung und Clubbeitrag. Entweder wird Wertgutachten dort ergänzt oder der Hinweis entfällt. Empfehlung: entfallen lassen, ein Gutachten ist eine einmalige Ausgabe
- Schwelle für das seitenweise Nachladen — Entscheidung in `/frontend`
- Ob der Kosten-Bereich zum Premium-Umfang nach PROJ-8 gehört, bleibt weiterhin offen (gilt für PROJ-25 bis PROJ-27 gemeinsam)

## QA Test Results

**Getestet:** 2026-07-31 · **Ergebnis: produktionsreif** (keine kritischen oder hohen Befunde)

### Testumfang

| Ebene | Umfang | Ergebnis |
|---|---|---|
| Unit (Vitest) | 22 Tests zu `one-off-costs.ts` | 22/22 grün |
| Unit gesamt (Projekt) | 398 Tests | 394 grün, 4 vorbestehende Fehlschläge (`auth.test.ts` ×3, `milestone.test.ts` ×1) — unabhängig von PROJ-26, bereits vor diesem Feature vorhanden |
| E2E unangemeldet | `tests/PROJ-26-einzelkosten.spec.ts`, 4 Tests × Chromium + Mobile Safari | 8/8 grün |
| E2E angemeldet | `tests/PROJ-26-einzelkosten-crud-auth.spec.ts`, 16 Tests | 16/16 grün |
| Regression | PROJ-24 und PROJ-25 vollständig (44 Tests) | 44/44 grün |
| Build | `npm run build` | erfolgreich |

Die angemeldeten Tests laufen gegen das Wegwerf-Fahrzeug des Testnutzers und räumen vor **und** nach dem Lauf auf. Nach Abschluss verifiziert: `one_off_costs` 0 Zeilen, keine Test-Scheckheft-Einträge übrig.

### Acceptance Criteria

| # | Kriterium | Ergebnis | Nachweis |
|---|---|---|---|
| 1 | Anlegen mit Kostenart, Bezeichnung, Betrag, Datum | ✅ | E2E „Eintrag ohne Scheckheft-Zuordnung wird erfasst" |
| 2 | Optionale Felder Teilenummer, Bezugsquelle, Menge, Einbaudatum, Notiz | ✅ | E2E, Feldsichtbarkeit + gespeicherte Werte |
| 3 | Teilefelder nur bei Kostenart „Ersatzteile" | ✅ | E2E „Teilefelder erscheinen nur bei …", inkl. Gegenprobe mit Wertgutachten |
| 4 | Beträge in Cent gespeichert, Eingabe in Euro | ✅ | Summenprüfung auf Cent genau (4990 / 17990) |
| 5 | Optionale Zuordnung zu einem Scheckheft-Eintrag | ✅ | E2E „Zuordnung zum Scheckheft …" |
| 6 | Hinweis auf mögliche Doppelerfassung bei Zuordnung | ✅ | E2E, Hinweistext erscheint erst mit gesetzter Zuordnung |
| 7 | Kennzeichen „bereits enthalten" pro Eintrag | ✅ | E2E KERN-Test 1 |
| 8 | Markierte Einträge zählen nicht erneut, bleiben sichtbar | ✅ | **E2E KERN-Test 1**: Summe unverändert, Eintrag mit Badge sichtbar, Betrag durchgestrichen |
| 9 | Liste chronologisch, nach Kostenart filterbar | ✅ | E2E „Liste ist … filterbar" |
| 10 | Suche über Bezeichnung und Teilenummer | ✅ | E2E, beide Wege einzeln geprüft |
| 11 | Summe gesamt und je Kostenart | ✅ | E2E „Summe je Kostenart wird ausgewiesen" |
| 12 | Bearbeiten und Löschen mit Bestätigungsdialog | ✅ | E2E, zwei eigene Tests |
| 13 | Leerer Zustand mit Hinweis und Anlegen-Button | ✅ | E2E „Leerer Zustand …" |
| 14 | Validierung: Bezeichnung, Betrag ≥ 0, Menge ≥ 1, Datum nicht in Zukunft | ✅ | E2E (Formular blockt leeres Absenden) + Unit-Tests + `CHECK`-Regeln in der Datenbank; künftige Daten sind im Kalender deaktiviert |
| 15 | Klassifikation Stand-/Fahrtkosten je Kostenart | ✅ | Unit-Tests zu `classifiedTotals`; „Sonstiges" bleibt bewusst unklassifiziert |
| 16 | Zugriff folgt den Rollen aus PROJ-6 | ✅ | RLS-Prüfung unten, alle drei Rollen |
| 17 | Erreichbar über die Navigation | ✅ | E2E „über die Kosten-Unternavigation erreichbar" |

**17 von 17 erfüllt.**

### Der Kernfall, durch die echte Oberfläche

Die Kette aus Tech Design C1 wurde nicht nur auf Datenbankebene, sondern vollständig durch die Oberfläche geprüft — genau der Ablauf, an dem sich die Umsetzung zuvor selbst ein Bein gestellt hatte:

1. Scheckheft-Eintrag über das Scheckheft anlegen
2. Ausgabe über 120,00 € anlegen, dem Eintrag zuordnen, als „enthalten" markieren
   → Eintrag sichtbar, Badge „im Scheckheft enthalten", **Summe unverändert**
3. Scheckheft-Eintrag über das Scheckheft löschen
   → Ausgabe **lebt weiter**, Badge und Hinweis verschwunden, **Summe um exakt 120,00 € gestiegen**

Damit ist belegt, dass ein einmal markierter Betrag nicht dauerhaft und unbemerkt aus der Auswertung verschwinden kann. Dieser Test hätte die zwischenzeitlich eingebaute `CHECK`-Regel sofort gefunden — sie machte Schritt 3 unmöglich.

### Edge Cases

| Fall | Ergebnis |
|---|---|
| Doppelerfassung Ausgabe ↔ Scheckheft | ✅ Kernfall, siehe oben |
| Eintrag ohne Zuordnung | ✅ kein Hinweis, kein Kennzeichen, zählt normal |
| Verknüpfter Scheckheft-Eintrag gelöscht | ✅ Kernfall, siehe oben |
| Teil gekauft, nie verbaut | ✅ Einbaudatum leer möglich, Betrag zählt |
| Negativbetrag | ✅ abgewiesen (`amount_cents >= 0` in Zod und Datenbank) |
| Menge > 1 | ✅ Formular beschriftet den Betrag ausdrücklich als Gesamtpreis |
| Sehr viele Einträge | ✅ 25 pro Seite mit Nachladen; Kennzahlen über **alle** geladenen Einträge, Obergrenze 1000 mit sichtbarem Hinweis bei Abschneidung |
| Kennzeichen ohne Zuordnung | ✅ Formular setzt es zurück, Auswertung ignoriert es |

### Sicherheitsaudit (Red Team)

Alle Prüfungen in einer zurückgerollten Transaktion mit gesetzten JWT-Claims, jeweils **mit Gegenprobe** — ohne die wäre „0 Zeilen" auch bei einer leeren Tabelle erfüllt.

| Rolle / Angriff | Ergebnis |
|---|---|
| Fremder Nutzer: lesen | **0 Zeilen** (Kontrolleintrag vorhanden) |
| Fremder Nutzer: anlegen | **blockiert** (`42501`) |
| Fremder Nutzer: ändern / löschen | **0 / 0 Zeilen** |
| Betrachter (PROJ-6): lesen | **1 Zeile** — korrekt, Leserecht |
| Betrachter: anlegen | **blockiert** (`42501`) |
| Betrachter: ändern / löschen | **0 / 0 Zeilen** |
| **Gegenprobe Besitzer: lesen / ändern / löschen** | **1 / 1 / 1 Zeile** |
| XSS über Bezeichnung, Bezugsquelle, Notiz | kein `dangerouslySetInnerHTML` in den Komponenten, React escapt durchgängig |
| Fremde Daten im HTML der Route | ✅ nicht enthalten (E2E unangemeldet) |
| Supabase-Security-Advisors | keine Meldung zu `one_off_costs`; die vorhandenen Warnungen sind projektweit und älter als dieses Feature |

### Gefundene Fehler

**BUG-1 (Low): Verknüpfung auf einen fremden Scheckheft-Eintrag ist technisch möglich**

Die Datenbank prüft nicht, ob der verknüpfte Scheckheft-Eintrag zum selben Fahrzeug gehört. Ein Besitzer kann per direktem API-Aufruf `service_entry_id` auf einen Eintrag eines fremden Fahrzeugs setzen — im Test bestätigt (1 Zeile geändert, Verknüpfung gesetzt).

*Warum trotzdem niedrig:* Über die Oberfläche nicht erreichbar, die Auswahlliste zeigt per RLS nur eigene Einträge. Es werden **keine fremden Daten gelesen oder verändert**; sichtbar wird nichts vom fremden Eintrag. Die Folge trifft ausschließlich den Angreifer selbst — seine eigene Ausgabe verschwindet aus seiner eigenen Summe. Ein Rateangriff auf UUIDs ist praktisch aussichtslos.

*Empfehlung:* Trigger oder zusammengesetzter Fremdschlüssel, der Gleichheit des Fahrzeugs erzwingt. Vor PROJ-27 sinnvoll, da die Auswertung sonst auf einer Annahme aufsetzt, die die Datenbank nicht garantiert.

**Keine weiteren Befunde.** Zwei anfängliche Fehlschläge im E2E-Lauf waren Testfehler, keine Produktfehler: die Kennzahl-Karte wurde über einen mehrdeutigen Selektor gesucht, und „im Scheckheft enthalten" kommt sowohl im Badge als auch im Hinweistext vor (Playwright-Strict-Mode). Beides in den Tests behoben.

### Offene Punkte aus früheren Features (unverändert)

- PROJ-24 BUG-2: Kennzahl „gesamt" bei mehr als 500 Tankvorgängen irreführend — in PROJ-26 durch den Abschneide-Hinweis bereits richtig gelöst
- PROJ-24 BUG-3: Kilometerstand-Warnung fehlt beim Bearbeiten
- Projektweit: 27 E2E-Fehlschläge in älteren Features, überwiegend durch das Cookie-Banner, das Klicks abfängt. Eine zentrale Lösung in der Playwright-Konfiguration wäre möglich, ändert aber das Testverhalten anderer Features — Entscheidung liegt beim Nutzer
- Ob der Kosten-Bereich zum Premium-Umfang nach PROJ-8 gehört, ist weiterhin offen (PROJ-25 bis PROJ-27 gemeinsam)

### Empfehlung

**Produktionsreif.** BUG-1 ist ein Datenintegritäts-Thema ohne Sicherheitswirkung und blockiert das Deployment nicht — er sollte aber vor PROJ-27 behoben werden.

## Deployment

- **Deployed:** 2026-07-31
- **Commits:** `5e4721b` — `feat(PROJ-26): Implement Einzelkosten` · `6b6d5d5` — `test(PROJ-26): Add QA test results`
- **Produktion:** https://www.oldtimer-docs.com
- **Migrationen:** `20260731185259_create_one_off_costs` und `20260731185357_drop_one_off_costs_inclusion_check` — beide angewendet, gegen die Datenbank verifiziert
- **Neue Env-Variablen:** keine. In Vercel ist nichts zu ergänzen
- **Neue Abhängigkeiten:** keine

### Vor dem Deployment geprüft

| Punkt | Ergebnis |
|---|---|
| `npm run build` | erfolgreich, Route `/vehicles/[id]/kosten/einzelkosten` im Manifest |
| `npm run lint` | 2 Fehler — beide vorbestehend in `cookie-consent-banner.tsx` und `landing-page.tsx`, keine PROJ-26-Datei betroffen |
| QA | Approved, 17/17 Kriterien, keine kritischen oder hohen Befunde |
| Migrationen | angewendet und verifiziert |
| Secret-Scan des Commits | sauber, `.env.local` nicht im Commit |
| Regression PROJ-24 / PROJ-25 | 44/44 grün |

**Auffälligkeit beim Vorbereiten:** Die Implementierung war zum Zeitpunkt des Deploy-Starts noch **gar nicht committet** — im Verlauf war nur der QA-Commit entstanden. Deshalb steht `test(PROJ-26)` in der Historie vor `feat(PROJ-26)`. Inhaltlich ohne Folgen, beide Commits gingen gemeinsam nach `main`.

### Nachprüfung in der Produktion

Die Weiterleitung einer unangemeldeten Anfrage auf `/login` beweist **nichts** — eine Kontrollprobe zeigte, dass der Proxy jede `/vehicles/*`-Route gleich behandelt, auch eine, die es nicht gibt. Verifiziert wurde deshalb angemeldet über einen echten Browserlauf gegen die Produktion (nur lesend, keine Daten geschrieben):

| Prüfung | Ergebnis |
|---|---|
| Anmeldung in der Produktion | ✅ |
| Unterreiter „Einzelkosten" im Kosten-Bereich sichtbar | ✅ |
| Seite lädt, leerer Zustand erscheint | ✅ |
| Erfassungsdialog öffnet — belegt, dass die Datenbankabfrage durchläuft | ✅ |
| Konsolenfehler auf Kosten- und Einzelkosten-Seite | **0** |

**Vorbestehender Befund außerhalb dieses Features:** Auf `/dashboard` tritt ein React-Hydration-Fehler (#418) auf. Durch Gegenprobe eingegrenzt — Scheckheft, Kosten und Einzelkosten sind fehlerfrei. Gehört nicht zu PROJ-26, sollte aber separat verfolgt werden.

### Offene Punkte

- **BUG-1 (Low)** aus dem QA-Bericht: Die Datenbank erzwingt nicht, dass ein verknüpfter Scheckheft-Eintrag zum selben Fahrzeug gehört. Über die Oberfläche nicht erreichbar, keine Sicherheitswirkung — **vor PROJ-27 beheben**, weil die Auswertung sonst auf einer Annahme aufsetzt, die die Datenbank nicht garantiert
- Veralteter Edge Case in dieser Spec: „Wertgutachten … alternativ in PROJ-25 anlegen" — diese Möglichkeit gibt es dort nicht. Empfehlung weiterhin: Hinweis streichen
