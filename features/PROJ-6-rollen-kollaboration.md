# PROJ-6: Rollen & Kollaboration

## Status: Deployed
**Created:** 2026-04-04
**Last Updated:** 2026-04-07
**Deployed:** 2026-04-07

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

## Implementation Notes (Frontend)

### New Files Created
- `src/lib/validations/member.ts` — Types & Zod schema for members, invitations, roles
- `src/components/members-list.tsx` — Members table with role change dropdown & revoke access
- `src/components/invite-member-form.tsx` — Email + role form to send invitations
- `src/components/pending-invitations.tsx` — List of open invitations with revoke button
- `src/components/vehicle-members.tsx` — Wrapper composing all member components
- `src/app/vehicles/[id]/mitglieder/page.tsx` — Server page for Mitglieder tab (owner-only)
- `src/app/invite/[token]/page.tsx` — Public invite acceptance page (login/register flow)

### Modified Files
- `src/components/vehicle-profile-nav.tsx` — Added "Mitglieder" tab, only visible for owners (`isOwner` prop)
- `src/app/vehicles/[id]/layout.tsx` — Now checks both ownership AND membership via `vehicle_members` table. Hides edit/delete buttons for non-owners
- `src/app/vehicles/[id]/page.tsx` — Supports member access (falls back to membership check)
- `src/app/vehicles/[id]/scheckheft/page.tsx` — Supports member access
- `src/app/vehicles/[id]/historie/page.tsx` — Supports member access
- `src/app/vehicles/[id]/dokumente/page.tsx` — Supports member access
- `src/app/dashboard/page.tsx` — Shows "Geteilte Fahrzeuge" section with role badges

## Implementation Notes (Backend)

### Migration File
- `supabase/migrations/20260406_proj6_rollen_kollaboration.sql` — Complete migration with:

### New Tables
- **`vehicle_members`** — Links users to vehicles with roles (besitzer, werkstatt, betrachter). Unique constraint on (vehicle_id, user_id).
- **`vehicle_invitations`** — Stores invitations with token, role, email, 7-day expiry, status (offen/angenommen/abgelaufen/widerrufen).

### Helper Function
- **`get_user_vehicle_role(vehicle_id, user_id)`** — Returns user's role for a vehicle ('besitzer' via ownership, or role from vehicle_members). Used by all RLS policies. SECURITY DEFINER for performance.

### Schema Changes to Existing Tables
- Added `created_by UUID` to `service_entries`, `vehicle_documents`, `vehicle_milestones` — needed for werkstatt isolation (can only edit/delete own entries). Backfilled with vehicle owner for existing records.

### Updated RLS Policies (all existing tables)
- **vehicles**: Members can SELECT (not just owner)
- **vehicle_images**: Members can SELECT
- **service_entries**: Members can SELECT; werkstatt can INSERT; werkstatt can UPDATE/DELETE own entries only
- **vehicle_documents**: Same pattern as service_entries
- **vehicle_milestones**: Same pattern as service_entries
- **vehicle_milestone_images**: Follows milestone ownership chain

### Frontend Changes
- `service-entry-form.tsx` — Sets `created_by` on insert
- `document-upload-form.tsx` — Sets `created_by` on insert
- `milestone-form.tsx` — Sets `created_by` on insert

### Not Implemented (V1)
- E-Mail sending for invitations — users share the invite link manually for now. Can add Supabase Edge Functions or Resend later.

## QA Test Results

**QA Date:** 2026-04-07
**Tested by:** QA Engineer (code review + automated tests)
**Build Status:** Compiles successfully, 143/143 unit tests pass

### Acceptance Criteria Results

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Besitzer kann andere Nutzer per E-Mail einladen | PASS | Form validates email + role, inserts into vehicle_invitations |
| 2 | Drei Rollen: Besitzer, Werkstatt, Betrachter | PASS | Correctly defined in schema and validation |
| 3 | Einladung per E-Mail mit Link | PARTIAL | Invite link page works, but no actual email is sent (V1 limitation, documented) |
| 4 | Eingeladener sieht Fahrzeug im Dashboard | PASS | Dashboard queries vehicle_members and shows "Geteilte Fahrzeuge" section |
| 5 | Werkstatt kann Scheckheft + Dokumente erstellen | PASS | RLS allows werkstatt INSERT; created_by is set |
| 6 | Werkstatt kann NICHT: Fahrzeug bearbeiten, einladen, fremde Einträge bearbeiten | PASS | Layout hides UI; RLS enforces created_by check |
| 7 | Betrachter kann alles ansehen, nichts bearbeiten | PASS | RLS SELECT allows, INSERT/UPDATE/DELETE denied |
| 8 | Besitzer kann Rollen ändern und Zugriff entziehen | PASS | MembersList has role dropdown + delete with confirmation |
| 9 | Fahrzeug zeigt Mitgliederliste | FAIL | Members show as "Unbekannt" — see BUG-1 |

### Bugs Found

#### BUG-1: Members display as "Unbekannt" (no email shown) — **High**
**File:** `src/app/vehicles/[id]/mitglieder/page.tsx:38`
**Description:** The query `supabase.from("vehicle_members").select("*")` doesn't include user emails. The `vehicle_members` table has no `email` column, and `auth.users` can't be joined from client-side. The `VehicleMember` interface has `user_email?: string` but it's always undefined.
**Steps to reproduce:** Navigate to /vehicles/[id]/mitglieder after adding members.
**Expected:** Each member shows their email address.
**Actual:** All members display "Unbekannt".
**Fix suggestion:** Either add a `user_email` column to `vehicle_members` (populated on insert from the invitation email), or create a database view/function that joins with `auth.users`.

