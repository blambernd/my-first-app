# PROJ-38: Händler-Bestandsübersicht

## Status: Planned
**Created:** 2026-09-06
**Last Updated:** 2026-09-06

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
- [ ] Fahrzeuge oberhalb einer einstellbaren Schwelle (Voreinstellung 180 Tage) werden als Langsteher hervorgehoben
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

### Verkaufte Fahrzeuge
- [ ] Nach der Übergabe an den Käufer bleibt beim Händler ein Bestandsdatensatz erhalten mit: Marke, Modell, Baujahr, Kaufdatum, Verkaufsdatum, Standzeit, Einkaufspreis, Verkaufserlös
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
