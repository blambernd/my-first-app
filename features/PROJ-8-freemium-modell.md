# PROJ-8: Freemium-Modell

## Status: Planned
**Created:** 2026-04-04
**Last Updated:** 2026-04-04

## Dependencies
- Requires: PROJ-1 (User Authentication) — Abo ist an Nutzerkonto gebunden

## User Stories
- Als Free-Nutzer möchte ich die App mit einem Fahrzeug kostenlos nutzen können, damit ich den Mehrwert testen kann
- Als Nutzer möchte ich klar sehen, welche Limits mein aktueller Plan hat, damit ich weiß, wann ein Upgrade nötig ist
- Als Nutzer möchte ich auf einen Premium-Plan upgraden können, damit ich mehr Fahrzeuge und Speicher bekomme
- Als Premium-Nutzer möchte ich mein Abo verwalten können (kündigen, Plan wechseln)
- Als Nutzer möchte ich vor Erreichen eines Limits gewarnt werden, damit ich nicht überrascht werde

## Acceptance Criteria
- [ ] Free-Plan: 1 Fahrzeug, 100 MB Speicher, alle Features verfügbar
- [ ] Premium-Plan: Unbegrenzte Fahrzeuge, 5 GB Speicher, Prioritäts-Support
- [ ] Upgrade-Button ist prominent sichtbar wenn Limit erreicht
- [ ] Bezahlung über Stripe (oder vergleichbar)
- [ ] Nutzer kann Plan in den Einstellungen sehen und verwalten
- [ ] Bei Downgrade: Bestehende Daten bleiben erhalten, aber keine neuen Fahrzeuge/Uploads bis unter Limit
- [ ] Nutzung wird angezeigt: "1/1 Fahrzeuge", "45/100 MB Speicher"
- [ ] Abrechnungszyklus: Monatlich oder jährlich (mit Rabatt)

## Edge Cases
- Was passiert wenn ein Premium-Nutzer kündigt, aber 3 Fahrzeuge hat? → Daten bleiben erhalten, aber keine neuen Fahrzeuge/Uploads möglich bis auf 1 Fahrzeug reduziert
- Was passiert wenn die Zahlung fehlschlägt? → Grace Period von 7 Tagen, danach Downgrade auf Free
- Was passiert wenn ein Nutzer im Free-Plan versucht, ein zweites Fahrzeug anzulegen? → Modal mit Upgrade-Angebot
- Was passiert bei Preisänderungen für bestehende Kunden? → Bestehende Abos behalten alten Preis bis zur nächsten Verlängerung
- Was passiert wenn der Nutzer sein Konto löscht? → Abo wird automatisch gekündigt, Stripe-Webhook

## Technical Requirements (optional)
- Payment: Stripe Checkout + Webhooks
- Subscription-Status: In Supabase User-Metadata oder eigene Tabelle
- Stripe Customer Portal für Abo-Verwaltung

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
