# PROJ-30: Fahrzeug-Navigation & UX-Überarbeitung

## Status: Architected
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

**Erstellt:** 2026-08-02

### Vorab: Die Spec beschreibt sieben Bereiche — es sind noch sechs

Die Akzeptanzkriterien nennen „dieselben sieben Bereiche wie bisher: Übersicht, Scheckheft, Historie, Dokumente, Tankbuch, Kosten, Verkaufsassistent". Am 2026-08-02 wurde der **Verkaufsassistent ausgesetzt**, weil der Marktüberblick keine belastbaren Preise liefert (siehe PROJ-29). Er steht heute nicht mehr in der Navigation. Ebenso fehlt die Ersatzteil-Suche, die schon früher wegen Ergebnisqualität stillgelegt wurde.

Damit betrifft die Spec zwei Kriterien, die so nicht mehr zutreffen:
- „Die Navigation enthält dieselben sieben Bereiche" → es sind **sechs**
- Der gesamte Abschnitt **Premium-Kennzeichnung** hängt am Verkaufsassistenten und läuft derzeit ins Leere

**Vorschlag:** Die Navigation wird von einer zentralen Bereichsliste gespeist, in der jeder Eintrag an- und abschaltbar ist. Ausgesetzte Bereiche verschwinden dadurch von selbst und kehren zurück, sobald ihr Schalter umgelegt wird — ohne die Navigation erneut anzufassen. Die Premium-Kennzeichnung wird trotzdem gebaut, weil sie beim Wiedereinschalten sofort gebraucht wird; sie ist dann nur an keinem sichtbaren Eintrag aktiv.

### A) Aufbau der Oberfläche

```
Fahrzeug-Layout (umschließt alle Fahrzeugseiten)
│
├── Seitennavigation (ab 1024 px links, darunter überlagernd)
│   ├── Kopf: Fahrzeugwechsel
│   │   ├── ein Fahrzeug   → nur der Name, nicht anklickbar
│   │   └── mehrere        → Auswahlliste
│   │        ├── Gruppe „Meine Fahrzeuge"
│   │        ├── Gruppe „Geteilte Fahrzeuge"   (nur wenn vorhanden)
│   │        └── „Fahrzeug anlegen"
│   │
│   ├── Bereichsliste
│   │   ├── Übersicht
│   │   ├── Scheckheft
│   │   ├── Historie
│   │   ├── Dokumente
│   │   ├── Tankbuch
│   │   ├── Kosten            ← aufklappbar, nur für Besitzer
│   │   │    ├── Laufende Kosten
│   │   │    ├── Einzelkosten
│   │   │    ├── Auswertung
│   │   │    └── Wertentwicklung
│   │   └── (Verkaufsassistent — derzeit abgeschaltet)
│   │
│   └── Fuß: Schaltfläche zum Ein- und Ausklappen
│
└── Inhaltsbereich
    ├── Kopfzeile
    │   ├── Fahrzeugname und Erstzulassung
    │   ├── Sichtbarkeits-Status
    │   ├── „Bearbeiten"
    │   └── Überlaufmenü  →  Transfer · Freigabe · Fahrzeug löschen
    │
    └── Seiteninhalt (unverändert)
```

Die vier Kosten-Seiten binden ihre Unternavigation heute **jeweils selbst** ein. Diese Einbindung entfällt ersatzlos — die Unterbereiche stehen künftig nur noch in der Seitennavigation. Das ist der eigentliche Kern der Aufgabe: nicht die Leiste wird schmaler, sondern die zweite Ebene verschwindet.

### B) Welche Angaben gebraucht werden

**Für den Fahrzeugwechsel** wird eine Liste der zugänglichen Fahrzeuge gebraucht: je Fahrzeug Kennung, Marke, Modell und ob es ein eigenes oder ein geteiltes ist. Mehr nicht — kein Bild, keine Kennzahlen.

**Für die Bereichsliste** genügt eine im Programm hinterlegte Aufstellung: Name, Ziel, Symbol, ob nur für Besitzer, ob kostenpflichtig, ob derzeit abgeschaltet. Diese Aufstellung ist keine Datenbanktabelle, sondern Teil des Programms — sie ändert sich nur, wenn Entwickler einen Bereich hinzufügen.

**Für den ein-/ausgeklappten Zustand** wird ein einzelner Merker je Nutzer gebraucht: aufgeklappt oder reduziert.

**Neue Datenbanktabellen werden nicht gebraucht.** Rolle und Abostatus sind bereits vorhanden und werden heute schon geladen.

### C) Technische Entscheidungen

**1. Die Fahrzeugliste wird serverseitig geladen — offener Punkt aus der Spec**

Das Fahrzeug-Layout holt heute bereits Fahrzeug und Rolle vom Server. Die Liste der übrigen Fahrzeuge kommt aus derselben Quelle und wird im selben Zug mitgeladen. Vorteil: Der Fahrzeugname steht sofort da, ohne dass erst ein leerer Platzhalter erscheint und nachträglich gefüllt wird. Bei der zu erwartenden Anzahl — Privatsammler haben selten mehr als eine Handvoll Fahrzeuge — fällt die zusätzliche Abfrage nicht ins Gewicht.

**2. Der Klappzustand wird in einem Cookie gehalten — offener Punkt aus der Spec**

Die Spec fragt, wie der Zustand gespeichert wird, „ohne bei der Server-Auslieferung zu flackern". Die Antwort liefert die bereits installierte Sidebar-Komponente: Sie legt den Zustand in einem Cookie ab. Cookies schickt der Browser bei jedem Aufruf mit, **der Server kennt den Zustand also schon beim Ausliefern** und baut die Seite gleich richtig auf.

