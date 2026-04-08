-- Fix: UPDATE policy for vehicle_milestone_images was dropped but not re-created
-- in 20260408_werkstatt_permissions.sql. This restores it.

CREATE POLICY "Owner or creator can update milestone images"
  ON vehicle_milestone_images FOR UPDATE
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
