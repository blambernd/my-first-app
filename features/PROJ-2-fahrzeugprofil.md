# PROJ-2: Fahrzeugprofil

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-1 (User Authentication) — Nutzer muss eingeloggt sein

## User Stories
- Als Nutzer möchte ich ein neues Fahrzeug anlegen, damit ich es in der App verwalten kann
- Als Nutzer möchte ich Stammdaten meines Fahrzeugs erfassen (Marke, Modell, Baujahr, FIN, Kennzeichen, Farbe, Motortyp), damit alle wichtigen Infos zentral gespeichert sind
- Als Nutzer möchte ich Fotos meines Fahrzeugs hochladen, damit ich den Zustand visuell dokumentieren kann
- Als Nutzer möchte ich eine Übersicht aller meiner Fahrzeuge sehen (Dashboard), damit ich schnell navigieren kann
- Als Nutzer möchte ich Fahrzeugdaten bearbeiten können, falls sich etwas ändert (z.B. neues Kennzeichen)

## Acceptance Criteria
- [ ] Fahrzeug kann mit Pflichtfeldern angelegt werden (Marke, Modell, Baujahr)
- [ ] Optionale Felder: FIN, Kennzeichen, Farbe, Motortyp, Hubraum, Leistung, Laufleistung
- [ ] Mindestens 1 Foto kann hochgeladen werden (max. 10 pro Fahrzeug)
- [ ] Fotos werden in Supabase Storage gespeichert
- [ ] Dashboard zeigt alle Fahrzeuge des Nutzers als Karten mit Vorschaubild
- [ ] Fahrzeugdaten können bearbeitet werden
- [ ] Fahrzeug kann gelöscht werden (mit Bestätigungsdialog)
- [ ] Validierung: Baujahr muss zwischen 1886 und aktuellem Jahr liegen
- [ ] FIN-Validierung: 17 Zeichen alphanumerisch (falls angegeben)

## Edge Cases
- Was passiert wenn der Nutzer ein Fahrzeug ohne Foto anlegt? → Platzhalter-Bild wird angezeigt
- Was passiert bei Duplikat-FIN? → Warnung anzeigen, aber erlauben (gleiche FIN kann bei Besitzerwechsel vorkommen)
- Was passiert wenn ein zu großes Foto hochgeladen wird? → Max. 5 MB, Fehlermeldung bei Überschreitung
- Was passiert wenn das Fahrzeug gelöscht wird, das Scheckheft-Einträge hat? → Bestätigungsdialog mit Hinweis, dass alle verknüpften Daten gelöscht werden
- Was passiert bei Fahrzeugen ohne Baujahr (Einzelanfertigung)? → Baujahr ist Pflichtfeld, bei Unklarheit "geschätzt" markierbar

## Technical Requirements (optional)
- Bilder: Max. 5 MB, Formate JPG/PNG/WebP
- Storage: Supabase Storage Bucket "vehicle-images"
- Thumbnails: Automatische Verkleinerung für Dashboard-Ansicht

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
