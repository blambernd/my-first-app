-- Add "datenkarte" to vehicle_documents category CHECK constraint.
-- The original constraint only allows: rechnung, gutachten, tuev_bericht, kaufvertrag, versicherung, zulassung, sonstiges.
-- Run this in Supabase SQL Editor.

-- Drop old constraint
ALTER TABLE vehicle_documents DROP CONSTRAINT IF EXISTS vehicle_documents_category_check;

-- Add updated constraint with "datenkarte"
ALTER TABLE vehicle_documents ADD CONSTRAINT vehicle_documents_category_check
  CHECK (category IN ('datenkarte', 'rechnung', 'gutachten', 'tuev_bericht', 'kaufvertrag', 'versicherung', 'zulassung', 'sonstiges'));
