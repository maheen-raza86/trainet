-- Migration: Work & Practice Module
-- SRDS FR-WP-1 through FR-WP-4
-- Date: 2026-04-09

-- ============================================
-- work_practice_tasks table
-- ============================================

CREATE TABLE IF NOT EXISTS work_practice_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 3),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  instructions TEXT,
  resource_url TEXT,
  task_type VARCHAR(20) NOT NULL DEFAULT 'project' CHECK (task_type IN ('project', 'coding', 'quiz', 'other')),
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wp_tasks_trainer_id ON work_practice_tasks(trainer_id);
CREATE INDEX IF NOT EXISTS idx_wp_tasks_offering_id ON work_practice_tasks(offering_id);
CREATE INDEX IF NOT EXISTS idx_wp_tasks_status ON work_practice_tasks(status);

COMMENT ON TABLE work_practice_tasks IS 'Work & Practice tasks posted by trainers (SRDS FR-WP-1)';

-- ============================================
-- work_practice_submissions table
-- ============================================

CREATE TABLE IF NOT EXISTS work_practice_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES work_practice_tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'flagged', 'pending')),
  grade INTEGER CHECK (grade >= 0 AND grade <= 100),
  feedback TEXT,
  -- AI-ready fields (FR-WP-3)
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_feedback TEXT,
  plagiarism_score INTEGER DEFAULT 0 CHECK (plagiarism_score >= 0 AND plagiarism_score <= 100),
  plagiarism_status VARCHAR(20) DEFAULT 'pending' CHECK (plagiarism_status IN ('pending', 'clean', 'suspicious', 'flagged')),
  graded_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- One submission per student per task
  UNIQUE (task_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_wp_submissions_task_id ON work_practice_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_wp_submissions_student_id ON work_practice_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_wp_submissions_status ON work_practice_submissions(status);

COMMENT ON TABLE work_practice_submissions IS 'Student submissions for Work & Practice tasks (SRDS FR-WP-2, FR-WP-3, FR-WP-4)';

-- ============================================
-- RLS policies
-- ============================================

ALTER TABLE work_practice_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_practice_submissions ENABLE ROW LEVEL SECURITY;

-- Trainers manage their own tasks
CREATE POLICY "Trainers manage own tasks"
  ON work_practice_tasks FOR ALL
  USING (auth.uid() = trainer_id);

-- Students can view published tasks for their enrolled offerings
CREATE POLICY "Students view published tasks"
  ON work_practice_tasks FOR SELECT
  USING (
    status = 'published' AND (
      offering_id IS NULL OR
      EXISTS (
        SELECT 1 FROM enrollments
        WHERE enrollments.offering_id = work_practice_tasks.offering_id
          AND enrollments.student_id = auth.uid()
      )
    )
  );

-- Students manage their own submissions
CREATE POLICY "Students manage own submissions"
  ON work_practice_submissions FOR ALL
  USING (auth.uid() = student_id);

-- Trainers view submissions for their tasks
CREATE POLICY "Trainers view task submissions"
  ON work_practice_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_practice_tasks
      WHERE work_practice_tasks.id = work_practice_submissions.task_id
        AND work_practice_tasks.trainer_id = auth.uid()
    )
  );
