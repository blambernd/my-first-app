# PROJ-38: Händler-Bestandsübersicht

## Status: In Progress
**Created:** 2026-09-06
**Last Updated:** 2026-09-19

## Dependencies
- Requires: PROJ-1 (User Authentication) — Kontobezug der Selbstdeklaration
- Requires: PROJ-2 (Fahrzeugprofil) — Bestandsfahrzeuge sind reguläre Fahrzeuge des Nutzers
- Requires: PROJ-28 (Kaufpreis & Wertentwicklung) — liefert Kaufpreis und Kaufdatum als Grundlage für Standzeit und Spanne
- Requires: PROJ-8 (Freemium-Modell) — der Bereich gehört zum Premium-Tarif
- Requires: PROJ-7 (Fahrzeug-Transfer) — der Verkauf eines Bestandsfahrzeugs läuft über die bestehende Übergabe
- Berührt: PROJ-36 (Währung pro Fahrzeug) — Beträge und Summen sind währungsabhängig
- Abgrenzung: PROJ-33 (Verkaufspreis-Erhebung) — siehe Abschnitt „Verhältnis zu PROJ-33"

## Kontext
Händler nutzen die Plattform bereits, ohne dass sie dafür vorgesehen ist: PROJ-33 rechnet ausdrücklich damit, dass gewerbliche Nutzer täglich mehrere Fahrzeuge übertragen. Für sie ist die Fahrzeugliste des privaten Dashboards die falsche Ansicht — sie beantwortet nicht die zwei Fragen, die im Handel zählen: **Wie lange steht dieses Fahrzeug schon?** und **Was ist dabei herausgekommen?**

Dieses Feature gibt Nutzern, die sich als gewerblich deklarieren, eine Bestandsansicht mit Standzeit und Spanne. Es schafft **keine** neue Rolle und keinen neuen Zugriffsweg: Der Händler ist Besitzer seiner Fahrzeuge, alle bestehenden Rechte bleiben unverändert. Abgegrenzt vom Werkstatt-Dashboard (PROJ-37), das fremde Fahrzeuge und Wartungsfälligkeiten behandelt.

## Verhältnis zu PROJ-33 (verbindlich)
Die Tabelle `vehicle_sales` aus PROJ-33 ist bewusst anonym: ohne Verweis auf Nutzer, Fahrzeug oder Transfer, ohne Anlagedatum, für Nutzer nicht lesbar. **Sie darf für dieses Feature weder gelesen noch verknüpft noch um eine Zuordnung erweitert werden.**

Der Verkaufserlös für die Händlersicht ist deshalb eine **eigenständige, dem Händlerkonto zugeordnete Angabe**, die bei der Übergabe erhoben oder nachträglich erfasst wird. Dass beide Werte denselben Verkauf betreffen können, ist unvermeidbar und unschädlich, solange keine gemeinsame Kennung, kein gemeinsamer Zeitstempel und keine Ableitungsmöglichkeit entsteht. Jede Umsetzung, die die Anonymität von PROJ-33 schwächt, ist abzulehnen — auch wenn sie die Bedienung vereinfacht.

## User Stories
- Als gewerblicher Nutzer möchte ich meinen Fahrzeugbestand in einer eigenen Ansicht sehen, damit ich ihn nicht wie eine private Sammlung durchblättern muss
- Als Händler möchte ich zu jedem Fahrzeug die Standzeit sehen, damit ich erkenne, welches Fahrzeug zu lange Kapital bindet
- Als Händler möchte ich Langsteher auf den ersten Blick erkennen, damit ich rechtzeitig über Preis oder Aufbereitung entscheide
- Als Händler möchte ich Einkaufspreis, Verkaufserlös und Spanne je Fahrzeug sehen, damit ich weiß, welche Geschäfte sich gelohnt haben
- Als Händler möchte ich verkaufte Fahrzeuge weiterhin auswerten können, nachdem sie an den Käufer übergeben wurden, damit meine Historie nicht mit jedem Verkauf Lücken bekommt
- Als Händler möchte ich die Bestandsansicht abschalten können, wenn ich nicht mehr gewerblich verkaufe, damit die Oberfläche zu meiner Nutzung passt
- Als privater Nutzer möchte ich von alldem nichts sehen, damit die Anwendung für mich einfach bleibt

