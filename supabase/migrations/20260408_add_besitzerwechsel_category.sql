-- Add 'besitzerwechsel' to vehicle_milestones category CHECK constraint
-- Required for PROJ-7 accept_vehicle_transfer RPC function.
-- Run this in Supabase SQL Editor.

ALTER TABLE vehicle_milestones
  DROP CONSTRAINT IF EXISTS vehicle_milestones_category_check;

ALTER TABLE vehicle_milestones
  ADD CONSTRAINT vehicle_milestones_category_check
  CHECK (category IN (
    'erstzulassung', 'kauf', 'restauration', 'unfall',
    'trophaee', 'lackierung', 'umbau', 'besitzerwechsel', 'sonstiges'
  ));
