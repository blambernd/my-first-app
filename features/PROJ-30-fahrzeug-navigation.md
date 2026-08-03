# PROJ-30: Fahrzeug-Navigation & UX-Überarbeitung

## Status: Deployed
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
- [ ] Ab 1280 px Fensterbreite wird der Inhaltsbereich durch die Navigation
      nicht schmaler als heute (heute auf 1024 px gedeckelt); darüber wächst
      die verfügbare Breite mit, statt gedeckelt zu bleiben.
      _Präzisiert am 2026-08-02 nach der QA: Zwischen 1024 und 1279 px ist die
      Vorgabe arithmetisch nicht erfüllbar — 960 px Inhalt plus 256 px
      Navigation verlangen mindestens 1216 px Fensterbreite. In diesem Bereich
      kann die Navigation eingeklappt werden, der Zustand bleibt erhalten._

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

## Implementierung (Frontend)

**Umgesetzt am:** 2026-08-02

### Gebaute und geänderte Dateien

| Datei | Zweck |
|---|---|
| `src/lib/vehicle-areas.ts` | neu — die Bereichsliste an genau einer Stelle |
| `src/components/vehicle-sidebar.tsx` | neu — Seitennavigation, beide Darstellungen |
| `src/components/vehicle-switcher.tsx` | neu — Fahrzeugwechsel im Kopf |
| `src/components/vehicle-header-actions.tsx` | neu — Kopfzeile mit Überlaufmenü |
| `src/app/vehicles/[id]/layout.tsx` | Sidebar eingesetzt, Fahrzeugliste geladen, Cookie gelesen |
| `src/components/delete-vehicle-button.tsx` | um einen gesteuerten Modus ohne eigene Schaltfläche erweitert |
| `src/hooks/use-mobile.tsx` | Umbruchpunkt von 768 auf 1024 px |
| `src/lib/vehicle-areas.test.ts` | neu — 16 Tests, u. a. der Fahrzeugwechsel |
| `src/components/cost-area-nav.tsx` | **gelöscht** |
| `src/components/vehicle-profile-nav.tsx` | **gelöscht** |
| 4 Kosten-Seiten | Einbindung der Unternavigation entfernt |

### Im Browser gemessen, nicht angenommen

Angemeldet über den E2E-Testnutzer, gegen einen Produktionsbuild:

| Seite | Sidebar | Einträge | alte Reiterleiste |
|---|---|---|---:|
| Übersicht | ja | 6 Bereiche | **0** |
| Kosten | ja | 6 + 4 Unterbereiche aufgeklappt | **0** |
| Kosten/Auswertung | ja | 6 + 4 Unterbereiche aufgeklappt | **0** |
| Scheckheft | ja | 6, Kosten zugeklappt | **0** |

Der Bereich „Kosten" klappt auf Unterseiten von selbst auf und bleibt anderswo zu — wie gefordert.

**Symbol-Modus (der im Entwurf als heikel benannte Fall):** Ein Klick auf das Kosten-Symbol öffnet alle vier Unterbereiche als Menü daneben, der Sprung auf „Einzelkosten" funktioniert. Der Zustand steht danach als `sidebar_state=false` im Cookie und überlebt den Seitenwechsel.

**Umbruchpunkt:** 1023 px → überlagerndes Panel, 1024 px → feste Navigation. Kein Querscrollen bei 375, 768, 1024, 1280 und 1440 px. Konsole auf allen geprüften Seiten sauber, keine Hydration-Meldungen.

### Ein Fehler, den erst der Browser gezeigt hat

Mein erster Entwurf verschachtelte ein `<main>` innerhalb des `<main>`, das `SidebarInset` selbst rendert. Ungültiges HTML, und Screenreader hätten zwei Hauptinhalte gemeldet — bei einer Spec, die Barrierefreiheit ausdrücklich verlangt. Das innere Element ist jetzt ein `div`. Aufgefallen ist es nur, weil eine Prüfung zwei Treffer statt einem fand; im Build und in der Typprüfung war es unsichtbar.

