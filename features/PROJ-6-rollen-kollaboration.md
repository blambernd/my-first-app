# PROJ-6: Rollen & Kollaboration

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-1 (User Authentication) — Eingeladene Nutzer brauchen ein Konto
- Requires: PROJ-2 (Fahrzeugprofil) — Kollaboration bezieht sich auf Fahrzeuge

## User Stories
- Als Fahrzeug-Besitzer möchte ich andere Nutzer per E-Mail zu meinem Fahrzeug einladen können, damit sie mitarbeiten können
- Als Besitzer möchte ich Rollen vergeben können (Werkstatt, Betrachter), damit ich kontrolliere, wer was darf
- Als Werkstatt-Nutzer möchte ich Scheckheft-Einträge für ein geteiltes Fahrzeug erstellen können, damit ich Wartungen direkt dokumentieren kann
- Als Betrachter möchte ich die Fahrzeughistorie einsehen können, ohne etwas ändern zu können
- Als Besitzer möchte ich Einladungen widerrufen und Rollen ändern können

## Acceptance Criteria
- [ ] Besitzer kann andere Nutzer per E-Mail einladen
- [ ] Drei Rollen: Besitzer (Vollzugriff), Werkstatt (Scheckheft-Einträge + Dokumente hinzufügen), Betrachter (nur lesen)
- [ ] Einladung per E-Mail mit Link zur Registrierung/Login
- [ ] Eingeladener Nutzer sieht das Fahrzeug in seinem Dashboard
- [ ] Werkstatt-Rolle kann: Scheckheft-Einträge erstellen, Dokumente hochladen
- [ ] Werkstatt-Rolle kann NICHT: Fahrzeug bearbeiten/löschen, andere einladen, Einträge anderer bearbeiten
- [ ] Betrachter-Rolle kann: Alles ansehen, nichts bearbeiten
- [ ] Besitzer kann Rollen ändern und Zugriff entziehen
- [ ] Fahrzeug zeigt Liste aller Mitglieder mit ihren Rollen

## Edge Cases
- Was passiert wenn der eingeladene Nutzer noch kein Konto hat? → E-Mail mit Registrierungs-Link, Einladung wird nach Registrierung aktiv
- Was passiert wenn der Besitzer seinen eigenen Zugriff entziehen will? → Nicht möglich, Besitzer-Rolle kann nicht entfernt werden
- Was passiert wenn eine Einladung abläuft? → Einladungen sind 7 Tage gültig, danach muss neu eingeladen werden
- Was passiert wenn ein Werkstatt-Nutzer versucht, fremde Einträge zu bearbeiten? → Kein Edit-Button sichtbar, API gibt 403 zurück
- Was passiert wenn der Besitzer sein Konto löscht? → Fahrzeug und alle Verknüpfungen werden gelöscht (Hinweis auf Transfer vorher)

## Technical Requirements (optional)
- Row Level Security (RLS) Policies in Supabase für rollenbasierten Zugriff
- E-Mail-Versand: Supabase Edge Functions oder integrierter E-Mail-Service
- Einladungs-Token: Einmalig verwendbar, 7 Tage gültig

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
