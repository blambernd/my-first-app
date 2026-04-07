-- PROJ-6 RESET: Run this BEFORE re-running the main migration
-- Drops all PROJ-6 objects in the correct dependency order

-- 1. Drop RLS policies that depend on get_user_vehicle_role()
DROP POLICY IF EXISTS "Owner or member can view service entries" ON service_entries;
DROP POLICY IF EXISTS "Owner or werkstatt can create service entries" ON service_entries;
DROP POLICY IF EXISTS "Owner or creator can update service entries" ON service_entries;
DROP POLICY IF EXISTS "Owner or creator can delete service entries" ON service_entries;

DROP POLICY IF EXISTS "Owner or member can view documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Owner or werkstatt can create documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Owner or creator can update documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Owner or creator can delete documents" ON vehicle_documents;

DROP POLICY IF EXISTS "Owner or member can view milestones" ON vehicle_milestones;
DROP POLICY IF EXISTS "Owner or werkstatt can create milestones" ON vehicle_milestones;
DROP POLICY IF EXISTS "Owner or creator can update milestones" ON vehicle_milestones;
DROP POLICY IF EXISTS "Owner or creator can delete milestones" ON vehicle_milestones;

DROP POLICY IF EXISTS "Owner or member can view milestone images" ON vehicle_milestone_images;
DROP POLICY IF EXISTS "Owner or werkstatt can create milestone images" ON vehicle_milestone_images;
DROP POLICY IF EXISTS "Owner or creator can update milestone images" ON vehicle_milestone_images;
DROP POLICY IF EXISTS "Owner or creator can delete milestone images" ON vehicle_milestone_images;

-- 1b. Drop vehicle_members policies (INSERT policy references vehicle_invitations)
DROP POLICY IF EXISTS "Owner or invited user can add vehicle members" ON vehicle_members;
DROP POLICY IF EXISTS "Owner can view vehicle members" ON vehicle_members;
DROP POLICY IF EXISTS "Owner can update vehicle members" ON vehicle_members;
DROP POLICY IF EXISTS "Owner or self can delete vehicle members" ON vehicle_members;

-- 1c. Drop vehicle_invitations policies
DROP POLICY IF EXISTS "Owner can view vehicle invitations" ON vehicle_invitations;
DROP POLICY IF EXISTS "Invited user or unauthenticated can view invitation" ON vehicle_invitations;
DROP POLICY IF EXISTS "Owner can create vehicle invitations" ON vehicle_invitations;
DROP POLICY IF EXISTS "Owner or matched invited user can update invitations" ON vehicle_invitations;

-- 2. Drop policies on vehicles and vehicle_images that were replaced
DROP POLICY IF EXISTS "Users can view own or member vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view images of own or member vehicles" ON vehicle_images;

-- 3. Drop the helper function (now safe)
DROP FUNCTION IF EXISTS get_user_vehicle_role(UUID, UUID);

-- 4. Drop PROJ-6 tables
DROP TABLE IF EXISTS vehicle_invitations;
DROP TABLE IF EXISTS vehicle_members;

-- 5. Drop added columns
ALTER TABLE service_entries DROP COLUMN IF EXISTS created_by;
ALTER TABLE vehicle_documents DROP COLUMN IF EXISTS created_by;
ALTER TABLE vehicle_milestones DROP COLUMN IF EXISTS created_by;

-- 6. Restore original RLS policies (so migration can re-create them)
-- Drop first in case reset was already run
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view images of own vehicles" ON vehicle_images;
DROP POLICY IF EXISTS "Users can view service entries of own vehicles" ON service_entries;
DROP POLICY IF EXISTS "Users can create service entries for own vehicles" ON service_entries;
DROP POLICY IF EXISTS "Users can update service entries of own vehicles" ON service_entries;
DROP POLICY IF EXISTS "Users can delete service entries of own vehicles" ON service_entries;
DROP POLICY IF EXISTS "Users can view documents of own vehicles" ON vehicle_documents;
DROP POLICY IF EXISTS "Users can create documents for own vehicles" ON vehicle_documents;
DROP POLICY IF EXISTS "Users can update documents of own vehicles" ON vehicle_documents;
DROP POLICY IF EXISTS "Users can delete documents of own vehicles" ON vehicle_documents;
DROP POLICY IF EXISTS "Users can view milestones of own vehicles" ON vehicle_milestones;
DROP POLICY IF EXISTS "Users can create milestones for own vehicles" ON vehicle_milestones;
DROP POLICY IF EXISTS "Users can update milestones of own vehicles" ON vehicle_milestones;
DROP POLICY IF EXISTS "Users can delete milestones of own vehicles" ON vehicle_milestones;
DROP POLICY IF EXISTS "Users can view images of own milestones" ON vehicle_milestone_images;
DROP POLICY IF EXISTS "Users can create images for own milestones" ON vehicle_milestone_images;
DROP POLICY IF EXISTS "Users can update images of own milestones" ON vehicle_milestone_images;
DROP POLICY IF EXISTS "Users can delete images of own milestones" ON vehicle_milestone_images;

CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view images of own vehicles"
  ON vehicle_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_images.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view service entries of own vehicles"
  ON service_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = service_entries.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create service entries for own vehicles"
  ON service_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = service_entries.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update service entries of own vehicles"
  ON service_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = service_entries.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete service entries of own vehicles"
  ON service_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = service_entries.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view documents of own vehicles"
  ON vehicle_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for own vehicles"
  ON vehicle_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents of own vehicles"
  ON vehicle_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents of own vehicles"
  ON vehicle_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view milestones of own vehicles"
  ON vehicle_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_milestones.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create milestones for own vehicles"
  ON vehicle_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_milestones.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones of own vehicles"
  ON vehicle_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_milestones.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones of own vehicles"
  ON vehicle_milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_milestones.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view images of own milestones"
  ON vehicle_milestone_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      JOIN vehicles ON vehicles.id = vehicle_milestones.vehicle_id
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create images for own milestones"
  ON vehicle_milestone_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      JOIN vehicles ON vehicles.id = vehicle_milestones.vehicle_id
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images of own milestones"
  ON vehicle_milestone_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      JOIN vehicles ON vehicles.id = vehicle_milestones.vehicle_id
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images of own milestones"
  ON vehicle_milestone_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      JOIN vehicles ON vehicles.id = vehicle_milestones.vehicle_id
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND vehicles.user_id = auth.uid()
    )
  );
