# PROJ-37: Werkstatt-Dashboard

## Status: Approved
**Created:** 2026-09-06
**Last Updated:** 2026-09-19

## Dependencies
- Requires: PROJ-1 (User Authentication) — Werkstatt-Nutzer brauchen ein Konto
- Requires: PROJ-6 (Rollen & Kollaboration) — liefert die Werkstatt-Rolle und die Mitgliedschaften, auf denen das Dashboard aufsetzt
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeugdaten für die Übersichtsliste
- Requires: PROJ-3 (Digitales Scheckheft) — Einträge, Kilometerstände und Fälligkeitsdaten
- Berührt: PROJ-30 (Fahrzeug-Navigation) — neuer Navigationspunkt
- Berührt: PROJ-8 (Freemium-Modell) — Kundenfahrzeuge dürfen das Fahrzeuglimit des Werkstatt-Nutzers nicht belasten

## Kontext
Werkstätten können heute über die Werkstatt-Rolle an einzelnen Fahrzeugen mitarbeiten, erreichen diese Fahrzeuge aber nur über die Sektion „Geteilte Fahrzeuge" im persönlichen Dashboard — eine Liste ohne Suche, ohne Terminübersicht und ohne Schnelleinstieg. Ab etwa einem Dutzend betreuter Fahrzeuge ist sie unbrauchbar.

Zielgruppe dieses Features ist die **Werkstatt**, nicht der Fahrzeugbesitzer. Der Nutzen für die Werkstatt ist die Terminübersicht über alle betreuten Fahrzeuge hinweg: Sie macht sichtbar, welcher Kunde wann wieder fällig ist, und ist damit das Werkzeug, das Kundenbindung erzeugt.

## User Stories
- Als Werkstatt-Nutzer möchte ich alle von mir betreuten Kundenfahrzeuge auf einer eigenen Seite sehen, damit ich sie nicht zwischen meinen privaten Fahrzeugen heraussuchen muss
- Als Werkstatt-Nutzer möchte ich die Fahrzeugliste durchsuchen können, damit ich ein Fahrzeug auch bei vielen Kunden in Sekunden finde
- Als Werkstatt-Nutzer möchte ich sehen, welche Arbeiten über alle Kundenfahrzeuge hinweg als nächstes fällig sind, damit ich Kunden rechtzeitig ansprechen und meine Auslastung planen kann
- Als Werkstatt-Nutzer möchte ich überfällige Termine sofort erkennen, damit mir kein Kunde durchrutscht
- Als Werkstatt-Nutzer möchte ich aus der Liste heraus direkt einen Scheckheft-Eintrag anlegen, damit ich die Arbeit direkt nach dem Werkstattbesuch dokumentieren kann, ohne mich durch das Fahrzeugprofil zu klicken
- Als Werkstatt-Nutzer möchte ich die Beträge meiner eigenen Einträge sehen, damit ich nachvollziehen kann, was ich für dieses Fahrzeug abgerechnet habe
- Als Fahrzeugbesitzer möchte ich sicher sein, dass die Werkstatt weder meine übrigen Kosten noch meine Kontaktdaten in ihrer Übersicht sieht, damit ich sie bedenkenlos einladen kann

## Acceptance Criteria

### Zugang und Sichtbarkeit
- [ ] Es existiert eine eigene Seite unter `/werkstatt`
- [ ] Der Navigationspunkt „Werkstatt" ist nur für Nutzer sichtbar, die bei mindestens einem Fahrzeug die Rolle `werkstatt` haben
- [ ] Ein Nutzer ohne Werkstatt-Rolle, der `/werkstatt` direkt aufruft, sieht keine fremden Daten, sondern wird auf das Dashboard geleitet
- [ ] Ein nicht angemeldeter Nutzer wird zur Anmeldung geleitet
- [ ] Das persönliche Dashboard bleibt unverändert die Startseite für eigene Fahrzeuge

### Fahrzeugliste
- [ ] Die Seite listet ausschließlich Fahrzeuge, bei denen der Nutzer die Rolle `werkstatt` hat
- [ ] Eigene Fahrzeuge des Nutzers (Rolle `besitzer`) erscheinen nicht in dieser Liste
- [ ] Fahrzeuge mit der Rolle `betrachter` erscheinen nicht in dieser Liste
- [ ] Jeder Listeneintrag zeigt: Marke, Modell, Baujahr, Kennzeichen (falls hinterlegt), letzter dokumentierter Kilometerstand und Datum des letzten Scheckheft-Eintrags
- [ ] Ein Klick auf einen Listeneintrag führt zum Fahrzeugprofil
- [ ] Ein Suchfeld filtert die Liste nach Marke, Modell und Kennzeichen; die Suche ist nicht case-sensitiv und filtert ohne Neuladen der Seite
- [ ] Die Liste ist sortierbar nach: nächste Fälligkeit (Standard), Fahrzeugname alphabetisch, Datum des letzten Eintrags
- [ ] Bei mehr als 25 Fahrzeugen wird die Liste seitenweise oder per Nachladen ausgegeben

### Fälligkeiten
- [ ] Ein Bereich „Anstehende Arbeiten" listet fahrzeugübergreifend alle Fälligkeiten aus Scheckheft-Einträgen und hinterlegten Fahrzeugterminen, sofern die Werkstatt-Rolle sie sehen darf
- [ ] Jeder Eintrag zeigt: Fahrzeug, Bezeichnung der fälligen Arbeit und Fälligkeitsdatum
- [ ] Die Liste ist nach Fälligkeitsdatum aufsteigend sortiert
- [ ] Überfällige Einträge stehen oben und sind visuell abgesetzt (Farbe plus Textkennzeichnung, nicht nur Farbe)
- [ ] Standardmäßig werden alle überfälligen Termine sowie Termine der nächsten 90 Tage angezeigt
- [ ] Ein Klick auf einen Fälligkeitseintrag führt zum betreffenden Fahrzeug
- [ ] Sind keine Termine im Zeitraum vorhanden, erscheint ein Hinweistext statt einer leeren Liste

### Schnellaktion
- [ ] Jeder Fahrzeug-Listeneintrag bietet eine Aktion „Eintrag anlegen"
- [ ] Die Aktion öffnet das Scheckheft-Formular für genau dieses Fahrzeug
- [ ] Nach dem Speichern kehrt der Nutzer zum Werkstatt-Dashboard zurück, und der neue Eintrag ist in der Liste berücksichtigt (letzter Eintrag, Kilometerstand, ggf. neue Fälligkeit)
- [ ] Nach dem Abbrechen kehrt der Nutzer ohne Änderung zum Werkstatt-Dashboard zurück

### Datensicht (Datensparsamkeit)
- [ ] Die Seite zeigt technische Fahrzeugdaten, Kilometerstände, Wartungsstand und Fälligkeiten
- [ ] Beträge werden ausschließlich für Einträge angezeigt, die dieser Werkstatt-Nutzer selbst angelegt hat
- [ ] Fremde Kostendaten (wiederkehrende Kosten, Einzelkosten anderer Nutzer, Tankbuch, Kaufpreis, Wertentwicklung, Kostenauswertung) sind auf dieser Seite weder sichtbar noch summiert
- [ ] Kontaktdaten des Fahrzeugbesitzers (E-Mail, Telefon, Adresse) werden nicht angezeigt
- [ ] Beträge werden in der Währung des jeweiligen Fahrzeugs ausgegeben (PROJ-36); eine Summenbildung über Fahrzeuge mit verschiedenen Währungen findet nicht statt
- [ ] Die serverseitige Zugriffskontrolle verhindert das Auslesen nicht freigegebener Daten auch bei direktem API-Aufruf — die Einschränkung darf nicht nur in der Oberfläche stattfinden

### Zustände
- [ ] Hat der Nutzer die Werkstatt-Rolle, aber kein Fahrzeug mehr (alle Zugriffe entzogen), erscheint ein erklärender Leerzustand statt einer leeren Seite
- [ ] Die Seite ist auf Mobilgeräten und Tablets vollständig bedienbar (Nutzung in der Werkstatt)
- [ ] Alle Texte sind auf Deutsch

