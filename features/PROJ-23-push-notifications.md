# PROJ-23: Push-Notifications (Termine)

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