### Abweichung: Inhaltsbreite bei 1024–1279 px

Die Spec verlangt, dass der Inhalt nicht schmaler wird als bisher. Gemessen:

| Breite | Inhalt neu | Inhalt vorher | |
|---|---:|---:|---|
| 1024 px | 704 px | 960 px | **schmaler** |
| 1280 px | 960 px | 960 px | gleich |
| 1440 px | 1120 px | 960 px | breiter |
| 1920 px | 1600 px | 960 px | deutlich breiter |

Ab 1280 px ist die Vorgabe erfüllt und darüber deutlich übertroffen — vorher war der Inhalt auf 1024 px gedeckelt, jetzt wächst er mit. **Unterhalb von 1280 px ist sie nicht erfüllt**, und das ist Arithmetik, kein Fehler: 960 px Inhalt plus 256 px Navigation verlangen mindestens 1216 px Fensterbreite.

Der Entwurf sah als Ausweg vor, die Navigation in diesem Bereich reduziert zu starten. Das ist **bewusst nicht umgesetzt**: Der Startzustand kommt aus dem Cookie, den der Server liest — er kennt die Fensterbreite nicht. Eine breitenabhängige Vorgabe ließe sich nur clientseitig treffen und erzeugte genau das Zusammenklappen nach dem Laden, das der Cookie-Weg vermeidet.

Wer bei 1024 px mehr Platz braucht, klappt die Navigation einmal ein; der Zustand bleibt erhalten. Ob das genügt oder die Vorgabe angepasst werden sollte, gehört in die QA-Bewertung.

### Umgesetzte Entscheidungen

- **Die Bereichsliste steht an einer Stelle.** Vorher war dieselbe Information dreifach gepflegt. PROJ-31 fügt später nur einen Eintrag hinzu.
- **Ausgesetzte Bereiche verschwinden von selbst**, weil die Liste den Schalter aus `feature-flags.ts` mitliest. Der Verkaufsassistent ist dadurch derzeit nicht in der Navigation — die Premium-Kennzeichnung ist trotzdem gebaut und greift, sobald er zurückkehrt.
- **Der Fahrzeugwechsel prüft vor dem Sprung**, ob der Unterbereich am Zielfahrzeug zusteht. Wer von „Kosten" auf ein geteiltes Fahrzeug wechselt, landet auf dessen Übersicht statt auf einer Fehlerseite.
- **Der Löschdialog liegt außerhalb des Überlaufmenüs.** Läge er darin, nähme das schließende Menü ihn mit.
- **Leere Gruppen werden weggelassen.** Ein nur als Werkstatt eingeladener Nutzer sieht keine leere Überschrift „Meine Fahrzeuge".

### Eine Regression, die ich selbst eingebaut und wieder behoben habe

Im ersten Wurf war „Kosten" nur ein Aufklapp-Schalter, kein Link. Vorher führte ein Klick darauf in den Kostenbereich — das wäre eine Verschlechterung gewesen, und mit PROJ-31 bekommt der Bereich eine eigene Einstiegsseite.

Aufgefallen ist es **nicht** beim Ausprobieren, sondern durch einen bestehenden E2E-Test aus PROJ-25: „Kosten sind über die Fahrzeug-Navigation erreichbar" suchte einen Link und fand keinen.

Jetzt trägt die Zeile beides: Der Name ist ein Link in den Bereich, der Pfeil daneben klappt nur auf. Im Browser geprüft — der Pfeil navigiert nicht, der Name schon.

### E2E-Lage

`npm run test:e2e` meldet 24 Fehler. Aufgeschlüsselt:

| Gruppe | Anzahl | Ursache |
|---|---:|---|
| PROJ-1, PROJ-15, PROJ-17 (öffentliche Seiten) | 21 | **vorbestehend**, siehe unten |
| PROJ-25 Navigation | 1 | **meine Regression** — behoben |
| PROJ-27, PROJ-28 | 2 | **Parallelitäts-Störung** — siehe unten |