## Acceptance Criteria

### Zugang
- [ ] In den Einstellungen existiert ein Schalter „Ich verkaufe Fahrzeuge gewerblich" (Standard: aus)
- [ ] Ist der Schalter aus, ist der Bestandsbereich weder sichtbar noch über direkten Aufruf erreichbar
- [ ] Ist der Schalter an und liegt ein aktives Premium-Abo vor, erscheint der Navigationspunkt „Bestand"
- [ ] Ist der Schalter an, aber kein Premium-Abo vorhanden, wird statt der Bestandsansicht der Upgrade-Hinweis aus PROJ-8 angezeigt
- [ ] Der Schalter kann jederzeit wieder ausgeschaltet werden; dabei gehen keine Daten verloren, der Bereich wird nur ausgeblendet
- [ ] Das bestehende Fahrzeuglimit des Tarifs gilt unverändert weiter — dieses Feature hebt kein Limit auf

### Bestandsliste
- [ ] Der Bereich listet alle Fahrzeuge, bei denen der Nutzer Besitzer ist
- [ ] Fahrzeuge, bei denen er nur Mitglied ist (Werkstatt, Betrachter), erscheinen nicht
- [ ] Jede Zeile zeigt: Marke, Modell, Baujahr, Kennzeichen (falls hinterlegt), Kaufdatum, Standzeit, Einkaufspreis
- [ ] Die Liste ist sortierbar nach Standzeit (Standard, längste zuerst), Kaufdatum und Fahrzeugname
- [ ] Ein Suchfeld filtert nach Marke, Modell und Kennzeichen
- [ ] Ein Klick auf eine Zeile führt zum Fahrzeugprofil
- [ ] Bei mehr als 25 Fahrzeugen wird die Liste seitenweise oder per Nachladen ausgegeben

### Standzeit
- [ ] Die Standzeit wird in Tagen ab dem erfassten Kaufdatum (PROJ-28) berechnet
- [ ] Fehlt das Kaufdatum, wird ersatzweise das Anlagedatum des Fahrzeugs verwendet und die Angabe als geschätzt gekennzeichnet
- [ ] Fahrzeuge oberhalb von **180 Tagen** werden als Langsteher hervorgehoben (feste Schwelle, in der Architekturphase entschieden — sie betrifft nur die Darstellung und ist später ohne Datenwanderung änderbar)
- [ ] Die Hervorhebung ist nicht ausschließlich farblich, sondern auch textlich erkennbar
- [ ] Bei verkauften Fahrzeugen wird die Standzeit eingefroren auf die Spanne zwischen Kauf- und Verkaufsdatum

### Einkauf, Verkauf, Spanne
- [ ] Der Einkaufspreis stammt aus dem bestehenden Kaufpreisfeld (PROJ-28); ist keiner erfasst, erscheint „—" statt einer Null
- [ ] Beim Verkauf über die Fahrzeugübergabe kann der Händler einen Verkaufserlös für seine eigene Auswertung erfassen; die Angabe ist freiwillig und überspringbar
- [ ] Ein Verkaufserlös kann auch nachträglich erfasst oder korrigiert werden
- [ ] Die Spanne wird als Differenz aus Verkaufserlös und Einkaufspreis ausgewiesen und ausdrücklich als **Rohspanne ohne Aufwendungen** bezeichnet
- [ ] Fehlt einer der beiden Werte, wird keine Spanne berechnet und keine geschätzt
- [ ] Beträge erscheinen in der Währung des jeweiligen Fahrzeugs (PROJ-36)
- [ ] Summen und Durchschnitte werden je Währung getrennt gebildet; eine Umrechnung findet nicht statt
- [ ] Die Auswertung nennt die Zahl der Fahrzeuge, für die mangels Daten keine Spanne berechnet werden konnte

### Als verkauft kennzeichnen (in der Architekturphase ergänzt)
Im Handel ist der Käufer **ohne** Konto der Regelfall — dann gibt es keine Übergabe. Ohne diesen zweiten Weg beschriebe die Auswertung nur die Minderheit der Verkäufe.

