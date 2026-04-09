-- Allow individual oil subcategory due dates in vehicle_due_dates
ALTER TABLE vehicle_due_dates
  DROP CONSTRAINT IF EXISTS vehicle_due_dates_due_type_check;

ALTER TABLE vehicle_due_dates
  ADD CONSTRAINT vehicle_due_dates_due_type_check
  CHECK (due_type IN ('tuv_hu', 'service', 'oil_change', 'oil_motor_oil', 'oil_transmission_oil', 'oil_rear_axle_oil', 'oil_other_oil'));
