# PROJ-21: Capacitor App Setup

## Status: Planned
**Created:** 2026-04-09
**Last Updated:** 2026-04-09

## Dependencies
- Requires: PROJ-20 (Mobile Responsive Optimierung) — alle Seiten müssen mobil optimiert sein, bevor die App-Hülle sinnvoll ist

## User Stories
- As a Oldtimer-Besitzer, I want to die App aus dem App Store installieren so that ich sie wie eine native App auf meinem Handy nutzen kann
- As a iOS-Nutzer, I want to die App aus dem Apple App Store herunterladen so that ich sie einfach finden und installieren kann
- As a Android-Nutzer, I want to die App aus dem Google Play Store herunterladen so that ich sie einfach finden und installieren kann
- As a Nutzer, I want to die App mit einem Icon auf meinem Homescreen haben so that ich sie schnell öffnen kann
- As a Entwickler, I want to einen automatisierten Build-Prozess haben so that ich neue Versionen einfach für beide Plattformen bauen kann

## Acceptance Criteria
- [ ] Capacitor ist als Dependency im Projekt konfiguriert
- [ ] iOS-Projekt wird generiert und kann in Xcode geöffnet werden
- [ ] Android-Projekt wird generiert und kann in Android Studio geöffnet werden
- [ ] Die Web-App läuft fehlerfrei in der nativen Hülle auf beiden Plattformen
- [ ] App-Icon und Splash-Screen sind konfiguriert (Oldtimer-Scheckheft Branding)
- [ ] Status Bar und Safe Area Insets werden korrekt behandelt
- [ ] Deep Links / URL-Routing funktioniert innerhalb der App
- [ ] Build-Skripte für iOS und Android sind dokumentiert (`npm run build:ios`, `npm run build:android`)
- [ ] App kann als TestFlight-Build (iOS) und interner Test (Android) verteilt werden
- [ ] App Store Listing-Texte und Screenshots sind vorbereitet
- [ ] App-Versioning ist eingerichtet (SemVer)

## Edge Cases
- Was passiert bei einem fehlgeschlagenen Netzwerk-Request in der App? Fehlerseite mit Retry-Button
- Wie verhält sich die App bei einem Update? Auto-Update der Web-Inhalte via Capacitor Live Update oder neuer Store-Release
- Was passiert mit der Auth-Session in der nativen App? Token-Persistenz über App-Neustarts
- Wie werden externe Links gehandhabt? In-App-Browser oder System-Browser je nach Kontext
- Was passiert bei iOS/Android-Berechtigungsdialogen? Graceful Handling wenn Nutzer ablehnt

## Technical Requirements
- Capacitor 6+ mit @capacitor/core, @capacitor/ios, @capacitor/android
- Minimale iOS-Version: iOS 16+
- Minimale Android-Version: Android 8.0 (API 26)+
- Next.js Static Export (`output: 'export'`) oder Capacitor-kompatible Konfiguration
- CI/CD-Pipeline für automatisierte Builds (GitHub Actions)
- Code-Signing für iOS (Apple Developer Account) und Android (Keystore)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