- [ ] Jedes Bestandsfahrzeug bietet die Aktion „Als verkauft kennzeichnen"
- [ ] Erfasst werden Verkaufsdatum (Pflicht) und Verkaufserlös (freiwillig)
- [ ] Das Fahrzeug verlässt damit die Bestandsliste und erscheint unter „Verkauft"
- [ ] Die Fahrzeugakte wird dabei **nicht** gelöscht; ob sie bestehen bleibt, entscheidet der Händler getrennt
- [ ] Der Vorgang ist zurücknehmbar, solange das Fahrzeug noch existiert
- [ ] Beim Kennzeichnen wird auf die Übergabe hingewiesen: Sie gibt dem Käufer die Historie mit und stützt damit den Fahrzeugwert — sie ist aber keine Bedingung
- [ ] Ein auf diesem Weg entstandener Datensatz ist von einem über die Übergabe entstandenen unterscheidbar (Herkunft wird festgehalten)

### Verkaufte Fahrzeuge
- [ ] Nach der Übergabe an den Käufer bleibt beim Händler ein Bestandsdatensatz erhalten mit: Marke, Modell, Baujahr, Kaufdatum, Verkaufsdatum, Standzeit, Einkaufspreis, Verkaufserlös
- [ ] Der Datensatz wird **vor** dem Löschen der Kostendaten geschrieben (PROJ-32 löscht beim Annehmen den Kaufpreis des Vorbesitzers — ohne diese Reihenfolge ginge die Grundlage der Spanne verloren)
- [ ] Der beim Absenden der Übergabe erfasste Verkaufserlös des Händlers wird dem Käufer zu keinem Zeitpunkt angezeigt
- [ ] Dieser Datensatz enthält keine Fahrzeughistorie, keine Dokumente und keine personenbezogenen Daten des Käufers
- [ ] Verkaufte Fahrzeuge sind in einer eigenen Ansicht „Verkauft" erreichbar und in der Bestandsliste standardmäßig nicht enthalten
- [ ] Der Händler kann einen solchen Datensatz löschen
- [ ] Der Käufer erhält keinen Hinweis darauf, dass ein solcher Datensatz existiert, und keinen Zugriff darauf

### Datenschutz und Abgrenzung
- [ ] Zwischen dem Händler-Bestandsdatensatz und `vehicle_sales` (PROJ-33) besteht keinerlei Verknüpfung — keine gemeinsame Kennung, kein gemeinsamer Zeitstempel
- [ ] Die anonyme Preiserhebung aus PROJ-33 bleibt in Funktion und Datenmodell unverändert
- [ ] Die Bestandsansicht ist ausschließlich für den Kontoinhaber sichtbar
- [ ] Die Deklaration „gewerblich" wird nicht öffentlich angezeigt und erscheint nicht im Fahrzeug-Kurzprofil (PROJ-10) oder in Inseraten

### Zustände
- [ ] Hat ein deklarierter Händler noch kein Fahrzeug, erscheint ein erklärender Leerzustand
- [ ] Sind noch keine Kaufpreise erfasst, bleibt die Liste nutzbar; die Preisspalten zeigen „—" und ein Hinweis erklärt, wo Kaufpreise gepflegt werden
- [ ] Die Ansicht ist auf Mobilgeräten vollständig bedienbar
- [ ] Alle Texte sind auf Deutsch

