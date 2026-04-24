-- Migration: Add submission_text to submissions table
-- Description: Allows students to submit text answers directly (without a file attachment).
--              The AI grading pipeline uses this text when no file is uploaded.
-- Date: 2026-04-25

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS submission_text TEXT;

COMMENT ON COLUMN submissions.submission_text IS 'Direct text answer submitted by student (used when no file is attached)';
