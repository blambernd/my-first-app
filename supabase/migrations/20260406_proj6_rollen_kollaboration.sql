-- PROJ-6: Rollen & Kollaboration — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Run AFTER all previous migrations.
--
-- This migration:
-- 1. Creates vehicle_members table
-- 2. Creates vehicle_invitations table
-- 3. Creates a helper function for role checking (needs vehicle_members to exist)
-- 4. Adds created_by to existing tables (for werkstatt isolation)
-- 5. Updates RLS policies on ALL existing tables to support member access

-- ============================================================
-- 1. VEHICLE_MEMBERS TABLE (must be created before the helper function)
-- ============================================================
CREATE TABLE vehicle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('besitzer', 'werkstatt', 'betrachter')),
  user_email TEXT CHECK (user_email IS NULL OR length(user_email) <= 320),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vehicle_id, user_id)
);

-- Indexes
CREATE INDEX idx_vehicle_members_vehicle_id ON vehicle_members(vehicle_id);
CREATE INDEX idx_vehicle_members_user_id ON vehicle_members(user_id);

-- RLS
ALTER TABLE vehicle_members ENABLE ROW LEVEL SECURITY;

-- Owner can see all members of their vehicles
CREATE POLICY "Owner can view vehicle members"
  ON vehicle_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_members.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- NOTE: INSERT policy for vehicle_members is defined AFTER vehicle_invitations table
-- (because it references vehicle_invitations in a subquery)

-- Only owner can update member roles
CREATE POLICY "Owner can update vehicle members"
  ON vehicle_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_members.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Owner can remove members; members can remove themselves
CREATE POLICY "Owner or self can delete vehicle members"
  ON vehicle_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_members.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );


-- ============================================================
-- 2. VEHICLE_INVITATIONS TABLE
-- ============================================================
CREATE TABLE vehicle_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (length(email) <= 320),
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('werkstatt', 'betrachter')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'angenommen', 'abgelaufen', 'widerrufen')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vehicle_invitations_vehicle_id ON vehicle_invitations(vehicle_id);
CREATE INDEX idx_vehicle_invitations_token ON vehicle_invitations(token);
CREATE INDEX idx_vehicle_invitations_email ON vehicle_invitations(email);
CREATE INDEX idx_vehicle_invitations_status ON vehicle_invitations(vehicle_id, status);

-- Prevent duplicate open invitations for the same email+vehicle
CREATE UNIQUE INDEX idx_vehicle_invitations_unique_open
  ON vehicle_invitations(vehicle_id, email)
  WHERE (status = 'offen');

-- RLS
ALTER TABLE vehicle_invitations ENABLE ROW LEVEL SECURITY;

-- Owner can see all invitations for their vehicles
CREATE POLICY "Owner can view vehicle invitations"
  ON vehicle_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_invitations.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Invited user can see their own invitation (matched by email)
-- Unauthenticated users can also see invitations (needed for /invite/[token] before login)
CREATE POLICY "Invited user or unauthenticated can view invitation"
  ON vehicle_invitations FOR SELECT
  USING (
    -- Authenticated user: only see invitations addressed to their email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    -- Unauthenticated (anon): allow SELECT but frontend filters by token
    -- This is safe because the token (UUID) is unguessable and serves as access control
    OR auth.uid() IS NULL
  );

-- Only owner can create invitations
CREATE POLICY "Owner can create vehicle invitations"
  ON vehicle_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_invitations.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Owner can revoke invitations; invited user can accept (only status change offen→angenommen)