## Edge Cases
- Was passiert, wenn ein Fahrzeug gekauft und ohne Verkauf wieder gelöscht wird? → Kein Bestandsdatensatz; das Fahrzeug verschwindet vollständig aus der Auswertung
- Was passiert, wenn der Händler den gewerblichen Schalter ausschaltet? → Bereich wird ausgeblendet, Bestandsdatensätze bleiben gespeichert und erscheinen beim Wiedereinschalten unverändert
- Was passiert, wenn Premium ausläuft? → Der Navigationspunkt bleibt sichtbar, führt aber auf den Upgrade-Hinweis; keine Daten werden gelöscht
- Was passiert, wenn das Fahrzeug nicht verkauft, sondern verschenkt oder verschrottet wird? → Verkaufserlös bleibt leer, keine Spanne; die Standzeit endet mit dem Abgang
- Was passiert, wenn das Kaufdatum nach dem Verkaufsdatum liegt (Tippfehler)? → Eingabe wird abgewiesen, Standzeit wird nicht negativ ausgewiesen
- Was passiert, wenn ein Fahrzeug zurückgenommen wird und erneut in den Bestand kommt? → Es entsteht ein zweiter Bestandsvorgang; der frühere Verkauf bleibt als eigener Datensatz erhalten
- Was passiert bei einem Fahrzeug in Fremdwährung? → Beträge in Fahrzeugwährung, getrennte Summenbildung, keine Umrechnung
- Was passiert, wenn ein Privatnutzer mit zwanzig Sammlungsfahrzeugen den Schalter aktiviert? → Zulässig; die Deklaration ist eine Selbstauskunft, keine Prüfung. Sie hat keine Außenwirkung
- Was passiert, wenn der Händler den Verkaufserlös nie erfasst? → Standzeit und Einkaufspreis bleiben auswertbar, die Spanne entfällt; die Auswertung weist die Zahl der unvollständigen Vorgänge aus
- Was passiert bei sehr großem Bestand (mehrere hundert Fahrzeuge)? → Liste seitenweise; die Auswertung bleibt auf Kennzahlen beschränkt, die ohne vollständiges Laden berechenbar sind

## Non-Goals (bewusst nicht Teil dieses Features)
- Kein Marktplatz, keine Vermittlung, keine Kaufabwicklung (Non-Goal laut PRD)
- Keine öffentliche Händlerkennzeichnung, kein Händlerverzeichnis, kein Profil
- Keine Mitarbeiterkonten und keine Rechtevergabe innerhalb eines Betriebs
- Keine Buchhaltung, keine Rechnungsstellung, kein Steuer- oder Differenzbesteuerungsthema
- Keine investierten Kosten in der Spanne (Aufbereitung, Reparaturen, Standkosten) — die Kostendaten liegen mit PROJ-25/26/27 zwar vor, ihre Einbeziehung ist ein eigener Schritt und würde die Rohspanne zur Nettomarge machen
- Kein Verkaufsstatus und keine Pipeline (in Aufbereitung, inseriert, reserviert) — bewusst zurückgestellt
- Keine Auswertung über Kalenderjahre, Quartale oder Fahrzeugklassen hinweg
- Keine Anbindung an Warenwirtschaft, DMS oder Inseratsportale

## Offene Punkte für die Architektur
- Ob der Verkaufserlös als Feld am bestehenden Übergabevorgang oder als eigener, den Transfer überdauernder Bestandsdatensatz geführt wird, entscheidet `/architecture`. Bedingung ist in beiden Fällen, dass die Angabe den Verlust des Fahrzeugzugriffs überlebt und keine Verbindung zu PROJ-33 entsteht
- Ob die Langsteher-Schwelle je Konto einstellbar ist oder zunächst fest bei 180 Tagen bleibt

## Technical Requirements (optional)
- Sicherheit: Bestandsdaten ausschließlich für den Kontoinhaber lesbar; serverseitig durchgesetzt
- Datenschutz: keine Ableitbarkeit zwischen Händler-Bestandsdaten und der anonymen Preiserhebung aus PROJ-33
- Performance: Bestandsansicht lädt bei bis zu 100 Fahrzeugen in unter 1 Sekunde
- Mobile: vollständige Bedienbarkeit ab 360 px Breite
- Sprache: Deutsch
- Barrierefreiheit: Langsteher nicht ausschließlich über Farbe kennzeichnen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick

Der Bestandsbereich ist eine neue Seite mit **einer** neuen Tabelle. Alles, was der Händler an Fahrzeugen führt, liegt bereits vor — Fahrzeuge, Kaufpreis und Kaufdatum sind vorhandene Bestände. Neu ist nur, was den Verkauf **überdauert**.

Beim Entwurf kam ein Umstand ans Licht, den die Spezifikation nicht vorhersehen konnte und der das Design bestimmt: **Beim Annehmen einer Übergabe wird der Kaufpreis des Vorbesitzers vollständig gelöscht** (PROJ-32, bewusst so entschieden, damit der Käufer die Einkaufskonditionen nicht sieht). Genau daraus würde sich aber die Spanne errechnen. Ohne Gegenmaßnahme verlöre der Händler seine Zahlen in dem Moment, in dem der Verkauf zustande kommt.

### Der Kern: ein Datensatz, der den Verkauf überlebt