## Edge Cases
- Was passiert, wenn der Besitzer den Zugriff entzieht? → Das Fahrzeug verschwindet beim nächsten Laden aus dem Werkstatt-Dashboard; bereits angelegte Einträge bleiben in der Fahrzeughistorie erhalten
- Was passiert, wenn das letzte Kundenfahrzeug entzogen wird? → Leerzustand mit Erklärung; der Navigationspunkt bleibt für die laufende Sitzung sichtbar und verschwindet spätestens beim nächsten Laden
- Was passiert, wenn ein Fahrzeug an einen neuen Besitzer transferiert wird (PROJ-7)? → Die Mitgliedschaft endet mit dem Transfer, das Fahrzeug verschwindet aus dem Dashboard; die eigenen Einträge bleiben Teil der übergebenen Historie
- Was passiert, wenn der Besitzer die Rolle von `werkstatt` auf `betrachter` herabstuft? → Das Fahrzeug verschwindet aus dem Werkstatt-Dashboard und erscheint wieder unter „Geteilte Fahrzeuge" im persönlichen Dashboard
- Was passiert, wenn ein Fahrzeug keinen Kilometerstand und keine Einträge hat? → Statt eines leeren Feldes erscheint „—"; das Fahrzeug bleibt in der Liste
- Was passiert, wenn eine Fälligkeit weit in der Vergangenheit liegt (z. B. mehrere Jahre)? → Sie wird als überfällig angezeigt und nicht ausgeblendet, damit Altlasten sichtbar bleiben
- Was passiert, wenn zwei Fahrzeuge dasselbe Kennzeichen tragen (Wechselkennzeichen, Tippfehler)? → Beide werden angezeigt; die Unterscheidung erfolgt über Marke, Modell und Baujahr
- Was passiert, wenn derselbe Nutzer bei einem Fahrzeug Besitzer und bei einem anderen Werkstatt ist? → Beide Ansichten existieren parallel und überschneiden sich nicht; jedes Fahrzeug erscheint nur in genau einer der beiden Listen
- Zählen Kundenfahrzeuge gegen das Fahrzeuglimit des Freemium-Modells (PROJ-8)? → Nein. Gezählt werden ausschließlich Fahrzeuge, bei denen der Nutzer Besitzer ist. Andernfalls würde die Zusammenarbeit den Werkstatt-Nutzer bestrafen
- Was passiert bei sehr vielen betreuten Fahrzeugen (z. B. 200)? → Liste seitenweise ausgeben; die Fälligkeitsliste bleibt auf den Zeitraum begrenzt, damit die Seite nicht unbrauchbar wird
- Was passiert, wenn die Werkstatt einen Eintrag anlegt und der Besitzer ihn später löscht? → Der Eintrag verschwindet aus allen Ansichten; das ist zulässig, da der Besitzer die Datenhoheit hat

## Non-Goals (bewusst nicht Teil dieses Features)
- Kein Betriebskonto und keine Mitarbeiterverwaltung — die Werkstatt bleibt ein einzelner eingeladener Nutzer
- Keine Kundenverwaltung, keine Aufträge, keine Rechnungsstellung, keine Terminbuchung
- Keine Anbindung an Werkstattsoftware, Kalender oder Warenwirtschaft
- Kein Werkstattverzeichnis und keine Bewertungen (Non-Goal laut PRD)
- Keine Möglichkeit für Werkstätten, sich selbst Zugriff auf ein Fahrzeug zu verschaffen — die Einladung geht weiterhin ausschließlich vom Besitzer aus
- Keine Benachrichtigungen an die Werkstatt bei anstehenden Terminen (mögliches Folge-Feature auf Basis von PROJ-23)

## Technical Requirements (optional)
- Sicherheit: Zugriff ausschließlich über bestehende Mitgliedschaften; die Einschränkung auf eigene Beträge muss serverseitig durchgesetzt werden, nicht nur in der Oberfläche
- Performance: Übersicht lädt bei bis zu 50 betreuten Fahrzeugen in unter 1 Sekunde; keine Einzelabfrage pro Fahrzeug
- Mobile: vollständige Bedienbarkeit ab 360 px Breite
- Sprache: Deutsch
- Barrierefreiheit: Überfälligkeit nicht ausschließlich über Farbe kennzeichnen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick

Das Werkstatt-Dashboard ist eine **neue Seite auf vorhandenem Fundament**. Es entsteht keine neue Tabelle, keine neue Rolle und kein neuer Zugriffsweg — die Mitgliedschaften aus PROJ-6 liefern bereits alles, was die Seite anzeigt. Gebaut werden im Wesentlichen drei Dinge: die Seite selbst, eine gebündelte Datenabfrage, die alle Kundenfahrzeuge in einem Zug beschafft, und eine Erweiterung der Leseregel für Fahrzeugtermine.

Das hält den Umfang klein und das Risiko gering: Der einzige Eingriff in bestehende Rechte ist die Termin-Freigabe, und die ist bewusst entschieden (siehe unten).

### Was sich an Zugriffsrechten ändert

| | Heute | Nach diesem Feature |
|---|---|---|
| Fahrzeugdaten, Scheckheft, Dokumente | Werkstatt darf lesen | unverändert |
| Scheckheft-Beträge auf der Fahrzeugseite | Werkstatt sieht alle | unverändert |
| Scheckheft-Beträge im neuen Dashboard | — | nur eigene Einträge |
| TÜV/HU- und Servicetermine | nur der Besitzer | Werkstatt darf **lesen**, weiterhin nur der Besitzer darf ändern |

Die Terminfreigabe ist die einzige Rechteänderung. Ohne sie bliebe die Terminübersicht halbblind, weil die HU — der häufigste Wiedervorlagegrund — bisher ausschließlich beim Besitzer liegt. Schreibrechte bleiben unangetastet.

Dass die Werkstatt im Dashboard nur eigene Beträge sieht, ist eine bewusst **zusätzliche** Beschränkung der neuen Ansicht und keine Verschärfung des Bestands. Die Fahrzeugseite bleibt, wie sie ist — damit entsteht kein Regressionsrisiko für Scheckheft, PDF-Export und Kostenauswertung.

### Seitenstruktur

```
/werkstatt (NEU — nur bei Werkstatt-Rolle an mind. einem Fahrzeug)
+-- Kopfbereich
|   +-- Titel + Anzahl betreuter Fahrzeuge
+-- Anstehende Arbeiten
|   +-- Terminliste (überfällig zuerst, dann nächste 90 Tage)
|   |   +-- Zeile: Fahrzeug | fällige Arbeit | Datum | Kennzeichnung "überfällig"
|   +-- Leerzustand "Keine Termine im Zeitraum"
+-- Kundenfahrzeuge
|   +-- Suchfeld (Marke, Modell, Kennzeichen)
|   +-- Sortierung (Fälligkeit | Name | letzter Eintrag)
|   +-- Fahrzeugliste
|   |   +-- Zeile: Fahrzeug | km-Stand | letzter Eintrag | nächste Fälligkeit
|   |   +-- Aktion "Eintrag anlegen" --> bestehendes Scheckheft-Formular
|   +-- Seitenweises Nachladen ab 25 Fahrzeugen
+-- Leerzustand "Keine Kundenfahrzeuge mehr"

/dashboard (bestehend — kleine Anpassung)
+-- "Geteilte Fahrzeuge" zeigt nur noch Betrachter-Fahrzeuge
+-- Verweiskachel "X Kundenfahrzeuge im Werkstattbereich" --> /werkstatt
```

Die Verweiskachel verhindert den unangenehmsten Nebeneffekt: Fahrzeuge, die aus dem gewohnten Dashboard verschwinden, ohne dass der Nutzer weiß, wohin.

### Komponenten

**Neu:**
- Seite `/werkstatt` — lädt die Daten serverseitig, wie es Dashboard und Fahrzeugseiten bereits tun
- Terminliste — Darstellung der fahrzeugübergreifenden Fälligkeiten
- Kundenfahrzeug-Liste — Suche und Sortierung laufen im Browser auf der geladenen Liste, ohne Serverrunde
- Zugangsprüfung für die Navigation — eine kleine Statusabfrage „Habe ich Werkstattzugang?", nach demselben Muster wie die bestehende Abo-Abfrage

**Bestehend, wird wiederverwendet:**
- Scheckheft-Formular (`service-entry-form`) — die Schnellaktion springt mit Rücksprungziel dorthin, es entsteht kein zweites Formular
- Kopfzeile und mobile Navigation — bekommen je einen zusätzlichen Punkt „Werkstatt", der nur bei Werkstattzugang erscheint
- shadcn/ui-Bausteine für Tabelle, Suchfeld, Badge und Karten

### Datenbeschaffung

Kern des Designs ist **eine gebündelte Abfrage** statt einer Abfrage pro Fahrzeug. Sie liefert für alle Fahrzeuge, bei denen der Nutzer die Werkstatt-Rolle hat:

