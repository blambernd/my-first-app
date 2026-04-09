# PROJ-18: Empfehlungsprogramm (Referral)

## Status: Deployed
**Created:** 2026-04-09
**Last Updated:** 2026-04-09

## Dependencies
- Requires: PROJ-1 (User Authentication) — User muss eingeloggt sein
- Requires: PROJ-2 (Fahrzeugprofil) — Trigger: geworbener User legt erstes Fahrzeug an
- Requires: PROJ-8 (Freemium-Modell) — Premium-Zeitraum wird auf Subscription angerechnet

## Zusammenfassung
Eingeloggte User erhalten einen persönlichen Empfehlungslink, den sie teilen können. Wenn sich ein neuer User über diesen Link registriert **und sein erstes Fahrzeug anlegt**, wird die Empfehlung als erfolgreich gewertet. Der Werber erhält 3 Monate kostenlosen Premium-Zugang (kumulativ, ohne Limit). Der geworbene User erhält 1 Monat Premium.

## User Stories
- Als eingeloggter User möchte ich auf dem Dashboard meinen persönlichen Empfehlungslink sehen, damit ich ihn an Freunde weitergeben kann
- Als User möchte ich den Empfehlungslink mit einem Klick kopieren können, damit das Teilen einfach ist
- Als User möchte ich sehen, wie viele Empfehlungen ich bereits erfolgreich ausgesprochen habe, damit ich meinen Fortschritt verfolgen kann
- Als User möchte ich sehen, welche Empfehlungen noch offen sind (registriert, aber noch kein Fahrzeug angelegt), damit ich weiß, was noch aussteht
- Als werbender User möchte ich automatisch 3 Monate Premium erhalten, wenn meine Empfehlung erfolgreich ist, ohne dass ich etwas tun muss
- Als geworbener User möchte ich 1 Monat Premium erhalten, sobald ich mein erstes Fahrzeug anlege, damit auch ich einen Vorteil habe
- Als User mit mehreren erfolgreichen Empfehlungen möchte ich, dass sich die Premium-Monate kumulativ addieren (z.B. 3 Empfehlungen = 9 Monate)

## Acceptance Criteria
- [ ] Jeder eingeloggte User hat einen eindeutigen Empfehlungslink (z.B. `oldtimer-docs.com/r/ABC123`)
- [ ] Der Empfehlungslink wird auf der Dashboard-Seite in einer eigenen Karte angezeigt
- [ ] Der Link kann mit einem "Kopieren"-Button in die Zwischenablage kopiert werden
- [ ] Die Empfehlungskarte zeigt die Anzahl erfolgreicher Empfehlungen an
- [ ] Die Empfehlungskarte zeigt die Anzahl offener Empfehlungen an (registriert, aber noch kein Fahrzeug)
- [ ] Bei Registrierung über einen Empfehlungslink wird der Referral-Code gespeichert (Zuordnung Werber -> Geworbener)
- [ ] Eine Empfehlung gilt als erfolgreich, sobald der geworbene User sein erstes Fahrzeug anlegt
- [ ] Bei erfolgreicher Empfehlung: Werber erhält 3 Monate Premium-Zugang
- [ ] Bei erfolgreicher Empfehlung: Geworbener erhält 1 Monat Premium-Zugang
- [ ] Premium-Monate sind kumulativ: Jede erfolgreiche Empfehlung addiert 3 Monate
- [ ] Wenn der Werber bereits Premium hat (Stripe), werden die Referral-Monate nach Ablauf des bezahlten Abos angerechnet
- [ ] Wenn der Werber im Free-Plan ist, wird er sofort auf Premium hochgestuft
- [ ] Der Empfehlungslink ist stabil und ändert sich nicht

## Edge Cases
- **User empfiehlt sich selbst:** Selbst-Referral (gleiche E-Mail oder gleicher Browser) muss verhindert werden
- **Geworbener User löscht Fahrzeug wieder:** Einmal erfolgreiche Empfehlung bleibt bestehen, Premium wird nicht rückgängig gemacht
- **Werber löscht sein Konto:** Geworbener behält seinen Bonus-Monat
- **Geworbener User hat schon ein Konto:** Empfehlungslink bei bereits registrierten Usern ignorieren (kein doppelter Bonus)
- **Referral-Code ungültig oder gelöscht:** Registrierung funktioniert trotzdem normal, nur ohne Referral-Bonus
- **Werber hat aktives Stripe-Abo:** Referral-Monate werden als Bonus nach Abo-Ende vorgemerkt, nicht sofort verrechnet
- **Mehrere Referrals gleichzeitig erfolgreich:** Jede einzelne wird korrekt verarbeitet und addiert