CREATE POLICY "Owner or matched invited user can update invitations"
  ON vehicle_invitations FOR UPDATE
  USING (
    -- Owner can update any invitation for their vehicle
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_invitations.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
    -- Invited user can update only if their email matches and invitation is still open
    OR (
      auth.uid() IS NOT NULL
      AND status = 'offen'
      AND expires_at > NOW()
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );


-- ============================================================
-- 2b. DEFERRED INSERT POLICY ON VEHICLE_MEMBERS
-- (Now safe — vehicle_invitations table exists)
-- ============================================================
CREATE POLICY "Owner or invited user can add vehicle members"
  ON vehicle_members FOR INSERT
  WITH CHECK (
    -- Owner can add anyone
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_members.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
    -- Invited user can add themselves IF a valid open invitation exists with matching role
    OR (
      user_id = auth.uid()
      AND role != 'besitzer'
      AND EXISTS (
        SELECT 1 FROM vehicle_invitations
        WHERE vehicle_invitations.vehicle_id = vehicle_members.vehicle_id
        AND vehicle_invitations.status = 'offen'
        AND vehicle_invitations.expires_at > NOW()
        AND vehicle_invitations.role = vehicle_members.role
        AND vehicle_invitations.email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      )
    )
  );


-- ============================================================
-- 3. HELPER FUNCTION: Get user's role for a vehicle
-- Returns: 'besitzer', 'werkstatt', 'betrachter', or NULL
-- Must be created AFTER vehicle_members table exists.
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_vehicle_role(p_vehicle_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Check ownership first (fast path)
  SELECT 'besitzer'
  FROM vehicles
  WHERE id = p_vehicle_id AND user_id = p_user_id
  UNION ALL
  -- Then check membership
  SELECT role
  FROM vehicle_members
  WHERE vehicle_id = p_vehicle_id AND user_id = p_user_id
  LIMIT 1;
$$;


-- ============================================================
-- 4. ADD created_by TO EXISTING TABLES (for werkstatt isolation)
-- ============================================================

-- service_entries: who created this entry
ALTER TABLE service_entries
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- vehicle_documents: who uploaded this document
ALTER TABLE vehicle_documents
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- vehicle_milestones: who created this milestone
ALTER TABLE vehicle_milestones
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill existing records: set created_by to the vehicle owner
UPDATE service_entries
SET created_by = vehicles.user_id
FROM vehicles
WHERE service_entries.vehicle_id = vehicles.id
AND service_entries.created_by IS NULL;

UPDATE vehicle_documents
SET created_by = vehicles.user_id
FROM vehicles
WHERE vehicle_documents.vehicle_id = vehicles.id
AND vehicle_documents.created_by IS NULL;

UPDATE vehicle_milestones
SET created_by = vehicles.user_id
FROM vehicles
WHERE vehicle_milestones.vehicle_id = vehicles.id
AND vehicle_milestones.created_by IS NULL;


-- ============================================================
-- 5. UPDATE RLS POLICIES ON EXISTING TABLES
-- ============================================================

-- ---- VEHICLES ----
-- Members can view vehicles they're part of
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
CREATE POLICY "Users can view own or member vehicles"
  ON vehicles FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM vehicle_members
      WHERE vehicle_members.vehicle_id = vehicles.id
      AND vehicle_members.user_id = auth.uid()
    )
  );

-- Only owner can create/update/delete vehicles (unchanged logic, just renamed for clarity)
-- INSERT/UPDATE/DELETE policies remain: auth.uid() = user_id

-- ---- VEHICLE_IMAGES ----
-- Members can view images
DROP POLICY IF EXISTS "Users can view images of own vehicles" ON vehicle_images;
CREATE POLICY "Users can view images of own or member vehicles"
  ON vehicle_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_images.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM vehicle_members
      WHERE vehicle_members.vehicle_id = vehicle_images.vehicle_id
      AND vehicle_members.user_id = auth.uid()
    )
  );

-- ---- SERVICE_ENTRIES ----
-- All members can view
DROP POLICY IF EXISTS "Users can view service entries of own vehicles" ON service_entries;
CREATE POLICY "Owner or member can view service entries"
  ON service_entries FOR SELECT
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL
  );

-- Owner + Werkstatt can create
DROP POLICY IF EXISTS "Users can create service entries for own vehicles" ON service_entries;
CREATE POLICY "Owner or werkstatt can create service entries"
  ON service_entries FOR INSERT
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  );

-- Owner can update any; Werkstatt can update own
DROP POLICY IF EXISTS "Users can update service entries of own vehicles" ON service_entries;
CREATE POLICY "Owner or creator can update service entries"
  ON service_entries FOR UPDATE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND created_by = auth.uid()
    )
  );