- Fahrzeugstammdaten (Marke, Modell, Baujahr, Kennzeichen)
- letzter dokumentierter Kilometerstand und Datum des letzten Scheckheft-Eintrags
- offene Fälligkeiten aus beiden Quellen: Folgetermine an Scheckheft-Einträgen und die Fahrzeugtermine (TÜV/HU, Service)
- Beträge ausschließlich der Einträge, die dieser Nutzer selbst angelegt hat

Der letzte Punkt ist der wichtigste: **Die Betragsfilterung passiert in der Datenbankabfrage, nicht in der Oberfläche.** Damit erfüllt die Seite das Akzeptanzkriterium auch dann, wenn jemand die Schnittstelle direkt aufruft. Das Projekt nutzt dieses Muster bereits für Einladungen und Rollenprüfung.

### Datenmodell

**Keine neue Tabelle.** Gelesen wird aus vorhandenen Beständen:

```
Mitgliedschaften  --> welche Fahrzeuge, welche Rolle
Fahrzeuge         --> Stammdaten, Währung
Scheckheft        --> letzter Eintrag, km-Stand, Folgetermine,
                      Beträge (nur eigene, über den Ersteller-Vermerk)
Fahrzeugtermine   --> TÜV/HU und Service (neu für Werkstatt lesbar)
```

Einzige strukturelle Änderung: eine erweiterte Leseregel für die Fahrzeugtermine. Zusätzlich werden zwei Suchhilfen (Indizes) angelegt, damit die Abfrage über Mitgliedschaften und Fälligkeitsdaten auch bei vielen Fahrzeugen schnell bleibt.

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Eigene Seite statt Umschalter | Kein Eingriff in die bestehende Navigation, keine Umgewöhnung für private Nutzer. Wer keine Werkstattrolle hat, merkt vom Feature nichts |
| Serverseitiges Laden | Entspricht dem Muster von Dashboard und Fahrzeugseiten; die Seite ist beim ersten Bild vollständig, ohne Ladezustände |
| Eine gebündelte Abfrage statt einer je Fahrzeug | Bei 50 Kundenfahrzeugen ist der Unterschied zwischen einer und fünfzig Abfragen der Unterschied zwischen brauchbar und unbenutzbar |
| Betragsfilter in der Datenbank | Erfüllt das Kriterium „serverseitig durchgesetzt" und ist nicht durch direkten Schnittstellenaufruf umgehbar |
| Suche und Sortierung im Browser | Bei bis zu einigen hundert Zeilen sofort reagierend, ohne Serverlast und ohne zusätzliche Schnittstelle |
| Termine nur lesbar freigeben | Die Werkstatt braucht die Information, nicht die Hoheit darüber. Der Besitzer behält die Kontrolle über seine Termine |
| Schnellaktion verlinkt das bestehende Formular | Ein zweites Eingabeformular wäre doppelte Pflege und zweifaches Fehlerrisiko |
| Werkstattfahrzeuge aus „Geteilte Fahrzeuge" entfernen | Sonst stünde jedes Kundenfahrzeug an zwei Stellen; die Verweiskachel hält den Weg dorthin sichtbar |

### Auswirkungen auf bestehende Bereiche

| Bereich | Änderung |
|---|---|
| Dashboard | „Geteilte Fahrzeuge" filtert Werkstatt-Rollen heraus; neue Verweiskachel |
| Kopfzeile / mobile Navigation | zusätzlicher Punkt „Werkstatt", nur bei Werkstattzugang sichtbar |
| Fahrzeugtermine | erweiterte Leseregel für Werkstatt-Mitglieder |
| Scheckheft-Formular | zusätzliches Rücksprungziel nach dem Speichern; Verhalten sonst unverändert |
| Fahrzeugseiten | keine Änderung |

### Sicherheit

- Der Zugang zur Seite hängt an einer echten Mitgliedschaft, nicht an einem übergebenen Wert — ein direkter Aufruf ohne Werkstattrolle zeigt keine Daten
- Die Betragsbeschränkung wird in der Abfrage durchgesetzt, nicht in der Anzeige
- Die Terminfreigabe gilt ausschließlich lesend und ausschließlich für Werkstatt-Mitglieder; Betrachter erhalten sie nicht
- Kontaktdaten des Besitzers werden gar nicht erst geladen — sie sind kein Bestandteil der Abfrage
- Entzieht der Besitzer den Zugriff, verschwindet das Fahrzeug beim nächsten Laden; für die QA ist das ein Prüfpunkt

### Abhängigkeiten

**Keine neuen Pakete.** Alles ist mit den vorhandenen Bausteinen umsetzbar (Supabase, shadcn/ui, lucide-react).

### Offene Punkte für die Umsetzung

- Die Langsteher-Schwelle für „überfällig" ist datumsbasiert und braucht keine Einstellung; der 90-Tage-Vorausblick ist bewusst fest gewählt und kann später beweglich werden
- Ob die Verweiskachel im Dashboard dauerhaft bleibt oder nach einiger Zeit ausgeblendet wird, entscheidet die Umsetzung
- Für den Fall sehr vieler Kundenfahrzeuge (dreistellig) ist zu prüfen, ob die Terminliste zusätzlich begrenzt werden muss

## Implementation Notes (Frontend)

**Stand:** 2026-09-06 — Build erfolgreich, Lint ohne Fehler, 747/747 Unit-Tests grün (19 davon neu).

### Neue Dateien
- `src/lib/workshop-dashboard.ts` — Aufbereitung ohne Datenbankzugriff: Zusammenführung beider Terminquellen, Sortierung, Suche, Datums- und Betragsformate
- `src/lib/workshop-dashboard.test.ts` — 19 Tests, u. a. Kalendertag-Grenzen (heute ist nicht überfällig), Sortierung mit fehlenden Werten, Suche ohne Kennzeichen
- `src/app/werkstatt/page.tsx` — Server Component, lädt Mitgliedschaften, Einträge und Termine in drei gebündelten Abfragen
- `src/components/workshop-due-list.tsx` — Terminliste, überfällig doppelt gekennzeichnet (Farbe **und** Text)
- `src/components/workshop-vehicle-list.tsx` — Fahrzeugliste mit Suche, Sortierung, Nachladen in 25er-Schritten, Schnellaktion
- `src/app/api/workshop/access/route.ts` — schlanke Zugangsprüfung für die Navigation, liefert nur `hasAccess` und Anzahl
- `src/hooks/use-workshop-access.ts` — Hook nach dem Muster von `use-subscription`

### Geänderte Dateien
- `src/app/dashboard/page.tsx` — Werkstattfahrzeuge aus „Geteilte Fahrzeuge" entfernt, Verweiskachel ergänzt; Währungserkennung berücksichtigt weiterhin alle Mitgliedschaften
- `src/components/account-header.tsx` — Navigationspunkt „Werkstatt" (Desktop)
- `src/components/mobile-bottom-nav.tsx` — Navigationspunkt „Werkstatt" (mobil)
- `src/components/service-log.tsx` — neue Eigenschaften `autoNew` und `returnTo`; Formular öffnet direkt, Speichern **und** Abbrechen führen zurück
- `src/app/vehicles/[id]/scheckheft/page.tsx` — liest `?neu=1&from=werkstatt`; das Rücksprungziel wird gegen eine feste Liste geprüft, nicht aus der Adresse übernommen (sonst offene Weiterleitung)

### Bewusste Abweichungen von der Spec
1. **Leerzustand „keine Kundenfahrzeuge mehr" ist ein Redirect ins Dashboard.** Der Zustand „Rolle entzogen" ist von „nie eine Rolle gehabt" serverseitig nicht unterscheidbar — beide ergeben null Mitgliedschaften. Das Akzeptanzkriterium „wird auf das Dashboard geleitet" hat Vorrang bekommen; der beschriebene Leerzustand entfällt damit. Der Leerzustand für eine Suche ohne Treffer existiert.
2. **Fahrzeugtermine (TÜV/HU) erscheinen noch nicht.** Die Leseregel für `vehicle_due_dates` ist Backend-Arbeit; bis dahin liefert die Abfrage eine leere Liste, und die Terminübersicht speist sich allein aus den Folgeterminen der Scheckheft-Einträge. Die Seite funktioniert, ist aber bis zum Backend-Schritt unvollständig.
3. **Die Betragsfilterung liegt in der Server Component, noch nicht in einer Datenbankfunktion.** Sie ist damit serverseitig, aber nicht in der Abfrage selbst. Das Zusammenfassen in eine Datenbankfunktion ist Aufgabe von `/backend`.
4. **Kilometerstand ist der höchste erfasste Wert**, nicht der des jüngsten Eintrags — nach dem Import von Altbelegen (PROJ-35) ist der jüngste Eintrag nicht zwingend der aktuellste Stand.
5. **`can_edit_all` bleibt ohne Wirkung auf die Betragssicht.** Eine Werkstatt mit erweiterten Bearbeitungsrechten sieht im Dashboard trotzdem nur eigene Beträge.