#### BUG-2: vehicle_members INSERT RLS policy allows self-enrollment — **Critical**
**File:** `20260406_proj6_rollen_kollaboration.sql:44-54`
**Description:** The INSERT policy has `OR user_id = auth.uid()` which means ANY authenticated user can insert themselves as a member of ANY vehicle with ANY role — including 'besitzer'. The intent was to allow invited users to create their membership when accepting, but there's no check that a valid open invitation exists.
**Steps to reproduce:** Any authenticated user can call `supabase.from('vehicle_members').insert({ vehicle_id: '<any-id>', user_id: '<own-id>', role: 'besitzer' })`.
**Expected:** Only users with a valid open invitation can insert their membership.
**Actual:** Any authenticated user can grant themselves any role on any vehicle.
**Fix suggestion:** Add an invitation check to the INSERT policy:
```sql
OR (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM vehicle_invitations
    WHERE vehicle_invitations.vehicle_id = vehicle_members.vehicle_id
    AND vehicle_invitations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND vehicle_invitations.status = 'offen'
    AND vehicle_invitations.expires_at > NOW()
  )
)
```
And also enforce that the role matches the invitation role.

#### BUG-3: vehicle_invitations UPDATE RLS too permissive — **Critical**
**File:** `20260406_proj6_rollen_kollaboration.sql:135-146`
**Description:** The UPDATE policy has `OR auth.uid() IS NOT NULL` which means ANY authenticated user can update ANY invitation — they could change status from 'widerrufen' back to 'offen', change the role to escalate privileges, or modify other fields.
**Steps to reproduce:** Any authenticated user can call `supabase.from('vehicle_invitations').update({ status: 'offen', role: 'besitzer' }).eq('id', '<any-invitation-id>')`. Note: role 'besitzer' would fail the CHECK constraint, but 'werkstatt' would not.
**Expected:** Only the owner can revoke; only the invited user (matching token) can accept.
**Actual:** Any authenticated user can modify any invitation.
**Fix suggestion:** Tighten the policy:
```sql
OR (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM vehicle_invitations vi
    WHERE vi.id = vehicle_invitations.id
    AND vi.status = 'offen'
  )
)
```
And add a WITH CHECK to prevent changing the role or vehicle_id during update.

#### BUG-4: vehicle_invitations SELECT exposes all invitations — **Medium**
**File:** `20260406_proj6_rollen_kollaboration.sql:115-121`
**Description:** The `USING (true)` SELECT policy means any user (including anonymous via anon key) can query ALL invitations, exposing email addresses (PII) and vehicle details of all users. The "Owner can view" policy is redundant since `USING(true)` overrides it.
**Steps to reproduce:** An unauthenticated client with the anon key can call `supabase.from('vehicle_invitations').select('*')` and get all invitations.
**Expected:** Only token-holder can see a specific invitation; owner can see their vehicle's invitations.
**Actual:** Everyone can see everything.
**Fix suggestion:** Remove the `USING(true)` policy. Instead, use a server-side API route or Supabase function for the `/invite/[token]` lookup that doesn't depend on client-side RLS.

#### BUG-5: No unique constraint on (vehicle_id, email) for invitations — **Low**
**File:** `20260406_proj6_rollen_kollaboration.sql:83-93`
**Description:** The same email can be invited multiple times to the same vehicle (with status 'offen'). The duplicate check in `invite-member-form.tsx` relies on error code 23505, but there's no unique constraint on (vehicle_id, email). The unique constraint is only on `token`.
**Steps to reproduce:** Invite the same email twice to the same vehicle.
**Expected:** Second invitation is rejected or replaces the first.
**Actual:** Two open invitations are created for the same email.
**Fix suggestion:** Add `UNIQUE (vehicle_id, email) WHERE (status = 'offen')` partial unique index.

#### BUG-6: Invite page shows UUID instead of inviter email — **Low**
**File:** `src/app/invite/[token]/page.tsx:85`
**Description:** `inviterEmail: invitation.invited_by` stores the UUID of the inviting user, not their email. The `InviteInfo` interface names it `inviterEmail` but it's a UUID. Currently unused in the UI, but misleading.

### Regression Testing
- All 143 existing unit tests pass (131 pre-existing + 12 new)
- Build compiles successfully
- Existing pages (dashboard, vehicle detail, scheckheft, historie, dokumente) remain functional with the membership fallback logic

### Security Audit Summary

| Finding | Severity | Description |
|---------|----------|-------------|
| Self-enrollment via INSERT RLS | Critical | Any user can add themselves to any vehicle with any role |
| Invitation UPDATE too open | Critical | Any authenticated user can modify any invitation |
| Invitation SELECT exposes PII | Medium | All invitations readable by anyone, exposing emails |
| No duplicate invite prevention | Low | Same email can be invited multiple times |

### Production-Ready Decision

**NOT READY** — 2 Critical security bugs must be fixed before deployment.

**Must fix (Critical):**
1. BUG-2: Lock down vehicle_members INSERT policy to require valid invitation
2. BUG-3: Lock down vehicle_invitations UPDATE policy

**Should fix (High):**
3. BUG-1: Members showing as "Unbekannt" (core UX broken)

**Should fix before or after deploy (Medium/Low):**
4. BUG-4: Tighten invitation SELECT policy
5. BUG-5: Add duplicate invitation prevention
6. BUG-6: Inviter UUID vs email (cosmetic)

## Deployment
_To be added by /deploy_
