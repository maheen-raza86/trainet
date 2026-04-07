-- Migration: Course Offerings Refactor
-- Description: Refactor course system to follow SRDS design with course catalog and course offerings
-- Date: 2026-03-11

-- ============================================
-- STEP 1: Create course_offerings table
-- ============================================

CREATE TABLE IF NOT EXISTS course_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks IN (4, 6, 8, 12)),
  hours_per_week INTEGER NOT NULL CHECK (hours_per_week >= 1 AND hours_per_week <= 10),
  outline TEXT NOT NULL CHECK (char_length(outline) >= 20),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_offerings_course_id ON course_offerings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_offerings_trainer_id ON course_offerings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_course_offerings_status ON course_offerings(status);

-- Add comment
COMMENT ON TABLE course_offerings IS 'Stores course offerings created by trainers from the course catalog';

-- ============================================
-- STEP 2: Add offering_id to enrollments table
-- ============================================

-- Add new column (nullable initially for migration)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_enrollments_offering_id ON enrollments(offering_id);

-- Note: course_id will be kept for backward compatibility during migration
-- After migration is complete and all enrollments are updated, course_id can be removed

-- ============================================
-- STEP 3: Add course_offering_id to assignments table
-- ============================================

-- Add new column (nullable initially for migration)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_assignments_course_offering_id ON assignments(course_offering_id);

-- Note: course_id will be kept for backward compatibility during migration
-- After migration is complete and all assignments are updated, course_id can be removed

-- ============================================
-- STEP 4: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view open course offerings
CREATE POLICY "Anyone can view open course offerings"
  ON course_offerings
  FOR SELECT
  USING (status = 'open' OR auth.uid() = trainer_id);

-- Policy: Trainers can create their own course offerings
CREATE POLICY "Trainers can create course offerings"
  ON course_offerings
  FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

-- Policy: Trainers can update their own course offerings
CREATE POLICY "Trainers can update their own course offerings"
  ON course_offerings
  FOR UPDATE
  USING (auth.uid() = trainer_id)
  WITH CHECK (auth.uid() = trainer_id);

-- Policy: Trainers can delete their own course offerings
CREATE POLICY "Trainers can delete their own course offerings"
  ON course_offerings
  FOR DELETE
  USING (auth.uid() = trainer_id);

-- ============================================
-- STEP 5: Add trigger for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_course_offerings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_offerings_updated_at
  BEFORE UPDATE ON course_offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_course_offerings_updated_at();

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- After running this migration:
-- 1. Existing courses in the 'courses' table become the course catalog
-- 2. Trainers will create course_offerings instead of courses
-- 3. Students will enroll in course_offerings instead of courses
-- 4. Assignments will be linked to course_offerings instead of courses
-- 5. The backend API has been updated to use the new structure
-- 6. Old enrollments and assignments will continue to work with course_id
-- 7. New enrollments and assignments will use offering_id and course_offering_id

-- To complete the migration:
-- 1. Run this SQL script on your Supabase database
-- 2. Restart the backend server
-- 3. Test the new course offering workflow
-- 4. Optionally migrate existing data to the new structure
