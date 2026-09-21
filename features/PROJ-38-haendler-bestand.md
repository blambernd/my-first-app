# PROJ-38: Händler-Bestandsübersicht

## Status: Deployed
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

## Implementation Notes (Backend)

**Stand:** 2026-09-19 — Migration **angewendet und in der Datenbank geprüft**. Build erfolgreich, Lint ohne Fehler, 783/783 Unit- und Integrationstests grün (7 davon neu).

### Ein Fund, der das Design geändert hat

Der Erlös sollte laut Entwurf am Übergabevorgang liegen. **Das geht nicht:** Die Policy „Invited user can view transfer" lässt den **Käufer** die Zeile in `vehicle_transfers` vollständig lesen. Ein Erlösfeld dort stünde ihm offen, bevor er seinen eigenen Preis nennt — genau das, was die Spezifikation ausschließt. Zugriffsregeln wirken in PostgreSQL auf Zeilen, nicht auf Spalten.

Deshalb eine eigene kleine Tabelle `dealer_transfer_prices` mit eigener Leseregel: Sie gehört dem Verkäufer, wird beim Annehmen ausgelesen und danach geräumt.

### Migration `20260919_proj38_haendler_bestand.sql`

| Teil | Inhalt |
|---|---|
| 1 | `subscriptions.is_dealer` — die Selbstauskunft am Konto |
| 2 | `dealer_sales` — abgeschlossene Vorgänge, vier Zugriffsregeln, ein Index |
| 3 | `dealer_transfer_prices` — Erlös eines laufenden Übergabevorgangs, nur für den Verkäufer |
| 4 | `accept_vehicle_transfer` — ein Einschub **vor** dem Löschen der Kaufdaten |

**Zu Teil 4:** Die Funktion wurde aus der laufenden Datenbank ausgelesen und Zeile für Zeile übernommen; hinzugekommen ist allein der Block, der den Bestandsvorgang schreibt. Er greift nur, wenn der **Verkäufer** sich als gewerblich erklärt hat — sonst entstünde ein Datensatz, den niemand ansieht. Übernommen wird die Währung des Verkäufers, nicht die vom Käufer gewählte: Sein Einkauf ist in seiner Währung erfasst.

`dealer_sales` trägt bewusst **keine Fahrzeugkennung**. Der Vorgang soll das Fahrzeug überleben; eine Verknüpfung würde ihn beim Löschen mitreißen.

### Geprüft in der Datenbank

| Prüfung | Ergebnis |
|---|---|
| Spalte, beide Tabellen, Index | vorhanden |
| Zugriffsregeln | 4 auf `dealer_sales`, 1 auf `dealer_transfer_prices`, RLS auf beiden aktiv |
| Reihenfolge in der Übergabe | `INSERT INTO dealer_sales` steht **vor** `DELETE FROM vehicle_purchases` — maschinell geprüft, nicht nur gelesen |
| Isolation zwischen Konten | Probe mit zwei echten Konten: Eigentümer sieht seinen Vorgang, ein fremdes Konto sieht ihn nicht. Der Testdatensatz wurde zurückgerollt |

### Neue und geänderte Dateien
- `src/app/api/dealer/dealer.test.ts` — 7 Tests: ohne Sitzung wird die Datenbank nicht gefragt, ein fremdes Fahrzeug wird abgewiesen, Verkaufsdatum vor Kaufdatum wird abgelehnt, die geschriebene Zeile trägt **keine** Fahrzeugkennung, ein Vorgang ohne Erlös wird angenommen, ein Schreibfehler täuscht keinen Erfolg vor
- `src/components/transfer-form.tsx` — Erlösfeld für gewerbliche Nutzer; der Übergabe-Insert liefert jetzt die Kennung zurück, damit der Erlös zugeordnet werden kann. Schlägt dessen Speichern fehl, bleibt die Übergabe gültig und es erscheint ein Hinweis
- `src/app/vehicles/[id]/transfer/page.tsx`, `client.tsx` — reichen den Schalter und die Währung durch; die Fahrzeugabfrage lädt jetzt auch die Währung

