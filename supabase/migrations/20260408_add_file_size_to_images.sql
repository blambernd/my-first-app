-- PROJ-8 BUG-2: Add file_size column to image tables for storage tracking
-- vehicle_documents already has file_size; vehicle_images and vehicle_milestone_images do not.

ALTER TABLE vehicle_images
  ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;

ALTER TABLE vehicle_milestone_images
  ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
