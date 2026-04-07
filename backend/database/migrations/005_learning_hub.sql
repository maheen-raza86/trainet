-- Migration: Learning Hub
-- Description: Add course materials, live session links, AI evaluation, and plagiarism check support
-- Date: 2026-04-07

-- ============================================
-- STEP 1: Course Materials table
-- ============================================

CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 2),
  description TEXT,
  material_type VARCHAR(20) NOT NULL DEFAULT 'file' CHECK (material_type IN ('file', 'video', 'link', 'document')),
  file_url TEXT,
  external_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_materials_offering_id ON course_materials(offering_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_trainer_id ON course_materials(trainer_id);

COMMENT ON TABLE course_materials IS 'Course materials uploaded by trainers for specific course offerings';

-- ============================================
-- STEP 2: Add live session link to course_offerings
-- ============================================

ALTER TABLE course_offerings
  ADD COLUMN IF NOT EXISTS live_session_link TEXT,
  ADD COLUMN IF NOT EXISTS live_session_notes TEXT;

-- ============================================
-- STEP 3: Add AI evaluation + plagiarism fields to submissions
-- ============================================

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ADD COLUMN IF NOT EXISTS ai_feedback TEXT,
  ADD COLUMN IF NOT EXISTS plagiarism_score INTEGER DEFAULT 0 CHECK (plagiarism_score >= 0 AND plagiarism_score <= 100),
  ADD COLUMN IF NOT EXISTS plagiarism_status VARCHAR(20) DEFAULT 'pending' CHECK (plagiarism_status IN ('pending', 'clean', 'suspicious', 'flagged'));

-- ============================================
-- STEP 4: RLS for course_materials
-- ============================================

ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

-- Trainers can manage their own materials
CREATE POLICY "Trainers can manage their own materials"
  ON course_materials
  FOR ALL
  USING (auth.uid() = trainer_id);

-- Students can view materials for offerings they are enrolled in
CREATE POLICY "Students can view materials for enrolled offerings"
  ON course_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.offering_id = course_materials.offering_id
        AND enrollments.student_id = auth.uid()
    )
  );

-- ============================================
-- STEP 5: Trigger for updated_at on course_materials
-- ============================================

CREATE OR REPLACE FUNCTION update_course_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_materials_updated_at
  BEFORE UPDATE ON course_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_course_materials_updated_at();
