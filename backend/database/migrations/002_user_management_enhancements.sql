-- Migration: User Management Enhancements (FR-UM-4, FR-UM-5, FR-UM-6)
-- Date: 2024
-- Description: Add email verification, QR enrollment tokens, and profile fields

-- ============================================
-- FR-UM-4: Email Verification
-- ============================================

-- Add email verification columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create index on verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token 
ON profiles(verification_token) 
WHERE verification_token IS NOT NULL;

-- ============================================
-- FR-UM-5: QR-Based Enrollment Support
-- ============================================

-- Create enrollment_qr_tokens table
CREATE TABLE IF NOT EXISTS enrollment_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_enrollment_qr_tokens_token 
ON enrollment_qr_tokens(token);

-- Create index on course_id
CREATE INDEX IF NOT EXISTS idx_enrollment_qr_tokens_course_id 
ON enrollment_qr_tokens(course_id);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_enrollment_qr_tokens_expires_at 
ON enrollment_qr_tokens(expires_at);

-- ============================================
-- FR-UM-6: Profile Update Fields
-- ============================================

-- Add bio and avatar_url columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add constraint for bio length
ALTER TABLE profiles 
ADD CONSTRAINT profiles_bio_length_check 
CHECK (LENGTH(bio) <= 500);

-- ============================================
-- Update Role Constraint for SRD Roles
-- ============================================

-- Drop existing role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with all SRD roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'trainer', 'alumni', 'recruiter', 'admin'));

-- ============================================
-- Verification and Cleanup
-- ============================================

-- Verify the changes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- SELECT * FROM information_schema.tables WHERE table_name = 'enrollment_qr_tokens';

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Uncomment to create a sample QR token for testing
-- INSERT INTO enrollment_qr_tokens (course_id, token, expires_at)
-- SELECT 
--   id, 
--   'TEST-QR-' || gen_random_uuid()::text,
--   NOW() + INTERVAL '7 days'
-- FROM courses 
-- LIMIT 1;
