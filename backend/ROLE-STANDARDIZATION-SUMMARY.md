# Role Standardization - Trainer vs Instructor

## Overview

Standardized the role system across the entire TRAINET project to consistently use `trainer` instead of `instructor`.

## Standardized Roles

The system now uses exactly three roles:
1. **student** - Students who enroll in courses and submit assignments
2. **trainer** - Trainers who create courses and assignments
3. **admin** - Administrators with full system access

---

## Changes Made

### 1. Backend Code

#### `src/controllers/authController.js`
Updated role validation in signup endpoint:

**Before:**
```javascript
const validRoles = ['student', 'instructor', 'admin'];
message: 'Invalid role. Must be one of: student, instructor, admin'
```

**After:**
```javascript
const validRoles = ['student', 'trainer', 'admin'];
message: 'Invalid role. Must be one of: student, trainer, admin'
```

---

### 2. Database Migration

#### `database/migrations/001_update_role_constraint.sql`
Created SQL migration to update the database constraint:

```sql
-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with correct roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'trainer', 'admin'));

-- Update any existing 'instructor' roles to 'trainer'
UPDATE profiles SET role = 'trainer' WHERE role = 'instructor';
```

**How to apply:**
```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f database/migrations/001_update_role_constraint.sql

# Or run directly in Supabase SQL Editor
```

---

### 3. Documentation Updates

Updated all documentation files to use `trainer`:

#### `SETUP.md`
```sql
role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'trainer', 'admin'))
```

#### `PHASE2-SUMMARY.md`
- Role validation: `(student, trainer, admin)`
- Database schema: `CHECK (role IN ('student', 'trainer', 'admin'))`
- Phase 4 description: "Trainer-only course creation"

#### `PHASE3-SUMMARY.md`
- Example code: `authorizeRoles('trainer', 'admin')`
- Comments: "Only trainers can create courses"
- Route examples: `authorizeRoles('trainer', 'admin')`

#### `PHASE3-TESTING.md`
- Example routes: `authorizeRoles('trainer', 'admin')`
- Dashboard example: `authorizeRoles('student', 'trainer')`
- Phase 4 suggestions: "Trainer-only course creation"

---

## API Changes

### Signup Endpoint

**Request:**
```json
POST /api/auth/signup
{
  "email": "trainer@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "trainer"
}
```

**Valid Roles:**
- `student` ✅
- `trainer` ✅
- `admin` ✅
- `instructor` ❌ (no longer valid)

**Error Response (if invalid role):**
```json
{
  "success": false,
  "message": "Invalid role. Must be one of: student, trainer, admin",
  "error": "Validation Error"
}
```

---

## Database Schema

### profiles table

```sql
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
```

**Constraint:**
```sql
CHECK (role IN ('student', 'trainer', 'admin'))
```

---

## Testing

### Test Signup with Trainer Role

```bash
# Signup as trainer
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "trainer"
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
      "email": "trainer@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "trainer"
    }
  }
}
```

### Test Invalid Role

```bash
# Try to signup with 'instructor' (should fail)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "instructor"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid role. Must be one of: student, trainer, admin",
  "error": "Validation Error"
}
```

---

## Migration Steps

### For Existing Databases

If you have an existing database with `instructor` roles:

1. **Backup your database first!**

2. **Run the migration:**
   ```sql
   -- In Supabase SQL Editor or psql
   
   -- Drop old constraint
   ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
   
   -- Add new constraint
   ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
     CHECK (role IN ('student', 'trainer', 'admin'));
   
   -- Update existing data
   UPDATE profiles SET role = 'trainer' WHERE role = 'instructor';
   ```

3. **Verify the changes:**
   ```sql
   -- Check all roles in the database
   SELECT role, COUNT(*) FROM profiles GROUP BY role;
   
   -- Should only show: student, trainer, admin
   ```

4. **Test the API:**
   - Try creating a new trainer account
   - Try creating an account with 'instructor' (should fail)
   - Verify existing trainer accounts still work

---

## Role Authorization Examples

### Trainer-Only Routes

```javascript
// Create assignment (trainer only)
router.post(
  '/assignments',
  verifyToken,
  authorizeRoles('trainer'),
  createAssignment
);

// View submissions (trainer only)
router.get(
  '/submissions/assignment/:assignmentId',
  verifyToken,
  authorizeRoles('trainer'),
  getSubmissionsByAssignment
);
```

### Student-Only Routes

```javascript
// Submit assignment (student only)
router.post(
  '/submissions',
  verifyToken,
  authorizeRoles('student'),
  submitAssignment
);
```

### Multiple Roles

```javascript
// Enroll in course (student or trainer)
router.post(
  '/courses/enroll',
  verifyToken,
  authorizeRoles('student', 'trainer'),
  enrollInCourse
);

// Admin-only route
router.delete(
  '/users/:id',
  verifyToken,
  authorizeRoles('admin'),
  deleteUser
);
```

---

## Verification Checklist

✅ Backend code uses `trainer` instead of `instructor`
✅ Database constraint updated to accept `trainer`
✅ Documentation updated across all files
✅ API validation accepts `trainer` role
✅ Error messages reference `trainer`
✅ Migration script created
✅ No occurrences of `instructor` in backend code

---

## Files Modified

### Backend Code
- ✅ `src/controllers/authController.js`

### Documentation
- ✅ `SETUP.md`
- ✅ `PHASE2-SUMMARY.md`
- ✅ `PHASE3-SUMMARY.md`
- ✅ `PHASE3-TESTING.md`

### Database
- ✅ `database/migrations/001_update_role_constraint.sql` (created)

### Summary Documents
- ✅ `ROLE-STANDARDIZATION-SUMMARY.md` (this file)

---

## Breaking Changes

⚠️ **API Breaking Change**: The role `instructor` is no longer valid.

### Impact

**Existing Users:**
- If you have users with role `instructor` in the database, run the migration to update them to `trainer`

**API Clients:**
- Update any signup requests that use `role: "instructor"` to use `role: "trainer"`

**Frontend:**
- Update role selection dropdowns to show "Trainer" instead of "Instructor"
- Update role checks to use `role === 'trainer'`

---

## Common Issues

### Issue: "Invalid role" error when signing up

**Cause:** Using `instructor` instead of `trainer`

**Solution:** Change the role to `trainer`:
```json
{
  "role": "trainer"  // ✅ Correct
  // NOT "instructor" ❌
}
```

### Issue: Database constraint violation

**Cause:** Database still has old constraint

**Solution:** Run the migration script:
```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'trainer', 'admin'));
```

### Issue: Existing users can't log in

**Cause:** Users have `instructor` role in database

**Solution:** Update existing records:
```sql
UPDATE profiles SET role = 'trainer' WHERE role = 'instructor';
```

---

## Status

✅ **Standardization Complete**
- All code uses `trainer` consistently
- Database migration script created
- Documentation updated
- No breaking changes in existing functionality
- Ready for deployment

**Version:** 1.3.0
**Date:** Role standardization applied
**Impact:** Breaking change for `instructor` role (now `trainer`)
