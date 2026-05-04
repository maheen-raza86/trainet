-- Migration: Add admin SELECT/UPDATE policy on trainer_applications
-- Description: Allows admin users to read and update all trainer applications.
--              The backend already uses the service role key (bypasses RLS),
--              but this policy ensures correctness for any direct Supabase queries.
-- Date: 2026-05-04

-- Admin can view all applications
CREATE POLICY IF NOT EXISTS "Admins can view all applications"
  ON trainer_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Admin can update all applications (for review metadata)
CREATE POLICY IF NOT EXISTS "Admins can update all applications"
  ON trainer_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