```
Fahrzeug im Bestand          Verkauf                  Danach
─────────────────────        ─────────                ──────────────────────
Fahrzeug + Kaufpreis   ──▶   Bestandsdatensatz   ──▶  Fahrzeug weg oder beim
(vorhandene Daten)           wird geschrieben          Käufer; Datensatz bleibt
                             ──────────────────        beim Händler
                             DANACH erst löscht
                             die Übergabe
```

Der Bestandsdatensatz entsteht **vor** dem Löschen, im selben Vorgang. Diese Reihenfolge ist die tragende Entscheidung des Entwurfs; wird sie umgedreht, sind die Daten fort.

### Zwei Wege aus dem Bestand

| Weg | Wann | Was passiert |
|---|---|---|
| **Übergabe** (PROJ-7) | Käufer hat ein Konto und übernimmt die Historie | Beim Annehmen: Datensatz schreiben, dann wie bisher löschen |
| **Als verkauft kennzeichnen** | Käufer hat kein Konto — im Handel der Regelfall | Händler trägt Verkaufsdatum und Erlös ein; Datensatz entsteht sofort |

Ohne den zweiten Weg beschriebe die Auswertung nur die Minderheit der Verkäufe. Beim Kennzeichnen wird auf die Übergabe hingewiesen, weil sie dem Käufer die Historie mitgibt und damit den Fahrzeugwert stützt — aber sie ist keine Bedingung.

### Warum der Erlös eine eigene Angabe des Händlers ist

Beim Annehmen einer Übergabe wird bereits ein Preis erfasst — aber vom **Käufer**, als dessen Kaufpreis, und optional anonym für die Preisstatistik (PROJ-33). Für den Händler ist dieser Wert dreifach unbrauchbar: Er stammt nicht von ihm, er ist ihm nicht zugänglich, und eine Verknüpfung mit der anonymen Erhebung ist ausdrücklich untersagt.

Der Händler erfasst seinen Erlös deshalb selbst — beim Absenden der Übergabe, beim Kennzeichnen als verkauft oder nachträglich am Datensatz. Die Angabe bleibt freiwillig; fehlt sie, entfällt die Spanne, nicht der Datensatz.

**Sichtbarkeitsregel:** Der beim Absenden erfasste Erlös wird dem Käufer zu keinem Zeitpunkt angezeigt. Er soll seinen eigenen Preis nennen, nicht den des Verkäufers bestätigen.

### Seitenstruktur

```
/einstellungen (bestehend)
+-- Schalter "Ich verkaufe Fahrzeuge gewerblich"

/bestand (NEU — nur bei gesetztem Schalter und Premium)
+-- Kopfbereich (Anzahl, Hinweis bei fehlenden Kaufpreisen)
+-- Bestandsliste
|   +-- Suchfeld + Sortierung (Standzeit | Kaufdatum | Name)
|   +-- Zeile: Fahrzeug | Kaufdatum | Standzeit | Einkaufspreis
|   |   +-- Langsteher-Kennzeichnung ab 180 Tagen (Farbe UND Text)
|   +-- Aktion "Als verkauft kennzeichnen"
+-- Umschalter zur Ansicht "Verkauft"
    +-- Zeile: Fahrzeug | Kauf | Verkauf | Standzeit | Rohspanne
    +-- Aktion "Erlös nachtragen/korrigieren", Aktion "Löschen"

/vehicles/[id]/transfer (bestehend — kleine Ergänzung)
+-- optionales Feld "Mein Verkaufserlös" (nur für gewerbliche Nutzer)
```

### Datenmodell

**Eine neue Tabelle** — der Bestandsvorgang beim Händler:

```
Bestandsvorgang:
- gehört zum Händler-Konto (nicht zum Fahrzeug — es kann weg sein)
- Fahrzeugbeschreibung zum Verkaufszeitpunkt: Marke, Modell, Baujahr
- Kaufdatum und Einkaufspreis (Kopie aus dem Kaufpreis-Bestand)
- Verkaufsdatum und Verkaufserlös (freiwillig)
- Währung des Fahrzeugs
- Herkunft: über Übergabe oder von Hand gekennzeichnet
```

