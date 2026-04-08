# PROJ-10: Fahrzeug-Kurzprofil (öffentlich)

## Status: Architected
**Created:** 2026-04-08
**Last Updated:** 2026-04-08

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeugstammdaten
- Requires: PROJ-3 (Digitales Scheckheft) — Wartungshistorie
- Requires: PROJ-4 (Dokumenten-Archiv) — Dokumente & Bilder
- Requires: PROJ-5 (Fahrzeug-Timeline) — Meilensteine & Restaurierungen

## User Stories
- Als Oldtimer-Besitzer möchte ich ein öffentliches Kurzprofil meines Fahrzeugs erstellen, damit ich es potenziellen Käufern per Link zeigen kann
- Als Oldtimer-Besitzer möchte ich selbst auswählen, welche Abschnitte und Einträge im Profil sichtbar sind, damit ich kontrolliere, was öffentlich ist
- Als Oldtimer-Besitzer möchte ich das Kurzprofil als PDF herunterladen können, damit ich es offline weitergeben kann
- Als potenzieller Käufer möchte ich über einen Link die Fahrzeughistorie einsehen können, damit ich Vertrauen in den Zustand des Fahrzeugs gewinne
- Als Oldtimer-Besitzer möchte ich den öffentlichen Link jederzeit deaktivieren können, damit das Profil nicht mehr zugänglich ist

## Acceptance Criteria
- [ ] Nutzer kann ein öffentliches Kurzprofil für ein Fahrzeug erstellen
- [ ] Nutzer kann folgende Abschnitte einzeln ein-/ausblenden: Stammdaten, Fotos, Scheckheft-Einträge, Meilensteine/Restaurierungen, Dokumente (TÜV, Gutachten etc.)
- [ ] Innerhalb jedes Abschnitts kann der Nutzer einzelne Einträge ein-/ausblenden
- [ ] Ein einzigartiger, nicht erratbarer Link wird generiert (z.B. /profil/abc123xyz)
- [ ] Die öffentliche Profilseite zeigt die ausgewählten Daten ohne Login an
- [ ] Das Profil kann als PDF heruntergeladen werden
- [ ] Der Nutzer kann den Link jederzeit aktivieren/deaktivieren
- [ ] Deaktivierte Profile zeigen eine "Nicht mehr verfügbar"-Meldung
- [ ] Die öffentliche Seite ist responsiv (mobile-optimiert)
- [ ] Keine sensiblen Daten (Nutzer-E-Mail, interne IDs) auf der öffentlichen Seite

## Edge Cases
- Was passiert, wenn ein Profil-Link aufgerufen wird, nachdem das Fahrzeug gelöscht wurde? → "Nicht mehr verfügbar"-Seite
- Was passiert, wenn der Nutzer das Fahrzeug transferiert (PROJ-7)? → Profil wird automatisch deaktiviert
- Was passiert, wenn Fotos/Dokumente gelöscht werden, die im Profil enthalten sind? → Werden automatisch aus dem Profil entfernt
- Was passiert bei sehr vielen Scheckheft-Einträgen (50+)? → Paginierung oder "Alle anzeigen"-Button
- Kann der Nutzer mehrere Profile für dasselbe Fahrzeug erstellen? → Nein, ein Profil pro Fahrzeug, aber Inhalt kann jederzeit angepasst werden

## Technical Requirements
- Security: Profil-Links müssen kryptografisch zufällig sein (UUID v4 oder ähnlich)
- Performance: Öffentliche Seite muss ohne Auth laden (kein Supabase-Auth-Check)
- SEO: Öffentliche Seiten sollten NICHT indexiert werden (noindex, nofollow)
- PDF: Serverseitige PDF-Generierung mit dem gleichen Layout wie die Webseite