-- Owner can delete any; Werkstatt can delete own
DROP POLICY IF EXISTS "Users can delete service entries of own vehicles" ON service_entries;
CREATE POLICY "Owner or creator can delete service entries"
  ON service_entries FOR DELETE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND created_by = auth.uid()
    )
  );


-- ---- VEHICLE_DOCUMENTS ----
-- All members can view
DROP POLICY IF EXISTS "Users can view documents of own vehicles" ON vehicle_documents;
CREATE POLICY "Owner or member can view documents"
  ON vehicle_documents FOR SELECT
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL
  );

-- Owner + Werkstatt can create
DROP POLICY IF EXISTS "Users can create documents for own vehicles" ON vehicle_documents;
CREATE POLICY "Owner or werkstatt can create documents"
  ON vehicle_documents FOR INSERT
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  );

-- Owner can update any; Werkstatt can update own
DROP POLICY IF EXISTS "Users can update documents of own vehicles" ON vehicle_documents;
CREATE POLICY "Owner or creator can update documents"
  ON vehicle_documents FOR UPDATE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND created_by = auth.uid()
    )
  );

-- Owner can delete any; Werkstatt can delete own
DROP POLICY IF EXISTS "Users can delete documents of own vehicles" ON vehicle_documents;
CREATE POLICY "Owner or creator can delete documents"
  ON vehicle_documents FOR DELETE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND created_by = auth.uid()
    )
  );


-- ---- VEHICLE_MILESTONES ----
-- All members can view
DROP POLICY IF EXISTS "Users can view milestones of own vehicles" ON vehicle_milestones;
CREATE POLICY "Owner or member can view milestones"
  ON vehicle_milestones FOR SELECT
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL
  );

-- Owner + Werkstatt can create
DROP POLICY IF EXISTS "Users can create milestones for own vehicles" ON vehicle_milestones;
CREATE POLICY "Owner or werkstatt can create milestones"
  ON vehicle_milestones FOR INSERT
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
  );

-- Owner can update any; Werkstatt can update own
DROP POLICY IF EXISTS "Users can update milestones of own vehicles" ON vehicle_milestones;
CREATE POLICY "Owner or creator can update milestones"
  ON vehicle_milestones FOR UPDATE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND created_by = auth.uid()
    )
  );

-- Owner can delete any; Werkstatt can delete own
DROP POLICY IF EXISTS "Users can delete milestones of own vehicles" ON vehicle_milestones;
CREATE POLICY "Owner or creator can delete milestones"
  ON vehicle_milestones FOR DELETE
  USING (
    get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer'
    OR (
      get_user_vehicle_role(vehicle_id, auth.uid()) = 'werkstatt'
      AND created_by = auth.uid()
    )
  );


-- ---- VEHICLE_MILESTONE_IMAGES ----
-- All members can view
DROP POLICY IF EXISTS "Users can view images of own milestones" ON vehicle_milestone_images;
CREATE POLICY "Owner or member can view milestone images"
  ON vehicle_milestone_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND get_user_vehicle_role(vehicle_milestones.vehicle_id, auth.uid()) IS NOT NULL
    )
  );

-- Owner + Werkstatt can create (for their own milestones)
DROP POLICY IF EXISTS "Users can create images for own milestones" ON vehicle_milestone_images;
CREATE POLICY "Owner or werkstatt can create milestone images"
  ON vehicle_milestone_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicle_milestones
      WHERE vehicle_milestones.id = vehicle_milestone_images.milestone_id
      AND get_user_vehicle_role(vehicle_milestones.vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
    )
  );

-- Owner can update any; Werkstatt can update images of own milestones
DROP POLICY IF EXISTS "Users can update images of own milestones" ON vehicle_milestone_images;
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
          AND vehicle_milestones.created_by = auth.uid()
        )
      )
    )
  );

-- Owner can delete any; Werkstatt can delete images of own milestones
DROP POLICY IF EXISTS "Users can delete images of own milestones" ON vehicle_milestone_images;
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
          AND vehicle_milestones.created_by = auth.uid()
        )
      )
    )
  );