**Was bewusst NICHT darin steht:** keine Fahrzeugkennung, keine Käuferdaten, keine Historie, keine Dokumente. Die Beschreibung ist eine Abschrift, keine Verknüpfung — dadurch überlebt der Datensatz die Löschung des Fahrzeugs, ohne auf Reste zu zeigen.

**Der gewerbliche Schalter** ist eine einzelne Angabe am Konto und wandert zu den vorhandenen Abo-Daten, statt eine eigene Tabelle zu bekommen.

**Nicht neu gespeichert** werden Standzeit und Spanne: Beide sind Rechenergebnisse aus Datum und Preis und würden als gespeicherte Werte nur veralten.

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Datensatz beim **Annehmen** schreiben, nicht beim Absenden | Dieselbe Begründung wie in PROJ-32: Eine abgelehnte oder abgelaufene Übergabe darf nichts verändert haben |
| Abschrift statt Verknüpfung zum Fahrzeug | Der Datensatz muss die Löschung des Fahrzeugs überleben; eine Verknüpfung würde ihn mitreißen |
| Zweiter Weg ohne Übergabe | Im Handel ist der Käufer ohne Konto der Normalfall, nicht die Ausnahme |
| Erlös als eigene Angabe des Händlers | Der Transferpreis gehört dem Käufer und ist für die anonyme Erhebung reserviert |
| Erlös dem Käufer nicht anzeigen | Sonst bestätigt er die Vorgabe des Verkäufers, statt seinen Preis zu nennen |
| Schwelle fest bei 180 Tagen | Betrifft nur die Darstellung; später änderbar ohne Datenwanderung |
| Kein eigener Tarif | Der Bereich gehört zu Premium; das Fahrzeuglimit bleibt unverändert |
| Standzeit und Spanne rechnen statt speichern | Gespeicherte Rechenergebnisse veralten beim ersten korrigierten Datum |

### Auswirkungen auf bestehende Bereiche

| Bereich | Änderung |
|---|---|
| Einstellungen | neuer Schalter |
| Kopfzeile / mobile Navigation | Punkt „Bestand", nur bei gesetztem Schalter |
| Übergabe-Seite | optionales Erlös-Feld für gewerbliche Nutzer |
| Übergabe annehmen | schreibt den Bestandsdatensatz, **bevor** sie löscht |
| Fahrzeug löschen | unverändert — ohne Kennzeichnung entsteht kein Datensatz |
| Anonyme Preiserhebung (PROJ-33) | **keine Änderung**, weder am Datenmodell noch am Ablauf |

### Sicherheit und Datenschutz

- Bestandsdatensätze sind ausschließlich für ihr Händler-Konto lesbar; die Beschränkung wird serverseitig durchgesetzt
- Keine gemeinsame Kennung und kein gemeinsamer Zeitstempel mit der anonymen Erhebung; beide Schreibvorgänge bleiben getrennt
- Der Erlös des Verkäufers wird in keiner Ansicht des Käufers ausgegeben
- Die gewerbliche Angabe bleibt intern — sie erscheint weder im öffentlichen Kurzprofil noch in Inseraten
- Der Händler kann jeden Datensatz löschen; das Löschen des Kontos nimmt sie mit

### Abhängigkeiten

**Keine neuen Pakete.** Alles mit den vorhandenen Bausteinen umsetzbar.

### Offene Punkte für die Umsetzung

- Ob die Ansicht „Verkauft" eine eigene Seite oder ein Umschalter auf derselben wird, entscheidet die Umsetzung; fachlich ist beides gleichwertig
- Für die Kennzeichnung als verkauft ist zu klären, ob das Fahrzeug danach gelöscht oder nur aus dem Bestand genommen wird. Empfehlung: **nicht automatisch löschen** — der Händler entscheidet selbst, ob er die Fahrzeugakte behält

## Implementation Notes (Frontend)

**Stand:** 2026-09-19 — Build erfolgreich, Lint ohne Fehler, 776/776 Unit-Tests grün (23 davon neu).