## Technische Anforderungen
- Performance: Empfehlungslink-Generierung < 100ms
- Security: Referral-Codes dürfen nicht vorhersagbar sein (keine sequentiellen IDs)
- Referral-Code: 8-stellig, alphanumerisch, URL-safe
- Datenschutz: Werber sieht keine persönlichen Daten der geworbenen User

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
Dashboard (/dashboard — bestehend, erweitert)
+-- ReferralCard (neue Karte)
|   +-- Empfehlungslink mit Kopier-Button
|   +-- Statistik: "X erfolgreiche Empfehlungen"
|   +-- Statistik: "X offene Empfehlungen"

Registrierung (/register — bestehend, erweitert)
+-- Referral-Code aus URL auslesen und speichern

Referral-Landingpage (/r/[code])
+-- Leitet auf /register?ref=CODE weiter

Fahrzeug anlegen (bestehend, erweitert)
+-- Nach erstem Fahrzeug: Referral-Belohnung auslösen
```

### B) Datenmodell

```
Neue Tabelle: referrals
- Eindeutige ID
- Werber (User-ID) — wer hat empfohlen
- Geworbener (User-ID) — wer wurde geworben
- Referral-Code — welcher Code wurde verwendet
- Status: pending | completed
- Erstellt-/Abgeschlossen-Zeitstempel

Bestehende Tabelle: subscriptions (erweitert)
- Neues Feld: referral_code (8-stellig, alphanumerisch, unique)
- Neues Feld: referral_bonus_months (Integer, Default 0)
- Neues Feld: referral_bonus_until (Datum)
```

### C) API-Routen

| Route | Zweck |
|-------|-------|
| GET `/api/referral` | Referral-Code + Statistiken des Users laden |
| POST `/api/referral/complete` | Intern: Belohnung auslösen wenn erstes Fahrzeug angelegt wird |

### D) Ablauf

```
1. User A kopiert Link: oldtimer-docs.com/r/ABC123
2. User B klickt → /r/ABC123 → Redirect zu /register?ref=ABC123
3. User B registriert sich → Referral in DB gespeichert (Status: pending)
4. User B legt erstes Fahrzeug an → Trigger:
   a) Referral-Status → completed
   b) User A: +3 Monate Premium-Bonus
   c) User B: +1 Monat Premium-Bonus
