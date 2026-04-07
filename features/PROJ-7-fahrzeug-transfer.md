# PROJ-7: Fahrzeug-Transfer

## Status: Architected
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-6 (Rollen & Kollaboration) — Baut auf dem Rollen-System auf

## User Stories
- Als Fahrzeug-Besitzer möchte ich mein Fahrzeug an einen neuen Besitzer übertragen können, damit bei Verkauf die komplette Historie mitgeht
- Als neuer Besitzer möchte ich die vollständige Fahrzeughistorie übernehmen, damit ich die Dokumentation nahtlos weiterführen kann
- Als alter Besitzer möchte ich nach dem Transfer optional eine Kopie der Historie behalten können
- Als neuer Besitzer möchte ich den Transfer bestätigen müssen, damit keine ungewollten Übertragungen stattfinden

## Acceptance Criteria
- [ ] Besitzer kann Transfer per E-Mail des neuen Besitzers initiieren
- [ ] Neuer Besitzer muss den Transfer aktiv bestätigen (Accept/Decline)
- [ ] Alle Daten werden übertragen: Fahrzeugprofil, Scheckheft, Dokumente, Timeline
- [ ] Alter Besitzer verliert Besitzer-Rolle nach Transfer
- [ ] Alter Besitzer kann optional als Betrachter verknüpft bleiben
- [ ] Transfer-Ereignis wird in der Timeline dokumentiert ("Besitzerwechsel am DD.MM.YYYY")
- [ ] Alle bestehenden Kollaborationen (Werkstatt, Betrachter) werden beibehalten — neuer Besitzer kann sie danach entfernen
- [ ] Transfer kann vom alten Besitzer abgebrochen werden, solange er nicht bestätigt wurde

## Edge Cases
- Was passiert wenn der neue Besitzer noch kein Konto hat? → E-Mail mit Registrierungs-Link, Transfer wird nach Registrierung aktiviert
- Was passiert wenn der Transfer abgelehnt wird? → Alter Besitzer wird benachrichtigt, Fahrzeug bleibt unverändert
- Was passiert wenn der alte Besitzer während des laufenden Transfers Daten ändert? → Änderungen werden normal gespeichert, Transfer umfasst aktuellen Stand bei Bestätigung
- Was passiert wenn beide Besitzer gleichzeitig das Fahrzeug transferieren wollen? → Nur der aktuelle Besitzer kann transferieren, es kann nur einen aktiven Transfer geben
- Was passiert wenn der Transfer-Link abläuft? → 14 Tage gültig, danach muss neu initiiert werden

## Technical Requirements (optional)
- Transfer-Token: Einmalig, 14 Tage gültig
- Atomare Transaktion: Rollenwechsel muss atomar erfolgen (kein Zwischenzustand ohne Besitzer)
- Audit-Log: Transfer wird dauerhaft protokolliert

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure
```
Fahrzeug-Detailseite (Header)
+-- "Transfer"-Button (nur für Besitzer, neben Freigabe/Bearbeiten/Löschen)

Transfer-Seite (/vehicles/[id]/transfer)
+-- Transfer-Info-Header (Fahrzeugname, Hinweis)
+-- Transfer-Formular
|   +-- E-Mail-Eingabe (neuer Besitzer)
|   +-- Checkbox: "Als Betrachter verknüpft bleiben"
|   +-- "Transfer starten"-Button
+-- Aktiver Transfer (wenn bereits gestartet)
|   +-- Status-Anzeige (Ausstehend / Angenommen / Abgelehnt)
|   +-- Kopierbarer Transfer-Link
|   +-- "Transfer abbrechen"-Button

Transfer-Annahme-Seite (/transfer/[token])
+-- Fahrzeug-Details (Marke, Modell, Jahr)
+-- Info: "Du wirst neuer Besitzer dieses Fahrzeugs"
+-- "Transfer annehmen" / "Transfer ablehnen"-Buttons
+-- Login/Registrierung (wenn nicht angemeldet)
```

### Data Model
```
vehicle_transfers:
- id: UUID (Primary Key)
- vehicle_id: UUID → vehicles(id)
- from_user_id: UUID → auth.users(id)
- to_email: Text (E-Mail des neuen Besitzers)
- token: UUID (einmalig, für Transfer-Link)
- keep_as_viewer: Boolean (alter Besitzer bleibt als Betrachter)
- status: Text (offen / angenommen / abgelehnt / abgebrochen)
- expires_at: Timestamp (14 Tage nach Erstellung)
- created_at: Timestamp

Constraints:
- Nur ein aktiver Transfer (status = 'offen') pro Fahrzeug
- Token ist unique
- 14 Tage Gültigkeit
```

### Tech Decisions
| Decision | Choice | Why |
|---|---|---|
| E-Mail-Versand | Resend | Modern, einfach, 3.000 Mails/Monat gratis, ideal für Next.js |
| Transfer-Link | Gleicher Ansatz wie Einladungen | Konsistenz, bewährtes Muster |
| Atomare Transaktion | Supabase RPC-Funktion | Verhindert Zwischenzustand ohne Besitzer |
| Token-Gültigkeit | 14 Tage | Genug Zeit, sicher genug |
| E-Mail auch für Einladungen | Ja | Gleiche Resend-Integration für PROJ-6 nachnutzbar |

### New Files & Routes
```
Pages:
- /vehicles/[id]/transfer        → Transfer-Formular (nur Besitzer)
- /transfer/[token]              → Transfer-Annahme (öffentlich)

API Routes:
- /api/transfers                 → POST: Transfer erstellen + E-Mail senden
- /api/transfers/[token]         → GET: Transfer-Details laden
- /api/transfers/[token]/accept  → POST: Transfer annehmen (atomar)
- /api/transfers/[token]/decline → POST: Transfer ablehnen

Components:
- transfer-form.tsx              → Formular zum Starten
- transfer-status.tsx            → Anzeige des aktiven Transfers

Email Templates:
- emails/transfer-invite.tsx     → E-Mail an neuen Besitzer

Database:
- New table: vehicle_transfers
- New RPC function: accept_vehicle_transfer (atomar)
```

### Dependencies
- resend — E-Mail-Versand-API
- @react-email/components — E-Mail-Vorlagen als React-Komponenten

### Security
- Nur aktueller Besitzer kann Transfer starten
- Nur ein aktiver Transfer pro Fahrzeug
- Token = UUID (nicht erratbar)
- Annahme erfordert Authentifizierung
- Besitzerwechsel atomar (keine Race-Conditions)
- E-Mail-Adresse wird bei Annahme abgeglichen

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
