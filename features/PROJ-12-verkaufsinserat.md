# PROJ-12: Verkaufsinserat erstellen

## Status: Architected
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeugstammdaten & Fotos
- Requires: PROJ-10 (Fahrzeug-Kurzprofil) — Link zum öffentlichen Profil wird ins Inserat eingebettet
- Requires: PROJ-11 (Marktpreis-Analyse) — Preisempfehlung als Vorschlag

## User Stories
- Als Oldtimer-Besitzer möchte ich automatisch einen Inserat-Text generieren lassen, damit ich nicht alles selbst schreiben muss
- Als Oldtimer-Besitzer möchte ich Fotos aus meinem Fahrzeugprofil für das Inserat auswählen können, damit ich keine Bilder erneut hochladen muss
- Als Oldtimer-Besitzer möchte ich den generierten Text vollständig bearbeiten können, damit das Inserat meinen Vorstellungen entspricht
- Als Oldtimer-Besitzer möchte ich den empfohlenen Preis aus der Marktanalyse als Vorschlag sehen, damit ich einen realistischen Preis setze
- Als Oldtimer-Besitzer möchte ich, dass der Link zum Kurzprofil automatisch im Inserat erscheint, damit Käufer die verifizierte Historie einsehen können

## Acceptance Criteria
- [ ] Nutzer kann ein neues Verkaufsinserat für ein Fahrzeug starten
- [ ] System generiert automatisch einen Inserat-Titel aus Marke, Modell, Baujahr und Werksbezeichnung
- [ ] System generiert automatisch eine Beschreibung basierend auf: Fahrzeugdaten, Zustand, Kilometerstand, Highlights aus der Historie
- [ ] Nutzer kann Fotos aus dem Fahrzeugprofil (Profilbilder + Historie-Bilder) auswählen und die Reihenfolge bestimmen
- [ ] Titel, Beschreibung und Preis sind im Editor frei editierbar
- [ ] Link zum öffentlichen Kurzprofil (PROJ-10) wird automatisch in die Beschreibung eingefügt
- [ ] Vorschau zeigt das Inserat so, wie es auf der Zielplattform aussehen würde
- [ ] Inserat kann als Entwurf gespeichert und später weiterbearbeitet werden
- [ ] Preisempfehlung aus PROJ-11 wird als Vorschlagswert angezeigt (falls vorhanden)
- [ ] Nutzer kann zwischen "Festpreis" und "Verhandlungsbasis" wählen

## Edge Cases
- Was passiert, wenn kein Kurzprofil (PROJ-10) existiert? → Hinweis "Erstelle ein Kurzprofil, um deine Fahrzeughistorie im Inserat zu verlinken" + trotzdem fortfahren möglich
- Was passiert, wenn keine Marktanalyse (PROJ-11) vorhanden ist? → Preisfeld bleibt leer, Nutzer gibt manuell ein
- Was passiert, wenn keine Fotos vorhanden sind? → Warnung "Inserate mit Fotos erzielen deutlich höhere Aufmerksamkeit" + trotzdem fortfahren möglich
- Was passiert, wenn der generierte Text zu lang für eine Plattform ist? → Zeichenzähler mit Limit-Warnung pro Plattform
- Was passiert mit mehreren Entwürfen für dasselbe Fahrzeug? → Nur ein aktiver Entwurf pro Fahrzeug, alter wird überschrieben (mit Bestätigung)

## Technical Requirements
- Text-Generierung: Serverseitig, basierend auf Templates + Fahrzeugdaten (kein LLM in V1 — deterministisches Template)
- Speicherung: Entwürfe werden in der Datenbank gespeichert (Titel, Beschreibung, Preis, ausgewählte Fotos, Status)
- Bilder: Keine Kopie der Bilder — Referenz auf vorhandene Fahrzeugbilder
- Zeichenlimits: mobile.de Titel max 70 Zeichen, Beschreibung max 5.000 Zeichen; eBay ähnlich

---

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Fahrzeug-Detailseite (/vehicles/[id])
+-- Neuer Tab: "Verkaufen" (Tag-Icon)
    |
    +-- Inserat-Editor (/vehicles/[id]/verkaufen)
        |
        +-- Status-Leiste (Entwurf / Veröffentlicht)
        |
        +-- Inserat-Formular
        |   +-- Titel-Editor
        |   |   +-- Auto-generierter Titel (Marke + Modell + Baujahr + Werksbezeichnung)
        |   |   +-- Frei editierbares Textfeld
        |   |   +-- Zeichenzähler (max 70 Zeichen, Warnung bei Überschreitung)
        |   |
        |   +-- Beschreibung-Editor
        |   |   +-- Auto-generierter Text (aus Template + Fahrzeugdaten)
        |   |   +-- Frei editierbares Textarea
        |   |   +-- Zeichenzähler (max 5.000 Zeichen)
        |   |   +-- Kurzprofil-Link (automatisch eingefügt, wenn PROJ-10 aktiv)
        |   |   +-- Hinweis falls kein Kurzprofil existiert
        |   |
        |   +-- Preis-Bereich
        |   |   +-- Preistyp: "Festpreis" / "Verhandlungsbasis" (Radio)
        |   |   +-- Preis-Eingabefeld (€)
        |   |   +-- Preisempfehlung aus Marktanalyse (falls vorhanden)
        |   |   +-- Hinweis "Marktanalyse durchführen" (falls keine vorhanden)
        |   |
        |   +-- Foto-Auswahl
        |       +-- Galerie aller Fahrzeugbilder (aus PROJ-2)
        |       +-- Galerie aller Historie-Bilder (aus PROJ-5)
        |       +-- Checkboxen zur Auswahl
        |       +-- Drag & Drop Reihenfolge
        |       +-- Hinweis wenn keine Fotos vorhanden
        |
        +-- Vorschau-Panel
        |   +-- Live-Vorschau des Inserats
        |   +-- Simuliert Plattform-Darstellung (mobile.de-Stil)
        |
        +-- Aktions-Leiste
            +-- "Entwurf speichern" Button
            +-- "Vorschau" Toggle-Button
            +-- "Weiter zu Veröffentlichung" Button (→ PROJ-13)
