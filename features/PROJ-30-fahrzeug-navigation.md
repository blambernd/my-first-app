# PROJ-30: Fahrzeug-Navigation & UX-Überarbeitung

## Status: Planned
**Created:** 2026-08-01
**Last Updated:** 2026-08-01

## Kontext

Der Fahrzeugbereich hat inzwischen sieben Hauptbereiche und unter „Kosten" vier
weitere Unterbereiche. Beides wird heute als horizontale Reiterleiste dargestellt —
im Kostenbereich stehen dadurch zwei Navigationsebenen übereinander. Das ist der
eigentliche Grund für die Unübersichtlichkeit, nicht die Breite der Leiste.

Eine seitliche Navigation löst das strukturell: Unterbereiche klappen unter ihrem
Hauptbereich auf, statt eine zweite Leiste zu erzeugen.

## Dependencies
- Requires: PROJ-1 (User Authentication) — für angemeldete Nutzer und Rollenprüfung
- Requires: PROJ-2 (Fahrzeugprofil) — der Bereich, dessen Navigation umgebaut wird
- Requires: PROJ-6 (Rollen & Kollaboration) — Besitzer/Mitglied-Unterscheidung
- Requires: PROJ-8 (Freemium-Modell) — Premium-Kennzeichnung im Menü
- Betrifft: PROJ-20 (Mobile Responsive) — Mobile-Verhalten wird hier mitentschieden

## User Stories

- Als Fahrzeugbesitzer möchte ich alle Bereiche meines Fahrzeugs in einer seitlichen
  Navigation sehen, damit ich auf einen Blick erfasse, was es überhaupt gibt.
- Als Fahrzeugbesitzer möchte ich im Kostenbereich nicht zwei Menüleisten übereinander
  haben, damit ich weiß, wo ich mich befinde.
- Als Besitzer mehrerer Fahrzeuge möchte ich direkt zwischen ihnen wechseln können,
  ohne den Umweg über das Dashboard zu nehmen.
- Als Fahrzeugbesitzer möchte ich, dass der Kopfbereich den Fahrzeugnamen betont
  statt fünf gleichrangiger Schaltflächen, damit ich weiß, welches Auto ich ansehe.
- Als eingeladene Werkstatt möchte ich keine Menüeinträge sehen, die mich auf eine
  Fehlerseite führen, damit ich der Anwendung vertrauen kann.
- Als zahlender Premium-Nutzer möchte ich nicht dauerhaft mit „Premium" beworben
  werden, wenn ich bereits bezahle.
- Als Nutzer auf dem Smartphone möchte ich die Fahrzeugnavigation weiterhin bequem
  erreichen, ohne dass sie den knappen Bildschirm dauerhaft verstellt.

## Acceptance Criteria

### Seitliche Navigation
- [ ] Im Fahrzeugbereich steht die Navigation ab Desktop-Breite (≥ 1024 px) links
      neben dem Inhalt statt als horizontale Leiste darüber.
- [ ] Die Navigation enthält dieselben sieben Bereiche wie bisher: Übersicht,
      Scheckheft, Historie, Dokumente, Tankbuch, Kosten, Verkaufsassistent.
      Es kommt kein Bereich hinzu und keiner entfällt.
- [ ] „Kosten" lässt sich aufklappen und zeigt die vier Unterbereiche
      (Laufende Kosten, Einzelkosten, Auswertung, Wertentwicklung) eingerückt darunter.
- [ ] Beim Aufruf einer Kosten-Unterseite ist „Kosten" automatisch aufgeklappt und
      der aktive Unterbereich hervorgehoben.
- [ ] Auf Kosten-Seiten erscheint keine zweite horizontale Reiterleiste mehr.
- [ ] Der aktive Bereich ist in der Navigation eindeutig hervorgehoben.
- [ ] Die Navigation lässt sich per Schaltfläche auf reine Symbole reduzieren und
      wieder ausklappen.
- [ ] Der ein- oder ausgeklappte Zustand bleibt über Seitenwechsel und über die
      nächste Sitzung hinweg erhalten.
- [ ] Im reduzierten Zustand zeigt ein Tooltip beim Überfahren den Namen des Bereichs.
- [ ] Der Inhaltsbereich wird durch die Navigation nicht schmaler als heute
      (heute 1024 px); die verfügbare Breite wächst entsprechend mit.

### Kopfbereich
- [ ] Fahrzeugname und Erstzulassung bleiben als Kopfzeile über dem Inhalt stehen.
- [ ] Von den bisher fünf Bedienelementen sind nur noch zwei unmittelbar sichtbar:
      der Sichtbarkeits-Status und „Bearbeiten".
- [ ] „Transfer", „Freigabe" und „Fahrzeug löschen" sind über ein Überlaufmenü
      erreichbar und bleiben in ihrer Funktion unverändert.
- [ ] „Fahrzeug löschen" ist im Überlaufmenü visuell als destruktiv gekennzeichnet
      und behält seine bestehende Sicherheitsabfrage.
- [ ] Nicht-Besitzer sehen weiterhin ausschließlich „Fahrzeug verlassen".

### Fahrzeugwechsel
- [ ] Besitzt der Nutzer Zugriff auf genau ein Fahrzeug, zeigt der Kopf der Navigation
      nur den Fahrzeugnamen ohne Auswahlmöglichkeit.
- [ ] Ab zwei zugänglichen Fahrzeugen öffnet ein Klick auf den Fahrzeugnamen eine
      Auswahlliste.
