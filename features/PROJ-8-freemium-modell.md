# PROJ-8: Freemium-Modell

## Status: Deployed
**Created:** 2026-04-04
**Last Updated:** 2026-04-08

## Dependencies
- Requires: PROJ-1 (User Authentication) — Abo ist an Nutzerkonto gebunden
- Requires: PROJ-2 (Fahrzeugprofil) — Fahrzeug-Limit prüfen
- Requires: PROJ-4 (Dokumenten-Archiv) — Speicher-Limit prüfen
- Requires: PROJ-11 (Marktpreis-Analyse) — Premium-Feature-Gate
- Requires: PROJ-16 (Verkaufsassistent) — Premium-Feature-Gate

## Plan-Übersicht

| | Free | Premium |
|---|---|---|
| Fahrzeuge | 1 | Unbegrenzt |
| Speicher | 100 MB | 5 GB |
| Scheckheft, Historie, Dokumente, Kurzprofil | ✅ | ✅ |
| Fahrzeug-Transfer, Kollaboration | ✅ | ✅ |
| Verkaufsassistent (Wizard) | ❌ | ✅ |
| Marktpreis-Analyse | ❌ | ✅ |
| Prioritäts-Support | ❌ | ✅ |

**Preise:** 4,99 €/Monat oder 49,99 €/Jahr (2 Monate gratis)
**Trial:** 14 Tage Premium kostenlos für neue Nutzer
**Payment:** Stripe Checkout + Stripe Customer Portal

## User Stories
- Als Free-Nutzer möchte ich die App mit einem Fahrzeug kostenlos nutzen können, damit ich den Mehrwert testen kann bevor ich bezahle
- Als Nutzer möchte ich klar sehen, welche Limits mein aktueller Plan hat (Fahrzeuge, Speicher), damit ich weiß, wann ein Upgrade nötig ist
- Als Nutzer möchte ich auf einen Premium-Plan upgraden können, damit ich mehr Fahrzeuge, mehr Speicher und Premium-Features bekomme
- Als Premium-Nutzer möchte ich mein Abo verwalten können (kündigen, Plan wechseln, Rechnungen einsehen) über das Stripe Customer Portal
- Als neuer Nutzer möchte ich 14 Tage Premium kostenlos testen können, damit ich alle Features ausprobieren kann
- Als Free-Nutzer möchte ich bei Premium-Features (Verkaufsassistent, Marktpreis) einen klaren Hinweis mit Upgrade-Möglichkeit sehen
- Als Nutzer möchte ich meinen Speicherverbrauch und die Fahrzeug-Anzahl jederzeit einsehen können
- Als Nutzer, der kündigt, möchte ich dass meine Daten erhalten bleiben und ich nur in der Nutzung eingeschränkt werde

## Acceptance Criteria

### Plan-Verwaltung & Anzeige
- [ ] Nutzer sieht seinen aktuellen Plan (Free/Premium/Trial) in den Kontoeinstellungen
- [ ] Nutzung wird angezeigt: "1/1 Fahrzeuge", "45 MB / 100 MB Speicher"
- [ ] Fortschrittsbalken für Speicher und Fahrzeuge zeigt visuelle Auslastung
- [ ] Bei Trial: Anzeige der verbleibenden Tage ("12 Tage verbleibend")

### Upgrade-Flow
- [ ] Upgrade-Button in den Kontoeinstellungen leitet zu Stripe Checkout weiter
- [ ] Auswahl zwischen Monats- (4,99 €) und Jahresabo (49,99 €) vor Checkout
- [ ] Nach erfolgreicher Zahlung wird der Plan sofort auf Premium gesetzt (via Stripe Webhook)
- [ ] Bei fehlgeschlagener Zahlung bleibt der Plan unverändert

### Feature-Gating
- [ ] Free-Nutzer kann maximal 1 Fahrzeug anlegen — bei Versuch ein zweites anzulegen erscheint Upgrade-Dialog
- [ ] Free-Nutzer kann maximal 100 MB Speicher nutzen — bei Überschreitung erscheint Upgrade-Dialog beim Upload
- [ ] Verkaufsassistent-Seite zeigt für Free-Nutzer eine Premium-Upsell-Seite statt dem Wizard
- [ ] Marktpreis-Analyse zeigt für Free-Nutzer eine Premium-Upsell-Seite statt der Analyse
- [ ] Premium-Badge in der Navigation bei gesperrten Features

