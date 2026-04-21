-- Migration: Attendance Records
-- Date: 2026-04-18
-- Adds attendance tracking per session per student

CREATE TABLE IF NOT EXISTS attendance_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id   UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_date  DATE NOT NULL,
  status        VARCHAR(10) NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent')),
  marked_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (offering_id, student_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_offering_id  ON attendance_records(offering_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id   ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_date ON attendance_records(session_date);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();
