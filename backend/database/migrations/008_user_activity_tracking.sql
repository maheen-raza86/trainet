-- Migration: User Activity Tracking + Certificate Revoke Reason
-- Date: 2026-04-08

-- ============================================
-- STEP 1: Add last_login_at and last_activity_at to profiles
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity_at ON profiles(last_activity_at DESC);

-- ============================================
-- STEP 2: Add revoke_reason to certificates
-- ============================================

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS revoke_reason TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN certificates.revoke_reason IS 'Admin-provided reason for certificate revocation';
COMMENT ON COLUMN certificates.revoked_at IS 'Timestamp when certificate was revoked';
