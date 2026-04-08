-- Add can_edit_all permission to vehicle_members and vehicle_invitations
-- When TRUE, werkstatt users can edit ALL entries (not just their own)

-- 1. Add column to vehicle_members
ALTER TABLE vehicle_members
  ADD COLUMN IF NOT EXISTS can_edit_all BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add column to vehicle_invitations
ALTER TABLE vehicle_invitations
  ADD COLUMN IF NOT EXISTS can_edit_all BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Update RLS policies for service_entries (UPDATE + DELETE)
DROP POLICY IF EXISTS "Owner or creator can update service entries" ON service_entries;
CREATE POLICY "Owner or creator can update service entries"
  ON service_entries FOR UPDATE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM vehicle_members
          WHERE vehicle_members.vehicle_id = service_entries.vehicle_id
          AND vehicle_members.user_id = auth.uid()
          AND vehicle_members.can_edit_all = TRUE
        )
      )
    )
  );

DROP POLICY IF EXISTS "Owner or creator can delete service entries" ON service_entries;
CREATE POLICY "Owner or creator can delete service entries"
  ON service_entries FOR DELETE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM vehicle_members
          WHERE vehicle_members.vehicle_id = service_entries.vehicle_id
          AND vehicle_members.user_id = auth.uid()
          AND vehicle_members.can_edit_all = TRUE
        )
      )
    )
  );

-- 4. Update RLS policies for vehicle_documents (UPDATE + DELETE)
DROP POLICY IF EXISTS "Owner or creator can update documents" ON vehicle_documents;
CREATE POLICY "Owner or creator can update documents"
  ON vehicle_documents FOR UPDATE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM vehicle_members
          WHERE vehicle_members.vehicle_id = vehicle_documents.vehicle_id
          AND vehicle_members.user_id = auth.uid()
          AND vehicle_members.can_edit_all = TRUE
        )
      )
    )
  );

DROP POLICY IF EXISTS "Owner or creator can delete documents" ON vehicle_documents;
CREATE POLICY "Owner or creator can delete documents"
  ON vehicle_documents FOR DELETE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM vehicle_members
          WHERE vehicle_members.vehicle_id = vehicle_documents.vehicle_id
          AND vehicle_members.user_id = auth.uid()
          AND vehicle_members.can_edit_all = TRUE
        )
      )
    )
  );

-- 5. Update RLS policies for vehicle_milestones (UPDATE + DELETE)
DROP POLICY IF EXISTS "Owner or creator can update milestones" ON vehicle_milestones;
CREATE POLICY "Owner or creator can update milestones"
  ON vehicle_milestones FOR UPDATE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM vehicle_members
          WHERE vehicle_members.vehicle_id = vehicle_milestones.vehicle_id
          AND vehicle_members.user_id = auth.uid()
          AND vehicle_members.can_edit_all = TRUE
        )
      )
    )
  );

DROP POLICY IF EXISTS "Owner or creator can delete milestones" ON vehicle_milestones;
CREATE POLICY "Owner or creator can delete milestones"
  ON vehicle_milestones FOR DELETE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM vehicle_members
          WHERE vehicle_members.vehicle_id = vehicle_milestones.vehicle_id
          AND vehicle_members.user_id = auth.uid()
          AND vehicle_members.can_edit_all = TRUE
        )
      )
    )
  );

-- 6. Update vehicle_milestone_images policies too
DROP POLICY IF EXISTS "Owner or creator can update milestone images" ON vehicle_milestone_images;
DROP POLICY IF EXISTS "Owner or creator can delete milestone images" ON vehicle_milestone_images;

CREATE POLICY "Owner or creator can delete milestone images"
  ON vehicle_milestone_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND (
        get_user_vehicle_role(vehicle_milestones.vehicle_id, auth.uid()) = 'besitzer'
        OR (
          get_user_vehicle_role(vehicle_milestones.vehicle_id, auth.uid()) = 'werkstatt'
          AND (
            vehicle_milestones.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM vehicle_members
              WHERE vehicle_members.vehicle_id = vehicle_milestones.vehicle_id
              AND vehicle_members.user_id = auth.uid()
              AND vehicle_members.can_edit_all = TRUE
            )
          )
        )
      )
    )
  );
