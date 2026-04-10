# PROJ-23: Push-Notifications (Termine)

## Status: Approved
**Created:** 2026-04-09
**Last Updated:** 2026-04-09

## Dependencies
- Requires: PROJ-21 (Capacitor App Setup) — native Push-Notifications benötigen Capacitor-Hülle
- Relates to: PROJ-3 (Digitales Scheckheft) — TÜV-Termine und Wartungsintervalle als Datenquelle

## User Stories
- As a Fahrzeugbesitzer, I want to an anstehende TÜV-Termine erinnert werden so that ich keine Fristen verpasse
- As a Nutzer, I want to Erinnerungen für anstehende Wartungen erhalten so that ich mein Fahrzeug rechtzeitig in die Werkstatt bringe
- As a Nutzer, I want to selbst einstellen können welche Benachrichtigungen ich erhalte so that ich nicht von irrelevanten Meldungen gestört werde
- As a Nutzer, I want to den Erinnerungszeitraum konfigurieren können (z.B. 2 Wochen vorher) so that ich genug Vorlauf habe
- As a Nutzer mit mehreren Fahrzeugen, I want to Erinnerungen pro Fahrzeug erhalten so that ich weiß welches Fahrzeug betroffen ist

## Acceptance Criteria
- [ ] Nutzer wird beim ersten App-Start um Push-Berechtigung gebeten
- [ ] Push-Token wird serverseitig gespeichert (Supabase-Tabelle `push_tokens`)
- [ ] TÜV-Termin-Erinnerung wird X Tage vor Ablauf gesendet (konfigurierbar)
- [ ] Benachrichtigung enthält: Fahrzeugname, Terminart, Fälligkeitsdatum
- [ ] Tippen auf die Benachrichtigung öffnet die App auf der relevanten Fahrzeugseite
- [ ] Nutzer kann Benachrichtigungen in den Einstellungen ein-/ausschalten
- [ ] Nutzer kann Erinnerungszeitraum wählen (1 Woche, 2 Wochen, 1 Monat vorher)
- [ ] Bei mehreren Fahrzeugen werden separate Erinnerungen pro Fahrzeug gesendet
- [ ] Wenn Berechtigung verweigert wird, erscheint ein Hinweis in den App-Einstellungen
- [ ] Benachrichtigungen werden nicht doppelt gesendet (Dedup-Logik serverseitig)

## Edge Cases
- Was passiert wenn der Nutzer die Push-Berechtigung verweigert? Hinweis in Einstellungen, keine erneute Nachfrage beim nächsten Start
- Was passiert wenn ein TÜV-Termin bereits abgelaufen ist? Überfällig-Hinweis statt Erinnerung
- Was passiert wenn der Nutzer die App deinstalliert? Token wird ungültig, Server handelt Fehler graceful
- Was passiert bei Geräten ohne Push-Support (Web)? Feature wird ausgeblendet, alternativ E-Mail-Erinnerung (Zukunft)
- Was passiert wenn sich der TÜV-Termin ändert nachdem die Erinnerung geplant wurde? Erinnerung wird aktualisiert/storniert

## Technical Requirements
- @capacitor/push-notifications Plugin für iOS (APNs) und Android (FCM)
- Apple Developer Account: Push-Notification-Zertifikat / Key
- Firebase Cloud Messaging (FCM) für Android
- Supabase-Tabelle `push_tokens`: user_id, device_token, platform, created_at
- Supabase Edge Function oder Cron-Job für tägliche Termin-Prüfung und Versand
- Supabase-Tabelle `notification_preferences`: user_id, type, enabled, reminder_days
- Server-Side: FCM/APNs HTTP API für Push-Versand

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick
Web Push Notifications für Termin-Erinnerungen (TÜV, Service, Ölwechsel). Der Nutzer wird im Browser gefragt ob er Push-Benachrichtigungen erlauben möchte. Wird erlaubt, speichert der Server das Push-Abonnement und sendet bei fälligen Terminen automatisch Push-Nachrichten — auch wenn die App/Website geschlossen ist.

**Warum Web Push statt nativ (APNs/FCM)?**
Die App wird primär im Browser genutzt. Web Push funktioniert sofort für alle Nutzer ohne App-Store-Installation. Native Push über Capacitor kann in Phase 2 ergänzt werden — die Server-Logik bleibt identisch.

### Architektur

