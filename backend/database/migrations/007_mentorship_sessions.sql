-- Migration: Mentorship Sessions
-- Date: 2026-04-12

-- ============================================
-- Guidance Requests
-- ============================================
CREATE TABLE IF NOT EXISTS guidance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alumni_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_duration TEXT,
  preferred_schedule TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guidance_requests_student_id ON guidance_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_guidance_requests_alumni_id ON guidance_requests(alumni_id);
CREATE INDEX IF NOT EXISTS idx_guidance_requests_status ON guidance_requests(status);

-- ============================================
-- Mentorship Sessions
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guidance_request_id UUID NOT NULL REFERENCES guidance_requests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alumni_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_text TEXT,
  meeting_link TEXT NOT NULL,
  schedule_text TEXT,
  session_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  allow_group_session BOOLEAN NOT NULL DEFAULT false,
  max_students INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_guidance_request_id ON mentorship_sessions(guidance_request_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_student_id ON mentorship_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_alumni_id ON mentorship_sessions(alumni_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_status ON mentorship_sessions(status);

-- ============================================
-- Mentorship Materials
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_session_id UUID NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  type TEXT CHECK (type IN ('pdf', 'slides', 'image', 'document', 'link')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_materials_session_id ON mentorship_materials(mentorship_session_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_materials_uploaded_by ON mentorship_materials(uploaded_by);

-- ============================================
-- Mentorship Feedback
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_session_id UUID NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (mentorship_session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_mentorship_feedback_session_id ON mentorship_feedback(mentorship_session_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_feedback_student_id ON mentorship_feedback(student_id);

-- ============================================
-- updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_guidance_requests
  BEFORE UPDATE ON guidance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_mentorship_sessions
  BEFORE UPDATE ON mentorship_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
