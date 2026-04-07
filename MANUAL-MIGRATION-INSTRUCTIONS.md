# Manual Database Migration Required

## Password Reset Feature Setup

The password reset functionality requires two additional columns in the `profiles` table. Please run the following SQL commands in your Supabase SQL Editor:

### Step 1: Add Reset Token Columns

```sql
-- Add password reset token columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;
```

### Step 2: Add Indexes for Performance

```sql
-- Create index on reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token 
ON profiles(reset_token) 
WHERE reset_token IS NOT NULL;

-- Create index on reset_token_expires for cleanup queries
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token_expires 
ON profiles(reset_token_expires) 
WHERE reset_token_expires IS NOT NULL;
```

### Step 3: Verify Migration

```sql
-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('reset_token', 'reset_token_expires')
ORDER BY ordinal_position;
```

## How to Apply

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL commands above
5. Click **Run** or press `Ctrl+Enter`

## After Migration

Once the migration is complete, the password reset feature will be fully functional:

- Users can click "Forgot password?" on the login page
- They'll receive a secure reset link (logged to console in development)
- Reset links expire after 15 minutes for security
- Users can set a new password using the reset link

## Security Features

- Reset tokens are cryptographically secure (32 random bytes)
- Tokens are hashed before storage using SHA-256
- Tokens expire after 15 minutes
- Used tokens are immediately invalidated
- No information is revealed about whether an email exists in the system

## Development Testing

In development mode, password reset emails are logged to the console instead of being sent via email. Look for the "PASSWORD RESET EMAIL (DEVELOPMENT)" section in your backend logs.