```
Nutzer öffnet App im Browser
|
v
+------------------------------------------+
|  Benachrichtigungs-Banner (einmalig)     |
|  "Möchtest du Push-Benachrichtigungen    |
|   für Termine erhalten?"                 |
|  [Ja, aktivieren]    [Nein danke]        |
+------------------------------------------+
          |
          v (Ja)
+------------------------------------------+
|  Browser fragt: "Benachrichtigungen      |
|  erlauben?" (System-Dialog)              |
+------------------------------------------+
          |
          v (Erlaubt)
+------------------------------------------+
|  Push-Abo wird gespeichert               |
|  → API: POST /api/push/subscribe         |
|  → Tabelle: push_subscriptions           |
+------------------------------------------+

--- Jeden Tag um 08:00 UTC (Cron) ---

+------------------------------------------+
|  /api/cron/check-reminders               |
|  (existiert bereits!)                    |
|                                          |
|  1. Fällige Termine suchen               |
|  2. In-App-Notification erstellen (✓)    |
|  3. E-Mail senden (✓, existiert)         |
|  4. NEU: Web Push senden                 |
|     → Push-Abos des Nutzers laden        |
|     → web-push Library nutzen            |
|     → Push an jeden Browser senden       |
+------------------------------------------+
          |
          v
+------------------------------------------+
|  Push-Nachricht erscheint                |
|  +------------------------------------+  |
|  | 🔔 Oldtimer Docs                   |  |
|  | TÜV/HU für BMW 2002 (1974)         |  |
|  | in 7 Tagen fällig (17.04.2026)     |  |
|  +------------------------------------+  |
|  Klick → öffnet Fahrzeugseite            |
+------------------------------------------+
```

### Betroffene Bereiche

#### 1. Push-Berechtigung einholen (Frontend)
```
Profil-Seite / Dashboard
+-- Push-Benachrichtigungs-Karte
|   +-- Status: Aktiviert / Deaktiviert
|   +-- [Aktivieren] Button (wenn noch nicht erlaubt)
|   +-- Einstellungs-Optionen:
|       +-- Erinnerungszeitraum: 1 Tag / 7 Tage / 14 Tage / 30 Tage
|       +-- TÜV-Erinnerungen: An/Aus
|       +-- Service-Erinnerungen: An/Aus
```

- Beim ersten Besuch: Dezenter Hinweis-Banner am Seitenende
- Kein aggressives Popup beim Seitenaufruf — Nutzer entscheidet selbst
- Wenn System-Berechtigung verweigert: Hinweis mit Anleitung zur Reaktivierung

#### 2. Push-Abo speichern (Backend)
```
Neuer API-Endpunkt: POST /api/push/subscribe
- Empfängt: Push-Subscription-Objekt vom Browser
- Speichert: Endpoint, Keys (p256dh, auth) in push_subscriptions

Neuer API-Endpunkt: DELETE /api/push/subscribe
- Entfernt das Push-Abo wenn Nutzer deaktiviert
```

#### 3. Bestehenden Cron erweitern (Backend)
```
Bestehend (/api/cron/check-reminders):
  ✓ Fällige Termine finden
  ✓ In-App-Notification erstellen
  ✓ E-Mail senden via Resend

Neu hinzufügen:
  → Push-Abos des Nutzers laden
  → Nutzer-Präferenzen prüfen (Typ aktiviert? Zeitraum passend?)
  → Web Push senden via web-push Library
  → Bei ungültigem Abo: Eintrag löschen (Deinstallation/Widerruf)
```

#### 4. Benachrichtigungs-Einstellungen (Frontend + Backend)
```
Profil-Seite (/profil)
+-- Bereich "Benachrichtigungen"
    +-- Push-Status (Aktiviert/Deaktiviert mit Toggle)
    +-- Erinnerungszeitraum (Dropdown: 1/7/14/30 Tage)
    +-- Typ-Filter:
        +-- TÜV/HU-Erinnerungen (Toggle)
        +-- Service-Erinnerungen (Toggle)
        +-- Ölwechsel-Erinnerungen (Toggle)
```

#### 5. Service Worker erweitern
```
Bestehender Service Worker (sw.js):
  ✓ Asset-Caching

Neu hinzufügen:
  → push Event-Handler: Notification anzeigen
  → notificationclick Event-Handler: App öffnen auf Fahrzeugseite
```

### Datenmodell

```
Push-Abonnement (push_subscriptions):
- Eindeutige ID
- Nutzer-ID (Verknüpfung zum Account)
- Push-Endpoint (URL des Browser-Push-Dienstes)
- Verschlüsselungs-Keys (p256dh + auth — für Ende-zu-Ende-Verschlüsselung)
- Plattform (web / ios / android — für Phase 2)
- Erstellungsdatum

Gespeichert in: Supabase-Datenbank mit RLS (Nutzer sieht nur eigene Abos)

Benachrichtigungs-Einstellungen (notification_preferences):
- Eindeutige ID
- Nutzer-ID
- Erinnerungs-Vorlauf in Tagen (Standard: 7)
- TÜV-Erinnerungen aktiv (Standard: Ja)
- Service-Erinnerungen aktiv (Standard: Ja)
- Ölwechsel-Erinnerungen aktiv (Standard: Ja)

Gespeichert in: Supabase-Datenbank mit RLS
```