---

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Fahrzeug-Detailseite (/vehicles/[id])
+-- Neuer Tab/Button: "Kurzprofil"
    |
    +-- Profil-Konfigurator (/vehicles/[id]/kurzprofil)
    |   +-- Profil-Status (aktiv/inaktiv + Link kopieren)
    |   +-- Abschnitt-Toggles
    |   |   +-- "Stammdaten" (ein/aus)
    |   |   +-- "Fotos" (ein/aus)
    |   |   |   +-- Einzelne Fotos auswählbar
    |   |   +-- "Scheckheft" (ein/aus)
    |   |   |   +-- Einzelne Einträge auswählbar
    |   |   +-- "Meilensteine & Restaurierungen" (ein/aus)
    |   |   |   +-- Einzelne Einträge auswählbar
    |   |   +-- "Dokumente" (ein/aus)
    |   |       +-- Einzelne Dokumente auswählbar
    |   +-- Vorschau-Button
    |   +-- Speichern-Button
    |
    +-- Öffentliche Profilseite (/profil/[token])  ← KEIN Login nötig
        +-- Fahrzeug-Header (Marke, Modell, Baujahr, Foto)
        +-- Stammdaten-Karte
        +-- Foto-Galerie
        +-- Scheckheft-Tabelle
        +-- Meilenstein-Timeline
        +-- Dokument-Liste (nur Metadaten, kein Download)
        +-- PDF-Download-Button
        +-- "Nicht verfügbar"-Seite (wenn deaktiviert)
```

### Datenmodell

```
Neuer Datensatz: Fahrzeug-Kurzprofil (vehicle_profiles)
- Eindeutige ID
- Fahrzeug-Referenz (1:1 Beziehung, vehicle_id)
- Öffentlicher Token (zufällig generiert, z.B. "a7f3x9k2m1")
- Status: aktiv oder inaktiv
- Sichtbare Konfiguration (JSON):
  - sections: welche Abschnitte ein/aus (Stammdaten, Fotos, Scheckheft, Meilensteine, Dokumente)
  - selected_images: Liste der sichtbaren Foto-IDs
  - selected_service_entries: Liste der sichtbaren Scheckheft-IDs
  - selected_milestones: Liste der sichtbaren Meilenstein-IDs
  - selected_documents: Liste der sichtbaren Dokument-IDs
- Erstellt am / Aktualisiert am
```

### Seitenstruktur

| Seite | Auth? | Zweck |
|-------|-------|-------|
| `/vehicles/[id]/kurzprofil` | Ja (Besitzer) | Profil konfigurieren |
| `/profil/[token]` | Nein (öffentlich) | Profil anzeigen |
| `/api/vehicles/[id]/profile` | Ja | Profil erstellen/aktualisieren |
| `/api/profil/[token]` | Nein | Profildaten laden (öffentlich) |
| `/api/profil/[token]/pdf` | Nein | PDF generieren & downloaden |

### Technische Entscheidungen

| Entscheidung | Begründung |
|-------------|-----------|
| Zufälliger Token (nanoid, 12 Zeichen) | Kürzere, benutzerfreundliche URLs statt langer UUIDs |
| Konfiguration als JSON in DB | Flexibel erweiterbar, kein Schema-Update bei neuen Abschnitten |
| Öffentliche Seite als eigene Route `/profil/[token]` | Kein Auth-Check nötig, schneller Seitenaufbau |
| PDF serverseitig generieren | Nutzt bestehende PDF-Logik (ähnlich timeline-pdf) |
| RLS-Policy: Öffentlicher Lesezugriff über Token | Kein Auth für Käufer, Zugriff nur mit gültigem Token |
| noindex/nofollow Meta-Tags | Datenschutz, keine Google-Indexierung |

### Abhängigkeiten (neue Pakete)

| Paket | Zweck |
|-------|-------|
| nanoid | Kurze, sichere Tokens generieren |

### Ablauf

```
1. Nutzer öffnet "Kurzprofil" Tab bei seinem Fahrzeug
2. Falls noch kein Profil existiert → "Kurzprofil erstellen"-Button
3. Nutzer wählt Abschnitte und einzelne Einträge aus
4. Nutzer klickt "Speichern" → Profil wird in DB gespeichert
5. Nutzer kann Link kopieren → /profil/a7f3x9k2
6. Käufer öffnet Link → sieht die ausgewählten Daten
7. Käufer kann PDF herunterladen
8. Nutzer kann Profil jederzeit deaktivieren → Link zeigt "Nicht verfügbar"
```

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