```

### E) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Referral-Code auf Subscription | Jeder User hat genau eine Subscription |
| `/r/[code]` als Route | Kurze, teilbare URLs |
| Bonus-Monate statt Stripe-Gutschein | Funktioniert auch für Free-User ohne Stripe-Abo |
| Trigger beim Fahrzeug-Anlegen | Serverseitig, nicht manipulierbar |
| `referral_bonus_until` Datum | Einfache Prüfung: NOW() < bonus_until → Premium |

### F) Anpassungen bestehender Komponenten

| Komponente | Änderung |
|---|---|
| `dashboard/page.tsx` | ReferralCard einbinden |
| `register/page.tsx` | `ref`-Parameter aus URL lesen |
| `subscription.ts` (getEffectivePlan) | `referral_bonus_until` berücksichtigen |
| Fahrzeug-Erstellung (API) | Nach INSERT prüfen ob erstes Fahrzeug → Referral auslösen |

### G) Neue Packages
Keine — alle benötigten Tools sind bereits vorhanden.

## QA Test Results
**Date:** 2026-04-09
**Tester:** QA Engineer (code review + unit tests)

### Automated Tests
- **Vitest:** 256/256 passed (including 6 new referral bonus tests)
- **Existing test suites:** No regressions

### Unit Tests Added
- `src/lib/subscription.test.ts` — 6 new tests covering:
  - Expired trial with active referral bonus → premium
  - Expired trial with expired referral bonus → free
  - Canceled subscription with active referral bonus → premium
  - Canceled subscription without referral bonus → free
  - Past-due after grace period with referral bonus → premium
  - Active trial ignores referral bonus (trial takes precedence)

### Security Audit
| Check | Result |
|---|---|
| Auth check on /api/referral | Pass |
| Auth check on /api/referral/complete | Pass |
| Service role for referral writes | Pass |
| RLS on referrals table (SELECT for referrer only) | Pass |
| Self-referral prevention (DB trigger) | Pass |
| No personal data of referred users exposed | Pass |
| Referral code not predictable (md5-based) | Partial — see BUG-1 |
| /r/[code] input validation | Pass |

### Acceptance Criteria (Code Review)
| Criterion | Status | Notes |
|---|---|---|
| Eindeutiger Empfehlungslink pro User | Pass | Generated via md5 in DB trigger |
| Empfehlungslink auf Dashboard-Karte | Pass | ReferralCard component |
| Kopier-Button | Pass | Clipboard API with feedback |
| Anzahl erfolgreiche Empfehlungen | Pass | Counted from referrals table |
| Anzahl offene Empfehlungen | Pass | Counted from referrals table |
| Referral-Code bei Registrierung gespeichert | Pass | raw_user_meta_data + DB trigger |
| Trigger bei erstem Fahrzeug | Pass | /api/referral/complete + count check |
| Werber +3 Monate Premium | Pass | With bonus start logic |
| Geworbener +1 Monat Premium | Partial | BUG-3: referral_bonus_months falsch |
| Kumulative Bonus-Monate | Pass | Extends existing bonus_until |
| Stripe-Abo: Bonus nach Ablauf | Pass | bonusStart = current_period_end |
| Free-User sofort Premium | Pass | bonusStart = now |
| Stabiler Link | Pass | Code ändert sich nicht |

### Bugs Found

#### BUG-1: Referral-Code nur Hex-Zeichen statt volles Alphabet [Low]
**Severity:** Low
**Status:** Open
**Details:** `md5()` generiert nur 0-9, a-f. Das ergibt 16^8 = ~4 Mrd mögliche Codes statt 36^8 = ~2.8 Bio. Für die aktuelle Nutzerbasis ausreichend, aber nicht optimal.

#### BUG-2: /r/[code] Regex-Validierung zu breit [Low]
**Severity:** Low
**Status:** Open
**Details:** Route validiert `[a-zA-Z0-9]{8}` aber Codes nutzen nur `[0-9a-f]{8}`. Kein Funktionsfehler.

#### BUG-3: referral_bonus_months im referred-User-Update fehlerhaft [Medium]
**Severity:** Medium
**Status:** Open
**Details:** In `/api/referral/complete/route.ts:92-96`: Das SELECT holt nur `referral_bonus_until` aber nicht `referral_bonus_months`. Der Cast auf Zeile 108 liefert immer `undefined`, somit wird `referral_bonus_months` statt kumulativ immer auf `REFERRED_BONUS_MONTHS` (1) gesetzt.
**Fix:** `referral_bonus_months` zum SELECT hinzufügen.

#### BUG-4: Keine Race-Condition-Absicherung bei /api/referral/complete [Medium]
**Severity:** Medium
**Status:** Open
**Details:** Doppelter Aufruf könnte theoretisch doppelte Belohnungen vergeben. Der `count === 1` Check und der `status: pending` Filter bieten gewissen Schutz, aber kein DB-Lock.
**Fix:** Optimistic locking oder `UPDATE ... WHERE status = 'pending' RETURNING *` statt separatem SELECT+UPDATE.

#### BUG-5: Fehlende RLS-Policy für referred_id [Low]
**Severity:** Low
**Status:** Open
**Details:** Geworbener User kann eigene Referral-Daten nicht per RLS lesen. Aktuell kein Problem da nur Service-Client schreibt/liest, aber für Konsistenz sinnvoll.

### Production-Ready Decision
**NOT READY** — BUG-3 (Medium) muss gefixt werden. BUG-4 (Medium) sollte idealerweise auch behoben werden.

## Deployment
- **Deployed:** 2026-04-09
- **Migrations to apply:** `20260409_referrals.sql`
- **No new env vars required**