```

### Datenmodell

```
Neuer Datensatz: Verkaufsinserat (vehicle_listings)
- Eindeutige ID
- Fahrzeug-Referenz (vehicle_id, 1 aktiver Entwurf pro Fahrzeug)
- Nutzer-Referenz (user_id)
- Titel (max 70 Zeichen)
- Beschreibung (max 5.000 Zeichen, inkl. Kurzprofil-Link)
- Preis in Cent (ganzzahlig, wie bei Scheckheft)
- Preistyp: "festpreis" oder "verhandlungsbasis"
- Ausgewählte Foto-IDs (JSON-Array, Referenz auf vehicle_images + vehicle_milestone_images)
- Foto-Reihenfolge (JSON-Array mit IDs in gewünschter Sortierung)
- Status: "entwurf" oder "veroeffentlicht"
- Erstellt am / Aktualisiert am
```

### Seitenstruktur

| Seite | Auth? | Zweck |
|-------|-------|-------|
| `/vehicles/[id]/verkaufen` | Ja (Besitzer) | Inserat erstellen & bearbeiten |
| `/api/vehicles/[id]/listing` | Ja | GET: Entwurf laden, POST: erstellen, PATCH: aktualisieren |
| `/api/vehicles/[id]/listing/generate` | Ja | POST: Titel + Beschreibung aus Fahrzeugdaten generieren |

### Text-Generierung (Template-basiert, kein LLM)

Der Inserat-Text wird serverseitig aus einem deutschen Template generiert:

**Titel-Template:**
`{Marke} {Modell} {Werksbezeichnung} — Baujahr {Jahr}`

**Beschreibungs-Template:**
```
Abschnitt 1: Fahrzeugdaten (Marke, Modell, Baujahr, Farbe, Motor, Leistung, km-Stand)
Abschnitt 2: Highlights aus der Historie (Anzahl Scheckheft-Einträge, besondere Meilensteine)
Abschnitt 3: Kurzprofil-Link ("Komplette Fahrzeughistorie einsehen: [Link]")
```

Die generierten Texte dienen als Startpunkt — der Nutzer kann alles frei bearbeiten.

### Technische Entscheidungen

| Entscheidung | Begründung |
|-------------|-----------|
| Template-basierte Textgenerierung (kein LLM) | Deterministisch, schnell, kostenlos, kein API-Key nötig. Für V1 ausreichend |
| Preis in Cent speichern | Konsistent mit bestehendem Scheckheft (cost_cents), keine Rundungsfehler |
| Foto-IDs als JSON-Array | Gleicher Ansatz wie PROJ-10 Kurzprofil (bewährt), Reihenfolge als separate Sortierung |
| Ein Entwurf pro Fahrzeug | Einfacher UX-Flow, kein Verwaltungsaufwand für mehrere Entwürfe |
| Vorschau im Split-Screen | Nutzer sieht sofort, wie das Inserat aussieht, ohne Seite zu wechseln |
| Generate-Endpunkt separat | Text-Generierung ist aufwändig (DB-Abfragen), wird nur bei "Neu generieren" aufgerufen, nicht bei jedem Speichern |

### Abhängigkeiten (neue Pakete)

| Paket | Zweck |
|-------|-------|
| @dnd-kit/core + @dnd-kit/sortable | Drag & Drop für Foto-Reihenfolge (falls noch nicht installiert) |

*Hinweis: Prüfen ob @dnd-kit bereits im Projekt vorhanden ist. Falls nicht, ist es das Standard-DnD-Paket für React/Next.js.*

### Ablauf

```
1. Nutzer öffnet "Verkaufen" Tab bei seinem Fahrzeug
2. Falls noch kein Entwurf existiert → "Inserat erstellen" Button
3. System generiert automatisch Titel + Beschreibung aus Fahrzeugdaten
4. System zeigt Preisempfehlung aus letzter Marktanalyse (falls vorhanden)
5. Nutzer passt Titel, Beschreibung, Preis und Fotos nach Wunsch an
6. Nutzer kann jederzeit "Entwurf speichern" → Daten werden in DB gespeichert
7. Nutzer kann Live-Vorschau ein-/ausblenden
8. Wenn fertig → "Weiter zu Veröffentlichung" leitet zu PROJ-13 weiter
```

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