### Technische Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Push-Technologie | Web Push API | Funktioniert in allen modernen Browsern (Chrome, Firefox, Edge, Safari 16+) ohne App-Installation. Nutzer können sofort profitieren. |
| Push-Versand | web-push (npm) | Bewährte Open-Source-Library für serverseitigen Web Push. Handhabt Verschlüsselung und Protokoll automatisch. |
| Zeitpunkt | Bestehender Cron (08:00 UTC) | Cron existiert bereits, Push wird als dritter Kanal neben In-App und E-Mail ergänzt. Kein neuer Cron nötig. |
| VAPID-Keys | Einmalig generiert, als Env-Var | Standard-Authentifizierung für Web Push. Einmal generieren, in Vercel-Env speichern. |
| Opt-In-Strategie | Nutzer-initiiert, kein Auto-Popup | Aggressive Push-Dialoge führen zu hoher Ablehnungsrate. Dezenter Hinweis + Einstellungsseite ist nutzerfreundlicher. |
| Einstellungen | Pro Nutzer, nicht pro Gerät | Ein Nutzer kann mehrere Geräte haben. Einstellungen gelten global, Push wird an alle registrierten Geräte gesendet. |

### Dependencies
- **web-push** — Serverseitige Web Push Notification Library (VAPID-Verschlüsselung + Versand)

### Implementierungs-Reihenfolge
1. **VAPID-Keys generieren** — Einmalig, als Env-Var in Vercel speichern
2. **Datenbank-Tabellen** — push_subscriptions + notification_preferences
3. **Service Worker erweitern** — push + notificationclick Events
4. **Subscribe-API** — POST/DELETE /api/push/subscribe
5. **Push-Banner-Komponente** — Dezenter Opt-In im Dashboard
6. **Einstellungsseite** — Push-Präferenzen auf der Profil-Seite
7. **Cron erweitern** — Web Push als dritten Kanal neben E-Mail + In-App
8. **Preferences-API** — GET/PUT /api/push/preferences

### Browser-Kompatibilität
- Chrome/Edge: Vollständig unterstützt
- Firefox: Vollständig unterstützt
- Safari 16+: Unterstützt (seit 2023)
- Mobile Safari (iOS 16.4+): Unterstützt wenn als PWA installiert
- Capacitor-App: Web Push funktioniert im WebView; native Push (APNs/FCM) als Phase 2

## QA Test Results

**Tested:** 2026-04-10
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Automated Tests

- **Unit Tests (Vitest):** 306/306 passed (9 new for `use-push-notifications` hook, 9 existing for push API routes)
- **E2E Tests (Playwright):** 11/11 passed (PROJ-23 specific), 354/364 total (10 pre-existing failures in PROJ-1/PROJ-17, unrelated)

### Acceptance Criteria Status

#### AC-1: Nutzer wird beim ersten App-Start um Push-Berechtigung gebeten
- [x] `PushOptInBanner` renders on dashboard when `status === "prompt"`
- [x] Banner is dismissible with "Nein danke" (persisted in localStorage)
- [x] Non-aggressive opt-in pattern (banner, not popup)

#### AC-2: Push-Token wird serverseitig gespeichert
- [x] `POST /api/push/subscribe` stores endpoint, p256dh, auth in `push_subscriptions`
- [x] Upsert with `(user_id, endpoint)` constraint prevents duplicates
- [x] Auth check prevents unauthenticated storage

#### AC-3: TÜV-Termin-Erinnerung wird X Tage vor Ablauf gesendet (konfigurierbar)
- [x] Preferences UI offers 1/7/14/30 day options
- [x] Preferences stored via `PUT /api/push/preferences`
- [x] Cron checks all 4 windows (1, 7, 14, 30 days) and respects user's `reminder_days` preference (BUG-1 fixed)

#### AC-4: Benachrichtigung enthält Fahrzeugname, Terminart, Fälligkeitsdatum
- [x] Push payload: `${typeLabel} für ${vehicleName} ... fällig (${dueDateFormatted})`
- [x] Title includes type label (TÜV/HU or Service)

#### AC-5: Tippen auf Benachrichtigung öffnet relevante Fahrzeugseite
- [x] `notificationclick` handler navigates to `data.url` (`/vehicles/${id}/scheckheft`)
- [x] Focuses existing tab or opens new one

#### AC-6: Nutzer kann Benachrichtigungen ein-/ausschalten
- [x] `NotificationSettings` has Switch toggle for push on/off
- [x] Subscribe/unsubscribe calls work correctly
- [x] DELETE endpoint removes subscription from DB