## Implementation Notes (Backend)

**Stand:** 2026-09-06 — Build erfolgreich, Lint ohne Fehler, 27 Tests für dieses Feature grün (22 Logik, 5 API).

### Migration
`supabase/migrations/20260906_proj37_werkstatt_dashboard.sql` — **noch nicht angewendet**, siehe „Offener Schritt" unten. Keine neue Tabelle. Drei Teile:

**1. Leseregel für Fahrzeugtermine** — neue SELECT-Policy auf `vehicle_due_dates` für die Rolle `werkstatt`, geprüft über den bestehenden Helfer `get_user_vehicle_role`. Ausdrücklich vom Nutzer freigegeben (2026-09-06). Schreibrechte bleiben beim Besitzer, Betrachter erhalten nichts. Die bestehende Policy „Users manage own due dates" bleibt unverändert; Policies sind ODER-verknüpft.

**2. `get_workshop_dashboard()`** — eine Funktion statt drei Einzelabfragen. Verdichtet in der Datenbank: je Fahrzeug eine Zeile mit Kilometerstand, letztem Eintrag, eigener Eintragszahl, eigener Betragssumme und nächstem Termin, dazu die Terminliste aus beiden Quellen.
- `SECURITY DEFINER`, weil sonst je Fahrzeug eine Abfrage nötig wäre. Die Zugriffsprüfung liegt deshalb explizit im CTE `ws`: nur Fahrzeuge mit der Rolle `werkstatt` des **anrufenden** Nutzers. Ohne Sitzung kommt eine leere Antwort.
- `SET search_path = public` gegen Schema-Verwechslung bei `SECURITY DEFINER`.
- Beträge über `FILTER (WHERE created_by = auth.uid())` — **fremde Beträge verlassen die Datenbank nicht.** Damit hält das Akzeptanzkriterium auch bei direktem Funktionsaufruf.
- Ausführungsrecht nur für `authenticated`, `anon` und `PUBLIC` entzogen.
- Terminliste nach oben auf ein Jahr und 500 Zeilen begrenzt, nach unten offen — ein drei Jahre alter Termin bleibt sichtbar.

**3. Drei Indizes** — `vehicle_members(user_id, role)` als Einstiegspunkt, ein Teilindex auf `service_entries(vehicle_id, next_due_date) WHERE next_due_date IS NOT NULL` und `service_entries(vehicle_id, service_date DESC)` für die Aggregation.

### Geänderte und neue Dateien
- `src/app/werkstatt/page.tsx` — ruft jetzt `get_workshop_dashboard()` statt drei Einzelabfragen; das Ladelimit von 2000 Einträgen entfällt
- `src/lib/workshop-dashboard.ts` — neue Funktion `dueLabel()`; die Datenbank liefert nur Schlüssel, übersetzt wird in der Anzeige
- `src/app/api/workshop/workshop.test.ts` — 5 Tests: ohne Sitzung wird die Datenbank gar nicht erst gefragt, Filterung auf `user_id` **und** `role`, Fehler und fehlende Zählung fallen auf „kein Zugang" zurück

### Erledigte Punkte aus der Frontend-Übergabe
- Leseregel für `vehicle_due_dates` — erledigt (Teil 1)
- Gebündelte Datenbankfunktion, Ladelimit entfällt — erledigt (Teil 2)
- Indizes — erledigt (Teil 3)
- Betragsfilterung in der Abfrage statt in der Server Component — erledigt

### Offener Schritt
**Die Migration ist noch nicht auf der Datenbank.** Der Supabase-Zugang dieser Sitzung ist nicht authentifiziert (`SUPABASE_ACCESS_TOKEN` fehlt). Bis zur Anwendung läuft `/werkstatt` in einen Fehler, weil `get_workshop_dashboard()` fehlt — die Seite leitet dann ins Dashboard um, weil die leere Antwort wie „keine Kundenfahrzeuge" aussieht.

Anwenden über den Supabase SQL Editor mit dem Inhalt der Migrationsdatei — dasselbe Vorgehen wie bei den bestehenden Migrationen dieses Projekts.

### Nicht umgesetzt
`/api/workshop/access` bleibt eine eigene, schlanke Abfrage und wandert **nicht** in die Dashboard-Funktion: Der Endpunkt läuft bei jedem Seitenaufruf für die Navigation mit und soll nur zählen, nicht aggregieren.

## QA Test Results

**QA-Datum:** 2026-09-06
**Geprüft durch:** QA Engineer (Code-Prüfung, Unit-/Integrationstests, E2E, Sicherheitsaudit)
**Testlauf:** 755/755 Unit- und Integrationstests grün (40 Dateien), 12/12 neue E2E-Tests grün, Build erfolgreich, Lint ohne Fehler

### Wichtige Einschränkung dieser Prüfung

**Die Datenbankmigration ist nicht angewendet.** `get_workshop_dashboard()` existiert auf der Datenbank nicht — im E2E-Lauf belegt durch `PGRST202: Could not find the function public.get_workshop_dashboard`. Die Hauptansicht war damit **nicht prüfbar**: Fahrzeugliste, Terminübersicht, Suche, Sortierung, Paginierung, Betragsanzeige und Schnellaktion sind ungetestet.

Zusätzlich hat das E2E-Konto **keine Werkstatt-Rolle**. Selbst mit angewendeter Migration wäre die Hauptansicht nicht erreichbar. Für eine vollständige Abnahme wird ein zweites Testkonto benötigt, das an einem Fahrzeug des ersten Kontos die Rolle `werkstatt` hat.

Geprüft und belegt ist damit die **Zugangsgrenze**, nicht die Funktion dahinter.

### Ergebnisse je Akzeptanzkriterium

| Bereich | Kriterium | Status | Anmerkung |
|---|---|---|---|
| Zugang | Seite unter `/werkstatt` vorhanden | PASS | Als dynamische Route gebaut |
| Zugang | Navigationspunkt nur bei Werkstatt-Rolle | PASS | E2E: Punkt fehlt beim reinen Besitzer, nach Abwarten der Zugangsabfrage |
| Zugang | Direktaufruf ohne Rolle führt ins Dashboard | PASS | E2E bestätigt — siehe aber BUG-1 |
| Zugang | Nicht angemeldet → Anmeldung | PASS | E2E bestätigt |
| Zugang | Persönliches Dashboard bleibt Startseite | PASS | Regressionstest grün |
| Fahrzeugliste | Nur Fahrzeuge mit Rolle `werkstatt` | PASS (statisch) | CTE `ws` filtert auf `role = 'werkstatt'`; Betrachter- und eigene Fahrzeuge ausgeschlossen |
| Fahrzeugliste | Angezeigte Felder je Zeile | PASS (statisch) | Marke, Modell, Baujahr, Kennzeichen, km, letzter Eintrag |
| Fahrzeugliste | Klick führt zum Fahrzeugprofil | TEILWEISE | Nur der Fahrzeugname ist klickbar, nicht die Zeile — BUG-6 |
| Fahrzeugliste | Suche über Marke, Modell, Kennzeichen | PASS (Unit) | 4 Tests, inkl. Groß-/Kleinschreibung und Rand-Leerzeichen |
| Fahrzeugliste | Drei Sortierungen, Fälligkeit als Standard | PASS (Unit) | 4 Tests, inkl. Verhalten bei fehlenden Werten |
| Fahrzeugliste | Seitenweise ab 25 Fahrzeugen | PASS (statisch) | `PAGE_SIZE = 25`, Nachladen mit Zähler |
| Fälligkeiten | Beide Terminquellen zusammengeführt | NICHT PRÜFBAR | Migration fehlt |
| Fälligkeiten | Sortierung aufsteigend, überfällige oben | PASS (Unit) | 4 Tests |
| Fälligkeiten | Überfällig nicht nur farblich gekennzeichnet | PASS | Textform „seit N Tagen überfällig" (3 Tests) |
| Fälligkeiten | Überfällige plus nächste 90 Tage | PASS (Unit) | Untergrenze bewusst offen |
| Fälligkeiten | Leerer Zeitraum zeigt Hinweistext | PASS (statisch) | |
| Fälligkeiten | Klick führt zum Fahrzeug | PASS (statisch) | |
| Schnellaktion | Aktion je Zeile, öffnet Formular | NICHT PRÜFBAR | Kein Zugang zur Liste |
| Schnellaktion | Rückkehr nach Speichern **und** Abbrechen | PASS (statisch) | `returnTo` in beiden Pfaden; Ziel per fester Liste geprüft |
| Datensicht | Beträge nur eigener Einträge | PASS (statisch) | `FILTER (WHERE created_by = auth.uid())` in der Datenbank |
| Datensicht | Keine fremden Kostendaten | PASS (statisch) | Auswahl der Funktion enthält keine anderen Kostenquellen |
| Datensicht | Keine Kontaktdaten des Besitzers | PASS | Werden nicht geladen |
| Datensicht | Fahrzeugwährung, keine Mischsummen | PASS (statisch) | Summe je Fahrzeug, `toCurrency` je Zeile |
| Datensicht | Serverseitig durchgesetzt | PASS | Nicht durch direkten Aufruf umgehbar |
| Zustände | Leerzustand bei null Fahrzeugen | ABWEICHUNG | Bewusst durch Redirect ersetzt (dokumentiert) |
| Zustände | Mobil bedienbar | NICHT PRÜFBAR | Seite nicht erreichbar; siehe BUG-8 |
| Zustände | Alle Texte auf Deutsch | PASS | |
| Technik | Unter 1 s bei 50 Fahrzeugen | NICHT PRÜFBAR | Keine Daten, keine Migration |