### Offen
- **Zurücknehmen einer Kennzeichnung** (Kriterium „Der Vorgang ist zurücknehmbar"): Die Zugriffsregel zum Löschen ist da, die Schaltfläche fehlt noch
- **Nachtragen des Erlöses** am abgeschlossenen Vorgang: Regel vorhanden, Oberfläche fehlt
- Beides ist Oberflächenarbeit ohne weitere Datenbankänderung

## QA Test Results

**QA-Datum:** 2026-09-20
**Geprüft durch:** QA Engineer (Code-Prüfung, Unit-/Integrationstests, E2E, Sicherheitsaudit gegen die laufende Datenbank)
**Testlauf:** 783/783 Unit- und Integrationstests grün (41 Dateien), 16/18 E2E grün (2 als bekannte Fehler markiert), Build erfolgreich, Lint ohne Fehler

### Ausgangslage — diesmal vollständig prüfbar

Anders als bei PROJ-37 war die Migration vor Testbeginn angewendet. Für den regulären Testnutzer wurde der Händlermodus gesetzt; er besitzt das E2E-Testfahrzeug (Kaufpreis 18.500 €, Kaufdatum 2026-08-08). Die Hauptansicht war damit vom ersten Durchlauf an prüfbar.

### Ergebnisse je Akzeptanzkriterium

| Bereich | Kriterium | Status | Beleg |
|---|---|---|---|
| Zugang | Schalter in den Einstellungen | PASS | E2E: sichtbar und gesetzt |
| Zugang | Ohne Schalter kein Zugang | PASS (statisch) | Seite leitet ins Dashboard um |
| Zugang | Navigationspunkt bei gesetztem Schalter | PASS | Steht im ausgelieferten HTML |
| Zugang | Ohne Premium der Upgrade-Hinweis | NICHT PRÜFBAR | `NEXT_PUBLIC_BETA_MODE=true` macht jeden Plan zu Premium |
| Zugang | Nicht angemeldet → Anmeldung | PASS | E2E |
| Zugang | Fahrzeuglimit unverändert | PASS (statisch) | Feature fasst die Limitprüfung nicht an |
| Bestandsliste | Nur eigene Fahrzeuge | PASS (statisch) | Abfrage filtert auf `user_id` |
| Bestandsliste | Angezeigte Felder je Zeile | PASS | E2E: Marke, Modell, Baujahr, Standzeit, Einkaufspreis |
| Bestandsliste | Klick führt zum Fahrzeugprofil | PASS (statisch) | Ganze Zeile klickbar |
| Bestandsliste | Suche über Marke, Modell, Kennzeichen | PASS | E2E: Treffer, Leerzustand, Zurücksetzen |
| Bestandsliste | Drei Sortierungen, Standzeit voreingestellt | PASS | E2E |
| Bestandsliste | Seitenweise ab 25 Fahrzeugen | PASS (statisch) | `PAGE_SIZE = 25` |
| Standzeit | Berechnung ab Kaufdatum | PASS | Unit-Tests |
| Standzeit | Ersatzweise Anlagedatum, gekennzeichnet | PASS (statisch) | Kennzeichnung „(geschätzt)" |
| Standzeit | Langsteher ab 180 Tagen | PASS | Unit-Tests an der Schwelle |
| Standzeit | Kennzeichnung nicht nur farblich | PASS | Text „seit N Tagen im Bestand" plus Kennzeichen |
| Standzeit | Bei Verkauf eingefroren | PASS | Unit-Test |
| Spanne | Einkaufspreis aus dem Kaufpreisfeld | PASS | E2E: 18.500,00 € in der Zeile |
| Spanne | Erlös beim Absenden der Übergabe | PASS (statisch) | Feld nur für gewerbliche Nutzer |
| Spanne | Erlös nachträglich erfassen/korrigieren | **FAIL** | Oberfläche fehlt — BUG-3 |
| Spanne | Als Rohspanne benannt | PASS (statisch) | „ohne Aufbereitung, Reparaturen und Standkosten" |
| Spanne | Ohne Wert keine Spanne, nichts geschätzt | PASS | Unit-Tests |
| Spanne | Währung je Fahrzeug, keine Mischsummen | PASS | Unit-Test mit EUR und CHF |
| Spanne | Zahl der unvollständigen Vorgänge genannt | PASS | Unit-Test |
| Kennzeichnen | Aktion je Fahrzeug | PASS | E2E |
| Kennzeichnen | Datum Pflicht, Erlös freiwillig | PASS | E2E + 7 Integrationstests |
| Kennzeichnen | Fahrzeug verlässt die Bestandsliste | **FAIL** | BUG-1 |
| Kennzeichnen | Fahrzeugakte bleibt erhalten | PASS | Route fasst das Fahrzeug nicht an |
| Kennzeichnen | Vorgang zurücknehmbar | **FAIL** | Schaltfläche fehlt — BUG-4 |
| Kennzeichnen | Hinweis auf die Übergabe | PASS | E2E |
| Kennzeichnen | Herkunft unterscheidbar | PASS | `origin` in Datenmodell und Anzeige |
| Verkauft | Datensatz überlebt die Übergabe | PASS (statisch) | Reihenfolge maschinell geprüft |
| Verkauft | Keine Historie, keine Käuferdaten | PASS | Integrationstest: keine Fahrzeugkennung |
| Verkauft | Erlös dem Käufer nie sichtbar | PASS | **Sicherheitsprobe mit zwei Konten** |
| Verkauft | Eigene Ansicht, Leerzustand | PASS | E2E |
| Verkauft | Vorgang löschbar | PASS (statisch) | Zugriffsregel vorhanden, Schaltfläche fehlt (BUG-4) |
| Datenschutz | Keine Verknüpfung zu PROJ-33 | PASS | Getrennte Tabellen, kein gemeinsamer Bezug |
| Datenschutz | Nur für den Kontoinhaber sichtbar | PASS | **Isolationsprobe mit zwei Konten** |
| Datenschutz | Gewerblich-Angabe nicht öffentlich | PASS (statisch) | Kein Bezug in Kurzprofil oder Inserat |
| Zustände | Hinweis bei fehlenden Kaufpreisen | PASS (statisch) | Am Testfahrzeug nicht auslösbar, Kaufpreis vorhanden |
| Zustände | Bedienbar auf Mobilgeräten | PASS | E2E bei 375 px, kein waagerechter Überlauf |
| Zustände | Alle Texte auf Deutsch | PASS | |

**Zusammenfassung:** 35 bestanden, 3 nicht erfüllt, 1 nicht prüfbar.

### Gefundene Fehler

#### BUG-1: Ein gekennzeichnetes Fahrzeug bleibt im Bestand und steht zugleich unter „Verkauft" — ~~High~~ **behoben am 2026-09-20**
**Dateien:** `src/app/bestand/page.tsx:127-129`, Migration (Tabelle `dealer_sales`)
**Beschreibung:** Die Bestandsliste lädt alle Fahrzeuge des Kontos, ohne die abgeschlossenen Vorgänge abzugleichen. Nach „Als verkauft kennzeichnen" erscheint dasselbe Fahrzeug in **beiden** Listen.
**Ursache — und warum das nicht trivial ist:** `dealer_sales` trägt bewusst **keine Fahrzeugkennung**, damit der Vorgang das Fahrzeug überlebt. Damit fehlt aber jede Möglichkeit, verkaufte Fahrzeuge aus dem Bestand zu filtern. Der Entwurf hat die beiden Anforderungen „überlebt das Fahrzeug" und „verlässt den Bestand" nicht zusammen gedacht.
**Auswirkung:** Das Kernversprechen der Seite — Bestand hier, Verkauftes dort — ist gebrochen. Die Kopfzeile zählt verkaufte Fahrzeuge weiter als Bestand, und ihre Standzeit läuft weiter.
**Empfehlung:** Eine **optionale** Fahrzeugkennung am Vorgang mit `ON DELETE SET NULL`. Sie erlaubt den Filter, solange das Fahrzeug existiert, und wird beim Löschen oder bei der Übergabe von selbst leer — der Vorgang überlebt trotzdem. Alternativ ein Verkaufskennzeichen am Fahrzeug.

#### BUG-2: Auf der Bestandsseite fehlt ihr eigener Navigationspunkt — ~~Medium~~ **behoben am 2026-09-20**
**Datei:** `src/app/bestand/page.tsx:98-100, 119, 203-205, 238`
**Beschreibung:** Die Seite reicht `isDealer` weder an die Kopfzeile noch an die untere Leiste durch. Ausgerechnet im Bestandsbereich fehlt der Punkt „Bestand" — auf dem Smartphone ist der Bereich von dort gar nicht mehr über die Leiste erreichbar.
**Nebenwirkung:** Da die Leiste den Bereich nicht kennt, zählt sie null Zusatzbereiche und zeigt „Einstellungen" — die Navigation sieht auf dieser einen Seite anders aus als auf allen übrigen.
**Reproduktion:** Als gewerblicher Nutzer `/bestand` bei 375 px öffnen. Betrifft auch die Upgrade-Hinweis-Variante derselben Seite.

#### BUG-3: Der Verkaufserlös lässt sich nicht nachtragen oder korrigieren — ~~Medium~~ **behoben am 2026-09-20**
**Datei:** `src/components/dealer-sold-list.tsx`
**Beschreibung:** Das Kriterium verlangt ausdrücklich, dass ein Erlös nachträglich erfassbar und korrigierbar ist. Die Zugriffsregel dafür ist vorhanden, die Oberfläche fehlt. Wer beim Kennzeichnen keinen Erlös angibt oder sich vertippt, kann das nicht mehr ändern.

#### BUG-4: Ein Kennzeichnen ist nicht zurücknehmbar — ~~Medium~~ **behoben am 2026-09-20**
**Datei:** `src/components/dealer-sold-list.tsx`
**Beschreibung:** Das Kriterium „Der Vorgang ist zurücknehmbar, solange das Fahrzeug noch existiert" ist nicht umgesetzt. Die Löschregel besteht, es fehlt die Schaltfläche. Ein Fehlklick im Dialog ist damit endgültig — zusammen mit BUG-1 bleibt das Fahrzeug außerdem dauerhaft doppelt gelistet.

### Sicherheitsaudit

| Prüfung | Ergebnis |
|---|---|
| Fremdes Konto liest Bestandsvorgänge | **Kein Befund** — Probe mit zwei echten Konten: Eigentümer sieht 1, Fremder sieht 0 |
| Käufer liest den Erlös des Verkäufers | **Kein Befund** — Probe mit dem Empfänger einer echten Übergabe: Verkäufer sieht 1, Käufer sieht 0. Genau dafür wurde die eigene Tabelle gebaut |
| Fremdes Fahrzeug in den eigenen Bestand schreiben | Kein Befund — Route prüft Besitz, Integrationstest deckt es ab |
| Verkaufsmeldung ohne Sitzung | Kein Befund — 401, per E2E bestätigt |
| Eingabeprüfung | Kein Befund — Datumsformat und Betragsgrenzen serverseitig; Verkaufsdatum vor Kaufdatum wird abgewiesen |
| Verknüpfung zur anonymen Preiserhebung | Kein Befund — getrennte Tabellen, kein gemeinsamer Bezug, PROJ-33 unverändert |
| Datensparsamkeit des Vorgangs | Kein Befund — keine Fahrzeugkennung, keine Käuferdaten (Integrationstest) |

### Regressionstest
- 783/783 Unit- und Integrationstests grün, davon 30 neu für dieses Feature
- PROJ-37 unberührt: Die gemeinsam genutzten Anzeigehilfen wurden nur verschoben, nicht geändert; die Werkstatt-Tests blieben grün
- Die Übergabe-Funktion wurde erweitert, nicht umgeschrieben — der Einschub steht vor dem Löschen, maschinell geprüft

### Nicht geprüft
- Der Upgrade-Hinweis ohne Premium (Beta-Modus macht jeden Plan zu Premium)
- Ein **echter** Verkauf über die Übergabe samt entstehendem Vorgang — dafür müsste das Testfahrzeug tatsächlich übertragen werden, was den Testbestand zerstören würde. Die Reihenfolge im Ablauf ist maschinell geprüft, der Durchlauf selbst nicht
- Verhalten bei vielen Fahrzeugen (Seitenweise ab 25) — dafür fehlen Daten
- Firefox (im Projekt kein Playwright-Ziel)

### Produktionsreife

**NICHT BEREIT** — ein Fehler der Stufe High.

**Vor dem Ausrollen zwingend:**
1. BUG-1 — ohne ihn trennt die Seite Bestand und Verkauftes nicht, und das ist ihr Zweck

**Vor dem Ausrollen empfohlen:**
2. BUG-4 (Zurücknehmen) und BUG-3 (Erlös nachtragen) — beide sind Kriterien, und solange BUG-1 besteht, wiegt ein Fehlklick besonders schwer
3. BUG-2 — kleiner Eingriff, zwei durchgereichte Werte

**Danach:** Den Upgrade-Hinweis außerhalb des Beta-Modus prüfen und einen echten Übergabe-Durchlauf mit einem Wegwerf-Fahrzeug nachziehen.

## Deployment

- **Produktions-URL:** https://www.oldtimer-docs.com
- **Ausgeliefert:** 2026-09-21
- **Deployment:** `dpl_8LJMcRzLUU11RPmGUWYRoXsd9T9r` (Commit `cffe502`, production, READY)

### Die Auslieferung hing zwei Wochen fest

Beide Features waren am 2026-09-06 fertig gepusht, kamen aber nicht heraus. Ursache war ein Cron-Eintrag aus PROJ-35, der das Limit des Hobby-Kontos überschritt: Vercel lehnte daraufhin **jedes** Deployment ab, bevor ein Build startete — ohne Fehlermeldung und ohne Eintrag im Dashboard. Einzelheiten im Nachtrag der PROJ-35-Spezifikation.

Nach dem Entfernen des Eintrags lief der Rollout an und brachte alle zwölf aufgestauten Commits mit.

### Nach der Auslieferung geprüft

| Prüfung | Ergebnis |
|---|---|
| Routen erreichbar | `/werkstatt` und `/bestand` antworten mit 307 zur Anmeldung |
| Unangemeldeter Zugriff | Keine Daten im ausgelieferten Dokument |
| Zugriffsschutz der Schnittstellen | In Produktion bestätigt (401 bzw. 404) |
| Datenbank | Alle Migrationen angewendet und verifiziert |

Geprüft mit `npx playwright test --config playwright.prod.config.ts` — die unangemeldeten Specs gegen die **ausgelieferte** Anwendung statt gegen den Entwicklungsserver: 6/6 grün.

### Umgebungsvariablen

Alle für dieses Feature nötigen Werte sind in Vercel gesetzt. Zwei Lücken betreffen es nicht, sind aber vermerkt:

- `ANTHROPIC_API_KEY` fehlt — betrifft allein den Scheckheft-Import (PROJ-35)
- `NEXT_PUBLIC_APP_URL` fehlt — unkritisch, alle Verwendungen haben einen Rückfall auf die Request-Herkunft

### Offen aus der Abnahme

Ein **echter Übergabe-Durchlauf** wurde nie gefahren — er hätte das Testfahrzeug dauerhaft übertragen. Geprüft sind Reihenfolge, Ergänzungslogik und Zugriffsregeln per Datenbankprobe. Das ist die größte verbleibende Lücke, und sie betrifft den Pfad, der beim ersten echten Händlerverkauf beschritten wird.

Dazu BUG-8 (Low): Beim Ergänzen eines Vorgangs bleibt das Verkaufsdatum der Kennzeichnung stehen — fachlich vertretbar, aber nirgends begründet.

- **Git-Tag:** `v1.38.0-PROJ-38`

## Fehlerbehebung BUG-1 (2026-09-20)

**Behoben in:** `supabase/migrations/20260920_proj38_bug1_vehicle_ref.sql` (angewendet), `src/app/api/dealer/sales/route.ts`, `src/app/bestand/page.tsx`

### Warum der Fehler entstand

Der Entwurf forderte zweierlei, das sich zu widersprechen schien: Der Vorgang soll das Fahrzeug **überleben**, und das verkaufte Fahrzeug soll den Bestand **verlassen**. Die Umsetzung löste das Erste durch Weglassen der Fahrzeugkennung — und machte das Zweite damit unmöglich.

### Die Auflösung

Eine **optionale** Kennung mit `ON DELETE SET NULL`:

- Sie erlaubt den Filter, solange das Fahrzeug existiert
- Sie wird beim Löschen des Fahrzeugs von selbst leer
- Der Vorgang bleibt trotzdem vollständig, weil Marke, Modell, Baujahr und alle Beträge als **Abschrift** daneben stehen — und genau diese Abschrift war der eigentliche Grund für die ursprüngliche Entscheidung

Gesetzt wird die Kennung nur beim Kennzeichnen von Hand. Bei einer Übergabe bleibt sie leer: Dort wechselt der Besitzer, das Fahrzeug verschwindet ohnehin aus dem Bestand, und eine Kennung, die auf das Fahrzeug eines anderen zeigt, hätte dort keinen Zweck.

### Belegt gegen die laufende Datenbank

Probe mit dem echten Testkonto und dem echten Testfahrzeug, anschließend zurückgerollt:

| Messung | Ergebnis |
|---|---|
| Bestand vor dem Kennzeichnen | 1 Fahrzeug |
| Bestand danach | **0** |
| Verkauft-Liste | 1 |
| Abschrift nach `vehicle_id = NULL` (simulierte Fahrzeuglöschung) | `E2E-Testfahrzeug Wegwerf 1970 / 1850000 → 2100000` — vollständig |

Die letzte Zeile ist die eigentliche Gegenprobe: Beide Anforderungen gelten nun zugleich.

### Auswirkung auf die Tests

Ein Integrationstest prüfte bisher ausdrücklich die **Abwesenheit** der Fahrzeugkennung — mit der Begründung, der Vorgang müsse das Fahrzeug überleben. Diese Begründung trägt nicht mehr: Das Überleben sichert die Abschrift plus `ON DELETE SET NULL`, nicht die fehlende Kennung. Der Test prüft jetzt das Gegenteil und trägt die neue Begründung im Kommentar.

**Stand:** Build erfolgreich, Lint ohne Fehler, 30/30 Tests der beiden Händler-Dateien grün.

In einem vollständigen Durchlauf fielen zwei fremde Dateien aus (`document-archive.test.tsx`, `scheckheft-import.test.ts`) — isoliert laufen beide grün. Das ist das bekannte Lastverhalten aus BEFUND-B und hat mit dieser Änderung nichts zu tun.

### Weiterhin offen
BUG-2, BUG-3 und BUG-4 sind unverändert. Der E2E-Test zu BUG-1 bleibt vorerst als bekannt markiert: Ein echter Durchlauf würde das Testfahrzeug dauerhaft kennzeichnen, und das Zurücknehmen fehlt noch (BUG-4). Sobald es da ist, kann der Test kennzeichnen, prüfen und aufräumen.

## Fehlerbehebung BUG-2, BUG-3 und BUG-4 (2026-09-20)

Damit sind alle vier Befunde des QA-Durchlaufs behoben.

### BUG-2 — Navigationspunkt auf der eigenen Seite
**Behoben in:** `src/app/bestand/page.tsx`

Die Seite prüft den Händlermodus ganz oben, reichte ihn aber weder an die Kopfzeile noch an die untere Leiste durch — an vier Stellen, die Upgrade-Variante eingeschlossen. Jetzt steht der Punkt „Bestand" auch dort, und die untere Leiste zählt den Bereich mit: Sie sieht auf dieser Seite nicht mehr anders aus als auf allen übrigen.

### BUG-3 und BUG-4 — Erlös nachtragen, Verkauf zurücknehmen
**Neu:** `src/app/api/dealer/sales/[id]/route.ts`, `src/components/dealer-sale-actions.tsx`

Beide Kriterien hatten Zugriffsregeln in der Datenbank, aber keine Oberfläche. Ergänzt wurde ein Menü je Zeile der Verkaufsliste:

- **Erlös nachtragen oder korrigieren.** Ein leeres Feld entfernt den Erlös wieder — der Vorgang bleibt, nur die Spanne entfällt. Kein Erlös und ein Erlös von null sind verschiedene Aussagen; die Route hält sie auseinander, und ein Test hält das fest.
- **Verkauf zurücknehmen.** Löscht ausschließlich den Vorgang. Das Fahrzeug bleibt unberührt und kehrt allein dadurch in den Bestand zurück; der Sicherheitshinweis im Dialog sagt das ausdrücklich.

Beide Zugriffe binden an das eigene Konto. Ein fremder Vorgang wird als „nicht gefunden" beantwortet — wer raten will, ob eine fremde Kennung existiert, erfährt es hier nicht.

### Der Testdurchlauf, der vorher unmöglich war

Der E2E-Test zu BUG-1 war ausgesetzt, weil ein echtes Kennzeichnen ohne Rücknahme nicht wiederholbar gewesen wäre. Mit BUG-4 geht er jetzt vollständig durch und deckt drei Behebungen in einem Ablauf ab:

1. Fahrzeug kennzeichnen (Erlös 21.000 €)
2. **BUG-1:** Bestand zeigt „0 Fahrzeuge", der Vorgang steht unter „Verkauft", Rohspanne 2.500 €
3. **BUG-3:** Erlös auf 22.000 € korrigieren → Spanne 3.500 €
4. **BUG-4:** zurücknehmen → Fahrzeug wieder im Bestand, Verkaufsliste wieder leer

Der Test räumt damit hinter sich auf und ist beliebig wiederholbar.

**Stand:** 12/12 E2E grün, 14/14 Tests der Händler-Route grün, Lint ohne Fehler, Typprüfung sauber.

## QA Test Results — zweiter Durchlauf (2026-09-20)

**Anlass:** Nachprüfung der vier behobenen Befunde
**Ergebnis:** Alle vier bestätigt behoben. Drei **neue** Befunde, die aus den Behebungen folgen — einer davon wiegt schwerer als die behobenen.
**Testlauf:** 790/790 Unit- und Integrationstests grün, 34/35 E2E grün (1 übersprungen), Build erfolgreich, Lint ohne Fehler

### Nachprüfung der Behebungen

| Fehler | Ergebnis | Beleg |
|---|---|---|
| BUG-1 | **Behoben** | E2E-Durchlauf: nach dem Kennzeichnen „0 Fahrzeuge im Bestand", Vorgang unter „Verkauft", Rohspanne 2.500 € |
| BUG-2 | **Behoben** | E2E bei 375 px: Punkt „Bestand" steht in der unteren Leiste der Bestandsseite |
| BUG-3 | **Behoben** | E2E: Erlös von 21.000 auf 22.000 € korrigiert, Spanne wechselt auf 3.500 € |
| BUG-4 | **Behoben** | E2E: Rücknahme stellt den Bestand wieder her, Verkaufsliste wieder leer |

Besonders wertvoll: Der Durchlauf räumt hinter sich auf und ist dadurch wiederholbar — vorher war er gar nicht möglich.

### Neue Befunde

#### BUG-5: Ein zurückgenommener Übergabe-Vorgang ist unwiederbringlich — ~~High~~ **behoben am 2026-09-20**
**Dateien:** `src/app/api/dealer/sales/[id]/route.ts`, `src/components/dealer-sale-actions.tsx:180`
**Beschreibung:** Das Zurücknehmen löscht jeden Vorgang, auch einen aus einer Fahrzeugübergabe (`origin = 'transfer'`). Ein solcher Vorgang lässt sich **nicht wiederherstellen**: Sein Einkaufspreis stammt aus `vehicle_purchases`, und die Zeile wurde beim Annehmen der Übergabe gelöscht (PROJ-32). Das Fahrzeug gehört inzwischen dem Käufer.
**Verschärfend ist der Bestätigungstext:** Er sagt, das Fahrzeug „erscheint wieder im Bestand — sofern es noch existiert". Bei einem Übergabe-Vorgang existiert es, gehört aber einem anderen und kehrt nicht zurück. Der Dialog beschreibt also eine harmlose Folge, während die tatsächliche Folge unwiederbringlicher Datenverlust ist.
**Reproduktion:** Fahrzeug per Übergabe verkaufen, im Bestandsbereich unter „Verkauft" den Vorgang zurücknehmen. Der Verkauf ist aus der Auswertung verschwunden und nicht wiederherstellbar.
**Warum nicht Critical:** Es ist eine bewusste Aktion mit Bestätigung, kein stiller Verlust. Die Bestätigung führt jedoch in die Irre, und die Aktion ist zwei Klicks entfernt.
**Empfehlung:** Für `origin = 'transfer'` entweder sperren oder mit einem eigenen, deutlichen Hinweis versehen („Dieser Vorgang stammt aus einer Übergabe und kann nicht wiederhergestellt werden"). Den Text für den anderen Fall entsprechend trennen.

#### BUG-6: Dasselbe Fahrzeug kann zweimal als verkauft erscheinen — ~~Medium~~ **behoben am 2026-09-20**
**Datei:** Migration `20260919_proj38_haendler_bestand.sql`, Abschnitt 4 (`accept_vehicle_transfer`)
**Beschreibung:** Die Übergabe prüft nicht, ob für dieses Fahrzeug bereits ein Vorgang besteht. Realistischer Ablauf: Der Händler kennzeichnet ein Fahrzeug als verkauft (Käufer ohne Konto), der Käufer legt später doch ein Konto an, und die Übergabe wird nachgeholt. Ergebnis: **zwei** Vorgänge zum selben Verkauf, und die Rohspanne wird doppelt gezählt.
**Beleg:** Die Funktionsdefinition enthält keine Prüfung auf einen bestehenden Vorgang (maschinell geprüft).
**Empfehlung:** Beim Schreiben aus der Übergabe einen vorhandenen Vorgang zum selben Fahrzeug erkennen und ihn ergänzen statt einen zweiten anzulegen.

#### BUG-7: Der Rücknahme-Text trifft für Übergabe-Vorgänge nicht zu — ~~Low~~ **behoben am 2026-09-20**
**Datei:** `src/components/dealer-sale-actions.tsx:180`
**Beschreibung:** Siehe BUG-5. Auch unabhängig vom Datenverlust ist die Aussage „erscheint wieder im Bestand" für Vorgänge aus einer Übergabe schlicht falsch — das Fahrzeug gehört dem Käufer. Wird BUG-5 behoben, erledigt sich dieser Punkt mit.

### Sicherheitsaudit der neuen Route

| Prüfung | Ergebnis |
|---|---|
| Ändern ohne Sitzung | Kein Befund — 401, Test vorhanden |
| Zurücknehmen ohne Sitzung | Kein Befund — 401, Test vorhanden |
| Fremder Vorgang | Kein Befund — beide Zugriffe filtern auf `user_id` und antworten mit „nicht gefunden", ohne die Existenz preiszugeben |
| Betragsgrenzen | Kein Befund — serverseitig geprüft |
| Erlös entfernen vs. auf null setzen | Kein Befund — werden auseinandergehalten, Test vorhanden |

### Regressionstest
- 790/790 Unit- und Integrationstests grün — diesmal ohne die sonst beobachteten Lastausfälle
- PROJ-37 unberührt: Werkstatt-Suiten vollständig grün, obwohl die Navigation für zwei Zusatzbereiche erweitert wurde
- 34/35 E2E grün über beide Features

### Produktionsreife (zweiter Durchlauf)

**NICHT BEREIT** — ein Fehler der Stufe High.

**Vor dem Ausrollen zwingend:**
1. BUG-5 — unwiederbringlicher Verlust hinter einer Bestätigung, die das Gegenteil verspricht

**Vor dem Ausrollen empfohlen:**
2. BUG-6 — eine doppelt gezählte Spanne macht die Auswertung falsch, und genau dafür gibt es die Seite

**Danach:** BUG-7 erledigt sich mit BUG-5.

## Fehlerbehebung BUG-5, BUG-6 und BUG-7 (2026-09-20)

Damit sind alle sieben Befunde beider QA-Durchläufe behoben.

### BUG-6 — kein zweiter Vorgang zum selben Verkauf
**Behoben in:** `supabase/migrations/20260920_proj38_bug6_kein_doppelvorgang.sql` (angewendet)

Die Übergabe legte immer einen neuen Vorgang an. Jetzt wird ein vorhandener Vorgang zum selben Fahrzeug **ergänzt** statt verdoppelt: Die Herkunft wechselt auf „Übergabe", ein beim Absenden erfasster Erlös ersetzt den alten, und die Fahrzeugkennung wird geleert — sie zeigt ab jetzt auf ein Fahrzeug, das dem Käufer gehört.

Die Funktion wurde erneut Zeile für Zeile aus der vorherigen Fassung übernommen; geändert ist allein dieser Block.

**Belegt gegen die laufende Datenbank** (zurückgerollt): Ein von Hand gekennzeichnetes Fahrzeug, danach der Übergabe-Ablauf — Vorgänge vorher **1**, nachher **1**. Herkunft auf `transfer` gewechselt, Erlös aktualisiert, Kennung geleert.

### BUG-5 und BUG-7 — der Dialog sagt, was wirklich geschieht
**Behoben in:** `src/lib/dealer-inventory.ts`, `src/components/dealer-sale-actions.tsx`

Das Entfernen eines Vorgangs hat je nach Herkunft völlig verschiedene Folgen, und die Oberfläche benannte beide gleich:

| | Von Hand gekennzeichnet | Aus einer Übergabe |
|---|---|---|
| Menü | „Verkauf zurücknehmen" | „Vorgang löschen" |
| Sicherheitsabfrage | „Verkauf zurücknehmen?" | „Vorgang endgültig löschen?" |
| Aussage | Fahrzeug erscheint wieder im Bestand | **Nicht wiederherstellbar** — Einkaufspreis beim Besitzerwechsel gelöscht, Fahrzeug gehört dem Käufer |
| Schaltfläche | „Zurücknehmen" | „Endgültig löschen" (rot) |
| Meldung | „…steht wieder im Bestand" | „Vorgang gelöscht" |

Gelöscht werden darf weiterhin beides — es sind die Daten des Händlers. Nur verspricht der Dialog jetzt nicht mehr eine Rückkehr, die nicht eintritt.

**Die Entscheidung liegt in der Logikschicht, nicht in der Komponente.** Ein Versuch, sie per Komponententest zu prüfen, scheiterte an Radix: Dessen Menüs reagieren nicht auf einfache Klick-Ereignisse in jsdom, und ein Test, der das nachbaut, prüft mehr Bedienbibliothek als eigene Aussage. Stattdessen entscheidet `saleRemovalWording()` über Benennung und Endgültigkeit; die Komponente stellt nur dar. Drei Tests sichern das ab — darunter einer, der festhält, dass die Zusage „zurück in den Bestand" **nur** dort steht, wo sie eintritt.

**Stand:** 793/793 Unit- und Integrationstests grün, 12/12 E2E grün, Build erfolgreich, Lint ohne Fehler.

### Nicht durch einen Test abgedeckt
Ein echter Übergabe-Durchlauf mit anschließendem Löschen des entstandenen Vorgangs. Dafür müsste das Testfahrzeug tatsächlich übertragen werden, was den Testbestand zerstört. Die Benennung ist durch Tests der Logikschicht abgedeckt, die Ergänzungslogik durch die Datenbankprobe oben.

## QA Test Results — dritter Durchlauf (2026-09-20)

**Anlass:** Nachprüfung von BUG-5, BUG-6 und BUG-7
**Ergebnis:** Alle drei bestätigt behoben. Ein neuer Befund der Stufe Low, kein Critical, kein High.
**Testlauf:** 793/793 Unit- und Integrationstests grün, 29/29 E2E seriell grün, Build erfolgreich, Lint ohne Fehler

### Nachprüfung der Behebungen

| Fehler | Ergebnis | Beleg |
|---|---|---|
| BUG-5 | **Behoben** | `saleRemovalWording` trennt Benennung und Endgültigkeit; drei Tests, darunter einer, der festhält, dass die Zusage „zurück in den Bestand" nur dort steht, wo sie eintritt |
| BUG-6 | **Behoben** | Datenbankprobe: vorhandener Vorgang wird ergänzt, nicht verdoppelt — vorher 1, nachher 1, Herkunft auf `transfer`, Kennung geleert |
| BUG-7 | **Behoben** | Erledigt mit BUG-5: Der Text für Übergabe-Vorgänge verspricht keine Rückkehr mehr |

Bemerkenswert an der BUG-5-Behebung: Die Entscheidung liegt jetzt in der Logikschicht, und die Komponente bezieht ihre Texte von dort. Damit können Test und Oberfläche nicht mehr auseinanderlaufen — bei einem reinen Komponententest wäre genau das möglich geblieben.

### Sicherheitsaudit — nach Änderung der Übergabe-Funktion wiederholt

Die Übergabe-Funktion wurde für BUG-6 erneut angefasst; deshalb wurden die tragenden Proben wiederholt (alle zurückgerollt):

| Prüfung | Ergebnis |
|---|---|
| Käufer liest den Erlös des Verkäufers | **Kein Befund** — Verkäufer sieht 1, Käufer 0 |
| Fremdes Konto liest Bestandsvorgänge | **Kein Befund** — 0 sichtbar |
| Ändern und Löschen fremder Vorgänge | Kein Befund — beide Routen filtern auf `user_id`, Tests vorhanden |

### Neuer Befund

#### BUG-8: Das Verkaufsdatum eines ergänzten Vorgangs bleibt unkommentiert stehen — **Low**
**Datei:** Migration `20260920_proj38_bug6_kein_doppelvorgang.sql`
**Beschreibung:** Wird ein von Hand gekennzeichneter Vorgang später durch die Übergabe ergänzt, bleibt `sold_on` auf dem Datum der Kennzeichnung. Das ist fachlich vertretbar — der Verkauf fand statt, als der Händler ihn eintrug, die Übergabe ist die nachgeholte Dokumentation — und wirkt sich auf die ausgewiesene Standzeit aus.
**Warum trotzdem ein Befund:** Die Entscheidung steht nirgends. Weder Kommentar noch Spezifikation sagen, welches der beiden Daten gilt; die drei Nachbarzeilen begründen ihr Verhalten, diese nicht.
**Empfehlung:** Einen Satz im Migrationskommentar ergänzen. Kein Verhaltenswechsel nötig.

### Beobachtung zu BEFUND-B (nicht dieses Feature)

Im gemeinsamen Lauf aller fünf E2E-Dateien fielen vier Tests mit `toHaveURL`-Zeitüberschreitungen aus — dieselben PROJ-30-Tests, für die in BEFUND-A bereits ein Zeitrahmen von 30 Sekunden gesetzt wurde. Seriell ausgeführt laufen dieselben Dateien vollständig grün (29/29).

**Das heißt: Der erhöhte Zeitrahmen reicht unter voller Parallellast nicht.** Die dort vorgeschlagene Lösung — diese Tests gegen einen Produktionsbau statt gegen den Entwicklungsserver laufen zu lassen — ist damit nicht mehr nur eine Randnotiz, sondern der eigentliche Ausweg.

### Regressionstest
- 793/793 Unit- und Integrationstests grün
- PROJ-37 (Werkstatt) und PROJ-30 (Navigation) seriell vollständig grün
- PROJ-38: 12/12

### Produktionsreife (dritter Durchlauf)

**BEREIT.** Kein Critical, kein High. Alle acht Befunde der drei Durchläufe sind behoben oder von Low-Schwere ohne Verhaltensfehler.

**Bewusst nicht abgedeckt — beim Ausrollen im Blick behalten:**
1. **Ein echter Übergabe-Durchlauf** wurde nie gefahren: Er würde das Testfahrzeug dauerhaft übertragen. Geprüft sind die Reihenfolge im Ablauf, die Ergänzungslogik und die Zugriffsregeln — jeweils per Datenbankprobe, nicht als durchlaufener Vorgang. Das ist die größte verbleibende Lücke, und sie betrifft den Pfad, der beim ersten echten Händlerverkauf beschritten wird.
2. **Der Upgrade-Hinweis ohne Premium** ist im Beta-Modus nicht prüfbar.
3. **Verhalten bei vielen Fahrzeugen** (Seitenweise ab 25) — dafür fehlen Daten.
4. **BUG-8** sollte bei Gelegenheit dokumentiert werden.
