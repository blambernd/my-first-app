# PROJ-4: Dokumenten-Archiv

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeug muss existieren

## User Stories
- Als Nutzer möchte ich Dokumente zu einem Fahrzeug hochladen (PDF, Fotos), damit ich alle Unterlagen digital archiviert habe
- Als Nutzer möchte ich Dokumente kategorisieren (Rechnung, Gutachten, TÜV-Bericht, Kaufvertrag, Versicherung, Sonstiges), damit ich sie schnell wiederfinde
- Als Nutzer möchte ich alle Dokumente eines Fahrzeugs in einer Übersicht sehen, damit ich den Überblick behalte
- Als Nutzer möchte ich Dokumente herunterladen können, damit ich sie offline nutzen oder weiterleiten kann
- Als Nutzer möchte ich ein Dokument mit einem Scheckheft-Eintrag verknüpfen können, damit Rechnung und Wartung zusammengehören

## Acceptance Criteria
- [ ] Dokumente können hochgeladen werden (PDF, JPG, PNG, WebP)
- [ ] Maximale Dateigröße: 10 MB pro Datei
- [ ] Kategorien: Rechnung, Gutachten, TÜV-Bericht, Kaufvertrag, Versicherung, Zulassung, Sonstiges
- [ ] Jedes Dokument hat: Titel, Kategorie, Datum, optionale Beschreibung
- [ ] Dokumente werden nach Kategorie gruppiert und chronologisch sortiert angezeigt
- [ ] Dokumente können heruntergeladen werden
- [ ] Dokumente können gelöscht werden (mit Bestätigung)
- [ ] Optional: Dokument kann mit einem Scheckheft-Eintrag (PROJ-3) verknüpft werden
- [ ] Vorschau für Bilder, PDF-Icon für PDF-Dateien

## Edge Cases
- Was passiert bei nicht unterstütztem Dateiformat? → Fehlermeldung mit Liste der erlaubten Formate
- Was passiert bei Upload-Abbruch? → Unvollständige Uploads werden nicht gespeichert
- Was passiert wenn ein verknüpfter Scheckheft-Eintrag gelöscht wird? → Dokument bleibt bestehen, Verknüpfung wird entfernt
- Was passiert wenn das Speicherlimit erreicht ist? → Hinweis auf Premium-Upgrade (PROJ-8)
- Was passiert wenn der Nutzer ein Dokument mit gleichem Namen hochlädt? → Erlaubt, wird als separates Dokument gespeichert

## Technical Requirements (optional)
- Storage: Supabase Storage Bucket "vehicle-documents"
- Max. Dateigröße: 10 MB
- Erlaubte Formate: PDF, JPG, PNG, WebP
- Free-Tier-Limit: z.B. 100 MB Gesamtspeicher (wird in PROJ-8 definiert)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