**Vorbestehend:** Diese Tests prüfen Inhalte der Startseite, die es so nicht mehr gibt. „App-Vorschau" wurde in Commit `1f35ac2` durch einen Screenshot ersetzt, der Test nie nachgezogen. „Kostenlos starten" und „Digitales Scheckheft" kommen seit dem Ausbau der Preissektion mehrfach vor, was die Tests als Mehrdeutigkeit abweisen. PROJ-17 steht folgerichtig noch auf **In Review** — die Feature-QA wurde nie abgeschlossen. Nichts davon berührt PROJ-30.

**Parallelität:** Die vier datenverändernden Specs (PROJ-24, 25, 27, 28) arbeiten alle auf **demselben** Wegwerf-Fahrzeug und räumen es jeweils auf. Laufen sie gleichzeitig, löschen sie einander die Daten weg. Nacheinander ausgeführt sind es **62 von 62 grün**:

```
npx playwright test tests/PROJ-2{4,5,7,8}-*-auth.spec.ts --project=chromium-auth --workers=1
→ 62 passed
```

Das ist eine vorbestehende Schwäche der Testeinrichtung, keine Eigenschaft von PROJ-30 — sie fällt nur auf, wenn alle vier zusammen laufen. Empfehlung für `/qa`: entweder `--workers=1` für diese Gruppe festschreiben oder je Spec ein eigenes Wegwerf-Fahrzeug anlegen.

### Nicht geprüft

- **Der Fahrzeugwechsel im Browser.** Der Testnutzer besitzt genau ein Fahrzeug; geprüft ist damit nur die Einzelfahrzeug-Darstellung ohne Auswahlmöglichkeit. Die **Wegberechnung** ist dafür als reine Funktion ausgelagert und mit 16 Tests abgedeckt — einschließlich des Falls „von Kosten auf ein geteiltes Fahrzeug", der auf die Übersicht führen muss statt auf eine Fehlerseite. Die Darstellung der Auswahlliste und die Gruppentrennung gehören dennoch in `/qa` mit einem Nutzer, der mindestens zwei Fahrzeuge hat.
- **Die Premium-Kennzeichnung** ist mangels sichtbaren kostenpflichtigen Bereichs derzeit nicht auslösbar.
- **Tastaturbedienung und Screenreader** über die Voreinstellungen der Sidebar-Komponente hinaus.

## QA Test Results

**Geprüft am:** 2026-08-02 · **Ergebnis: produktionsreif, beide Fehler behoben**

### Akzeptanzkriterien: 28 von 28 prüfbaren erfüllt

| Gruppe | erfüllt | offen |
|---|---:|---:|
| Seitliche Navigation | 10 / 10 | – |
| Kopfbereich | 5 / 5 | – |
| Fahrzeugwechsel | 6 / 6 | – |
| Berechtigungen | 2 / 2 | – |
| Premium-Kennzeichnung | – | 3 **nicht prüfbar** (s. u.) |
| Mobile | 4 / 4 | – |
| Aufräumen | 2 / 2 | – |

### Der Fahrzeugwechsel — die größte Lücke aus `/frontend` — ist geschlossen

Ich habe dem Testnutzer vorübergehend ein zweites eigenes Fahrzeug angelegt und ein fremdes als **Werkstatt** freigegeben. Damit ließ sich prüfen, was mit einem Fahrzeug unmöglich war:

- Ab zwei Fahrzeugen wird der Name klickbar — **erfüllt**
- Gruppen „Meine Fahrzeuge" / „Geteilte Fahrzeuge" sauber getrennt — **erfüllt**
- Aktuelles Fahrzeug mit Häkchen markiert — **erfüllt**
- „Fahrzeug anlegen" steht am Ende — **erfüllt**
- Liste scrollbar (`overflow-y: auto`, `max-height: 320px`) — **erfüllt**
- Wechsel von `/tankbuch` führt auf `/tankbuch` des Zielfahrzeugs — **erfüllt**
- **Wechsel von `/kosten/auswertung` auf ein geteiltes Fahrzeug führt auf dessen Übersicht**, nicht auf eine Fehlerseite — **erfüllt**