### Trial
- [ ] Neue Nutzer erhalten automatisch 14 Tage Premium-Trial bei Registrierung
- [ ] Trial-Zeitraum wird in Kontoeinstellungen angezeigt mit Countdown
- [ ] Nach Ablauf des Trials wird der Nutzer automatisch auf Free herabgestuft
- [ ] Trial-Nutzer sieht Hinweis: "Dein Trial endet in X Tagen — jetzt upgraden"
- [ ] Trial kann nicht mehrfach gestartet werden (einmalig pro Account)

### Downgrade / Kündigung
- [ ] Bei Kündigung: Plan wechselt zu Free am Ende des Abrechnungszeitraums
- [ ] Alle Daten bleiben erhalten (Fahrzeuge, Dokumente, Einträge)
- [ ] Nur 1 Fahrzeug bleibt aktiv nutzbar (zuletzt bearbeitetes), restliche werden gesperrt (read-only)
- [ ] Uploads sind gesperrt bis Speicher unter 100 MB Limit
- [ ] Gesperrte Fahrzeuge sind weiterhin sichtbar aber nicht bearbeitbar
- [ ] Nutzer kann gesperrtes Fahrzeug löschen, um ein anderes zu aktivieren

### Stripe-Integration
- [ ] Stripe Checkout Session wird serverseitig erstellt
- [ ] Stripe Webhooks verarbeiten: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Stripe Customer Portal für Self-Service (Abo kündigen, Zahlungsmethode ändern, Rechnungen)
- [ ] Grace Period: 7 Tage nach fehlgeschlagener Zahlung bevor Downgrade auf Free
- [ ] Stripe Customer ID wird am Nutzerprofil gespeichert

### Abo-Verwaltung
- [ ] Nutzer kann Abo über Stripe Customer Portal verwalten (Link in Kontoeinstellungen)
- [ ] Wechsel zwischen Monats- und Jahresabo möglich (über Customer Portal)
- [ ] Rechnungen sind über Customer Portal einsehbar
- [ ] Bei Kontolöschung wird das Stripe-Abo automatisch gekündigt

## Edge Cases
- **Premium-Nutzer kündigt mit 3 Fahrzeugen:** Daten bleiben erhalten, nur 1 Fahrzeug aktiv, 2 read-only. Nutzer kann Fahrzeuge löschen um andere zu aktivieren.
- **Zahlung fehlgeschlagen:** Grace Period von 7 Tagen. E-Mail-Benachrichtigung. Nach 7 Tagen automatischer Downgrade auf Free.
- **Trial läuft ab während Nutzer 3 Fahrzeuge hat:** Wie Downgrade — 1 Fahrzeug aktiv, restliche read-only.
- **Free-Nutzer versucht zweites Fahrzeug anzulegen:** Modal mit Upgrade-Angebot und Vergleich Free vs. Premium.
- **Free-Nutzer versucht Upload über 100 MB Limit:** Upload wird abgelehnt, Upgrade-Dialog erscheint.
- **Preisänderungen für bestehende Kunden:** Bestehende Abos behalten ihren Preis bis zur nächsten Verlängerung (Stripe Proration).
- **Nutzer löscht Account:** Stripe-Abo wird via Webhook automatisch gekündigt.
- **Webhook-Zustellung fehlgeschlagen:** Retry-Mechanismus von Stripe. Idempotente Webhook-Verarbeitung.
- **Nutzer wechselt von Monat auf Jahr (oder umgekehrt):** Stripe handhabt die Proration automatisch.

