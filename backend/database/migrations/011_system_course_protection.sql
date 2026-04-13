-- Migration: System Course Protection
-- Date: 2026-04-09
-- Adds is_system_course flag to protect core courses from deletion

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS is_system_course BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN courses.is_system_course IS 'If true, this course cannot be deleted by admin';

-- Mark existing courses as system courses (protect all current ones)
-- Admin can unmark specific ones if needed
UPDATE courses SET is_system_course = TRUE WHERE is_system_course IS NULL OR is_system_course = FALSE;