**Zusammenfassung:** 21 bestanden, 1 teilweise, 1 dokumentierte Abweichung, 5 nicht prüfbar.

### Gefundene Fehler

#### BUG-1: Ausfall der Datenbankfunktion ist von „keine Kundenfahrzeuge" nicht unterscheidbar — **High**
**Datei:** `src/app/werkstatt/page.tsx:66-77`
**Beschreibung:** Schlägt der Aufruf von `get_workshop_dashboard()` fehl, wird der Fehler nur in die Server-Konsole geschrieben; die Seite arbeitet mit einer leeren Liste weiter und leitet anschließend ins Dashboard um. Für den Nutzer sieht ein Totalausfall exakt so aus wie „du betreust keine Fahrzeuge".
**Belegt im E2E-Lauf:** `Workshop dashboard RPC error: PGRST202 … Could not find the function public.get_workshop_dashboard` — der zugehörige Test blieb dabei grün, weil beide Zustände denselben Redirect erzeugen.
**Auswirkung:** Ein Werkstatt-Nutzer verliert kommentarlos den Zugang; im Betrieb würde niemand den Ausfall melden, weil die Anwendung ihn nicht als solchen zeigt. Auch die Testbarkeit leidet: Kein E2E-Test kann die beiden Fälle trennen.
**Empfehlung:** Fehlerfall und Leerfall trennen — bei einem Fehler eine Fehlerseite oder einen Hinweis anzeigen statt umzuleiten.

#### BUG-2: `LIMIT 500` ohne Sortierung wählt willkürliche Termine — **Medium**
**Datei:** `supabase/migrations/20260906_proj37_werkstatt_dashboard.sql` (Unterabfrage `dues`)
**Beschreibung:** Die Sortierung steht im `json_agg(... ORDER BY d.due_date)`, das `LIMIT 500` wirkt aber auf die **unsortierte** Menge darunter. Bei mehr als 500 Terminen im Zeitraum entscheidet die Datenbank, welche 500 zurückkommen — überfällige Termine können dabei entfallen.
**Reproduktion:** Werkstatt mit vielen Fahrzeugen und in Summe über 500 Terminen innerhalb eines Jahres.
**Empfehlung:** `ORDER BY due_date ASC` in die innere Abfrage ziehen, damit das Limit die ältesten behält.

#### BUG-3: Fahrzeuge oberhalb von 100 verschwinden ohne Hinweis — **Medium**
**Dateien:** Migration (CTE `ws`, `LIMIT 100`), `src/app/werkstatt/page.tsx:120-124`
**Beschreibung:** Die Funktion liefert höchstens 100 Fahrzeuge. Die Kopfzeile zeigt die Zahl der **gelieferten** Fahrzeuge und behauptet damit bei 130 betreuten Fahrzeugen „100 betreute Kundenfahrzeuge". Die Zugangsabfrage `/api/workshop/access` zählt dagegen ohne Grenze — beide Angaben widersprechen sich, und die Kürzung wird nirgends kenntlich gemacht.
**Empfehlung:** Entweder echte Seitenweise-Abfrage oder ein sichtbarer Hinweis auf die Begrenzung; in jedem Fall eine Gesamtzahl, die stimmt.

#### BUG-4: Tachokorrektur wird beim Kilometerstand ignoriert — **Medium**
**Datei:** Migration, CTE `agg` (`MAX(se.mileage_km)`)
**Beschreibung:** Das Feld `is_odometer_correction` kennzeichnet Einträge nach Tachotausch oder -korrektur. Die Anwendung wertet es an anderer Stelle aus (`src/lib/fuel-consumption.ts:81`, `src/lib/cost-analysis.ts:471`), das Werkstatt-Dashboard nicht: `MAX()` liefert nach einem Tachotausch dauerhaft den höheren Stand **vor** dem Tausch.
**Auswirkung:** Bei Oldtimern ist der Tachotausch kein Sonderfall. Die Werkstatt sieht einen Kilometerstand, den das Fahrzeug nicht hat, und plant Wartungsintervalle darauf.
**Empfehlung:** Dieselbe Behandlung wie in `cost-analysis.ts` übernehmen — ab der letzten Korrektur rechnen.