## Technical Requirements
- **Payment:** Stripe Checkout + Webhooks + Customer Portal
- **Subscription-Status:** Eigene `subscriptions`-Tabelle in Supabase mit Stripe-Sync via Webhooks
- **Webhook-Sicherheit:** Stripe Webhook Signature Verification (`stripe.webhooks.constructEvent`)
- **Environment Variables:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Speicherberechnung:** Summe aller `vehicle_images`, `vehicle_milestone_images`, `vehicle_documents` Storage-Objekte pro User
- **Performance:** Plan-Status muss schnell abrufbar sein (im Auth-Context cachen)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
Kontoeinstellungen (/dashboard → Konto-Bereich)
+-- PlanOverview (aktueller Plan, Trial-Countdown)
|   +-- UsageBar (Fahrzeuge: "1/1")
|   +-- UsageBar (Speicher: "45 MB / 100 MB")
|   +-- UpgradeButton → Stripe Checkout
|   +-- ManageSubscriptionButton → Stripe Customer Portal
+-- PricingSelector (Monats-/Jahresauswahl vor Checkout)

Feature-Gating (in bestehenden Komponenten)
+-- UpgradeDialog (Modal: Free vs. Premium Vergleich)
|   ← Erscheint bei: zweites Fahrzeug, Upload über Limit
+-- PremiumUpsell (Vollseiten-Ersatz für gesperrte Features)
|   ← Erscheint auf: /verkaufsassistent, /marktpreis
+-- PremiumBadge (kleines Lock-Icon in Navigation)

Dashboard (bestehend, erweitert)
+-- VehicleCard (bestehend)
|   +-- "Gesperrt"-Overlay bei Downgrade (read-only Badge)
```

### B) Datenmodell

```
Neue Tabelle: subscriptions
- Nutzer-ID, Stripe-Kunden-ID, Stripe-Abo-ID
- Plan: free | premium | trial
- Status: active | canceled | past_due
- Aktueller Abrechnungszeitraum (Start/Ende)
- Trial-Ende-Datum
- Erstellt-/Aktualisiert-Zeitstempel

Bestehende Tabelle: vehicles
- Neues Feld: is_locked (Boolean) → read-only nach Downgrade

