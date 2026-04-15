-- Migration: Fix duration_weeks constraint to allow flexible values
-- The original CHECK (duration_weeks IN (4, 6, 8, 12)) is too restrictive
-- Replace with a range check: 1-52 weeks

ALTER TABLE course_offerings
  DROP CONSTRAINT IF EXISTS course_offerings_duration_weeks_check;

ALTER TABLE course_offerings
  ADD CONSTRAINT course_offerings_duration_weeks_check
  CHECK (duration_weeks >= 1 AND duration_weeks <= 52);

-- Also add registration_deadline column if not already added
ALTER TABLE course_offerings
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;