#### AC-7: Nutzer kann Erinnerungszeitraum wählen
- [x] Select component with 1/7/14/30 days
- [x] Auto-saves on change via PUT endpoint
- [x] Cron now uses stored value (BUG-1 fixed)

#### AC-8: Bei mehreren Fahrzeugen separate Erinnerungen
- [x] Cron iterates all `vehicle_due_dates` with vehicle join
- [x] Each vehicle gets its own notification with vehicle name

#### AC-9: Wenn Berechtigung verweigert, Hinweis in Einstellungen
- [x] `NotificationSettings` shows "Push-Berechtigung wurde verweigert. Bitte erlaube Benachrichtigungen in den Browser-Einstellungen."
- [x] Switch is disabled when denied

#### AC-10: Benachrichtigungen werden nicht doppelt gesendet (Dedup)
- [x] `reminder_sent_7d` and `reminder_sent_1d` flags updated after sending
- [x] Cron query filters on these flags

### Edge Cases Status

#### EC-1: Push-Berechtigung verweigert
- [x] Status updates to "denied", no re-prompt on next visit
- [x] Banner does not show again after dismissal

#### EC-2: TÜV-Termin bereits abgelaufen
- [ ] **BUG-2:** No overdue notification logic exists. Cron only checks tomorrow and +7 days — past-due dates are ignored.

#### EC-3: App deinstalliert / Token ungültig
- [x] Cron handles 410/404 push errors by deleting invalid subscriptions from DB

#### EC-4: Geräte ohne Push-Support
- [x] Hook returns "unsupported", banner and settings hidden
- [x] E-Mail-Erinnerung exists as fallback via Resend

#### EC-5: TÜV-Termin ändert sich nach Erinnerung geplant
- [x] Due date changes reset `reminder_sent_*` flags (new due_date = new row or update triggers new check)

### Security Audit Results

- [x] **Authentication:** All push API endpoints (subscribe, preferences) check `supabase.auth.getUser()` and return 401 if not authenticated
- [x] **Authorization:** RLS on `push_subscriptions` and `notification_preferences` — users can only see/modify own data. Policies: SELECT, INSERT, DELETE (subscriptions), SELECT, INSERT, UPDATE (preferences)
- [x] **Input Validation:** Zod schemas validate all POST/PUT inputs. `endpoint` must be valid URL, `keys` must be non-empty strings, `reminder_days` must be in [1, 7, 14, 30]
- [x] **Cron Security:** Protected by `CRON_SECRET` bearer token check
- [x] **VAPID Key Exposure:** Only public key exposed via `/api/push/vapid-key` (private key stays server-side)
- [x] **No SQL Injection:** All queries go through Supabase client (parameterized)
- [x] **Cascade Delete:** `ON DELETE CASCADE` on user_id FK — user deletion cleans up subscriptions and preferences
- [x] **Rate Limiting:** Subscribe (10/min), preferences (20/min) rate limits per user (BUG-3 fixed)

### Bugs Found

#### ~~BUG-1: Cron ignores user's `reminder_days` preference~~ FIXED
- **Severity:** Medium
- **Fix:** Added `reminder_sent_14d` and `reminder_sent_30d` columns. Cron now checks all 4 windows (1, 7, 14, 30 days) and only sends the advance reminder matching the user's `reminder_days` preference. 1-day reminders are always sent as final warning.

#### BUG-2: No overdue notification for past-due dates
- **Severity:** Low
- **Steps to Reproduce:**
  1. Have a TÜV due date that has passed
  2. Expected: Receive an "overdue" notification
  3. Actual: No notification — cron only checks future dates
- **Priority:** Nice to have (spec mentions "Überfällig-Hinweis" in edge cases)

#### ~~BUG-3: No rate limiting on push API endpoints~~ FIXED
- **Severity:** Low
- **Fix:** Added in-memory rate limiting per user: subscribe 10 req/min, preferences 20 req/min. Returns 429 when exceeded.

### Vitest Config Fix
- **Note:** Fixed a systemic `vitest` concurrency issue on Windows (all 16 test suites failing with "Cannot read properties of undefined (reading 'config')"). Added `pool: 'forks'` to `vitest.config.ts`. This was a pre-existing issue unrelated to PROJ-23.

### Summary
- **Acceptance Criteria:** 10/10 passed (BUG-1 and BUG-3 fixed)
- **Bugs Found:** 3 total — 2 fixed (BUG-1 medium, BUG-3 low), 1 remaining (BUG-2 low)
- **Security:** Pass (auth, RLS, input validation, VAPID, rate limiting all correct)
- **Production Ready:** YES — no critical/high bugs remaining
- **Recommendation:** Deploy. BUG-2 (overdue notifications) is a nice-to-have for a future iteration.

## Deployment
_To be added by /deploy_