Als Werkstatt sind „Kosten" und „Verkaufsassistent" nicht im Menü, und im Kopf steht ausschließlich „Fahrzeug verlassen".

**Die Testdaten sind nach der Prüfung vollständig entfernt** (zurück auf 1 eigenes, 0 geteilte Fahrzeuge); das fremde Fahrzeug blieb unberührt.

### Sicherheitsprüfung

Keine Befunde.

- **Ausblenden ersetzt keine Prüfung:** Direktaufruf von `/vehicles/<fremd>/kosten` als Werkstatt liefert **HTTP 404**. Der Menüeintrag fehlt *und* der Server weist ab.
- Der Fahrzeugwechsel greift auf keine Daten zu, die der Nutzer nicht ohnehin sehen darf — die Liste stammt aus `vehicles` (eigene) und `vehicle_members` (geteilte), beide durch bestehende Zugriffsregeln gedeckt.
- Keine neuen Eingabefelder, keine neuen Endpunkte, keine neuen Datenfelder — die Angriffsfläche wächst nicht.

### Weitere Prüfungen

| Prüfung | Ergebnis |
|---|---|
| Tastaturbedienung | Navigation nach 3 × Tab erreichbar, `Enter` navigiert |
| Screenreader | aktiver Eintrag über `data-active` ausgezeichnet |
| Tooltip im Symbol-Modus | erscheint |
| Erste Sitzung ohne Cookie | startet ausgeklappt |
| Langer Fahrzeugname | bricht die Navigation nicht auf |
| Bedienflächen mobil | 44–48 px, Vorgabe erfüllt |
| Untere Leiste (mobil) | unverändert vorhanden, nicht überlagert |
| Firefox | 12 Einträge, keine Fehler |
| WebKit (Safari-Engine) | 12 Einträge, keine Fehler |
| Alle bisherigen Fahrzeugpfade | 12 von 12 mit HTTP 200 |
| Konsole | auf allen geprüften Seiten sauber |

### Gefundene Fehler

| # | Schwere | Befund |
|---|---|---|
| BUG-1 | **Mittel** | **Das überlagernde Panel schließt sich auf dem Smartphone nicht.** Nach Auswahl eines Bereichs navigiert die Seite korrekt, aber das Panel bleibt offen — der Inhalt wechselt unsichtbar dahinter. Betrifft **jede** Navigation auf Mobilgeräten. Ursache: Die Sidebar-Komponente schließt ihr mobiles Panel nicht von selbst, wenn ein Link darin angeklickt wird. Umgehung: daneben tippen. Verstößt gegen „Die Auswahl eines Bereichs schließt das Panel und navigiert dorthin". |
| BUG-2 | Gering | **Inhaltsbreite bei 1024–1279 px.** 704 px statt bisher 960 px. Ab 1280 px erfüllt, darüber deutlich übertroffen (1440 px → 1120 px). In `/frontend` gemessen und begründet; die Vorgabe ist bei dieser Fensterbreite arithmetisch nicht erfüllbar. **Empfehlung: das Kriterium auf „ab 1280 px" präzisieren**, statt Aufwand in eine fragile Ausnahme zu stecken. |

### Nicht prüfbar: Premium-Kennzeichnung

Alle drei Kriterien dieser Gruppe hängen am Verkaufsassistenten — dem einzigen kostenpflichtigen Bereich. Er ist seit dem 2026-08-02 ausgesetzt, also steht kein Eintrag zur Verfügung, an dem die Kennzeichnung erscheinen könnte. Der Code dafür ist vorhanden und wird über dieselbe Bereichsliste angesteuert; **geprüft ist er nicht**. Das gehört nachgeholt, sobald der Assistent zurückkehrt.

