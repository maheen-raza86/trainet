# Email Verification Flow - Visual Guide

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Step 1: User Signs Up
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}

Backend Actions:
├─ Create auth user in Supabase
├─ Generate verification token: crypto.randomBytes(32).toString('hex')
├─ Create profile with:
│  ├─ verification_token: "f7797d83516a9a6fff..."
│  └─ email_verified: false
└─ Send verification email

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      ...
    }
  }
}


Step 2: User Receives Email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────────────────────────────────────┐
│  Subject: Verify your TRAINET account                  │
│                                                         │
│  Welcome to TRAINET!                                   │
│                                                         │
│  Please verify your email address to activate          │
│  your account.                                         │
│                                                         │
│  ┌──────────────────────────────────────┐             │
│  │   [Verify Email Address]             │             │
│  └──────────────────────────────────────┘             │
│                                                         │
│  Or copy this link:                                    │
│  http://localhost:5173/verify-email?token=f7797d...    │
└────────────────────────────────────────────────────────┘


Step 3: User Tries to Login (BEFORE VERIFICATION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Backend Actions:
├─ Authenticate credentials ✅
├─ Fetch user profile ✅
├─ Check email_verified: false ❌
└─ Reject login

Response: 401 Unauthorized
{
  "success": false,
  "message": "Please verify your email before logging in"
}


Step 4: User Clicks Verification Link
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/auth/verify-email
{
  "token": "f7797d83516a9a6fff3e15fc9a15fe2127e301cd9652235fa7d109ba65c7170a"
}

Backend Actions:
├─ Find user by verification_token
├─ Validate token exists and matches
├─ Update profile:
│  ├─ email_verified: true
│  ├─ verification_token: null
│  └─ verified_at: "2026-03-08T12:00:00Z"
└─ Return success

Response: 200 OK
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email": "user@example.com"
  }
}


Step 5: User Logs In (AFTER VERIFICATION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Backend Actions:
├─ Authenticate credentials ✅
├─ Fetch user profile ✅
├─ Check email_verified: true ✅
└─ Generate JWT token ✅

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresIn": 604800,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}

✅ USER CAN NOW ACCESS THE SYSTEM
```

---

## Database State Changes

### After Signup
```sql
SELECT id, email, email_verified, verification_token, verified_at 
FROM profiles 
WHERE email = 'user@example.com';

┌──────┬──────────────────┬────────────────┬──────────────────┬─────────────┐
│ id   │ email            │ email_verified │ verification_... │ verified_at │
├──────┼──────────────────┼────────────────┼──────────────────┼─────────────┤
│ uuid │ user@example.com │ false          │ f7797d83516a9... │ NULL        │
└──────┴──────────────────┴────────────────┴──────────────────┴─────────────┘
```

### After Verification
```sql
SELECT id, email, email_verified, verification_token, verified_at 
FROM profiles 
WHERE email = 'user@example.com';

┌──────┬──────────────────┬────────────────┬──────────────────┬─────────────────────┐
│ id   │ email            │ email_verified │ verification_... │ verified_at         │
├──────┼──────────────────┼────────────────┼──────────────────┼─────────────────────┤
│ uuid │ user@example.com │ true           │ NULL             │ 2026-03-08 12:00:00 │
└──────┴──────────────────┴────────────────┴──────────────────┴─────────────────────┘
```

---

## Code Changes Summary

### authService.js - signUp()
```javascript
// ADDED: Import crypto
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/emailService.js';

// ADDED: Generate token
const verificationToken = crypto.randomBytes(32).toString('hex');

// MODIFIED: Profile insert
{
  id: authData.user.id,
  email,
  first_name: firstName,
  last_name: lastName,
  role,
  verification_token: verificationToken,  // ADDED
  email_verified: false,                  // ADDED
}

// ADDED: Send email
await sendVerificationEmail(email, verificationToken);
```

### authService.js - signIn()
```javascript
// ADDED: Email verification check
if (!profileData.email_verified) {
  logger.warn(`Login attempt with unverified email: ${email}`);
  throw new UnauthorizedError('Please verify your email before logging in');
}
```

### emailService.js (NEW FILE)
```javascript
// Complete email service with Nodemailer
export const sendVerificationEmail = async (email, token) => {
  // Environment-specific email handling
  // Test: Log only
  // Dev: Ethereal.email
  // Prod: SMTP
};
```

---

## Testing

### Test Coverage
```
✅ 29 tests passing
├─ 6 tests: User Registration
├─ 5 tests: User Login (NEW: unverified rejection)
├─ 3 tests: Get Current User
├─ 6 tests: Profile Update
├─ 4 tests: Email Verification
└─ 5 tests: QR Enrollment
```

### Run Tests
```bash
npm test
```

### Test Output
```
PASS  tests/user-management.test.js (30.649 s)
  ✓ should reject login if email is not verified (2026 ms)

Test Suites: 1 passed
Tests:       29 passed
Time:        30.649 s
```

---

## Environment-Specific Behavior

### Test Environment
```
NODE_ENV=test

Behavior:
├─ Emails logged to console
├─ No actual emails sent
├─ Verification URLs in logs
└─ Tests run without external dependencies
```

### Development Environment
```
NODE_ENV=development

Behavior:
├─ Uses Ethereal.email (auto-configured)
├─ Preview URLs in logs
├─ No SMTP configuration needed
└─ Perfect for local testing
```

### Production Environment
```
NODE_ENV=production

Behavior:
├─ Uses configured SMTP server
├─ Sends real emails
├─ Requires SMTP credentials
└─ Falls back to logging if not configured
```

---

## API Endpoints

### Authentication Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | ❌ | Register user + send verification email |
| POST | /api/auth/verify-email | ❌ | Verify email with token |
| POST | /api/auth/login | ❌ | Login (requires verified email) |

### Error Responses
| Status | Message | Cause |
|--------|---------|-------|
| 401 | "Please verify your email before logging in" | Email not verified |
| 400 | "Invalid or expired verification token" | Token invalid/used |
| 400 | "Email already verified" | Duplicate verification |

---

## Verification Checklist

### Implementation ✅
- [x] Token generation during signup
- [x] Token storage in database
- [x] Email service created
- [x] Verification email sent
- [x] Verification endpoint works
- [x] Login checks email_verified
- [x] Error message for unverified users

### Testing ✅
- [x] All 29 tests passing
- [x] Unverified login rejection tested
- [x] Email verification flow tested
- [x] Test environment configured
- [x] No breaking changes

### Documentation ✅
- [x] API documentation updated
- [x] Implementation guide created
- [x] Quick reference created
- [x] Test documentation updated
- [x] Flow diagrams created

---

## Success Criteria

✅ **All SRD Requirements Met**
✅ **All Tests Passing**
✅ **No Breaking Changes**
✅ **Production Ready**

---

**Version:** 1.7.0
**Date:** March 8, 2026
**Status:** COMPLETE AND TESTED
