-- Add factory_code (Werksbezeichnung) field to vehicles
ALTER TABLE vehicles
ADD COLUMN factory_code TEXT;
