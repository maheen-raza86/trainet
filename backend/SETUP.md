# TRAINET Backend Setup Guide

## Phase 2: Supabase Integration & Authentication

### Prerequisites

Before running the backend, ensure you have:
1. Node.js >= 18.0.0 installed
2. A Supabase project created
3. Database table `profiles` created in Supabase

### Database Setup

You need to create a `profiles` table in your Supabase database. Run this SQL in the Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'trainer', 'admin')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policy to allow service role to insert profiles
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Installation Steps

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment configuration:**
   
   The `.env` file is already configured with your Supabase credentials:
   - SUPABASE_URL: `https://ucuvsakjrybwlhyyrowl.supabase.co`
   - SUPABASE_SERVICE_ROLE_KEY: Already set
   
   You may want to update:
   - `JWT_SECRET` - Change to a secure random string in production
   - `CORS_ORIGIN` - Update if your frontend runs on a different port

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

### Testing the API

#### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

#### 2. Sign Up
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }'
```

#### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

### Implemented Features

✅ Supabase client configuration  
✅ User signup with profile creation  
✅ User login with JWT token  
✅ Rate limiting on auth endpoints  
✅ Input validation  
✅ Error handling  
✅ Transaction-like behavior (rollback on profile creation failure)  

### API Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error type"
}
```

### Troubleshooting

**Issue: "Missing Supabase configuration"**
- Ensure `.env` file exists in the backend directory
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

**Issue: "Failed to create user profile"**
- Ensure the `profiles` table exists in Supabase
- Check that the table schema matches the expected structure
- Verify RLS policies allow service role to insert

**Issue: "User profile not found" during login**
- The user might have been created in auth but not in profiles table
- Check Supabase dashboard for orphaned auth users
- Delete and recreate the user

### Next Steps

Phase 3 will implement:
- Authentication middleware
- Protected routes
- Role-based access control
- Additional user management endpoints

### Security Notes

⚠️ **Important:**
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security
- Never expose this key to the client
- Change `JWT_SECRET` in production
- Use HTTPS in production
- Enable email verification in production
