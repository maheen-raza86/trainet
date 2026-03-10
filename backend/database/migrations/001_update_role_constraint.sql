-- Migration: Update role constraint to use 'trainer' instead of 'instructor'
-- Date: 2024
-- Description: Standardize role system to use student, trainer, admin

-- Step 1: Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add new constraint with correct roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'trainer', 'admin'));

-- Step 3: Update any existing 'instructor' roles to 'trainer' (if any exist)
UPDATE profiles SET role = 'trainer' WHERE role = 'instructor';

-- Verify the changes
-- SELECT role, COUNT(*) FROM profiles GROUP BY role;
