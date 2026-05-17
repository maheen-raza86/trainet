-- Migration: Add start_time to assignments table
-- Description: Enables assignment visibility scheduling.
--              Assignments are hidden from students before start_time.
--              Submissions are blocked after due_date.
-- Date: 2026-05-17

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN assignments.start_time IS
  'When set, the assignment is hidden from students before this timestamp. NULL means immediately visible.';

-- Index for efficient visibility filtering
CREATE INDEX IF NOT EXISTS idx_assignments_start_time ON assignments(start_time);
