-- Remove the 17-character length constraint on VIN to allow shorter/older VINs
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicle_vin_check;
ALTER TABLE vehicles ADD CONSTRAINT vehicle_vin_check CHECK (vin IS NULL OR length(vin) <= 50);
