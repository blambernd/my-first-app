-- Store user-editable due dates for TÜV/HU and Service reminders
CREATE TABLE vehicle_due_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due_type TEXT NOT NULL CHECK (due_type IN ('tuv_hu', 'service')),
  due_date DATE NOT NULL,
  reminder_sent_7d BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_sent_1d BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vehicle_id, due_type)
);

ALTER TABLE vehicle_due_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own due dates" ON vehicle_due_dates
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_vehicle_due_dates_vehicle ON vehicle_due_dates(vehicle_id);
CREATE INDEX idx_vehicle_due_dates_due ON vehicle_due_dates(due_date);
