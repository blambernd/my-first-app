-- Add milestone_id FK to vehicle_documents so documents can be linked to milestones.
-- Run this in Supabase SQL Editor.

ALTER TABLE vehicle_documents
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES vehicle_milestones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_milestone_id
  ON vehicle_documents(milestone_id)
  WHERE milestone_id IS NOT NULL;