### Neue Dateien
- `src/lib/dealer-inventory.ts` — Standzeit, Rohspanne, Sortierung, Suche, Auswertung je Währung. Ohne Datenbankzugriff, damit prüfbar ohne Fahrzeugbestand
- `src/lib/dealer-inventory.test.ts` — 23 Tests, u. a. eingefrorene Standzeit bei verkauften Fahrzeugen, Verluste als negative Spanne, getrennte Währungssummen, unvollständige Vorgänge
- `src/lib/dealer-access.ts` — liest den gewerblichen Schalter
- `src/lib/navigation-access.ts` — fasst die Zugangsfragen beider Zusatzbereiche zu einer Abfrage zusammen
- `src/app/bestand/page.tsx` — Bestandsseite, serverseitig geladen
- `src/components/dealer-inventory-list.tsx` — Bestandsliste mit Suche, Sortierung, Langsteher-Kennzeichnung, Aktion
- `src/components/dealer-sold-list.tsx` — abgeschlossene Verkäufe samt Auswertung je Währung
- `src/components/mark-as-sold-dialog.tsx` — „Als verkauft kennzeichnen"
- `src/components/dealer-mode-settings.tsx` — der Schalter in den Einstellungen
- `src/app/api/dealer/sales/route.ts` — nimmt die Kennzeichnung entgegen, prüft Besitz und Datumsfolge

### Geänderte Dateien
- `src/lib/vehicle-format.ts` (**neu**) — `vehicleLabel`, `formatDate`, `formatMileage` und `dayDiff` lagen im Werkstatt-Modul und wurden hier ein zweites Mal gebraucht. Statt einer Abhängigkeit zwischen zwei fachlich getrennten Bereichen liegen sie jetzt gemeinsam; `workshop-dashboard.ts` gibt sie unverändert weiter, deshalb blieben dessen Tests und Komponenten unberührt (25/25 weiterhin grün)
- `src/components/account-header.tsx`, `src/components/mobile-bottom-nav.tsx` — Punkt „Bestand"
- `src/app/settings/page.tsx` — Schalter eingebunden, auf die gemeinsame Zugangsabfrage umgestellt
- `src/app/vehicles/[id]/layout.tsx`, `src/app/dashboard/page.tsx` — Punkt „Bestand" durchgereicht

### Entscheidungen beim Bauen
1. **Die mobile Leiste bekam eine Regel statt eines weiteren Eintrags.** Mit zwei Zusatzbereichen wären es sechs Einträge gewesen — genau der Fall, den QA BUG-8 verhindern sollte. Jetzt gilt: ein Zusatzbereich steht in der Leiste (Einstellungen weicht ins Menü), bei zwei wandern beide ins Menü und Einstellungen bleibt. So bleiben es immer höchstens fünf.
2. **Fehlt das Kaufdatum, wird das Anlagedatum des Fahrzeugs verwendet** und als geschätzt gekennzeichnet — sonst hätte ein Fahrzeug ohne Kaufpreis-Eintrag gar keine Standzeit.
3. **Ein Hinweis nennt die Zahl der Fahrzeuge ohne Kaufpreis** und sagt, wo er nachzutragen ist. Ohne ihn bliebe unklar, warum Spalten leer sind.
4. **Der Dialog weist auf die Übergabe hin, erzwingt sie aber nicht** und stellt klar, dass die Fahrzeugakte erhalten bleibt.

### Was das Backend noch liefern muss
Die Seite ist gebaut und lädt, aber zwei Dinge fehlen in der Datenbank:

- **`subscriptions.is_dealer`** (Ja/Nein am Konto). Bis dahin liefert die Zugangsprüfung „nicht gewerblich": Der Bereich bleibt unsichtbar und `/bestand` leitet ins Dashboard um. Der Schalter in den Einstellungen ist sichtbar, kann aber nicht speichern
- **Tabelle `dealer_sales`** samt Zugriffsregeln (nur für das eigene Konto lesbar und schreibbar). Bis dahin bleibt die Ansicht „Verkauft" leer — der Fehler wird abgefangen und protokolliert, statt die Seite scheitern zu lassen — und die Kennzeichnung schlägt mit einer Meldung fehl
- **Schreiben beim Annehmen einer Übergabe**, vor dem Löschen der Kaufdaten, samt Erlösfeld am Übergabevorgang, das dem Käufer nicht ausgeliefert wird

Ohne diese drei Teile ist die Bestandsliste sichtbar, sobald der Schalter gesetzt werden kann; Verkäufe lassen sich noch nicht festhalten.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
