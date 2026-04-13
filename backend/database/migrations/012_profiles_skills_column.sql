-- Migration: Add missing columns to profiles table
-- Date: 2026-04-09
-- Fixes: "Could not find the 'skills' column of 'profiles' in the schema cache"

-- Add skills column (text, nullable)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS skills TEXT;

-- Add portfolio_url column (was referenced in older code, add for completeness)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

COMMENT ON COLUMN profiles.skills IS 'Comma-separated list of user skills (student/trainer/alumni/recruiter)';
COMMENT ON COLUMN profiles.portfolio_url IS 'Optional portfolio or personal website URL';