Speicherberechnung:
- Summe über 3 Storage-Buckets (on-demand, nicht gespeichert)
```

### C) API-Routen

| Route | Zweck |
|-------|-------|
| POST `/api/stripe/checkout` | Erstellt Stripe Checkout Session |
| POST `/api/stripe/portal` | Erstellt Stripe Customer Portal Link |
| POST `/api/stripe/webhook` | Empfängt Stripe Events, aktualisiert DB |
| GET `/api/subscription` | Plan-Status + Nutzungsdaten |
| GET `/api/subscription/usage` | Speicherverbrauch berechnen |

### D) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Stripe Checkout (gehostet) | Kein eigenes Zahlungsformular, automatische SCA/3D-Secure |
| Stripe Customer Portal | Abo-Verwaltung komplett von Stripe gehostet |
| Webhooks statt Polling | Echtzeit-Updates, Retry bei Fehlern |
| Eigene subscriptions-Tabelle | Schneller Zugriff ohne Stripe-API-Call pro Request |
| is_locked auf Fahrzeugen | Einfachster Weg, Fahrzeuge nach Downgrade zu sperren |
| Speicher on-demand berechnen | Kein Sync-Feld nötig, nur bei Upload/Kontoübersicht |
| Trial über Stripe | Stripe unterstützt Trial nativ, kein eigener Timer |

### E) Neue Packages

| Package | Zweck |
|---|---|
| `stripe` | Node.js SDK — Checkout, Portal, Webhooks |

### F) Bestehende Komponenten (Anpassungen)

| Komponente | Änderung |
|---|---|
| dashboard/page.tsx | Plan-Übersicht + Nutzungsanzeige |
| vehicle-form.tsx | Fahrzeug-Limit prüfen |
| vehicle-card.tsx | Gesperrt-Badge bei is_locked |
| sales-wizard.tsx | Premium-Gate für Free-Nutzer |
| market-analysis.tsx | Premium-Gate für Free-Nutzer |
| document-upload-form.tsx | Speicher-Limit prüfen |
| image-upload.tsx | Speicher-Limit prüfen |
| vehicle-profile-nav.tsx | Premium-Badge bei gesperrten Features |
| account-header.tsx | Plan-Badge |
| delete-account-button.tsx | Stripe-Abo kündigen |

## QA Test Results
**Date:** 2026-04-09
**Tester:** QA Engineer (automated + code review)

### Automated Tests
- **Vitest:** 248/248 passed (including 19 new subscription helper tests)
- **Existing test suites:** No regressions

### Unit Tests Added
- `src/lib/subscription.test.ts` — 19 tests covering:
  - `getEffectivePlan`: trial active/expired/null, premium, canceled, past_due, free
  - `canAddVehicle`: free limit (1), premium/trial unlimited
  - `canUpload`: within/exceeding limits for free and premium
  - `hasPremiumAccess`: premium, trial, free

### Security Audit
| Check | Result |
|---|---|
| Webhook signature verification (Stripe) | ✅ Pass |
| Auth check on checkout/portal/subscription APIs | ✅ Pass |
| RLS on subscriptions table (SELECT only for user) | ✅ Pass |
| Service role for write operations only | ✅ Pass |
| No secrets in client-side code | ✅ Pass |
| Stripe Customer Portal for self-service | ✅ Pass |

### Acceptance Criteria (Code Review)
| Criterion | Status | Notes |
|---|---|---|
| Plan anzeigen (Free/Premium/Trial) | ✅ | PlanOverview component |
| Nutzung anzeigen (Fahrzeuge) | ✅ | Progress bar in PlanOverview |
| Trial-Countdown | ✅ | Days remaining shown |
| Upgrade-Button → Stripe Checkout | ✅ | Monats-/Jahresauswahl |
| Webhook verarbeitet checkout.session.completed | ✅ | Unlocks vehicles |
| Webhook verarbeitet subscription.updated | ✅ | Plan/status sync |
| Webhook verarbeitet subscription.deleted | ✅ | Locks excess vehicles |
| Webhook verarbeitet invoice.payment_failed | ✅ | Sets past_due |
| Free-Nutzer: max 1 Fahrzeug | ✅ | AddVehicleCard hidden |
| Verkaufsassistent Premium-Gate | ✅ | PremiumUpsell page |
| Marktpreis Premium-Gate | ✅ | PremiumUpsell page |
| Premium-Badge in Navigation | ✅ | Lock icon for free users |
| Gesperrt-Badge auf VehicleCard | ✅ | Lock overlay |
| Stripe Customer Portal link | ✅ | portal API route |
| Account deletion cancels Stripe sub | ✅ | Updated delete route |
| Default subscription on registration | ✅ | DB trigger |
| Backfill existing users | ✅ | Migration SQL |

### Bugs Found

#### BUG-1: past_due sofort auf free herabgestuft [Medium] — FIXED
**Severity:** Medium
**Status:** Fixed
**Fix:** Added `past_due_since` TIMESTAMPTZ column to subscriptions table. `getEffectivePlan` now checks grace period (7 days). Webhook sets `past_due_since` on `invoice.payment_failed`, clears on `checkout.session.completed`. 2 new unit tests added.

#### BUG-2: Speicherberechnung setzt file_size Spalte voraus [Medium] — FIXED
**Severity:** Medium
**Status:** Fixed
**Fix:** Added migration `20260408_add_file_size_to_images.sql` adding `file_size INTEGER` to `vehicle_images` and `vehicle_milestone_images`. Updated upload code in `vehicle-form.tsx` and `milestone-form.tsx` to save `file.size`.

#### BUG-3: Speicheranzeige fehlt im PlanOverview [Low] — FIXED
**Severity:** Low
**Status:** Fixed
**Fix:** Added `storageMb` to `/api/subscription` response and `useSubscription` hook. Added storage progress bar to `PlanOverview` component showing "X MB / 100 MB" (Free) or "X MB / 5 GB" (Premium).

### Production-Ready Decision
**READY** — All 3 bugs fixed. No Critical or High bugs remaining.

## Deployment
- **Deployed:** 2026-04-09
- **Migrations to apply:** `20260408_subscriptions.sql`, `20260408_add_file_size_to_images.sql`
- **Env vars required:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`