#### BUG-5: Derselbe Termin erscheint doppelt — **Medium**
**Dateien:** Migration (CTE `all_dues`), `src/components/workshop-due-list.tsx`
**Beschreibung:** Pflegt der Besitzer die HU sowohl als Folgetermin an einem Scheckheft-Eintrag als auch als Fahrzeugtermin, entstehen zwei Zeilen mit identischer Beschriftung („TÜV/HU") und identischem Datum. Eine Zusammenführung findet nicht statt.
**Reproduktion:** Fahrzeugtermin TÜV/HU auf ein Datum setzen, das auch als `next_due_date` an einem TÜV-Eintrag steht.
**Empfehlung:** Termine gleicher Beschriftung und gleichen Datums je Fahrzeug zusammenfassen.

#### BUG-6: Nur der Fahrzeugname ist klickbar, nicht die Zeile — **Low**
**Datei:** `src/components/workshop-vehicle-list.tsx:118-125`
**Beschreibung:** Das Kriterium verlangt „Ein Klick auf einen Listeneintrag führt zum Fahrzeugprofil". Klickbar sind nur der Name und die Schnellaktion; Klicks auf Kilometerstand, Datum oder Fälligkeit laufen ins Leere. Auf dem Mobilgerät ist das die überwiegende Fläche der Zeile.

#### BUG-7: Zugangsabfrage läuft auf jeder Seite mit — **Low**
**Dateien:** `src/components/account-header.tsx`, `src/components/mobile-bottom-nav.tsx`
**Beschreibung:** `useWorkshopAccess` feuert bei jedem Aufruf einer Seite mit Kopfzeile eine zusätzliche Anfrage, auch für Nutzer, die nie eine Werkstatt-Rolle hatten. Für die weitaus meisten Konten ist das ein dauerhafter Roundtrip mit dem Ergebnis „nein".
**Empfehlung:** Ergebnis im Server-Layout ermitteln und durchreichen oder für die Sitzung zwischenspeichern.

#### BUG-8: Mobile Navigation wird mit dem sechsten Punkt eng — **Low (nicht verifiziert)**
**Datei:** `src/components/mobile-bottom-nav.tsx`
**Beschreibung:** Mit Werkstattzugang **und** offenen Anfragen stehen sechs gleich breite Einträge in der unteren Leiste — bei 360 px rund 60 px je Eintrag für Beschriftungen wie „Einstellungen". Nicht verifizierbar, weil der Punkt ohne Werkstatt-Rolle nicht erscheint.
**Empfehlung:** Im Rahmen der offenen Abnahme mit einem Werkstattkonto bei 360 px prüfen.

### Sicherheitsaudit

| Prüfung | Ergebnis |
|---|---|
| `SECURITY DEFINER` ohne Zugriffsprüfung | Kein Befund — die Prüfung liegt explizit im CTE `ws` und bindet an `auth.uid()` |
| Suchpfad-Manipulation | Kein Befund — `SET search_path = public` gesetzt |
| Ausführungsrechte der Funktion | Kein Befund — `REVOKE` für `PUBLIC`/`anon`, `GRANT` nur für `authenticated` |
| Fremde Beträge über direkten Aufruf | Kein Befund — Filterung in der Datenbank, nicht in der Anzeige |
| Offene Weiterleitung über `?from=` | Kein Befund — Ziel gegen feste Liste geprüft, nicht übernommen |
| Datenabfluss über die Zugangsabfrage | Kein Befund — E2E prüft, dass die Antwort keine Kennungen enthält |
| Zugriff ohne Sitzung | Kein Befund — Seite leitet um, Funktion liefert leere Antwort, API meldet „kein Zugang" |
| Rechteausweitung über die neue Policy | Nur lesend, nur Rolle `werkstatt`; Betrachter erhalten nichts |
| Datensparsamkeit der neuen Policy | **Anmerkung (Low):** Die Policy gibt ganze Zeilen von `vehicle_due_dates` frei, also auch `user_id` des Besitzers und die Erinnerungs-Merker. Fachlich gebraucht werden nur Typ und Datum. |

### Regressionstest
- 755/755 Unit- und Integrationstests grün, davon 8 neu für dieses Feature
- Persönliches Dashboard: Aufruf, Überschrift und Fahrzeugliste unverändert (E2E)
- Scheckheft-Seite: unveränderte Signatur bis auf zwei optionale Eigenschaften; bestehende Aufrufe ohne Parameter verhalten sich wie zuvor
- Keine Änderung an bestehenden RLS-Policies; die neue Policy ist additiv

### Nicht geprüft
- Gesamte Hauptansicht (Migration fehlt **und** kein Konto mit Werkstatt-Rolle)
- Darstellung bei 375 px, 768 px und 1440 px für `/werkstatt`
- Firefox — im Projekt nicht als Playwright-Ziel eingerichtet (geprüft: Chromium und Mobile Safari/WebKit)
- Lastverhalten und das Performance-Kriterium

### Produktionsreife

**NICHT BEREIT** — ein Fehler der Stufe High.

**Vor dem Ausrollen zwingend:**
1. Migration anwenden (ohne sie ist das Feature funktionslos)
2. BUG-1: Fehlerzustand vom Leerzustand trennen

**Vor dem Ausrollen empfohlen:**
3. BUG-2 (`ORDER BY` vor dem Limit) und BUG-3 (Fahrzeuggrenze) — beide betreffen die Verlässlichkeit der Anzeige
4. BUG-4 (Tachokorrektur) — falsche Kilometerstände sind für die Zielgruppe ein Sachfehler, kein Schönheitsfehler

**Danach:**
5. BUG-5 (doppelte Termine), BUG-6, BUG-7, BUG-8
6. Zweites Testkonto mit Werkstatt-Rolle einrichten und die offenen Kriterien nachziehen — solange das fehlt, ist die Hauptansicht des Features unabgenommen

## Fehlerbehebung (2026-09-06)

Alle acht Befunde behoben. Build erfolgreich, Lint ohne Fehler, 12/13 E2E grün (1 mit Begründung übersprungen), Typprüfung sauber.

| Fehler | Stufe | Behebung |
|---|---|---|
| BUG-1 | High | `src/app/werkstatt/page.tsx` unterscheidet jetzt Fehler- und Leerfall: Bei einem Fehler erscheint ein Hinweis mit Weg zurück ins Dashboard statt einer stummen Weiterleitung |
| BUG-2 | Medium | `ORDER BY due_date ASC` in die innere Abfrage gezogen — das Limit greift auf einer sortierten Menge |
| BUG-3 | Medium | Funktion liefert `total_vehicle_count` ungekürzt; Kopfzeile nennt die echte Zahl, ein Hinweis benennt die Kürzung. `ws` sortiert vor dem Limit, die Auswahl ist dadurch wiederholbar |
| BUG-4 | Medium | Neues CTE `corr` ermittelt die jüngste Tacho-Korrektur je Fahrzeug; der Kilometerstand zählt erst ab diesem Datum — dieselbe Vorsicht wie in Tankbuch und Kostenanalyse |
| BUG-5 | Medium | `buildDueList` fasst Termine über Fahrzeug, Datum und Beschriftung zusammen (3 neue Tests) |
| BUG-6 | Low | Ganze Zeile klickbar über eine unsichtbare Fläche am Fahrzeug-Link; die Schnellaktion liegt darüber |
| BUG-7 | Low | Zugangsprüfung wandert in `src/lib/workshop-access.ts` und läuft serverseitig in den vier Seiten mit Kopfzeile. Hook und Endpunkt `/api/workshop/access` entfallen ersatzlos |
| BUG-8 | Low | Bei Werkstattzugang weicht „Einstellungen" ins Menü aus — die untere Leiste behält höchstens fünf Einträge |

### Auswirkungen auf Tests
- 3 neue Unit-Tests für die Zusammenfassung doppelter Termine
- Ein bestehender Test vergab zwei Fahrzeugnamen unter einer Kennung — eine Konstellation, die es real nicht gibt. Testdaten korrigiert, nicht die Logik
- E2E: Prüfung des entfallenen Endpunkts auf 404; Navigationspunkt wird jetzt im ausgelieferten HTML geprüft statt nach einer Netzwerkantwort
- Neuer E2E-Test für BUG-1; der Test zum Leerfall erkennt den Ausfallzustand und überspringt sich mit Begründung, statt beide Fälle zu vermischen

### Weiterhin offen
- **Die Migration ist nach wie vor nicht angewendet.** Die Korrekturen an BUG-2, BUG-3 und BUG-4 stecken in der Migrationsdatei und wirken erst danach. Da die Datei nie angewendet wurde, wurde sie geändert statt durch eine Folgemigration ergänzt
- Zweites Testkonto mit Werkstatt-Rolle für die Abnahme der Hauptansicht
- Beobachtung am Rande: Die Testsuite ist unter Last unzuverlässig. Auf dem **unveränderten** Stand fielen in zwei vollen Durchläufen ein bzw. zwei Tests aus (`document-archive.test.tsx`, `scheckheft-import.test.ts`), isoliert laufen beide grün. Betrifft dieses Feature nicht, sollte aber eigenständig verfolgt werden

## QA Test Results — zweiter Durchlauf

**QA-Datum:** 2026-09-06
**Anlass:** Nachprüfung der acht behobenen Fehler
**Ergebnis:** 7 von 8 bestätigt behoben, 1 Behebung erzeugt einen neuen Fehler (BUG-9). Zwei Befunde außerhalb dieses Features.

### Nachprüfung der Behebungen

| Fehler | Ergebnis | Beleg |
|---|---|---|
| BUG-1 | **Behoben, mit Einschränkung** | Der Ausfall wird sichtbar gemeldet — im E2E-Lauf bestätigt. Die Fehlerseite behauptet allerdings eine Rolle, die nicht geprüft wurde → BUG-9 |
| BUG-2 | Behoben | `ORDER BY due_date ASC` steht in der inneren Abfrage, das Limit greift auf sortierter Menge |
| BUG-3 | Behoben | `total_vehicle_count` ungekürzt; Kopfzeile nennt die echte Zahl, Hinweis benennt die Kürzung; `ws` sortiert vor dem Limit |
| BUG-4 | Behoben (nicht ausgeführt) | CTE `corr` und `FILTER` sind fachlich richtig; die Migration wurde nie gegen eine Datenbank ausgeführt — siehe Risiko unten |
| BUG-5 | Behoben | 3 neue Unit-Tests; Termine verschiedener Fahrzeuge und verschiedener Arbeiten am selben Tag bleiben getrennt |
| BUG-6 | Behoben | Zeilenfläche über `after:absolute after:inset-0`, Schnellaktion mit `z-10` darüber — gültiges Markup, keine verschachtelten Links |
| BUG-7 | Behoben | Hook und Endpunkt entfallen; E2E prüft den Endpunkt auf 404 und den Navigationspunkt im ausgelieferten HTML |
| BUG-8 | Behoben | Höchstens fünf Einträge in der unteren Leiste; „Einstellungen" weicht ins Menü aus |

### Neuer Fehler

#### BUG-9: Die Fehlerseite behauptet einen Werkstattzugang, den sie nicht geprüft hat — **Medium**
**Datei:** `src/app/werkstatt/page.tsx:83` und `:103`
**Beschreibung:** Im Fehlerzweig werden `AccountHeader` und `MobileBottomNav` mit fest gesetztem `hasWorkshopAccess` gerendert. Ob der Nutzer überhaupt eine Werkstatt-Rolle hat, ist an dieser Stelle unbekannt — die Abfrage, die das beantworten würde, ist ja gerade fehlgeschlagen. Ein Nutzer ohne jede Werkstatt-Rolle sieht dadurch den Navigationspunkt „Werkstatt" und den Satz „Deine Kundenfahrzeuge sind davon nicht betroffen", obwohl er keine betreut.
**Reproduktion:** Als Nutzer ohne Werkstatt-Rolle `/werkstatt` aufrufen, während die Datenbankfunktion fehlt — im aktuellen Zustand also jeder Aufruf. Bestätigt im E2E-Lauf: Das Testkonto besitzt keine Werkstatt-Rolle und erhält die Fehlerseite.
**Bewertung:** Keine fremden Daten sichtbar, keine Rechteausweitung — die Folgeseiten prüfen weiterhin serverseitig. Es ist eine falsche Aussage der Oberfläche, und sie entsteht ausgerechnet aus der Behebung, die Zustände sauber trennen sollte.
**Empfehlung:** Vor dem Aufruf der Datenbankfunktion den bereits vorhandenen `getWorkshopVehicleCount` verwenden: bei 0 wie bisher ins Dashboard leiten, sonst die Funktion aufrufen und im Fehlerfall die Störungsseite mit belegtem Zugang zeigen.

### Risiko: Die Migration ist nie ausgeführt worden

Kein Fehler, aber der größte offene Posten. Die Datei enthält inzwischen ein zusätzliches CTE, eine Fensterlogik über `FILTER` und eine geänderte Rückgabe — **nichts davon wurde je gegen eine Datenbank ausgeführt.** Syntaxfehler, Tippfehler in Spaltennamen oder ein unerwartetes Verhalten von `FILTER` in Verbindung mit `GROUP BY` würden erst beim Einspielen auffallen. Vor dem Ausrollen einmal ausführen und die Rückgabe gegen echte Daten ansehen.

### Befunde außerhalb dieses Features

#### BEFUND-A: Vier E2E-Tests von PROJ-30 sind dauerhaft rot — ~~High~~ **aufgeklärt am 2026-09-19: kein Produktfehler**

> **Nachtrag (2026-09-19):** Die Einstufung war zu hoch gegriffen. Die Navigation ist **nicht** defekt — die Tests maßen die Übersetzungszeit des Entwicklungsservers mit. Beleg: Derselbe Test zweimal hintereinander ausgeführt war im ersten Durchlauf rot und im zweiten grün. Behoben in `tests/PROJ-30-fahrzeug-navigation-auth.spec.ts` (erklärter Zeitrahmen für Seitenwechsel); der Spec läuft jetzt 18/18. Einzelheiten im Nachtrag der PROJ-30-Spezifikation.

Auf dem **unveränderten** Stand ohne PROJ-37-Änderungen scheitern in `tests/PROJ-30-fahrzeug-navigation-auth.spec.ts` vier Tests reproduzierbar: „keine zweite Reiterleiste", „Auswahl schließt das Panel (BUG-1)", „Unterbereich schließt das Panel (BUG-1)", „Navigation bleibt nach der Auswahl stehen". PROJ-30 steht in `INDEX.md` als **Deployed**. Das gehört nicht zu PROJ-37, sollte aber verfolgt werden — ein als ausgeliefert geführtes Feature hat eine rote Regressionsdecke.

#### BEFUND-B: Die Testsuite ist unter Last unzuverlässig — **Medium (Prozess)**
Die volle Unit-Suite verlor in drei Durchläufen 1, 2 bzw. 4 Tests — jedes Mal andere, jedes Mal isoliert grün (`document-archive.test.tsx`, `image-lightbox.test.tsx`, `scheckheft-import.test.ts`). Bei den E2E-Tests dasselbe Bild: Zwei PROJ-30-Tests fielen nur im großen Lauf aus, isoliert bestanden sie. Eine Suite, die pro Durchlauf zufällig bis zu vier Tests verliert, kann echte Regressionen nicht mehr zuverlässig anzeigen — jeder rote Lauf muss von Hand nachgeprüft werden, wie in diesem Durchgang geschehen.

### Testlage dieses Durchlaufs
- PROJ-37 E2E: 12 bestanden, 1 übersprungen (Migration fehlt, Begründung im Test hinterlegt)
- PROJ-37 Unit: 25/25 grün
- Build erfolgreich, Lint 0 Fehler, Typprüfung sauber
- Regression Fahrzeug-Layout: siehe BEFUND-A und BEFUND-B — keine Regression durch PROJ-37 nachweisbar, beide zusätzlichen Ausfälle waren isoliert grün

### Produktionsreife (zweiter Durchlauf)

**NICHT BEREIT** — nicht wegen der Fehlerlage, sondern wegen fehlender Verifikation.

Die Fehlerlage allein wäre vertretbar: kein Critical, kein High mehr in diesem Feature. Ausschlaggebend ist etwas anderes: **Die Kernfunktion ist bis heute nie ausgeführt worden.** Ohne angewendete Migration hat niemand — weder Mensch noch Test — jemals eine Fahrzeugliste, eine Terminübersicht oder einen Betrag dieser Seite gesehen.

**Vor dem Ausrollen:**
1. Migration einspielen und die Rückgabe der Funktion gegen echte Daten prüfen
2. BUG-9 beheben (kleiner Eingriff, der vorhandene Helfer genügt)
3. Zweites Konto mit Werkstatt-Rolle anlegen und die Hauptansicht abnehmen — 5 Kriterien sind weiterhin ungeprüft

**Unabhängig davon:** BEFUND-A und BEFUND-B betreffen das Projekt insgesamt und sollten eigene Vorgänge bekommen.

## Fehlerbehebung BUG-9 (2026-09-06)

**Behoben in:** `src/app/werkstatt/page.tsx`

Die Werkstatt-Rolle wird jetzt **vor** der Übersicht geprüft, über den bereits vorhandenen `getWorkshopVehicleCount`. Sind es null Fahrzeuge, führt der Weg wie zuvor ins Dashboard — die Störungsseite erreicht damit nur noch, wer tatsächlich Kundenfahrzeuge betreut. Der Zugang ist an dieser Stelle belegt statt behauptet.

Kosten: eine zusätzliche Zählabfrage je Aufruf der Werkstattseite. Sie ist leichtgewichtig (`count`, `head: true`) und ersetzt eine Aussage, die die Oberfläche nicht treffen konnte.

Die Prüfung auf eine leere Rückgabe bleibt bestehen: Wird der Zugriff zwischen den beiden Abfragen entzogen, greift weiterhin die Weiterleitung.

### Belegt durch den Testlauf

Die beiden Tests haben ihre Rollen getauscht — genau wie erwartet:

| Test | Vorher | Jetzt |
|---|---|---|
| „Ohne Werkstatt-Rolle führt der direkte Aufruf ins Dashboard" | übersprungen (Fehlerseite kam dazwischen) | **bestanden** |
| „QA BUG-1: Ein Ausfall wird gezeigt" | bestanden (Testkonto sah die Fehlerseite) | übersprungen (Konto erreicht sie nicht mehr) |

Damit ist der Leerfall wieder prüfbar, **auch ohne angewendete Migration** — vorher verdeckte der Ausfall dieses Kriterium.

**Stand:** Build erfolgreich, Lint 0 Fehler, Typprüfung sauber, 12/13 PROJ-37-E2E grün (1 übersprungen, Begründung im Test).

**Weiterhin offen:** Migration einspielen und gegen echte Daten prüfen; zweites Konto mit Werkstatt-Rolle für die Abnahme der Hauptansicht (5 Kriterien). Die Produktionsreife-Einschätzung des zweiten Durchlaufs bleibt bestehen: Die Kernfunktion ist nie ausgeführt worden.

## Migration angewendet (2026-09-19)

Ausgeführt über die Supabase-Management-API, gezielt diese eine Datei. Bewusst kein `supabase db push`: Die Altmigrationen dieses Projekts liefen von Hand im SQL Editor und stehen nicht in der Migrationstabelle — ein Push hätte versucht, sie alle erneut anzuwenden.

### Was tatsächlich in der Datenbank steht

| Prüfung | Ergebnis |
|---|---|
| Policy `Werkstatt can view vehicle due dates` | vorhanden |
| Funktion `get_workshop_dashboard` | vorhanden |
| Die drei Indizes | alle drei vorhanden |
| Ausführungsrechte | `authenticated`, `service_role`, `postgres` — **`anon` nicht**, der `REVOKE` hat gegriffen |
| Aufruf ohne Sitzung | `{"vehicles":[],"dues":[],"total_vehicle_count":0}` — früher Ausstieg greift |

### Die Rechenlogik gegen echte Daten

Das Risiko aus dem zweiten QA-Durchlauf — „nie ausgeführt" — ist damit erledigt. Geprüft wurde der Rumpf der Funktion über vorhandene Scheckheft-Einträge, ohne etwas zu schreiben (`ws` durch ein konkretes Fahrzeug ersetzt, reine Leseabfrage):

- **Aggregation** liefert Kilometerstand, letzten Eintrag, eigene Eintragszahl und Betragssumme (2 Einträge, 150 EUR) korrekt
- **Tacho-Korrektur** (BUG-4) ist aktiv; beim geprüften Fahrzeug liegt die Korrektur auf dem höchsten Stand, Ergebnis daher identisch mit der alten Rechnung — kein Gegenbeweis, aber der Zweig läuft
- **Beide Terminquellen** funktionieren; die Termine des Testfahrzeugs stammen aus `vehicle_due_dates` (TÜV/HU 2027-02-01, Service 2027-04-12) — genau die Quelle, die für die Werkstatt vorher unzugänglich war
- **`DISTINCT ON`** wählt den früheren der beiden als nächsten Termin
- **JSON-Struktur** stimmt mit dem TypeScript-Typ der Seite überein

### Anwendung gegen die laufende App
PROJ-37-E2E: 12 bestanden, 1 übersprungen. Übersprungen wird jetzt der BUG-1-Test — es gibt keinen Ausfall mehr zu prüfen. Der Test zum Leerfall greift wieder regulär. Im Serverprotokoll erscheint kein `PGRST202` mehr.

### Der verbleibende Grund, warum die Hauptansicht unabgenommen bleibt

**Die Tabelle `vehicle_members` ist leer** — im ganzen Projekt existiert keine einzige Mitgliedschaft, weder Werkstatt noch Betrachter. Niemand kann die Hauptansicht erreichen, weil niemand die Rolle hat. Die fünf offenen Akzeptanzkriterien (Fahrzeugliste, Terminübersicht, Suche, Sortierung, Schnellaktion) bleiben deshalb ungeprüft.

Für die Abnahme wird eine echte Werkstatt-Mitgliedschaft benötigt: ein zweites Konto, das an einem Fahrzeug des Testkontos die Rolle `werkstatt` erhält. Das ist eine Datenänderung und wurde bewusst nicht ohne Auftrag vorgenommen.

## QA Test Results — dritter Durchlauf (Abnahme der Hauptansicht)

**QA-Datum:** 2026-09-19
**Anlass:** Werkstatt-Testkonto vorhanden, Migration angewendet — die fünf offenen Kriterien sind erstmals prüfbar
**Ergebnis:** Alle Kriterien bestanden. 23 E2E-Tests grün, 1 übersprungen (mit Begründung).

### Was dafür eingerichtet wurde
- **Werkstatt-Testkonto** `werkstatt-test@oldtimer-docs.test` — kein eigenes Fahrzeug, Rolle `werkstatt` am E2E-Testfahrzeug, `can_edit_all: false`. Zugangsdaten in `.env.local` (gitignored).
- **Fahrzeugtermin** am Testfahrzeug (TÜV/HU, +30 Tage), gepflegt vom **Besitzer** — damit prüfbar ist, ob die Werkstatt ihn sieht.
- **Zweites Playwright-Projekt** `chromium-werkstatt` mit eigener Sitzung (`tests/werkstatt.setup.ts`), Specs mit der Endung `-werkstattrolle.spec.ts`. Das Setup hängt am regulären Setup: Melden sich beide Konten gleichzeitig an, brechen beide Anmeldungen ab.

### Ergebnisse der bislang offenen Kriterien

| Kriterium | Status | Beleg |
|---|---|---|
| Navigationspunkt für Nutzer **mit** Rolle | PASS | Steht im ausgelieferten HTML, nicht erst nach einer Abfrage |
| Fahrzeugliste zeigt das Kundenfahrzeug | PASS | Marke, Modell und Baujahr in einer Zeile |
| Verweiskachel statt doppelter Anzeige | PASS | Kachel vorhanden, „Geteilte Fahrzeuge" erscheint nicht zusätzlich |
| Terminübersicht aus beiden Quellen | PASS | **Der Termin des Besitzers ist für die Werkstatt sichtbar** — der eigentliche Beleg für die neue Leseregel |
| Überfälligkeit/Restlaufzeit als Text | PASS | „in N Tagen" steht neben der Farbe |
| Suche filtert | PASS | Treffer, Nicht-Treffer mit erklärendem Leerzustand, Zurücksetzen |
| Drei Sortierungen, Fälligkeit als Standard | PASS | Alle drei Einträge vorhanden, Umschalten wirkt |
| Schnellaktion legt Eintrag an | PASS | Formular öffnet direkt, Rückkehr nach `/werkstatt`, Kilometerstand erscheint in der Liste |
| Beträge nur eigener Einträge | PASS | „1 eigener Eintrag" nach dem Anlegen |
| Bedienbar bei 375 px | PASS | Liste, Suche und Schnellaktion sichtbar; **kein waagerechtes Überlaufen**; untere Leiste mit höchstens fünf Einträgen (BUG-8 bestätigt behoben) |
| Werkstatt darf eigene Einträge löschen | PASS | Aufräumschritt entfernt den Abnahme-Eintrag wieder |

### Nachprüfung der Behebungen im laufenden Betrieb
- **BUG-7** bestätigt: Der Navigationspunkt steht im serverseitig gelieferten HTML, es gibt keine Zusatzabfrage mehr.
- **BUG-8** bestätigt: Die untere Leiste zählt bei 375 px höchstens fünf Einträge, „Einstellungen" ist ins Menü gewichen.
- **BUG-1** nicht mehr auslösbar: Der Ausfalltest überspringt sich, weil die Funktion vorhanden ist.

### Neuer Befund außerhalb dieses Features

#### BEFUND-C: Icon-Schaltflächen im Scheckheft ohne zugänglichen Namen — **Low (PROJ-3)**
**Datei:** `src/components/service-log.tsx:603-611`
**Beschreibung:** Die Schaltflächen zum Bearbeiten und Löschen eines Scheckheft-Eintrags enthalten ausschließlich ein Symbol — kein `aria-label`, kein verstecktes Textlabel. Für Screenreader sind es unbeschriftete Schaltflächen; welche löscht, ist nicht erkennbar.
**Entdeckt**, weil der Aufräumschritt des Abnahmetests sie nicht über ihre Rolle finden konnte und auf eine Gestaltungsklasse ausweichen musste. Der Test trägt einen Hinweis, dass er auf `getByRole` umzustellen ist, sobald die Schaltflächen beschriftet sind.
**Empfehlung:** `aria-label="Eintrag bearbeiten"` bzw. `"Eintrag löschen"` ergänzen — betrifft PROJ-3, nicht PROJ-37.

### Weiterhin nicht geprüft
- Firefox (im Projekt kein Playwright-Ziel; geprüft sind Chromium und WebKit)
- Verhalten bei vielen Fahrzeugen (Seitenweise ab 25, Kürzungshinweis ab 100) — dafür fehlen Daten in dieser Größenordnung; die Logik ist durch Unit-Tests abgedeckt
- Das Performance-Kriterium unter Last

### Produktionsreife (dritter Durchlauf)

**BEREIT.** Kein Critical, kein High. Die Hauptansicht ist erstmals vollständig geprüft — Zugang, Liste, Terminübersicht, Suche, Sortierung, Schnellaktion, Betragssicht und mobile Bedienbarkeit.

Offen bleiben BEFUND-A (rote PROJ-30-Tests), BEFUND-B (instabile Testsuite) und BEFUND-C (fehlende Beschriftungen in PROJ-3) — alle drei außerhalb dieses Features.

## Deployment
_To be added by /deploy_