- [ ] Die Auswahlliste trennt eigene Fahrzeuge sichtbar von geteilten Fahrzeugen
      (als Mitglied oder Werkstatt).
- [ ] Die Auswahl eines Fahrzeugs führt auf denselben Unterbereich des neuen Fahrzeugs,
      sofern dort zugänglich — andernfalls auf dessen Übersicht.
- [ ] Die Auswahlliste enthält am Ende „Fahrzeug anlegen".
- [ ] Das aktuell geöffnete Fahrzeug ist in der Liste als aktiv erkennbar.

### Berechtigungen
- [ ] Nutzer ohne Besitzerrolle sehen die Einträge „Kosten" und „Verkaufsassistent"
      überhaupt nicht — weder den Hauptbereich noch dessen Unterbereiche.
- [ ] Ein Besitzer sieht unverändert alle Bereiche.

### Premium-Kennzeichnung
- [ ] Ein Nutzer ohne Premium sieht am „Verkaufsassistent" eine Kennzeichnung, dass
      der Bereich kostenpflichtig ist.
- [ ] Ein Nutzer mit Premium oder aktivem Trial sieht am „Verkaufsassistent" keine
      Kennzeichnung mehr.
- [ ] Solange der Abostatus noch geladen wird, erscheint keine Kennzeichnung, die
      danach wieder verschwindet.

### Mobile
- [ ] Unterhalb der Desktop-Breite ist die Fahrzeugnavigation über ein Symbol im
      Kopfbereich erreichbar und öffnet sich seitlich als überlagerndes Panel.
- [ ] Die Auswahl eines Bereichs schließt das Panel und navigiert dorthin.
- [ ] Die bestehende untere Leiste (Dashboard, Einstellungen, Meldungen, Menü)
      bleibt unverändert erhalten und wird nicht überlagert.
- [ ] Bedienflächen bleiben mindestens 44 px hoch.

### Aufräumen
- [ ] Die Unternavigation des Kostenbereichs wird nicht mehr in jeder der vier
      Kosten-Seiten einzeln eingebunden.
- [ ] Alle bestehenden Fahrzeugseiten sind nach dem Umbau unverändert erreichbar;
      bestehende Verlinkungen (Lesezeichen, interne Links) funktionieren weiter.

## Edge Cases

- **Ein Fahrzeug, keine Auswahl:** Der Switcher darf nicht als klickbares Element
  erscheinen, wenn es nichts zu wählen gibt.
- **Nur geteilte Fahrzeuge:** Ein Nutzer ohne eigene Fahrzeuge, der nur als Werkstatt
  eingeladen wurde, sieht in der Auswahl nur die geteilte Gruppe — die Gruppe
  „Meine Fahrzeuge" wird dann nicht als leere Überschrift gezeigt.
- **Wechsel in einen gesperrten Bereich:** Wer als Besitzer unter „Kosten" steht und
  auf ein geteiltes Fahrzeug wechselt, darf dort nicht auf einer Fehlerseite landen,
  sondern auf der Übersicht.
- **Sehr viele Fahrzeuge:** Die Auswahlliste muss auch bei zweistelliger Anzahl
  bedienbar bleiben (scrollbar, begrenzte Höhe).
- **Sehr lange Fahrzeugnamen:** Marke und Modell dürfen die Navigation nicht
  aufbrechen — Text wird abgeschnitten, der vollständige Name bleibt im Tooltip lesbar.
- **Reduzierte Navigation + Kosten aufgeklappt:** Im Symbol-Modus ist kein Platz für
  eingerückte Unterbereiche — sie müssen dort anders erreichbar sein (z. B. als
  aufklappendes Untermenü neben dem Symbol).
- **Direktaufruf eines gesperrten Bereichs:** Ruft ein Mitglied `/kosten` oder
  `/verkaufsassistent` direkt per URL auf, greift weiterhin die bestehende
  Zugriffsprüfung — das Ausblenden im Menü ersetzt sie nicht.
- **Abostatus wechselt während der Sitzung:** Schließt ein Nutzer ein Abo ab, muss
  die Premium-Kennzeichnung ohne vollständigen Neuladen verschwinden.
- **Erste Sitzung ohne gespeicherten Zustand:** Ohne vorherige Präferenz startet die
  Navigation ausgeklappt.
- **Schmaler Desktop (1024–1280 px):** Navigation und Inhalt müssen nebeneinander
  nutzbar bleiben; notfalls startet die Navigation in diesem Bereich reduziert.

## Technical Requirements (optional)
- Es wird die bereits installierte Sidebar-Komponente aus shadcn/ui verwendet;
  keine Eigenentwicklung einer Navigationskomponente.
- Zugriffsschutz bleibt serverseitig maßgeblich; das Ausblenden im Menü ist reine
  Bequemlichkeit, keine Sicherheitsmaßnahme.
- Kein Wechsel des Routings: alle bestehenden Pfade unter `/vehicles/[id]/...`
  bleiben unverändert.
- Barrierefreiheit: Navigation per Tastatur vollständig bedienbar, aktiver Eintrag
  für Screenreader ausgezeichnet.
- Getestete Breiten: 375 px, 768 px, 1024 px, 1440 px.

## Offene Punkte für /architecture
- Ob der Fahrzeug-Switcher die Fahrzeugliste serverseitig im Layout lädt oder
  clientseitig nachlädt — beeinflusst die wahrgenommene Geschwindigkeit.
- Wie der Sidebar-Zustand gespeichert wird, ohne bei der Server-Auslieferung zu
  flackern.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
