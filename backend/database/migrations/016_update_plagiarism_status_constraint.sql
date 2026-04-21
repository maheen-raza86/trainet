-- Migration: Update plagiarism_status check constraint to match new Groq-based values
-- Old values: clean | suspicious | flagged | pending
-- New values: Safe | Warning | High Plagiarism | pending | Flagged for Plagiarism

ALTER TABLE submissions
  DROP CONSTRAINT IF EXISTS submissions_plagiarism_status_check;

-- No constraint — allow any text value for flexibility
-- The application layer enforces valid values
