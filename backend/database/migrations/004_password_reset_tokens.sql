-- Migration: Password Reset Tokens
-- Date: 2024-04-06
-- Description: Add password reset token functionality to profiles table

-- ============================================
-- Password Reset Token Support
-- ============================================

-- Add password reset token columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Create index on reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token 
ON profiles(reset_token) 
WHERE reset_token IS NOT NULL;

-- Create index on reset_token_expires for cleanup queries
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token_expires 
ON profiles(reset_token_expires) 
WHERE reset_token_expires IS NOT NULL;

-- ============================================
-- Verification
-- ============================================

-- Verify the changes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name IN ('reset_token', 'reset_token_expires')
-- ORDER BY ordinal_position;