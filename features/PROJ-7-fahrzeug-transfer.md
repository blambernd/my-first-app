# PROJ-7: Fahrzeug-Transfer

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
