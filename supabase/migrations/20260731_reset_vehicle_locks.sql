-- Reset stale vehicle locks
--
-- `vehicles.is_locked` wird ausschließlich vom Stripe-Webhook gesetzt
-- (lockExcessVehicles bei Downgrade auf Free). Entsperrt wird nur bei
-- checkout.session.completed / Upgrade — Events, die im Beta- bzw. MVP-Modus
-- nie eintreffen. Dadurch bleiben Sperren aus früheren Cancel-/Widerruf-Tests
-- dauerhaft stehen und erzeugen ein irreführendes "Gesperrt"-Badge im
-- Dashboard, obwohl die Sperre nirgends erzwungen wird.
--
-- Solange NEXT_PUBLIC_BETA_MODE aktiv ist, hat jeder Nutzer Premium-Zugriff,
-- d. h. jeder gesetzte Wert ist falsch. Diese Migration setzt den Flag zurück.
--
-- Hinweis: Der Trigger `vehicles_updated_at` setzt updated_at der betroffenen
-- Zeilen auf NOW(). Das ist unkritisch — updated_at steuert lediglich, welches
-- Fahrzeug bei einem künftigen Downgrade entsperrt bleibt.

UPDATE vehicles
SET is_locked = false
WHERE is_locked = true;

-- Kontrolle (erwartet: 0 Zeilen):
--   SELECT id, user_id, make, model FROM vehicles WHERE is_locked = true;
