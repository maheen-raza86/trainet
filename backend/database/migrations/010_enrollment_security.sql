-- Migration: Enrollment Security & QR Schema Fix
-- Date: 2026-04-14

-- ============================================
-- Fix enrollment_qr_tokens: make course_id nullable,
-- ensure offering_id is the primary reference
-- ============================================
ALTER TABLE enrollment_qr_tokens
  ALTER COLUMN course_id DROP NOT NULL;

ALTER TABLE enrollment_qr_tokens
  ADD COLUMN IF NOT EXISTS offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_qr_tokens_offering_id ON enrollment_qr_tokens(offering_id);

-- ============================================
-- Add role constraint to enrollments table:
-- only students can be enrolled
-- ============================================
ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_student_role_check
  CHECK (
    student_id IN (
      SELECT id FROM profiles WHERE role = 'student'
    )
  );

-- ============================================
-- Clean up any invalid enrollments (non-students)
-- ============================================
DELETE FROM enrollments
WHERE student_id IN (
  SELECT id FROM profiles WHERE role != 'student'
);

-- ============================================
-- Add unique constraint to prevent duplicate enrollments
-- ============================================
ALTER TABLE enrollments
  DROP CONSTRAINT IF EXISTS enrollments_student_offering_unique;

ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_student_offering_unique
  UNIQUE (student_id, offering_id);

-- ============================================
-- registration_deadline column (if not already added)
-- ============================================
ALTER TABLE course_offerings
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;
