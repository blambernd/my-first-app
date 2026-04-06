# PROJ-6: Rollen & Kollaboration

## Status: Architected
**Created:** 2026-04-04
**Last Updated:** 2026-04-06

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

### Überblick

Fahrzeug-Besitzer können andere Nutzer per E-Mail zu ihrem Fahrzeug einladen und ihnen eine Rolle zuweisen. Die Einladung läuft über Supabase Auth (kein externer E-Mail-Dienst). Drei klar abgegrenzte Rollen steuern, wer was darf.

### Rollen & Berechtigungen

| Aktion | Besitzer | Werkstatt | Betrachter |
|--------|----------|-----------|------------|
| Fahrzeug ansehen (Übersicht, Fotos, Daten) | ✅ | ✅ | ✅ |
| Scheckheft-Einträge ansehen | ✅ | ✅ | ✅ |
| Scheckheft-Einträge erstellen | ✅ | ✅ (nur eigene bearbeiten/löschen) | ❌ |
| Dokumente ansehen & herunterladen | ✅ | ✅ | ✅ |
| Dokumente hochladen | ✅ | ✅ | ❌ |
| Historie ansehen | ✅ | ✅ | ✅ |
| Historie-Meilensteine erstellen | ✅ | ✅ (nur eigene bearbeiten/löschen) | ❌ |
| Fahrzeug bearbeiten / löschen | ✅ | ❌ | ❌ |
| Mitglieder einladen / verwalten | ✅ | ❌ | ❌ |
| PDF-Export | ✅ | ✅ | ✅ |

### Seitenstruktur

```
/vehicles/[id] (bestehend — Layout erweitern)
+-- Navigation (bestehend)
|   +-- "Übersicht" (bestehend)
|   +-- "Scheckheft" (bestehend)
|   +-- "Historie" (bestehend)
|   +-- "Dokumente" (bestehend)
|   +-- "Mitglieder" (NEU — nur für Besitzer sichtbar)

/vehicles/[id]/mitglieder (NEU)
+-- Mitglieder-Liste
|   +-- Mitglied-Zeile (Avatar/E-Mail, Rolle, Beitrittsdatum)
|   +-- Rolle ändern (Dropdown: Werkstatt ↔ Betrachter)
|   +-- Zugriff entziehen (Button mit Bestätigung)
+-- Einladungsbereich
|   +-- E-Mail-Eingabefeld
|   +-- Rollen-Auswahl (Werkstatt / Betrachter)
|   +-- "Einladen" Button
+-- Offene Einladungen
|   +-- Einladung-Zeile (E-Mail, Rolle, Ablaufdatum)
|   +-- Einladung widerrufen (Button)

/invite/[token] (NEU — öffentliche Seite)
+-- Einladungs-Info (Fahrzeug-Name, einladender Besitzer, Rolle)
+-- "Einladung annehmen" Button → Login/Register → Zugriff aktiviert
```

### Datenmodell

```
Fahrzeug-Mitglied (vehicle_members — NEU):
- Eindeutige ID
- Verknüpfung zum Fahrzeug
- Verknüpfung zum Nutzer
- Rolle (besitzer, werkstatt, betrachter)
- Beitrittsdatum
- Einzigartig: Ein Nutzer kann nur einmal pro Fahrzeug Mitglied sein

Einladung (vehicle_invitations — NEU):
- Eindeutige ID
- Verknüpfung zum Fahrzeug
- E-Mail-Adresse des Eingeladenen
- Einladungs-Token (einmalig, zufällig)
- Rolle (werkstatt, betrachter)
- Eingeladen von (Besitzer-ID)
- Ablaufdatum (7 Tage nach Erstellung)
- Status (offen, angenommen, abgelaufen, widerrufen)
- Erstellt am

Gespeichert in: Supabase PostgreSQL
Zugriffskontrolle: RLS — Besitzer sieht/verwaltet alle Mitglieder, Mitglieder sehen die Liste
```

### Einladungs-Ablauf

1. **Besitzer** gibt E-Mail + Rolle ein und klickt "Einladen"
2. **System** erstellt einen Einladungs-Datensatz mit Token und 7-Tage-Ablauf
3. **Supabase** sendet eine E-Mail mit Link `/invite/[token]`
4. **Eingeladener** klickt den Link:
   - Hat bereits ein Konto → Login → Einladung wird aktiviert
   - Hat kein Konto → Registrierung → Einladung wird aktiviert
5. **System** erstellt einen `vehicle_members`-Eintrag und markiert die Einladung als "angenommen"
6. **Eingeladener** sieht das Fahrzeug in seinem Dashboard

### Bestehende Seiten — Was sich ändert

| Bereich | Änderung |
|---------|----------|
| **Dashboard** | Zeigt auch Fahrzeuge, bei denen der Nutzer Mitglied ist (nicht nur eigene) |
| **Fahrzeug-Layout** | Prüft Mitgliedschaft statt nur Besitz. Versteckt "Bearbeiten"/"Löschen" für Nicht-Besitzer |
| **Navigation** | "Mitglieder" Tab nur für Besitzer sichtbar |
| **Scheckheft** | Werkstatt kann erstellen, aber nur eigene Einträge bearbeiten/löschen |
| **Dokumente** | Werkstatt kann hochladen, aber nur eigene löschen |
| **Historie** | Werkstatt kann Meilensteine erstellen, aber nur eigene bearbeiten/löschen |
| **RLS Policies** | Alle bestehenden Tabellen brauchen erweiterte Policies für Mitglieder-Zugriff |

### Tech-Entscheidungen

| Entscheidung | Warum? |
|---|---|
| **Supabase Auth E-Mails** | Kein externer Dienst nötig, Auth-Flow ist bereits integriert, kein zusätzlicher Setup |
| **Separate Members-Tabelle** | Klare Trennung von Besitz (vehicles.user_id) und Kollaboration, flexibel erweiterbar |
| **Token-basierte Einladungen** | Sicher, einmalig verwendbar, automatisch ablaufend — kein Risiko von Mehrfachnutzung |
| **Rolle in Members-Tabelle** | Einfach zu prüfen per RLS, keine separate Rollen-Tabelle nötig bei nur 3 Rollen |
| **7 Tage Ablauf** | Balance zwischen Convenience und Sicherheit |

### Sicherheit

- **RLS:** Alle Zugriffe über `vehicle_members`-JOIN — kein Zugriff ohne Mitgliedschaft
- **Einladungs-Token:** Zufällig generiert, einmalig, ablaufend
- **Besitzer-Schutz:** Besitzer-Rolle kann nicht entfernt oder geändert werden
- **Werkstatt-Isolation:** Kann nur eigene Einträge bearbeiten (created_by-Prüfung)
- **API-Schutz:** Alle Mutations-Endpoints prüfen Rolle + Mitgliedschaft

### Keine neuen Abhängigkeiten

Alles mit bestehenden Paketen umsetzbar (Supabase, shadcn/ui, lucide-react).

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
