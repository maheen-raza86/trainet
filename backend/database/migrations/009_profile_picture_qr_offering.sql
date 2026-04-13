-- Migration: Profile Picture + QR Offering Support
-- Date: 2026-04-08

-- ============================================
-- STEP 1: Add profile_picture_url to profiles
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to user profile picture (uploaded or external)';

-- ============================================
-- STEP 2: Extend enrollment_qr_tokens to support offering_id
-- ============================================

-- Add offering_id column (nullable for backward compat with course_id)
ALTER TABLE enrollment_qr_tokens
  ADD COLUMN IF NOT EXISTS offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_single_use BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_enrollment_qr_tokens_offering_id
  ON enrollment_qr_tokens(offering_id)
  WHERE offering_id IS NOT NULL;

COMMENT ON COLUMN enrollment_qr_tokens.offering_id IS 'Course offering to enroll into (preferred over course_id)';
COMMENT ON COLUMN enrollment_qr_tokens.used_at IS 'When the token was used (for single-use tokens)';
COMMENT ON COLUMN enrollment_qr_tokens.is_single_use IS 'If true, token can only be used once';
