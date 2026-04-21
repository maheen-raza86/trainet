-- Migration: Learning Hub Schedule Extension
-- Date: 2026-04-18
-- Adds weekly schedule, session times, completed status, and drop course support

-- ── 1. Add schedule fields to course_offerings ────────────────────────────────
ALTER TABLE course_offerings
  ADD COLUMN IF NOT EXISTS weekly_days       TEXT[],          -- e.g. ['Monday','Thursday']
  ADD COLUMN IF NOT EXISTS session_start_time TEXT,           -- e.g. '19:00'
  ADD COLUMN IF NOT EXISTS session_end_time   TEXT,           -- e.g. '20:00'
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;

-- ── 2. Extend course_offerings.status to include 'completed' ─────────────────
-- Drop old constraint and add updated one
ALTER TABLE course_offerings
  DROP CONSTRAINT IF EXISTS course_offerings_status_check;

ALTER TABLE course_offerings
  ADD CONSTRAINT course_offerings_status_check
  CHECK (status IN ('open', 'closed', 'completed'));

-- ── 3. Extend enrollments.status to include 'dropped' ────────────────────────
-- Add status column if it doesn't exist
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'dropped', 'completed'));

-- Index for filtering active enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
