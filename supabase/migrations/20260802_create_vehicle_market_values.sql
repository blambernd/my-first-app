-- Selbst eingetragener Marktwert (Ersatz für die ausgesetzte Marktanalyse).
--
-- Als eigene Tabelle mit Datum statt als Spalte am Fahrzeug: Die Seite heißt
-- "Wertentwicklung" — ein Verlauf von Schätzungen ist dort die passende Form,
-- und ein einzelner überschriebener Wert wäre ein Rückschritt.
CREATE TABLE vehicle_market_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_cents BIGINT NOT NULL CHECK (value_cents > 0 AND value_cents <= 100000000000),
  valued_on DATE NOT NULL,
  note TEXT CHECK (note IS NULL OR length(note) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE vehicle_market_values ENABLE ROW LEVEL SECURITY;

-- Nur der Besitzer, wie im gesamten Kostenbereich (PROJ-27).
CREATE POLICY "Besitzer sieht eigene Marktwerte" ON vehicle_market_values
  FOR SELECT USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Besitzer legt Marktwerte an" ON vehicle_market_values
  FOR INSERT WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    AND user_id = auth.uid()
  );

CREATE POLICY "Besitzer aendert eigene Marktwerte" ON vehicle_market_values
  FOR UPDATE USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer')
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE POLICY "Besitzer loescht eigene Marktwerte" ON vehicle_market_values
  FOR DELETE USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

-- Deckt die einzige Abfrage ab: jüngster Wert je Fahrzeug.
CREATE INDEX idx_vehicle_market_values_vehicle_date
  ON vehicle_market_values (vehicle_id, valued_on DESC);
