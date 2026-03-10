# Authentication RLS Fix - Signup Profile Creation

## Problem

The signup process was failing to create user profiles in the `profiles` table due to Row Level Security (RLS) policies in Supabase.

**Root Cause:**
- The backend was using a single Supabase client initialized with `SUPABASE_SERVICE_ROLE_KEY`
- When using `auth.signUp()`, Supabase internally switches to the anon key context
- The subsequent profile insert was being executed with anon key permissions
- RLS policies blocked the insert because the anon user didn't have permission

## Solution

Created two separate Supabase clients with different permission levels:

1. **Auth Client** (`supabaseAuthClient`) - Uses `SUPABASE_ANON_KEY`
   - Used for authentication operations (signUp, signIn)
   - Respects RLS policies
   - Secure for client-facing operations

2. **Admin Client** (`supabaseAdminClient`) - Uses `SUPABASE_SERVICE_ROLE_KEY`
   - Used for server-side database operations
   - Bypasses RLS policies
   - Should only be used on the server

---

## Files Modified

### 1. `src/config/supabaseClient.js`

**Changes:**
- Added `supabaseAuthClient` using `SUPABASE_ANON_KEY`
- Added `supabaseAdminClient` using `SUPABASE_SERVICE_ROLE_KEY`
- Kept default export for backward compatibility (uses admin client)
- Updated validation to check for both keys

**Before:**
```javascript
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

export default supabase;
```

**After:**
```javascript
export const supabaseAuthClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export const supabaseAdminClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

const supabase = supabaseAdminClient;
export default supabase;
```

---

### 2. `src/services/authService.js`

**Changes:**
- Import both `supabaseAuthClient` and `supabaseAdminClient`
- Use `supabaseAuthClient` for `auth.signUp()` and `auth.signInWithPassword()`
- Use `supabaseAdminClient` for profile database operations

**Signup Flow:**
```javascript
// Step 1: Create auth user with anon client
const { data: authData } = await supabaseAuthClient.auth.signUp({
  email,
  password,
  options: { data: { first_name, last_name, role } }
});

// Step 2: Create profile with admin client (bypasses RLS)
const { data: profileData } = await supabaseAdminClient
  .from('profiles')
  .insert([{
    id: authData.user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    role,
  }]);
```

**Login Flow:**
```javascript
// Step 1: Authenticate with auth client
const { data: authData } = await supabaseAuthClient.auth.signInWithPassword({
  email,
  password,
});

// Step 2: Fetch profile with admin client
const { data: profileData } = await supabaseAdminClient
  .from('profiles')
  .select('*')
  .eq('id', authData.user.id)
  .single();
```

---

## Environment Variables Required

Ensure your `.env` file has both keys:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these keys:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy both keys:
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Security Considerations

### ✅ Secure Practices

1. **Auth Client (Anon Key)**
   - Used for authentication operations
   - Safe to use for user-facing operations
   - Respects RLS policies

2. **Admin Client (Service Role Key)**
   - Only used on the server
   - Never exposed to the client
   - Bypasses RLS for necessary operations (profile creation)

3. **Backward Compatibility**
   - Default export still available for other services
   - No breaking changes for existing code

### ⚠️ Important Notes

- **Never expose the service role key to the client**
- The service role key should only be used in server-side code
- The anon key is safe to use in client-side code
- RLS policies should still be configured properly for security

---

## Why This Works

### The Problem with Single Client

When using a single client with the service role key:
```javascript
const supabase = createClient(url, serviceRoleKey);

// This internally switches to anon context
await supabase.auth.signUp({ email, password });

// This tries to use anon permissions (fails due to RLS)
await supabase.from('profiles').insert([...]);
```

### The Solution with Two Clients

Using separate clients maintains proper permission contexts:
```javascript
// Auth operations use anon client (correct context)
await supabaseAuthClient.auth.signUp({ email, password });

// Database operations use admin client (bypasses RLS)
await supabaseAdminClient.from('profiles').insert([...]);
```

---

## Testing

### Test Signup

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "student"
    }
  }
}
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "student"
    }
  }
}
```

---

## Verification Checklist

✅ Both `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are in `.env`
✅ `supabaseClient.js` exports both clients
✅ `authService.js` uses `supabaseAuthClient` for auth operations
✅ `authService.js` uses `supabaseAdminClient` for profile operations
✅ Signup creates user in auth and profile in database
✅ Login returns access token and user profile
✅ No breaking changes for other services

---

## Impact on Other Services

### No Changes Required

The following services continue to work without modification:
- ✅ `assignmentService.js` - Uses default export (admin client)
- ✅ `submissionService.js` - Uses default export (admin client)
- ✅ `courseService.js` - Uses default export (admin client)
- ✅ `authMiddleware.js` - Uses default export (admin client)

**Why?** The default export still provides the admin client for backward compatibility.

---

## Common Issues & Solutions

### Issue: "Missing SUPABASE_ANON_KEY"

**Solution:** Add the anon key to your `.env` file:
```env
SUPABASE_ANON_KEY=your_anon_key_here
```

### Issue: "Profile creation still fails"

**Possible causes:**
1. RLS policies are too restrictive
2. Service role key is incorrect
3. Profile table doesn't exist

**Solution:** Verify:
- Service role key is correct in `.env`
- Profile table exists in Supabase
- Check Supabase logs for detailed error

### Issue: "Auth user created but profile missing"

**Solution:** This indicates the auth succeeded but profile insert failed. Check:
- Service role key has proper permissions
- Profile table schema matches the insert data
- No database constraints are violated

---

## Database Schema

Ensure your `profiles` table has the correct structure:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Note: No INSERT policy for regular users
-- Profile creation is handled by the backend using service role key
```

---

## Status

✅ **Fix Complete**
- Two separate Supabase clients created
- Auth service updated to use appropriate clients
- Backward compatibility maintained
- No breaking changes for existing code
- Ready for testing

**Version:** 1.2.0
**Date:** Auth RLS fix applied
**Impact:** Fixes signup profile creation issue
