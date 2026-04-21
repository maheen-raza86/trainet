-- Migration: Add interests and visibility_in_talent_pool to profiles
-- Date: 2026-04-19

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS interests TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS visibility_in_talent_pool BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.interests IS 'Comma-separated list of student interests';
COMMENT ON COLUMN profiles.visibility_in_talent_pool IS 'When true, student appears in recruiter Talent Pool';