### Automatisierte Tests

- **Neu:** `tests/PROJ-30-fahrzeug-navigation-auth.spec.ts` — **14 von 14 grün**. Darunter ausdrücklich: „Kosten" ist ein Link, der Pfeil klappt ohne zu navigieren, keine zweite Reiterleiste auf allen vier Kosten-Seiten, alle bisherigen Pfade liefern 200.
- `src/lib/vehicle-areas.test.ts` — 16 Tests zur Bereichsliste und zur Wegberechnung des Wechsels.
- Gesamt: **552 Unit-Tests grün**, Lint ohne Fehler, Build erfolgreich.

### Zwei Schwächen der Testeinrichtung (vorbestehend, nicht PROJ-30)

**`auth.setup.ts` scheitert, sobald der Testnutzer ein geteiltes Fahrzeug hat.** Die Anmeldeprüfung suchte eine Überschrift nach `/Fahrzeuge/i` — mit geteilten Fahrzeugen trifft das „Meine Fahrzeuge" **und** „Geteilte Fahrzeuge", und die Mehrdeutigkeit lässt die Anmeldung scheitern. Dadurch fielen **alle** angemeldeten Tests aus. Auf „Meine Fahrzeuge" präzisiert.

**Die datenverändernden Specs stören einander.** PROJ-24, 25, 27 und 28 arbeiten alle auf demselben Wegwerf-Fahrzeug und räumen es auf; parallel ausgeführt löschen sie einander die Daten. Seriell sind es 62 von 62 grün. Empfehlung: eigenes Wegwerf-Fahrzeug je Spec oder `--workers=1` für diese Gruppe festschreiben.

**Vorbestehend und unabhängig:** 21 E2E-Fehler auf den öffentlichen Seiten (PROJ-1, PROJ-15, PROJ-17). „App-Vorschau" wurde in Commit `1f35ac2` entfernt, ohne die Tests nachzuziehen; „Kostenlos starten" kommt seit dem Ausbau der Preissektion viermal vor. PROJ-17 steht folgerichtig noch auf **In Review**.

### Nachbesserung (2026-08-02, nach der QA)

**BUG-1 behoben.** Neuer Hook `useSchliesseNachAuswahl` in [vehicle-sidebar.tsx](src/components/vehicle-sidebar.tsx): Ein Klick auf einen Navigationslink schließt auf Mobilgeräten das Panel über `setOpenMobile(false)`. Angewandt auf Hauptbereiche, Unterbereiche, das Untermenü im Symbol-Modus sowie den Fahrzeugwechsel und „Fahrzeug anlegen".

Im Browser bei 375 px nachgewiesen — Hauptbereich und Unterbereich schließen jeweils, die Navigation greift. **Gegenprobe:** Auf dem Desktop bleibt die Navigation nach der Auswahl stehen; die Korrektur wirkt ausschließlich mobil.

Drei zusätzliche E2E-Tests halten das fest, darunter ausdrücklich die Gegenprobe für den Desktop.

**BUG-2: Kriterium präzisiert statt Code gebogen.** Die Vorgabe lautet jetzt „ab 1280 px" und ist damit erfüllt; die Begründung steht direkt beim Kriterium. Zwischen 1024 und 1279 px lässt sich die Navigation einklappen, der Zustand bleibt erhalten. Eine breitenabhängige Voreinstellung wäre nur clientseitig möglich gewesen und hätte genau das Flackern erzeugt, das der Cookie-Weg vermeidet.

### Prüfstand nach der Nachbesserung

| Prüfung | Ergebnis |
|---|---|
| `tests/PROJ-30-fahrzeug-navigation-auth.spec.ts` | **17 / 17 grün** |
| Alle angemeldeten E2E-Specs (seriell) | **78 / 78 grün** |
| Unit-Tests | **552 / 552 grün** |
| Lint | 0 Fehler |
| Build | erfolgreich |

### Empfehlung

