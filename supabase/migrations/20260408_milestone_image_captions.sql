-- Add caption field to milestone images
ALTER TABLE vehicle_milestone_images
ADD COLUMN caption TEXT;
