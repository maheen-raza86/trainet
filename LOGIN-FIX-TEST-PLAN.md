# Login Fix - Test Plan

## Overview
This document provides step-by-step instructions to test the login bug fix.

---

## Prerequisites

1. **Backend running**: `cd backend && npm run dev` (port 5000)
2. **Frontend running**: `cd frontend && npm run dev` (port 3000)
3. **Supabase configured**: Check `.env` has valid Supabase credentials
4. **Database migrated**: Ensure all migrations are applied

---

## Test Case 1: New Student Signup and Login

### Steps:

1. **Navigate to Signup Page**
   ```
   http://localhost:3000/signup
   ```

2. **Fill in Signup Form**
   - Email: `teststudent@example.com`
   - Password: `password123`
   - First Name: `Test`
   - Last Name: `Student`
   - Role: `student`
   - Click "Sign Up"

3. **Expected Result**
   - Success message displayed
   - Redirected to email verification page
   - Check email inbox for Supabase verification email

4. **Verify Email**
   - Open verification email
   - Click verification link
   - Should redirect to login page

5. **Login**
   - Navigate to: `http://localhost:3000/login`
   - Email: `teststudent@example.com`
   - Password: `password123`
   - Click "Login"

6. **Expected Result** ✅
   - Login succeeds (no 401 error)
   - Redirected to: `http://localhost:3000/student/dashboard`
   - Dashboard displays with student data
   - Sidebar shows student navigation

7. **Verify Database**
   ```sql
   SELECT id, email, email_verified, verified_at, role 
   FROM profiles 
   WHERE email = 'teststudent@example.com';
   ```
   - `email_verified` should be `true`
   - `verified_at` should have a timestamp
   - `role` should be `student`

---

## Test Case 2: Existing User with Unsynced Verification

### Setup:
This tests users who verified their email in Supabase Auth but have `email_verified = false` in the profiles table.

### Steps:

1. **Manually Create Test User** (if needed)
   ```sql
   -- Check if user exists with unsynced verification
   SELECT id, email, email_verified 
   FROM profiles 
   WHERE email_verified = false;
   ```

2. **Login with Existing User**
   - Navigate to: `http://localhost:3000/login`
   - Use credentials of a user with verified email in Supabase but not in profiles
   - Click "Login"

3. **Expected Result** ✅
   - First login: Syncs verification status automatically
   - Login succeeds
   - Redirected to appropriate dashboard based on role
   - Subsequent logins work without sync (already synced)

---

## Test Case 3: Unverified Email Login Attempt

### Steps:

1. **Create New User**
   - Signup with: `unverified@example.com`
   - Do NOT click verification link

2. **Attempt Login**
   - Navigate to: `http://localhost:3000/login`
   - Email: `unverified@example.com`
   - Password: (password used during signup)
   - Click "Login"

3. **Expected Result** ✅
   - Login fails with 401
   - Error message: "Please verify your email before logging in"
   - User remains on login page

---

## Test Case 4: Multiple Role Redirects

### Test Student Role:
1. Login as student
2. Expected redirect: `/student/dashboard` ✅

### Test Trainer Role:
1. Signup/Login as trainer
2. Expected redirect: `/trainer/dashboard`
3. **Note**: This will show 404 because trainer dashboard is not implemented yet
4. This is expected behavior (not a bug)

### Test Other Roles:
- Alumni → `/alumni/dashboard` (404 expected)
- Recruiter → `/recruiter/dashboard` (404 expected)

---

## Test Case 5: Invalid Credentials

### Steps:

1. **Login with Wrong Password**
   - Email: `teststudent@example.com`
   - Password: `wrongpassword`
   - Click "Login"

2. **Expected Result** ✅
   - Login fails with 401
   - Error message: "Invalid email or password"
   - User remains on login page

3. **Login with Non-existent Email**
   - Email: `nonexistent@example.com`
   - Password: `password123`
   - Click "Login"

4. **Expected Result** ✅
   - Login fails with 401
   - Error message: "Invalid email or password"

---

## Test Case 6: Session Persistence

### Steps:

1. **Login Successfully**
   - Login as student
   - Verify redirect to dashboard

2. **Refresh Page**
   - Press F5 or refresh browser
   - Expected: User remains logged in, dashboard still displays

3. **Navigate to Different Pages**
   - Click "My Courses" in sidebar
   - Click "Assignments" in sidebar
   - Click "Profile" in sidebar
   - Expected: All pages load correctly, user remains authenticated

4. **Logout**
   - Click "Logout" in sidebar
   - Expected: Redirected to login page
   - Token and user data cleared from localStorage

5. **Try to Access Dashboard After Logout**
   - Navigate to: `http://localhost:3000/student/dashboard`
   - Expected: Redirected to login page (protected route)

---

## Backend Logs to Monitor

### During Successful Login:
```
[INFO] User logged in successfully: teststudent@example.com
```

### During Email Verification Sync:
```
[INFO] Syncing email verification status for user: teststudent@example.com
```

### During Failed Login (Unverified):
```
[WARN] Login attempt with unverified email: unverified@example.com
```

### During Failed Login (Invalid Credentials):
```
[WARN] Failed login attempt for email: teststudent@example.com
```

---

## Browser Console Checks

### Successful Login:
- No errors in console
- Network tab shows:
  - `POST /api/auth/login` → 200 OK
  - Response contains `accessToken` and `user` object

### Failed Login:
- Network tab shows:
  - `POST /api/auth/login` → 401 Unauthorized
  - Error message in response body

### After Login:
- localStorage contains:
  - `token`: JWT access token
  - `user`: JSON object with user data

---

## API Testing with cURL

### Test Login Endpoint Directly:

```bash
# Successful login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststudent@example.com",
    "password": "password123"
  }'

# Expected response (200 OK):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "teststudent@example.com",
      "firstName": "Test",
      "lastName": "Student",
      "role": "student"
    }
  }
}
```

```bash
# Failed login (unverified email)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified@example.com",
    "password": "password123"
  }'

# Expected response (401 Unauthorized):
{
  "success": false,
  "message": "Please verify your email before logging in",
  "error": "Unauthorized"
}
```

---

## Rollback Plan (If Issues Occur)

If the fix causes any issues, revert the changes:

```bash
cd backend/src/services
git checkout HEAD -- authService.js
```

Or manually restore the old code:
- Remove the email verification sync logic (Steps 3-4)
- Keep only the original email_verified check

---

## Success Criteria

✅ All test cases pass
✅ No 401 errors for verified users
✅ Unverified users still blocked (security maintained)
✅ Correct role-based redirects
✅ No breaking changes to existing functionality
✅ Backend logs show sync operations
✅ Database shows email_verified = true after first login

---

## Known Limitations

1. **Trainer/Alumni/Recruiter Dashboards**: Not implemented yet, will show 404
2. **Password Reset**: Not implemented yet
3. **Refresh Token**: Not actively used in current implementation
4. **Email Resend**: Not implemented yet

These are not bugs, just features not yet implemented.