**Auslieferbar.** Kein offener Fehler. Das Feature erfüllt seinen Zweck: Auf allen vier Kosten-Seiten ist die zweite Navigationsebene verschwunden, alle bisherigen Pfade funktionieren, und die Zugriffsprüfung bleibt serverseitig maßgeblich — ein Direktaufruf als Werkstatt liefert weiterhin 404.

Die einzige verbleibende Lücke ist die **Premium-Kennzeichnung**: nicht prüfbar, solange der Verkaufsassistent ausgesetzt ist. Der Code ist vorhanden, ungeprüft, und gehört nachgeholt, sobald der Assistent zurückkehrt.

## Deployment

**Ausgeliefert am:** 2026-08-02 · **Produktion:** https://oldtimer-docs.com

### Vorprüfungen

| Prüfung | Ergebnis |
|---|---|
| `npm run build` | erfolgreich |
| `npm run lint` | 0 Fehler (30 Hinweise, vorbestehend) |
| Unit-Tests | 552 / 552 grün |
| E2E PROJ-30 | 17 / 17 grün |
| Alle angemeldeten E2E-Tests (seriell) | 78 / 78 grün |
| QA-Freigabe | Approved, kein offener Fehler |
| Geheimnisse im Diff | keine |
| Neue Umgebungsvariablen | keine |
| Datenbank-Migrationen | keine — reine Oberflächenänderung |

### In der Produktion angemeldet geprüft

Nicht nur HTTP-Status, sondern mit echtem Testnutzer:

| Prüfung | Ergebnis |
|---|---|
| Navigation auf Übersicht / Kosten / Auswertung | 7 bzw. 11 Einträge, **alte Reiterleiste: 0** |
| „Kosten" ist ein Link | ja, auf `/kosten` |
| Kopfbereich | „Transfer" im Überlaufmenü statt sichtbar |
| `/verkaufsassistent`, `/marktpreis`, `/kurzprofil` | leiten aufs Fahrzeugprofil zurück |
| Mobil (375 px) | Panel öffnet und **schließt nach der Auswahl** |
| Dashboard-Konsole | sauber — der Hydration-Fehler #418 ist weg |

**Zur Wertentwicklung:** Die Seite liefert HTTP 200 und zeigt die Premium-Aufforderung, weil der Testnutzer im Free-Plan ist. Das ist das vorgesehene Verhalten, kein Fehler — meine erste Prüfregel hatte den Upsell schlicht nicht berücksichtigt.

### Nachgereicht: Darstellung der Navigation

Nach dem ersten Ausliefern zurückgemeldet: Die Leiste wirkte zu dominant. Sie war dunkles gesättigtes Marineblau (`220 60% 22%`) und 256 px breit — als schmales Element vertretbar, über die volle Höhe des Fahrzeugbereichs jedoch aufdringlich.

- **Farbe:** ruhige helle Fläche (`220 20% 97%`), die sich nur leicht vom Seitenhintergrund abhebt. Die Betonung trägt jetzt der aktive Eintrag.
- **Breite:** 16 rem → 14 rem. „Wertentwicklung" passt eingerückt weiterhin ohne Abschneiden; der Inhalt gewinnt 32 px und liegt bei 1440 px nun bei 1216 px.
- Der Fahrzeugname wird in der schmaleren Leiste früher abgeschnitten und ist über das `title`-Attribut vollständig lesbar — deckt den Edge Case „sehr lange Fahrzeugnamen" ab.

Die Farbtoken werden ausschließlich von dieser Navigation verwendet; andere Ansichten sind nicht betroffen. Der Dunkelmodus bleibt unberührt — die App hat keinen Umschalter dafür, seine Token sind derzeit unbenutzt.

### Offen

Die **Premium-Kennzeichnung** ist weiterhin ungeprüft, weil der Verkaufsassistent als einziger kostenpflichtiger Bereich ausgesetzt ist. Nachzuholen, sobald er zurückkehrt.