Der naheliegende Weg — Speicherung im Browser-Speicher — hätte genau das Flackern erzeugt: Der Server weiß nichts davon, liefert die Navigation aufgeklappt aus, und der Browser klappt sie unmittelbar danach zusammen. Dieselbe Ursache steckte hinter dem Hydration-Fehler, der am 2026-08-02 im Dashboard behoben wurde. Der Cookie-Weg vermeidet das strukturell.

**3. Die vorhandene Sidebar-Komponente wird verwendet, nicht nachgebaut**

Sie ist bereits im Projekt installiert und bringt alles Verlangte mit: eingerückte Unterpunkte, Reduktion auf Symbole, Tooltips im reduzierten Zustand, das überlagernde Panel für schmale Bildschirme und Tastaturbedienung. Ein Eigenbau würde Wochen kosten und wäre bei der Barrierefreiheit schlechter.

**4. Die Bereichsliste steht an genau einer Stelle**

Heute ist die Fahrzeugnavigation an einer Stelle gepflegt, die Kosten-Unternavigation an einer zweiten, und jede Kosten-Seite bindet Letztere einzeln ein. Künftig gibt es **eine** Aufstellung, aus der sich beide Ebenen speisen. Wer einen Bereich hinzufügt, ändert eine Datei — heute sind es mehrere. PROJ-31 fügt später nur einen Eintrag „Überblick" unter „Kosten" hinzu und muss die Navigation selbst nicht anfassen.

**5. Ausblenden ersetzt keine Zugriffsprüfung**

Bereiche, die einem Mitglied nicht zustehen, verschwinden aus dem Menü. Die eigentliche Absicherung bleibt unverändert dort, wo sie heute ist: auf dem Server, bei jedem Seitenaufruf. Wer eine Adresse direkt eingibt, wird weiterhin abgewiesen. Das Menü ist Bequemlichkeit, kein Schutz.

**6. Die Premium-Kennzeichnung erscheint erst, wenn der Status bekannt ist**

Solange der Abostatus geladen wird, bleibt die Kennzeichnung aus. Andernfalls sähe ein zahlender Nutzer für einen Moment eine Kaufaufforderung, die dann verschwindet — das wirkt wie ein Fehler. Wechselt der Status während der Sitzung, verschwindet die Kennzeichnung ohne Neuladen.

**7. An den Adressen ändert sich nichts**

Alle bestehenden Pfade bleiben, wie sie sind. Lesezeichen und interne Verweise funktionieren unverändert. Das ist eine bewusste Einschränkung: Die Aufgabe ist eine Navigations-Überarbeitung, kein Umbau der Seitenstruktur.

### D) Was zusätzlich installiert werden muss

**Nichts.** Sämtliche benötigten Bausteine liegen bereits im Projekt: Seitennavigation, aufklappbare Bereiche, Tooltips, Überlaufmenü, überlagerndes Panel und Ladeplatzhalter.

### E) Was dieses Feature bewusst nicht tut

- **Keine neue Seite.** Der Kostenbereich bekommt seinen eigenen Einstieg erst mit PROJ-31.
- **Keine Änderung an den Inhalten** der bestehenden Fahrzeugseiten.
- **Keine Wiederbelebung** von Verkaufsassistent oder Ersatzteil-Suche — die Navigation hält den Platz frei, mehr nicht.
- **Kein Umbau der unteren Leiste** auf Mobilgeräten; sie bleibt unverändert.

### F) Risiken und offene Punkte für die Umsetzung

**Der reduzierte Zustand und die Kosten-Unterbereiche vertragen sich schlecht.** Im Symbol-Modus ist kein Platz für eingerückte Einträge. Die Spec nennt das bereits als Grenzfall. Vorgesehen: Im reduzierten Zustand öffnet ein Klick auf das Kosten-Symbol die Unterbereiche als kleines Menü daneben. Das ist beim Bauen zu prüfen — wenn es sich sperrig anfühlt, ist die Alternative, im Symbol-Modus direkt auf den Kostenbereich zu springen.

**Der Wechsel auf denselben Unterbereich eines anderen Fahrzeugs kann ins Leere führen.** Wer als Besitzer unter „Kosten" steht und auf ein nur geteiltes Fahrzeug wechselt, hat dort keinen Zugriff. Vorgesehen: Vor dem Wechsel wird geprüft, ob der Bereich am Zielfahrzeug zusteht; andernfalls führt der Weg auf dessen Übersicht. Wichtig ist, dass diese Prüfung **vor** dem Wechsel greift — sonst sieht der Nutzer kurz eine Fehlerseite.

**Die Breite des Inhaltsbereichs.** Die Spec verlangt, dass der Inhalt nicht schmaler wird als heute. Die Navigation braucht Platz, den es vorher nicht gab. Auf breiten Bildschirmen ist das unkritisch; zwischen 1024 und 1280 px wird es eng. Vorgesehen: In diesem Bereich startet die Navigation reduziert. Das ist die einzige Stelle, an der die Spec-Vorgaben sich gegenseitig drücken — beim Bauen an echten Breiten zu prüfen.

**Verlässlichkeit der Umstellung.** Vier Kosten-Seiten verlieren ihre bisherige Unternavigation. Wird eine übersehen, stehen dort zwei Navigationsebenen — genau der Zustand, den das Feature beseitigen soll. Das gehört ausdrücklich in die Prüfliste für `/qa`.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
